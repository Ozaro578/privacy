"use server";
import { allow } from "@/lib/security/rate-limit";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import QRCode from "qrcode";
import { createAiServices, instructorQuery, structureLessonNotes, type LessonNotesDraft } from "@fahrpilot/ai";
import type { Json } from "@fahrpilot/db";
import { publicEnv } from "@/lib/env";
import { getInstructorContext, requireInstructorRecord, loadSkillLabels, loadQueryTopics, runInstructorQuery, localToIso, type QueryResultRow } from "@/lib/data/instructor";
import type { ActionResult } from "./lessons";

const uuid = z.string().uuid();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum im Format JJJJ-MM-TT");
const timeKey = z.string().regex(/^\d{2}:\d{2}$/, "Uhrzeit im Format HH:MM");

function fail(message: string): ActionResult { return { ok: false, message }; }
function friendly(message: string): string {
  if (/exclusion|überschneid|overlap|23P01/i.test(message)) return "Zeitüberschneidung: In diesem Zeitraum gibt es bereits einen Termin (Fahrlehrer, Fahrzeug oder Schüler).";
  return message;
}

// ------------------------------------------------------------------------------------------------
// Heute: Stunde abschließen, nicht erschienen
// ------------------------------------------------------------------------------------------------

export async function completeLessonAction(lessonId: string): Promise<ActionResult> {
  const id = uuid.parse(lessonId);
  const ctx = await getInstructorContext();
  const { data: lesson } = await ctx.db.from("lessons").select("id, status, student_id").eq("id", id).maybeSingle();
  if (!lesson) return fail("Fahrstunde nicht gefunden.");
  if (!lesson.student_id) return fail("Ein freier Slot ohne Schüler kann nicht abgeschlossen werden.");
  if (!["booked", "confirmed"].includes(lesson.status)) return fail(`Die Stunde hat bereits den Status „${lesson.status}“.`);
  const { error } = await ctx.db.from("lessons").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
  if (error) return fail(friendly(error.message));
  revalidatePath("/lehrer");
  revalidatePath("/lehrer/kalender");
  return { ok: true, message: "Stunde abgeschlossen. Jetzt dokumentieren." };
}

export async function noShowLessonAction(lessonId: string): Promise<ActionResult> {
  const id = uuid.parse(lessonId);
  const ctx = await getInstructorContext();
  const { data: lesson } = await ctx.db.from("lessons").select("id, status, student_id, student_license_id, period").eq("id", id).maybeSingle();
  if (!lesson) return fail("Fahrstunde nicht gefunden.");
  if (!lesson.student_id) return fail("Für einen freien Slot gibt es kein Nichterscheinen.");
  if (!["booked", "confirmed"].includes(lesson.status)) return fail(`Die Stunde hat bereits den Status „${lesson.status}“.`);
  const { error } = await ctx.db.from("lessons").update({ status: "no_show" }).eq("id", id);
  if (error) return fail(friendly(error.message));
  const { error: bErr } = await ctx.db.from("lesson_bookings").insert({ tenant_id: ctx.tenantId, lesson_id: id, student_id: lesson.student_id, student_license_id: lesson.student_license_id, action: "no_show", acted_by: ctx.userId, hours_before_start: 0, client_request_id: crypto.randomUUID(), note: "Vom Fahrlehrer als nicht erschienen markiert" });
  if (bErr) return fail(bErr.message);
  revalidatePath("/lehrer");
  revalidatePath("/lehrer/kalender");
  return { ok: true, message: "Als nicht erschienen markiert. Das Büro prüft die Ausfallgebühr nach Vertrag." };
}

// ------------------------------------------------------------------------------------------------
// Schüler: KI-Abfrage, Notizen, Prüfungsfreigabe
// ------------------------------------------------------------------------------------------------

export type InstructorQueryAnswer = { kind: "result"; title: string; rows: QueryResultRow[]; ruleBased: boolean } | { kind: "clarification"; text: string };

