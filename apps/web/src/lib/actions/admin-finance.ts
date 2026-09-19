"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Tables, TablesInsert } from "@fahrpilot/db";
import { dunningPlan, formatCents, formatDateDe, renderInvoicePdf, StripeProvider, type InvoicePdfItem, type Party } from "@fahrpilot/payments";
import { render } from "@fahrpilot/notifications";
import { berlinDate, getOfficeContext, schoolSettings, LESSON_KIND_LABEL, type Db } from "@/lib/data/admin";
import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import type { ActionResult } from "./lessons";

const opt = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
const issues = (e: z.ZodError) => e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum ungültig");
const FINANCE = "/verwaltung/finanzen";

/** Euro-Eingabe ("12,50" oder "12.50") in Cent umrechnen. */
function toCents(v: FormDataEntryValue | null): number | null {
  const s = opt(v);
  if (s === null) return null;
  const n = Number.parseFloat(s.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "")) ;
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

function rangeStart(period: string): string {
  const m = period.match(/^[\[(]"?([^,"]+)"?,/);
  return m?.[1] ?? period;
}

function berlinDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(d),
    time: new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" }).format(d),
  };
}

// ---------------------------------------------------------------------------
// Preislisten (nur Admin, RLS: app.is_admin())
// ---------------------------------------------------------------------------

const PriceListSchema = z.object({
  name: z.string().min(1, "Name fehlt").max(80),
  license_code: z.string().max(5).nullable(),
  valid_from: date,
  valid_until: date.nullable(),
  vat_rate: z.coerce.number().min(0).max(100),
});

function priceListInput(fd: FormData) {
  return PriceListSchema.safeParse({ name: opt(fd.get("name")), license_code: opt(fd.get("license_code")), valid_from: opt(fd.get("valid_from")) ?? berlinDate(), valid_until: opt(fd.get("valid_until")), vat_rate: (opt(fd.get("vat_rate")) ?? "19").replace(",", ".") });
}

export async function createPriceList(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const ctx = await getOfficeContext();
  const p = priceListInput(fd);
  if (!p.success) return { ok: false, message: issues(p.error) };
  const { error } = await ctx.db.from("price_lists").insert({ ...p.data, tenant_id: ctx.tenantId });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`${FINANCE}/preise`);
  return { ok: true, message: "Preisliste angelegt. Positionen können jetzt ergänzt werden." };
}

export async function updatePriceList(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const ctx = await getOfficeContext();
  const id = z.string().uuid().parse(fd.get("id"));
  const p = priceListInput(fd);
  if (!p.success) return { ok: false, message: issues(p.error) };
  const { error } = await ctx.db.from("price_lists").update(p.data).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`${FINANCE}/preise`);
  return { ok: true, message: "Preisliste gespeichert." };
}

export async function deletePriceList(id: string): Promise<ActionResult> {
  await requireAdmin();
  const ctx = await getOfficeContext();
  const { error } = await ctx.db.from("price_lists").delete().eq("id", id);
  if (error) return { ok: false, message: error.code === "23503" ? "Die Preisliste ist in Verträgen hinterlegt und kann nicht gelöscht werden. Setze stattdessen ein Enddatum." : error.message };
  revalidatePath(`${FINANCE}/preise`);
  return { ok: true, message: "Preisliste gelöscht." };
}

const PriceItemSchema = z.object({
  price_list_id: z.string().uuid(),
  code: z.string().min(1, "Code fehlt").max(40).regex(/^[a-z0-9_]+$/, "Code nur mit Kleinbuchstaben, Ziffern und Unterstrich"),
  name: z.string().min(1, "Bezeichnung fehlt").max(120),
  unit: z.enum(["each", "unit45", "hour"]),
  amount_cents: z.number().int().min(0, "Betrag darf nicht negativ sein"),
  lesson_kind: z.enum(["practice", "overland", "motorway", "night", "special", "exam_prep", "practical_exam", "manual_conversion", "trailer"]).nullable(),
});

