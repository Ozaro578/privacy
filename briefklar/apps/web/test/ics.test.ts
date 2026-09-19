import { describe, expect, it } from "vitest";
import { buildIcs, googleCalendarUrl, safeFilename } from "../src/ics";

describe("ics", () => {
  it("builds a timed event with timezone and alarms, CRLF", () => {
    const ics = buildIcs([{ title: "Termin Jobcenter", date: "2026-09-24", time: "09:30", durationMinutes: 30, location: "Raum 2.14", description: "Mitbringen: Ausweis", alarmsMinutesBefore: [1440, 120] }]);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("BEGIN:VTIMEZONE");
    expect(ics).toContain("DTSTART;TZID=Europe/Berlin:20260924T093000");
    expect(ics).toContain("DTEND;TZID=Europe/Berlin:20260924T100000");
    expect(ics).toContain("SUMMARY:Termin Jobcenter");
    expect(ics).toContain("LOCATION:Raum 2.14");
    expect((ics.match(/BEGIN:VALARM/g) ?? []).length).toBe(2);
    expect(ics).toContain("TRIGGER:-PT1440M");
    expect(ics.split("\n").every((l) => l === "" || l.endsWith("\r"))).toBe(true);
  });
  it("builds an all-day event without timezone block", () => {
    const ics = buildIcs([{ title: "Frist: Widerspruch", date: "2026-10-13", time: null, alarmsMinutesBefore: [4320] }]);
    expect(ics).not.toContain("BEGIN:VTIMEZONE");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261013");
    expect(ics).toContain("DTEND;VALUE=DATE:20261014");
  });
  it("escapes commas and newlines", () => {
    const ics = buildIcs([{ title: "A, B", date: "2026-01-01", time: null, description: "Zeile 1\nZeile 2", alarmsMinutesBefore: [] }]);
    expect(ics).toContain("SUMMARY:A\\, B");
    const loc = buildIcs([{ title: "x", date: "2026-01-01", time: null, location: "Str. 1; Raum 2", alarmsMinutesBefore: [] }]);
    expect(loc).toContain("LOCATION:Str. 1\\; Raum 2");
    expect(ics).toContain("DESCRIPTION:Zeile 1\\nZeile 2");
  });
  it("skips invalid dates", () => {
    expect(buildIcs([{ title: "x", date: "kein datum", time: null, alarmsMinutesBefore: [] }])).not.toContain("BEGIN:VEVENT");
    expect(buildIcs([{ title: "x", date: "2026-13-45", time: null, alarmsMinutesBefore: [] }])).not.toContain("BEGIN:VEVENT");
  });
  it("google calendar url", () => {
    const u = googleCalendarUrl({ title: "T", date: "2026-09-24", time: "09:30", durationMinutes: 60, alarmsMinutesBefore: [] })!;
    expect(u).toContain("calendar.google.com");
    expect(u).toContain("dates=20260924T093000%2F20260924T103000");
  });
  it("safe ASCII filenames", () => {
    expect(safeFilename("Termin Jobcenter – Gespräch Sachbearbeiterin.ics")).toBe("Termin_Jobcenter_Gespraech_Sachbearbeiterin.ics");
    expect(safeFilename("   ")).toBe("termin.ics");
    expect(safeFilename("Frist: Überweisung 128,40 €")).toBe("Frist_Ueberweisung_128_40.ics");
  });
});