export async function instructorQueryAction(question: string): Promise<InstructorQueryAnswer> {
  const q = z.string().min(2).max(500).parse(question.trim());
  const ctx = await getInstructorContext();
  const topics = await loadQueryTopics(ctx.db);
  if (!(await allow("instructorAiDay", ctx.userId))) return { kind: "clarification", text: "Das Tageskontingent für KI-Abfragen ist erreicht. Morgen geht es weiter." };
  const services = createAiServices();
  const res = await instructorQuery({ provider: services.fast, model: services.models.fast }, { question: q, topics });
  if (res.query.type === "unknown") return { kind: "clarification", text: res.query.clarification };
  const out = await runInstructorQuery(ctx, res.query);
  return { kind: "result", title: out.title, rows: out.rows, ruleBased: res.diagnostics.rule_based };
}

export async function updateStudentNotesAction(studentId: string, notes: string): Promise<ActionResult> {
  const id = uuid.parse(studentId);
  const text = z.string().max(4000).parse(notes);
  const ctx = await getInstructorContext();
  const { error } = await ctx.db.rpc("update_student_notes", { p_student_id: id, p_notes: text });
  if (error) return fail(error.message);
  revalidatePath("/lehrer/schueler");
  return { ok: true, message: "Notizen gespeichert." };
}

export async function releaseExamAction(licenseId: string, kind: "theory" | "practical"): Promise<ActionResult> {
  const id = uuid.parse(licenseId);
  const k = z.enum(["theory", "practical"]).parse(kind);
  const ctx = await getInstructorContext();
  const { error } = await ctx.db.rpc("release_exam", { p_student_license_id: id, p_kind: k });
  if (error) return fail(error.message);
  revalidatePath(`/lehrer/schueler/${id}`);
  revalidatePath("/lehrer");
  return { ok: true, message: k === "theory" ? "Für die Theorieprüfung freigegeben. Der Schüler wurde benachrichtigt." : "Für die praktische Prüfung freigegeben. Der Schüler wurde benachrichtigt." };
}

// ------------------------------------------------------------------------------------------------
// Dokumentation
// ------------------------------------------------------------------------------------------------

const EvaluationSchema = z.object({
  lessonId: uuid,
  contents: z.array(z.string().min(1).max(64)).max(40).default([]),
  ratings: z.array(z.object({ skill_code: z.string().min(1).max(64), rating: z.number().int().min(1).max(5) })).max(40).default([]),
  comment: z.string().max(4000).default(""),
  nextGoals: z.array(z.string().min(1).max(300)).max(10).default([]),
  overallRating: z.number().int().min(1).max(5).nullable().default(null),
  sharedWithStudent: z.boolean().default(true),
  aiDraft: z.unknown().nullable().default(null),
  aiTranscript: z.string().max(20000).nullable().default(null),
  aiDraftModel: z.string().max(120).nullable().default(null),
  aiConfirmed: z.boolean().default(false),
});
export type EvaluationInput = z.input<typeof EvaluationSchema>;

