# @fahrpilot/payments

Serverseitiges Zahlungsmodul: Rechnungslogik, Mahnwesen, SEPA-Lastschrift über Stripe, Webhook-Verarbeitung mit Idempotenz und PDF-Erzeugung (Rechnung, Zahlungsbeleg). Das Paket enthält keine Datenbankzugriffe; Repositories werden als Schnittstellen übergeben. Alle Beträge sind ganze Zahlen in Cent.

## Konfiguration

Schlüssel werden ausschließlich über Konfigurationsobjekte übergeben, das Paket liest keine Umgebungsvariablen. Empfohlene Variablen in der aufrufenden Anwendung:

| Variable | Verwendung |
| --- | --- |
| `STRIPE_SECRET_KEY` | `new StripeProvider({ secretKey })`, geheimer API-Schlüssel (`sk_live_...` oder `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Signaturgeheimnis des Webhook-Endpunkts (`whsec_...`), an `StripeProvider` oder je Aufruf an `parseWebhook` |
| `SEPA_CREDITOR_ID` | Gläubiger-Identifikationsnummer der Fahrschule für Vorankündigung und Rechnungsaufdruck |

```ts
import { StripeProvider } from "@fahrpilot/payments";
const provider = new StripeProvider({ secretKey: process.env.STRIPE_SECRET_KEY!, webhookSecret: process.env.STRIPE_WEBHOOK_SECRET! });
```

Für Überweisung und Barzahlung gibt es `ManualProvider`, für Tests `FakeProvider`. Alle implementieren `PaymentProvider`.

## Ablauf

1. **Mandat einrichten**: `createCustomer` legt den Kunden beim Anbieter an, `createSepaMandateSetup(customer, returnUrl)` liefert ein `clientSecret` (Stripe SetupIntent für das Frontend) oder eine `url` (gehosteter Ablauf mit `hostedMandateSetup: true`). Nach Bestätigung meldet Stripe `setup_intent.succeeded` und `mandate.updated`; `bookWebhookEvent` setzt `payment_mandates.status` auf `active` und übernimmt Mandatsreferenz und maskierte IBAN. In `payment_mandates.provider_mandate_id` wird die Referenz gespeichert, mit der eingezogen wird (bei Stripe die PaymentMethod-ID `pm_...`).
2. **Rechnung erstellen**: `computeInvoiceTotals(items)` rechnet wie `app.issue_invoice` je Position kaufmännisch gerundet (2 x 50,42 EUR netto bei 19 % ergibt 120,00 EUR brutto). `renderInvoicePdf(data)` erzeugt die PDF mit den Pflichtangaben nach § 14 Abs. 4 UStG (Name und Anschrift beider Parteien, Steuernummer oder USt-IdNr., Rechnungsnummer, Datum, Leistungsdatum oder Leistungszeitraum, Menge und Art der Leistung, Nettoentgelt nach Steuersätzen, Steuersatz und Steuerbetrag, Hinweis bei Kleinunternehmerregelung).
3. **Vorankündigung**: `sepaPreNotificationText` erzeugt die Pre-Notification mit Betrag, Mandatsreferenz, Gläubiger-ID und Einzugsdatum. Sie muss dem Zahler vor dem Einzug zugehen (Frist laut Vertrag, Standard 14 Tage, verkürzbar).
4. **Einzug**: `chargeInvoice({ invoiceId, amountCents, currency, mandateRef, idempotencyKey })` erstellt einen PaymentIntent (`off_session`, `confirm`) mit Idempotency-Key. SEPA-Lastschriften bleiben mehrere Tage `pending`; der Ausgang kommt per Webhook.
5. **Webhook**: `provider.parseWebhook(rawBody, signatureHeader, secret)` prüft die Signatur (`stripe.webhooks.constructEvent`) und liefert ein typisiertes `WebhookEvent` (`payment_succeeded`, `payment_failed`, `payment_refunded`, `mandate_active`, `mandate_revoked`, `chargeback`, `unknown`) mit `provider_event_id`. `processWebhookOnce(event, repo, handler)` verarbeitet jede Ereignis-ID genau einmal; in der Datenbank sichert `payments.webhook_event_id` (unique) die Idempotenz ab. `bookWebhookEvent` bucht Zahlungen, negative Gegenbuchungen bei Erstattung und Rücklastschrift sowie Mandatsstatus.
6. **Rechnungsstatus**: `applyPayment(invoice, payments, today)` spiegelt `app.apply_payment_to_invoice`: nur `succeeded` zählt, `paid` ab vollständiger Zahlung, `partially_paid` bei Teilzahlung, `overdue` nach Fälligkeit, `cancelled`, `credited` und `draft` bleiben unverändert.
7. **Mahnwesen**: `dunningPlan(invoice, today, { reminder_days: [7, 14, 28], fees_cents: [0, 500, 1000] })` ermittelt die nächste Mahnstufe (`send`, `wait` oder `none` mit Grund).
8. **Beleg**: `renderReceiptPdf` erzeugt eine Quittung zur Zahlung.

## Tests

`pnpm test` prüft Rundung, Statusübergänge, Webhook-Idempotenz mit `InMemoryPaymentRepository`, Mahnstufen, den Stripe-Adapter mit injiziertem Client sowie PDF-Header und Länge.

## Offene rechtliche Punkte

- **E-Rechnung (B2B)**: Seit 2025 müssen inländische B2B-Rechnungen als strukturierte E-Rechnung (XRechnung oder ZUGFeRD) ausgestellt werden können; Übergangsfristen für den Versand laufen bis Ende 2027. Fahrschüler sind meist Verbraucher (B2C), Firmenkunden (z. B. Berufskraftfahrerausbildung) jedoch nicht. Das Feld `invoices.e_invoice_path` ist vorgesehen, die Erzeugung von XRechnung/ZUGFeRD ist nicht umgesetzt.
- **GoBD**: Lückenlose Nummernvergabe und Unveränderlichkeit ausgestellter Rechnungen sind in der Datenbank abgesichert (`app.next_invoice_number`, `app.protect_issued_invoice`). Die revisionssichere Archivierung der PDFs (10 Jahre, unveränderbarer Speicher), eine Verfahrensdokumentation und die Protokollierung von Storno und Korrektur sind organisatorisch zu regeln und steuerlich zu prüfen.
- **SEPA-Vorankündigungsfrist**: Standard 14 Tage vor Einzug, verkürzbar nur bei vertraglicher Vereinbarung mit dem Schüler.
- **Mahngebühren und Verzugszinsen**: Höhe und Zulässigkeit gegenüber Verbrauchern (Pauschalen, § 288 BGB) sind rechtlich zu prüfen; Standardwerte im Paket sind Platzhalter.
- **Kleinunternehmerregelung**: Der Hinweis nach § 19 UStG wird gedruckt, die Anwendbarkeit muss je Fahrschule konfiguriert werden.
- **Schriftart in PDFs**: Die eingebettete Standardschrift deckt nur WinAnsi ab; Namen in anderen Schriftsystemen werden ersetzt. Für vollständige Unicode-Unterstützung ist eine eingebettete TTF-Schrift nötig.
