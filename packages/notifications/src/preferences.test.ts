import { describe, expect, it } from "vitest";
import { DEFAULT_PREFERENCES, DEFAULT_QUIET_HOURS, enabledChannels, overridesFromRows, resolvePreference } from "./preferences";
import { NOTIFICATION_TYPES } from "./types";

describe("Präferenzen", () => {
  it("hat für jeden Typ eine Standardpräferenz", () => {
    for (const type of NOTIFICATION_TYPES) expect(DEFAULT_PREFERENCES[type]).toBeDefined();
    expect(DEFAULT_PREFERENCES.invoice_due.email).toBe(true);
    expect(DEFAULT_PREFERENCES.learn_reminder).toEqual({ push: true, email: false, in_app: false, quiet_hours: DEFAULT_QUIET_HOURS });
    expect(DEFAULT_PREFERENCES.message_received.quiet_hours).toBeNull();
  });

  it("überschreibt nur die angegebenen Felder", () => {
    const p = resolvePreference("lesson_reminder_24h", { lesson_reminder_24h: { push: false } });
    expect(p).toEqual({ push: false, email: false, in_app: true, quiet_hours: DEFAULT_QUIET_HOURS });
    expect(resolvePreference("lesson_reminder_24h", { lesson_reminder_24h: { quiet_hours: null } }).quiet_hours).toBeNull();
    expect(resolvePreference("lesson_reminder_24h", {})).toEqual(DEFAULT_PREFERENCES.lesson_reminder_24h);
    expect(resolvePreference("lesson_reminder_24h")).not.toBe(DEFAULT_PREFERENCES.lesson_reminder_24h);
  });

  it("liefert Kanäle in fester Reihenfolge", () => {
    expect(enabledChannels({ push: true, email: true, in_app: true, quiet_hours: null })).toEqual(["in_app", "push", "email"]);
    expect(enabledChannels({ push: false, email: false, in_app: false, quiet_hours: null })).toEqual([]);
  });

  it("wandelt Datenbankzeilen um und ignoriert unbekannte Typen", () => {
    const overrides = overridesFromRows([
      { notification_type: "invoice_due", push: false, email: true, in_app: true, quiet_hours_start: "21:30:00", quiet_hours_end: "08:00:00" },
      { notification_type: "learn_reminder", push: true, email: false, in_app: false, quiet_hours_start: null, quiet_hours_end: null },
      { notification_type: "unbekannt", push: true, email: true, in_app: true, quiet_hours_start: null, quiet_hours_end: null },
    ]);
    expect(overrides.invoice_due).toEqual({ push: false, email: true, in_app: true, quiet_hours: { start: "21:30", end: "08:00" } });
    expect(overrides.learn_reminder?.quiet_hours).toBeNull();
    expect(Object.keys(overrides)).toEqual(["invoice_due", "learn_reminder"]);
  });
});
