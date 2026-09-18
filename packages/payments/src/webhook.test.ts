import { describe, expect, it } from "vitest";
import type { WebhookEvent } from "./types";
import { InMemoryPaymentRepository, bookWebhookEvent, processWebhookOnce } from "./webhook";

const succeeded: WebhookEvent = {
  type: "payment_succeeded",
  provider: "fake",
  provider_event_id: "evt_1",
  occurred_at: "2026-09-18T10:00:00.000Z",
  raw_type: "payment_intent.succeeded",
  providerPaymentId: "pi_1",
  amountCents: 12000,
  currency: "EUR",
  invoiceId: "inv_1",
};

describe("processWebhookOnce", () => {
  it("verarbeitet ein Ereignis genau einmal", async () => {
    const repo = new InMemoryPaymentRepository();
    let calls = 0;
    const handler = async (): Promise<string> => {
      calls += 1;
      return "ok";
    };
    expect(await processWebhookOnce(succeeded, repo, handler)).toEqual({ status: "processed", result: "ok" });
    expect(await processWebhookOnce(succeeded, repo, handler)).toEqual({ status: "duplicate" });
    expect(calls).toBe(1);
  });

  it("gibt die Reservierung bei Fehlern frei, damit ein erneuter Versuch möglich ist", async () => {
    const repo = new InMemoryPaymentRepository();
    await expect(processWebhookOnce(succeeded, repo, async () => { throw new Error("DB nicht erreichbar"); })).rejects.toThrow("DB nicht erreichbar");
    expect(await processWebhookOnce(succeeded, repo, async () => "ok")).toEqual({ status: "processed", result: "ok" });
  });

  it("ignoriert unbekannte Ereignisse, markiert sie aber als gesehen", async () => {
    const repo = new InMemoryPaymentRepository();
    const unknown: WebhookEvent = { type: "unknown", provider: "fake", provider_event_id: "evt_x", occurred_at: "2026-09-18T10:00:00.000Z", raw_type: "customer.updated" };
    expect((await processWebhookOnce(unknown, repo, async () => "ok")).status).toBe("ignored");
    expect((await processWebhookOnce(unknown, repo, async () => "ok")).status).toBe("duplicate");
  });
});

describe("bookWebhookEvent", () => {
  it("legt eine Zahlung mit webhook_event_id an und aktualisiert sie bei späterem Ereignis", async () => {
    const repo = new InMemoryPaymentRepository();
    const pending = await repo.insertPayment({ invoice_id: "inv_1", provider: "stripe", provider_payment_id: "pi_1", method: "sepa_debit", amount_cents: 12000, currency: "EUR", status: "pending", paid_at: null, webhook_event_id: null });
    const result = await bookWebhookEvent(succeeded, repo);
    expect(result.kind).toBe("payment");
    if (result.kind !== "payment") throw new Error("unerwartet");
    expect(result.payment.id).toBe(pending.id);
    expect(result.payment.status).toBe("succeeded");
    expect(result.payment.webhook_event_id).toBe("evt_1");
    expect(result.payment.paid_at).toBe(succeeded.occurred_at);
  });

  it("legt eine neue Zahlung an, wenn keine vorhanden ist", async () => {
    const repo = new InMemoryPaymentRepository();
    const result = await bookWebhookEvent(succeeded, repo);
    expect(result.kind).toBe("payment");
    expect(repo.payments).toHaveLength(1);
    expect(repo.payments[0]?.invoice_id).toBe("inv_1");
  });

  it("Rücklastschrift bucht eine negative Gegenbuchung und markiert die Originalzahlung", async () => {
    const repo = new InMemoryPaymentRepository();
    await bookWebhookEvent(succeeded, repo);
    const chargeback: WebhookEvent = { type: "chargeback", provider: "fake", provider_event_id: "evt_2", occurred_at: "2026-09-25T10:00:00.000Z", raw_type: "charge.dispute.created", providerPaymentId: "pi_1", amountCents: 12000, currency: "EUR", reason: "insufficient_funds" };
    const result = await bookWebhookEvent(chargeback, repo);
    if (result.kind !== "payment") throw new Error("unerwartet");
    expect(result.payment.amount_cents).toBe(-12000);
    expect(result.payment.status).toBe("chargeback");
    expect(result.payment.invoice_id).toBe("inv_1");
    expect(repo.payments[0]?.status).toBe("chargeback");
  });

  it("Datenbankeindeutigkeit von webhook_event_id verhindert Doppelbuchung", async () => {
    const repo = new InMemoryPaymentRepository();
    await bookWebhookEvent(succeeded, repo);
    await expect(bookWebhookEvent({ ...succeeded, providerPaymentId: "pi_other" }, repo)).rejects.toThrow("bereits vorhanden");
  });

  it("aktiviert und widerruft Mandate", async () => {
    const repo = new InMemoryPaymentRepository();
    repo.mandates.push({ id: "m_1", provider_mandate_id: "pm_1", status: "pending", mandate_reference: null, masked_iban: null });
    const active: WebhookEvent = { type: "mandate_active", provider: "fake", provider_event_id: "evt_3", occurred_at: "2026-09-18T10:00:00.000Z", raw_type: "mandate.updated", providerMandateId: "mandate_1", mandateRef: "pm_1", mandateReference: "FS-1" };
    const r1 = await bookWebhookEvent(active, repo);
    expect(r1).toMatchObject({ kind: "mandate", mandate: { status: "active", mandate_reference: "FS-1", provider_mandate_id: "pm_1" } });
    const revoked: WebhookEvent = { type: "mandate_revoked", provider: "fake", provider_event_id: "evt_4", occurred_at: "2026-09-19T10:00:00.000Z", raw_type: "mandate.updated", providerMandateId: "mandate_1", mandateRef: "pm_1" };
    expect(await bookWebhookEvent(revoked, repo)).toMatchObject({ kind: "mandate", mandate: { status: "revoked" } });
    expect(await bookWebhookEvent({ ...revoked, provider_event_id: "evt_5", mandateRef: "pm_unknown" }, repo)).toMatchObject({ kind: "none" });
  });
});
