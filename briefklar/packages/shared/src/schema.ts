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
  date: z.string().nullable().describe("Datum im Format YYYY-MM-DD, NUR wenn es explizit so im Brief steht. Relative Fristen ('ein Monat nach Zustellung') -> null und die Regel in description."),
  /** z.B. "Widerspruch einlegen" – in Zielsprache */
  description: z.string().describe("Was bis dahin zu tun ist, in der Zielsprache, inkl. der Fristregel wenn date null ist"),
  /** Was passiert, wenn man die Frist verpasst – in Zielsprache, null wenn unbekannt */
  consequence_if_missed: z.string().nullable().describe("Folge bei Versäumnis in der Zielsprache; null wenn der Brief dazu nichts sagt"),
});
export type Deadline = z.infer<typeof Deadline>;

export const Appointment = z.object({
  /** ISO-Datum (YYYY-MM-DD) */
  date: z.string().describe("Datum des Termins im Format YYYY-MM-DD, exakt aus dem Brief"),
  /** Uhrzeit HH:MM (24h) falls angegeben, sonst null */
  time: z.string().nullable().describe("Uhrzeit im Format HH:MM (24h), null wenn keine Uhrzeit im Brief steht"),
  /** Dauer in Minuten falls erkennbar, sonst null */
  duration_minutes: z.number().int().positive().nullable().describe("Dauer in Minuten, nur wenn im Brief genannt, sonst null"),
  /** Kurzer Titel für den Kalender – in Zielsprache, z.B. "Termin Jobcenter" */
  title: z.string().describe("Kurzer Kalendertitel in der Zielsprache, max. 60 Zeichen, z.B. 'Termin Jobcenter'"),
  /** Ort/Adresse/Raum wie im Brief, null wenn nicht angegeben */
  location: z.string().nullable().describe("Ort, Adresse, Raum exakt wie im Brief; null wenn nicht angegeben"),
  /** Was mitbringen / worauf achten – in Zielsprache, null wenn nichts */
  notes: z.string().nullable().describe("Was mitzubringen / zu beachten ist, in der Zielsprache; null wenn nichts"),
  /** Ist der Termin Pflicht (z.B. Meldetermin mit Sanktionsandrohung)? */
  mandatory: z.boolean().describe("true wenn Erscheinen Pflicht ist oder Nachteile angedroht werden"),
});
export type Appointment = z.infer<typeof Appointment>;

export const SenderContact = z.object({
  /** Telefonnummer wie im Brief (mit Vorwahl), null wenn keine */
  phone: z.string().nullable(),
  /** E-Mail-Adresse des Absenders/Sachbearbeitung, null wenn keine */
  email: z.string().nullable(),
  /** Webseite / Online-Portal (vollständige URL wenn erkennbar), null wenn keine */
  website: z.string().nullable(),
  /** Postanschrift des Absenders (eine Zeile), null wenn keine */
  address: z.string().nullable(),
  /** Sprechzeiten / Erreichbarkeit wie im Brief, null wenn keine */
  office_hours: z.string().nullable(),
});
export type SenderContact = z.infer<typeof SenderContact>;

export const PaymentInfo = z.object({
  /** Empfängername für die Überweisung, null wenn keiner */
  recipient: z.string().nullable().describe("Empfängername exakt wie im Brief; null wenn keiner"),
  /** IBAN ohne Leerzeichen, null wenn keine */
  iban: z.string().nullable().describe("IBAN ohne Leerzeichen, exakt wie im Brief; null wenn keine"),
  /** BIC, null wenn keine */
  bic: z.string().nullable().describe("BIC; null wenn keine"),
  /** Verwendungszweck exakt wie im Brief, null wenn keiner */
  reference: z.string().nullable().describe("Verwendungszweck exakt wie im Brief; null wenn keiner"),
  /** Betrag als Dezimalzahl in Euro (z.B. 245.60), null wenn unklar */
  amount_eur: z.number().nullable().describe("Betrag als Dezimalzahl in Euro mit Punkt, z.B. 245.60; null wenn unklar"),
  /** Zahlungsfrist ISO-Datum, null wenn keine */
  due_date: z.string().nullable().describe("Zahlungsfrist im Format YYYY-MM-DD, nur wenn explizit im Brief; sonst null"),
});
export type PaymentInfo = z.infer<typeof PaymentInfo>;

export const ActionStep = z.object({
  step: z.number().int().min(1).describe("Laufende Nummer ab 1, in sinnvoller Reihenfolge"),
  /** Ein konkreter, kurzer Handlungsschritt in Zielsprache */
  text: z.string().describe("Ein konkreter Schritt in der Zielsprache, ein bis zwei kurze Sätze"),
  /** Muss ich das tun oder ist es optional? */
  required: z.boolean().describe("true wenn der Schritt nötig ist, false wenn optional"),
});
export type ActionStep = z.infer<typeof ActionStep>;

export const MoneyInfo = z.object({
  /** "zahlen" = ich muss zahlen, "bekommen" = ich bekomme Geld */
  direction: z.enum(["zahlen", "bekommen", "keine", "unklar"]).describe("zahlen = Nutzer muss zahlen, bekommen = Nutzer erhält Geld, keine = kein Geld im Spiel, unklar = nicht eindeutig"),
  /** Betrag als Text, z.B. "245,60 €", null wenn keiner */
  amount: z.string().nullable().describe("Betrag zur Anzeige, z.B. '245,60 €'; null wenn keiner"),
  /** Kurze Erklärung wofür / bis wann / an wen – in Zielsprache */
  details: z.string().nullable().describe("Wofür, bis wann, an wen – in der Zielsprache; null wenn nichts"),
});
export type MoneyInfo = z.infer<typeof MoneyInfo>;

