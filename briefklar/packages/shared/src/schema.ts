import { z } from "zod";
import { LANGUAGE_CODES } from "./languages.js";

/**
 * Datenvertrag zwischen API und App.
 * Das Modell liefert genau diese Struktur (Structured Output); die App rendert sie.
 * Alle Freitexte sind in der Zielsprache (`language`), Fachbegriffe im Glossar
 * bleiben zusätzlich im deutschen Original stehen.
 */

export const Urgency = z.enum([
  "sofort", // heute / innerhalb von 1–3 Tagen handeln
  "diese_woche",
  "bald", // innerhalb von 2–4 Wochen
  "keine_eile",
  "nur_info", // nichts zu tun
]);
export type Urgency = z.infer<typeof Urgency>;

export const SenderType = z.enum([
  "behoerde", // Jobcenter, Ausländerbehörde, Finanzamt, Bürgeramt, Familienkasse …
  "gericht",
  "krankenkasse",
  "versicherung",
  "bank",
  "vermieter",
  "arbeitgeber",
  "inkasso",
  "firma",
  "schule_kita",
  "sonstiges",
  "unbekannt",
]);
export type SenderType = z.infer<typeof SenderType>;

export const Deadline = z.object({
  /** ISO-Datum (YYYY-MM-DD) wenn eindeutig erkennbar, sonst null */
  date: z.string().nullable(),
  /** z.B. "Widerspruch einlegen" – in Zielsprache */
  description: z.string(),
  /** Was passiert, wenn man die Frist verpasst – in Zielsprache, null wenn unbekannt */
  consequence_if_missed: z.string().nullable(),
});
export type Deadline = z.infer<typeof Deadline>;

export const ActionStep = z.object({
  step: z.number().int().min(1),
  /** Ein konkreter, kurzer Handlungsschritt in Zielsprache */
  text: z.string(),
  /** Muss ich das tun oder ist es optional? */
  required: z.boolean(),
});
export type ActionStep = z.infer<typeof ActionStep>;

export const MoneyInfo = z.object({
  /** "zahlen" = ich muss zahlen, "bekommen" = ich bekomme Geld */
  direction: z.enum(["zahlen", "bekommen", "keine", "unklar"]),
  /** Betrag als Text, z.B. "245,60 €", null wenn keiner */
  amount: z.string().nullable(),
  /** Kurze Erklärung wofür / bis wann / an wen – in Zielsprache */
  details: z.string().nullable(),
});
export type MoneyInfo = z.infer<typeof MoneyInfo>;

export const GlossaryEntry = z.object({
  /** Deutscher Originalbegriff aus dem Brief, z.B. "Widerspruch" */
  term_de: z.string(),
  /** Erklärung in Zielsprache, max. 2 Sätze */
  explanation: z.string(),
});
export type GlossaryEntry = z.infer<typeof GlossaryEntry>;

export const HelpContact = z.object({
  /** z.B. "Migrationsberatung für Erwachsene (MBE)", "Verbraucherzentrale", "Sozialberatung der Caritas/Diakonie/AWO" */
  name: z.string(),
  /** Wie / wobei diese Stelle hilft – in Zielsprache */
  how: z.string(),
});
export type HelpContact = z.infer<typeof HelpContact>;

export const ExplainResult = z.object({
  /** Sprache der Erklärung (Sprachcode) */
  language: z.enum(LANGUAGE_CODES),

  /** Konnte der Brief überhaupt gelesen werden? false → Rest nur best effort */
  is_readable: z.boolean(),
  /** Hinweis, wenn z.B. nur Seite 2 von 3 fotografiert wurde oder das Bild unscharf ist – in Zielsprache, sonst null */
  quality_hint: z.string().nullable(),

  /** Art des Schreibens, kurz, in Zielsprache, z.B. "Bescheid", "Mahnung", "Rechnung", "Terminladung" */
  document_type: z.string(),
  sender: z.object({
    /** Name des Absenders wie im Brief, null wenn nicht erkennbar */
    name: z.string().nullable(),
    type: SenderType,
  }),
  /** Aktenzeichen / Kundennummer / Referenz falls sichtbar (hilft beim Antworten) */
  reference_number: z.string().nullable(),
  /** Datum des Briefs (ISO) falls sichtbar */
  letter_date: z.string().nullable(),

  /** 1–2 Sätze: Worum geht es? Einfache Sprache. */
  summary: z.string(),
  /** 3–6 kurze Sätze: Was bedeutet das konkret für mich? Einfache Sprache. */
  what_it_means: z.string(),

  urgency: Urgency,
  deadlines: z.array(Deadline),
  actions: z.array(ActionStep),
  money: MoneyInfo,

  /** Kann ich mich wehren (Widerspruch/Einspruch)? Kurz erklärt, null wenn nicht relevant */
  can_object: z.string().nullable(),

  glossary: z.array(GlossaryEntry),
  where_to_get_help: z.array(HelpContact),

  /** Betrugsverdacht: Merkmale wie fremde IBAN, Druck, Rechtschreibfehler, unbekannter Absender */
  scam_risk: z.enum(["niedrig", "mittel", "hoch"]),
  /** Konkrete Warnhinweise in Zielsprache (leer wenn keine) */
  warnings: z.array(z.string()),

  /** Wie sicher ist die Einschätzung? */
  confidence: z.enum(["hoch", "mittel", "niedrig"]),
});
export type ExplainResult = z.infer<typeof ExplainResult>;

/** Request-Body für POST /api/explain (multipart) – Felder außer Bildern */
export const ExplainRequestFields = z.object({
  language: z.enum(LANGUAGE_CODES).default("de"),
});
export type ExplainRequestFields = z.infer<typeof ExplainRequestFields>;

/** Einheitliches Fehlerformat der API */
export const ApiError = z.object({
  error: z.object({
    code: z.enum([
      "no_image",
      "too_many_images",
      "image_too_large",
      "unsupported_media_type",
      "invalid_language",
      "rate_limited",
      "upstream_error",
      "refused",
      "internal_error",
    ]),
    /** Deutsche, nutzerfreundliche Meldung */
    message: z.string(),
  }),
});
export type ApiError = z.infer<typeof ApiError>;

export const LIMITS = {
  MAX_IMAGES: 4,
  MAX_IMAGE_BYTES: 8 * 1024 * 1024,
  ALLOWED_MEDIA_TYPES: ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const,
} as const;
