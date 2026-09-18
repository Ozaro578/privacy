import { enabledChannels, resolvePreference } from "./preferences";
import { addLocalDays, atLocalTime, formatDate, formatTime, isoDay, localDay, shiftOutOfQuietHours, toDate } from "./time";
import type { Channel, NotificationPreference, NotificationType, PlannedNotification, PreferenceOverrides, QuietHours, TemplateParams } from "./types";

export interface LessonRef {
  id: string;
  /** Beginn (untere Grenze von lessons.period), ISO-8601 oder Date. */
  starts_at: Date | string;
  status?: string;
  instructor_name?: string;
  meeting_point?: string | null;
}

export interface ExamRef {
  id: string;
  kind: "theory" | "practical";
  /** Prüfungstermin, ISO-8601 oder Date. */
  at: Date | string;
}

export interface VehicleRef {
  id: string;
  license_plate: string;
  /** ISO-Datum (YYYY-MM-DD) oder Date. */
  next_inspection_due?: Date | string | null;
  next_service_due?: Date | string | null;
}

export interface TheoryClassRef {
  id: string;
  title: string;
  starts_at: Date | string;
  status?: string;
}

/** Uhrzeiten (Europe/Berlin) für tagesbezogene Erinnerungen. */
export const PLANNING_TIMES = { exam_countdown: "09:00", learn_reminder: "18:00", vehicle: "08:00" } as const;

function plan<T extends NotificationType>(type: T, params: TemplateParams<T>, scheduledFor: Date, dedupeKey: string, pref: NotificationPreference, data: Record<string, string | number>): PlannedNotification<T> {
  return { type, params, scheduled_for: scheduledFor.toISOString(), dedupe_key: dedupeKey, channels: enabledChannels(pref), data };
}

function anyChannel(channels: Channel[]): boolean {
  return channels.length > 0;
}

/**
 * Erinnerungen 24 Stunden und 2 Stunden vor Beginn. Ruhezeiten verschieben den Versand nach hinten;
 * fällt der verschobene Zeitpunkt auf oder hinter den Beginn, entfällt die Erinnerung.
 */
export function planLessonReminders(lesson: LessonRef, prefs: PreferenceOverrides | undefined, now: Date | string): PlannedNotification[] {
  const nowDate = toDate(now);
  const start = toDate(lesson.starts_at);
  if (lesson.status === "cancelled" || lesson.status === "completed" || lesson.status === "no_show") return [];
  const out: PlannedNotification[] = [];
  const offsets: { type: "lesson_reminder_24h" | "lesson_reminder_2h"; hours: number }[] = [
    { type: "lesson_reminder_24h", hours: 24 },
    { type: "lesson_reminder_2h", hours: 2 },
  ];
  for (const { type, hours } of offsets) {
    const pref = resolvePreference(type, prefs);
    if (!anyChannel(enabledChannels(pref))) continue;
    const raw = new Date(start.getTime() - hours * 3_600_000);
    if (raw <= nowDate) continue;
    const scheduled = shiftOutOfQuietHours(raw, pref.quiet_hours);
    if (scheduled >= start) continue;
    const data = { lesson_id: lesson.id, starts_at: start.toISOString() };
    if (type === "lesson_reminder_24h") {
      const params: TemplateParams<"lesson_reminder_24h"> = { time: formatTime(start), date: formatDate(start) };
      if (lesson.instructor_name) params.instructorName = lesson.instructor_name;
      if (lesson.meeting_point) params.meetingPoint = lesson.meeting_point;
      out.push(plan(type, params, scheduled, `lesson_reminder_24h:${lesson.id}`, pref, data));
    } else {
      const params: TemplateParams<"lesson_reminder_2h"> = { time: formatTime(start) };
      if (lesson.meeting_point) params.meetingPoint = lesson.meeting_point;
      out.push(plan(type, params, scheduled, `lesson_reminder_2h:${lesson.id}`, pref, data));
    }
  }
  return out;
}

/** Countdown vor einer Prüfung an den angegebenen Tagen (Standard 7, 5, 3, 1) um 09:00 Uhr. */
export function planExamCountdown(exam: ExamRef, prefs: PreferenceOverrides | undefined, now: Date | string, days: readonly number[] = [7, 5, 3, 1]): PlannedNotification<"exam_countdown">[] {
  const nowDate = toDate(now);
  const examAt = toDate(exam.at);
  const pref = resolvePreference("exam_countdown", prefs);
  if (!anyChannel(enabledChannels(pref))) return [];
  const examDay = localDay(examAt);
  const out: PlannedNotification<"exam_countdown">[] = [];
  for (const d of [...days].sort((a, b) => b - a)) {
    if (d <= 0) continue;
    const raw = atLocalTime(addLocalDays(examDay, -d), PLANNING_TIMES.exam_countdown);
    if (raw <= nowDate) continue;
    const scheduled = shiftOutOfQuietHours(raw, pref.quiet_hours);
    if (scheduled >= examAt) continue;
    out.push(plan("exam_countdown", { days: d, kind: exam.kind }, scheduled, `exam_countdown:${exam.id}:${d}`, pref, { exam_id: exam.id, exam_kind: exam.kind, days: d }));
  }
  return out;
}

