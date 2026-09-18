"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { berlinToIso, getOfficeContext } from "@/lib/data/admin";
import type { ActionResult } from "./lessons";

const opt = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
const issues = (e: z.ZodError) => e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
const KINDS = ["practice", "overland", "motorway", "night", "special", "exam_prep", "practical_exam", "manual_conversion", "trailer"] as const;

function revalidate(studentId?: string | null) {
  revalidatePath("/verwaltung/kalender");
  revalidatePath("/verwaltung");
  if (studentId) revalidatePath(`/verwaltung/schueler/${studentId}`);
}

function friendly(message: string): string {
  if (message.includes("Zeitüberschneidung") || message.includes("exclusion") || message.includes("überschneid")) return "Überschneidung: Fahrlehrer, Fahrzeug oder Schüler sind in diesem Zeitraum bereits verplant.";
  return message;
}

/** Buchungsanfrage bestätigen (status booked -> confirmed). */
export async function confirmBooking(lessonId: string): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const { data, error } = await ctx.db.rpc("confirm_lesson_booking", { p_lesson_id: z.string().uuid().parse(lessonId) });
  if (error) return { ok: false, message: error.message };
  revalidate(data?.student_id);
  return { ok: true, message: "Buchung bestätigt, Schüler wurde benachrichtigt." };
}

/** Anfrage ablehnen oder Stunde als Fahrschule absagen (rpc cancel_lesson, Stunde entfällt). */
export async function cancelLessonAsSchool(lessonId: string, reason: string): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const { data: lesson } = await ctx.db.from("lessons").select("student_id").eq("id", lessonId).maybeSingle();
  const { error } = await ctx.db.rpc("cancel_lesson", { p_lesson_id: z.string().uuid().parse(lessonId), p_reason: reason.slice(0, 500) || "Abgesagt durch die Fahrschule", p_client_request_id: crypto.randomUUID() });
  if (error) return { ok: false, message: error.message };
  revalidate(lesson?.student_id);
  return { ok: true, message: "Fahrstunde abgesagt." };
}

export async function cancelLessonForm(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return cancelLessonAsSchool(String(fd.get("lesson_id")), String(fd.get("reason") ?? ""));
}

/** Freien Slot löschen (keine Buchung vorhanden). */
export async function deleteOpenSlot(lessonId: string): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const { error, count } = await ctx.db.from("lessons").delete({ count: "exact" }).eq("id", lessonId).eq("status", "open");
  if (error) return { ok: false, message: error.message };
  if (!count) return { ok: false, message: "Slot ist nicht mehr frei und kann nicht gelöscht werden." };
  revalidate();
  return { ok: true, message: "Slot gelöscht." };
}

/** Stunde für einen Schüler buchen (rpc book_lesson mit allen Prüfungen: Klasse, Getriebe, Verfügbarkeit, Fahrzeug). */
export async function bookForStudent(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const p = z.object({ lesson_id: z.string().uuid("Slot fehlt"), student_license_id: z.string().uuid("Schüler fehlt") }).safeParse({ lesson_id: opt(fd.get("lesson_id")), student_license_id: opt(fd.get("student_license_id")) });
  if (!p.success) return { ok: false, message: issues(p.error) };
  const { data, error } = await ctx.db.rpc("book_lesson", { p_lesson_id: p.data.lesson_id, p_student_license_id: p.data.student_license_id, p_client_request_id: crypto.randomUUID() });
  if (error) return { ok: false, message: friendly(error.message) };
  if (data && data.status === "booked") await ctx.db.rpc("confirm_lesson_booking", { p_lesson_id: data.id });
  revalidate(data?.student_id);
  return { ok: true, message: "Fahrstunde gebucht und bestätigt." };
}

const SlotSchema = z.object({
  instructor_id: z.string().uuid("Fahrlehrer fehlt"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum fehlt"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Uhrzeit fehlt"),
  units: z.coerce.number().int().min(1).max(4),
  unit_minutes: z.coerce.number().int().min(30).max(90).default(45),
  vehicle_id: z.string().uuid().nullable(),
  kind: z.enum(KINDS).default("practice"),
  transmission: z.enum(["manual", "automatic"]).nullable(),
  license_codes: z.array(z.string()),
  meeting_point: z.string().max(200).nullable(),
  price_cents: z.coerce.number().int().min(0).nullable(),
  student_license_id: z.string().uuid().nullable(),
  repeat_weeks: z.coerce.number().int().min(1).max(12).default(1),
});