export async function savePriceItem(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const ctx = await getOfficeContext();
  const p = PriceItemSchema.safeParse({ price_list_id: fd.get("price_list_id"), code: opt(fd.get("code"))?.toLowerCase(), name: opt(fd.get("name")), unit: opt(fd.get("unit")) ?? "each", amount_cents: toCents(fd.get("amount_eur")), lesson_kind: opt(fd.get("lesson_kind")) });
  if (!p.success) return { ok: false, message: issues(p.error) };
  const { error } = await ctx.db.from("price_items").upsert(p.data, { onConflict: "price_list_id,code" });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`${FINANCE}/preise`);
  return { ok: true, message: `Position ${p.data.code} gespeichert.` };
}

export async function deletePriceItem(id: string): Promise<ActionResult> {
  await requireAdmin();
  const ctx = await getOfficeContext();
  const { error } = await ctx.db.from("price_items").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`${FINANCE}/preise`);
  return { ok: true, message: "Position gelöscht." };
}

// ---------------------------------------------------------------------------
// Rechnungsentwurf
// ---------------------------------------------------------------------------

const DraftSchema = z.object({
  student_id: z.string().uuid("Schüler fehlt"),
  price_list_id: z.string().uuid().nullable(),
  lesson_ids: z.array(z.string().uuid()),
  notes: z.string().max(1000).nullable(),
  free_description: z.string().max(200).nullable(),
  free_quantity: z.coerce.number().positive().max(999).default(1),
  free_unit_net_cents: z.number().int().min(0).nullable(),
});

/** Entwurf aus Preislistenpositionen und/oder abgeschlossenen, noch nicht abgerechneten Fahrstunden anlegen. */
export async function createInvoiceDraft(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const p = DraftSchema.safeParse({ student_id: opt(fd.get("student_id")), price_list_id: opt(fd.get("price_list_id")), lesson_ids: fd.getAll("lesson_ids").map(String), notes: opt(fd.get("notes")), free_description: opt(fd.get("free_description")), free_quantity: opt(fd.get("free_quantity")) ?? "1", free_unit_net_cents: toCents(fd.get("free_unit_net_eur")) });
  if (!p.success) return { ok: false, message: issues(p.error) };
  const { student_id, price_list_id, lesson_ids } = p.data;

  const { data: priceList } = price_list_id ? await ctx.db.from("price_lists").select("id, vat_rate, price_items(*)").eq("id", price_list_id).maybeSingle() : { data: null };
  const priceItems = ((priceList as unknown as { price_items: Tables<"price_items">[] } | null)?.price_items ?? []);
  const vatRate = priceList?.vat_rate ?? 19;
  type Item = Omit<TablesInsert<"invoice_items">, "invoice_id" | "position">;
  const items: Item[] = [];

  // Preislistenpositionen mit Menge (Felder qty_<price_item_id>)
  for (const it of priceItems) {
    const qty = Number.parseFloat(String(opt(fd.get(`qty_${it.id}`)) ?? "0").replace(",", "."));
    if (!Number.isFinite(qty) || qty <= 0) continue;
    items.push({ description: it.name, quantity: qty, unit_net_cents: it.amount_cents, vat_rate: vatRate, price_item_code: it.code });
  }

  // Fahrstunden: nur abgeschlossene und noch nicht abgerechnete des Schülers
  if (lesson_ids.length) {
    const [{ data: lessons }, { data: billed }] = await Promise.all([
      ctx.db.from("lessons").select("id, period, kind, units, price_cents").eq("student_id", student_id).in("id", lesson_ids).in("status", ["completed", "no_show"]),
      ctx.db.from("invoice_items").select("lesson_id, invoices!inner(status)").in("lesson_id", lesson_ids).neq("invoices.status", "cancelled"),
    ]);
    const already = new Set((billed ?? []).map((b) => b.lesson_id));
    for (const l of lessons ?? []) {
      if (already.has(l.id)) return { ok: false, message: "Mindestens eine Fahrstunde wurde bereits abgerechnet. Bitte Seite neu laden." };
      const { date: d, time } = berlinDateTime(rangeStart(l.period));
      const label = LESSON_KIND_LABEL[l.kind] ?? l.kind;
      const priceItem = priceItems.find((it) => it.lesson_kind === l.kind);
      if (priceItem) items.push({ description: `${label} am ${formatDateDe(d)} ${time} Uhr`, quantity: priceItem.unit === "unit45" ? l.units : 1, unit_net_cents: priceItem.amount_cents, vat_rate: vatRate, lesson_id: l.id, price_item_code: priceItem.code });
      else items.push({ description: `${label} am ${formatDateDe(d)} ${time} Uhr (${l.units} x 45 Min)`, quantity: 1, unit_net_cents: l.price_cents ?? 0, vat_rate: vatRate, lesson_id: l.id });
    }
  }

  if (p.data.free_description && p.data.free_unit_net_cents !== null) items.push({ description: p.data.free_description, quantity: p.data.free_quantity, unit_net_cents: p.data.free_unit_net_cents, vat_rate: vatRate });
  if (items.length === 0) return { ok: false, message: "Bitte mindestens eine Position wählen." };

  const { data: contracts } = await ctx.db.from("contracts").select("id").eq("student_id", student_id).in("status", ["signed", "active"]).order("created_at", { ascending: false }).limit(1);
  const { data: inv, error } = await ctx.db.from("invoices").insert({ tenant_id: ctx.tenantId, student_id, status: "draft", vat_rate: vatRate, notes: p.data.notes, contract_id: contracts?.[0]?.id ?? null }).select("id").single();
  if (error || !inv) return { ok: false, message: error?.message ?? "Entwurf konnte nicht angelegt werden." };
  const { error: itemErr } = await ctx.db.from("invoice_items").insert(items.map((it, i) => ({ ...it, invoice_id: inv.id, position: i + 1 })));
  if (itemErr) {
    await ctx.db.from("invoices").delete().eq("id", inv.id);
    return { ok: false, message: itemErr.message };
  }
  revalidatePath(FINANCE);
  redirect(`${FINANCE}/rechnung/${inv.id}`);
}

