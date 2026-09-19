import Link from "next/link";
import { notFound } from "next/navigation";
import { computeInvoiceTotals, vatBreakdown } from "@fahrpilot/payments";
import { getInvoice } from "@/lib/data/admin-finance";
import { INVOICE_STATUS_LABEL, PAYMENT_METHOD_LABEL, berlinDate } from "@/lib/data/admin";
import { addInvoiceItem, cancelInvoice, createManualMandate, createStripeMandate, deleteDraftInvoice, deleteInvoiceItem, issueInvoiceAction, recordPayment, regenerateInvoicePdf, revokeMandate, runDunning, updateInvoiceItem, updateInvoiceNotes } from "@/lib/actions/admin-finance";
import { Alert, Card, Pill, btn, fmt, parseRange } from "@/components/ui";
import { ActionForm, field, label } from "@/components/admin/action-form";
import { ActionButton } from "@/components/admin/action-button";

export const metadata = { title: "Rechnung" };

const STATUS_TONE: Record<string, "neutral" | "brand" | "success" | "warn" | "danger"> = { draft: "neutral", issued: "brand", partially_paid: "warn", paid: "success", overdue: "danger", cancelled: "neutral", credited: "neutral" };
const PAYMENT_STATUS_LABEL: Record<string, string> = { pending: "Offen", succeeded: "Erfolgreich", failed: "Fehlgeschlagen", refunded: "Erstattet", chargeback: "Rücklastschrift" };
const MANDATE_LABEL: Record<string, string> = { pending: "Ausstehend", active: "Aktiv", revoked: "Widerrufen", failed: "Fehlgeschlagen" };
const eur = (c: number) => (c / 100).toFixed(2).replace(".", ",");

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getInvoice(id);
  if (!d) notFound();
  const inv = d.invoice;
  const isDraft = inv.status === "draft";
  const isOpen = ["issued", "partially_paid", "overdue"].includes(inv.status);
  const totals = computeInvoiceTotals(d.items.map((it) => ({ quantity: Number(it.quantity), unit_net_cents: it.unit_net_cents, vat_rate: d.settings.small_business ? 0 : Number(it.vat_rate) })));
  const vat = vatBreakdown(d.items.map((it) => ({ quantity: Number(it.quantity), unit_net_cents: it.unit_net_cents, vat_rate: d.settings.small_business ? 0 : Number(it.vat_rate) })));
  const openCents = inv.gross_cents - inv.paid_cents;
  const student = inv.students;
  const title = inv.credit_note_for ? `Gutschrift ${inv.invoice_number ?? ""}` : inv.invoice_number ? `Rechnung ${inv.invoice_number}` : "Rechnungsentwurf";
  const overdue = isOpen && inv.due_at !== null && inv.due_at < berlinDate();
  const dunningLevelLabel = (level: number) => (level === 1 ? "Zahlungserinnerung" : `${level - 1}. Mahnung`);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm"><Link href="/verwaltung/finanzen" className="text-brand-700 hover:underline">Finanzen</Link> / {title}</p>
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold">{title} <Pill tone={overdue ? "danger" : (STATUS_TONE[inv.status] ?? "neutral")}>{overdue && inv.status !== "overdue" ? "Überfällig" : (INVOICE_STATUS_LABEL[inv.status] ?? inv.status)}</Pill></h1>
          <p className="text-sm text-ink-700">
            {student ? <Link href={`/verwaltung/schueler/${student.id}`} className="text-brand-700 hover:underline">{student.first_name} {student.last_name}</Link> : "Schüler unbekannt"}
            {inv.issued_at && <> · ausgestellt {fmt.date(inv.issued_at)}</>}{inv.due_at && !inv.credit_note_for && <> · fällig {fmt.date(inv.due_at)}</>}
            {d.original && <> · Korrektur zu <Link href={`/verwaltung/finanzen/rechnung/${d.original.id}`} className="text-brand-700 hover:underline">{d.original.invoice_number}</Link></>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {inv.pdf_path && <a href={`/api/files?path=${encodeURIComponent(inv.pdf_path)}`} target="_blank" rel="noreferrer" className={btn.secondary}>PDF öffnen</a>}
          {!isDraft && <ActionButton action={regenerateInvoicePdf.bind(null, inv.id)} label={inv.pdf_path ? "PDF neu erzeugen" : "PDF erzeugen"} pendingLabel="Erzeuge PDF …" tone="ghost" />}
        </div>
      </header>

      {student && (!student.address_line1 || !student.postal_code || !student.city) && isDraft && <Alert tone="warning">Die Anschrift des Schülers ist unvollständig. Für eine ordnungsgemäße Rechnung sollte sie vor dem Ausstellen ergänzt werden.</Alert>}
      {!d.ctx.school.tax_id && !d.ctx.school.vat_id && isDraft && <Alert tone="warning">Für die PDF-Erzeugung fehlt die Steuernummer oder USt-IdNr. der Fahrschule. Bitte in den <Link href="/verwaltung/einstellungen" className="underline">Einstellungen</Link> hinterlegen.</Alert>}
      {d.creditNotes.length > 0 && <Alert tone="info">Gutschriften zu dieser Rechnung: {d.creditNotes.map((c, i) => <span key={c.id}>{i > 0 ? ", " : ""}<Link href={`/verwaltung/finanzen/rechnung/${c.id}`} className="underline">{c.invoice_number}</Link> ({fmt.eur(c.gross_cents)})</span>)}</Alert>}

      <Card title="Positionen">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink-500"><tr><th className="p-2">Pos.</th><th className="p-2">Leistung</th><th className="p-2 text-right">Menge</th><th className="p-2 text-right">Einzelpreis netto</th><th className="p-2 text-right">USt</th><th className="p-2 text-right">Gesamt netto</th>{isDraft && <th className="p-2"></th>}</tr></thead>
            <tbody className="divide-y divide-ink-100">
              {d.items.map((it) => (
                <tr key={it.id} className="align-top">
                  <td className="p-2">{it.position}</td>
                  <td className="p-2">{it.description}{it.lessons && <span className="block text-xs text-ink-500">Leistungsdatum {fmt.date(parseRange(it.lessons.period).start)}</span>}{it.price_item_code && <span className="block font-mono text-xs text-ink-500">{it.price_item_code}</span>}</td>
                  <td className="p-2 text-right tabular-nums">{String(Number(it.quantity)).replace(".", ",")}</td>
                  <td className="p-2 text-right tabular-nums">{fmt.eur(it.unit_net_cents)}</td>
                  <td className="p-2 text-right tabular-nums">{d.settings.small_business ? "0" : String(Number(it.vat_rate)).replace(".", ",")} %</td>
                  <td className="p-2 text-right tabular-nums">{fmt.eur(Math.round(Number(it.quantity) * it.unit_net_cents))}</td>
                  {isDraft && (
                    <td className="p-2">
                      <details>
                        <summary className="cursor-pointer text-brand-700">Bearbeiten</summary>
                        <div className="mt-2 w-72 rounded-xl bg-ink-50 p-3">
                          <ActionForm action={updateInvoiceItem} submitLabel="Speichern" className="grid gap-2">
                            <input type="hidden" name="id" value={it.id} /><input type="hidden" name="invoice_id" value={inv.id} /><input type="hidden" name="price_item_code" value={it.price_item_code ?? ""} />
                            <div><label htmlFor={`d-${it.id}`} className={label}>Beschreibung</label><input id={`d-${it.id}`} name="description" required defaultValue={it.description} className={field} /></div>
                            <div><label htmlFor={`q-${it.id}`} className={label}>Menge</label><input id={`q-${it.id}`} name="quantity" inputMode="decimal" required defaultValue={String(Number(it.quantity)).replace(".", ",")} className={field} /></div>
                            <div><label htmlFor={`u-${it.id}`} className={label}>Einzelpreis netto (EUR)</label><input id={`u-${it.id}`} name="unit_net_eur" inputMode="decimal" required defaultValue={eur(it.unit_net_cents)} className={field} /></div>
                            <div><label htmlFor={`v-${it.id}`} className={label}>USt (%)</label><input id={`v-${it.id}`} name="vat_rate" inputMode="decimal" required defaultValue={String(Number(it.vat_rate)).replace(".", ",")} className={field} /></div>
                          </ActionForm>
                          <div className="mt-2"><ActionButton action={deleteInvoiceItem.bind(null, it.id, inv.id)} label="Entfernen" tone="ghost" small /></div>
                        </div>
                      </details>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot className="text-sm">
              <tr><td colSpan={5} className="p-2 text-right">Nettobetrag</td><td className="p-2 text-right tabular-nums">{fmt.eur(isDraft ? totals.net : inv.net_cents)}</td>{isDraft && <td></td>}</tr>
              {isDraft ? vat.map((g) => <tr key={g.vat_rate}><td colSpan={5} className="p-2 text-right">zzgl. {String(g.vat_rate).replace(".", ",")} % USt</td><td className="p-2 text-right tabular-nums">{fmt.eur(g.vat)}</td><td></td></tr>) : <tr><td colSpan={5} className="p-2 text-right">Umsatzsteuer</td><td className="p-2 text-right tabular-nums">{fmt.eur(inv.vat_cents)}</td></tr>}
              <tr className="font-semibold"><td colSpan={5} className="p-2 text-right">Bruttobetrag</td><td className="p-2 text-right tabular-nums">{fmt.eur(isDraft ? totals.gross : inv.gross_cents)}</td>{isDraft && <td></td>}</tr>
              {!isDraft && <tr><td colSpan={5} className="p-2 text-right">Bezahlt</td><td className="p-2 text-right tabular-nums">{fmt.eur(inv.paid_cents)}</td></tr>}
              {isOpen && <tr className="font-semibold"><td colSpan={5} className="p-2 text-right">Offen</td><td className="p-2 text-right tabular-nums">{fmt.eur(openCents)}</td></tr>}
            </tfoot>
          </table>
        </div>
        {d.settings.small_business && <p className="mt-2 text-xs text-ink-500">Kleinunternehmerregelung nach § 19 UStG aktiv: keine Umsatzsteuer.</p>}
        {inv.notes && <p className="mt-3 whitespace-pre-line text-sm text-ink-700">{inv.notes}</p>}
      </Card>

      {isDraft && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Position hinzufügen">
            <ActionForm action={addInvoiceItem} submitLabel="Hinzufügen" className="grid gap-2 md:grid-cols-2" resetOnSuccess>
              <input type="hidden" name="invoice_id" value={inv.id} />
              <div className="md:col-span-2"><label htmlFor="add-description" className={label}>Beschreibung</label><input id="add-description" name="description" required className={field} /></div>
              <div><label htmlFor="add-quantity" className={label}>Menge</label><input id="add-quantity" name="quantity" inputMode="decimal" defaultValue="1" className={field} /></div>
              <div><label htmlFor="add-unit" className={label}>Einzelpreis netto (EUR)</label><input id="add-unit" name="unit_net_eur" inputMode="decimal" required className={field} /></div>
              <div><label htmlFor="add-vat" className={label}>USt (%)</label><input id="add-vat" name="vat_rate" inputMode="decimal" defaultValue={String(Number(inv.vat_rate)).replace(".", ",")} className={field} /></div>
              <div><label htmlFor="add-code" className={label}>Positionscode (optional)</label><input id="add-code" name="price_item_code" className={field} /></div>
            </ActionForm>
          </Card>
          <Card title="Ausstellen">
            <ActionForm action={updateInvoiceNotes} submitLabel="Hinweistext speichern" tone="secondary" className="grid gap-2">
              <input type="hidden" name="invoice_id" value={inv.id} />
              <div><label htmlFor="notes" className={label}>Hinweistext auf der Rechnung</label><textarea id="notes" name="notes" rows={2} defaultValue={inv.notes ?? ""} className={field} /></div>
            </ActionForm>
            <p className="mt-4 text-sm text-ink-700">Beim Ausstellen vergibt die Datenbank die nächste lückenlose Rechnungsnummer, berechnet die Summen und setzt die Fälligkeit auf {d.settings.invoice_due_days} Tage. Danach ist die Rechnung unveränderlich.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ActionButton action={issueInvoiceAction.bind(null, inv.id, undefined)} label="Rechnung ausstellen" pendingLabel="Stelle aus …" tone="primary" confirm="Rechnung jetzt ausstellen? Danach sind keine Änderungen an den Positionen mehr möglich." />
              <ActionButton action={deleteDraftInvoice.bind(null, inv.id)} label="Entwurf löschen" tone="danger" confirm="Entwurf endgültig löschen?" />
            </div>
          </Card>
        </div>
      )}

      {!isDraft && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Zahlungen">
            {d.payments.length === 0 ? <p className="text-sm text-ink-500">Noch keine Zahlungen.</p> : (
              <ul className="divide-y divide-ink-100 text-sm">
                {d.payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span>{fmt.date(p.paid_at ?? p.created_at)} · {PAYMENT_METHOD_LABEL[p.method] ?? p.method}{p.provider !== "manual" && ` (${p.provider})`}{p.note && <span className="block text-xs text-ink-500">{p.note}</span>}</span>
                    <span className="flex items-center gap-2"><span className={`tabular-nums ${p.amount_cents < 0 ? "text-danger-500" : ""}`}>{fmt.eur(p.amount_cents)}</span><Pill tone={p.status === "succeeded" ? "success" : p.status === "pending" ? "warn" : "danger"}>{PAYMENT_STATUS_LABEL[p.status] ?? p.status}</Pill></span>
                  </li>
                ))}
              </ul>
            )}
            {inv.status !== "credited" && (
              <details className="mt-3 rounded-xl border border-ink-100 p-3" open={isOpen}>
                <summary className="cursor-pointer font-medium">Zahlung erfassen</summary>
                <div className="mt-3">
                  <ActionForm action={recordPayment} submitLabel="Zahlung buchen" className="grid gap-2 md:grid-cols-2" resetOnSuccess>
                    <input type="hidden" name="invoice_id" value={inv.id} />
                    <div><label htmlFor="pay-amount" className={label}>Betrag (EUR)</label><input id="pay-amount" name="amount_eur" inputMode="decimal" required defaultValue={openCents > 0 ? eur(openCents) : ""} className={field} /></div>
                    <div><label htmlFor="pay-method" className={label}>Zahlungsart</label><select id="pay-method" name="method" defaultValue="bank_transfer" className={field}><option value="bank_transfer">Überweisung</option><option value="cash">Bar</option><option value="sepa_debit">SEPA-Lastschrift</option><option value="card">Karte</option><option value="other">Sonstige</option></select></div>
                    <div><label htmlFor="pay-date" className={label}>Zahlungsdatum</label><input id="pay-date" name="paid_at" type="date" required defaultValue={berlinDate()} className={field} /></div>
                    <div><label htmlFor="pay-note" className={label}>Notiz</label><input id="pay-note" name="note" className={field} /></div>
                    <label className="flex min-h-11 items-center gap-2 text-sm md:col-span-2"><input type="checkbox" name="refund" className="h-5 w-5" /> Erstattung (Betrag wird negativ gebucht)</label>
                  </ActionForm>
                </div>
              </details>
            )}
          </Card>

          <div className="space-y-6">
            {isOpen && (
              <Card title="Mahnung">
                <p className="text-sm text-ink-700">
                  {inv.dunning_level > 0 ? `Aktuelle Stufe: ${dunningLevelLabel(inv.dunning_level)} vom ${fmt.date(inv.dunning_last_at)}.` : "Noch keine Mahnung."}{" "}
                  {d.plan.action === "send" && `Jetzt fällig: ${dunningLevelLabel(d.plan.level)}${d.plan.fee_cents ? ` mit Gebühr ${fmt.eur(d.plan.fee_cents)}` : ""}.`}
                  {d.plan.action === "wait" && `Nächste Stufe (${dunningLevelLabel(d.plan.level)}) ab ${fmt.date(d.plan.scheduled_for)}.`}
                  {d.plan.action === "none" && d.plan.reason === "max_level_reached" && "Höchste Mahnstufe erreicht. Nächster Schritt: Inkasso oder Mahnbescheid."}
                </p>
                <div className="mt-3"><ActionButton action={runDunning.bind(null, inv.id)} label="Mahnstufe setzen und benachrichtigen" pendingLabel="Sende …" tone="primary" confirm="Mahnstufe setzen und den Schüler benachrichtigen?" /></div>
              </Card>
            )}

            {(isOpen || inv.status === "paid") && (
              <Card title="Storno und Gutschrift">
                <ActionForm action={cancelInvoice} submitLabel="Rechnung stornieren" tone="danger" className="grid gap-2">
                  <input type="hidden" name="invoice_id" value={inv.id} />
                  <div><label htmlFor="cancel-reason" className={label}>Grund</label><input id="cancel-reason" name="reason" required className={field} /></div>
                  <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="credit_note" defaultChecked className="h-5 w-5" /> Gutschrift (Rechnungskorrektur) mit gespiegelten Positionen erzeugen</label>
                  <p className="text-xs text-ink-500">Die stornierte Rechnung bleibt unveränderlich bestehen (GoBD). Bereits gezahlte Beträge werden über eine Erstattung ausgeglichen.</p>
                </ActionForm>
              </Card>
            )}

            <Card title="SEPA-Mandat">
              {d.mandates.length === 0 ? <p className="text-sm text-ink-500">Kein Mandat für diesen Schüler.</p> : (
                <ul className="divide-y divide-ink-100 text-sm">
                  {d.mandates.map((m) => (
                    <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span>{m.provider === "stripe" ? "Stripe" : "Manuell"}{m.mandate_reference && <span className="block text-xs text-ink-500">Referenz {m.mandate_reference}</span>}{m.masked_iban && <span className="block text-xs text-ink-500">{m.masked_iban}</span>}</span>
                      <span className="flex items-center gap-2"><Pill tone={m.status === "active" ? "success" : m.status === "pending" ? "warn" : "neutral"}>{MANDATE_LABEL[m.status] ?? m.status}</Pill>{(m.status === "active" || m.status === "pending") && <ActionButton action={revokeMandate.bind(null, m.id, inv.id)} label="Widerrufen" tone="ghost" small confirm="Mandat widerrufen?" />}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3">
                {d.stripeConfigured ? (
                  <ActionButton action={createStripeMandate.bind(null, inv.student_id, inv.id)} label="SEPA-Mandat über Stripe anlegen" pendingLabel="Lege Mandat an …" tone="secondary" />
                ) : (
                  <Alert tone="info">Zahlungsanbieter nicht konfiguriert. Ein Papiermandat kann hier mit maskierter IBAN erfasst werden.</Alert>
                )}
              </div>
              <details className="mt-3 rounded-xl border border-ink-100 p-3">
                <summary className="cursor-pointer font-medium">Manuelles Mandat erfassen</summary>
                <div className="mt-3">
                  <ActionForm action={createManualMandate} submitLabel="Mandat speichern" className="grid gap-2" resetOnSuccess>
                    <input type="hidden" name="student_id" value={inv.student_id} /><input type="hidden" name="invoice_id" value={inv.id} />
                    <div><label htmlFor="m-iban" className={label}>IBAN maskiert</label><input id="m-iban" name="masked_iban" required placeholder="DE12 **** **** 1234" className={field} /></div>
                    <div><label htmlFor="m-ref" className={label}>Mandatsreferenz</label><input id="m-ref" name="mandate_reference" required className={field} /></div>
                    <div><label htmlFor="m-signed" className={label}>Unterschrieben am</label><input id="m-signed" name="signed_at" type="date" required defaultValue={berlinDate()} className={field} /></div>
                  </ActionForm>
                </div>
              </details>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
