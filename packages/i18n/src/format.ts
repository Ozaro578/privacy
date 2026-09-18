import { CURRENCY, INTL_TAGS, TIME_ZONE, type Locale } from "./types";

type DateInput = Date | string | number;

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

export type DateStyle = "short" | "medium" | "long" | "weekday";

const DATE_OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  short: { day: "2-digit", month: "2-digit", year: "numeric" },
  medium: { day: "numeric", month: "short", year: "numeric" },
  long: { day: "numeric", month: "long", year: "numeric" },
  weekday: { weekday: "long", day: "numeric", month: "long" }
};

/** Datum in Europe/Berlin, z. B. "14.09.2026" (de) oder "14/09/2026" (en). */
export function formatDate(locale: Locale, value: DateInput, style: DateStyle = "short"): string {
  return new Intl.DateTimeFormat(INTL_TAGS[locale], { ...DATE_OPTIONS[style], timeZone: TIME_ZONE }).format(toDate(value));
}

/** Uhrzeit in Europe/Berlin, immer 24-Stunden-Format, z. B. "14:30". */
export function formatTime(locale: Locale, value: DateInput): string {
  return new Intl.DateTimeFormat(INTL_TAGS[locale], { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: TIME_ZONE }).format(toDate(value));
}

/** Datum und Uhrzeit in einem String. */
export function formatDateTime(locale: Locale, value: DateInput): string {
  return `${formatDate(locale, value)} ${formatTime(locale, value)}`;
}

/** Betrag in Euro, Eingabe in Euro (nicht Cent). */
export function formatCurrency(locale: Locale, amount: number): string {
  return new Intl.NumberFormat(INTL_TAGS[locale], { style: "currency", currency: CURRENCY }).format(amount);
}

/** Cent-Betrag (Integer, wie in der Datenbank) in Euro formatieren. */
export function formatCents(locale: Locale, cents: number): string {
  return formatCurrency(locale, cents / 100);
}

export function formatNumber(locale: Locale, value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(INTL_TAGS[locale], options).format(value);
}

/** Prozent aus einem Wert 0..100, ohne Nachkommastellen. */
export function formatPercent(locale: Locale, value: number): string {
  return new Intl.NumberFormat(INTL_TAGS[locale], { style: "percent", maximumFractionDigits: 0 }).format(value / 100);
}

export function pluralCategory(locale: Locale, count: number): Intl.LDMLPluralRule {
  return new Intl.PluralRules(INTL_TAGS[locale]).select(count);
}
