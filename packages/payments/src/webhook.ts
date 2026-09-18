import type { MandateStatus, PaymentMethod, PaymentStatus, WebhookEvent } from "./types";

/** Speicher für verarbeitete Webhook-Ereignisse. In der Datenbank entspricht dies payments.webhook_event_id (unique). */
export interface WebhookEventRepository {
  /** Reserviert die Ereignis-ID. Liefert false, wenn sie bereits verarbeitet wurde (Duplikat). */
  claimEvent(providerEventId: string, eventType: string): Promise<boolean>;
  /** Gibt die Reservierung frei, wenn die Verarbeitung fehlgeschlagen ist, damit ein erneuter Zustellversuch greifen kann. */
  releaseEvent(providerEventId: string): Promise<void>;
}

export type WebhookOutcome<T> = { status: "processed"; result: T } | { status: "duplicate" } | { status: "ignored"; reason: string };

/** Verarbeitet ein Webhook-Ereignis genau einmal je provider_event_id. Ereignisse vom Typ unknown werden ignoriert, aber als gesehen markiert. */
export async function processWebhookOnce<T>(event: WebhookEvent, repo: WebhookEventRepository, handler: (event: WebhookEvent) => Promise<T>): Promise<WebhookOutcome<T>> {
  const claimed = await repo.claimEvent(event.provider_event_id, event.type);
  if (!claimed) return { status: "duplicate" };
  if (event.type === "unknown") return { status: "ignored", reason: `Unbekannter Ereignistyp ${event.raw_type}` };
  try {
    const result = await handler(event);
    return { status: "processed", result };
  } catch (err) {
    await repo.releaseEvent(event.provider_event_id);
    throw err;
  }
}

export interface PaymentRecord {
  id: string;
  invoice_id: string | null;
  provider: string;
  provider_payment_id: string | null;
  method: PaymentMethod;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  paid_at: string | null;
  webhook_event_id: string | null;
  note?: string;
}

export interface MandateRecord {
  id: string;
  provider_mandate_id: string | null;
  status: MandateStatus;
  mandate_reference: string | null;
  masked_iban: string | null;
}

/** Buchungsschnittstelle: wird in der Anwendung gegen Supabase implementiert. */
export interface PaymentBookingRepository extends WebhookEventRepository {
  findPaymentByProviderPaymentId(providerPaymentId: string): Promise<PaymentRecord | null>;
  insertPayment(payment: Omit<PaymentRecord, "id">): Promise<PaymentRecord>;
  updatePayment(id: string, patch: Partial<Omit<PaymentRecord, "id">>): Promise<PaymentRecord>;
  findMandateByRef(mandateRef: string): Promise<MandateRecord | null>;
  updateMandate(id: string, patch: Partial<Omit<MandateRecord, "id">>): Promise<MandateRecord>;
}

export type BookingResult = { kind: "payment"; payment: PaymentRecord } | { kind: "mandate"; mandate: MandateRecord } | { kind: "none"; reason: string };