/** Slot anlegen (optional direkt für einen Schüler buchen, optional wöchentlich wiederholen). Überschneidungen meldet die Datenbank. */
export async function createSlot(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const p = SlotSchema.safeParse({ instructor_id: opt(fd.get("instructor_id")), date: fd.get("date"), time: fd.get("time"), units: opt(fd.get("units")) ?? "1", unit_minutes: opt(fd.get("unit_minutes")) ?? "45", vehicle_id: opt(fd.get("vehicle_id")), kind: opt(fd.get("kind")) ?? "practice", transmission: opt(fd.get("transmission")), license_codes: fd.getAll("license_codes").map(String), meeting_point: opt(fd.get("meeting_point")), price_cents: opt(fd.get("price_eur")) ? Math.round(parseFloat(String(fd.get("price_eur")).replace(",", ".")) * 100) : null, student_license_id: opt(fd.get("student_license_id")), repeat_weeks: opt(fd.get("repeat_weeks")) ?? "1" });
  if (!p.success) return { ok: false, message: issues(p.error) };
  const { addDays } = await import("@/lib/data/admin");
  const created: string[] = [];
  const errors: string[] = [];
  for (let w = 0; w < p.data.repeat_weeks; w++) {
    const day = addDays(p.data.date, 7 * w);
    const start = berlinToIso(day, p.data.time);
    const end = new Date(new Date(start).getTime() + p.data.units * p.data.unit_minutes * 60_000).toISOString();
    const { data, error } = await ctx.db.from("lessons").insert({ tenant_id: ctx.tenantId, instructor_id: p.data.instructor_id, vehicle_id: p.data.vehicle_id, kind: p.data.kind, status: "open", period: `[${start},${end})`, units: p.data.units, transmission: p.data.transmission, license_codes: p.data.license_codes, meeting_point: p.data.meeting_point, price_cents: p.data.price_cents, created_by: ctx.userId }).select("id").single();
    if (error || !data) { errors.push(`${new Date(start).toLocaleDateString("de-DE")}: ${error?.code === "23P01" ? "Überschneidung mit einer bestehenden Stunde (Fahrlehrer oder Fahrzeug)" : (error?.message ?? "Fehler")}`); continue; }
    created.push(data.id);
    if (p.data.student_license_id) {
      const { data: booked, error: bookErr } = await ctx.db.rpc("book_lesson", { p_lesson_id: data.id, p_student_license_id: p.data.student_license_id, p_client_request_id: crypto.randomUUID() });
      if (bookErr) errors.push(`${new Date(start).toLocaleDateString("de-DE")}: Slot angelegt, Buchung fehlgeschlagen (${friendly(bookErr.message)})`);
      else if (booked?.status === "booked") await ctx.db.rpc("confirm_lesson_booking", { p_lesson_id: booked.id });
    } else {
      await ctx.db.rpc("offer_lesson_to_waitlist", { p_lesson_id: data.id });
    }
  }
  revalidate();
  if (created.length === 0) return { ok: false, message: errors.join("; ") };
  return { ok: errors.length === 0, message: `${created.length} ${created.length === 1 ? "Slot" : "Slots"} angelegt${p.data.student_license_id ? " und gebucht" : ""}.${errors.length ? ` Probleme: ${errors.join("; ")}` : ""}` };
}

/** Status nach der Stunde setzen: abgeschlossen oder nicht erschienen. */
export async function setLessonOutcome(lessonId: string, outcome: "completed" | "no_show"): Promise<ActionResult> {
  const ctx = await getOfficeContext();
  const { data: lesson } = await ctx.db.from("lessons").select("id, status, student_id, student_license_id").eq("id", lessonId).single();
  if (!lesson) return { ok: false, message: "Fahrstunde nicht gefunden." };
  if (!["booked", "confirmed"].includes(lesson.status)) return { ok: false, message: "Nur gebuchte oder bestätigte Stunden können abgeschlossen werden." };
  const { error } = await ctx.db.from("lessons").update({ status: outcome, completed_at: outcome === "completed" ? new Date().toISOString() : null }).eq("id", lessonId);
  if (error) return { ok: false, message: error.message };
  if (outcome === "no_show" && lesson.student_id) await ctx.db.from("lesson_bookings").insert({ tenant_id: ctx.tenantId, lesson_id: lessonId, student_id: lesson.student_id, student_license_id: lesson.student_license_id, action: "no_show", acted_by: ctx.userId });
  revalidate(lesson.student_id);
  return { ok: true, message: outcome === "completed" ? "Stunde als abgeschlossen markiert." : "Als nicht erschienen markiert." };
}
