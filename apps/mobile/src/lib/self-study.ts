// Selbstlern-Registrierung in der App: Validierung des Formulars und Aufbau des RPC-Payloads (register_self_study).
export interface SelfStudyForm {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  date_of_birth: string;     // JJJJ-MM-TT
  transmission: "manual" | "automatic";
  consent_privacy: boolean;
  consent_terms: boolean;
}

export const CONSENT_VERSION = "2026-09";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Akzeptiert TT.MM.JJJJ oder JJJJ-MM-TT und liefert JJJJ-MM-TT; null bei ungültigem Datum. */
export function normalizeDate(input: string): string | null {
  const s = input.trim();
  let y: number, m: number, d: number;
  const de = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s);
  const iso = ISO_DATE.exec(s);
  if (de) { d = Number(de[1]); m = Number(de[2]); y = Number(de[3]); }
  else if (iso) { y = Number(iso[1]); m = Number(iso[2]); d = Number(iso[3]); }
  else return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Fehlertexte je Feld; leer, wenn alles gültig ist. Mindestalter 14 (Theorie ab 14,5 möglich, BF17 ab 16,5). */
export function validateSelfStudy(f: SelfStudyForm, now: Date = new Date()): Partial<Record<keyof SelfStudyForm, string>> {
  const e: Partial<Record<keyof SelfStudyForm, string>> = {};
  if (f.first_name.trim().length === 0) e.first_name = "Vorname fehlt";
  if (f.last_name.trim().length === 0) e.last_name = "Nachname fehlt";
  if (!EMAIL.test(f.email.trim())) e.email = "E-Mail-Adresse ungültig";
  if (f.password.length < 8) e.password = "Passwort mindestens 8 Zeichen";
  const dob = normalizeDate(f.date_of_birth);
  if (!dob) e.date_of_birth = "Geburtsdatum als TT.MM.JJJJ";
  else {
    const min = new Date(Date.UTC(now.getUTCFullYear() - 14, now.getUTCMonth(), now.getUTCDate()));
    if (new Date(dob) > min) e.date_of_birth = "Mindestalter 14 Jahre";
    if (new Date(dob) < new Date(Date.UTC(now.getUTCFullYear() - 100, 0, 1))) e.date_of_birth = "Geburtsdatum prüfen";
  }
  if (!f.consent_privacy) e.consent_privacy = "Datenschutzerklärung muss akzeptiert werden";
  if (!f.consent_terms) e.consent_terms = "Nutzungsbedingungen müssen akzeptiert werden";
  return e;
}

/** Payload für register_self_study; das Passwort bleibt bei Supabase Auth und wird nie mitgeschickt. */
export function selfStudyPayload(f: SelfStudyForm, locale: string = "de"): Record<string, unknown> {
  return {
    first_name: f.first_name.trim(), last_name: f.last_name.trim(), email: f.email.trim().toLowerCase(),
    date_of_birth: normalizeDate(f.date_of_birth), license_code: "B", transmission: f.transmission, locale,
    consent_privacy: f.consent_privacy, consent_terms: f.consent_terms, consent_version: CONSENT_VERSION, channel: "app",
  };
}
