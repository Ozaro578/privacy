import Stripe from "stripe";
import type { ChargeInvoiceInput, ChargeResult, CreateCustomerInput, MandateSetupResult, PaymentProvider, PaymentStatus, ProviderCustomer, RefundInput, RefundResult, WebhookEvent } from "../types";
import { WebhookSignatureError } from "../types";

export interface StripeConfig {
  /** Geheimer API-Schlüssel (sk_live_... oder sk_test_...). Wird außerhalb aus der Umgebung gelesen. */
  secretKey: string;
  /** Signaturgeheimnis des Webhook-Endpunkts (whsec_...). Optional, kann auch je Aufruf an parseWebhook übergeben werden. */
  webhookSecret?: string;
  /** Gehosteter Mandatsablauf über Stripe Checkout (mode=setup) statt SetupIntent mit clientSecret. */
  hostedMandateSetup?: boolean;
  apiVersion?: string;
}

/** Minimaler Ausschnitt des Stripe-Clients, damit Tests eine Attrappe injizieren können. */
export interface StripeClientLike {
  customers: { create(params: Stripe.CustomerCreateParams, options?: Stripe.RequestOptions): Promise<{ id: string }> };
  setupIntents: { create(params: Stripe.SetupIntentCreateParams, options?: Stripe.RequestOptions): Promise<{ id: string; client_secret: string | null }> };
  checkout: { sessions: { create(params: Stripe.Checkout.SessionCreateParams, options?: Stripe.RequestOptions): Promise<{ id: string; url: string | null }> } };
  paymentIntents: { create(params: Stripe.PaymentIntentCreateParams, options?: Stripe.RequestOptions): Promise<{ id: string; status: string }> };
  refunds: { create(params: Stripe.RefundCreateParams, options?: Stripe.RequestOptions): Promise<{ id: string; status: string | null }> };
  webhooks: { constructEvent(payload: string | Uint8Array, header: string, secret: string): Stripe.Event };
}

export function mapPaymentIntentStatus(status: string): PaymentStatus {
  switch (status) {
    case "succeeded":
      return "succeeded";
    case "canceled":
      return "failed";
    default:
      // processing, requires_action, requires_payment_method, requires_confirmation: SEPA-Lastschriften bleiben mehrere Tage offen
      return "pending";
  }
}

function metadataString(meta: Stripe.Metadata | null | undefined, key: string): string | undefined {
  const value = meta?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asId(ref: string | { id: string } | null | undefined): string | undefined {
  if (!ref) return undefined;
  return typeof ref === "string" ? ref : ref.id;
}

/** Wandelt ein verifiziertes Stripe-Ereignis in ein typisiertes Webhook-Ereignis um. */
export function mapStripeEvent(event: Stripe.Event): WebhookEvent {
  const base = { provider: "stripe" as const, provider_event_id: event.id, occurred_at: new Date(event.created * 1000).toISOString(), raw_type: event.type };
  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object;
      const ev: WebhookEvent = { ...base, type: "payment_succeeded", providerPaymentId: pi.id, amountCents: pi.amount_received || pi.amount, currency: pi.currency.toUpperCase() };
      const invoiceId = metadataString(pi.metadata, "invoice_id");
      const mandateRef = asId(pi.payment_method);
      return { ...ev, ...(invoiceId ? { invoiceId } : {}), ...(mandateRef ? { mandateRef } : {}) };
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object;
      const invoiceId = metadataString(pi.metadata, "invoice_id");
      const code = pi.last_payment_error?.code ?? pi.last_payment_error?.decline_code;
      const message = pi.last_payment_error?.message;
      return {
        ...base,
        type: "payment_failed",
        providerPaymentId: pi.id,
        amountCents: pi.amount,
        currency: pi.currency.toUpperCase(),
        ...(invoiceId ? { invoiceId } : {}),
        ...(code ? { failureCode: code } : {}),
        ...(message ? { failureMessage: message } : {}),
      };
    }
    case "charge.refunded": {
      const charge = event.data.object;
      const paymentIntent = asId(charge.payment_intent) ?? charge.id;
      const invoiceId = metadataString(charge.metadata, "invoice_id");
      return { ...base, type: "payment_refunded", providerPaymentId: paymentIntent, amountCents: charge.amount_refunded, currency: charge.currency.toUpperCase(), ...(invoiceId ? { invoiceId } : {}) };
    }
    case "charge.dispute.created": {
      const dispute = event.data.object;
      const paymentIntent = asId(dispute.payment_intent) ?? asId(dispute.charge) ?? "";
      return { ...base, type: "chargeback", providerPaymentId: paymentIntent, amountCents: dispute.amount, currency: dispute.currency.toUpperCase(), reason: dispute.reason };
    }
    case "setup_intent.succeeded": {
      const si = event.data.object;
      const pm = asId(si.payment_method) ?? "";
      const mandateId = asId(si.mandate) ?? si.id;
      const customer = asId(si.customer);
      return { ...base, type: "mandate_active", providerMandateId: mandateId, mandateRef: pm, ...(customer ? { providerCustomerId: customer } : {}) };
    }
    case "mandate.updated": {
      const mandate = event.data.object;
      const pm = asId(mandate.payment_method) ?? "";
      if (mandate.status === "active") {
        const reference = mandate.payment_method_details?.sepa_debit?.reference;
        return { ...base, type: "mandate_active", providerMandateId: mandate.id, mandateRef: pm, ...(reference ? { mandateReference: reference } : {}) };
      }
      return { ...base, type: "mandate_revoked", providerMandateId: mandate.id, mandateRef: pm };
    }
    case "payment_method.detached": {
      const pm = event.data.object;
      return { ...base, type: "mandate_revoked", providerMandateId: pm.id, mandateRef: pm.id };
    }
    default:
      return { ...base, type: "unknown" };
  }
}

