import { describe, expect, it } from "vitest";
import { DEFAULT_DUNNING_CONFIG, dunningPlan, sepaPreNotificationText } from "./dunning";

const base = { status: "overdue" as const, due_at: "2026-09-01", dunning_level: 0, gross_cents: 12000, paid_cents: 0 };
const config = { reminder_days: [7, 14, 28], fees_cents: [0, 500, 1000] };

describe("dunningPlan", () => {
  it("vor Ablauf der ersten Frist: warten", () => {
    const plan = dunningPlan(base, "2026-09-05", config);
    expect(plan).toMatchObject({ action: "wait", level: 1, scheduled_for: "2026-09-08", fee_cents: 0, due_now: false });
  });

  it("Stufe 1 am siebten Tag nach Fälligkeit", () => {
    const plan = dunningPlan(base, "2026-09-08", config);
    expect(plan).toMatchObject({ action: "send", level: 1, scheduled_for: "2026-09-08", fee_cents: 0, total_fees_cents: 0, open_cents: 12000 });
  });

  it("Stufe 2 nach 14 Tagen mit Gebühr", () => {
    const plan = dunningPlan({ ...base, dunning_level: 1 }, "2026-09-20", config);
    expect(plan).toMatchObject({ action: "send", level: 2, scheduled_for: "2026-09-15", fee_cents: 500, total_fees_cents: 500 });
  });

  it("Stufe 3 nach 28 Tagen mit kumulierten Gebühren", () => {
    const plan = dunningPlan({ ...base, dunning_level: 2 }, "2026-09-29", config);
    expect(plan).toMatchObject({ action: "send", level: 3, scheduled_for: "2026-09-29", fee_cents: 1000, total_fees_cents: 1500 });
  });

  it("nach der letzten Stufe: keine weitere Mahnung", () => {
    expect(dunningPlan({ ...base, dunning_level: 3 }, "2026-12-01", config)).toEqual({ action: "none", reason: "max_level_reached" });
  });

  it("bezahlte, stornierte oder Entwurfsrechnungen werden nicht gemahnt", () => {
    expect(dunningPlan({ ...base, status: "paid", paid_cents: 12000 }, "2026-12-01", config)).toEqual({ action: "none", reason: "not_open" });
    expect(dunningPlan({ ...base, status: "cancelled" }, "2026-12-01", config)).toEqual({ action: "none", reason: "not_open" });
    expect(dunningPlan({ ...base, status: "draft" }, "2026-12-01", config)).toEqual({ action: "none", reason: "not_open" });
  });

  it("ohne Fälligkeitsdatum keine Mahnung", () => {
    expect(dunningPlan({ ...base, due_at: null }, "2026-12-01", config)).toEqual({ action: "none", reason: "no_due_date" });
  });

  it("Teilzahlung reduziert den offenen Betrag", () => {
    const plan = dunningPlan({ ...base, status: "partially_paid", paid_cents: 2000 }, "2026-09-10", config);
    expect(plan).toMatchObject({ action: "send", open_cents: 10000 });
  });

  it("verwendet die Standardkonfiguration und akzeptiert Date-Objekte", () => {
    const plan = dunningPlan(base, new Date("2026-09-08T12:00:00Z"));
    expect(DEFAULT_DUNNING_CONFIG.reminder_days).toEqual([7, 14, 28]);
    expect(plan.action).toBe("send");
  });
});

describe("sepaPreNotificationText", () => {
  it("enthält Mandatsreferenz, Gläubiger-ID, Betrag und Fälligkeitsdatum", () => {
    const text = sepaPreNotificationText({
      creditorName: "Fahrschule Muster GmbH",
      creditorId: "DE98ZZZ09999999999",
      mandateReference: "FS-2026-000123",
      amountCents: 12000,
      dueDate: "2026-10-05",
      invoiceNumber: "RE-2026-00042",
      maskedIban: "DE** **** **** **** **12 34",
      debtorName: "Max Mustermann",
    });
    expect(text).toContain("Mandatsreferenz: FS-2026-000123");
    expect(text).toContain("Gläubiger-Identifikationsnummer: DE98ZZZ09999999999");
    expect(text).toContain("120,00 €");
    expect(text).toContain("05.10.2026");
    expect(text).toContain("RE-2026-00042");
    expect(text).toContain("Guten Tag Max Mustermann,");
    expect(text).toContain("**12 34");
  });
});
