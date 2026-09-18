import type { ChargeInvoiceInput, ChargeResult, CreateCustomerInput, MandateSetupResult, PaymentProvider, ProviderCustomer, RefundInput, RefundResult, WebhookEvent } from "../types";
import { WebhookSignatureError } from "../types";

/** Testanbieter: zeichnet Aufrufe auf, liefert deterministische Ergebnisse und akzeptiert Webhooks als JSON mit Signatur "fake:<secret>". */
export class FakeProvider implements PaymentProvider {
  readonly name = "fake" as const;
  readonly calls: { method: string; input: unknown }[] = [];
  chargeStatus: ChargeResult["status"] = "succeeded";
  private counter = 0;

  private nextId(prefix: string): string {
    this.counter += 1;
    return `${prefix}_${this.counter}`;
  }

  async createCustomer(input: CreateCustomerInput): Promise<ProviderCustomer> {
    this.calls.push({ method: "createCustomer", input });
    return { providerCustomerId: this.nextId("cus") };
  }

  async createSepaMandateSetup(customer: ProviderCustomer, returnUrl: string): Promise<MandateSetupResult> {
    this.calls.push({ method: "createSepaMandateSetup", input: { customer, returnUrl } });
    const id = this.nextId("seti");
    return { providerSetupId: id, clientSecret: `${id}_secret` };
  }

  async chargeInvoice(input: ChargeInvoiceInput): Promise<ChargeResult> {
    this.calls.push({ method: "chargeInvoice", input });
    return { providerPaymentId: this.nextId("pi"), status: this.chargeStatus };
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    this.calls.push({ method: "refund", input });
    return { providerRefundId: this.nextId("re"), status: "succeeded" };
  }

  parseWebhook(rawBody: string | Uint8Array, signatureHeader: string, secret: string): WebhookEvent {
    if (signatureHeader !== `fake:${secret}`) throw new WebhookSignatureError("Ungültige Webhook-Signatur");
    const text = typeof rawBody === "string" ? rawBody : new TextDecoder().decode(rawBody);
    const parsed = JSON.parse(text) as Partial<WebhookEvent>;
    if (!parsed.provider_event_id || !parsed.type) throw new Error("Webhook ohne provider_event_id oder type");
    return { occurred_at: new Date(0).toISOString(), raw_type: parsed.type, ...parsed, provider: "fake" } as WebhookEvent;
  }
}
