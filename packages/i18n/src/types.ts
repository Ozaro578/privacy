import type { DeMessages } from "./locales/de";

export const SUPPORTED_LOCALES = ["de", "en", "tr", "ar"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "de";
export const RTL_LOCALES: readonly Locale[] = ["ar"];

/** BCP-47-Tags für Intl je App-Sprache. Der Markt ist Deutschland, daher en-GB und lateinische Ziffern für ar. */
export const INTL_TAGS: Record<Locale, string> = {
  de: "de-DE",
  en: "en-GB",
  tr: "tr-TR",
  ar: "ar-EG-u-nu-latn"
};

export const TIME_ZONE = "Europe/Berlin";
export const CURRENCY = "EUR";

/** Rekursiv: jedes Blatt des deutschen Katalogs wird zu string, Struktur bleibt erhalten. */
export type MessageShape<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : MessageShape<T[K]>;
};

/** Der Vertrag, den jede Locale erfüllen muss. */
export type Messages = MessageShape<DeMessages>;

type Leaves<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** Alle gültigen Schlüssel in Punktnotation, z. B. "learn.modeExam". */
export type MessageKey = Leaves<DeMessages>;

export type MessageParams = Record<string, string | number | Date>;

export type TranslateFn = (key: MessageKey, params?: MessageParams) => string;
