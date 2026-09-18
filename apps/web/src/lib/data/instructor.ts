import "server-only";
import { cache } from "react";
import type { Tables } from "@fahrpilot/db";
import { trainingProgress, type SpecialDriveKind, type TrainingProgress } from "@fahrpilot/rules-engine";
import { competencyProfile, type CompetencyProfile } from "@fahrpilot/learning-engine";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { parseRange } from "@/components/ui";
import { resolveRulesFor, type Db, type ResolvedRules } from "./student";

export const INSTRUCTOR_ROLES = ["instructor", "office", "admin", "owner"] as const;

export interface InstructorContext {
  db: Db;
  userId: string;
  tenantId: string;
  role: string;
  /** Eigener Fahrlehrerdatensatz; null bei Büro/Admin ohne Fahrlehrerprofil. */
  instructor: Tables<"instructors"> | null;
  /** Büro, Admin und Owner sehen alle Fahrlehrer und Schüler. */
  isOffice: boolean;
  school: Pick<Tables<"driving_schools">, "id" | "name" | "timezone">;
}

/** Kontext des angemeldeten Fahrlehrers (oder Büro-Mitarbeiters). Pro Request gecacht. */
export const getInstructorContext = cache(async (): Promise<InstructorContext> => {
  const session = await requireRole(INSTRUCTOR_ROLES);
  const db = await createSupabaseServerClient();
  const [{ data: instructor }, { data: school }] = await Promise.all([
    db.from("instructors").select("*").eq("user_id", session.userId).eq("tenant_id", session.tenantId).maybeSingle(),
    db.from("driving_schools").select("id, name, timezone").eq("id", session.tenantId).single(),
  ]);
  const isOffice = session.role !== "instructor";
  if (!instructor && !isOffice) throw new Error("Für dieses Konto ist kein Fahrlehrerdatensatz angelegt. Bitte an das Büro wenden.");
  if (!school) throw new Error("Fahrschule nicht gefunden");
  return { db, userId: session.userId, tenantId: session.tenantId, role: session.role, instructor: instructor ?? null, isOffice, school };
});

/** Fahrlehrerdatensatz erzwingen (für Aktionen, die nur ein Fahrlehrer selbst ausführt). */
export function requireInstructorRecord(ctx: InstructorContext): Tables<"instructors"> {
  if (!ctx.instructor) throw new Error("Diese Aktion benötigt einen eigenen Fahrlehrerdatensatz.");
  return ctx.instructor;
}

export const LESSON_STATUS_LABEL: Record<string, string> = { open: "Frei", booked: "Angefragt", confirmed: "Bestätigt", completed: "Abgeschlossen", no_show: "Nicht erschienen", cancelled: "Storniert" };
export const EXAM_STATUS_LABEL: Record<string, string> = { not_ready: "Noch nicht bereit", awaiting_instructor_release: "Freigabe ausstehend", ready: "Freigegeben", requested: "Angefragt", scheduled: "Terminiert", passed: "Bestanden", failed: "Nicht bestanden", cancelled: "Abgesagt" };
export const LESSON_KIND_LABEL: Record<string, string> = { practice: "Übungsstunde", overland: "Überlandfahrt", motorway: "Autobahnfahrt", night: "Nachtfahrt", special: "Sonderfahrt", exam_prep: "Prüfungsvorbereitung", practical_exam: "Praktische Prüfung", manual_conversion: "Schaltstunde (B197)", trailer: "Anhänger" };

export const i18n = (obj: unknown, locale = "de"): string => { const o = (obj ?? {}) as Record<string, string>; return o[locale] ?? o["de"] ?? Object.values(o)[0] ?? ""; };

/** Tagesgrenzen (lokale Zeitzone der Fahrschule) als ISO-Strings. */
export function dayBounds(dateKey: string, timeZone: string): { start: string; end: string } {
  return { start: localToIso(`${dateKey}T00:00`, timeZone), end: localToIso(`${dateKey}T00:00`, timeZone, 1) };
}

/** Lokale Datum-Uhrzeit (YYYY-MM-DDTHH:MM) in der Zeitzone der Fahrschule in einen ISO-Zeitpunkt umrechnen. */
export function localToIso(localDateTime: string, timeZone: string, addDays = 0): string {
  const m = localDateTime.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) throw new Error("Ungültiges Datum");
  const [y, mo, d, h, mi] = [Number(m[1]), Number(m[2]), Number(m[3]) + addDays, Number(m[4]), Number(m[5])];
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const offset = tzOffsetMs(new Date(guess), timeZone);
  const first = guess - offset;
  const offset2 = tzOffsetMs(new Date(first), timeZone);
  return new Date(guess - offset2).toISOString();
}

function tzOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

export function todayKey(timeZone: string, date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone });
}