const ItemSchema = z.object({
  invoice_id: z.string().uuid(),
  description: z.string().min(1, "Beschreibung fehlt").max(200),
  quantity: z.coerce.number().positive("Menge muss größer als 0 sein").max(999),
  unit_net_cents: z.number().int().min(0, "Betrag darf nicht negativ sein"),
  vat_rate: z.coerce.number().min(0).max(100),
  price_item_code: z.string().max(40).nullable(),
});

function itemInput(fd: FormData) {
  return ItemSchema.safeParse({ invoice_id: fd.get("invoice_id"), description: opt(fd.get("description")), quantity: (opt(fd.get("quantity")) ?? "1").replace(",", "."), unit_net_cents: toCents(fd.get("unit_net_eur")), vat_rate: (opt(fd.get("vat_rate")) ?? "19").replace(",", "."), price_item_code: opt(fd.get("price_item_code")) });
}

async function assertDraft(db: Db, invoiceId: string): Promise<string | null> {
  const { data } = await db.from("invoices").select("status").eq("id", invoiceId).maybeSingle();
  if (!data) return "Rechnung nicht gefunden.";
  if (data.status !== "draft") return "Nur Entwürfe können bearbeitet werden.";
  return null;
}

export async function addInvoiceItem(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const p = itemInput(fd);
  if (!p.success) return { ok: false, message: issues(p.error) };
  const err = await assertDraft(ctx.db, p.data.invoice_id);
  if (err) return { ok: false, message: err };
  const { data: last } = await ctx.db.from("invoice_items").select("position").eq("invoice_id", p.data.invoice_id).order("position", { ascending: false }).limit(1);
  const { error } = await ctx.db.from("invoice_items").insert({ ...p.data, position: (last?.[0]?.position ?? 0) + 1 });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`${FINANCE}/rechnung/${p.data.invoice_id}`);
  return { ok: true, message: "Position hinzugefügt." };
}

export async function updateInvoiceItem(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const id = z.string().uuid().parse(fd.get("id"));
  const p = itemInput(fd);
  if (!p.success) return { ok: false, message: issues(p.error) };
  const err = await assertDraft(ctx.db, p.data.invoice_id);
  if (err) return { ok: false, message: err };
  const { invoice_id, ...patch } = p.data;
  const { error } = await ctx.db.from("invoice_items").update(patch).eq("id", id).eq("invoice_id", invoice_id);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`${FINANCE}/rechnung/${invoice_id}`);
  return { ok: true, message: "Position gespeichert." };
}

export async function deleteInvoiceItem(id: string, invoiceId: string): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const err = await assertDraft(ctx.db, invoiceId);
  if (err) return { ok: false, message: err };
  const { error } = await ctx.db.from("invoice_items").delete().eq("id", id).eq("invoice_id", invoiceId);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`${FINANCE}/rechnung/${invoiceId}`);
  return { ok: true, message: "Position entfernt." };
}

