import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { FakeProvider } from "./providers/fake";
import { ManualProvider } from "./providers/manual";
import { StripeProvider, mapPaymentIntentStatus, mapStripeEvent, type StripeClientLike } from "./providers/stripe";
import { WebhookSignatureError } from "./types";

function makeClient(): StripeClientLike & { calls: Record<string, unknown[]> } {
  const calls: Record<string, unknown[]> = {};
  const record = <T>(name: string, result: T) => async (...args: unknown[]): Promise<T> => {
    (calls[name] ??= []).push(args);
    return result;
  };
  return {
    calls,
    customers: { create: record("customers.create", { id: "cus_1" }) },
    setupIntents: { create: record("setupIntents.create", { id: "seti_1", client_secret: "seti_1_secret" }) },
    checkout: { sessions: { create: record("checkout.sessions.create", { id: "cs_1", url: "https://checkout.stripe.com/cs_1" }) } },
    paymentIntents: { create: record("paymentIntents.create", { id: "pi_1", status: "processing" }) },
    refunds: { create: record("refunds.create", { id: "re_1", status: "pending" }) },
    webhooks: {
      constructEvent: (payload: string | Uint8Array, header: string, secret: string): Stripe.Event => {
        if (header !== `sig_${secret}`) throw new Error("No signatures found matching the expected signature for payload");
        return JSON.parse(typeof payload === "string" ? payload : new TextDecoder().decode(payload)) as Stripe.Event;
      },
    },
  };
}

