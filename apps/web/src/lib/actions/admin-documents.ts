"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getOfficeContext } from "@/lib/data/admin";
import { requireAdmin } from "@/lib/auth/session";
import type { ActionResult } from "./lessons";

const opt = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
const issues = (e: z.ZodError) => e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
const PATH = "/verwaltung/dokumente";

const RequirementSchema = z.object({
  code: z.string().min(2, "Code fehlt").max(40).regex(/^[a-z0-9_]+$/, "Code nur mit Kleinbuchstaben, Ziffern und Unterstrich"),
  name: z.string().min(1, "Bezeichnung fehlt").max(120),
  description: z.string().max(500).nullable(),
  license_codes: z.array(z.string().max(5)),
  required: z.boolean(),
  requires_upload: z.boolean(),
  applies_when: z.enum(["always", "accompanied_driving", "minor"]),
  sort_order: z.coerce.number().int().min(0).max(999),
});

function appliesWhen(v: "always" | "accompanied_driving" | "minor"): Record<string, boolean> {
  if (v === "accompanied_driving") return { accompanied_driving: true };
  if (v === "minor") return { minor: true };
  return {};
}

/** Eigene Checklisten-Vorlage der Fahrschule anlegen oder (bei gleichem Code) aktualisieren. Nur Admin (RLS). */
export async function saveRequirement(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const ctx = await getOfficeContext();
  const p = RequirementSchema.safeParse({ code: opt(fd.get("code"))?.toLowerCase(), name: opt(fd.get("name")), description: opt(fd.get("description")), license_codes: fd.getAll("license_codes").map(String), required: fd.get("required") === "on", requires_upload: fd.get("requires_upload") === "on", applies_when: opt(fd.get("applies_when")) ?? "always", sort_order: opt(fd.get("sort_order")) ?? "0" });
  if (!p.success) return { ok: false, message: issues(p.error) };
  const { data: existing } = await ctx.db.from("document_requirements").select("id").eq("tenant_id", ctx.tenantId).eq("code", p.data.code).maybeSingle();
  const row = { tenant_id: ctx.tenantId, code: p.data.code, name_i18n: { de: p.data.name }, description_i18n: p.data.description ? { de: p.data.description } : {}, license_codes: p.data.license_codes, required: p.data.required, requires_upload: p.data.requires_upload, applies_when: appliesWhen(p.data.applies_when), sort_order: p.data.sort_order, active: true };
  const { error } = existing ? await ctx.db.from("document_requirements").update(row).eq("id", existing.id) : await ctx.db.from("document_requirements").insert(row);
  if (error) return { ok: false, message: error.message };
  revalidatePath(PATH);
  return { ok: true, message: existing ? `Vorlage ${p.data.code} aktualisiert.` : `Vorlage ${p.data.code} angelegt. Sie gilt für neue Anmeldungen.` };
}

export async function setRequirementActive(id: string, active: boolean): Promise<ActionResult> {
  await requireAdmin();
  const ctx = await getOfficeContext();
  const { error } = await ctx.db.from("document_requirements").update({ active }).eq("id", id).eq("tenant_id", ctx.tenantId);
  if (error) return { ok: false, message: error.message };
  revalidatePath(PATH);
  return { ok: true, message: active ? "Vorlage aktiviert." : "Vorlage deaktiviert. Bestehende Checklisten bleiben unverändert." };
}

/** Plattform-Vorlage als eigene Vorlage übernehmen (kann danach angepasst werden). */
export async function copyPlatformRequirement(platformId: string): Promise<ActionResult> {
  await requireAdmin();
  const ctx = await getOfficeContext();
  const { data: src } = await ctx.db.from("document_requirements").select("*").eq("id", platformId).is("tenant_id", null).maybeSingle();
  if (!src) return { ok: false, message: "Plattform-Vorlage nicht gefunden." };
  const { error } = await ctx.db.from("document_requirements").insert({ tenant_id: ctx.tenantId, code: src.code, name_i18n: src.name_i18n, description_i18n: src.description_i18n, license_codes: src.license_codes, required: src.required, requires_upload: src.requires_upload, applies_when: src.applies_when, sort_order: src.sort_order, active: true });
  if (error) return { ok: false, message: error.code === "23505" ? "Für diesen Code gibt es bereits eine eigene Vorlage." : error.message };
  revalidatePath(PATH);
  return { ok: true, message: `Vorlage ${src.code} als eigene Vorlage übernommen.` };
}

const RetentionSchema = z.object({
  data_category: z.string().min(2).max(40).regex(/^[a-z_]+$/),
  retention_months: z.coerce.number().int().min(0, "Monate dürfen nicht negativ sein").max(1200),
  legal_basis: z.string().max(300).nullable(),
  review_status: z.enum(["needs_verification", "in_review", "approved"]),
});

/** Aufbewahrungsregel je Datenart für die Fahrschule speichern (Upsert auf tenant_id, data_category). Nur Admin (RLS). */
export async function saveRetentionPolicy(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const ctx = await getOfficeContext();
  const p = RetentionSchema.safeParse({ data_category: opt(fd.get("data_category")), retention_months: opt(fd.get("retention_months")), legal_basis: opt(fd.get("legal_basis")), review_status: opt(fd.get("review_status")) ?? "needs_verification" });
  if (!p.success) return { ok: false, message: issues(p.error) };
  const { error } = await ctx.db.from("retention_policies").upsert({ ...p.data, tenant_id: ctx.tenantId }, { onConflict: "tenant_id,data_category" });
  if (error) return { ok: false, message: error.message };
  revalidatePath(PATH);
  return { ok: true, message: "Aufbewahrungsregel gespeichert." };
}

export async function deleteRetentionPolicy(id: string): Promise<ActionResult> {
  await requireAdmin();
  const ctx = await getOfficeContext();
  const { error } = await ctx.db.from("retention_policies").delete().eq("id", id).eq("tenant_id", ctx.tenantId);
  if (error) return { ok: false, message: error.message };
  revalidatePath(PATH);
  return { ok: true, message: "Eigene Regel entfernt, die Plattform-Vorgabe gilt wieder." };
}
