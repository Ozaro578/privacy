"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { TablesUpdate } from "@fahrpilot/db";
import { getOfficeContext } from "@/lib/data/admin";
import { resolveRulesFor } from "@/lib/data/student";
import type { ActionResult } from "./lessons";

const opt = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
const issues = (e: z.ZodError) => e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
const Kind = z.enum(["theory", "practical"]);
type Kind = z.infer<typeof Kind>;
type ExamStatus = TablesUpdate<"student_licenses">["theory_exam_status"];
const table = (k: Kind) => (k === "theory" ? ("theory_exams" as const) : ("practical_exams" as const));
const licensePatch = (k: Kind, status: ExamStatus): TablesUpdate<"student_licenses"> => (k === "theory" ? { theory_exam_status: status } : { practical_exam_status: status });

function revalidate(studentId: string | null) {
  revalidatePath("/verwaltung/pruefungen");
  if (studentId) revalidatePath(`/verwaltung/schueler/${studentId}`);
}

async function licenseFor(licenseId: string) {
  const ctx = await getOfficeContext();
  const { data } = await ctx.db.from("student_licenses").select("id, student_id, license_code, acquisition_kind, theory_exam_status, practical_exam_status, theory_exam_passed_at, students(user_id, first_name)").eq("id", licenseId).single();
  return { ctx, license: data as unknown as { id: string; student_id: string; license_code: string; acquisition_kind: string; theory_exam_status: string; practical_exam_status: string; theory_exam_passed_at: string | null; students: { user_id: string | null; first_name: string } | null } | null };
}

/** Prüfung anfragen (Anmeldung bei der Prüforganisation eingeleitet). Legt bei Bedarf einen neuen Versuch an. */
export async function requestExam(licenseId: string, kind: Kind): Promise<ActionResult> {
  const { ctx, license } = await licenseFor(z.string().uuid().parse(licenseId));
  if (!license) return { ok: false, message: "Ausbildung nicht gefunden." };
  const k = Kind.parse(kind);
  const current = k === "theory" ? license.theory_exam_status : license.practical_exam_status;
  if (current === "passed") return { ok: false, message: "Diese Prüfung ist bereits bestanden." };
  if (current === "scheduled" || current === "requested") return { ok: false, message: "Die Prüfung ist bereits angefragt oder terminiert." };
  if (k === "practical" && license.theory_exam_status !== "passed") return { ok: false, message: "Die praktische Prüfung setzt eine bestandene Theorieprüfung voraus." };
  const t = table(k);
  const { data: open } = await ctx.db.from(t).select("id").eq("student_license_id", license.id).is("result", null).order("attempt_no", { ascending: false }).limit(1).maybeSingle();
  if (open) {
    const { error } = await ctx.db.from(t).update({ status: "requested" }).eq("id", open.id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { data: last } = await ctx.db.from(t).select("attempt_no").eq("student_license_id", license.id).order("attempt_no", { ascending: false }).limit(1).maybeSingle();
    const { error } = await ctx.db.from(t).insert({ tenant_id: ctx.tenantId, student_license_id: license.id, status: "requested", attempt_no: (last?.attempt_no ?? 0) + 1 });
    if (error) return { ok: false, message: error.message };
  }
  await ctx.db.from("student_licenses").update(licensePatch(k, "requested")).eq("id", license.id);
  revalidate(license.student_id);
  return { ok: true, message: "Prüfung angefragt." };
}

const ScheduleSchema = z.object({
  exam_id: z.string().uuid(),
  kind: Kind,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum fehlt"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Uhrzeit fehlt"),
  examining_body: z.string().min(2, "Prüforganisation fehlt").max(80),
  language_code: z.string().max(5).nullable(),
  location_text: z.string().max(200).nullable(),
  instructor_id: z.string().uuid().nullable(),
  vehicle_id: z.string().uuid().nullable(),
  notes: z.string().max(1000).nullable(),
});

