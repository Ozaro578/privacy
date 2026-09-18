import { formatCents, formatDateDe } from "./money";
import type { InvoiceStatus } from "./types";

export interface DunningConfig {
  /** Tage nach Fälligkeit, an denen die Mahnstufen 1..n fällig werden, z. B. [7, 14, 28]. */
  reminder_days: readonly number[];
  /** Mahngebühr je Stufe in Cent (Index 0 = Stufe 1). Fehlende Einträge bedeuten 0. */
  fees_cents: readonly number[];
}

export const DEFAULT_DUNNING_CONFIG: DunningConfig = { reminder_days: [7, 14, 28], fees_cents: [0, 500, 1000] };

export interface InvoiceForDunning {
  status: InvoiceStatus;
  due_at: string | null;
  dunning_level: number;
  dunning_last_at?: string | null;
  gross_cents: number;
  paid_cents: number;
}

export interface DunningStep {
  /** Nächste Mahnstufe (1 = Zahlungserinnerung). */
  level: number;
  /** Datum, ab dem die Stufe versendet werden darf (ISO-Datum). */
  scheduled_for: string;
  /** Fällig heute oder in der Vergangenheit. */
  due_now: boolean;
  fee_cents: number;
  /** Summe aller Gebühren bis einschließlich dieser Stufe. */
  total_fees_cents: number;
  open_cents: number;
}

export type DunningPlan = { action: "none"; reason: "not_open" | "no_due_date" | "max_level_reached" | "not_yet_due" } | ({ action: "send" } & DunningStep) | ({ action: "wait" } & DunningStep);

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function toIsoDate(today: Date | string): string {
  return typeof today === "string" ? today.slice(0, 10) : today.toISOString().slice(0, 10);
}

/** Ermittelt die nächste Mahnstufe einer Rechnung. Nur offene Rechnungen (issued, partially_paid, overdue) werden gemahnt. */
export function dunningPlan(invoice: InvoiceForDunning, today: Date | string, config: DunningConfig = DEFAULT_DUNNING_CONFIG): DunningPlan {
  if (!(invoice.status === "issued" || invoice.status === "partially_paid" || invoice.status === "overdue")) return { action: "none", reason: "not_open" };
  if (invoice.due_at === null) return { action: "none", reason: "no_due_date" };
  const open = invoice.gross_cents - invoice.paid_cents;
  if (open <= 0) return { action: "none", reason: "not_open" };
  const nextLevel = invoice.dunning_level + 1;
  const offset = config.reminder_days[nextLevel - 1];
  if (offset === undefined) return { action: "none", reason: "max_level_reached" };
  const scheduled = addDays(invoice.due_at, offset);
  const todayIso = toIsoDate(today);
  const fee = config.fees_cents[nextLevel - 1] ?? 0;
  const totalFees = config.fees_cents.slice(0, nextLevel).reduce((s, f) => s + f, 0);
  const step: DunningStep = { level: nextLevel, scheduled_for: scheduled, due_now: scheduled <= todayIso, fee_cents: fee, total_fees_cents: totalFees, open_cents: open };
  return step.due_now ? { action: "send", ...step } : { action: "wait", ...step };
}

export interface SepaPreNotificationInput {
  creditorName: string;
  /** Gläubiger-Identifikationsnummer, z. B. DE98ZZZ09999999999. */
  creditorId: string;
  mandateReference: string;
  amountCents: number;
  currency?: string;
  /** Einzugsdatum als ISO-Datum. */
  dueDate: string;
  invoiceNumber: string;
  maskedIban?: string;
  debtorName?: string;
}

/** Text der SEPA-Vorankündigung (Pre-Notification). Sie muss dem Zahler vor dem Einzug zugehen; die Frist ist vertraglich zu regeln (Standard 14 Tage, verkürzbar). */
export function sepaPreNotificationText(input: SepaPreNotificationInput): string {
  const amount = formatCents(input.amountCents, input.currency ?? "EUR");
  const lines = [
    `${input.debtorName ? `Guten Tag ${input.debtorName},` : "Guten Tag,"}`,
    "",
    `wir ziehen den Betrag von ${amount} zur Rechnung ${input.invoiceNumber} am ${formatDateDe(input.dueDate)} per SEPA-Lastschrift ein.`,
    `Gläubiger: ${input.creditorName}`,
    `Gläubiger-Identifikationsnummer: ${input.creditorId}`,
    `Mandatsreferenz: ${input.mandateReference}`,
  ];
  if (input.maskedIban) lines.push(`Belastetes Konto: ${input.maskedIban}`);
  lines.push("", "Bitte sorgen Sie für ausreichende Deckung. Bei Rücklastschriften können Gebühren der Bank anfallen.", "", `Mit freundlichen Grüßen`, input.creditorName);
  return lines.join("\n");
}
