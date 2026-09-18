import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables, TenantRole } from "@fahrpilot/db";
import { ADMIN_ROLES } from "@fahrpilot/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOffice } from "@/lib/auth/session";

export type Db = SupabaseClient<Database>;

export interface OfficeContext {
  db: Db;
  userId: string;
  tenantId: string;
  role: TenantRole;
  isAdmin: boolean;
  school: Tables<"driving_schools">;
}

/** Kontext für Büro, Admin und Owner: Session, Supabase-Client (RLS) und Fahrschule. Pro Request gecacht. */
export const getOfficeContext = cache(async (): Promise<OfficeContext> => {
  const session = await requireOffice();
  const db = await createSupabaseServerClient();
  const { data: school } = await db.from("driving_schools").select("*").eq("id", session.tenantId).single();
  if (!school) throw new Error("Fahrschule nicht gefunden");
  return { db, userId: session.userId, tenantId: session.tenantId, role: session.role, isAdmin: ADMIN_ROLES.includes(session.role), school };
});

export interface SchoolSettings {
  auto_confirm_bookings: boolean;
  small_business: boolean;
  dunning_reminder_days: number[];
  dunning_fees_cents: number[];
  invoice_due_days: number;
  bank_account_holder: string;
  bank_iban: string;
  bank_bic: string;
  sepa_creditor_id: string;
}

/** Einstellungen der Fahrschule mit Standardwerten. */
export function schoolSettings(settings: unknown): SchoolSettings {
  const s = (settings && typeof settings === "object" ? settings : {}) as Record<string, unknown>;
  const nums = (v: unknown, fallback: number[]) => (Array.isArray(v) && v.every((n) => typeof n === "number") ? (v as number[]) : fallback);
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    auto_confirm_bookings: s["auto_confirm_bookings"] !== false,
    small_business: s["small_business"] === true,
    dunning_reminder_days: nums(s["dunning_reminder_days"], [7, 14, 28]),
    dunning_fees_cents: nums(s["dunning_fees_cents"], [0, 500, 1000]),
    invoice_due_days: typeof s["invoice_due_days"] === "number" ? (s["invoice_due_days"] as number) : 14,
    bank_account_holder: str(s["bank_account_holder"]),
    bank_iban: str(s["bank_iban"]),
    bank_bic: str(s["bank_bic"]),
    sepa_creditor_id: str(s["sepa_creditor_id"]),
  };
}

/** Datum in Europe/Berlin als ISO-Datum (YYYY-MM-DD). */
export function berlinDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Zeitzonenversatz von Europe/Berlin an einem Datum ("+02:00" oder "+01:00"). */
export function berlinOffset(isoDate: string): string {
  const probe = new Date(`${isoDate}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Berlin", timeZoneName: "longOffset" }).formatToParts(probe);
  const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+01:00";
  const m = tz.match(/GMT([+-]\d{2}:\d{2})/);
  return m?.[1] ?? "+01:00";
}

/** Lokale Berliner Zeit (Datum + Uhrzeit) in ISO-Zeitstempel umrechnen. */
export function berlinToIso(isoDate: string, time: string): string {
  return new Date(`${isoDate}T${time.length === 5 ? `${time}:00` : time}${berlinOffset(isoDate)}`).toISOString();
}

/** Grenzen eines Berliner Kalendertags als ISO-Zeitstempel. */
export function dayBounds(isoDate: string): { start: string; end: string } {
  const start = berlinToIso(isoDate, "00:00");
  const next = new Date(`${isoDate}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return { start, end: berlinToIso(next.toISOString().slice(0, 10), "00:00") };
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Montag der Woche eines Datums. */
export function startOfWeek(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  return addDays(isoDate, -dow);
}

export const LICENSE_STATUS_LABEL: Record<string, string> = { lead: "Interessent", registered: "Angemeldet", active: "In Ausbildung", paused: "Pausiert", completed: "Abgeschlossen", cancelled: "Abgebrochen" };
export const EXAM_STATUS_LABEL: Record<string, string> = { not_ready: "Noch nicht bereit", awaiting_instructor_release: "Wartet auf Freigabe", ready: "Freigegeben", requested: "Angefragt", scheduled: "Terminiert", passed: "Bestanden", failed: "Nicht bestanden", cancelled: "Abgesagt" };
export const LESSON_STATUS_LABEL: Record<string, string> = { open: "Frei", booked: "Anfrage", confirmed: "Bestätigt", completed: "Abgeschlossen", no_show: "Nicht erschienen", cancelled: "Storniert" };
export const LESSON_KIND_LABEL: Record<string, string> = { practice: "Übungsfahrt", overland: "Überlandfahrt", motorway: "Autobahnfahrt", night: "Nachtfahrt", special: "Sonderfahrt", exam_prep: "Prüfungsvorbereitung", practical_exam: "Praktische Prüfung", manual_conversion: "Umstieg Schaltung", trailer: "Anhänger" };
export const INVOICE_STATUS_LABEL: Record<string, string> = { draft: "Entwurf", issued: "Ausgestellt", partially_paid: "Teilweise bezahlt", paid: "Bezahlt", overdue: "Überfällig", cancelled: "Storniert", credited: "Gutgeschrieben" };
export const DOC_STATUS_LABEL: Record<string, string> = { missing: "Fehlt", uploaded: "In Prüfung", verified: "Geprüft", rejected: "Abgelehnt", expired: "Abgelaufen" };
export const ROLE_LABEL: Record<string, string> = { student: "Schüler", instructor: "Fahrlehrer", office: "Büro", admin: "Admin", owner: "Inhaber" };
export const MEMBERSHIP_STATUS_LABEL: Record<string, string> = { invited: "Eingeladen", active: "Aktiv", disabled: "Deaktiviert" };
export const PAYMENT_METHOD_LABEL: Record<string, string> = { sepa_debit: "SEPA-Lastschrift", card: "Karte", bank_transfer: "Überweisung", cash: "Bar", other: "Sonstige" };
export const TRANSMISSION_LABEL: Record<string, string> = { manual: "Schaltung", automatic: "Automatik" };
