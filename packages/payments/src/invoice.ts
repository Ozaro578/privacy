import { roundHalfUpDiv } from "./money";
import type { InvoiceStatus } from "./types";

export interface InvoiceItemInput {
  quantity: number;
  unit_net_cents: number;
  /** Umsatzsteuersatz in Prozent (z. B. 19, 7, 0). */
  vat_rate: number;
}

export interface InvoiceTotals {
  net: number;
  vat: number;
  gross: number;
}

export interface InvoiceLineTotals extends InvoiceTotals {
  vat_rate: number;
}

/**
 * Nettobetrag einer Position in Cent, kaufmännisch gerundet.
 * Entspricht round(quantity * unit_net_cents) in app.issue_invoice; quantity hat höchstens zwei Nachkommastellen.
 */
export function lineNetCents(item: InvoiceItemInput): number {
  const quantity100 = Math.round(item.quantity * 100);
  return roundHalfUpDiv(quantity100 * item.unit_net_cents, 100);
}

/** Umsatzsteuer einer Position in Cent, kaufmännisch gerundet auf Basis des ungerundeten Positionsnettos (wie in der Migration). */
export function lineVatCents(item: InvoiceItemInput): number {
  const quantity100 = Math.round(item.quantity * 100);
  const rate100 = Math.round(item.vat_rate * 100);
  // quantity * unit_net * rate / 100 = (q100 * unit * r100) / (100 * 100 * 100)
  return roundHalfUpDiv(quantity100 * item.unit_net_cents * rate100, 1_000_000);
}

export function computeLineTotals(item: InvoiceItemInput): InvoiceLineTotals {
  const net = lineNetCents(item);
  const vat = lineVatCents(item);
  return { net, vat, gross: net + vat, vat_rate: item.vat_rate };
}

/** Summen einer Rechnung mit kaufmännischer Rundung je Position. Beispiel: 2 × 50,42 € netto bei 19 % ergibt 120,00 € brutto. */
export function computeInvoiceTotals(items: readonly InvoiceItemInput[]): InvoiceTotals {
  let net = 0;
  let vat = 0;
  for (const item of items) {
    if (item.quantity <= 0) throw new Error("Menge muss größer als 0 sein");
    if (item.unit_net_cents < 0) throw new Error("Einzelpreis darf nicht negativ sein");
    if (item.vat_rate < 0) throw new Error("Steuersatz darf nicht negativ sein");
    net += lineNetCents(item);
    vat += lineVatCents(item);
  }
  return { net, vat, gross: net + vat };
}

/** Umsatzsteuer nach Steuersatz gruppiert (für die Steueraufstellung auf der Rechnung). */
export function vatBreakdown(items: readonly InvoiceItemInput[]): InvoiceLineTotals[] {
  const map = new Map<number, InvoiceLineTotals>();
  for (const item of items) {
    const line = computeLineTotals(item);
    const acc = map.get(item.vat_rate) ?? { net: 0, vat: 0, gross: 0, vat_rate: item.vat_rate };
    acc.net += line.net;
    acc.vat += line.vat;
    acc.gross += line.gross;
    map.set(item.vat_rate, acc);
  }
  return [...map.values()].sort((a, b) => b.vat_rate - a.vat_rate);
}

export interface InvoiceForPayment {
  status: InvoiceStatus;
  gross_cents: number;
  /** Fälligkeitsdatum als ISO-Datum (YYYY-MM-DD) oder null. */
  due_at: string | null;
}

export interface PaymentForInvoice {
  /** Negativ bedeutet Erstattung. */
  amount_cents: number;
  status: "pending" | "succeeded" | "failed" | "refunded" | "chargeback";
}

export interface AppliedPayment {
  status: InvoiceStatus;
  paid_cents: number;
  open_cents: number;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Rechnungsstatus nach Zahlungseingang, konsistent zu app.apply_payment_to_invoice:
 * nur Zahlungen mit Status succeeded zählen; cancelled, credited und draft bleiben unverändert.
 */
export function applyPayment(invoice: InvoiceForPayment, payments: readonly PaymentForInvoice[], today: Date | string = new Date()): AppliedPayment {
  const paid = payments.filter((p) => p.status === "succeeded").reduce((sum, p) => sum + p.amount_cents, 0);
  const todayIso = typeof today === "string" ? today.slice(0, 10) : isoDate(today);
  let status: InvoiceStatus;
  if (invoice.status === "cancelled" || invoice.status === "credited" || invoice.status === "draft") status = invoice.status;
  else if (paid >= invoice.gross_cents) status = "paid";
  else if (paid > 0) status = "partially_paid";
  else if (invoice.due_at !== null && invoice.due_at < todayIso) status = "overdue";
  else status = "issued";
  return { status, paid_cents: paid, open_cents: Math.max(0, invoice.gross_cents - paid) };
}
