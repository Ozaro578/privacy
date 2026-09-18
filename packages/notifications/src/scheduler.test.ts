import { describe, expect, it } from "vitest";
import { planExamCountdown, planLearnReminder, planLessonReminders, planTheoryClassReminder, planVehicleReminders } from "./scheduler";
import { atLocalTime, formatDate, formatTime, isInQuietHours, localDay, shiftOutOfQuietHours, zonedToUtc } from "./time";

const now = "2026-09-18T10:00:00.000Z"; // 12:00 Uhr Berlin (Sommerzeit)

describe("Zeitzone Europe/Berlin", () => {
  it("rechnet lokale Zeiten in Sommer- und Winterzeit korrekt um", () => {
    expect(zonedToUtc(2026, 9, 20, 10, 30).toISOString()).toBe("2026-09-20T08:30:00.000Z");
    expect(zonedToUtc(2026, 12, 1, 10, 30).toISOString()).toBe("2026-12-01T09:30:00.000Z");
    expect(atLocalTime("2026-09-20", "10:30").toISOString()).toBe("2026-09-20T08:30:00.000Z");
    expect(localDay(new Date("2026-09-19T22:30:00.000Z"))).toBe("2026-09-20");
    expect(formatTime(new Date("2026-12-01T09:30:00.000Z"))).toBe("10:30");
    expect(formatDate(new Date("2026-12-01T09:30:00.000Z"))).toBe("01.12.2026");
    expect(formatTime(new Date("2026-12-01T09:30:00.000Z"), "ar")).toBe("10:30");
  });

  it("erkennt Ruhezeiten über Mitternacht und verschiebt auf deren Ende", () => {
    const quiet = { start: "22:00", end: "07:00" };
    expect(isInQuietHours(new Date("2026-09-19T21:00:00.000Z"), quiet)).toBe(true); // 23:00 lokal
    expect(isInQuietHours(new Date("2026-09-19T05:00:00.000Z"), quiet)).toBe(false); // 07:00 lokal, Ende exklusiv
    expect(isInQuietHours(new Date("2026-09-19T04:59:00.000Z"), quiet)).toBe(true);
    expect(shiftOutOfQuietHours(new Date("2026-09-19T21:00:00.000Z"), quiet).toISOString()).toBe("2026-09-20T05:00:00.000Z");
    expect(shiftOutOfQuietHours(new Date("2026-09-19T02:00:00.000Z"), quiet).toISOString()).toBe("2026-09-19T05:00:00.000Z");
    expect(shiftOutOfQuietHours(new Date("2026-09-19T10:00:00.000Z"), quiet).toISOString()).toBe("2026-09-19T10:00:00.000Z");
    expect(shiftOutOfQuietHours(new Date("2026-09-19T10:00:00.000Z"), null).toISOString()).toBe("2026-09-19T10:00:00.000Z");
    // Ruhezeit innerhalb eines Tages
    expect(shiftOutOfQuietHours(new Date("2026-09-19T11:00:00.000Z"), { start: "12:00", end: "14:00" }).toISOString()).toBe("2026-09-19T12:00:00.000Z");
  });
});

