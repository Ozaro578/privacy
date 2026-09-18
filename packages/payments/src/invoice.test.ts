import { describe, expect, it } from "vitest";
import { applyPayment, computeInvoiceTotals, computeLineTotals, vatBreakdown } from "./invoice";
import { formatCents, formatVatRate, roundHalfUpDiv } from "./money";

describe("computeInvoiceTotals", () => {
  it("rundet je Position kaufmännisch: 2 x 50,42 EUR netto bei 19 % ergibt 120,00 EUR brutto", () => {
    const totals = computeInvoiceTotals([{ quantity: 2, unit_net_cents: 5042, vat_rate: 19 }]);
    expect(totals).toEqual({ net: 10084, vat: 1916, gross: 12000 });
  });

  it("rundet halbe Cent aufwärts (kaufmännisch)", () => {
    // 1 x 0,05 EUR bei 19 %: 0,0095 EUR = 0,95 Cent -> 1 Cent
    expect(computeLineTotals({ quantity: 1, unit_net_cents: 5, vat_rate: 19 }).vat).toBe(1);
    // 1 x 0,50 EUR bei 7 %: 3,5 Cent -> 4 Cent
    expect(computeLineTotals({ quantity: 1, unit_net_cents: 50, vat_rate: 7 }).vat).toBe(4);
  });

  it("verarbeitet Mengen mit Nachkommastellen ohne Gleitkommafehler", () => {
    const totals = computeInvoiceTotals([{ quantity: 1.5, unit_net_cents: 3333, vat_rate: 19 }]);
    // 1,5 x 33,33 = 49,995 -> 50,00 netto; USt 9,49905 -> 9,50
    expect(totals).toEqual({ net: 5000, vat: 950, gross: 5950 });
  });

  it("summiert mehrere Steuersätze und liefert Aufschlüsselung", () => {
    const items = [
      { quantity: 10, unit_net_cents: 5500, vat_rate: 19 },
      { quantity: 1, unit_net_cents: 2000, vat_rate: 7 },
      { quantity: 1, unit_net_cents: 1000, vat_rate: 0 },
    ];
    expect(computeInvoiceTotals(items)).toEqual({ net: 58000, vat: 10590, gross: 68590 });
    const groups = vatBreakdown(items);
    expect(groups.map((g) => g.vat_rate)).toEqual([19, 7, 0]);
    expect(groups[0]).toEqual({ net: 55000, vat: 10450, gross: 65450, vat_rate: 19 });
  });

  it("lehnt ungültige Positionen ab", () => {
    expect(() => computeInvoiceTotals([{ quantity: 0, unit_net_cents: 100, vat_rate: 19 }])).toThrow();
    expect(() => computeInvoiceTotals([{ quantity: 1, unit_net_cents: -1, vat_rate: 19 }])).toThrow();
  });

  it("leere Rechnung hat Summe 0", () => {
    expect(computeInvoiceTotals([])).toEqual({ net: 0, vat: 0, gross: 0 });
  });
});

describe("Geldformatierung", () => {
  it("roundHalfUpDiv", () => {
    expect(roundHalfUpDiv(5, 10)).toBe(1);
    expect(roundHalfUpDiv(4, 10)).toBe(0);
    expect(roundHalfUpDiv(-5, 10)).toBe(-1);
  });
  it("formatCents und formatVatRate", () => {
    expect(formatCents(120000)).toBe("1.200,00 €");
    expect(formatCents(-5)).toBe("-0,05 €");
    expect(formatVatRate(19)).toBe("19 %");
    expect(formatVatRate(7.5)).toBe("7,5 %");
  });
});

describe("applyPayment (konsistent zu app.apply_payment_to_invoice)", () => {
  const invoice = { status: "issued" as const, gross_cents: 12000, due_at: "2026-09-30" };

  it("ohne Zahlung bleibt issued, wenn nicht fällig", () => {
    expect(applyPayment(invoice, [], "2026-09-18")).toEqual({ status: "issued", paid_cents: 0, open_cents: 12000 });
  });

  it("ohne Zahlung nach Fälligkeit wird overdue", () => {
    expect(applyPayment(invoice, [], "2026-10-01").status).toBe("overdue");
  });

  it("Teilzahlung ergibt partially_paid, auch wenn überfällig", () => {
    const result = applyPayment(invoice, [{ amount_cents: 5000, status: "succeeded" }], "2026-10-05");
    expect(result).toEqual({ status: "partially_paid", paid_cents: 5000, open_cents: 7000 });
  });

  it("vollständige Zahlung ergibt paid", () => {
    expect(applyPayment(invoice, [{ amount_cents: 12000, status: "succeeded" }]).status).toBe("paid");
  });

  it("nur succeeded zählt; pending und failed werden ignoriert", () => {
    const result = applyPayment(invoice, [
      { amount_cents: 12000, status: "pending" },
      { amount_cents: 12000, status: "failed" },
    ], "2026-09-18");
    expect(result.status).toBe("issued");
    expect(result.paid_cents).toBe(0);
  });

  it("Rücklastschrift als negative Gegenbuchung setzt den Saldo zurück", () => {
    const result = applyPayment(invoice, [
      { amount_cents: 12000, status: "succeeded" },
      { amount_cents: -12000, status: "succeeded" },
    ], "2026-10-05");
    expect(result.status).toBe("overdue");
    expect(result.paid_cents).toBe(0);
  });

  it("cancelled, credited und draft bleiben unverändert", () => {
    for (const status of ["cancelled", "credited", "draft"] as const) {
      expect(applyPayment({ ...invoice, status }, [{ amount_cents: 12000, status: "succeeded" }]).status).toBe(status);
    }
  });

  it("Überzahlung ergibt paid mit open_cents 0", () => {
    const result = applyPayment(invoice, [{ amount_cents: 15000, status: "succeeded" }]);
    expect(result).toEqual({ status: "paid", paid_cents: 15000, open_cents: 0 });
  });
});
