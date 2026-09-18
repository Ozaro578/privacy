import type { ChargeInvoiceInput, ChargeResult, CreateCustomerInput, MandateSetupResult, PaymentProvider, ProviderCustomer, RefundInput, RefundResult, WebhookEvent } from "../types";

/**
 * Anbieter für Überweisung und Barzahlung: keine externe API, es entstehen nur Datensätze.
 * Ein "Einzug" ist hier eine erwartete Zahlung (pending), die das Büro nach Zahlungseingang manuell auf succeeded setzt.
 */
export class ManualProvider implements PaymentProvider {
  readonly name = "manual" as const;

  constructor(private readonly idFactory: () => string = () => `manual_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`) {}

  async createCustomer(input: CreateCustomerInput): Promise<ProviderCustomer> {
    return { providerCustomerId: `manual_customer_${input.studentId}` };
  }

  async createSepaMandateSetup(customer: ProviderCustomer, _returnUrl: string): Promise<MandateSetupResult> {
    // Papiermandat: Das Büro erfasst die Unterschrift; die Setup-ID dient nur als Referenz.
    return { providerSetupId: `manual_mandate_${customer.providerCustomerId}_${this.idFactory()}` };
  }

  async chargeInvoice(input: ChargeInvoiceInput): Promise<ChargeResult> {
    if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) throw new Error("Betrag muss eine positive ganze Zahl in Cent sein");
    return { providerPaymentId: `manual_${input.invoiceId}_${input.idempotencyKey}`, status: "pending" };
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    return { providerRefundId: `manual_refund_${input.providerPaymentId}_${input.idempotencyKey}`, status: "pending" };
  }

  parseWebhook(): WebhookEvent {
    throw new Error("ManualProvider empfängt keine Webhooks");
  }
}