/** Montag der Woche (Datumsschlüssel YYYY-MM-DD) für ein Datum. */
export function mondayOf(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  const wd = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - wd);
  return d.toISOString().slice(0, 10);
}

export function addDaysKey(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// ------------------------------------------------------------------------------------------------
// Heute
// ------------------------------------------------------------------------------------------------

export interface TodayLesson { id: string; start: string; end: string; kind: string; status: string; units: number; studentName: string | null; studentId: string | null; studentLicenseId: string | null; licenseCode: string | null; vehicle: string | null; meetingPoint: string | null; hasEvaluation: boolean; instructorName: string }
export interface TodayTheoryClass { id: string; start: string; end: string; code: string; title: string; status: string; location: string | null; attendees: number }
export interface TheoryWeakness { studentName: string; studentLicenseId: string | null; topicName: string; mastery: number }
export interface OpenRelease { studentLicenseId: string; studentName: string; licenseCode: string; kind: "theory" | "practical" }

export async function loadInstructorToday(ctx: InstructorContext, dateKey: string) {
  const { db } = ctx;
  const { start, end } = dayBounds(dateKey, ctx.school.timezone);
  let lessonQ = db.from("lessons").select("id, period, kind, status, units, meeting_point, student_id, student_license_id, instructor_id, students(first_name, last_name), student_licenses(license_code), vehicles(license_plate, make, model), instructors(display_name), lesson_evaluations(id)").gte("period", `[${start},)`).lt("period", `[${end},)`).neq("status", "cancelled").order("period");
  let classQ = db.from("theory_classes").select("id, period, lesson_unit_code, title, status, locations(name), attendance(status)").gte("period", `[${start},)`).lt("period", `[${end},)`).neq("status", "cancelled").order("period");
  if (ctx.instructor && !ctx.isOffice) { lessonQ = lessonQ.eq("instructor_id", ctx.instructor.id); classQ = classQ.eq("instructor_id", ctx.instructor.id); }
  else if (ctx.instructor) { lessonQ = lessonQ.eq("instructor_id", ctx.instructor.id); classQ = classQ.eq("instructor_id", ctx.instructor.id); }
  const [{ data: lessonRows }, { data: classRows }] = await Promise.all([lessonQ.limit(60), classQ.limit(20)]);
  const lessons: TodayLesson[] = (lessonRows ?? []).map((l) => {
    const { start: s, end: e } = parseRange(l.period as unknown as string);
    const st = l.students as unknown as { first_name: string; last_name: string } | null;
    const veh = l.vehicles as unknown as { license_plate: string; make: string | null; model: string | null } | null;
    const ev = l.lesson_evaluations as unknown as { id: string } | { id: string }[] | null;
    return { id: l.id, start: s, end: e, kind: l.kind, status: l.status, units: l.units, studentName: st ? `${st.first_name} ${st.last_name}` : null, studentId: l.student_id, studentLicenseId: l.student_license_id, licenseCode: (l.student_licenses as unknown as { license_code: string } | null)?.license_code ?? null, vehicle: veh ? [veh.make, veh.model].filter(Boolean).join(" ") || veh.license_plate : null, meetingPoint: l.meeting_point, hasEvaluation: Array.isArray(ev) ? ev.length > 0 : !!ev, instructorName: (l.instructors as unknown as { display_name: string } | null)?.display_name ?? "" };
  });
  const classes: TodayTheoryClass[] = (classRows ?? []).map((c) => { const { start: s, end: e } = parseRange(c.period as unknown as string); const att = (c.attendance ?? []) as Array<{ status: string }>; return { id: c.id, start: s, end: e, code: c.lesson_unit_code, title: c.title, status: c.status, location: (c.locations as unknown as { name: string } | null)?.name ?? null, attendees: att.filter((a) => a.status === "present").length }; });

  // Theorie-Schwächen der heutigen Schüler (Kopplung Theorie -> Praxis über topics.practical_skill_code)
  const studentIds = [...new Set(lessons.map((l) => l.studentId).filter((s): s is string => !!s))];
  const weaknesses: TheoryWeakness[] = [];
  if (studentIds.length) {
    const { data: mastery } = await db.from("student_topic_mastery").select("student_id, topic_id, mastery, topics!inner(name_i18n, practical_skill_code)").in("student_id", studentIds).lt("mastery", 0.5).not("topics.practical_skill_code", "is", null).limit(100);
    for (const m of mastery ?? []) {
      const lesson = lessons.find((l) => l.studentId === m.student_id);
      if (!lesson) continue;
      weaknesses.push({ studentName: lesson.studentName ?? "", studentLicenseId: lesson.studentLicenseId, topicName: i18n((m.topics as unknown as { name_i18n: unknown }).name_i18n), mastery: Number(m.mastery) });
    }
    weaknesses.sort((a, b) => a.studentName.localeCompare(b.studentName) || a.mastery - b.mastery);
  }

  // Offene Freigaben
  let relQ = db.from("student_licenses").select("id, license_code, theory_exam_status, practical_exam_status, primary_instructor_id, students(first_name, last_name)").eq("status", "active").or("theory_exam_status.eq.awaiting_instructor_release,practical_exam_status.eq.awaiting_instructor_release");
  if (!ctx.isOffice && ctx.instructor) relQ = relQ.eq("primary_instructor_id", ctx.instructor.id);
  const { data: relRows } = await relQ.limit(50);
  const releases: OpenRelease[] = [];
  for (const r of relRows ?? []) {
    const st = r.students as unknown as { first_name: string; last_name: string } | null;
    const name = st ? `${st.first_name} ${st.last_name}` : "";
    if (r.theory_exam_status === "awaiting_instructor_release") releases.push({ studentLicenseId: r.id, studentName: name, licenseCode: r.license_code, kind: "theory" });
    if (r.practical_exam_status === "awaiting_instructor_release") releases.push({ studentLicenseId: r.id, studentName: name, licenseCode: r.license_code, kind: "practical" });
  }
  // Offene Dokumentationen (abgeschlossene Stunden der letzten 14 Tage ohne Bewertung)
  let openDocQ = db.from("lessons").select("id, period, students(first_name, last_name), lesson_evaluations(id)").eq("status", "completed").gte("period", `[${new Date(Date.now() - 14 * 86_400_000).toISOString()},)`).order("period", { ascending: false });
  if (ctx.instructor) openDocQ = openDocQ.eq("instructor_id", ctx.instructor.id);
  const { data: docRows } = await openDocQ.limit(40);
  const openDocs = (docRows ?? []).filter((l) => { const ev = l.lesson_evaluations as unknown as { id: string } | { id: string }[] | null; return Array.isArray(ev) ? ev.length === 0 : !ev; }).map((l) => { const st = l.students as unknown as { first_name: string; last_name: string } | null; return { id: l.id, start: parseRange(l.period as unknown as string).start, studentName: st ? `${st.first_name} ${st.last_name}` : "" }; });
  return { lessons, classes, weaknesses, releases, openDocs };
}

// ------------------------------------------------------------------------------------------------
// Schüler
// ------------------------------------------------------------------------------------------------

export interface StudentRow { licenseId: string; studentId: string; name: string; licenseCode: string; transmission: string; status: string; theoryExamStatus: string; practicalExamStatus: string; specialDrivesPercent: number | null; openSpecialUnits: number | null; lastLessonAt: string | null; nextLessonAt: string | null; profileOverall: number | null; weaknesses: string[]; readiness: number | null; primaryInstructor: string | null }

interface LicenseRow { id: string; student_id: string; license_code: string; acquisition_kind: string; transmission: string; status: string; theory_exam_status: string; practical_exam_status: string; primary_instructor_id: string | null; students: { first_name: string; last_name: string; user_id: string | null } | null; instructors: { display_name: string } | null }

/** Ausbildungen, die der Fahrlehrer betreut (zugewiesen oder mit eigenen Stunden). Büro sieht alle aktiven. */
export async function loadMyLicenses(ctx: InstructorContext): Promise<LicenseRow[]> {
  const { db } = ctx;
  const sel = "id, student_id, license_code, acquisition_kind, transmission, status, theory_exam_status, practical_exam_status, primary_instructor_id, students(first_name, last_name, user_id), instructors(display_name)";
  if (ctx.isOffice && !ctx.instructor) {
    const { data } = await db.from("student_licenses").select(sel).in("status", ["active", "paused"]).order("started_at", { ascending: false }).limit(500);
    return (data ?? []) as unknown as LicenseRow[];
  }
  const ins = ctx.instructor!;
  const [{ data: assigned }, { data: lessonLic }] = await Promise.all([
    db.from("student_licenses").select(sel).in("status", ["active", "paused"]).eq("primary_instructor_id", ins.id).limit(500),
    db.from("lessons").select("student_license_id").eq("instructor_id", ins.id).not("student_license_id", "is", null).neq("status", "cancelled").limit(2000),
  ]);
  const rows = new Map<string, LicenseRow>();
  for (const r of (assigned ?? []) as unknown as LicenseRow[]) rows.set(r.id, r);
  const extra = [...new Set((lessonLic ?? []).map((l) => l.student_license_id).filter((x): x is string => !!x && !rows.has(x)))];
  if (extra.length) {
    const { data: more } = await db.from("student_licenses").select(sel).in("id", extra).in("status", ["active", "paused"]);
    for (const r of (more ?? []) as unknown as LicenseRow[]) rows.set(r.id, r);
  }
  return [...rows.values()];
}

const rulesCache = new Map<string, Promise<ResolvedRules>>();
async function rulesFor(db: Db, code: string, acquisition: string): Promise<ResolvedRules> {
  const key = `${code}:${acquisition}`;
  let p = rulesCache.get(key);
  if (!p) { p = resolveRulesFor(db, code, acquisition === "extension" ? "extension" : "first"); rulesCache.set(key, p); setTimeout(() => rulesCache.delete(key), 60_000); }
  return p;
}

export async function trainingFor(db: Db, licenseId: string, licenseCode: string, acquisition: string): Promise<{ training: TrainingProgress | null; rules: ResolvedRules }> {
  const [rules, { data: drives }] = await Promise.all([rulesFor(db, licenseCode, acquisition), db.rpc("special_drive_progress", { p_student_license_id: licenseId })]);
  const completed: Partial<Record<SpecialDriveKind, number>> = {};
  for (const d of (drives ?? []) as Array<{ kind: SpecialDriveKind; units: number }>) completed[d.kind] = d.units;
  return { training: rules.training ? trainingProgress(rules.training.rules, completed) : null, rules };
}

export async function loadSkillLabels(db: Db): Promise<Array<{ code: string; name: string; category: string }>> {
  const { data } = await db.from("skills").select("code, name_i18n, category, sort_order").eq("active", true).order("sort_order");
  return (data ?? []).map((s) => ({ code: s.code, name: i18n(s.name_i18n), category: s.category }));
}

export async function loadStudentList(ctx: InstructorContext): Promise<StudentRow[]> {
  const { db } = ctx;
  const licenses = await loadMyLicenses(ctx);
  if (licenses.length === 0) return [];
  const ids = licenses.map((l) => l.id);
  const nowIso = new Date().toISOString();
  const [skills, { data: ratings }, { data: lastLessons }, { data: nextLessons }, { data: snapshots }] = await Promise.all([
    loadSkillLabels(db),
    db.from("student_skill_scores").select("student_license_id, skill_code, rating, rated_at").in("student_license_id", ids).order("rated_at", { ascending: false }).limit(3000),
    db.from("lessons").select("student_license_id, period").in("student_license_id", ids).eq("status", "completed").order("period", { ascending: false }).limit(2000),
    db.from("lessons").select("student_license_id, period").in("student_license_id", ids).in("status", ["booked", "confirmed"]).gte("period", `[${nowIso},)`).order("period").limit(2000),
    db.from("readiness_snapshots").select("student_license_id, overall_score, computed_at").in("student_license_id", ids).order("computed_at", { ascending: false }).limit(2000),
  ]);
  const trainings = await Promise.all(licenses.map((l) => trainingFor(db, l.id, l.license_code, l.acquisition_kind)));
  const lastMap = new Map<string, string>(); for (const l of lastLessons ?? []) if (l.student_license_id && !lastMap.has(l.student_license_id)) lastMap.set(l.student_license_id, parseRange(l.period as unknown as string).start);
  const nextMap = new Map<string, string>(); for (const l of nextLessons ?? []) if (l.student_license_id && !nextMap.has(l.student_license_id)) nextMap.set(l.student_license_id, parseRange(l.period as unknown as string).start);
  const readyMap = new Map<string, number>(); for (const s of snapshots ?? []) if (!readyMap.has(s.student_license_id)) readyMap.set(s.student_license_id, s.overall_score);
  return licenses.map((l, i) => {
    const profile = competencyProfile((ratings ?? []).filter((r) => r.student_license_id === l.id).map((r) => ({ skill_code: r.skill_code, rating: r.rating, rated_at: r.rated_at })), skills);
    const t = trainings[i]?.training ?? null;
    return {
      licenseId: l.id, studentId: l.student_id, name: l.students ? `${l.students.first_name} ${l.students.last_name}` : "", licenseCode: l.license_code, transmission: l.transmission, status: l.status,
      theoryExamStatus: l.theory_exam_status, practicalExamStatus: l.practical_exam_status,
      specialDrivesPercent: t?.special_drives_percent ?? null, openSpecialUnits: t ? t.special_drives.reduce((s, d) => s + d.remaining_units, 0) : null,
      lastLessonAt: lastMap.get(l.id) ?? null, nextLessonAt: nextMap.get(l.id) ?? null, profileOverall: profile.overall_percent, weaknesses: profile.biggest_needs.map((n) => n.name), readiness: readyMap.get(l.id) ?? null,
      primaryInstructor: l.instructors?.display_name ?? null,
    };
  }).sort((a, b) => a.name.localeCompare(b.name, "de"));
}

export interface StudentDetail {
  license: Tables<"student_licenses">;
  student: Tables<"students">;
  licenseName: string;
  training: TrainingProgress | null;
  rules: ResolvedRules;
  profile: CompetencyProfile;
  skills: Array<{ code: string; name: string; category: string }>;
  lessons: Array<{ id: string; start: string; end: string; kind: string; status: string; units: number; instructor: string; evaluation: { contents: string[]; comment: string | null; next_goals: string[]; overall_rating: number | null; shared_with_student: boolean } | null; ratings: Array<{ skill_code: string; rating: number }> }>;
  nextGoals: string[];
  topicMastery: Array<{ topicId: string; name: string; mastery: number; coverage: number; attempts: number; practicalSkillCode: string | null }>;
  simulations: Array<{ id: string; submitted_at: string | null; passed: boolean | null; error_points: number | null; correct_count: number | null; wrong_count: number | null }>;
  readiness: { overall: number; theory: number; practical: number | null; computedAt: string } | null;
  theoryExam: Tables<"theory_exams"> | null;
  practicalExam: Tables<"practical_exams"> | null;
  mocks: Array<{ id: string; started_at: string; overall_score: number | null; status: string; strengths: string[]; improvements: string[] }>;
  attendedUnits: string[];
  canRelease: boolean;
  conversationId: string | null;
}

export async function loadStudentDetail(ctx: InstructorContext, licenseId: string): Promise<StudentDetail | null> {
  const { db } = ctx;
  const { data: license } = await db.from("student_licenses").select("*").eq("id", licenseId).maybeSingle();
  if (!license) return null;
  const [{ data: student }, { data: licenseInfo }, skills, tr, { data: ratings }, { data: lessonRows }, { data: mastery }, { data: sims }, { data: snap }, { data: theoryExam }, { data: practicalExam }, { data: mocks }, { data: attendance }, { data: conv }, { count: lessonCount }] = await Promise.all([
    db.from("students").select("*").eq("id", license.student_id).single(),
    db.from("licenses").select("name").eq("code", license.license_code).single(),
    loadSkillLabels(db),
    trainingFor(db, license.id, license.license_code, license.acquisition_kind),
    db.from("student_skill_scores").select("lesson_id, skill_code, rating, rated_at").eq("student_license_id", license.id).order("rated_at", { ascending: false }).limit(400),
    db.from("lessons").select("id, period, kind, status, units, instructors(display_name), lesson_evaluations(contents, comment, next_goals, overall_rating, shared_with_student)").eq("student_license_id", license.id).neq("status", "cancelled").order("period", { ascending: false }).limit(60),
    db.from("student_topic_mastery").select("topic_id, mastery, coverage, attempts, topics(name_i18n, practical_skill_code, sort_order)").eq("student_id", license.student_id).limit(100),
    db.from("exam_simulations").select("id, submitted_at, passed, error_points, correct_count, wrong_count").eq("student_id", license.student_id).eq("status", "submitted").order("submitted_at", { ascending: false }).limit(5),
    db.from("readiness_snapshots").select("overall_score, theory_score, practical_score, computed_at").eq("student_license_id", license.id).order("computed_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("theory_exams").select("*").eq("student_license_id", license.id).order("attempt_no", { ascending: false }).limit(1).maybeSingle(),
    db.from("practical_exams").select("*").eq("student_license_id", license.id).order("attempt_no", { ascending: false }).limit(1).maybeSingle(),
    db.from("mock_exams").select("id, started_at, overall_score, status, strengths, improvements").eq("student_license_id", license.id).order("started_at", { ascending: false }).limit(5),
    db.from("attendance").select("theory_classes(lesson_unit_code)").eq("student_id", license.student_id).eq("status", "present"),
    db.from("conversations").select("id, conversation_participants!inner(user_id)").eq("student_id", license.student_id).eq("kind", "student_instructor").eq("conversation_participants.user_id", ctx.userId).limit(1).maybeSingle(),
    ctx.instructor ? db.from("lessons").select("id", { count: "exact", head: true }).eq("student_license_id", license.id).eq("instructor_id", ctx.instructor.id).neq("status", "cancelled") : Promise.resolve({ count: 0 }),
  ]);
  if (!student) return null;
  const profile = competencyProfile((ratings ?? []).map((r) => ({ skill_code: r.skill_code, rating: r.rating, rated_at: r.rated_at })), skills);
  const lessons = (lessonRows ?? []).map((l) => {
    const { start, end } = parseRange(l.period as unknown as string);
    const ev = l.lesson_evaluations as unknown as StudentDetail["lessons"][number]["evaluation"] | StudentDetail["lessons"][number]["evaluation"][] | null;
    const evaluation = Array.isArray(ev) ? ev[0] ?? null : ev;
    return { id: l.id, start, end, kind: l.kind, status: l.status, units: l.units, instructor: (l.instructors as unknown as { display_name: string } | null)?.display_name ?? "", evaluation, ratings: (ratings ?? []).filter((r) => r.lesson_id === l.id).map((r) => ({ skill_code: r.skill_code, rating: r.rating })) };
  });
  const lastEvaluated = lessons.find((l) => l.evaluation && l.evaluation.next_goals.length > 0);
  const topicMastery = (mastery ?? []).map((m) => { const t = m.topics as unknown as { name_i18n: unknown; practical_skill_code: string | null; sort_order: number } | null; return { topicId: m.topic_id, name: i18n(t?.name_i18n), mastery: Number(m.mastery), coverage: Number(m.coverage), attempts: m.attempts, practicalSkillCode: t?.practical_skill_code ?? null, sort: t?.sort_order ?? 0 }; }).sort((a, b) => a.mastery - b.mastery);
  const canRelease = ctx.isOffice || (!!ctx.instructor && (license.primary_instructor_id === ctx.instructor.id || (lessonCount ?? 0) > 0));
  return {
    license, student, licenseName: licenseInfo?.name ?? license.license_code, training: tr.training, rules: tr.rules, profile, skills, lessons, nextGoals: lastEvaluated?.evaluation?.next_goals ?? [], topicMastery,
    simulations: sims ?? [], readiness: snap ? { overall: snap.overall_score, theory: snap.theory_score, practical: snap.practical_score, computedAt: snap.computed_at } : null,
    theoryExam: theoryExam ?? null, practicalExam: practicalExam ?? null, mocks: mocks ?? [], attendedUnits: (attendance ?? []).map((a) => (a.theory_classes as unknown as { lesson_unit_code: string } | null)?.lesson_unit_code).filter((c): c is string => !!c), canRelease, conversationId: conv?.id ?? null,
  };
}

// ------------------------------------------------------------------------------------------------
// Dokumentation
// ------------------------------------------------------------------------------------------------

export async function loadLessonForEvaluation(ctx: InstructorContext, lessonId: string) {
  const { db } = ctx;
  const { data: lesson } = await db.from("lessons").select("*, students(first_name, last_name, user_id), student_licenses(license_code), instructors(display_name), vehicles(license_plate, make, model)").eq("id", lessonId).maybeSingle();
  if (!lesson) return null;
  const [{ data: evaluation }, { data: ratings }, skills, { data: topics }, { data: previous }] = await Promise.all([
    db.from("lesson_evaluations").select("*").eq("lesson_id", lesson.id).maybeSingle(),
    db.from("student_skill_scores").select("skill_code, rating").eq("lesson_id", lesson.id),
    loadSkillLabels(db),
    db.from("topics").select("id, code, name_i18n, practical_skill_code").not("practical_skill_code", "is", null).eq("active", true),
    lesson.student_license_id ? db.from("lesson_evaluations").select("next_goals, created_at, lesson_id").eq("student_license_id", lesson.student_license_id).neq("lesson_id", lesson.id).order("created_at", { ascending: false }).limit(1).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const st = lesson.students as unknown as { first_name: string; last_name: string; user_id: string | null } | null;
  const veh = lesson.vehicles as unknown as { license_plate: string; make: string | null; model: string | null } | null;
  return {
    lesson, studentName: st ? `${st.first_name} ${st.last_name}` : null, studentUserId: st?.user_id ?? null, licenseCode: (lesson.student_licenses as unknown as { license_code: string } | null)?.license_code ?? null,
    instructorName: (lesson.instructors as unknown as { display_name: string } | null)?.display_name ?? "", vehicle: veh ? [veh.make, veh.model].filter(Boolean).join(" ") || veh.license_plate : null,
    evaluation, ratings: ratings ?? [], skills, topics: (topics ?? []).map((t) => ({ id: t.id, code: t.code, name: i18n(t.name_i18n), skill: t.practical_skill_code as string })), previousGoals: previous?.next_goals ?? [],
  };
}

// ------------------------------------------------------------------------------------------------
// Kalender
// ------------------------------------------------------------------------------------------------

export interface CalendarEntry { id: string; kind: "lesson" | "absence" | "theory"; start: string; end: string; title: string; subtitle: string | null; status: string; dayKey: string; instructorName: string | null }

export async function loadInstructorWeek(ctx: InstructorContext, mondayKey: string) {
  const { db } = ctx;
  const tz = ctx.school.timezone;
  const { start } = dayBounds(mondayKey, tz);
  const end = dayBounds(addDaysKey(mondayKey, 7), tz).start;
  const insId = ctx.instructor?.id ?? null;
  let lessonQ = db.from("lessons").select("id, period, kind, status, units, transmission, license_codes, meeting_point, price_cents, students(first_name, last_name), vehicles(license_plate), instructors(display_name)").gte("period", `[${start},)`).lt("period", `[${end},)`).neq("status", "cancelled").order("period");
  let absQ = db.from("instructor_absences").select("id, period, reason, note, instructors(display_name)").gte("period", `[${start},)`).lt("period", `[${end},)`);
  let classQ = db.from("theory_classes").select("id, period, lesson_unit_code, title, status").gte("period", `[${start},)`).lt("period", `[${end},)`).neq("status", "cancelled");
  if (insId) { lessonQ = lessonQ.eq("instructor_id", insId); absQ = absQ.eq("instructor_id", insId); classQ = classQ.eq("instructor_id", insId); }
  const [{ data: lessons }, { data: absences }, { data: classes }, { data: availability }, { data: vehicles }, { data: priceLists }, { data: licenses }] = await Promise.all([
    lessonQ.limit(300), absQ.limit(50), classQ.limit(50),
    insId ? db.from("instructor_availability").select("*").eq("instructor_id", insId).order("weekday").order("start_time") : Promise.resolve({ data: [] as Tables<"instructor_availability">[] }),
    db.from("vehicles").select("id, license_plate, make, model, transmission, license_classes").eq("status", "active").order("license_plate"),
    db.from("price_lists").select("id, name, license_code, valid_from, valid_until, price_items(code, name, unit, amount_cents, lesson_kind)").lte("valid_from", todayKey(tz)).or(`valid_until.is.null,valid_until.gte.${todayKey(tz)}`).order("valid_from", { ascending: false }),
    db.from("licenses").select("code, name").order("code"),
  ]);
  const dayKeyOf = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: tz });
  const entries: CalendarEntry[] = [];
  for (const l of lessons ?? []) {
    const { start: s, end: e } = parseRange(l.period as unknown as string);
    const st = l.students as unknown as { first_name: string; last_name: string } | null;
    entries.push({ id: l.id, kind: "lesson", start: s, end: e, title: st ? `${st.first_name} ${st.last_name}` : "Freier Slot", subtitle: `${LESSON_KIND_LABEL[l.kind] ?? l.kind} · ${l.units} × 45 Min${(l.vehicles as unknown as { license_plate: string } | null)?.license_plate ? ` · ${(l.vehicles as unknown as { license_plate: string }).license_plate}` : ""}`, status: l.status, dayKey: dayKeyOf(s), instructorName: (l.instructors as unknown as { display_name: string } | null)?.display_name ?? null });
  }
  for (const a of absences ?? []) { const { start: s, end: e } = parseRange(a.period as unknown as string); entries.push({ id: a.id, kind: "absence", start: s, end: e, title: { vacation: "Urlaub", sick: "Krank", training: "Fortbildung", other: "Abwesend" }[a.reason] ?? "Abwesend", subtitle: a.note, status: "absence", dayKey: dayKeyOf(s), instructorName: (a.instructors as unknown as { display_name: string } | null)?.display_name ?? null }); }
  for (const c of classes ?? []) { const { start: s, end: e } = parseRange(c.period as unknown as string); entries.push({ id: c.id, kind: "theory", start: s, end: e, title: `Theorie ${c.lesson_unit_code}`, subtitle: c.title, status: c.status, dayKey: dayKeyOf(s), instructorName: null }); }
  entries.sort((a, b) => a.start.localeCompare(b.start));
  // Preise je Stundenart aus der gültigen Preisliste (je Klasse, sonst allgemein)
  const prices: Array<{ lessonKind: string; licenseCode: string | null; amountCents: number; unit: string; name: string }> = [];
  for (const pl of priceLists ?? []) for (const it of (pl.price_items ?? []) as Array<{ code: string; name: string; unit: string; amount_cents: number; lesson_kind: string | null }>) if (it.lesson_kind) prices.push({ lessonKind: it.lesson_kind, licenseCode: pl.license_code, amountCents: it.amount_cents, unit: it.unit, name: it.name });
  return { entries, availability: availability ?? [], vehicles: vehicles ?? [], prices, licenses: licenses ?? [], instructorClasses: ctx.instructor?.license_classes ?? [] };
}

// ------------------------------------------------------------------------------------------------
// Theorieunterricht
// ------------------------------------------------------------------------------------------------

export async function loadTheoryClasses(ctx: InstructorContext) {
  const { db } = ctx;
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  let q = db.from("theory_classes").select("id, period, lesson_unit_code, material_kind, title, status, capacity, license_codes, is_online, location_id, locations(name), attendance(status), instructors(display_name)").gte("period", `[${since},)`).order("period");
  if (ctx.instructor) q = q.eq("instructor_id", ctx.instructor.id);
  const [{ data: classes }, { data: locations }, rulesB, { data: licenses }] = await Promise.all([
    q.limit(100), db.from("locations").select("id, name").order("name"), rulesFor(db, "B", "first"), db.from("licenses").select("code, name, base_class").order("code"),
  ]);
  const basicTitles = rulesB.theoryLessons?.rules.basic_unit_titles ?? [];
  const basicUnits = rulesB.theoryLessons?.rules.basic_units ?? 12;
  return {
    classes: (classes ?? []).map((c) => { const { start, end } = parseRange(c.period as unknown as string); const att = (c.attendance ?? []) as Array<{ status: string }>; return { id: c.id, start, end, code: c.lesson_unit_code, materialKind: c.material_kind, title: c.title, status: c.status, capacity: c.capacity, licenseCodes: c.license_codes, isOnline: c.is_online, location: (c.locations as unknown as { name: string } | null)?.name ?? null, present: att.filter((a) => a.status === "present").length, registered: att.length, instructor: (c.instructors as unknown as { display_name: string } | null)?.display_name ?? null }; }),
    locations: locations ?? [], basicUnits: Array.from({ length: basicUnits }, (_, i) => ({ code: `G${i + 1}`, title: basicTitles[i] ?? `Grundstoff Einheit ${i + 1}` })), licenses: licenses ?? [],
  };
}

export async function loadTheoryClassSession(ctx: InstructorContext, classId: string) {
  const { db } = ctx;
  const { data: cls } = await db.from("theory_classes").select("*, locations(name)").eq("id", classId).maybeSingle();
  if (!cls) return null;
  const [{ data: attendance }, { data: students }] = await Promise.all([
    db.from("attendance").select("id, student_id, status, check_in_method, checked_in_at, students(first_name, last_name)").eq("theory_class_id", cls.id).order("checked_in_at", { ascending: false }),
    db.from("students").select("id, first_name, last_name").in("status", ["registered", "active"]).order("last_name").limit(500),
  ]);
  const { start, end } = parseRange(cls.period as unknown as string);
  return {
    cls, start, end, location: (cls.locations as unknown as { name: string } | null)?.name ?? null,
    attendance: (attendance ?? []).map((a) => { const st = a.students as unknown as { first_name: string; last_name: string } | null; return { id: a.id, studentId: a.student_id, name: st ? `${st.first_name} ${st.last_name}` : "", status: a.status, method: a.check_in_method, checkedInAt: a.checked_in_at }; }),
    students: (students ?? []).map((s) => ({ id: s.id, name: `${s.last_name}, ${s.first_name}` })),
  };
}

// ------------------------------------------------------------------------------------------------
// Mock-Prüfung
// ------------------------------------------------------------------------------------------------

export async function loadMockExamContext(ctx: InstructorContext, licenseId: string, mockId?: string) {
  const { db } = ctx;
  const { data: license } = await db.from("student_licenses").select("id, license_code, student_id, students(first_name, last_name)").eq("id", licenseId).maybeSingle();
  if (!license) return null;
  const [{ data: running }, { data: history }, skills] = await Promise.all([
    mockId ? db.from("mock_exams").select("*, mock_exam_events(*)").eq("id", mockId).maybeSingle() : db.from("mock_exams").select("*, mock_exam_events(*)").eq("student_license_id", license.id).eq("status", "running").order("started_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("mock_exams").select("id, started_at, ended_at, overall_score, status, strengths, improvements, summary").eq("student_license_id", license.id).neq("status", "running").order("started_at", { ascending: false }).limit(10),
    loadSkillLabels(db),
  ]);
  const st = license.students as unknown as { first_name: string; last_name: string } | null;
  return { license, studentName: st ? `${st.first_name} ${st.last_name}` : "", current: running ?? null, history: history ?? [], skills };
}

// ------------------------------------------------------------------------------------------------
// Nachrichten
// ------------------------------------------------------------------------------------------------

export async function loadInstructorConversations(ctx: InstructorContext) {
  const { db } = ctx;
  const { data: convs } = await db.from("conversations").select("id, kind, subject, last_message_at, student_id, students(first_name, last_name), conversation_participants(user_id, last_read_at, users(first_name, last_name))").order("last_message_at", { ascending: false, nullsFirst: false }).limit(100);
  const mine = (convs ?? []).filter((c) => ((c.conversation_participants ?? []) as Array<{ user_id: string }>).some((p) => p.user_id === ctx.userId));
  return mine.map((c) => {
    const st = c.students as unknown as { first_name: string; last_name: string } | null;
    const parts = (c.conversation_participants ?? []) as Array<{ user_id: string; last_read_at: string | null; users: { first_name: string; last_name: string } | null }>;
    const me = parts.find((p) => p.user_id === ctx.userId);
    const others = parts.filter((p) => p.user_id !== ctx.userId).map((p) => `${p.users?.first_name ?? ""} ${p.users?.last_name ?? ""}`.trim()).filter(Boolean);
    return { id: c.id, kind: c.kind, subject: c.subject, title: st ? `${st.first_name} ${st.last_name}` : others.join(", ") || (c.subject ?? "Unterhaltung"), lastMessageAt: c.last_message_at, unread: !!c.last_message_at && (!me?.last_read_at || c.last_message_at > me.last_read_at) };
  });
}
