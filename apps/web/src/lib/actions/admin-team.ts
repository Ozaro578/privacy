"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getOfficeContext } from "@/lib/data/admin";
import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { ActionResult } from "./lessons";

const opt = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
const issues = (e: z.ZodError) => e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
const StaffRole = z.enum(["instructor", "office", "admin", "owner"]);

/** Mitarbeiter einladen (Admin/Owner). Fahrlehrer erhalten sofort ein Fahrlehrerprofil. */
export async function inviteTeamMember(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const p = z.object({ email: z.string().email("E-Mail ungültig"), role: StaffRole, first_name: z.string().max(80).nullable(), last_name: z.string().max(80).nullable(), display_name: z.string().max(80).nullable() })
    .safeParse({ email: opt(fd.get("email"))?.toLowerCase(), role: fd.get("role"), first_name: opt(fd.get("first_name")), last_name: opt(fd.get("last_name")), display_name: opt(fd.get("display_name")) });
  if (!p.success) return { ok: false, message: issues(p.error) };
  if (p.data.role === "owner" && session.role !== "owner") return { ok: false, message: "Nur der Inhaber kann weitere Inhaber einladen." };
  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin.from("users").select("id, first_name, last_name").eq("email", p.data.email).maybeSingle();
  let userId: string;
  let message: string;
  if (existing) {
    userId = existing.id;
    const { data: m } = await admin.from("tenant_memberships").select("id, status, role").eq("tenant_id", session.tenantId).eq("user_id", userId).maybeSingle();
    if (m && m.status === "active") return { ok: false, message: `Diese Person ist bereits Mitglied (${m.role}).` };
    await admin.from("tenant_memberships").upsert({ tenant_id: session.tenantId, user_id: userId, role: p.data.role, status: "active", invited_by: session.userId }, { onConflict: "tenant_id,user_id" });
    message = "Nutzerkonto existiert bereits, Zugang wurde freigeschaltet.";
  } else {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(p.data.email, { data: { locale: "de", first_name: p.data.first_name ?? "", last_name: p.data.last_name ?? "" } });
    if (error || !data.user) return { ok: false, message: `Einladung fehlgeschlagen: ${error?.message ?? "unbekannt"}` };
    userId = data.user.id;
    await admin.from("tenant_memberships").upsert({ tenant_id: session.tenantId, user_id: userId, role: p.data.role, status: "invited", invited_by: session.userId }, { onConflict: "tenant_id,user_id" });
    await admin.from("users").update({ active_tenant_id: session.tenantId }).eq("id", userId).is("active_tenant_id", null);
    message = "Einladung per E-Mail versendet.";
  }
  if (p.data.role === "instructor") {
    const fallback = [p.data.first_name ?? existing?.first_name, p.data.last_name ?? existing?.last_name].filter(Boolean).join(" ");
    const name = p.data.display_name ?? (fallback || p.data.email);
    await admin.from("instructors").upsert({ tenant_id: session.tenantId, user_id: userId, display_name: name }, { onConflict: "tenant_id,user_id", ignoreDuplicates: true });
  }
  revalidatePath("/verwaltung/team");
  return { ok: true, message };
}

export async function changeMemberRole(membershipId: string, role: string): Promise<ActionResult> {
  const session = await requireAdmin();
  const r = StaffRole.safeParse(role);
  if (!r.success) return { ok: false, message: "Ungültige Rolle." };
  const ctx = await getOfficeContext();
  const { data: m } = await ctx.db.from("tenant_memberships").select("id, user_id, role").eq("id", membershipId).single();
  if (!m) return { ok: false, message: "Mitglied nicht gefunden." };
  if ((m.role === "owner" || r.data === "owner") && session.role !== "owner") return { ok: false, message: "Nur der Inhaber kann die Inhaberrolle vergeben oder entziehen." };
  if (m.user_id === session.userId) return { ok: false, message: "Die eigene Rolle kann nicht geändert werden." };
  const { error } = await ctx.db.from("tenant_memberships").update({ role: r.data }).eq("id", membershipId);
  if (error) return { ok: false, message: error.message };
  if (r.data === "instructor") {
    const { data: u } = await ctx.db.from("users").select("first_name, last_name, email").eq("id", m.user_id).maybeSingle();
    await ctx.db.from("instructors").upsert({ tenant_id: ctx.tenantId, user_id: m.user_id, display_name: [u?.first_name, u?.last_name].filter(Boolean).join(" ") || (u?.email ?? "Fahrlehrer") }, { onConflict: "tenant_id,user_id", ignoreDuplicates: true });
  }
  revalidatePath("/verwaltung/team");
  revalidatePath(`/verwaltung/team/${membershipId}`);
  return { ok: true, message: "Rolle geändert. Die Person muss sich neu anmelden, damit die Rolle im Token greift." };
}

export async function setMemberStatus(membershipId: string, status: "active" | "disabled"): Promise<ActionResult> {
  const session = await requireAdmin();
  const ctx = await getOfficeContext();
  const { data: m } = await ctx.db.from("tenant_memberships").select("id, user_id, role").eq("id", membershipId).single();
  if (!m) return { ok: false, message: "Mitglied nicht gefunden." };
  if (m.user_id === session.userId) return { ok: false, message: "Der eigene Zugang kann nicht deaktiviert werden." };
  if (m.role === "owner" && session.role !== "owner") return { ok: false, message: "Nur der Inhaber kann Inhaber deaktivieren." };
  const { error } = await ctx.db.from("tenant_memberships").update({ status }).eq("id", membershipId);
  if (error) return { ok: false, message: error.message };
  await ctx.db.from("instructors").update({ active: status === "active" }).eq("user_id", m.user_id);
  revalidatePath("/verwaltung/team");
  revalidatePath(`/verwaltung/team/${membershipId}`);
  return { ok: true, message: status === "disabled" ? "Zugang deaktiviert." : "Zugang aktiviert." };
}

