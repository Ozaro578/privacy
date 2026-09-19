import { describe, expect, it } from "vitest";
import { canBuildGirocode, formatIban, girocodePayload, isValidIban } from "../src/girocode";

const payment = { recipient: "Jobcenter Berlin Mitte", iban: "DE02 1203 0000 0000 2020 51", bic: "BYLADEM1001", reference: "962D-45 Erstattung", amount_eur: 128.4, due_date: "2026-10-31" };

describe("girocode", () => {
  it("validates IBAN checksums", () => {
    expect(isValidIban("DE02120300000000202051")).toBe(true);
    expect(isValidIban("DE02 1203 0000 0000 2020 51")).toBe(true);
    expect(isValidIban("DE03120300000000202051")).toBe(false);
    expect(isValidIban("XX")).toBe(false);
  });
  it("formats IBAN in groups of four", () => {
    expect(formatIban("de02120300000000202051")).toBe("DE02 1203 0000 0000 2020 51");
  });
  it("builds an EPC069-12 payload", () => {
    const lines = girocodePayload(payment).split("\n");
    expect(lines).toEqual(["BCD", "002", "1", "SCT", "BYLADEM1001", "Jobcenter Berlin Mitte", "DE02120300000000202051", "EUR128.40", "", "", "962D-45 Erstattung", ""]);
    expect(lines).toHaveLength(12);
    expect(canBuildGirocode(payment)).toBe(true);
  });
  it("refuses without recipient or with bad IBAN", () => {
    expect(canBuildGirocode({ ...payment, recipient: null })).toBe(false);
    expect(canBuildGirocode({ ...payment, iban: "DE00000" })).toBe(false);
  });
  it("omits amount when unknown", () => {
    expect(girocodePayload({ ...payment, amount_eur: null }).split("\n")[7]).toBe("");
  });
});