describe("StripeProvider", () => {
  it("verlangt einen Secret Key aus der Konfiguration", () => {
    expect(() => new StripeProvider({ secretKey: "" })).toThrow("secretKey fehlt");
  });

  it("legt Kunden mit Idempotency-Key an", async () => {
    const client = makeClient();
    const provider = new StripeProvider({ secretKey: "sk_test_x" }, client);
    const customer = await provider.createCustomer({ studentId: "stu_1", name: "Max Mustermann", email: "max@example.org" });
    expect(customer).toEqual({ providerCustomerId: "cus_1" });
    expect(client.calls["customers.create"]?.[0]).toEqual([
      { name: "Max Mustermann", email: "max@example.org", metadata: { student_id: "stu_1" } },
      { idempotencyKey: "customer:stu_1" },
    ]);
  });

  it("erstellt ein SEPA-SetupIntent mit clientSecret", async () => {
    const client = makeClient();
    const provider = new StripeProvider({ secretKey: "sk_test_x" }, client);
    const setup = await provider.createSepaMandateSetup({ providerCustomerId: "cus_1" }, "https://app.example.org/return");
    expect(setup).toEqual({ providerSetupId: "seti_1", clientSecret: "seti_1_secret" });
    const params = client.calls["setupIntents.create"]?.[0] as [Stripe.SetupIntentCreateParams];
    expect(params[0].payment_method_types).toEqual(["sepa_debit"]);
    expect(params[0].usage).toBe("off_session");
  });

  it("nutzt Checkout im gehosteten Modus und liefert eine URL", async () => {
    const client = makeClient();
    const provider = new StripeProvider({ secretKey: "sk_test_x", hostedMandateSetup: true }, client);
    const setup = await provider.createSepaMandateSetup({ providerCustomerId: "cus_1" }, "https://app.example.org/return");
    expect(setup).toEqual({ providerSetupId: "cs_1", url: "https://checkout.stripe.com/cs_1" });
  });

  it("zieht Rechnungen per PaymentIntent off_session mit Idempotency-Key ein", async () => {
    const client = makeClient();
    const provider = new StripeProvider({ secretKey: "sk_test_x" }, client);
    const result = await provider.chargeInvoice({ invoiceId: "inv_1", amountCents: 12000, currency: "EUR", mandateRef: "pm_1", providerCustomerId: "cus_1", idempotencyKey: "charge:inv_1:1" });
    expect(result).toEqual({ providerPaymentId: "pi_1", status: "pending" });
    const [params, options] = client.calls["paymentIntents.create"]?.[0] as [Stripe.PaymentIntentCreateParams, Stripe.RequestOptions];
    expect(params).toMatchObject({ amount: 12000, currency: "eur", payment_method: "pm_1", confirm: true, off_session: true, customer: "cus_1", metadata: { invoice_id: "inv_1" } });
    expect(options.idempotencyKey).toBe("charge:inv_1:1");
    await expect(provider.chargeInvoice({ invoiceId: "inv_1", amountCents: 0, currency: "EUR", mandateRef: "pm_1", idempotencyKey: "k" })).rejects.toThrow();
  });

  it("erstattet mit Idempotency-Key", async () => {
    const client = makeClient();
    const provider = new StripeProvider({ secretKey: "sk_test_x" }, client);
    const result = await provider.refund({ providerPaymentId: "pi_1", amountCents: 500, idempotencyKey: "refund:pi_1:1" });
    expect(result).toEqual({ providerRefundId: "re_1", status: "pending" });
    expect(client.calls["refunds.create"]?.[0]).toEqual([{ payment_intent: "pi_1", amount: 500 }, { idempotencyKey: "refund:pi_1:1" }]);
  });

  it("prüft die Webhook-Signatur und typisiert Ereignisse", () => {
    const client = makeClient();
    const provider = new StripeProvider({ secretKey: "sk_test_x", webhookSecret: "whsec_1" }, client);
    const body = JSON.stringify({ id: "evt_1", type: "payment_intent.succeeded", created: 1_700_000_000, data: { object: { id: "pi_1", amount: 12000, amount_received: 12000, currency: "eur", payment_method: "pm_1", metadata: { invoice_id: "inv_1" } } } });
    const event = provider.parseWebhook(body, "sig_whsec_1");
    expect(event).toMatchObject({ type: "payment_succeeded", provider: "stripe", provider_event_id: "evt_1", providerPaymentId: "pi_1", amountCents: 12000, currency: "EUR", invoiceId: "inv_1", mandateRef: "pm_1" });
    expect(() => provider.parseWebhook(body, "sig_falsch")).toThrow(WebhookSignatureError);
    expect(() => new StripeProvider({ secretKey: "sk_test_x" }, client).parseWebhook(body, "sig_whsec_1")).toThrow("webhookSecret fehlt");
  });

  it("mapStripeEvent deckt Fehlschlag, Mandat, Rücklastschrift und Unbekanntes ab", () => {
    const at = 1_700_000_000;
    const failed = mapStripeEvent({ id: "evt_f", type: "payment_intent.payment_failed", created: at, data: { object: { id: "pi_2", amount: 100, currency: "eur", metadata: {}, last_payment_error: { code: "debit_not_authorized", message: "Nicht autorisiert" } } } } as unknown as Stripe.Event);
    expect(failed).toMatchObject({ type: "payment_failed", failureCode: "debit_not_authorized", failureMessage: "Nicht autorisiert" });
    const mandate = mapStripeEvent({ id: "evt_m", type: "mandate.updated", created: at, data: { object: { id: "mandate_1", status: "active", payment_method: "pm_1", payment_method_details: { sepa_debit: { reference: "FS-1" } } } } } as unknown as Stripe.Event);
    expect(mandate).toMatchObject({ type: "mandate_active", providerMandateId: "mandate_1", mandateRef: "pm_1", mandateReference: "FS-1" });
    const revoked = mapStripeEvent({ id: "evt_r", type: "mandate.updated", created: at, data: { object: { id: "mandate_1", status: "inactive", payment_method: "pm_1" } } } as unknown as Stripe.Event);
    expect(revoked).toMatchObject({ type: "mandate_revoked" });
    const dispute = mapStripeEvent({ id: "evt_d", type: "charge.dispute.created", created: at, data: { object: { id: "dp_1", amount: 12000, currency: "eur", payment_intent: "pi_1", reason: "insufficient_funds" } } } as unknown as Stripe.Event);
    expect(dispute).toMatchObject({ type: "chargeback", providerPaymentId: "pi_1", amountCents: 12000, reason: "insufficient_funds" });
    const unknown = mapStripeEvent({ id: "evt_u", type: "customer.updated", created: at, data: { object: {} } } as unknown as Stripe.Event);
    expect(unknown).toMatchObject({ type: "unknown", raw_type: "customer.updated", provider_event_id: "evt_u" });
  });

  it("mapPaymentIntentStatus", () => {
    expect(mapPaymentIntentStatus("succeeded")).toBe("succeeded");
    expect(mapPaymentIntentStatus("canceled")).toBe("failed");
    expect(mapPaymentIntentStatus("processing")).toBe("pending");
  });
});

describe("ManualProvider", () => {
  it("erzeugt erwartete Zahlungen als pending und empfängt keine Webhooks", async () => {
    const provider = new ManualProvider(() => "fixed");
    const charge = await provider.chargeInvoice({ invoiceId: "inv_1", amountCents: 5000, currency: "EUR", mandateRef: "", idempotencyKey: "k1" });
    expect(charge).toEqual({ providerPaymentId: "manual_inv_1_k1", status: "pending" });
    expect(await provider.createSepaMandateSetup({ providerCustomerId: "c" }, "https://x")).toEqual({ providerSetupId: "manual_mandate_c_fixed" });
    expect(() => provider.parseWebhook()).toThrow();
  });
});

describe("FakeProvider", () => {
  it("zeichnet Aufrufe auf und prüft die Signatur", async () => {
    const provider = new FakeProvider();
    await provider.createCustomer({ studentId: "s", name: "n" });
    expect(provider.calls).toHaveLength(1);
    const event = provider.parseWebhook(JSON.stringify({ provider_event_id: "e1", type: "mandate_revoked", providerMandateId: "m", mandateRef: "pm" }), "fake:secret", "secret");
    expect(event).toMatchObject({ type: "mandate_revoked", provider: "fake", provider_event_id: "e1" });
    expect(() => provider.parseWebhook("{}", "fake:wrong", "secret")).toThrow(WebhookSignatureError);
  });
});