/** SEPA-Lastschrift über Stripe: Mandat per SetupIntent, Einzug per PaymentIntent (off_session), Webhooks mit Signaturprüfung. */
export class StripeProvider implements PaymentProvider {
  readonly name = "stripe" as const;
  private readonly client: StripeClientLike;

  constructor(
    private readonly config: StripeConfig,
    client?: StripeClientLike,
  ) {
    if (!config.secretKey) throw new Error("StripeProvider: secretKey fehlt");
    this.client = client ?? new Stripe(config.secretKey, config.apiVersion ? { apiVersion: config.apiVersion as Stripe.LatestApiVersion } : {});
  }

  async createCustomer(input: CreateCustomerInput): Promise<ProviderCustomer> {
    const customer = await this.client.customers.create(
      { name: input.name, ...(input.email ? { email: input.email } : {}), metadata: { student_id: input.studentId, ...(input.metadata ?? {}) } },
      { idempotencyKey: `customer:${input.studentId}` },
    );
    return { providerCustomerId: customer.id };
  }

  async createSepaMandateSetup(customer: ProviderCustomer, returnUrl: string): Promise<MandateSetupResult> {
    if (this.config.hostedMandateSetup) {
      const session = await this.client.checkout.sessions.create({
        mode: "setup",
        customer: customer.providerCustomerId,
        payment_method_types: ["sepa_debit"],
        success_url: returnUrl,
        cancel_url: returnUrl,
      });
      return { providerSetupId: session.id, ...(session.url ? { url: session.url } : {}) };
    }
    const intent = await this.client.setupIntents.create({
      customer: customer.providerCustomerId,
      payment_method_types: ["sepa_debit"],
      usage: "off_session",
      metadata: { return_url: returnUrl },
    });
    return { providerSetupId: intent.id, ...(intent.client_secret ? { clientSecret: intent.client_secret } : {}) };
  }

  async chargeInvoice(input: ChargeInvoiceInput): Promise<ChargeResult> {
    if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) throw new Error("Einzugsbetrag muss eine positive ganze Zahl in Cent sein");
    const intent = await this.client.paymentIntents.create(
      {
        amount: input.amountCents,
        currency: input.currency.toLowerCase(),
        payment_method: input.mandateRef,
        payment_method_types: ["sepa_debit"],
        confirm: true,
        off_session: true,
        ...(input.providerCustomerId ? { customer: input.providerCustomerId } : {}),
        ...(input.description ? { description: input.description } : {}),
        metadata: { invoice_id: input.invoiceId },
      },
      { idempotencyKey: input.idempotencyKey },
    );
    return { providerPaymentId: intent.id, status: mapPaymentIntentStatus(intent.status) };
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    const refund = await this.client.refunds.create(
      {
        payment_intent: input.providerPaymentId,
        ...(input.amountCents !== undefined ? { amount: input.amountCents } : {}),
        ...(input.reason ? { metadata: { reason: input.reason } } : {}),
      },
      { idempotencyKey: input.idempotencyKey },
    );
    const status: RefundResult["status"] = refund.status === "succeeded" ? "succeeded" : refund.status === "failed" || refund.status === "canceled" ? "failed" : "pending";
    return { providerRefundId: refund.id, status };
  }

  parseWebhook(rawBody: string | Uint8Array, signatureHeader: string, secret?: string): WebhookEvent {
    const webhookSecret = secret ?? this.config.webhookSecret;
    if (!webhookSecret) throw new Error("StripeProvider: webhookSecret fehlt");
    let event: Stripe.Event;
    try {
      event = this.client.webhooks.constructEvent(rawBody, signatureHeader, webhookSecret);
    } catch (err) {
      throw new WebhookSignatureError(`Ungültige Webhook-Signatur: ${err instanceof Error ? err.message : String(err)}`);
    }
    return mapStripeEvent(event);
  }
}