export async function saveEvaluationAction(raw: EvaluationInput): Promise<ActionResult> {
  const input = EvaluationSchema.parse(raw);
  const ctx = await getInstructorContext();
  const { db } = ctx;
  const { data: lesson } = await db.from("lessons").select("id, status, instructor_id, student_id, student_license_id, students(user_id, first_name)").eq("id", input.lessonId).maybeSingle();
  if (!lesson) return fail("Fahrstunde nicht gefunden.");
  if (!lesson.student_license_id || !lesson.student_id) return fail("Diese Stunde hat keinen Schüler und kann nicht dokumentiert werden.");
  if (!ctx.isOffice && ctx.instructor?.id !== lesson.instructor_id) return fail("Nur der Fahrlehrer dieser Stunde darf dokumentieren.");
  const instructorId = ctx.instructor?.id ?? lesson.instructor_id;
  const skills = await loadSkillLabels(db);
  const allowed = new Set(skills.map((s) => s.code));
  const contents = [...new Set(input.contents.filter((c) => allowed.has(c)))];
  const ratings = input.ratings.filter((r) => allowed.has(r.skill_code));
  const now = new Date().toISOString();
  const { error: evErr } = await db.from("lesson_evaluations").upsert({
    tenant_id: ctx.tenantId, lesson_id: lesson.id, student_license_id: lesson.student_license_id, instructor_id: instructorId,
    contents, comment: input.comment.trim() || null, next_goals: input.nextGoals.map((g) => g.trim()).filter(Boolean), overall_rating: input.overallRating,
    ai_draft: (input.aiDraft ?? null) as Json, ai_transcript: input.aiTranscript, ai_draft_model: input.aiDraftModel,
    ai_confirmed: !!input.aiDraft && input.aiConfirmed, confirmed_at: !!input.aiDraft && input.aiConfirmed ? now : null, shared_with_student: input.sharedWithStudent,
  }, { onConflict: "lesson_id" });
  if (evErr) return fail(evErr.message);
  // Bewertungen je Kompetenz: nur bewertete, vorherige Einträge dieser Stunde ersetzen
  const { error: delErr } = await db.from("student_skill_scores").delete().eq("lesson_id", lesson.id);
  if (delErr) return fail(delErr.message);
  if (ratings.length) {
    const { error: rErr } = await db.from("student_skill_scores").insert(ratings.map((r) => ({ tenant_id: ctx.tenantId, student_license_id: lesson.student_license_id!, skill_code: r.skill_code, lesson_id: lesson.id, instructor_id: instructorId, rating: r.rating, rated_at: now })));
    if (rErr) return fail(rErr.message);
  }
  if (["booked", "confirmed"].includes(lesson.status)) await db.from("lessons").update({ status: "completed", completed_at: now }).eq("id", lesson.id);
  // Kopplung Praxis -> Theorie: schwache Kompetenz mit gekoppeltem Thema löst eine Lernempfehlung aus
  const st = lesson.students as unknown as { user_id: string | null; first_name: string } | null;
  const weak = ratings.filter((r) => r.rating <= 2).map((r) => r.skill_code);
  if (weak.length && st?.user_id) {
    const { data: topics } = await db.from("topics").select("id, name_i18n, practical_skill_code").in("practical_skill_code", weak).eq("active", true);
    const rows = (topics ?? []).map((t) => { const name = ((t.name_i18n ?? {}) as Record<string, string>)["de"] ?? Object.values((t.name_i18n ?? {}) as Record<string, string>)[0] ?? ""; return { tenant_id: ctx.tenantId, user_id: st.user_id!, notification_type: "learn_reminder", title: `Training empfohlen: ${name}`, body: `In deiner letzten Fahrstunde gab es Unsicherheiten beim Thema ${name}. Ein kurzes Theorietraining hilft dir für die nächste Stunde.`, data: { topic_id: t.id, lesson_id: lesson.id } as Json, channels: ["push", "in_app"], dedupe_key: `learn_reminder:${lesson.id}:${t.id}` }; });
    if (rows.length) await db.from("notifications").upsert(rows, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true });
  }
  revalidatePath(`/lehrer/dokumentation/${lesson.id}`);
  revalidatePath(`/lehrer/schueler/${lesson.student_license_id}`);
  revalidatePath("/lehrer");
  return { ok: true, message: "Dokumentation gespeichert." };
}

export interface DraftResult { ok: boolean; message: string; transcript: string | null; draft: LessonNotesDraft | null; model: string | null }

/** Sprachnotiz als Text strukturieren (KI-Entwurf). Ohne Provider bleibt der Text als Transkript stehen. */
export async function draftFromTranscriptAction(lessonId: string, transcript: string): Promise<DraftResult> {
  uuid.parse(lessonId);
  const text = z.string().min(1).max(20000).parse(transcript.trim());
  const ctx = await getInstructorContext();
  if (!(await allow("instructorAiDay", ctx.userId))) return { ok: false, message: "Das Tageskontingent für KI-Entwürfe ist erreicht. Der Text bleibt als Transkript stehen.", transcript: text, draft: null, model: null };
  const services = createAiServices();
  if (!services.fast) return { ok: false, message: "Kein KI-Anbieter konfiguriert. Der Text wird als Transkript gespeichert, bitte das Formular manuell ausfüllen.", transcript: text, draft: null, model: null };
  const skills = await loadSkillLabels(ctx.db);
  try {
    const res = await structureLessonNotes({ provider: services.fast, model: services.models.fast }, { transcript: text, skills: skills.map((s) => ({ code: s.code, name: s.name })) });
    return { ok: true, message: res.draft.confidence === "uncertain" ? "Entwurf erstellt, die Notiz war aber schwer auswertbar. Bitte genau prüfen." : "Entwurf erstellt. Bitte prüfen und bestätigen.", transcript: res.transcript, draft: res.draft, model: res.usage.model };
  } catch (e) {
    return { ok: false, message: `Der Entwurf konnte nicht erstellt werden: ${e instanceof Error ? e.message : "Unbekannter Fehler"}`, transcript: text, draft: null, model: null };
  }
}