export async function updateInvoiceNotes(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const id = z.string().uuid().parse(fd.get("invoice_id"));
  const notes = z.string().max(1000).parse(fd.get("notes") ?? "");
  const err = await assertDraft(ctx.db, id);
  if (err) return { ok: false, message: err };
  const { error } = await ctx.db.from("invoices").update({ notes: notes.trim() || null }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`${FINANCE}/rechnung/${id}`);
  return { ok: true, message: "Hinweistext gespeichert." };
}

export async function deleteDraftInvoice(id: string): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const err = await assertDraft(ctx.db, id);
  if (err) return { ok: false, message: err };
  const { error } = await ctx.db.from("invoices").delete().eq("id", id).eq("status", "draft");
  if (error) return { ok: false, message: error.message };
  revalidatePath(FINANCE);
  redirect(FINANCE);
}

// ---------------------------------------------------------------------------
// Ausstellen und PDF
// ---------------------------------------------------------------------------

function issuerParty(school: Tables<"driving_schools">): Party {
  const address = [school.address_line1, school.address_line2, [school.postal_code, school.city].filter(Boolean).join(" ")].filter((l): l is string => Boolean(l && l.trim()));
  return { name: school.legal_name ?? school.name, addressLines: address, ...(school.tax_id ? { taxNumber: school.tax_id } : {}), ...(school.vat_id ? { vatId: school.vat_id } : {}), ...(school.email ? { email: school.email } : {}), ...(school.phone ? { phone: school.phone } : {}) };
}

/** Rechnungs-PDF erzeugen, in den Bucket documents hochladen und invoices.pdf_path setzen. Liefert den Pfad. */
async function generateInvoicePdf(invoiceId: string): Promise<string> {
  const ctx = await getOfficeContext();
  const settings = schoolSettings(ctx.school.settings);
  const { data: inv } = await ctx.db.from("invoices").select("*, students(first_name, last_name, email, address_line1, postal_code, city)").eq("id", invoiceId).single();
  if (!inv || !inv.invoice_number || !inv.issued_at) throw new Error("Rechnung ist noch nicht ausgestellt.");
  const student = inv.students as unknown as { first_name: string; last_name: string; email: string | null; address_line1: string | null; postal_code: string | null; city: string | null } | null;
  const [{ data: items }, { data: mandates }, { data: original }] = await Promise.all([
    ctx.db.from("invoice_items").select("*, lessons(period)").eq("invoice_id", invoiceId).order("position"),
    ctx.db.from("payment_mandates").select("mandate_reference").eq("student_id", inv.student_id).eq("status", "active").eq("method", "sepa_debit").limit(1),
    inv.credit_note_for ? ctx.db.from("invoices").select("invoice_number").eq("id", inv.credit_note_for).maybeSingle() : Promise.resolve({ data: null as { invoice_number: string | null } | null }),
  ]);
  const pdfItems: InvoicePdfItem[] = ((items ?? []) as unknown as Array<Tables<"invoice_items"> & { lessons: { period: string } | null }>).map((it) => ({
    position: it.position, description: it.description, quantity: Number(it.quantity), unit_net_cents: it.unit_net_cents, vat_rate: Number(it.vat_rate),
    ...(it.lessons ? { service_date: berlinDateTime(rangeStart(it.lessons.period)).date } : {}),
  }));
  const mandateRef = mandates?.[0]?.mandate_reference ?? null;
  const bytes = await renderInvoicePdf({
    issuer: issuerParty(ctx.school),
    recipient: { name: student ? `${student.first_name} ${student.last_name}` : "Schüler", addressLines: student ? [student.address_line1, [student.postal_code, student.city].filter(Boolean).join(" ")].filter((l): l is string => Boolean(l && l.trim())) : [], ...(student?.email ? { email: student.email } : {}) },
    invoice_number: inv.invoice_number,
    issued_at: inv.issued_at,
    ...(inv.due_at ? { due_at: inv.due_at } : {}),
    items: pdfItems,
    small_business: settings.small_business,
    ...(settings.bank_iban ? { bank_details: { account_holder: settings.bank_account_holder || (ctx.school.legal_name ?? ctx.school.name), iban: settings.bank_iban, ...(settings.bank_bic ? { bic: settings.bank_bic } : {}) } } : {}),
    ...(mandateRef && settings.sepa_creditor_id && !inv.credit_note_for ? { sepa: { creditor_id: settings.sepa_creditor_id, mandate_reference: mandateRef } } : {}),
    ...(inv.paid_cents > 0 ? { paid_cents: inv.paid_cents } : {}),
    ...(inv.notes ? { notes: inv.notes } : {}),
    ...(original?.invoice_number ? { credit_note_for: original.invoice_number } : {}),
  });
  const path = `${ctx.tenantId}/${inv.student_id}/rechnung-${inv.invoice_number}.pdf`;
  const admin = createSupabaseAdminClient();
  const { error: upErr } = await admin.storage.from("documents").upload(path, Buffer.from(bytes), { contentType: "application/pdf", upsert: true });
  if (upErr) throw new Error(`PDF-Upload fehlgeschlagen: ${upErr.message}`);
  const { error } = await ctx.db.from("invoices").update({ pdf_path: path }).eq("id", invoiceId);
  if (error) throw new Error(error.message);
  return path;
}