describe("planLessonReminders", () => {
  it("plant 24h und 2h Erinnerungen mit Dedupe-Keys", () => {
    const plans = planLessonReminders({ id: "les_1", starts_at: "2026-09-20T08:30:00.000Z", instructor_name: "Anna", meeting_point: "Fahrschule" }, undefined, now);
    expect(plans).toHaveLength(2);
    expect(plans[0]).toMatchObject({ type: "lesson_reminder_24h", scheduled_for: "2026-09-19T08:30:00.000Z", dedupe_key: "lesson_reminder_24h:les_1", channels: ["in_app", "push"], params: { time: "10:30", date: "20.09.2026", instructorName: "Anna", meetingPoint: "Fahrschule" }, data: { lesson_id: "les_1" } });
    expect(plans[1]).toMatchObject({ type: "lesson_reminder_2h", scheduled_for: "2026-09-20T06:30:00.000Z", dedupe_key: "lesson_reminder_2h:les_1", params: { time: "10:30" } });
  });

  it("verschiebt bei Ruhezeit und lässt Erinnerungen entfallen, die den Beginn erreichen würden", () => {
    // Fahrstunde 06:30 Uhr lokal: 24h-Erinnerung um 06:30 wird auf 07:00 verschoben, 2h-Erinnerung (04:30) würde auf 07:00 nach Beginn rutschen
    const plans = planLessonReminders({ id: "les_2", starts_at: "2026-09-20T04:30:00.000Z" }, undefined, now);
    expect(plans).toHaveLength(1);
    expect(plans[0]).toMatchObject({ type: "lesson_reminder_24h", scheduled_for: "2026-09-19T05:00:00.000Z" });
  });

  it("überspringt vergangene Zeitpunkte, abgesagte Stunden und deaktivierte Typen", () => {
    expect(planLessonReminders({ id: "les_3", starts_at: "2026-09-19T08:30:00.000Z" }, undefined, now).map((p) => p.type)).toEqual(["lesson_reminder_2h"]);
    expect(planLessonReminders({ id: "les_4", starts_at: "2026-09-20T08:30:00.000Z", status: "cancelled" }, undefined, now)).toEqual([]);
    const plans = planLessonReminders({ id: "les_5", starts_at: "2026-09-20T08:30:00.000Z" }, { lesson_reminder_2h: { push: false, in_app: false, email: false } }, now);
    expect(plans.map((p) => p.type)).toEqual(["lesson_reminder_24h"]);
  });

  it("nutzt Ruhezeiten aus den Präferenzen", () => {
    const plans = planLessonReminders({ id: "les_6", starts_at: "2026-09-20T08:30:00.000Z" }, { lesson_reminder_24h: { quiet_hours: { start: "09:00", end: "12:00" } } }, now);
    expect(plans[0]?.scheduled_for).toBe("2026-09-19T10:00:00.000Z");
    const noQuiet = planLessonReminders({ id: "les_7", starts_at: "2026-09-20T04:30:00.000Z" }, { lesson_reminder_2h: { quiet_hours: null } }, now);
    expect(noQuiet.map((p) => p.type)).toContain("lesson_reminder_2h");
  });
});

describe("planExamCountdown", () => {
  it("plant 7, 5, 3 und 1 Tag vorher um 09:00 Uhr", () => {
    const plans = planExamCountdown({ id: "ex_1", kind: "theory", at: "2026-10-01T07:00:00.000Z" }, undefined, now);
    expect(plans.map((p) => p.scheduled_for)).toEqual(["2026-09-24T07:00:00.000Z", "2026-09-26T07:00:00.000Z", "2026-09-28T07:00:00.000Z", "2026-09-30T07:00:00.000Z"]);
    expect(plans.map((p) => p.dedupe_key)).toEqual(["exam_countdown:ex_1:7", "exam_countdown:ex_1:5", "exam_countdown:ex_1:3", "exam_countdown:ex_1:1"]);
    expect(plans[0]?.params).toEqual({ days: 7, kind: "theory" });
  });

  it("lässt vergangene Tage aus und akzeptiert eigene Tage", () => {
    const plans = planExamCountdown({ id: "ex_1", kind: "practical", at: "2026-10-01T07:00:00.000Z" }, undefined, "2026-09-27T00:00:00.000Z", [14, 3, 1]);
    expect(plans.map((p) => p.params.days)).toEqual([3, 1]);
  });
});