/** Audioaufnahme transkribieren und strukturieren. Ohne Speech-to-Text-Konfiguration: Hinweis zurückgeben. */
export async function draftFromAudioAction(formData: FormData): Promise<DraftResult> {
  const lessonId = uuid.parse(String(formData.get("lessonId") ?? ""));
  const file = formData.get("audio");
  if (!(file instanceof Blob) || file.size === 0) return { ok: false, message: "Keine Aufnahme empfangen.", transcript: null, draft: null, model: null };
  if (file.size > 25 * 1024 * 1024) return { ok: false, message: "Die Aufnahme ist zu groß (maximal 25 MB).", transcript: null, draft: null, model: null };
  const ictx = await getInstructorContext();
  if (!(await allow("instructorAiDay", ictx.userId))) return { ok: false, message: "Das Tageskontingent für KI-Entwürfe ist erreicht. Bitte die Notiz als Text eingeben.", transcript: null, draft: null, model: null };
  const services = createAiServices();
  if (!services.transcription) return { ok: false, message: "Spracherkennung ist nicht konfiguriert. Bitte die Notiz als Text eingeben.", transcript: null, draft: null, model: null };
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { text } = await services.transcription.transcribe({ bytes, mimeType: file.type || "audio/webm", locale: "de" });
    if (!text.trim()) return { ok: false, message: "In der Aufnahme wurde keine Sprache erkannt.", transcript: null, draft: null, model: null };
    return await draftFromTranscriptAction(lessonId, text);
  } catch (e) {
    return { ok: false, message: `Transkription fehlgeschlagen: ${e instanceof Error ? e.message : "Unbekannter Fehler"}`, transcript: null, draft: null, model: null };
  }
}

// ------------------------------------------------------------------------------------------------
// Kalender: Slots, Abwesenheiten, Arbeitszeiten
// ------------------------------------------------------------------------------------------------

const SlotSchema = z.object({
  date: dateKey, startTime: timeKey,
  units: z.number().int().min(1).max(4).default(1),
  count: z.number().int().min(1).max(12).default(1),
  kind: z.enum(["practice", "overland", "motorway", "night", "special", "exam_prep", "practical_exam", "manual_conversion", "trailer"]).default("practice"),
  vehicleId: uuid.nullable().default(null),
  transmission: z.enum(["manual", "automatic"]).nullable().default(null),
  licenseCodes: z.array(z.string().min(1).max(10)).max(20).default([]),
  meetingPoint: z.string().max(200).nullable().default(null),
  priceCents: z.number().int().min(0).max(100_000).nullable().default(null),
});
export type SlotInput = z.input<typeof SlotSchema>;