export const GlossaryEntry = z.object({
  /** Deutscher Originalbegriff aus dem Brief, z.B. "Widerspruch" */
  term_de: z.string().describe("Deutscher Originalbegriff exakt wie im Brief"),
  /** Erklärung in Zielsprache, max. 2 Sätze */
  explanation: z.string().describe("Einfache Erklärung in der Zielsprache, max. 2 Sätze"),
});
export type GlossaryEntry = z.infer<typeof GlossaryEntry>;

export const HelpContact = z.object({
  /** z.B. "Migrationsberatung für Erwachsene (MBE)", "Verbraucherzentrale", "Sozialberatung der Caritas/Diakonie/AWO" */
  name: z.string().describe("Name der Anlaufstelle (deutscher Name, ggf. mit Abkürzung)"),
  /** Wie / wobei diese Stelle hilft – in Zielsprache */
  how: z.string().describe("Wobei diese Stelle hilft, in der Zielsprache, ein Satz"),
});
export type HelpContact = z.infer<typeof HelpContact>;

export const ExplainResult = z.object({
  /** Sprache der Erklärung (Sprachcode) */
  language: z.enum(LANGUAGE_CODES).describe("Sprachcode der Erklärung, exakt der angeforderte"),

  /** Konnte der Brief überhaupt gelesen werden? false → Rest nur best effort */
  is_readable: z.boolean().describe("false wenn Bild unleserlich, kein Brief oder wesentliche Teile fehlen"),
  /** Hinweis, wenn z.B. nur Seite 2 von 3 fotografiert wurde oder das Bild unscharf ist – in Zielsprache, sonst null */
  quality_hint: z.string().nullable().describe("Hinweis in der Zielsprache, wenn Seiten fehlen oder das Bild unscharf ist; sonst null"),

  /** Art des Schreibens, kurz, in Zielsprache, z.B. "Bescheid", "Mahnung", "Rechnung", "Terminladung" */
  document_type: z.string().describe("Art des Schreibens in der Zielsprache, 1–4 Wörter, z.B. 'Bescheid vom Jobcenter'"),
  sender: z.object({
    /** Name des Absenders wie im Brief, null wenn nicht erkennbar */
    name: z.string().nullable(),
    type: SenderType,
    /** Kontaktdaten aus dem Brief – für Buttons "Anrufen", "E-Mail", "Route" */
    contact: SenderContact,
  }),
  /** Aktenzeichen / Kundennummer / Referenz falls sichtbar (hilft beim Antworten) */
  reference_number: z.string().nullable(),
  /** Datum des Briefs (ISO) falls sichtbar */
  letter_date: z.string().nullable(),

  /** 1–2 Sätze: Worum geht es? Einfache Sprache. */
  summary: z.string().describe("1–2 kurze Sätze in der Zielsprache: Worum geht es?"),
  /** 3–6 kurze Sätze: Was bedeutet das konkret für mich? Einfache Sprache. */
  what_it_means: z.string().describe("3–6 kurze Sätze in der Zielsprache: Was bedeutet das konkret für mich?"),

  urgency: Urgency.describe("sofort = innerhalb 1–3 Tagen handeln, diese_woche = innerhalb 7 Tagen, bald = innerhalb 2–4 Wochen, keine_eile = später möglich, nur_info = nichts zu tun"),
  /** Feste Termine (Vorsprache, Untersuchung, Gerichtstermin, Anhörung) – für "In Kalender speichern" */
  appointments: z.array(Appointment),
  /** Fristen (bis wann etwas erledigt sein muss) – für "Erinnerung setzen" */
  deadlines: z.array(Deadline),
  actions: z.array(ActionStep),
  money: MoneyInfo,
  /** Überweisungsdaten, wenn der Brief eine Zahlung verlangt – für "Überweisung kopieren" (nur wenn scam_risk nicht hoch) */
  payment: PaymentInfo.nullable(),

  /** Kann ich mich wehren (Widerspruch/Einspruch)? Kurz erklärt, null wenn nicht relevant */
  can_object: z.string().nullable().describe("Kurz in der Zielsprache: ob und wie man sich wehren kann (Frist, an wen, Form); null wenn nicht relevant"),

  glossary: z.array(GlossaryEntry),
  where_to_get_help: z.array(HelpContact),

  /** Betrugsverdacht: Merkmale wie fremde IBAN, Druck, Rechtschreibfehler, unbekannter Absender */
  scam_risk: z.enum(["niedrig", "mittel", "hoch"]),
  /** Konkrete Warnhinweise in Zielsprache (leer wenn keine) */
  warnings: z.array(z.string()).describe("Konkrete Warnhinweise in der Zielsprache; leer wenn keine"),

  /** Wie sicher ist die Einschätzung? */
  confidence: z.enum(["hoch", "mittel", "niedrig"]).describe("niedrig bei unscharfem Bild, fehlenden Seiten oder mehrdeutigem Inhalt"),
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
  /** Claude-API-Grenze je Bild ~5 MB; die App verkleinert Fotos ohnehin auf ~1 MB */
  MAX_IMAGE_BYTES: 5 * 1024 * 1024,
  /** Gesamtgröße pro Anfrage (Base64 wächst um ~37 %, API-Limit 32 MB) */
  MAX_TOTAL_BYTES: 18 * 1024 * 1024,
  ALLOWED_MEDIA_TYPES: ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const,
} as const;