/** Prüfung terminieren (Datum, Prüforganisation, Sprache bzw. Fahrlehrer/Fahrzeug/Treffpunkt). */
export async function scheduleExam(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const p = ScheduleSchema.safeParse({ exam_id: fd.get("exam_id"), kind: fd.get("kind"), date: fd.get("date"), time: fd.get("time"), examining_body: opt(fd.get("examining_body")), language_code: opt(fd.get("language_code")), location_text: opt(fd.get("location_text")), instructor_id: opt(fd.get("instructor_id")), vehicle_id: opt(fd.get("vehicle_id")), notes: opt(fd.get("notes")) });
  if (!p.success) return { ok: false, message: issues(p.error) };
  const ctx = await getOfficeContext();
  const { berlinToIso } = await import("@/lib/data/admin");
  const scheduledAt = berlinToIso(p.data.date, p.data.time);
  const t = table(p.data.kind);
  const { data: exam } = await ctx.db.from(t).select("id, student_license_id, result").eq("id", p.data.exam_id).single();
  if (!exam) return { ok: false, message: "Prüfung nicht gefunden." };
  if (exam.result) return { ok: false, message: "Ein abgeschlossener Versuch kann nicht neu terminiert werden." };
  const { license } = await licenseFor(exam.student_license_id);
  if (!license) return { ok: false, message: "Ausbildung nicht gefunden." };
  const rules = await resolveRulesFor(ctx.db, license.license_code, license.acquisition_kind as "first" | "extension");
  if (p.data.kind === "theory") {
    const allowed = rules.examTheory?.rules.exam_languages;
    if (p.data.language_code && allowed && !allowed.includes(p.data.language_code)) return { ok: false, message: `Prüfungssprache ${p.data.language_code} ist laut Regelversion nicht zugelassen (${allowed.join(", ")}).` };
    const { error } = await ctx.db.from("theory_exams").update({ status: "scheduled", scheduled_at: scheduledAt, examining_body: p.data.examining_body, language_code: p.data.language_code, location_text: p.data.location_text, notes: p.data.notes, rule_version_id: rules.examTheory?.version.id ?? null }).eq("id", exam.id);
    if (error) return { ok: false, message: error.message };
  } else {
    if (license.theory_exam_passed_at && rules.examPractical?.rules.theory_validity_months) {
      const limit = new Date(license.theory_exam_passed_at);
      limit.setMonth(limit.getMonth() + rules.examPractical.rules.theory_validity_months);
      if (new Date(scheduledAt) > limit) return { ok: false, message: `Die Theorieprüfung ist am ${limit.toLocaleDateString("de-DE")} nicht mehr gültig (${rules.examPractical.rules.theory_validity_months} Monate). Bitte früher terminieren oder Theorieprüfung wiederholen.` };
    }
    const { error } = await ctx.db.from("practical_exams").update({ status: "scheduled", scheduled_at: scheduledAt, examining_body: p.data.examining_body, meeting_point: p.data.location_text, instructor_id: p.data.instructor_id, vehicle_id: p.data.vehicle_id, notes: p.data.notes, rule_version_id: rules.examPractical?.version.id ?? null }).eq("id", exam.id);
    if (error) return { ok: false, message: error.message };
  }
  await ctx.db.from("student_licenses").update(licensePatch(p.data.kind, "scheduled")).eq("id", license.id);
  const userId = license.students?.user_id;
  if (userId) {
    const when = new Date(scheduledAt).toLocaleString("de-DE", { timeZone: "Europe/Berlin", dateStyle: "medium", timeStyle: "short" });
    await ctx.db.from("notifications").insert({ tenant_id: ctx.tenantId, user_id: userId, notification_type: "exam_scheduled", title: p.data.kind === "theory" ? "Theorieprüfung terminiert" : "Praktische Prüfung terminiert", body: `Deine ${p.data.kind === "theory" ? "Theorieprüfung" : "praktische Prüfung"} findet am ${when} Uhr statt (${p.data.examining_body}).`, data: { exam_id: exam.id, kind: p.data.kind }, channels: ["push", "in_app"], dedupe_key: `exam_scheduled:${exam.id}:${scheduledAt}` });
  }
  revalidate(license.student_id);
  return { ok: true, message: "Prüfung terminiert." };
}

const ResultSchema = z.object({ exam_id: z.string().uuid(), kind: Kind, result: z.enum(["passed", "failed"]), error_points: z.coerce.number().int().min(0).nullable(), examiner_feedback: z.string().max(2000).nullable(), result_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable() });