const InstructorSchema = z.object({
  id: z.string().uuid(),
  membership_id: z.string().uuid(),
  display_name: z.string().min(1, "Anzeigename fehlt").max(80),
  license_classes: z.array(z.string()),
  teaches_theory: z.boolean(),
  teaches_manual: z.boolean(),
  teaches_automatic: z.boolean(),
  location_id: z.string().uuid().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable(),
  lesson_default_minutes: z.coerce.number().int().min(30).max(180),
});

export async function updateInstructorProfile(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const ctx = await getOfficeContext();
  const p = InstructorSchema.safeParse({ id: fd.get("id"), membership_id: fd.get("membership_id"), display_name: opt(fd.get("display_name")), license_classes: fd.getAll("license_classes").map(String), teaches_theory: fd.get("teaches_theory") === "on", teaches_manual: fd.get("teaches_manual") === "on", teaches_automatic: fd.get("teaches_automatic") === "on", location_id: opt(fd.get("location_id")), color: opt(fd.get("color")), lesson_default_minutes: opt(fd.get("lesson_default_minutes")) ?? "45" });
  if (!p.success) return { ok: false, message: issues(p.error) };
  if (!p.data.teaches_manual && !p.data.teaches_automatic) return { ok: false, message: "Mindestens eine Getriebeart muss unterrichtet werden." };
  const { id, membership_id, ...patch } = p.data;
  const { error } = await ctx.db.from("instructors").update(patch).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/verwaltung/team/${membership_id}`);
  revalidatePath("/verwaltung/team");
  return { ok: true, message: "Fahrlehrerprofil gespeichert." };
}

const AvailabilitySchema = z.object({ instructor_id: z.string().uuid(), membership_id: z.string().uuid(), weekday: z.coerce.number().int().min(1).max(7), start_time: z.string().regex(/^\d{2}:\d{2}$/), end_time: z.string().regex(/^\d{2}:\d{2}$/), kind: z.enum(["work", "break"]), location_id: z.string().uuid().nullable(), valid_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(), valid_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable() });

export async function addAvailability(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const p = AvailabilitySchema.safeParse({ instructor_id: fd.get("instructor_id"), membership_id: fd.get("membership_id"), weekday: fd.get("weekday"), start_time: fd.get("start_time"), end_time: fd.get("end_time"), kind: opt(fd.get("kind")) ?? "work", location_id: opt(fd.get("location_id")), valid_from: opt(fd.get("valid_from")), valid_until: opt(fd.get("valid_until")) });
  if (!p.success) return { ok: false, message: issues(p.error) };
  if (p.data.end_time <= p.data.start_time) return { ok: false, message: "Ende muss nach dem Beginn liegen." };
  const { membership_id, valid_from, ...row } = p.data;
  const { error } = await ctx.db.from("instructor_availability").insert({ ...row, tenant_id: ctx.tenantId, ...(valid_from ? { valid_from } : {}) });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/verwaltung/team/${membership_id}`);
  return { ok: true, message: p.data.kind === "work" ? "Arbeitszeit angelegt." : "Pause angelegt." };
}

export async function deleteAvailability(id: string, membershipId: string): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const { error } = await ctx.db.from("instructor_availability").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/verwaltung/team/${membershipId}`);
  return { ok: true, message: "Eintrag gelöscht." };
}

const AbsenceSchema = z.object({ instructor_id: z.string().uuid(), membership_id: z.string().uuid(), from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), reason: z.enum(["vacation", "sick", "training", "other"]), note: z.string().max(300).nullable() });

/** Abwesenheit (ganze Tage, inklusive Enddatum). Überschneidungen werden von der Datenbank abgelehnt. */
export async function addAbsence(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const p = AbsenceSchema.safeParse({ instructor_id: fd.get("instructor_id"), membership_id: fd.get("membership_id"), from: fd.get("from"), to: fd.get("to"), reason: opt(fd.get("reason")) ?? "vacation", note: opt(fd.get("note")) });
  if (!p.success) return { ok: false, message: issues(p.error) };
  if (p.data.to < p.data.from) return { ok: false, message: "Ende liegt vor dem Beginn." };
  const { dayBounds, addDays } = await import("@/lib/data/admin");
  const start = dayBounds(p.data.from).start;
  const end = dayBounds(addDays(p.data.to, 1)).start;
  const { error } = await ctx.db.from("instructor_absences").insert({ tenant_id: ctx.tenantId, instructor_id: p.data.instructor_id, period: `[${start},${end})`, reason: p.data.reason, note: p.data.note });
  if (error) return { ok: false, message: error.code === "23P01" ? "Überschneidung mit einer bestehenden Abwesenheit." : error.message };
  revalidatePath(`/verwaltung/team/${p.data.membership_id}`);
  revalidatePath("/verwaltung/kalender");
  return { ok: true, message: "Abwesenheit eingetragen." };
}

export async function deleteAbsence(id: string, membershipId: string): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const { error } = await ctx.db.from("instructor_absences").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/verwaltung/team/${membershipId}`);
  return { ok: true, message: "Abwesenheit gelöscht." };
}