/** Rechnung über RPC issue_invoice ausstellen (lückenlose Nummer, Summen), danach PDF erzeugen. */
export async function issueInvoiceAction(id: string, dueDays?: number): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const settings = schoolSettings(ctx.school.settings);
  const days = z.number().int().min(0).max(120).catch(settings.invoice_due_days).parse(dueDays ?? settings.invoice_due_days);
  const { data, error } = await ctx.db.rpc("issue_invoice", { p_invoice_id: id, p_due_days: days });
  if (error || !data) return { ok: false, message: error?.message ?? "Ausstellen fehlgeschlagen." };
  let pdfMsg = "";
  try {
    await generateInvoicePdf(id);
    pdfMsg = " PDF wurde erzeugt.";
  } catch (e) {
    pdfMsg = ` PDF konnte nicht erzeugt werden: ${(e as Error).message}`;
  }
  revalidatePath(`${FINANCE}/rechnung/${id}`);
  revalidatePath(FINANCE);
  revalidatePath(`/verwaltung/schueler/${data.student_id}`);
  return { ok: true, message: `Rechnung ${data.invoice_number} ausgestellt, fällig am ${formatDateDe(data.due_at ?? "")}.${pdfMsg}` };
}

export async function regenerateInvoicePdf(id: string): Promise<ActionResult> {
  try {
    const path = await generateInvoicePdf(id);
    revalidatePath(`${FINANCE}/rechnung/${id}`);
    return { ok: true, message: `PDF erzeugt (${path.split("/").pop()}).` };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Zahlungen, Storno, Gutschrift
// ---------------------------------------------------------------------------

const PaymentSchema = z.object({
  invoice_id: z.string().uuid(),
  method: z.enum(["bank_transfer", "cash", "sepa_debit", "card", "other"]),
  amount_cents: z.number().int().refine((n) => n !== 0, "Betrag darf nicht 0 sein"),
  paid_at: date,
  note: z.string().max(300).nullable(),
  refund: z.boolean(),
});

/** Zahlung manuell erfassen (Überweisung, Bar, SEPA). Der Datenbank-Trigger aktualisiert den Rechnungsstatus. */
export async function recordPayment(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const p = PaymentSchema.safeParse({ invoice_id: fd.get("invoice_id"), method: opt(fd.get("method")) ?? "bank_transfer", amount_cents: toCents(fd.get("amount_eur")), paid_at: opt(fd.get("paid_at")) ?? berlinDate(), note: opt(fd.get("note")), refund: fd.get("refund") === "on" });
  if (!p.success) return { ok: false, message: issues(p.error) };
  const { data: inv } = await ctx.db.from("invoices").select("id, student_id, status, invoice_number").eq("id", p.data.invoice_id).maybeSingle();
  if (!inv) return { ok: false, message: "Rechnung nicht gefunden." };
  if (inv.status === "draft") return { ok: false, message: "Zahlungen können erst nach dem Ausstellen erfasst werden." };
  const amount = p.data.refund ? -Math.abs(p.data.amount_cents) : Math.abs(p.data.amount_cents);
  const { error } = await ctx.db.from("payments").insert({ tenant_id: ctx.tenantId, student_id: inv.student_id, invoice_id: inv.id, provider: "manual", method: p.data.method, amount_cents: amount, status: "succeeded", paid_at: new Date(`${p.data.paid_at}T12:00:00Z`).toISOString(), note: p.data.note, created_by: ctx.userId });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`${FINANCE}/rechnung/${inv.id}`);
  revalidatePath(FINANCE);
  revalidatePath(`/verwaltung/schueler/${inv.student_id}`);
  return { ok: true, message: `${p.data.refund ? "Erstattung" : "Zahlung"} über ${formatCents(Math.abs(amount))} zu ${inv.invoice_number} gebucht.` };
}

/** Storno: Status cancelled, optional Gutschrift (Rechnungskorrektur) mit gespiegelten Positionen als eigene Rechnung mit credit_note_for. */
export async function cancelInvoice(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const p = z.object({ invoice_id: z.string().uuid(), reason: z.string().min(3, "Grund fehlt").max(300), credit_note: z.boolean() }).safeParse({ invoice_id: fd.get("invoice_id"), reason: opt(fd.get("reason")), credit_note: fd.get("credit_note") === "on" });
  if (!p.success) return { ok: false, message: issues(p.error) };
  const { data: inv } = await ctx.db.from("invoices").select("*").eq("id", p.data.invoice_id).maybeSingle();
  if (!inv) return { ok: false, message: "Rechnung nicht gefunden." };
  if (inv.status === "draft") return { ok: false, message: "Entwürfe werden gelöscht, nicht storniert." };
  if (inv.status === "cancelled" || inv.status === "credited") return { ok: false, message: "Rechnung ist bereits storniert." };
  const stamp = `Storniert am ${formatDateDe(berlinDate())}: ${p.data.reason}`;
  const { error } = await ctx.db.from("invoices").update({ status: "cancelled", notes: inv.notes ? `${inv.notes}\n${stamp}` : stamp }).eq("id", inv.id);
  if (error) return { ok: false, message: error.message };
  let creditMsg = "";
  if (p.data.credit_note) {
    const { data: items } = await ctx.db.from("invoice_items").select("*").eq("invoice_id", inv.id).order("position");
    const { data: cn, error: cnErr } = await ctx.db.from("invoices").insert({ tenant_id: ctx.tenantId, student_id: inv.student_id, contract_id: inv.contract_id, status: "draft", vat_rate: inv.vat_rate, credit_note_for: inv.id, notes: `Gutschrift zur Rechnung ${inv.invoice_number}. ${p.data.reason}` }).select("id").single();
    if (cnErr || !cn) return { ok: false, message: `Rechnung storniert, Gutschrift fehlgeschlagen: ${cnErr?.message ?? "unbekannt"}` };
    const mirrored = (items ?? []).map((it) => ({ invoice_id: cn.id, position: it.position, description: it.description, quantity: it.quantity, unit_net_cents: it.unit_net_cents, vat_rate: it.vat_rate, price_item_code: it.price_item_code }));
    if (mirrored.length) {
      const { error: itErr } = await ctx.db.from("invoice_items").insert(mirrored);
      if (itErr) return { ok: false, message: `Rechnung storniert, Gutschriftpositionen fehlgeschlagen: ${itErr.message}` };
    }
    const { data: issued, error: issueErr } = await ctx.db.rpc("issue_invoice", { p_invoice_id: cn.id, p_due_days: 0 });
    if (issueErr || !issued) return { ok: false, message: `Rechnung storniert, Gutschrift konnte nicht ausgestellt werden: ${issueErr?.message ?? "unbekannt"}` };
    await ctx.db.from("invoices").update({ status: "credited" }).eq("id", cn.id);
    try {
      await generateInvoicePdf(cn.id);
    } catch (e) {
      creditMsg = ` Gutschrift ${issued.invoice_number} angelegt, PDF fehlt: ${(e as Error).message}`;
    }
    if (!creditMsg) creditMsg = ` Gutschrift ${issued.invoice_number} angelegt.`;
  }
  revalidatePath(`${FINANCE}/rechnung/${inv.id}`);
  revalidatePath(FINANCE);
  revalidatePath(`/verwaltung/schueler/${inv.student_id}`);
  return { ok: true, message: `Rechnung ${inv.invoice_number} storniert.${creditMsg}` };
}

// ---------------------------------------------------------------------------
// Mahnlauf
// ---------------------------------------------------------------------------

/** Mahnlauf: nächste fällige Mahnstufe je offener Rechnung setzen und Schüler benachrichtigen (dedupe_key invoice_due:<id>:<level>). */
export async function runDunning(invoiceId?: string): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const settings = schoolSettings(ctx.school.settings);
  const today = berlinDate();
  let q = ctx.db.from("invoices").select("id, invoice_number, status, due_at, gross_cents, paid_cents, dunning_level, dunning_last_at, student_id, students(first_name, last_name, user_id, preferred_locale)").in("status", ["issued", "partially_paid", "overdue"]);
  if (invoiceId) q = q.eq("id", invoiceId);
  const { data } = await q;
  type Row = { id: string; invoice_number: string | null; status: "issued" | "partially_paid" | "overdue"; due_at: string | null; gross_cents: number; paid_cents: number; dunning_level: number; dunning_last_at: string | null; student_id: string; students: { first_name: string; last_name: string; user_id: string | null; preferred_locale: string } | null };
  const rows = (data ?? []) as unknown as Row[];
  const config = { reminder_days: settings.dunning_reminder_days, fees_cents: settings.dunning_fees_cents };
  let sent = 0, skipped = 0, noUser = 0;
  for (const inv of rows) {
    const plan = dunningPlan({ status: inv.status, due_at: inv.due_at, dunning_level: inv.dunning_level, dunning_last_at: inv.dunning_last_at, gross_cents: inv.gross_cents, paid_cents: inv.paid_cents }, today, config);
    if (plan.action !== "send") { skipped++; continue; }
    const patch: { dunning_level: number; dunning_last_at: string; status?: "overdue" } = { dunning_level: plan.level, dunning_last_at: today };
    if (inv.status === "issued" && inv.due_at && inv.due_at < today) patch.status = "overdue";
    const { error } = await ctx.db.from("invoices").update(patch).eq("id", inv.id).eq("dunning_level", inv.dunning_level);
    if (error) return { ok: false, message: `Mahnstufe für ${inv.invoice_number} konnte nicht gesetzt werden: ${error.message}` };
    sent++;
    const userId = inv.students?.user_id;
    if (!userId) { noUser++; continue; }
    const text = render("invoice_due", { invoiceNumber: inv.invoice_number ?? "", amount: formatCents(plan.open_cents), dueDate: formatDateDe(inv.due_at ?? today) }, inv.students?.preferred_locale);
    const levelText = plan.level === 1 ? "Zahlungserinnerung" : `${plan.level - 1}. Mahnung`;
    const feeText = plan.fee_cents > 0 ? ` Mahngebühr: ${formatCents(plan.fee_cents)}.` : "";
    await ctx.db.from("notifications").upsert({ tenant_id: ctx.tenantId, user_id: userId, notification_type: "invoice_due", title: `${levelText}: ${text.title}`, body: `${text.body}${feeText}`, data: { invoice_id: inv.id, dunning_level: plan.level, fee_cents: plan.fee_cents, open_cents: plan.open_cents }, channels: ["push", "email", "in_app"], dedupe_key: `invoice_due:${inv.id}:${plan.level}` }, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true });
  }
  revalidatePath(FINANCE);
  if (invoiceId) revalidatePath(`${FINANCE}/rechnung/${invoiceId}`);
  if (sent === 0) return { ok: true, message: invoiceId ? "Für diese Rechnung ist derzeit keine Mahnstufe fällig." : `Keine Mahnung fällig (${skipped} Rechnungen geprüft).` };
  return { ok: true, message: `${sent} Mahnung${sent === 1 ? "" : "en"} gesetzt${noUser ? `, ${noUser} ohne Nutzerkonto (bitte per Post oder E-Mail informieren)` : ""}.` };
}

