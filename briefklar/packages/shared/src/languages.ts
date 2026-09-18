/**
 * Zielsprachen für die Erklärung. Der Brief selbst ist (fast immer) auf Deutsch;
 * die Erklärung wird in der gewählten Sprache ausgegeben.
 *
 * Auswahl: Sprachen, die in Deutschland häufig gesprochen werden
 * (Einwanderung, Geflüchtete, EU-Freizügigkeit, Gastarbeiter-Generationen).
 * Reihenfolge = Reihenfolge in der App (häufigste zuerst).
 */
export const LANGUAGES = [
  { code: "de", label: "Deutsch (einfache Sprache)", nativeLabel: "Deutsch", rtl: false },
  { code: "en", label: "Englisch", nativeLabel: "English", rtl: false },
  { code: "tr", label: "Türkisch", nativeLabel: "Türkçe", rtl: false },
  { code: "ar", label: "Arabisch", nativeLabel: "العربية", rtl: true },
  { code: "uk", label: "Ukrainisch", nativeLabel: "Українська", rtl: false },
  { code: "ru", label: "Russisch", nativeLabel: "Русский", rtl: false },
  { code: "pl", label: "Polnisch", nativeLabel: "Polski", rtl: false },
  { code: "ro", label: "Rumänisch", nativeLabel: "Română", rtl: false },
  { code: "fa", label: "Persisch / Dari", nativeLabel: "فارسی / دری", rtl: true },
  { code: "ps", label: "Paschtu", nativeLabel: "پښتو", rtl: true },
  { code: "ku", label: "Kurdisch (Kurmandschi)", nativeLabel: "Kurdî", rtl: false },
  { code: "ckb", label: "Kurdisch (Sorani)", nativeLabel: "کوردی", rtl: true },
  { code: "it", label: "Italienisch", nativeLabel: "Italiano", rtl: false },
  { code: "es", label: "Spanisch", nativeLabel: "Español", rtl: false },
  { code: "fr", label: "Französisch", nativeLabel: "Français", rtl: false },
  { code: "pt", label: "Portugiesisch", nativeLabel: "Português", rtl: false },
  { code: "el", label: "Griechisch", nativeLabel: "Ελληνικά", rtl: false },
  { code: "hr", label: "Kroatisch", nativeLabel: "Hrvatski", rtl: false },
  { code: "sr", label: "Serbisch", nativeLabel: "Srpski", rtl: false },
  { code: "bs", label: "Bosnisch", nativeLabel: "Bosanski", rtl: false },
  { code: "sq", label: "Albanisch", nativeLabel: "Shqip", rtl: false },
  { code: "mk", label: "Mazedonisch", nativeLabel: "Македонски", rtl: false },
  { code: "bg", label: "Bulgarisch", nativeLabel: "Български", rtl: false },
  { code: "hu", label: "Ungarisch", nativeLabel: "Magyar", rtl: false },
  { code: "cs", label: "Tschechisch", nativeLabel: "Čeština", rtl: false },
  { code: "sk", label: "Slowakisch", nativeLabel: "Slovenčina", rtl: false },
  { code: "nl", label: "Niederländisch", nativeLabel: "Nederlands", rtl: false },
  { code: "lt", label: "Litauisch", nativeLabel: "Lietuvių", rtl: false },
  { code: "vi", label: "Vietnamesisch", nativeLabel: "Tiếng Việt", rtl: false },
  { code: "zh", label: "Chinesisch", nativeLabel: "中文", rtl: false },
  { code: "th", label: "Thailändisch", nativeLabel: "ไทย", rtl: false },
  { code: "tl", label: "Tagalog / Filipino", nativeLabel: "Filipino", rtl: false },
  { code: "ur", label: "Urdu", nativeLabel: "اردو", rtl: true },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", rtl: false },
  { code: "pa", label: "Panjabi", nativeLabel: "ਪੰਜਾਬੀ", rtl: false },
  { code: "bn", label: "Bengalisch", nativeLabel: "বাংলা", rtl: false },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்", rtl: false },
  { code: "ti", label: "Tigrinya", nativeLabel: "ትግርኛ", rtl: false },
  { code: "am", label: "Amharisch", nativeLabel: "አማርኛ", rtl: false },
  { code: "so", label: "Somali", nativeLabel: "Soomaali", rtl: false },
  { code: "sw", label: "Swahili", nativeLabel: "Kiswahili", rtl: false },
  { code: "ha", label: "Hausa", nativeLabel: "Hausa", rtl: false },
  { code: "ka", label: "Georgisch", nativeLabel: "ქართული", rtl: false },
  { code: "hy", label: "Armenisch", nativeLabel: "Հայերեն", rtl: false },
  { code: "az", label: "Aserbaidschanisch", nativeLabel: "Azərbaycanca", rtl: false },
  { code: "he", label: "Hebräisch", nativeLabel: "עברית", rtl: true },
  { code: "ja", label: "Japanisch", nativeLabel: "日本語", rtl: false },
  { code: "ko", label: "Koreanisch", nativeLabel: "한국어", rtl: false },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code) as [LanguageCode, ...LanguageCode[]];

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === "string" && (LANGUAGE_CODES as readonly string[]).includes(value);
}

/** Anzeigename in der Sprache selbst (für die Sprachauswahl) */
export function languageLabel(code: LanguageCode): string {
  return LANGUAGES.find((l) => l.code === code)?.nativeLabel ?? code;
}

/** Deutscher Name (für Prompts und Logs) */
export function languageLabelDe(code: LanguageCode): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code;
}

export function isRtl(code: LanguageCode): boolean {
  return LANGUAGES.find((l) => l.code === code)?.rtl ?? false;
}
