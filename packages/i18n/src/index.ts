import { de } from "./locales/de";
import { en } from "./locales/en";
import { tr } from "./locales/tr";
import { ar } from "./locales/ar";
import { interpolate } from "./interpolate";
import { formatCurrency, formatDate, formatDateTime, formatNumber, formatPercent, formatTime, formatCents } from "./format";
import { DEFAULT_LOCALE, RTL_LOCALES, SUPPORTED_LOCALES, type Locale, type MessageKey, type MessageParams, type Messages, type TranslateFn } from "./types";

export * from "./types";
export * from "./format";
export { interpolate } from "./interpolate";
export { de, en, tr, ar };

export const MESSAGES: Record<Locale, Messages> = { de, en, tr, ar };

/**
 * Hinweis zur Trennung von App-Sprache und Prüfungssprache.
 * Übersetzungen der Lerninhalte (Fragen, Erklärungen) sind Lernhilfen. Welche Sprachen in der
 * theoretischen Prüfung zulässig sind, entscheidet die Prüforganisation; diese Liste wird
 * nicht in packages/i18n, sondern in der Regel-Engine (rule_type exam_languages) gepflegt.
 */
export const TRANSLATION_NOTICE =
  "Übersetzungen der Lerninhalte sind Lernhilfen. Offizielle Prüfungssprachen sind Sache der Prüforganisation und werden über die Regel-Engine (exam_languages) gepflegt.";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

/** "rtl" oder "ltr" für das dir-Attribut. */
export function textDirection(locale: Locale): "rtl" | "ltr" {
  return isRtl(locale) ? "rtl" : "ltr";
}

export const LOCALE_NAMES: Record<Locale, string> = { de: "Deutsch", en: "English", tr: "Türkçe", ar: "العربية" };

type MissingKeyHandler = (locale: Locale, key: string) => void;

const isDev = (): boolean => {
  const env = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV;
  return env !== "production";
};

const defaultMissingKeyHandler: MissingKeyHandler = (locale, key) => {
  if (isDev()) console.warn(`[i18n] Fehlender Schlüssel "${key}" in Locale "${locale}", Fallback auf "${DEFAULT_LOCALE}".`);
};

export function lookup(messages: Messages, key: string): string | undefined {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (node === null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

export interface CreateTOptions {
  onMissingKey?: MissingKeyHandler;
  /**
   * Optionale Kataloge, die die eingebauten ersetzen (z. B. Tenant-Overrides für White-Label
   * oder gezielt unvollständige Kataloge in Tests). Nicht angegebene Locales nutzen MESSAGES.
   */
  catalogs?: Partial<Record<Locale, Messages>>;
}

/** Alle Blattschlüssel eines Katalogs in Punktnotation, sortiert. Für CI-Vergleiche der Locales. */
export function flattenKeys(messages: Messages, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [name, value] of Object.entries(messages as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${name}` : name;
    if (typeof value === "string") keys.push(key);
    else if (value !== null && typeof value === "object") keys.push(...flattenKeys(value as Messages, key));
  }
  return keys.sort();
}

/**
 * Erzeugt eine Übersetzungsfunktion für eine Locale.
 * Fehlt ein Schlüssel in der Locale, wird der deutsche Text verwendet und in Entwicklung gewarnt.
 * Fehlt er auch in de, wird der Schlüssel selbst zurückgegeben (nur in Tests sichtbar, da der
 * Schlüsselvergleich in CI fehlende Schlüssel verhindert).
 */
export function createT(locale: Locale, options: CreateTOptions = {}): TranslateFn {
  const onMissing = options.onMissingKey ?? defaultMissingKeyHandler;
  const primary = options.catalogs?.[locale] ?? MESSAGES[locale];
  const fallback = options.catalogs?.[DEFAULT_LOCALE] ?? MESSAGES[DEFAULT_LOCALE];
  return (key: MessageKey, params?: MessageParams): string => {
    let message = lookup(primary, key);
    let usedLocale = locale;
    if (message === undefined) {
      onMissing(locale, key);
      message = lookup(fallback, key);
      usedLocale = DEFAULT_LOCALE;
    }
    if (message === undefined) return key;
    return interpolate(usedLocale, message, params);
  };
}

/** Bündel aus t und Formatierern für eine Locale, praktisch für React-Context oder Server-Komponenten. */
export function createI18n(locale: Locale, options?: CreateTOptions) {
  return {
    locale,
    dir: textDirection(locale),
    t: createT(locale, options),
    formatDate: (value: Date | string | number, style?: Parameters<typeof formatDate>[2]) => formatDate(locale, value, style),
    formatTime: (value: Date | string | number) => formatTime(locale, value),
    formatDateTime: (value: Date | string | number) => formatDateTime(locale, value),
    formatCurrency: (amount: number) => formatCurrency(locale, amount),
    formatCents: (cents: number) => formatCents(locale, cents),
    formatNumber: (value: number, opts?: Intl.NumberFormatOptions) => formatNumber(locale, value, opts),
    formatPercent: (value: number) => formatPercent(locale, value)
  };
}

export type I18n = ReturnType<typeof createI18n>;