// ---------------------------------------------------------------------------
// SEPA-Mandate
// ---------------------------------------------------------------------------

/**
 * SEPA-Mandat über Stripe anlegen (gehosteter Ablauf). Bis das Mandat aktiv ist, steht in mandate_reference die
 * Stripe-Kundenreferenz (cus_...), über die der Webhook das ausstehende Mandat findet; danach ersetzt der Webhook
 * sie durch die SEPA-Mandatsreferenz und setzt provider_mandate_id auf die Zahlungsmethode (pm_...).
 */
export async function createStripeMandate(studentId: string, invoiceId?: string): Promise<ActionResult & { url?: string }> {
  const ctx = await getOfficeContext();
  const secretKey = process.env["STRIPE_SECRET_KEY"];
  if (!secretKey) return { ok: false, message: "Zahlungsanbieter nicht konfiguriert (STRIPE_SECRET_KEY fehlt). Ein manuelles Mandat kann unten erfasst werden." };
  const { data: st } = await ctx.db.from("students").select("id, first_name, last_name, email").eq("id", studentId).maybeSingle();
  if (!st) return { ok: false, message: "Schüler nicht gefunden." };
  try {
    const provider = new StripeProvider({ secretKey, hostedMandateSetup: true, ...(process.env["STRIPE_WEBHOOK_SECRET"] ? { webhookSecret: process.env["STRIPE_WEBHOOK_SECRET"] } : {}) });
    const customer = await provider.createCustomer({ studentId: st.id, name: `${st.first_name} ${st.last_name}`, ...(st.email ? { email: st.email } : {}), metadata: { tenant_id: ctx.tenantId } });
    const returnUrl = `${publicEnv.appUrl().replace(/\/$/, "")}/finanzen`;
    const setup = await provider.createSepaMandateSetup(customer, returnUrl);
    const { error } = await ctx.db.from("payment_mandates").insert({ tenant_id: ctx.tenantId, student_id: st.id, provider: "stripe", method: "sepa_debit", status: "pending", mandate_reference: customer.providerCustomerId });
    if (error) return { ok: false, message: error.message };
    revalidatePath(FINANCE);
    if (invoiceId) revalidatePath(`${FINANCE}/rechnung/${invoiceId}`);
    if (setup.url) return { ok: true, message: `Mandat angelegt. Link zur Bestätigung an ${st.first_name} ${st.last_name} weitergeben: ${setup.url}`, url: setup.url };
    return { ok: true, message: `Mandat angelegt (Setup ${setup.providerSetupId}). Die Bestätigung erfolgt über die Schüler-App.` };
  } catch (e) {
    return { ok: false, message: `Stripe-Fehler: ${(e as Error).message}` };
  }
}