describe("planLearnReminder", () => {
  it("plant um 18:00 Uhr, wenn heute noch nicht gelernt wurde", () => {
    const plan = planLearnReminder("2026-09-17T15:00:00.000Z", undefined, now);
    expect(plan).toMatchObject({ type: "learn_reminder", scheduled_for: "2026-09-18T16:00:00.000Z", dedupe_key: "learn_reminder:2026-09-18", channels: ["push"] });
    expect(planLearnReminder(null, undefined, now)?.dedupe_key).toBe("learn_reminder:2026-09-18");
  });

  it("entfällt, wenn heute (lokal) gelernt wurde", () => {
    expect(planLearnReminder("2026-09-18T06:00:00.000Z", undefined, now)).toBeNull();
    // 23:30 UTC am Vortag ist bereits 01:30 lokal am selben Tag
    expect(planLearnReminder("2026-09-17T23:30:00.000Z", undefined, now)).toBeNull();
  });

  it("sendet sofort nach 18:00 Uhr und beachtet Ruhezeiten", () => {
    expect(planLearnReminder(null, undefined, "2026-09-18T19:00:00.000Z")?.scheduled_for).toBe("2026-09-18T19:00:00.000Z");
    expect(planLearnReminder(null, undefined, "2026-09-18T20:30:00.000Z")).toBeNull();
    expect(planLearnReminder(null, undefined, "2026-09-18T20:30:00.000Z", null)?.scheduled_for).toBe("2026-09-18T20:30:00.000Z");
    expect(planLearnReminder(null, undefined, "2026-09-18T15:30:00.000Z", { start: "17:00", end: "19:00" })?.scheduled_for).toBe("2026-09-18T17:00:00.000Z");
  });
});

describe("planVehicleReminders", () => {
  it("plant HU-Erinnerungen 30, 14 und 7 Tage vorher um 08:00 Uhr", () => {
    const plans = planVehicleReminders({ id: "veh_1", license_plate: "B-FS 1234", next_inspection_due: "2026-10-30", next_service_due: null }, now);
    expect(plans.map((p) => p.scheduled_for)).toEqual(["2026-09-30T06:00:00.000Z", "2026-10-16T06:00:00.000Z", "2026-10-23T06:00:00.000Z"]);
    expect(plans.map((p) => p.dedupe_key)).toEqual(["vehicle_inspection_due:veh_1:2026-10-30:30", "vehicle_inspection_due:veh_1:2026-10-30:14", "vehicle_inspection_due:veh_1:2026-10-30:7"]);
    expect(plans[0]?.params).toEqual({ licensePlate: "B-FS 1234", days: 30, dueDate: "30.10.2026" });
    expect(plans[0]?.channels).toEqual(["in_app", "push", "email"]);
  });

  it("plant Wartung getrennt und lässt vergangene Tage aus", () => {
    const plans = planVehicleReminders({ id: "veh_2", license_plate: "B-FS 2", next_inspection_due: "2026-09-20", next_service_due: new Date("2026-12-10T00:00:00.000Z") }, now, [30, 14, 7]);
    expect(plans.map((p) => `${p.type}:${p.params.days}`)).toEqual(["vehicle_service_due:30", "vehicle_service_due:14", "vehicle_service_due:7"]);
    expect(plans[2]?.scheduled_for).toBe("2026-12-03T07:00:00.000Z"); // Winterzeit
  });
});

describe("planTheoryClassReminder", () => {
  it("plant 24 Stunden vorher", () => {
    const plan = planTheoryClassReminder({ id: "tc_1", title: "G1 Persönliche Voraussetzungen", starts_at: "2026-09-21T16:00:00.000Z" }, undefined, now);
    expect(plan).toMatchObject({ type: "theory_class_reminder", scheduled_for: "2026-09-20T16:00:00.000Z", dedupe_key: "theory_class_reminder:tc_1", params: { title: "G1 Persönliche Voraussetzungen", time: "18:00", date: "21.09.2026" } });
    expect(planTheoryClassReminder({ id: "tc_2", title: "x", starts_at: "2026-09-21T16:00:00.000Z", status: "cancelled" }, undefined, now)).toBeNull();
  });
});