/** Bucht ein typisiertes Ereignis: aktualisiert oder erzeugt Zahlungen, setzt Mandatsstatus. Idempotenz stellt processWebhookOnce sicher. */
export async function bookWebhookEvent(event: WebhookEvent, repo: PaymentBookingRepository): Promise<BookingResult> {
  switch (event.type) {
    case "payment_succeeded":
    case "payment_failed": {
      const status: PaymentStatus = event.type === "payment_succeeded" ? "succeeded" : "failed";
      const existing = await repo.findPaymentByProviderPaymentId(event.providerPaymentId);
      const paidAt = status === "succeeded" ? event.occurred_at : null;
      if (existing) {
        const patch: Partial<Omit<PaymentRecord, "id">> = { status, paid_at: paidAt, webhook_event_id: event.provider_event_id };
        if (event.type === "payment_failed" && event.failureMessage) patch.note = event.failureMessage;
        return { kind: "payment", payment: await repo.updatePayment(existing.id, patch) };
      }
      const payment = await repo.insertPayment({
        invoice_id: event.invoiceId ?? null,
        provider: event.provider,
        provider_payment_id: event.providerPaymentId,
        method: "sepa_debit",
        amount_cents: event.amountCents,
        currency: event.currency,
        status,
        paid_at: paidAt,
        webhook_event_id: event.provider_event_id,
      });
      return { kind: "payment", payment };
    }
    case "payment_refunded":
    case "chargeback": {
      const original = await repo.findPaymentByProviderPaymentId(event.providerPaymentId);
      const status: PaymentStatus = event.type === "chargeback" ? "chargeback" : "refunded";
      // Gegenbuchung mit negativem Betrag, damit der Rechnungssaldo (nur succeeded zählt) korrekt bleibt
      const payment = await repo.insertPayment({
        invoice_id: original?.invoice_id ?? ("invoiceId" in event && event.invoiceId ? event.invoiceId : null),
        provider: event.provider,
        provider_payment_id: event.providerPaymentId,
        method: original?.method ?? "sepa_debit",
        amount_cents: -Math.abs(event.amountCents),
        currency: event.currency,
        status,
        paid_at: event.occurred_at,
        webhook_event_id: event.provider_event_id,
        ...(event.type === "chargeback" && event.reason ? { note: event.reason } : {}),
      });
      if (original && status === "chargeback") await repo.updatePayment(original.id, { status: "chargeback" });
      if (original && status === "refunded") await repo.updatePayment(original.id, { status: "refunded" });
      return { kind: "payment", payment };
    }
    case "mandate_active":
    case "mandate_revoked": {
      const mandate = await repo.findMandateByRef(event.mandateRef);
      if (!mandate) return { kind: "none", reason: `Kein Mandat zu Referenz ${event.mandateRef}` };
      // provider_mandate_id bleibt die Referenz, mit der eingezogen wird (bei Stripe die PaymentMethod-ID); sie wird nur gesetzt, wenn sie noch fehlt
      const patch: Partial<Omit<MandateRecord, "id">> = { status: event.type === "mandate_active" ? "active" : "revoked", provider_mandate_id: mandate.provider_mandate_id ?? event.mandateRef };
      if (event.type === "mandate_active") {
        if (event.mandateReference) patch.mandate_reference = event.mandateReference;
        if (event.maskedIban) patch.masked_iban = event.maskedIban;
      }
      return { kind: "mandate", mandate: await repo.updateMandate(mandate.id, patch) };
    }
    case "unknown":
      return { kind: "none", reason: `Unbekannter Ereignistyp ${event.raw_type}` };
  }
}

/** Speicherimplementierung für Tests und lokale Entwicklung. */
export class InMemoryPaymentRepository implements PaymentBookingRepository {
  readonly processedEvents = new Map<string, string>();
  readonly payments: PaymentRecord[] = [];
  readonly mandates: MandateRecord[] = [];
  private seq = 0;

  async claimEvent(providerEventId: string, eventType: string): Promise<boolean> {
    if (this.processedEvents.has(providerEventId)) return false;
    this.processedEvents.set(providerEventId, eventType);
    return true;
  }

  async releaseEvent(providerEventId: string): Promise<void> {
    this.processedEvents.delete(providerEventId);
  }

  async findPaymentByProviderPaymentId(providerPaymentId: string): Promise<PaymentRecord | null> {
    return this.payments.find((p) => p.provider_payment_id === providerPaymentId && p.amount_cents > 0) ?? null;
  }

  async insertPayment(payment: Omit<PaymentRecord, "id">): Promise<PaymentRecord> {
    if (payment.webhook_event_id && this.payments.some((p) => p.webhook_event_id === payment.webhook_event_id)) {
      throw new Error(`payments.webhook_event_id ${payment.webhook_event_id} bereits vorhanden`);
    }
    this.seq += 1;
    const record: PaymentRecord = { id: `pay_${this.seq}`, ...payment };
    this.payments.push(record);
    return record;
  }

  async updatePayment(id: string, patch: Partial<Omit<PaymentRecord, "id">>): Promise<PaymentRecord> {
    const idx = this.payments.findIndex((p) => p.id === id);
    const current = this.payments[idx];
    if (!current) throw new Error(`Zahlung ${id} nicht gefunden`);
    const updated: PaymentRecord = { ...current, ...patch };
    this.payments[idx] = updated;
    return updated;
  }

  async findMandateByRef(mandateRef: string): Promise<MandateRecord | null> {
    return this.mandates.find((m) => m.provider_mandate_id === mandateRef || m.mandate_reference === mandateRef) ?? null;
  }

  async updateMandate(id: string, patch: Partial<Omit<MandateRecord, "id">>): Promise<MandateRecord> {
    const idx = this.mandates.findIndex((m) => m.id === id);
    const current = this.mandates[idx];
    if (!current) throw new Error(`Mandat ${id} nicht gefunden`);
    const updated: MandateRecord = { ...current, ...patch };
    this.mandates[idx] = updated;
    return updated;
  }
}