const ManualMandateSchema = z.object({
  student_id: z.string().uuid(),
  masked_iban: z.string().min(8, "IBAN maskiert angeben, z. B. DE12 **** **** 1234").max(40),
  mandate_reference: z.string().min(3, "Mandatsreferenz fehlt").max(35),
  signed_at: date,
});

/** Manuelles SEPA-Mandat (Papierformular): nur maskierte IBAN speichern. */
export async function createManualMandate(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const p = ManualMandateSchema.safeParse({ student_id: fd.get("student_id"), masked_iban: opt(fd.get("masked_iban")), mandate_reference: opt(fd.get("mandate_reference")), signed_at: opt(fd.get("signed_at")) ?? berlinDate() });
  if (!p.success) return { ok: false, message: issues(p.error) };
  const digits = p.data.masked_iban.replace(/\s/g, "");
  if (/^[A-Z]{2}\d{2}[A-Z0-9]{12,30}$/.test(digits)) return { ok: false, message: "Bitte nur eine maskierte IBAN speichern (z. B. DE12 **** **** 1234). Volldaten verbleiben auf dem Papiermandat." };
  const { error } = await ctx.db.from("payment_mandates").insert({ tenant_id: ctx.tenantId, student_id: p.data.student_id, provider: "manual", method: "sepa_debit", status: "active", masked_iban: p.data.masked_iban, mandate_reference: p.data.mandate_reference, signed_at: new Date(`${p.data.signed_at}T12:00:00Z`).toISOString() });
  if (error) return { ok: false, message: error.message };
  revalidatePath(FINANCE);
  const back = opt(fd.get("invoice_id"));
  if (back) revalidatePath(`${FINANCE}/rechnung/${back}`);
  return { ok: true, message: "Manuelles SEPA-Mandat gespeichert." };
}

export async function revokeMandate(id: string, invoiceId?: string): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const { error } = await ctx.db.from("payment_mandates").update({ status: "revoked" }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath(FINANCE);
  if (invoiceId) revalidatePath(`${FINANCE}/rechnung/${invoiceId}`);
  return { ok: true, message: "Mandat widerrufen." };
}