/**
 * Lernerinnerung, wenn heute (lokal) noch nicht gelernt wurde: um 18:00 Uhr, oder sofort, wenn 18:00 Uhr bereits vorbei ist.
 * Ruhezeiten verschieben den Versand; liegt der Zeitpunkt dann am Folgetag, entfällt die Erinnerung für heute.
 */
export function planLearnReminder(lastLearnedAt: Date | string | null, prefs: PreferenceOverrides | undefined, now: Date | string, quietHours?: QuietHours | null): PlannedNotification<"learn_reminder"> | null {
  const nowDate = toDate(now);
  const today = localDay(nowDate);
  if (lastLearnedAt !== null && localDay(toDate(lastLearnedAt)) === today) return null;
  const base = resolvePreference("learn_reminder", prefs);
  const pref: NotificationPreference = quietHours === undefined ? base : { ...base, quiet_hours: quietHours };
  if (!anyChannel(enabledChannels(pref))) return null;
  const raw = atLocalTime(today, PLANNING_TIMES.learn_reminder);
  const scheduled = shiftOutOfQuietHours(raw > nowDate ? raw : nowDate, pref.quiet_hours);
  if (localDay(scheduled) !== today) return null;
  return plan("learn_reminder", {}, scheduled, `learn_reminder:${today}`, pref, { day: today });
}

/** Erinnerungen an HU und Wartung für das Büro an den angegebenen Tagen vor Fälligkeit (Standard 30, 14, 7) um 08:00 Uhr. */
export type VehicleReminderType = "vehicle_inspection_due" | "vehicle_service_due";

export function planVehicleReminders(vehicle: VehicleRef, now: Date | string, days: readonly number[] = [30, 14, 7], prefs?: PreferenceOverrides): PlannedNotification<VehicleReminderType>[] {
  const nowDate = toDate(now);
  const out: PlannedNotification<VehicleReminderType>[] = [];
  const targets: { type: VehicleReminderType; due: Date | string | null | undefined }[] = [
    { type: "vehicle_inspection_due", due: vehicle.next_inspection_due },
    { type: "vehicle_service_due", due: vehicle.next_service_due },
  ];
  for (const { type, due } of targets) {
    if (!due) continue;
    const dueDay = isoDay(due);
    const pref = resolvePreference(type, prefs);
    if (!anyChannel(enabledChannels(pref))) continue;
    for (const d of [...days].sort((a, b) => b - a)) {
      if (d < 0) continue;
      const raw = atLocalTime(addLocalDays(dueDay, -d), PLANNING_TIMES.vehicle);
      if (raw <= nowDate) continue;
      const scheduled = shiftOutOfQuietHours(raw, pref.quiet_hours);
      const params: TemplateParams<VehicleReminderType> = { licensePlate: vehicle.license_plate, days: d, dueDate: formatDate(atLocalTime(dueDay, "12:00")) };
      out.push(plan<VehicleReminderType>(type, params, scheduled, `${type}:${vehicle.id}:${dueDay}:${d}`, pref, { vehicle_id: vehicle.id, due: dueDay, days: d }));
    }
  }
  return out;
}

/** Erinnerung an Theorieunterricht 24 Stunden vor Beginn. */
export function planTheoryClassReminder(theoryClass: TheoryClassRef, prefs: PreferenceOverrides | undefined, now: Date | string): PlannedNotification<"theory_class_reminder"> | null {
  const nowDate = toDate(now);
  const start = toDate(theoryClass.starts_at);
  if (theoryClass.status === "cancelled" || theoryClass.status === "completed") return null;
  const pref = resolvePreference("theory_class_reminder", prefs);
  if (!anyChannel(enabledChannels(pref))) return null;
  const raw = new Date(start.getTime() - 24 * 3_600_000);
  if (raw <= nowDate) return null;
  const scheduled = shiftOutOfQuietHours(raw, pref.quiet_hours);
  if (scheduled >= start) return null;
  return plan("theory_class_reminder", { title: theoryClass.title, time: formatTime(start), date: formatDate(start) }, scheduled, `theory_class_reminder:${theoryClass.id}`, pref, { theory_class_id: theoryClass.id, starts_at: start.toISOString() });
}
