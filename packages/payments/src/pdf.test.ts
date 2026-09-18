import { describe, expect, it } from "vitest";
import { renderInvoicePdf, renderReceiptPdf, type InvoicePdfData, type Party } from "./pdf";

const issuer: Party = { name: "Fahrschule Muster GmbH", addressLines: ["Musterstraße 1", "10115 Berlin"], taxNumber: "30/123/45678", vatId: "DE123456789", email: "info@example.org" };
const recipient: Party = { name: "Max Mustermann", addressLines: ["Beispielweg 2", "10117 Berlin"] };

const invoice: InvoicePdfData = {
  issuer,
  recipient,
  invoice_number: "RE-2026-00042",
  issued_at: "2026-09-18",
  due_at: "2026-10-02",
  items: [
    { position: 1, description: "Fahrstunde Übungsfahrt 45 Minuten (Leistungsdatum 15.09.2026)", quantity: 2, unit: "Einheiten", unit_net_cents: 5042, vat_rate: 19, service_date: "2026-09-15" },
    { position: 2, description: "Lehrmaterial", quantity: 1, unit_net_cents: 2000, vat_rate: 7 },
  ],
  sepa: { creditor_id: "DE98ZZZ09999999999", mandate_reference: "FS-2026-000123", collection_date: "2026-10-02" },
  notes: "Vielen Dank für Ihr Vertrauen.",
};

function header(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes.slice(0, 4));
}

describe("renderInvoicePdf", () => {
  it("liefert ein PDF mit Header und sinnvoller Länge", async () => {
    const bytes = await renderInvoicePdf(invoice);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(header(bytes)).toBe("%PDF");
    expect(bytes.length).toBeGreaterThan(2000);
  });

  it("verlangt Steuernummer oder USt-IdNr. und mindestens eine Position", async () => {
    await expect(renderInvoicePdf({ ...invoice, issuer: { name: "X", addressLines: [] } })).rejects.toThrow("§ 14");
    await expect(renderInvoicePdf({ ...invoice, items: [] })).rejects.toThrow("ohne Positionen");
  });

  it("rendert Kleinunternehmer, Korrektur und viele Positionen über mehrere Seiten", async () => {
    const items = Array.from({ length: 60 }, (_, i) => ({ position: i + 1, description: `Fahrstunde ${i + 1} mit einer sehr langen Beschreibung, die umgebrochen werden muss, weil sie nicht in eine Zeile passt`, quantity: 1, unit_net_cents: 5500, vat_rate: 19 }));
    const bytes = await renderInvoicePdf({ ...invoice, items, small_business: true, credit_note_for: "RE-2026-00001", paid_cents: 1000, bank_details: { account_holder: "Fahrschule Muster GmbH", iban: "DE02120300000000202051", bic: "BYLADEM1001" } });
    expect(header(bytes)).toBe("%PDF");
    expect(bytes.length).toBeGreaterThan(10000);
  });
});

describe("renderReceiptPdf", () => {
  it("liefert ein PDF", async () => {
    const bytes = await renderReceiptPdf({ issuer, recipient, receipt_number: "Q-2026-0001", paid_at: "2026-09-18", amount_cents: 12000, method: "cash", invoice_number: "RE-2026-00042" });
    expect(header(bytes)).toBe("%PDF");
    expect(bytes.length).toBeGreaterThan(1500);
  });
});