export async function createSlotsAction(raw: SlotInput): Promise<ActionResult & { created?: number }> {
  const input = SlotSchema.parse(raw);
  const ctx = await getInstructorContext();
  const ins = requireInstructorRecord(ctx);
  const tz = ctx.school.timezone;
  const unitMinutes = 45;
  const startMs = new Date(localToIso(`${input.date}T${input.startTime}`, tz)).getTime();
  if (startMs < Date.now() - 5 * 60_000) return fail("Der Startzeitpunkt liegt in der Vergangenheit.");
  const errors: string[] = [];
  let created = 0;
  for (let i = 0; i < input.count; i++) {
    const s = new Date(startMs + i * input.units * unitMinutes * 60_000).toISOString();
    const e = new Date(startMs + (i + 1) * input.units * unitMinutes * 60_000).toISOString();
    const { error } = await ctx.db.from("lessons").insert({
      tenant_id: ctx.tenantId, instructor_id: ins.id, location_id: ins.location_id, vehicle_id: input.vehicleId, kind: input.kind, status: "open", period: `[${s},${e})`, units: input.units,
      transmission: input.transmission, license_codes: input.licenseCodes, meeting_point: input.meetingPoint?.trim() || null, price_cents: input.priceCents, created_by: ctx.userId,
    });
    if (error) errors.push(`${new Date(s).toLocaleTimeString("de-DE", { timeZone: tz, hour: "2-digit", minute: "2-digit" })} Uhr: ${friendly(error.message)}`);
    else created++;
  }
  revalidatePath("/lehrer/kalender");
  if (created === 0) return { ok: false, message: errors[0] ?? "Es konnte kein Slot angelegt werden.", created };
  return { ok: true, message: `${created} Slot${created === 1 ? "" : "s"} angelegt.${errors.length ? ` Nicht angelegt: ${errors.join("; ")}` : ""}`, created };
}

export async function deleteSlotAction(lessonId: string): Promise<ActionResult> {
  const id = uuid.parse(lessonId);
  const ctx = await getInstructorContext();
  const { data: lesson } = await ctx.db.from("lessons").select("id, status, student_id").eq("id", id).maybeSingle();
  if (!lesson) return fail("Slot nicht gefunden.");
  if (lesson.status !== "open" || lesson.student_id) return fail("Nur freie Slots können gelöscht werden. Gebuchte Stunden bitte stornieren.");
  const { error } = await ctx.db.from("lessons").delete().eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/lehrer/kalender");
  return { ok: true, message: "Slot gelöscht." };
}

export async function cancelLessonByInstructorAction(lessonId: string, reason: string): Promise<ActionResult> {
  const id = uuid.parse(lessonId);
  const ctx = await getInstructorContext();
  const { error } = await ctx.db.rpc("cancel_lesson", { p_lesson_id: id, p_reason: reason.slice(0, 500) || null, p_client_request_id: crypto.randomUUID() });
  if (error) return fail(error.message);
  revalidatePath("/lehrer/kalender");
  revalidatePath("/lehrer");
  return { ok: true, message: "Stunde abgesagt. Der Schüler wurde benachrichtigt." };
}

const AbsenceSchema = z.object({ from: dateKey, to: dateKey, reason: z.enum(["vacation", "sick", "training", "other"]).default("vacation"), note: z.string().max(300).nullable().default(null) });
export type AbsenceInput = z.input<typeof AbsenceSchema>;

export async function createAbsenceAction(raw: AbsenceInput): Promise<ActionResult> {
  const input = AbsenceSchema.parse(raw);
  const ctx = await getInstructorContext();
  const ins = requireInstructorRecord(ctx);
  const tz = ctx.school.timezone;
  const start = localToIso(`${input.from}T00:00`, tz);
  const end = localToIso(`${input.to}T00:00`, tz, 1);
  if (end <= start) return fail("Das Ende muss nach dem Beginn liegen.");
  const { error } = await ctx.db.from("instructor_absences").insert({ tenant_id: ctx.tenantId, instructor_id: ins.id, period: `[${start},${end})`, reason: input.reason, note: input.note?.trim() || null });
  if (error) return fail(/exclusion|23P01/i.test(error.message) ? "Für diesen Zeitraum ist bereits eine Abwesenheit eingetragen." : error.message);
  revalidatePath("/lehrer/kalender");
  return { ok: true, message: "Abwesenheit eingetragen." };
}

export async function deleteAbsenceAction(absenceId: string): Promise<ActionResult> {
  const id = uuid.parse(absenceId);
  const ctx = await getInstructorContext();
  const { error } = await ctx.db.from("instructor_absences").delete().eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/lehrer/kalender");
  return { ok: true, message: "Abwesenheit entfernt." };
}

const AvailabilitySchema = z.object({ weekday: z.number().int().min(1).max(7), startTime: timeKey, endTime: timeKey, kind: z.enum(["work", "break"]).default("work") });
export type AvailabilityInput = z.input<typeof AvailabilitySchema>;

