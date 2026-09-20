"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { payloadSchemaFor, RuleType } from "@fahrpilot/rules-engine";
import type { Json } from "@fahrpilot/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth/session";
import type { ActionResult } from "./lessons";

const RuleSchema = z.object({
  rule_type: RuleType,
  license_code: z.string().min(1).max(5),
  acquisition_kind: z.enum(["first", "extension", "any"]),
  valid_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  valid_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  payload: z.string(),
  source: z.string().min(3).max(500),
  legal_basis_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  notes: z.string().max(2000).nullable().default(null),
});

/** Neue Regelversion als Entwurf anlegen. Payload wird gegen das Zod-Schema des Regeltyps geprüft. */
export async function createRuleVersion(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const session = await requirePlatformAdmin();
  const parsed = RuleSchema.safeParse({ ...Object.fromEntries(formData.entries()), valid_until: formData.get("valid_until") || null, legal_basis_date: formData.get("legal_basis_date") || null, notes: formData.get("notes") || null });
  if (!parsed.success) return { ok: false, message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ") };
  let payload: unknown;
  try { payload = JSON.parse(parsed.data.payload); } catch { return { ok: false, message: "Payload ist kein gültiges JSON." }; }
  const check = payloadSchemaFor[parsed.data.rule_type].safeParse(payload);
  if (!check.success) return { ok: false, message: `Payload ungültig: ${check.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}` };
  const db = await createSupabaseServerClient();
  const { data: last } = await db.from("rule_versions").select("version").eq("rule_type", parsed.data.rule_type).eq("license_code", parsed.data.license_code).eq("acquisition_kind", parsed.data.acquisition_kind).order("version", { ascending: false }).limit(1).maybeSingle();
  const { error } = await db.from("rule_versions").insert({ ...parsed.data, payload: check.data as unknown as Json, version: (last?.version ?? 0) + 1, review_status: "draft", created_by: session.userId });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/plattform/regeln");
  return { ok: true, message: "Regelversion als Entwurf angelegt." };
}

const TRANSITIONS: Record<string, string[]> = { draft: ["in_review", "retired"], needs_verification: ["in_review", "retired"], in_review: ["approved", "draft"], approved: ["published", "draft"], published: ["retired"], retired: [] };

/**
 * Freigabe-Workflow: Entwurf -> fachliche Prüfung -> Freigabe -> Veröffentlichung -> Rückzug. Vier-Augen-Prinzip: Ersteller darf nicht selbst freigeben.
 * Beim Veröffentlichen wird die bisher gültige Version automatisch am Vortag beendet (keine Überschneidung, historische Ergebnisse bleiben rekonstruierbar).
 */
export async function transitionRuleVersion(id: string, to: string, comment: string): Promise<ActionResult> {
  const session = await requirePlatformAdmin();
  const db = await createSupabaseServerClient();
  const { data: rv } = await db.from("rule_versions").select("*").eq("id", id).single();
  if (!rv) return { ok: false, message: "Version nicht gefunden." };
  if (!TRANSITIONS[rv.review_status]?.includes(to)) return { ok: false, message: `Übergang ${rv.review_status} nach ${to} ist nicht erlaubt.` };
  if ((to === "approved" || to === "published") && rv.created_by === session.userId) return { ok: false, message: "Vier-Augen-Prinzip: Die eigene Version kann nicht selbst freigegeben werden." };
  if (to === "published") {
    const { data: current } = await db.from("rule_versions").select("id, valid_from").eq("rule_type", rv.rule_type).eq("license_code", rv.license_code ?? "").eq("acquisition_kind", rv.acquisition_kind).eq("review_status", "published").is("valid_until", null).neq("id", id);
    for (const c of current ?? []) {
      const end = new Date(rv.valid_from); end.setDate(end.getDate() - 1);
      if (end < new Date(c.valid_from)) return { ok: false, message: "Die neue Version beginnt vor der aktuell gültigen. Bitte valid_from prüfen." };
      await db.from("rule_versions").update({ valid_until: end.toISOString().slice(0, 10) }).eq("id", c.id);
    }
  }
  const { error } = await db.from("rule_versions").update({ review_status: to as never, ...(to === "approved" || to === "published" ? { reviewed_by: session.userId, reviewed_at: new Date().toISOString() } : {}) }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  await db.from("content_reviews").insert({ entity_table: "rule_versions", entity_id: id, from_status: rv.review_status, to_status: to as never, reviewer_id: session.userId, comment: comment || null });
  revalidatePath("/plattform/regeln");
  return { ok: true, message: `Status auf ${to} gesetzt.` };
}

/** Content-Freigabe für Fragen, Wissensbasis, Kapitel, Prüfer-Fragen (gleicher Workflow). */
export async function transitionContent(table: "theory_questions" | "knowledge_entries" | "chapters" | "practical_check_questions", id: string, to: string, comment: string): Promise<ActionResult> {
  const session = await requirePlatformAdmin();
  const db = await createSupabaseServerClient();
  const col = table === "theory_questions" ? "status" : "review_status";
  const { data: row } = await db.from(table).select(`id, ${col}, created_by`).eq("id", id).single();
  const r = row as unknown as { id: string; status?: string; review_status?: string; created_by?: string | null } | null;
  if (!r) return { ok: false, message: "Eintrag nicht gefunden." };
  const from = (r.status ?? r.review_status) as string;
  if (!TRANSITIONS[from]?.includes(to)) return { ok: false, message: `Übergang ${from} nach ${to} ist nicht erlaubt.` };
  if ((to === "approved" || to === "published") && r.created_by === session.userId) return { ok: false, message: "Vier-Augen-Prinzip: eigene Inhalte können nicht selbst freigegeben werden." };
  const patch: Record<string, unknown> = { [col]: to };
  if (table !== "theory_questions" && (to === "approved" || to === "published")) { patch["reviewed_by"] = session.userId; patch["reviewed_at"] = new Date().toISOString(); }
  const { error } = await db.from(table).update(patch as never).eq("id", id);
  if (error) return { ok: false, message: error.message };
  await db.from("content_reviews").insert({ entity_table: table, entity_id: id, from_status: from as never, to_status: to as never, reviewer_id: session.userId, comment: comment || null });
  revalidatePath("/plattform/inhalte");
  return { ok: true, message: `Status auf ${to} gesetzt.` };
}

const SchoolSchema = z.object({ name: z.string().min(2).max(120), slug: z.string().regex(/^[a-z0-9-]{3,40}$/), email: z.string().email().optional().or(z.literal("")), owner_email: z.string().email() });

/** Neue Fahrschule (Tenant) anlegen und Inhaber einladen. */
export async function createTenant(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePlatformAdmin();
  const parsed = SchoolSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, message: parsed.error.issues.map((i) => i.message).join(", ") };
  const { createSupabaseAdminClient } = await import("@/lib/supabase/server");
  const admin = createSupabaseAdminClient();
  const { data: school, error } = await admin.from("driving_schools").insert({ name: parsed.data.name, slug: parsed.data.slug, email: parsed.data.email || null, status: "trial" }).select("id").single();
  if (error || !school) return { ok: false, message: error?.message ?? "Anlage fehlgeschlagen" };
  const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(parsed.data.owner_email, { data: { locale: "de" } });
  if (invErr || !invited.user) return { ok: false, message: `Fahrschule angelegt, Einladung fehlgeschlagen: ${invErr?.message ?? "unbekannt"}` };
  await admin.from("tenant_memberships").upsert({ tenant_id: school.id, user_id: invited.user.id, role: "owner", status: "invited" }, { onConflict: "tenant_id,user_id" });
  await admin.from("users").update({ active_tenant_id: school.id }).eq("id", invited.user.id);
  revalidatePath("/plattform/fahrschulen");
  return { ok: true, message: "Fahrschule angelegt, Inhaber eingeladen." };
}

/** Startet eine Support-Sitzung in einer Fahrschule (nur mit aktiver Freigabe der Fahrschule) und wechselt in deren Verwaltung. */
export async function startSupportSession(tenantId: string): Promise<void> {
  await requirePlatformAdmin();
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("start_support_session", { p_tenant_id: tenantId });
  if (error) throw new Error(error.message);
  await supabase.auth.refreshSession();
  const { redirect } = await import("next/navigation");
  redirect("/verwaltung");
}

/** Beendet die eigene Support-Sitzung und kehrt zur Plattform zurück. */
export async function endSupportSession(): Promise<void> {
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("end_support_session");
  if (error) throw new Error(error.message);
  await supabase.auth.refreshSession();
  const { redirect } = await import("next/navigation");
  redirect("/plattform");
}
