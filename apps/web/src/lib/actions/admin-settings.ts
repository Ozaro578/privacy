"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { berlinDate, getOfficeContext } from "@/lib/data/admin";
import { requireAdmin } from "@/lib/auth/session";
import type { ActionResult } from "./lessons";

const opt = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
const issues = (e: z.ZodError) => e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum ungültig");
const PATH = "/verwaltung/einstellungen";

function toCents(v: FormDataEntryValue | null): number | null {
  const s = opt(v);
  if (s === null) return null;
  const n = Number.parseFloat(s.replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

const SchoolSchema = z.object({
  name: z.string().min(2, "Name fehlt").max(120),
  legal_name: z.string().max(160).nullable(),
  tax_id: z.string().max(40).nullable(),
  vat_id: z.string().max(20).regex(/^[A-Z]{2}[A-Z0-9]{2,13}$/, "USt-IdNr. ungültig (z. B. DE123456789)").nullable(),
  email: z.string().email("E-Mail ungültig").nullable(),
  phone: z.string().max(40).nullable(),
  website: z.string().url("Webadresse ungültig").nullable(),
  address_line1: z.string().max(120).nullable(),
  address_line2: z.string().max(120).nullable(),
  postal_code: z.string().max(10).nullable(),
  city: z.string().max(80).nullable(),
  invoice_number_prefix: z.string().min(1, "Präfix fehlt").max(10).regex(/^[A-Z0-9]+$/, "Nur Großbuchstaben und Ziffern"),
  default_locale: z.enum(["de", "en", "tr", "ar"]),
  auto_confirm_bookings: z.boolean(),
});

/** Stammdaten der Fahrschule. settings.auto_confirm_bookings wird in das bestehende Settings-JSON gemischt. */
export async function updateSchool(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const ctx = await getOfficeContext();
  const p = SchoolSchema.safeParse({
    name: opt(fd.get("name")), legal_name: opt(fd.get("legal_name")), tax_id: opt(fd.get("tax_id")), vat_id: opt(fd.get("vat_id"))?.toUpperCase().replace(/\s/g, "") ?? null, email: opt(fd.get("email"))?.toLowerCase() ?? null, phone: opt(fd.get("phone")), website: opt(fd.get("website")),
    address_line1: opt(fd.get("address_line1")), address_line2: opt(fd.get("address_line2")), postal_code: opt(fd.get("postal_code")), city: opt(fd.get("city")), invoice_number_prefix: opt(fd.get("invoice_number_prefix"))?.toUpperCase() ?? "RE", default_locale: opt(fd.get("default_locale")) ?? "de", auto_confirm_bookings: fd.get("auto_confirm_bookings") === "on",
  });
  if (!p.success) return { ok: false, message: issues(p.error) };
  const { auto_confirm_bookings, ...fields } = p.data;
  const current = (ctx.school.settings && typeof ctx.school.settings === "object" && !Array.isArray(ctx.school.settings) ? ctx.school.settings : {}) as Record<string, unknown>;
  const { error } = await ctx.db.from("driving_schools").update({ ...fields, settings: { ...current, auto_confirm_bookings } }).eq("id", ctx.tenantId);
  if (error) return { ok: false, message: error.message };
  revalidatePath(PATH);
  revalidatePath("/verwaltung", "layout");
  return { ok: true, message: "Stammdaten gespeichert." };
}

const BillingSchema = z.object({
  small_business: z.boolean(),
  invoice_due_days: z.coerce.number().int().min(0).max(120),
  bank_account_holder: z.string().max(120),
  bank_iban: z.string().max(40).regex(/^([A-Z]{2}\d{2}[A-Z0-9]{11,30})?$/, "IBAN ungültig"),
  bank_bic: z.string().max(11),
  sepa_creditor_id: z.string().max(35),
  dunning_reminder_days: z.array(z.number().int().min(0).max(365)).min(1, "Mindestens eine Mahnstufe").max(3, "Höchstens drei Mahnstufen"),
  dunning_fees_cents: z.array(z.number().int().min(0)).max(3),
});

/** Rechnungs- und Mahneinstellungen im Settings-JSON (Kleinunternehmer, Zahlungsziel, Bankverbindung, Mahnstufen). */
export async function updateBillingSettings(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const ctx = await getOfficeContext();
  const list = (v: FormDataEntryValue | null) => (opt(v) ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const p = BillingSchema.safeParse({
    small_business: fd.get("small_business") === "on", invoice_due_days: opt(fd.get("invoice_due_days")) ?? "14", bank_account_holder: opt(fd.get("bank_account_holder")) ?? "", bank_iban: (opt(fd.get("bank_iban")) ?? "").toUpperCase().replace(/\s/g, ""), bank_bic: (opt(fd.get("bank_bic")) ?? "").toUpperCase(), sepa_creditor_id: (opt(fd.get("sepa_creditor_id")) ?? "").toUpperCase().replace(/\s/g, ""),
    dunning_reminder_days: list(fd.get("dunning_reminder_days")).map((s) => Number.parseInt(s, 10)), dunning_fees_cents: list(fd.get("dunning_fees_eur")).map((s) => Math.round(Number.parseFloat(s.replace(",", ".")) * 100)),
  });
  if (!p.success) return { ok: false, message: issues(p.error) };
  const days = p.data.dunning_reminder_days;
  if (days.some((d, i) => i > 0 && d <= (days[i - 1] ?? 0))) return { ok: false, message: "Mahnstufen müssen aufsteigend sein, z. B. 7, 14, 28." };
  const current = (ctx.school.settings && typeof ctx.school.settings === "object" && !Array.isArray(ctx.school.settings) ? ctx.school.settings : {}) as Record<string, unknown>;
  const { error } = await ctx.db.from("driving_schools").update({ settings: { ...current, ...p.data } }).eq("id", ctx.tenantId);
  if (error) return { ok: false, message: error.message };
  revalidatePath(PATH);
  revalidatePath("/verwaltung/finanzen");
  return { ok: true, message: "Rechnungseinstellungen gespeichert." };
}

const LocationSchema = z.object({
  name: z.string().min(1, "Name fehlt").max(80),
  address_line1: z.string().max(120).nullable(),
  postal_code: z.string().max(10).nullable(),
  city: z.string().max(80).nullable(),
  phone: z.string().max(40).nullable(),
  email: z.string().email("E-Mail ungültig").nullable(),
  is_primary: z.boolean(),
  active: z.boolean(),
});

function locationInput(fd: FormData) {
  return LocationSchema.safeParse({ name: opt(fd.get("name")), address_line1: opt(fd.get("address_line1")), postal_code: opt(fd.get("postal_code")), city: opt(fd.get("city")), phone: opt(fd.get("phone")), email: opt(fd.get("email"))?.toLowerCase() ?? null, is_primary: fd.get("is_primary") === "on", active: fd.get("active") === "on" });
}

export async function saveLocation(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const ctx = await getOfficeContext();
  const id = opt(fd.get("id"));
  const p = locationInput(fd);
  if (!p.success) return { ok: false, message: issues(p.error) };
  if (p.data.is_primary) await ctx.db.from("locations").update({ is_primary: false }).eq("tenant_id", ctx.tenantId).eq("is_primary", true);
  const { error } = id ? await ctx.db.from("locations").update(p.data).eq("id", id) : await ctx.db.from("locations").insert({ ...p.data, tenant_id: ctx.tenantId });
  if (error) return { ok: false, message: error.message };
  revalidatePath(PATH);
  return { ok: true, message: id ? "Standort gespeichert." : "Standort angelegt." };
}

export async function deleteLocation(id: string): Promise<ActionResult> {
  await requireAdmin();
  const ctx = await getOfficeContext();
  const [{ count: lessons }, { count: students }] = await Promise.all([
    ctx.db.from("lessons").select("id", { count: "exact", head: true }).eq("location_id", id),
    ctx.db.from("students").select("id", { count: "exact", head: true }).eq("location_id", id),
  ]);
  if ((lessons ?? 0) + (students ?? 0) > 0) {
    const { error } = await ctx.db.from("locations").update({ active: false, is_primary: false }).eq("id", id);
    if (error) return { ok: false, message: error.message };
    revalidatePath(PATH);
    return { ok: true, message: "Standort ist mit Schülern oder Fahrstunden verknüpft und wurde deshalb deaktiviert statt gelöscht." };
  }
  const { error } = await ctx.db.from("locations").delete().eq("id", id);
  if (error) return { ok: false, message: error.code === "23503" ? "Standort ist noch verknüpft (Team oder Fahrzeuge) und wurde nicht gelöscht." : error.message };
  revalidatePath(PATH);
  return { ok: true, message: "Standort gelöscht." };
}

const PolicySchema = z.object({
  name: z.string().min(1, "Name fehlt").max(80),
  free_cancellation_hours: z.coerce.number().int().min(0).max(720),
  late_fee_percent: z.coerce.number().min(0).max(100).nullable(),
  late_fee_fixed_cents: z.number().int().min(0).nullable(),
  no_show_fee_percent: z.coerce.number().min(0).max(100).nullable(),
  contract_clause_reference: z.string().max(80).nullable(),
  valid_from: date,
  valid_until: date.nullable(),
});

function policyInput(fd: FormData) {
  return PolicySchema.safeParse({ name: opt(fd.get("name")), free_cancellation_hours: opt(fd.get("free_cancellation_hours")) ?? "24", late_fee_percent: opt(fd.get("late_fee_percent"))?.replace(",", ".") ?? null, late_fee_fixed_cents: toCents(fd.get("late_fee_fixed_eur")), no_show_fee_percent: opt(fd.get("no_show_fee_percent"))?.replace(",", ".") ?? null, contract_clause_reference: opt(fd.get("contract_clause_reference")), valid_from: opt(fd.get("valid_from")) ?? berlinDate(), valid_until: opt(fd.get("valid_until")) });
}

export async function saveCancellationPolicy(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const ctx = await getOfficeContext();
  const id = opt(fd.get("id"));
  const p = policyInput(fd);
  if (!p.success) return { ok: false, message: issues(p.error) };
  if (p.data.valid_until && p.data.valid_until < p.data.valid_from) return { ok: false, message: "Gültig bis muss nach Gültig ab liegen." };
  const { error } = id ? await ctx.db.from("cancellation_policies").update(p.data).eq("id", id) : await ctx.db.from("cancellation_policies").insert({ ...p.data, tenant_id: ctx.tenantId });
  if (error) return { ok: false, message: error.message };
  revalidatePath(PATH);
  return { ok: true, message: id ? "Stornierungsregel gespeichert." : "Stornierungsregel angelegt. Sie wird in neuen Verträgen hinterlegt." };
}

export async function deleteCancellationPolicy(id: string): Promise<ActionResult> {
  await requireAdmin();
  const ctx = await getOfficeContext();
  const { error } = await ctx.db.from("cancellation_policies").delete().eq("id", id);
  if (error) return { ok: false, message: error.code === "23503" ? "Die Regel ist in Verträgen hinterlegt. Setze stattdessen ein Enddatum." : error.message };
  revalidatePath(PATH);
  return { ok: true, message: "Stornierungsregel gelöscht." };
}

const GrantSchema = z.object({ reason: z.string().min(5, "Bitte den Grund nennen (mindestens 5 Zeichen)").max(300), hours: z.enum(["4", "24", "72", "168"]) });

/** Erteilt der Plattform einen befristeten Support-Zugriff (nur Admin). Der Zugriff ist im Änderungsprotokoll sichtbar. */
export async function grantSupportAccess(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const ctx = await getOfficeContext();
  const p = GrantSchema.safeParse({ reason: opt(fd.get("reason")) ?? "", hours: fd.get("hours") });
  if (!p.success) return { ok: false, message: issues(p.error) };
  const expires = new Date(Date.now() + Number(p.data.hours) * 3_600_000).toISOString();
  const { error } = await ctx.db.from("support_access_grants").insert({ tenant_id: ctx.tenantId, granted_by: session.userId, reason: p.data.reason, expires_at: expires });
  if (error) return { ok: false, message: error.message };
  revalidatePath(PATH);
  return { ok: true, message: `Support-Zugriff bis ${new Date(expires).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })} erteilt.` };
}

/** Widerruft eine Support-Freigabe; laufende Support-Sitzungen enden sofort. */
export async function revokeSupportAccess(id: string): Promise<ActionResult> {
  const session = await requireAdmin();
  const ctx = await getOfficeContext();
  const { error } = await ctx.db.from("support_access_grants").update({ revoked_at: new Date().toISOString(), revoked_by: session.userId }).eq("id", id).is("revoked_at", null);
  if (error) return { ok: false, message: error.message };
  revalidatePath(PATH);
  return { ok: true, message: "Support-Zugriff widerrufen." };
}