export async function createAvailabilityAction(raw: AvailabilityInput): Promise<ActionResult> {
  const input = AvailabilitySchema.parse(raw);
  if (input.endTime <= input.startTime) return fail("Die Endzeit muss nach der Startzeit liegen.");
  const ctx = await getInstructorContext();
  const ins = requireInstructorRecord(ctx);
  const { error } = await ctx.db.from("instructor_availability").insert({ tenant_id: ctx.tenantId, instructor_id: ins.id, weekday: input.weekday, start_time: input.startTime, end_time: input.endTime, kind: input.kind, location_id: ins.location_id });
  if (error) return fail(error.message);
  revalidatePath("/lehrer/kalender");
  return { ok: true, message: input.kind === "work" ? "Arbeitszeit gespeichert." : "Pause gespeichert." };
}

export async function deleteAvailabilityAction(id: string): Promise<ActionResult> {
  const ctx = await getInstructorContext();
  const { error } = await ctx.db.from("instructor_availability").delete().eq("id", uuid.parse(id));
  if (error) return fail(error.message);
  revalidatePath("/lehrer/kalender");
  return { ok: true, message: "Eintrag entfernt." };
}

// ------------------------------------------------------------------------------------------------
// Theorieunterricht
// ------------------------------------------------------------------------------------------------

const TheoryClassSchema = z.object({
  materialKind: z.enum(["basic", "class_specific"]), unitCode: z.string().min(1).max(10), title: z.string().min(1).max(200),
  date: dateKey, startTime: timeKey, endTime: timeKey, locationId: uuid.nullable().default(null), isOnline: z.boolean().default(false),
  capacity: z.number().int().min(1).max(500).nullable().default(null), licenseCodes: z.array(z.string().min(1).max(10)).max(20).default([]),
});
export type TheoryClassInput = z.input<typeof TheoryClassSchema>;

export async function createTheoryClassAction(raw: TheoryClassInput): Promise<ActionResult> {
  const input = TheoryClassSchema.parse(raw);
  if (input.endTime <= input.startTime) return fail("Die Endzeit muss nach der Startzeit liegen.");
  const ctx = await getInstructorContext();
  const ins = requireInstructorRecord(ctx);
  const tz = ctx.school.timezone;
  const start = localToIso(`${input.date}T${input.startTime}`, tz);
  const end = localToIso(`${input.date}T${input.endTime}`, tz);
  const { error } = await ctx.db.from("theory_classes").insert({ tenant_id: ctx.tenantId, instructor_id: ins.id, location_id: input.isOnline ? null : input.locationId, lesson_unit_code: input.unitCode, material_kind: input.materialKind, license_codes: input.materialKind === "basic" ? [] : input.licenseCodes, title: input.title.trim(), period: `[${start},${end})`, capacity: input.capacity, is_online: input.isOnline });
  if (error) return fail(error.message);
  revalidatePath("/lehrer/unterricht");
  return { ok: true, message: "Unterricht angelegt." };
}

export async function cancelTheoryClassAction(classId: string): Promise<ActionResult> {
  const id = uuid.parse(classId);
  const ctx = await getInstructorContext();
  const { error } = await ctx.db.from("theory_classes").update({ status: "cancelled" }).eq("id", id).in("status", ["planned"]);
  if (error) return fail(error.message);
  revalidatePath("/lehrer/unterricht");
  return { ok: true, message: "Unterricht abgesagt." };
}

export async function finishTheoryClassAction(classId: string): Promise<ActionResult> {
  const id = uuid.parse(classId);
  const ctx = await getInstructorContext();
  const { error } = await ctx.db.from("theory_classes").update({ status: "completed" }).eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/lehrer/unterricht");
  revalidatePath(`/lehrer/unterricht/${id}`);
  return { ok: true, message: "Unterricht beendet." };
}

export interface CheckinCode { token: string; url: string; svg: string; validSeconds: number }

