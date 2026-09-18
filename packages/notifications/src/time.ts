import type { Locale, QuietHours } from "./types";

export const TIME_ZONE = "Europe/Berlin";

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function toDate(value: Date | string | number): Date {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`Ungültiger Zeitpunkt: ${String(value)}`);
  return d;
}

/** Lokale Bestandteile (Europe/Berlin) eines Zeitpunkts. */
export function zonedParts(date: Date): ZonedParts {
  const out: Partial<ZonedParts> = {};
  for (const part of partsFormatter.formatToParts(date)) {
    if (part.type === "year" || part.type === "month" || part.type === "day" || part.type === "hour" || part.type === "minute" || part.type === "second") out[part.type] = Number(part.value);
  }
  return { year: out.year ?? 0, month: out.month ?? 0, day: out.day ?? 0, hour: out.hour === 24 ? 0 : (out.hour ?? 0), minute: out.minute ?? 0, second: out.second ?? 0 };
}

function offsetMs(date: Date): number {
  const p = zonedParts(date);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(date.getTime() / 1000) * 1000;
}

/** Lokale Uhrzeit (Europe/Berlin) in einen UTC-Zeitpunkt umrechnen, inklusive Sommerzeit. */
export function zonedToUtc(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const first = wall - offsetMs(new Date(wall));
  const second = wall - offsetMs(new Date(first));
  return new Date(first === second ? first : second);
}

/** Lokales Datum (YYYY-MM-DD) eines Zeitpunkts. */
export function localDay(date: Date): string {
  const p = zonedParts(date);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Zeitpunkt für eine lokale Uhrzeit an einem lokalen Datum (YYYY-MM-DD). */
export function atLocalTime(day: string, time: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  if (!y || !m || !d || hh === undefined || mm === undefined || Number.isNaN(hh) || Number.isNaN(mm)) throw new Error(`Ungültiges Datum oder Uhrzeit: ${day} ${time}`);
  return zonedToUtc(y, m, d, hh, mm);
}

/** Lokales Datum um n Tage verschieben (kalendarisch, ohne Zeitzonen-Effekte). */
export function addLocalDays(day: string, days: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, (d ?? 1) + days));
  return date.toISOString().slice(0, 10);
}

/** Datum als ISO-Tag (YYYY-MM-DD) aus Date oder Zeichenkette (nur der Datumsteil zählt). */
export function isoDay(value: Date | string): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
}

function minutesOfDay(time: string): number {
  const [h, m] = time.split(":").map(Number);
  if (h === undefined || m === undefined || Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) throw new Error(`Ungültige Uhrzeit: ${time}`);
  return h * 60 + m;
}

/** Liegt der Zeitpunkt (lokal) innerhalb der Ruhezeit? Ende ist exklusiv. */
export function isInQuietHours(date: Date, quiet: QuietHours | null | undefined): boolean {
  if (!quiet) return false;
  const start = minutesOfDay(quiet.start);
  const end = minutesOfDay(quiet.end);
  if (start === end) return false;
  const p = zonedParts(date);
  const now = p.hour * 60 + p.minute;
  return start < end ? now >= start && now < end : now >= start || now < end;
}

/** Verschiebt einen Zeitpunkt auf das Ende der Ruhezeit, falls er innerhalb liegt. */
export function shiftOutOfQuietHours(date: Date, quiet: QuietHours | null | undefined): Date {
  if (!quiet || !isInQuietHours(date, quiet)) return date;
  const start = minutesOfDay(quiet.start);
  const end = minutesOfDay(quiet.end);
  const p = zonedParts(date);
  const now = p.hour * 60 + p.minute;
  const today = localDay(date);
  // Über Mitternacht (z. B. 22:00 bis 07:00): vor Mitternacht endet die Ruhezeit erst am nächsten Tag
  const endDay = start > end && now >= start ? addLocalDays(today, 1) : today;
  return atLocalTime(endDay, quiet.end);
}

const LOCALE_TAGS: Record<Locale, string> = { de: "de-DE", en: "en-GB", tr: "tr-TR", ar: "ar-EG" };

/** Uhrzeit lokal formatieren, z. B. "10:30". Arabisch verwendet lateinische Ziffern zur besseren Lesbarkeit in Push-Texten. */
export function formatTime(date: Date, locale: Locale = "de"): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : LOCALE_TAGS[locale], { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
}

/** Datum lokal formatieren, z. B. "18.09.2026". */
export function formatDate(date: Date, locale: Locale = "de"): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : LOCALE_TAGS[locale], { timeZone: TIME_ZONE, day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

/** Datum mit Wochentag, z. B. "Fr., 18.09.2026". */
export function formatDateWithWeekday(date: Date, locale: Locale = "de"): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : LOCALE_TAGS[locale], { timeZone: TIME_ZONE, weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}
