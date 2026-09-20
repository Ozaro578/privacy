import "server-only";
import QRCode from "qrcode";
import { requireAdmin } from "@/lib/auth/session";
import { publicEnv } from "@/lib/env";
import { getOfficeContext, schoolSettings } from "./admin";

/** Rollen und Rechte laut docs/01-informationsarchitektur.md (statische Übersicht). */
export const ROLE_MATRIX: Array<{ role: string; label: string; scope: string; rights: string[] }> = [
  { role: "student", label: "Schüler", scope: "Nur eigene Datensätze (App)", rights: ["Lernen, Prüfungssimulation, Statistiken", "Fahrstunden buchen und stornieren, Warteliste", "Eigene Rechnungen, Zahlungen und SEPA-Mandat", "Dokumente hochladen, Einwilligungen, Datenexport und Löschung beantragen", "Nachrichten mit Fahrlehrer und Büro"] },
  { role: "instructor", label: "Fahrlehrer", scope: "Eigene Stunden und zugewiesene Schüler", rights: ["Tagesplan, Kalender und Verfügbarkeit", "Fahrstunden dokumentieren und bewerten", "Ausbildungsstand und Prüfungsfreigabe der zugewiesenen Schüler", "Dokumentenstatus nur als vollständig oder unvollständig, keine Inhalte", "Keine Finanzdaten"] },
  { role: "office", label: "Büro", scope: "Gesamter Tenant, ohne Konfiguration", rights: ["Schüler anlegen, Akte, Verträge, Dokumente prüfen", "Kalender, Theorieunterricht, Prüfungen, Fahrzeuge", "Rechnungen erstellen, Zahlungen, Mahnungen, Mandate", "Team nur lesen", "Kein Zugriff auf Einstellungen, Preislisten bearbeiten, Stornierungsregeln, Rollen, Lizenzen"] },
  { role: "admin", label: "Admin", scope: "Alle Rechte des Büros plus Konfiguration", rights: ["Stammdaten, Standorte, Stornierungsregeln, Preislisten", "Checklisten-Vorlagen und Aufbewahrungsregeln", "Team einladen und Rollen setzen", "Datenschutz-Reiter der Schülerakte (Löschung, Export)", "Analytics"] },
  { role: "owner", label: "Inhaber", scope: "Alle Rechte des Admins plus Eigentümerfunktionen", rights: ["Standorte mit Zeitzone und Bundesland", "Rollenvergabe je Mitglied und Standort, Support-Zugriffsfreigaben", "Fahrschul-Analytics: Auslastung, Prüfungsquoten, Durchlaufzeiten, Umsatz", "Abrechnung mit der Plattform, Lizenzen für amtliche Fragen"] },
];

/** Stammdaten, Standorte, Stornierungsregeln und Anmeldelink mit QR-Code. Nur Admin und Inhaber. */
export async function getSettings() {
  await requireAdmin();
  const ctx = await getOfficeContext();
  const [{ data: locations }, { data: policies }, { count: memberCount }, { data: grants }] = await Promise.all([
    ctx.db.from("locations").select("*").order("is_primary", { ascending: false }).order("name"),
    ctx.db.from("cancellation_policies").select("*").order("valid_from", { ascending: false }),
    ctx.db.from("tenant_memberships").select("user_id", { count: "exact", head: true }).eq("status", "active"),
    ctx.db.from("support_access_grants").select("id, reason, expires_at, revoked_at, created_at, granted_by").order("created_at", { ascending: false }).limit(20),
  ]);
  const nowMs = Date.now();
  const supportGrants = (grants ?? []).map((g) => ({ ...g, active: g.revoked_at === null && new Date(g.expires_at).getTime() > nowMs }));
  const registrationUrl = `${publicEnv.appUrl().replace(/\/$/, "")}/anmeldung/${ctx.school.slug}`;
  const qrSvg = await QRCode.toString(registrationUrl, { type: "svg", margin: 1, width: 220, errorCorrectionLevel: "M" });
  return { ctx, settings: schoolSettings(ctx.school.settings), locations: locations ?? [], policies: policies ?? [], memberCount: memberCount ?? 0, registrationUrl, qrSvg, supportGrants };
}
