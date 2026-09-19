"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { TablesUpdate } from "@fahrpilot/db";
import { getOfficeContext, type Db } from "@/lib/data/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { ActionResult } from "./lessons";

const opt = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
const issues = (e: z.ZodError) => e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");

const StudentSchema = z.object({
  first_name: z.string().min(1, "Vorname fehlt").max(80),
  last_name: z.string().min(1, "Nachname fehlt").max(80),
  email: z.string().email("E-Mail ungültig").nullable(),
  phone: z.string().max(40).nullable(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  address_line1: z.string().max(120).nullable(),
  postal_code: z.string().max(10).nullable(),
  city: z.string().max(80).nullable(),
  location_id: z.string().uuid().nullable(),
  student_number: z.string().max(30).nullable(),
  preferred_locale: z.enum(["de", "en", "tr", "ar"]).default("de"),
  guardian_name: z.string().max(120).nullable(),
  guardian_email: z.string().email().nullable(),
  guardian_phone: z.string().max(40).nullable(),
  status: z.enum(["lead", "registered", "active", "paused", "completed", "cancelled"]).default("registered"),
});

function studentInput(fd: FormData) {
  return StudentSchema.safeParse({
    first_name: fd.get("first_name"), last_name: fd.get("last_name"), email: opt(fd.get("email"))?.toLowerCase() ?? null, phone: opt(fd.get("phone")), date_of_birth: opt(fd.get("date_of_birth")),
    address_line1: opt(fd.get("address_line1")), postal_code: opt(fd.get("postal_code")), city: opt(fd.get("city")), location_id: opt(fd.get("location_id")), student_number: opt(fd.get("student_number")),
    preferred_locale: opt(fd.get("preferred_locale")) ?? "de", guardian_name: opt(fd.get("guardian_name")), guardian_email: opt(fd.get("guardian_email"))?.toLowerCase() ?? null, guardian_phone: opt(fd.get("guardian_phone")),
    status: opt(fd.get("status")) ?? "registered",
  });
}

const LicenseSchema = z.object({
  license_code: z.string().min(1).max(5),
  acquisition_kind: z.enum(["first", "extension"]).default("first"),
  transmission: z.enum(["manual", "automatic"]).default("manual"),
  accompanied_driving: z.boolean().default(false),
  primary_instructor_id: z.string().uuid().nullable(),
  existing_license_codes: z.array(z.string()).default([]),
});

function licenseInput(fd: FormData) {
  return LicenseSchema.safeParse({
    license_code: fd.get("license_code"), acquisition_kind: opt(fd.get("acquisition_kind")) ?? "first", transmission: opt(fd.get("transmission")) ?? "manual",
    accompanied_driving: fd.get("accompanied_driving") === "on", primary_instructor_id: opt(fd.get("primary_instructor_id")),
    existing_license_codes: (opt(fd.get("existing_license_codes")) ?? "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean),
  });
}

/** Dokumenten-Checkliste aus Vorlagen anlegen (Tenant-Vorlage vor Plattform-Vorlage), wie in register_student. */
async function createDocumentChecklist(db: Db, tenantId: string, studentId: string, licenseId: string, licenseCode: string, opts: { accompanied: boolean; minor: boolean }) {
  const { data: reqs } = await db.from("document_requirements").select("*").eq("active", true);
  const all = reqs ?? [];
  const tenantCodes = new Set(all.filter((r) => r.tenant_id === tenantId).map((r) => r.code));
  const rows = all
    .filter((r) => r.tenant_id === tenantId || (r.tenant_id === null && !tenantCodes.has(r.code)))
    .filter((r) => r.license_codes.length === 0 || r.license_codes.includes(licenseCode))
    .filter((r) => {
      const w = (r.applies_when ?? {}) as Record<string, unknown>;
      if (Object.keys(w).length === 0) return true;
      if ("accompanied_driving" in w) return Boolean(w["accompanied_driving"]) === opts.accompanied;
      if ("minor" in w) return opts.minor;
      return true;
    })
    .map((r) => ({ tenant_id: tenantId, student_id: studentId, student_license_id: licenseId, requirement_code: r.code, kind: r.code, title: ((r.name_i18n as Record<string, string> | null)?.["de"] ?? r.code), status: "missing" }));
  if (rows.length) await db.from("documents").upsert(rows, { onConflict: "student_id,requirement_code", ignoreDuplicates: true });
}

function isMinor(dob: string | null): boolean {
  if (!dob) return false;
  const d = new Date(dob);
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 18);
  return d > cutoff;
}

/** Einladung per E-Mail (Service-Role). Bestehende Nutzer werden direkt als Mitglied freigeschaltet. */
async function inviteMember(tenantId: string, email: string, role: "student" | "instructor" | "office" | "admin" | "owner", invitedBy: string, meta: Record<string, string>): Promise<{ userId: string; invited: boolean; message: string }> {
  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin.from("users").select("id").eq("email", email).maybeSingle();
  if (existing) {
    await admin.from("tenant_memberships").upsert({ tenant_id: tenantId, user_id: existing.id, role, status: "active", invited_by: invitedBy }, { onConflict: "tenant_id,user_id" });
    return { userId: existing.id, invited: false, message: "Nutzerkonto existiert bereits, Zugang wurde freigeschaltet." };
  }
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: { locale: "de", ...meta } });
  if (error || !data.user) throw new Error(`Einladung fehlgeschlagen: ${error?.message ?? "unbekannt"}`);
  await admin.from("tenant_memberships").upsert({ tenant_id: tenantId, user_id: data.user.id, role, status: "invited", invited_by: invitedBy }, { onConflict: "tenant_id,user_id" });
  return { userId: data.user.id, invited: true, message: "Einladung per E-Mail versendet." };
}

