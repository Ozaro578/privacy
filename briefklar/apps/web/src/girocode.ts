/**
 * GiroCode / EPC-QR (EPC069-12, Version 002) – der freie EU-Standard,
 * den deutsche Banking-Apps beim Scannen einer Überweisung verstehen.
 */
import QRCode from "qrcode";
import type { PaymentInfo } from "@briefklar/shared";

export function normalizeIban(iban: string): string {
  return iban.replace(/\s+/g, "").toUpperCase();
}

export function formatIban(iban: string): string {
  return normalizeIban(iban).replace(/(.{4})/g, "$1 ").trim();
}

/** Grobe IBAN-Plausibilität (Länge + Prüfziffer nach ISO 7064 MOD 97-10). */
export function isValidIban(iban: string): boolean {
  const s = normalizeIban(iban);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(s)) return false;
  const rearranged = s.slice(4) + s.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const v = ch >= "A" ? ch.charCodeAt(0) - 55 : Number(ch);
    const digits = String(v);
    for (const d of digits) remainder = (remainder * 10 + Number(d)) % 97;
  }
  return remainder === 1;
}

/** Nur wenn IBAN und Empfänger vorhanden sind, lässt sich ein gültiger GiroCode bauen. */
export function canBuildGirocode(p: PaymentInfo): boolean {
  return Boolean(p.iban && p.recipient && isValidIban(p.iban));
}

export function girocodePayload(p: PaymentInfo): string {
  const amount = p.amount_eur != null && p.amount_eur > 0 ? `EUR${p.amount_eur.toFixed(2)}` : "";
  const lines = [
    "BCD",
    "002",
    "1", // UTF-8
    "SCT",
    (p.bic ?? "").replace(/\s+/g, "").slice(0, 11),
    (p.recipient ?? "").slice(0, 70),
    normalizeIban(p.iban ?? ""),
    amount,
    "", // Purpose code
    (p.reference ?? "").slice(0, 140), // unstrukturierter Verwendungszweck
    "", // Hinweis an den Nutzer
  ];
  return lines.join("\n");
}

export async function renderGirocode(canvas: HTMLCanvasElement, p: PaymentInfo): Promise<void> {
  await QRCode.toCanvas(canvas, girocodePayload(p), {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 440,
    color: { dark: "#111827", light: "#ffffff" },
  });
}

/** Mehrzeiliger Text für "Alles kopieren" */
export function paymentAsText(p: PaymentInfo, labels: { recipient: string; iban: string; bic: string; purpose: string; amount: string; due: string }, dueFormatted: string | null): string {
  const rows: string[] = [];
  if (p.recipient) rows.push(`${labels.recipient}: ${p.recipient}`);
  if (p.iban) rows.push(`${labels.iban}: ${formatIban(p.iban)}`);
  if (p.bic) rows.push(`${labels.bic}: ${p.bic}`);
  if (p.amount_eur != null) rows.push(`${labels.amount}: ${p.amount_eur.toFixed(2).replace(".", ",")} €`);
  if (p.reference) rows.push(`${labels.purpose}: ${p.reference}`);
  if (dueFormatted) rows.push(`${labels.due}: ${dueFormatted}`);
  return rows.join("\n");
}
