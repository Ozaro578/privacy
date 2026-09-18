"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { berlinToIso, getOfficeContext } from "@/lib/data/admin";
import { theoryUnitsFor } from "@/lib/data/admin-theory";
import type { ActionResult } from "./lessons";

const opt = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
const issues = (e: z.ZodError) => e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");

const ClassSchema = z.object({
  license_code: z.string().min(1).max(5),
  lesson_unit_code: z.string().min(1, "Einheit fehlt").max(10),
  title: z.string().max(200).nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum fehlt"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Uhrzeit fehlt"),
  duration_minutes: z.coerce.number().int().min(30).max(240),
  instructor_id: z.string().uuid().nullable(),
  location_id: z.string().uuid().nullable(),
  capacity: z.coerce.number().int().positive().nullable(),
  is_online: z.boolean(),
  repeat_weeks: z.coerce.number().int().min(1).max(20).default(1),
  status: z.enum(["planned", "running", "completed", "cancelled"]).default("planned"),
});

function classInput(fd: FormData) {
  return ClassSchema.safeParse({ license_code: opt(fd.get("license_code")) ?? "B", lesson_unit_code: opt(fd.get("lesson_unit_code")), title: opt(fd.get("title")), date: fd.get("date"), time: fd.get("time"), duration_minutes: opt(fd.get("duration_minutes")) ?? "90", instructor_id: opt(fd.get("instructor_id")), location_id: opt(fd.get("location_id")), capacity: opt(fd.get("capacity")), is_online: fd.get("is_online") === "on", repeat_weeks: opt(fd.get("repeat_weeks")) ?? "1", status: opt(fd.get("status")) ?? "planned" });
}

async function resolveUnit(licenseCode: string, code: string, title: string | null) {
  const { units } = await theoryUnitsFor(licenseCode);
  const unit = units.find((u) => u.code === code);
  return { title: title ?? unit?.title ?? code, material_kind: unit?.material_kind ?? (code.startsWith("G") ? "basic" : "class_specific") as "basic" | "class_specific" };
}

/** Theorieunterricht anlegen, optional als wöchentliche Serie mit fortlaufenden Einheiten. */
export async function createTheoryClass(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const p = classInput(fd);
  if (!p.success) return { ok: false, message: issues(p.error) };
  const { units } = await theoryUnitsFor(p.data.license_code);
  const { addDays } = await import("@/lib/data/admin");
  const startIdx = Math.max(0, units.findIndex((u) => u.code === p.data.lesson_unit_code));
  let created = 0;
  const errors: string[] = [];
  for (let w = 0; w < p.data.repeat_weeks; w++) {
    const unit = units[(startIdx + w) % Math.max(units.length, 1)];
    const code = unit?.code ?? p.data.lesson_unit_code;
    const meta = await resolveUnit(p.data.license_code, code, w === 0 ? p.data.title : null);
    const start = berlinToIso(addDays(p.data.date, 7 * w), p.data.time);
    const end = new Date(new Date(start).getTime() + p.data.duration_minutes * 60_000).toISOString();
    const { error } = await ctx.db.from("theory_classes").insert({ tenant_id: ctx.tenantId, lesson_unit_code: code, material_kind: meta.material_kind, license_codes: [p.data.license_code], title: meta.title, period: `[${start},${end})`, instructor_id: p.data.instructor_id, location_id: p.data.location_id, capacity: p.data.capacity, is_online: p.data.is_online, status: "planned" });
    if (error) errors.push(error.message); else created++;
  }
  revalidatePath("/verwaltung/theorie");
  revalidatePath("/verwaltung/kalender");
  if (created === 0) return { ok: false, message: errors.join("; ") };
  return { ok: true, message: `${created} Unterrichtstermin${created === 1 ? "" : "e"} angelegt.${errors.length ? ` Fehler: ${errors.join("; ")}` : ""}` };
}

export async function updateTheoryClass(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const id = z.string().uuid().parse(fd.get("id"));
  const p = classInput(fd);
  if (!p.success) return { ok: false, message: issues(p.error) };
  const meta = await resolveUnit(p.data.license_code, p.data.lesson_unit_code, p.data.title);
  const start = berlinToIso(p.data.date, p.data.time);
  const end = new Date(new Date(start).getTime() + p.data.duration_minutes * 60_000).toISOString();
  const { error } = await ctx.db.from("theory_classes").update({ lesson_unit_code: p.data.lesson_unit_code, material_kind: meta.material_kind, license_codes: [p.data.license_code], title: meta.title, period: `[${start},${end})`, instructor_id: p.data.instructor_id, location_id: p.data.location_id, capacity: p.data.capacity, is_online: p.data.is_online, status: p.data.status }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/verwaltung/theorie");
  revalidatePath(`/verwaltung/theorie/${id}`);
  revalidatePath("/verwaltung/kalender");
  return { ok: true, message: "Unterricht gespeichert." };
}

export async function deleteTheoryClass(id: string): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const { count } = await ctx.db.from("attendance").select("id", { count: "exact", head: true }).eq("theory_class_id", id).eq("status", "present");
  if ((count ?? 0) > 0) return { ok: false, message: "Unterricht mit erfassten Anwesenheiten kann nicht gelöscht werden. Bitte stattdessen auf abgesagt setzen." };
  const { error } = await ctx.db.from("theory_classes").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/verwaltung/theorie");
  redirect("/verwaltung/theorie");
}

/** Anwesenheit nacherfassen (manuell, mit Bearbeiter). */
export async function addAttendance(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const p = z.object({ theory_class_id: z.string().uuid(), student_license_id: z.string().uuid("Schüler fehlt"), status: z.enum(["registered", "present", "absent", "excused"]) }).safeParse({ theory_class_id: fd.get("theory_class_id"), student_license_id: opt(fd.get("student_license_id")), status: opt(fd.get("status")) ?? "present" });
  if (!p.success) return { ok: false, message: issues(p.error) };
  const { data: lic } = await ctx.db.from("student_licenses").select("id, student_id").eq("id", p.data.student_license_id).single();
  if (!lic) return { ok: false, message: "Ausbildung nicht gefunden." };
  const present = p.data.status === "present";
  const { error } = await ctx.db.from("attendance").upsert({ tenant_id: ctx.tenantId, theory_class_id: p.data.theory_class_id, student_id: lic.student_id, student_license_id: lic.id, status: p.data.status, check_in_method: "manual", checked_in_at: present ? new Date().toISOString() : null, checked_in_by: ctx.userId }, { onConflict: "theory_class_id,student_id" });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/verwaltung/theorie/${p.data.theory_class_id}`);
  return { ok: true, message: "Anwesenheit erfasst (manuell, mit Bearbeiter protokolliert)." };
}

export async function setAttendanceStatus(attendanceId: string, classId: string, status: "registered" | "present" | "absent" | "excused"): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const { error } = await ctx.db.from("attendance").update({ status, check_in_method: "manual", checked_in_by: ctx.userId, checked_in_at: status === "present" ? new Date().toISOString() : null }).eq("id", attendanceId);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/verwaltung/theorie/${classId}`);
  return { ok: true, message: "Status geändert." };
}

/** Check-in-Code für die Anzeige im Unterrichtsraum (10 Minuten gültig). */
export async function createCheckinCode(classId: string): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const { data, error } = await ctx.db.rpc("create_checkin_token", { p_theory_class_id: classId, p_ttl_seconds: 600 });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/verwaltung/theorie/${classId}`);
  return { ok: true, message: `Check-in-Code (10 Minuten gültig): ${data}` };
}
