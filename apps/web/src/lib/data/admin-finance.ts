import "server-only";
import type { Tables } from "@fahrpilot/db";
import { dunningPlan, type DunningPlan } from "@fahrpilot/payments";
import { berlinDate, getOfficeContext, schoolSettings } from "./admin";

export type InvoiceListRow = Pick<Tables<"invoices">, "id" | "invoice_number" | "status" | "issued_at" | "due_at" | "gross_cents" | "paid_cents" | "dunning_level" | "dunning_last_at" | "pdf_path" | "created_at" | "student_id"> & { students: { first_name: string; last_name: string } | null };

export async function getFinanceOverview(filter: { filter?: string; q?: string }) {
  const ctx = await getOfficeContext();
  const settings = schoolSettings(ctx.school.settings);
  const today = berlinDate();
  let q = ctx.db.from("invoices").select("id, invoice_number, status, issued_at, due_at, gross_cents, paid_cents, dunning_level, dunning_last_at, pdf_path, created_at, student_id, students(first_name, last_name)").order("created_at", { ascending: false }).limit(300);
  if (filter.filter === "open") q = q.in("status", ["issued", "partially_paid", "overdue"]);
  else if (filter.filter === "overdue") q = q.in("status", ["issued", "partially_paid", "overdue"]).lt("due_at", today);
  else if (filter.filter === "draft") q = q.eq("status", "draft");
  else if (filter.filter === "paid") q = q.eq("status", "paid");
  const [{ data: invoices }, { data: openAll }, { data: payments }, { data: mandates }] = await Promise.all([
    q,
    ctx.db.from("invoices").select("id, invoice_number, status, due_at, gross_cents, paid_cents, dunning_level, dunning_last_at, student_id, students(first_name, last_name, user_id)").in("status", ["issued", "partially_paid", "overdue"]),
    ctx.db.from("payments").select("id, amount_cents, method, status, paid_at, provider, invoice_id, students(first_name, last_name), invoices(invoice_number)").order("created_at", { ascending: false }).limit(20),
    ctx.db.from("payment_mandates").select("id, status, method, provider, students(first_name, last_name)").order("created_at", { ascending: false }).limit(20),
  ]);
  let rows = (invoices ?? []) as unknown as InvoiceListRow[];
  if (filter.q) { const s = filter.q.toLowerCase(); rows = rows.filter((i) => (i.invoice_number ?? "").toLowerCase().includes(s) || `${i.students?.first_name ?? ""} ${i.students?.last_name ?? ""}`.toLowerCase().includes(s)); }
  type OpenRow = { id: string; invoice_number: string | null; status: string; due_at: string | null; gross_cents: number; paid_cents: number; dunning_level: number; dunning_last_at: string | null; student_id: string; students: { first_name: string; last_name: string; user_id: string | null } | null };
  const open = (openAll ?? []) as unknown as OpenRow[];
  const config = { reminder_days: settings.dunning_reminder_days, fees_cents: settings.dunning_fees_cents };
  const dunning = open.map((i) => ({ invoice: i, plan: dunningPlan({ status: i.status as DunningInvoiceStatus, due_at: i.due_at, dunning_level: i.dunning_level, dunning_last_at: i.dunning_last_at, gross_cents: i.gross_cents, paid_cents: i.paid_cents }, today, config) as DunningPlan }));
  const openCents = open.reduce((s, i) => s + (i.gross_cents - i.paid_cents), 0);
  const overdueCents = open.filter((i) => i.due_at && i.due_at < today).reduce((s, i) => s + (i.gross_cents - i.paid_cents), 0);
  return {
    ctx, settings, today, rows, openCents, overdueCents, openCount: open.length,
    dunningDue: dunning.filter((d) => d.plan.action === "send"),
    dunningWaiting: dunning.filter((d) => d.plan.action === "wait"),
    payments: (payments ?? []) as unknown as Array<{ id: string; amount_cents: number; method: string; status: string; paid_at: string | null; provider: string; invoice_id: string | null; students: { first_name: string; last_name: string } | null; invoices: { invoice_number: string | null } | null }>,
    mandates: (mandates ?? []) as unknown as Array<{ id: string; status: string; method: string; provider: string; students: { first_name: string; last_name: string } | null }>,
    stripeConfigured: Boolean(process.env["STRIPE_SECRET_KEY"]),
  };
}
type DunningInvoiceStatus = "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "cancelled" | "credited";

export type PriceListWithItems = Tables<"price_lists"> & { price_items: Tables<"price_items">[] };