/** Neuen rotierenden Check-in-Code erzeugen und als QR (SVG) zurückgeben. */
export async function refreshCheckinTokenAction(classId: string): Promise<CheckinCode | { error: string }> {
  const id = uuid.parse(classId);
  const ctx = await getInstructorContext();
  const ttl = 60;
  const { data: token, error } = await ctx.db.rpc("create_checkin_token", { p_theory_class_id: id, p_ttl_seconds: ttl });
  if (error || !token) return { error: error?.message ?? "Code konnte nicht erzeugt werden." };
  const url = `${publicEnv.appUrl().replace(/\/$/, "")}/theorie?code=${encodeURIComponent(token)}`;
  const svg = await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 1, width: 512 });
  return { token, url, svg, validSeconds: ttl };
}

export async function manualAttendanceAction(classId: string, studentId: string, status: "present" | "absent" | "excused"): Promise<ActionResult> {
  const cid = uuid.parse(classId);
  const sid = uuid.parse(studentId);
  const st = z.enum(["present", "absent", "excused"]).parse(status);
  const ctx = await getInstructorContext();
  const { data: sl } = await ctx.db.from("student_licenses").select("id").eq("student_id", sid).eq("status", "active").order("started_at", { ascending: false }).limit(1).maybeSingle();
  const { error } = await ctx.db.from("attendance").upsert({ tenant_id: ctx.tenantId, theory_class_id: cid, student_id: sid, student_license_id: sl?.id ?? null, status: st, check_in_method: "manual", checked_in_at: st === "present" ? new Date().toISOString() : null, checked_in_by: ctx.userId }, { onConflict: "theory_class_id,student_id" });
  if (error) return fail(error.message);
  revalidatePath(`/lehrer/unterricht/${cid}`);
  return { ok: true, message: st === "present" ? "Anwesenheit nacherfasst." : st === "excused" ? "Als entschuldigt eingetragen." : "Als abwesend eingetragen." };
}

// ------------------------------------------------------------------------------------------------
// Mock-Prüfung
// ------------------------------------------------------------------------------------------------

export async function startMockExamAction(licenseId: string): Promise<ActionResult & { mockId?: string }> {
  const id = uuid.parse(licenseId);
  const ctx = await getInstructorContext();
  const ins = requireInstructorRecord(ctx);
  const { data: running } = await ctx.db.from("mock_exams").select("id").eq("student_license_id", id).eq("status", "running").limit(1).maybeSingle();
  if (running) return { ok: true, message: "Es läuft bereits eine Prüfungssimulation.", mockId: running.id };
  const { data, error } = await ctx.db.from("mock_exams").insert({ tenant_id: ctx.tenantId, student_license_id: id, instructor_id: ins.id }).select("id").single();
  if (error || !data) return fail(error?.message ?? "Simulation konnte nicht gestartet werden.");
  revalidatePath(`/lehrer/mock/${id}`);
  return { ok: true, message: "Prüfungssimulation gestartet.", mockId: data.id };
}

const MockEventSchema = z.object({ mockId: uuid, polarity: z.enum(["positive", "negative"]), severity: z.number().int().min(1).max(3).default(1), label: z.string().min(1).max(120), skillCode: z.string().max(64).nullable().default(null), note: z.string().max(300).nullable().default(null) });
export type MockEventInput = z.input<typeof MockEventSchema>;

export async function addMockEventAction(raw: MockEventInput): Promise<ActionResult & { eventId?: string }> {
  const input = MockEventSchema.parse(raw);
  const ctx = await getInstructorContext();
  const { data, error } = await ctx.db.from("mock_exam_events").insert({ mock_exam_id: input.mockId, polarity: input.polarity, severity: input.severity, label: input.label, skill_code: input.skillCode, note: input.note }).select("id").single();
  if (error || !data) return fail(error?.message ?? "Ereignis konnte nicht gespeichert werden.");
  return { ok: true, message: "Ereignis gespeichert.", eventId: data.id };
}

export async function deleteMockEventAction(eventId: string): Promise<ActionResult> {
  const ctx = await getInstructorContext();
  const { error } = await ctx.db.from("mock_exam_events").delete().eq("id", uuid.parse(eventId));
  if (error) return fail(error.message);
  return { ok: true, message: "Ereignis entfernt." };
}

