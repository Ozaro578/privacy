import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@fahrpilot/db";
import { bookWebhookEvent, processWebhookOnce, StripeProvider, WebhookSignatureError, type MandateRecord, type PaymentBookingRepository, type PaymentRecord, type WebhookEvent } from "@fahrpilot/payments";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PROVIDER = "stripe";
type Admin = SupabaseClient<Database>;

/** Ereignis, das keinem Schüler oder Tenant zugeordnet werden kann. Wird als ignoriert protokolliert, Stripe erhält 200. */
class UnassignableEventError extends Error {
  override readonly name = "UnassignableEventError";
}

function toPaymentRecord(row: Database["public"]["Tables"]["payments"]["Row"]): PaymentRecord {
  return { id: row.id, invoice_id: row.invoice_id, provider: row.provider, provider_payment_id: row.provider_payment_id, method: row.method as PaymentRecord["method"], amount_cents: row.amount_cents, currency: row.currency, status: row.status as PaymentRecord["status"], paid_at: row.paid_at, webhook_event_id: row.webhook_event_id, ...(row.note ? { note: row.note } : {}) };
}

function toMandateRecord(row: Pick<Database["public"]["Tables"]["payment_mandates"]["Row"], "id" | "provider_mandate_id" | "status" | "mandate_reference" | "masked_iban">): MandateRecord {
  return { id: row.id, provider_mandate_id: row.provider_mandate_id, status: row.status as MandateRecord["status"], mandate_reference: row.mandate_reference, masked_iban: row.masked_iban };
}

/**
 * Buchungsschnittstelle gegen Supabase (Service-Role). Idempotenz doppelt: payment_webhook_events (provider, event_id)
 * und payments.webhook_event_id (unique). Tenant und Schüler einer neuen Zahlung werden über die Rechnung oder das
 * Mandat (Zahlungsmethode pm_...) ermittelt.
 */
class SupabasePaymentRepository implements PaymentBookingRepository {
  constructor(private readonly db: Admin, private readonly event: WebhookEvent) {}

  async claimEvent(providerEventId: string, eventType: string): Promise<boolean> {
    const { data: paid } = await this.db.from("payments").select("id").eq("webhook_event_id", providerEventId).limit(1);
    if (paid?.length) return false;
    const { error } = await this.db.from("payment_webhook_events").insert({ provider: PROVIDER, event_id: providerEventId, event_type: eventType, status: "processing" });
    if (!error) return true;
    if (error.code !== "23505") throw new Error(`payment_webhook_events: ${error.message}`);
    // Bereits bekannt: nur nach fehlgeschlagener Verarbeitung erneut versuchen
    const { data: existing } = await this.db.from("payment_webhook_events").select("status").eq("provider", PROVIDER).eq("event_id", providerEventId).maybeSingle();
    if (existing?.status !== "failed") return false;
    const { data: reclaimed } = await this.db.from("payment_webhook_events").update({ status: "processing", error: null, processed_at: null }).eq("provider", PROVIDER).eq("event_id", providerEventId).eq("status", "failed").select("event_id");
    return Boolean(reclaimed?.length);
  }

  async releaseEvent(providerEventId: string): Promise<void> {
    await this.db.from("payment_webhook_events").update({ status: "failed", processed_at: new Date().toISOString() }).eq("provider", PROVIDER).eq("event_id", providerEventId);
  }

  async markProcessed(providerEventId: string, status: "processed" | "ignored", note?: string): Promise<void> {
    await this.db.from("payment_webhook_events").update({ status, processed_at: new Date().toISOString(), error: note ?? null }).eq("provider", PROVIDER).eq("event_id", providerEventId);
  }

  async markFailed(providerEventId: string, message: string): Promise<void> {
    await this.db.from("payment_webhook_events").update({ status: "failed", processed_at: new Date().toISOString(), error: message.slice(0, 500) }).eq("provider", PROVIDER).eq("event_id", providerEventId);
  }

  async findPaymentByProviderPaymentId(providerPaymentId: string): Promise<PaymentRecord | null> {
    const { data } = await this.db.from("payments").select("*").eq("provider", PROVIDER).eq("provider_payment_id", providerPaymentId).gt("amount_cents", 0).order("created_at").limit(1);
    const row = data?.[0];
    return row ? toPaymentRecord(row) : null;
  }

  /** Tenant und Schüler für eine neue Zahlung: über die Rechnung, sonst über das Mandat der Zahlungsmethode. */
  private async resolveOwner(invoiceId: string | null): Promise<{ tenant_id: string; student_id: string; mandate_id: string | null }> {
    if (invoiceId) {
      const { data: inv } = await this.db.from("invoices").select("tenant_id, student_id").eq("id", invoiceId).maybeSingle();
      if (inv) {
        const mandate = await this.mandateForEvent();
        return { tenant_id: inv.tenant_id, student_id: inv.student_id, mandate_id: mandate?.id ?? null };
      }
    }
    const mandate = await this.mandateForEvent();
    if (mandate) return { tenant_id: mandate.tenant_id, student_id: mandate.student_id, mandate_id: mandate.id };
    throw new UnassignableEventError(`Ereignis ${this.event.provider_event_id} (${this.event.raw_type}) hat weder Rechnung noch Mandat`);
  }

  private async mandateForEvent(): Promise<{ id: string; tenant_id: string; student_id: string } | null> {
    const ref = this.event.type === "payment_succeeded" ? this.event.mandateRef : undefined;
    if (!ref) return null;
    const { data } = await this.db.from("payment_mandates").select("id, tenant_id, student_id").eq("provider", PROVIDER).eq("provider_mandate_id", ref).limit(1);
    return data?.[0] ?? null;
  }

