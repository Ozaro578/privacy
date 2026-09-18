/** Gemeinsame Typen des Zahlungsmoduls. Alle Beträge in Cent, Währung als ISO 4217 (z. B. EUR). */

export type PaymentMethod = "sepa_debit" | "card" | "bank_transfer" | "cash" | "other";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded" | "chargeback";
export type MandateStatus = "pending" | "active" | "revoked" | "failed";
export type InvoiceStatus = "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "cancelled" | "credited";
export type ProviderName = "stripe" | "manual" | "fake";

export interface CreateCustomerInput {
  studentId: string;
  name: string;
  email?: string;
  /** Freie Zusatzdaten, die beim Anbieter als Metadaten abgelegt werden (keine sensiblen Inhalte). */
  metadata?: Record<string, string>;
}

export interface ProviderCustomer {
  providerCustomerId: string;
}

export interface MandateSetupResult {
  /** Für clientseitige Bestätigung (z. B. Stripe SetupIntent). */
  clientSecret?: string;
  /** Für gehostete Abläufe (Weiterleitung auf eine Seite des Anbieters). */
  url?: string;
  providerSetupId: string;
}

export interface ChargeInvoiceInput {
  invoiceId: string;
  amountCents: number;
  currency: string;
  /** Mandats- bzw. Zahlungsmittelreferenz des Anbieters (bei Stripe die PaymentMethod-ID des SEPA-Mandats). */
  mandateRef: string;
  /** Kunde beim Anbieter, falls der Anbieter dies zum Einzug benötigt. */
  providerCustomerId?: string;
  /** Verhindert Doppelbelastung bei Wiederholung derselben Anfrage. */
  idempotencyKey: string;
  description?: string;
}

export interface ChargeResult {
  providerPaymentId: string;
  status: PaymentStatus;
}

export interface RefundInput {
  providerPaymentId: string;
  /** Teilbetrag; fehlt er, wird der volle Betrag erstattet. */
  amountCents?: number;
  idempotencyKey: string;
  reason?: string;
}

export interface RefundResult {
  providerRefundId: string;
  status: "pending" | "succeeded" | "failed";
}

export type WebhookEventType =
  | "payment_succeeded"
  | "payment_failed"
  | "payment_refunded"
  | "mandate_active"
  | "mandate_revoked"
  | "chargeback"
  | "unknown";

interface WebhookEventBase {
  /** Eindeutige Ereignis-ID des Anbieters. Wird gegen payments.webhook_event_id auf Idempotenz geprüft. */
  provider_event_id: string;
  provider: ProviderName;
  occurred_at: string;
  /** Unveränderter Ereignistyp des Anbieters, für Diagnose. */
  raw_type: string;
}

export interface PaymentSucceededEvent extends WebhookEventBase {
  type: "payment_succeeded";
  providerPaymentId: string;
  amountCents: number;
  currency: string;
  invoiceId?: string;
  mandateRef?: string;
}

export interface PaymentFailedEvent extends WebhookEventBase {
  type: "payment_failed";
  providerPaymentId: string;
  amountCents: number;
  currency: string;
  invoiceId?: string;
  failureCode?: string;
  failureMessage?: string;
}

export interface PaymentRefundedEvent extends WebhookEventBase {
  type: "payment_refunded";
  providerPaymentId: string;
  amountCents: number;
  currency: string;
  invoiceId?: string;
}

export interface MandateActiveEvent extends WebhookEventBase {
  type: "mandate_active";
  providerMandateId: string;
  /** Referenz, die künftig bei chargeInvoice als mandateRef verwendet wird. */
  mandateRef: string;
  providerCustomerId?: string;
  mandateReference?: string;
  maskedIban?: string;
}

export interface MandateRevokedEvent extends WebhookEventBase {
  type: "mandate_revoked";
  providerMandateId: string;
  mandateRef: string;
}

export interface ChargebackEvent extends WebhookEventBase {
  type: "chargeback";
  providerPaymentId: string;
  amountCents: number;
  currency: string;
  reason?: string;
}

export interface UnknownWebhookEvent extends WebhookEventBase {
  type: "unknown";
}

export type WebhookEvent =
  | PaymentSucceededEvent
  | PaymentFailedEvent
  | PaymentRefundedEvent
  | MandateActiveEvent
  | MandateRevokedEvent
  | ChargebackEvent
  | UnknownWebhookEvent;

export interface PaymentProvider {
  readonly name: ProviderName;
  createCustomer(input: CreateCustomerInput): Promise<ProviderCustomer>;
  createSepaMandateSetup(customer: ProviderCustomer, returnUrl: string): Promise<MandateSetupResult>;
  chargeInvoice(input: ChargeInvoiceInput): Promise<ChargeResult>;
  refund(input: RefundInput): Promise<RefundResult>;
  /** Prüft die Signatur und wandelt das Rohereignis in ein typisiertes Ereignis um. Wirft bei ungültiger Signatur. */
  parseWebhook(rawBody: string | Uint8Array, signatureHeader: string, secret: string): WebhookEvent;
}

export class WebhookSignatureError extends Error {
  override readonly name = "WebhookSignatureError";
}