/** Ergebnis: 100 minus 5 je Schweregrad negativer Ereignisse, plus 2 je positives Ereignis, begrenzt auf 0 bis 100. */
export async function finishMockExamAction(mockId: string, summary: string, abort = false): Promise<ActionResult> {
  const id = uuid.parse(mockId);
  const text = z.string().max(4000).parse(summary);
  const ctx = await getInstructorContext();
  const { data: mock } = await ctx.db.from("mock_exams").select("id, student_license_id, status, mock_exam_events(polarity, severity, label, skill_code)").eq("id", id).maybeSingle();
  if (!mock) return fail("Simulation nicht gefunden.");
  if (mock.status !== "running") return fail("Die Simulation ist bereits beendet.");
  const events = (mock.mock_exam_events ?? []) as Array<{ polarity: string; severity: number; label: string; skill_code: string | null }>;
  const negatives = events.filter((e) => e.polarity === "negative");
  const positives = events.filter((e) => e.polarity === "positive");
  const score = Math.max(0, Math.min(100, 100 - negatives.reduce((s, e) => s + e.severity * 5, 0) + positives.length * 2));
  const countBy = (list: typeof events) => { const m = new Map<string, number>(); for (const e of list) m.set(e.label, (m.get(e.label) ?? 0) + 1); return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([label, n]) => (n > 1 ? `${label} (${n}×)` : label)); };
  const strengths = countBy(positives);
  const improvements = countBy(negatives);
  const autoSummary = `Simulation mit ${positives.length} positiven und ${negatives.length} negativen Beobachtungen. Ergebnis ${score} von 100 Punkten.${negatives.some((n) => n.severity >= 3) ? " Mindestens ein schwerwiegender Fehler, in der echten Prüfung wäre das ein Durchfallgrund." : ""}`;
  const { error } = await ctx.db.from("mock_exams").update({ status: abort ? "aborted" : "completed", ended_at: new Date().toISOString(), overall_score: abort ? null : score, strengths, improvements, summary: text.trim() ? `${text.trim()}\n\n${autoSummary}` : autoSummary }).eq("id", id);
  if (error) return fail(error.message);
  revalidatePath(`/lehrer/mock/${mock.student_license_id}`);
  revalidatePath(`/lehrer/schueler/${mock.student_license_id}`);
  return { ok: true, message: abort ? "Simulation abgebrochen." : `Simulation beendet: ${score} von 100 Punkten.` };
}

// ------------------------------------------------------------------------------------------------
// Nachrichten
// ------------------------------------------------------------------------------------------------

/** Fahrlehrer startet (oder öffnet) die Unterhaltung mit einem Schüler. */
export async function startInstructorConversationAction(studentId: string): Promise<ActionResult & { conversationId?: string }> {
  const sid = uuid.parse(studentId);
  const ctx = await getInstructorContext();
  const { data: student } = await ctx.db.from("students").select("id, user_id").eq("id", sid).maybeSingle();
  if (!student) return fail("Schüler nicht gefunden.");
  if (!student.user_id) return fail("Dieser Schüler hat noch kein Nutzerkonto und kann nicht angeschrieben werden.");
  const { data: existing } = await ctx.db.from("conversations").select("id, conversation_participants(user_id)").eq("student_id", sid).eq("kind", "student_instructor").limit(5);
  const mine = (existing ?? []).find((c) => ((c.conversation_participants ?? []) as Array<{ user_id: string }>).some((p) => p.user_id === ctx.userId));
  if (mine) return { ok: true, message: "Unterhaltung geöffnet.", conversationId: mine.id };
  const { data: conv, error } = await ctx.db.from("conversations").insert({ tenant_id: ctx.tenantId, kind: "student_instructor", student_id: sid, last_message_at: new Date().toISOString() }).select("id").single();
  if (error || !conv) return fail(error?.message ?? "Unterhaltung konnte nicht angelegt werden.");
  const { error: pErr } = await ctx.db.from("conversation_participants").insert([{ conversation_id: conv.id, user_id: ctx.userId }, { conversation_id: conv.id, user_id: student.user_id }]);
  if (pErr) return fail(pErr.message);
  revalidatePath("/lehrer/nachrichten");
  return { ok: true, message: "Unterhaltung gestartet.", conversationId: conv.id };
}