export async function createStudent(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const s = studentInput(fd);
  if (!s.success) return { ok: false, message: issues(s.error) };
  const l = licenseInput(fd);
  if (!l.success) return { ok: false, message: issues(l.error) };
  const { data: student, error } = await ctx.db.from("students").insert({ ...s.data, tenant_id: ctx.tenantId }).select("id").single();
  if (error || !student) return { ok: false, message: error?.code === "23505" ? "Schülernummer oder E-Mail ist bereits vergeben." : (error?.message ?? "Anlage fehlgeschlagen") };
  const { data: lic, error: licErr } = await ctx.db.from("student_licenses").insert({ ...l.data, tenant_id: ctx.tenantId, student_id: student.id }).select("id").single();
  if (licErr || !lic) return { ok: false, message: `Schüler angelegt, Ausbildung fehlgeschlagen: ${licErr?.message ?? "unbekannt"}` };
  await createDocumentChecklist(ctx.db, ctx.tenantId, student.id, lic.id, l.data.license_code, { accompanied: l.data.accompanied_driving, minor: isMinor(s.data.date_of_birth) });
  let inviteMsg = "";
  if (s.data.email && fd.get("send_invite") === "on") {
    try {
      const inv = await inviteMember(ctx.tenantId, s.data.email, "student", ctx.userId, { first_name: s.data.first_name, last_name: s.data.last_name });
      const admin = createSupabaseAdminClient();
      await admin.from("students").update({ user_id: inv.userId }).eq("id", student.id).is("user_id", null);
      inviteMsg = ` ${inv.message}`;
    } catch (e) {
      inviteMsg = ` ${(e as Error).message}`;
    }
  }
  revalidatePath("/verwaltung/schueler");
  redirect(`/verwaltung/schueler/${student.id}?hinweis=${encodeURIComponent(`Schüler angelegt.${inviteMsg}`)}`);
}