export async function getPriceLists() {
  const ctx = await getOfficeContext();
  const [{ data: lists }, { data: licenses }] = await Promise.all([
    ctx.db.from("price_lists").select("*, price_items(*)").order("valid_from", { ascending: false }),
    ctx.db.from("licenses").select("code").eq("active", true).order("sort_order"),
  ]);
  const rows = ((lists ?? []) as unknown as PriceListWithItems[]).map((l) => ({ ...l, price_items: [...l.price_items].sort((a, b) => a.code.localeCompare(b.code)) }));
  return { ctx, lists: rows, licenses: (licenses ?? []).map((l) => l.code) };
}

/** Grundlagen für einen Rechnungsentwurf: Schüler, Preislisten, abgeschlossene und noch nicht abgerechnete Fahrstunden. */
export async function getInvoiceDraftOptions(studentId: string | undefined) {
  const ctx = await getOfficeContext();
  const { data: students } = await ctx.db.from("students").select("id, first_name, last_name, student_number").in("status", ["registered", "active", "paused", "completed"]).order("last_name").order("first_name").limit(1000);
  const priceLists = (await getPriceLists()).lists.filter((l) => !l.valid_until || l.valid_until >= berlinDate());
  if (!studentId) return { ctx, students: students ?? [], student: null, priceLists, unbilledLessons: [] as UnbilledLesson[], contractPriceListId: null as string | null };
  const [{ data: student }, { data: lessons }, { data: invoices }, { data: contracts }] = await Promise.all([
    ctx.db.from("students").select("id, first_name, last_name").eq("id", studentId).maybeSingle(),
    ctx.db.from("lessons").select("id, period, kind, units, price_cents, instructors(display_name), student_licenses(license_code)").eq("student_id", studentId).in("status", ["completed", "no_show"]).order("period"),
    ctx.db.from("invoices").select("id, status, invoice_items(lesson_id)").eq("student_id", studentId).neq("status", "cancelled"),
    ctx.db.from("contracts").select("price_list_id").eq("student_id", studentId).in("status", ["signed", "active"]).order("created_at", { ascending: false }).limit(1),
  ]);
  const billed = new Set<string>();
  for (const inv of (invoices ?? []) as unknown as Array<{ invoice_items: Array<{ lesson_id: string | null }> }>) for (const it of inv.invoice_items) if (it.lesson_id) billed.add(it.lesson_id);
  const unbilled = ((lessons ?? []) as unknown as UnbilledLesson[]).filter((l) => !billed.has(l.id));
  return { ctx, students: students ?? [], student, priceLists, unbilledLessons: unbilled, contractPriceListId: contracts?.[0]?.price_list_id ?? null };
}
export interface UnbilledLesson { id: string; period: string; kind: string; units: number; price_cents: number | null; instructors: { display_name: string } | null; student_licenses: { license_code: string } | null }

export async function getInvoice(id: string) {
  const ctx = await getOfficeContext();
  const { data: invoice } = await ctx.db.from("invoices").select("*, students(id, first_name, last_name, email, address_line1, postal_code, city, user_id)").eq("id", id).maybeSingle();
  if (!invoice) return null;
  const inv = invoice as unknown as Tables<"invoices"> & { students: { id: string; first_name: string; last_name: string; email: string | null; address_line1: string | null; postal_code: string | null; city: string | null; user_id: string | null } | null };
  const [{ data: items }, { data: payments }, { data: mandates }] = await Promise.all([
    ctx.db.from("invoice_items").select("*, lessons(period, kind)").eq("invoice_id", id).order("position"),
    ctx.db.from("payments").select("*").eq("invoice_id", id).order("created_at", { ascending: false }),
    ctx.db.from("payment_mandates").select("id, status, method, provider, mandate_reference, masked_iban").eq("student_id", inv.student_id).eq("status", "active"),
  ]);
  const settings = schoolSettings(ctx.school.settings);
  const plan = dunningPlan({ status: inv.status, due_at: inv.due_at, dunning_level: inv.dunning_level, dunning_last_at: inv.dunning_last_at, gross_cents: inv.gross_cents, paid_cents: inv.paid_cents }, berlinDate(), { reminder_days: settings.dunning_reminder_days, fees_cents: settings.dunning_fees_cents });
  return { ctx, invoice: inv, items: (items ?? []) as unknown as Array<Tables<"invoice_items"> & { lessons: { period: string; kind: string } | null }>, payments: payments ?? [], mandates: mandates ?? [], settings, plan, stripeConfigured: Boolean(process.env["STRIPE_SECRET_KEY"]) };
}
