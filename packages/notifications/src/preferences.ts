import type { Channel, NotificationPreference, NotificationType, PreferenceOverrides, QuietHours } from "./types";

/** Standard-Ruhezeit: keine Push-Nachrichten zwischen 22:00 und 07:00 Uhr (Europe/Berlin). */
export const DEFAULT_QUIET_HOURS: QuietHours = { start: "22:00", end: "07:00" };

const pref = (push: boolean, email: boolean, in_app: boolean, quiet: QuietHours | null = DEFAULT_QUIET_HOURS): NotificationPreference => ({ push, email, in_app, quiet_hours: quiet });

/** Standard-Präferenzen je Typ. Zeitkritische Typen (Absage, Nachricht, Wartelistenangebot) haben keine Ruhezeit. */
export const DEFAULT_PREFERENCES: Readonly<Record<NotificationType, NotificationPreference>> = {
  lesson_reminder_24h: pref(true, false, true),
  lesson_reminder_2h: pref(true, false, true),
  earlier_slot_available: pref(true, false, true),
  learn_reminder: pref(true, false, false),
  exam_countdown: pref(true, false, true),
  invoice_due: pref(true, true, true),
  message_received: pref(true, false, true, null),
  waitlist_offer: pref(true, true, true, null),
  document_missing: pref(true, true, true),
  lesson_cancelled: pref(true, true, true, null),
  theory_class_reminder: pref(true, false, true),
  vehicle_inspection_due: pref(true, true, true),
  vehicle_service_due: pref(true, true, true),
};

/** Präferenz eines Nutzers für einen Typ: Standard mit Überschreibungen aus notification_preferences. */
export function resolvePreference(type: NotificationType, overrides?: PreferenceOverrides): NotificationPreference {
  const base = DEFAULT_PREFERENCES[type];
  const o = overrides?.[type];
  if (!o) return { ...base };
  return {
    push: o.push ?? base.push,
    email: o.email ?? base.email,
    in_app: o.in_app ?? base.in_app,
    quiet_hours: o.quiet_hours === undefined ? base.quiet_hours : o.quiet_hours,
  };
}

/** Kanäle laut Präferenz in fester Reihenfolge. */
export function enabledChannels(p: NotificationPreference): Channel[] {
  const channels: Channel[] = [];
  if (p.in_app) channels.push("in_app");
  if (p.push) channels.push("push");
  if (p.email) channels.push("email");
  return channels;
}

/** Zeile aus notification_preferences (time-Spalten als "HH:MM" oder "HH:MM:SS") in Überschreibungen umwandeln. */
export interface PreferenceRow {
  notification_type: string;
  push: boolean;
  email: boolean;
  in_app: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export function overridesFromRows(rows: readonly PreferenceRow[]): PreferenceOverrides {
  const out: PreferenceOverrides = {};
  for (const row of rows) {
    const type = row.notification_type as NotificationType;
    if (!(type in DEFAULT_PREFERENCES)) continue;
    const quiet: QuietHours | null = row.quiet_hours_start && row.quiet_hours_end ? { start: row.quiet_hours_start.slice(0, 5), end: row.quiet_hours_end.slice(0, 5) } : null;
    out[type] = { push: row.push, email: row.email, in_app: row.in_app, quiet_hours: quiet };
  }
  return out;
}