  async insertPayment(payment: Omit<PaymentRecord, "id">): Promise<PaymentRecord> {
    const owner = await this.resolveOwner(payment.invoice_id);
    const { data, error } = await this.db.from("payments").insert({
      tenant_id: owner.tenant_id, student_id: owner.student_id, invoice_id: payment.invoice_id, mandate_id: owner.mandate_id,
      provider: payment.provider, provider_payment_id: payment.provider_payment_id, method: payment.method, amount_cents: payment.amount_cents, currency: payment.currency,
      status: payment.status, paid_at: payment.paid_at, webhook_event_id: payment.webhook_event_id, note: payment.note ?? null,
    }).select("*").single();
    if (error || !data) throw new Error(`payments insert: ${error?.message ?? "unbekannt"}`);
    return toPaymentRecord(data);
  }

  async updatePayment(id: string, patch: Partial<Omit<PaymentRecord, "id">>): Promise<PaymentRecord> {
    const { data, error } = await this.db.from("payments").update(patch).eq("id", id).select("*").single();
    if (error || !data) throw new Error(`payments update: ${error?.message ?? "unbekannt"}`);
    return toPaymentRecord(data);
  }

  /**
   * Mandat über die Zahlungsmethode (provider_mandate_id) oder die Mandatsreferenz finden. Für ein noch ausstehendes
   * Stripe-Mandat steht in mandate_reference die Kundenreferenz (cus_...), die setup_intent.succeeded mitliefert.
   */
  async findMandateByRef(mandateRef: string): Promise<MandateRecord | null> {
    const cols = "id, provider_mandate_id, status, mandate_reference, masked_iban";
    if (mandateRef) {
      const { data } = await this.db.from("payment_mandates").select(cols).eq("provider", PROVIDER).or(`provider_mandate_id.eq.${mandateRef},mandate_reference.eq.${mandateRef}`).order("created_at", { ascending: false }).limit(1);
      if (data?.[0]) return toMandateRecord(data[0]);
    }
    if (this.event.type === "mandate_active" && this.event.providerCustomerId) {
      const { data } = await this.db.from("payment_mandates").select(cols).eq("provider", PROVIDER).eq("status", "pending").eq("mandate_reference", this.event.providerCustomerId).order("created_at", { ascending: false }).limit(1);
      if (data?.[0]) return toMandateRecord(data[0]);
    }
    if (this.event.type === "mandate_active" || this.event.type === "mandate_revoked") {
      const { data } = await this.db.from("payment_mandates").select(cols).eq("provider", PROVIDER).eq("provider_mandate_id", this.event.providerMandateId).limit(1);
      if (data?.[0]) return toMandateRecord(data[0]);
    }
    return null;
  }

  async updateMandate(id: string, patch: Partial<Omit<MandateRecord, "id">>): Promise<MandateRecord> {
    const update: Database["public"]["Tables"]["payment_mandates"]["Update"] = { ...patch };
    if (patch.status === "active") update.signed_at = this.event.occurred_at;
    const { data, error } = await this.db.from("payment_mandates").update(update).eq("id", id).select("id, provider_mandate_id, status, mandate_reference, masked_iban").single();
    if (error || !data) throw new Error(`payment_mandates update: ${error?.message ?? "unbekannt"}`);
    return toMandateRecord(data);
  }
}

/**
 * Stripe-Webhook: Signatur prüfen (STRIPE_WEBHOOK_SECRET), jedes Ereignis genau einmal buchen. Duplikate und
 * unbekannte Ereignistypen werden mit 200 bestätigt; Verarbeitungsfehler liefern 500, damit Stripe erneut zustellt.
 */
export async function POST(request: NextRequest) {
  const secretKey = process.env["STRIPE_SECRET_KEY"];
  const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!secretKey || !webhookSecret) return NextResponse.json({ error: "Zahlungsanbieter nicht konfiguriert" }, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Signatur fehlt" }, { status: 400 });
  const rawBody = await request.text();

  let event: WebhookEvent;
  try {
    event = new StripeProvider({ secretKey, webhookSecret }).parseWebhook(rawBody, signature, webhookSecret);
  } catch (err) {
    if (err instanceof WebhookSignatureError) return NextResponse.json({ error: "Ungültige Signatur" }, { status: 400 });
    return NextResponse.json({ error: "Ereignis nicht lesbar" }, { status: 400 });
  }

  const repo = new SupabasePaymentRepository(createSupabaseAdminClient(), event);
  try {
    const outcome = await processWebhookOnce(event, repo, (ev) => bookWebhookEvent(ev, repo));
    if (outcome.status === "duplicate") return NextResponse.json({ received: true, duplicate: true });
    if (outcome.status === "ignored") {
      await repo.markProcessed(event.provider_event_id, "ignored", outcome.reason);
      return NextResponse.json({ received: true, ignored: outcome.reason });
    }
    const result = outcome.result;
    await repo.markProcessed(event.provider_event_id, result.kind === "none" ? "ignored" : "processed", result.kind === "none" ? result.reason : undefined);
    return NextResponse.json({ received: true, kind: result.kind });
  } catch (err) {
    if (err instanceof UnassignableEventError) {
      await repo.markProcessed(event.provider_event_id, "ignored", err.message);
      return NextResponse.json({ received: true, ignored: err.message });
    }
    const message = err instanceof Error ? err.message : String(err);
    await repo.markFailed(event.provider_event_id, message);
    console.error(`[stripe-webhook] ${event.provider_event_id} ${event.raw_type}: ${message}`);
    return NextResponse.json({ error: "Verarbeitung fehlgeschlagen" }, { status: 500 });
  }
}