/** Ergebnis eintragen. Bei bestanden: Status und Datum an der Ausbildung setzen. Bei nicht bestanden: Sperrfrist aus der Regel exam_practical. */
export async function recordExamResult(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const p = ResultSchema.safeParse({ exam_id: fd.get("exam_id"), kind: fd.get("kind"), result: fd.get("result"), error_points: opt(fd.get("error_points")), examiner_feedback: opt(fd.get("examiner_feedback")), result_date: opt(fd.get("result_date")) });
  if (!p.success) return { ok: false, message: issues(p.error) };
  const ctx = await getOfficeContext();
  const t = table(p.data.kind);
  const { data: exam } = await ctx.db.from(t).select("id, student_license_id, result, scheduled_at, attempt_no").eq("id", p.data.exam_id).single();
  if (!exam) return { ok: false, message: "Prüfung nicht gefunden." };
  if (exam.result) return { ok: false, message: "Für diesen Versuch ist bereits ein Ergebnis eingetragen." };
  const { license } = await licenseFor(exam.student_license_id);
  if (!license) return { ok: false, message: "Ausbildung nicht gefunden." };
  const resultAt = p.data.result_date ? new Date(`${p.data.result_date}T12:00:00Z`).toISOString() : (exam.scheduled_at ?? new Date().toISOString());
  const resultDate = resultAt.slice(0, 10);
  const { error } = p.data.kind === "theory"
    ? await ctx.db.from("theory_exams").update({ status: p.data.result, result: p.data.result, error_points: p.data.error_points, result_at: resultAt, notes: p.data.examiner_feedback }).eq("id", exam.id)
    : await ctx.db.from("practical_exams").update({ status: p.data.result, result: p.data.result, result_at: resultAt, examiner_feedback: p.data.examiner_feedback }).eq("id", exam.id);
  if (error) return { ok: false, message: error.message };
  const rules = await resolveRulesFor(ctx.db, license.license_code, license.acquisition_kind as "first" | "extension");
  let message: string;
  if (p.data.result === "passed") {
    const lpatch = p.data.kind === "theory" ? { theory_exam_status: "passed" as const, theory_exam_passed_at: resultDate } : { practical_exam_status: "passed" as const, practical_exam_passed_at: resultDate };
    await ctx.db.from("student_licenses").update(lpatch).eq("id", license.id);
    if (p.data.kind === "practical") {
      await ctx.db.from("student_licenses").update({ status: "completed" }).eq("id", license.id);
      const { data: others } = await ctx.db.from("student_licenses").select("id").eq("student_id", license.student_id).eq("status", "active");
      if (!others?.length) await ctx.db.from("students").update({ status: "completed" }).eq("id", license.student_id);
    }
    message = p.data.kind === "theory" ? "Theorieprüfung als bestanden eingetragen." : "Praktische Prüfung als bestanden eingetragen, Ausbildung abgeschlossen.";
  } else {
    await ctx.db.from("student_licenses").update(licensePatch(p.data.kind, "failed")).eq("id", license.id);
    const wait = rules.examPractical?.rules.retry_wait_days;
    if (wait !== undefined) {
      const earliest = new Date(resultAt);
      earliest.setDate(earliest.getDate() + wait);
      message = `Als nicht bestanden eingetragen. Sperrfrist: Wiederholung frühestens am ${earliest.toLocaleDateString("de-DE")} (${wait} Tage laut Regelversion ${rules.examPractical?.version.version}${rules.examPractical?.needsVerification ? ", fachlich zu verifizieren" : ""}).`;
    } else {
      message = "Als nicht bestanden eingetragen. Für diese Klasse ist keine Sperrfrist hinterlegt (Regel exam_practical prüfen).";
    }
  }
  const userId = license.students?.user_id;
  if (userId) {
    await ctx.db.from("notifications").insert({ tenant_id: ctx.tenantId, user_id: userId, notification_type: "exam_result", title: p.data.result === "passed" ? "Prüfung bestanden" : "Prüfung nicht bestanden", body: p.data.result === "passed" ? `Herzlichen Glückwunsch, du hast die ${p.data.kind === "theory" ? "Theorieprüfung" : "praktische Prüfung"} bestanden.` : `Die ${p.data.kind === "theory" ? "Theorieprüfung" : "praktische Prüfung"} wurde leider nicht bestanden. Deine Fahrschule meldet sich wegen des nächsten Versuchs.`, data: { exam_id: exam.id, kind: p.data.kind, result: p.data.result }, channels: ["push", "in_app"], dedupe_key: `exam_result:${exam.id}` });
  }
  revalidate(license.student_id);
  return { ok: true, message };
}

/** Termin absagen: Versuch bleibt offen, Status der Ausbildung zurück auf freigegeben. */
export async function cancelExam(examId: string, kind: Kind): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const k = Kind.parse(kind);
  const t = table(k);
  const { data: exam } = await ctx.db.from(t).select("id, student_license_id, result").eq("id", z.string().uuid().parse(examId)).single();
  if (!exam || exam.result) return { ok: false, message: "Prüfung nicht gefunden oder bereits abgeschlossen." };
  const { error } = await ctx.db.from(t).update({ status: "ready", scheduled_at: null }).eq("id", exam.id);
  if (error) return { ok: false, message: error.message };
  await ctx.db.from("student_licenses").update(licensePatch(k, "ready")).eq("id", exam.student_license_id);
  const { license } = await licenseFor(exam.student_license_id);
  revalidate(license?.student_id ?? null);
  return { ok: true, message: "Termin abgesagt, Prüfung bleibt freigegeben." };
}