export async function inviteStudentAction(studentId: string): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const { data: st } = await ctx.db.from("students").select("id, email, first_name, last_name, user_id").eq("id", studentId).single();
  if (!st) return { ok: false, message: "Schüler nicht gefunden." };
  if (!st.email) return { ok: false, message: "Ohne E-Mail-Adresse kann keine Einladung versendet werden." };
  try {
    const inv = await inviteMember(ctx.tenantId, st.email, "student", ctx.userId, { first_name: st.first_name, last_name: st.last_name });
    const admin = createSupabaseAdminClient();
    await admin.from("students").update({ user_id: inv.userId }).eq("id", st.id).is("user_id", null);
    revalidatePath(`/verwaltung/schueler/${studentId}`);
    return { ok: true, message: inv.message };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

/** Stammdaten speichern mit Optimistic Locking (row_version). */
export async function updateStudent(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const id = z.string().uuid().parse(fd.get("id"));
  const rowVersion = z.coerce.number().int().parse(fd.get("row_version"));
  const s = studentInput(fd);
  if (!s.success) return { ok: false, message: issues(s.error) };
  const { data: current } = await ctx.db.from("students").select("row_version, updated_at").eq("id", id).single();
  if (!current) return { ok: false, message: "Schüler nicht gefunden." };
  if (current.row_version !== rowVersion) return { ok: false, message: `Konflikt: Der Datensatz wurde zwischenzeitlich geändert (${new Date(current.updated_at).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}). Bitte Seite neu laden und Änderungen erneut eintragen.` };
  const { data, error } = await ctx.db.from("students").update(s.data).eq("id", id).eq("row_version", rowVersion).select("id");
  if (error) return { ok: false, message: error.code === "23505" ? "Schülernummer ist bereits vergeben." : error.message };
  if (!data?.length) return { ok: false, message: "Konflikt: Der Datensatz wurde gerade von jemand anderem gespeichert. Bitte neu laden." };
  revalidatePath(`/verwaltung/schueler/${id}`);
  revalidatePath("/verwaltung/schueler");
  return { ok: true, message: "Stammdaten gespeichert." };
}

export async function updateStudentNotes(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const id = z.string().uuid().parse(fd.get("id"));
  const notes = z.string().max(5000).parse(fd.get("notes_internal") ?? "");
  const { error } = await ctx.db.from("students").update({ notes_internal: notes.trim() || null }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/verwaltung/schueler/${id}`);
  return { ok: true, message: "Notizen gespeichert." };
}

export async function addStudentLicense(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const studentId = z.string().uuid().parse(fd.get("student_id"));
  const l = licenseInput(fd);
  if (!l.success) return { ok: false, message: issues(l.error) };
  const { data: st } = await ctx.db.from("students").select("date_of_birth").eq("id", studentId).single();
  const { data: lic, error } = await ctx.db.from("student_licenses").insert({ ...l.data, tenant_id: ctx.tenantId, student_id: studentId }).select("id").single();
  if (error || !lic) return { ok: false, message: error?.code === "23505" ? "Diese Klasse ist für den Schüler bereits angelegt." : (error?.message ?? "Fehler") };
  await createDocumentChecklist(ctx.db, ctx.tenantId, studentId, lic.id, l.data.license_code, { accompanied: l.data.accompanied_driving, minor: isMinor(st?.date_of_birth ?? null) });
  revalidatePath(`/verwaltung/schueler/${studentId}`);
  return { ok: true, message: `Ausbildung Klasse ${l.data.license_code} angelegt.` };
}

const LicenseUpdateSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  row_version: z.coerce.number().int(),
  transmission: z.enum(["manual", "automatic"]),
  primary_instructor_id: z.string().uuid().nullable(),
  status: z.enum(["active", "paused", "completed", "cancelled"]),
  accompanied_driving: z.boolean(),
});

export async function updateStudentLicense(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const p = LicenseUpdateSchema.safeParse({ id: fd.get("id"), student_id: fd.get("student_id"), row_version: fd.get("row_version"), transmission: fd.get("transmission"), primary_instructor_id: opt(fd.get("primary_instructor_id")), status: fd.get("status"), accompanied_driving: fd.get("accompanied_driving") === "on" });
  if (!p.success) return { ok: false, message: issues(p.error) };
  const { id, student_id, row_version, ...patch } = p.data;
  const { data, error } = await ctx.db.from("student_licenses").update(patch).eq("id", id).eq("row_version", row_version).select("id");
  if (error) return { ok: false, message: error.message };
  if (!data?.length) return { ok: false, message: "Konflikt: Die Ausbildung wurde zwischenzeitlich geändert. Bitte Seite neu laden." };
  if (patch.status === "active") await ctx.db.from("students").update({ status: "active" }).eq("id", student_id).in("status", ["lead", "registered", "paused"]);
  revalidatePath(`/verwaltung/schueler/${student_id}`);
  return { ok: true, message: "Ausbildung gespeichert." };
}

/** Dokument prüfen: freigeben oder mit Grund ablehnen. */
export async function reviewDocument(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const p = z.object({ id: z.string().uuid(), decision: z.enum(["verified", "rejected"]), reason: z.string().max(500).nullable(), expires_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable() })
    .safeParse({ id: fd.get("id"), decision: fd.get("decision"), reason: opt(fd.get("reason")), expires_at: opt(fd.get("expires_at")) });
  if (!p.success) return { ok: false, message: issues(p.error) };
  if (p.data.decision === "rejected" && !p.data.reason) return { ok: false, message: "Bitte einen Ablehnungsgrund angeben." };
  const { data: doc } = await ctx.db.from("documents").select("id, student_id, title, students(user_id)").eq("id", p.data.id).single();
  if (!doc) return { ok: false, message: "Dokument nicht gefunden." };
  const { error } = await ctx.db.from("documents").update({ status: p.data.decision, verified_by: ctx.userId, verified_at: new Date().toISOString(), rejection_reason: p.data.decision === "rejected" ? p.data.reason : null, expires_at: p.data.expires_at }).eq("id", p.data.id);
  if (error) return { ok: false, message: error.message };
  const userId = (doc.students as unknown as { user_id: string | null } | null)?.user_id;
  if (userId && p.data.decision === "rejected") {
    await ctx.db.from("notifications").insert({ tenant_id: ctx.tenantId, user_id: userId, notification_type: "document_missing", title: "Dokument abgelehnt", body: `Das Dokument „${doc.title}“ wurde abgelehnt: ${p.data.reason}. Bitte lade es erneut hoch.`, data: { document_id: doc.id }, channels: ["push", "in_app"], dedupe_key: `document_rejected:${doc.id}:${Date.now()}` });
  }
  revalidatePath("/verwaltung/dokumente");
  if (doc.student_id) revalidatePath(`/verwaltung/schueler/${doc.student_id}`);
  return { ok: true, message: p.data.decision === "verified" ? "Dokument freigegeben." : "Dokument abgelehnt, Schüler wurde informiert." };
}

const ContractSchema = z.object({
  student_id: z.string().uuid(),
  student_license_id: z.string().uuid().nullable(),
  price_list_id: z.string().uuid().nullable(),
  cancellation_policy_id: z.string().uuid().nullable(),
  contract_number: z.string().max(40).nullable(),
  status: z.enum(["draft", "sent", "signed", "active", "terminated", "completed"]).default("draft"),
  signed_at: z.string().nullable(),
  signature_method: z.enum(["on_paper", "simple_electronic", "advanced_electronic", "qualified_electronic"]).nullable(),
  terms_version: z.string().max(40).nullable(),
});

export async function createContract(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const p = ContractSchema.safeParse({ student_id: fd.get("student_id"), student_license_id: opt(fd.get("student_license_id")), price_list_id: opt(fd.get("price_list_id")), cancellation_policy_id: opt(fd.get("cancellation_policy_id")), contract_number: opt(fd.get("contract_number")), status: opt(fd.get("status")) ?? "draft", signed_at: opt(fd.get("signed_at")), signature_method: opt(fd.get("signature_method")), terms_version: opt(fd.get("terms_version")) });
  if (!p.success) return { ok: false, message: issues(p.error) };
  const signedAt = p.data.signed_at ? new Date(p.data.signed_at).toISOString() : null;
  const { data: c, error } = await ctx.db.from("contracts").insert({ ...p.data, signed_at: signedAt, tenant_id: ctx.tenantId }).select("id").single();
  if (error || !c) return { ok: false, message: error?.message ?? "Fehler" };
  if (p.data.student_license_id) await ctx.db.from("student_licenses").update({ contract_id: c.id }).eq("id", p.data.student_license_id);
  revalidatePath(`/verwaltung/schueler/${p.data.student_id}`);
  return { ok: true, message: "Vertrag angelegt." };
}

export async function updateContractStatus(contractId: string, studentId: string, status: string): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const st = z.enum(["draft", "sent", "signed", "active", "terminated", "completed"]).parse(status);
  const patch: TablesUpdate<"contracts"> = { status: st };
  if (st === "signed" || st === "active") patch.signed_at = new Date().toISOString();
  const { error } = await ctx.db.from("contracts").update(patch).eq("id", contractId);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/verwaltung/schueler/${studentId}`);
  return { ok: true, message: "Vertragsstatus gesetzt." };
}

export async function updateDataRequest(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const p = z.object({ id: z.string().uuid(), student_id: z.string().uuid().nullable(), status: z.enum(["open", "in_progress", "completed", "rejected"]), reason: z.string().max(1000).nullable(), legal_hold_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable() })
    .safeParse({ id: fd.get("id"), student_id: opt(fd.get("student_id")), status: fd.get("status"), reason: opt(fd.get("reason")), legal_hold_until: opt(fd.get("legal_hold_until")) });
  if (!p.success) return { ok: false, message: issues(p.error) };
  const { data: req } = await ctx.db.from("data_requests").select("id, kind, user_id").eq("id", p.data.id).single();
  if (!req) return { ok: false, message: "Anfrage nicht gefunden." };
  const patch: TablesUpdate<"data_requests"> = { status: p.data.status, handled_by: ctx.userId, legal_hold_until: p.data.legal_hold_until };
  if (p.data.reason) patch.reason = p.data.reason;
  if (p.data.status === "completed" || p.data.status === "rejected") patch.completed_at = new Date().toISOString();
  if (p.data.status === "completed" && req.kind === "export" && p.data.student_id) patch.export_path = `/verwaltung/schueler/${p.data.student_id}/export`;
  const { error } = await ctx.db.from("data_requests").update(patch).eq("id", p.data.id);
  if (error) return { ok: false, message: error.message };
  if (p.data.status === "completed" && req.kind === "deletion" && p.data.student_id) {
    // Pseudonymisierung in der Datenbank (Lern- und Kontaktdaten weg, Nachweise bleiben), danach Dateien und Login entfernen.
    const { data: result, error: rpcError } = await ctx.db.rpc("anonymize_student", { p_student_id: p.data.student_id, ...(p.data.legal_hold_until ? { p_legal_hold_until: p.data.legal_hold_until } : {}) });
    if (rpcError) return { ok: false, message: `Löschung fehlgeschlagen: ${rpcError.message}` };
    const r = result as { user_id: string | null; storage_paths: string[]; user_removed: boolean };
    const admin = createSupabaseAdminClient();
    if (r.storage_paths.length > 0) await admin.storage.from("documents").remove(r.storage_paths);
    if (r.user_removed && r.user_id) await admin.auth.admin.deleteUser(r.user_id);
    revalidatePath(`/verwaltung/schueler/${p.data.student_id}`);
    revalidatePath("/verwaltung/schueler");
    return { ok: true, message: `Schüler pseudonymisiert, ${r.storage_paths.length} Dateien gelöscht${r.user_removed ? ", Zugang entfernt" : ""}. Rechnungen, Verträge und Ausbildungsnachweise bleiben bis zum Ende der Aufbewahrungsfrist erhalten.` };
  }
  if (p.data.status === "completed" || p.data.status === "rejected") {
    await ctx.db.from("notifications").insert({ tenant_id: ctx.tenantId, user_id: req.user_id, notification_type: "data_request", title: p.data.status === "completed" ? "Datenschutzanfrage bearbeitet" : "Datenschutzanfrage abgelehnt", body: p.data.status === "completed" ? "Deine Anfrage wurde bearbeitet. Bei Fragen wende dich an die Fahrschule." : `Deine Anfrage wurde abgelehnt. ${p.data.reason ?? ""}`.trim(), data: { data_request_id: req.id }, channels: ["push", "in_app"], dedupe_key: `data_request:${req.id}:${p.data.status}` });
  }
  if (p.data.student_id) revalidatePath(`/verwaltung/schueler/${p.data.student_id}`);
  revalidatePath("/verwaltung/schueler");
  return { ok: true, message: "Anfrage aktualisiert." };
}
