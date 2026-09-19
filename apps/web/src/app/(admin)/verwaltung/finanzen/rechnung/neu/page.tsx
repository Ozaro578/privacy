import Link from "next/link";
import { getInvoiceDraftOptions } from "@/lib/data/admin-finance";
import { LESSON_KIND_LABEL } from "@/lib/data/admin";
import { createInvoiceDraft } from "@/lib/actions/admin-finance";
import { Alert, Card, btn, fmt, parseRange } from "@/components/ui";
import { ActionForm, field, label } from "@/components/admin/action-form";
import { PRICE_UNIT_LABEL } from "@/components/admin/price-item-fields";

export const metadata = { title: "Rechnung erstellen" };

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ schueler?: string; preisliste?: string }> }) {
  const sp = await searchParams;
  const d = await getInvoiceDraftOptions(sp.schueler);
  const selectedList = sp.preisliste ? d.priceLists.find((l) => l.id === sp.preisliste) : d.priceLists.find((l) => l.id === d.contractPriceListId) ?? d.priceLists[0];
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm"><Link href="/verwaltung/finanzen" className="text-brand-700 hover:underline">Finanzen</Link> / Rechnung erstellen</p>
        <h1 className="text-2xl font-semibold">Rechnung erstellen</h1>
        <p className="text-sm text-ink-700">Der Entwurf wird aus Preislistenpositionen und abgeschlossenen Fahrstunden zusammengestellt und kann vor dem Ausstellen bearbeitet werden.</p>
      </header>

      <Card title="Schüler und Preisliste">
        <form method="get" className="grid gap-3 md:grid-cols-3">
          <div><label htmlFor="schueler" className={label}>Schüler</label><select id="schueler" name="schueler" defaultValue={sp.schueler ?? ""} className={field}><option value="">Bitte wählen</option>{d.students.map((s) => <option key={s.id} value={s.id}>{s.last_name}, {s.first_name}{s.student_number ? ` (${s.student_number})` : ""}</option>)}</select></div>
          <div><label htmlFor="preisliste" className={label}>Preisliste</label><select id="preisliste" name="preisliste" defaultValue={selectedList?.id ?? ""} className={field}><option value="">Ohne Preisliste</option>{d.priceLists.map((l) => <option key={l.id} value={l.id}>{l.name}{l.license_code ? ` (${l.license_code})` : ""}</option>)}</select></div>
          <div className="flex items-end"><button type="submit" className={btn.secondary}>Übernehmen</button></div>
        </form>
        {d.priceLists.length === 0 && <p className="mt-2 text-sm text-ink-500">Noch keine gültige Preisliste vorhanden. <Link href="/verwaltung/finanzen/preise" className="text-brand-700 underline">Preisliste anlegen</Link></p>}
      </Card>

      {!d.student ? <Alert tone="info">Bitte zuerst einen Schüler wählen.</Alert> : (
        <ActionForm action={createInvoiceDraft} submitLabel="Entwurf anlegen" pendingLabel="Lege Entwurf an …" className="grid gap-6">
          <input type="hidden" name="student_id" value={d.student.id} />
          {selectedList && <input type="hidden" name="price_list_id" value={selectedList.id} />}

          <Card title={`Fahrstunden von ${d.student.first_name} ${d.student.last_name} (abgeschlossen, noch nicht abgerechnet)`}>
            {d.unbilledLessons.length === 0 ? <p className="text-sm text-ink-500">Keine offenen Fahrstunden.</p> : (
              <ul className="divide-y divide-ink-100 text-sm">
                {d.unbilledLessons.map((l) => {
                  const r = parseRange(l.period);
                  const priceItem = selectedList?.price_items.find((it) => it.lesson_kind === l.kind);
                  const estimate = priceItem ? (priceItem.unit === "unit45" ? priceItem.amount_cents * l.units : priceItem.amount_cents) : (l.price_cents ?? 0);
                  return (
                    <li key={l.id}>
                      <label className="flex min-h-11 flex-wrap items-center gap-3 py-1.5">
                        <input type="checkbox" name="lesson_ids" value={l.id} defaultChecked className="h-5 w-5" />
                        <span className="font-medium">{fmt.date(r.start)} {fmt.time(r.start)}</span>
                        <span>{LESSON_KIND_LABEL[l.kind] ?? l.kind}, {l.units} Einheit{l.units === 1 ? "" : "en"}{l.student_licenses ? `, Klasse ${l.student_licenses.license_code}` : ""}{l.instructors ? `, ${l.instructors.display_name}` : ""}</span>
                        <span className="ml-auto tabular-nums text-ink-700">{fmt.eur(estimate)} netto{priceItem ? "" : " (Slotpreis)"}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {selectedList && (
            <Card title={`Positionen aus „${selectedList.name}“`}>
              <p className="mb-2 text-sm text-ink-700">Menge eintragen, um eine Position aufzunehmen. Positionen mit Fahrstundenart werden für die gewählten Fahrstunden automatisch verwendet.</p>
              <ul className="divide-y divide-ink-100 text-sm">
                {selectedList.price_items.map((it) => (
                  <li key={it.id} className="flex flex-wrap items-center gap-3 py-1.5">
                    <label htmlFor={`qty-${it.id}`} className="min-w-52 flex-1">{it.name} <span className="text-ink-500">({PRICE_UNIT_LABEL[it.unit] ?? it.unit}, {fmt.eur(it.amount_cents)} netto)</span></label>
                    <input id={`qty-${it.id}`} name={`qty_${it.id}`} inputMode="decimal" placeholder="0" className={`${field} max-w-24`} />
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card title="Freie Position und Hinweis">
            <div className="grid gap-3 md:grid-cols-3">
              <div><label htmlFor="free_description" className={label}>Beschreibung</label><input id="free_description" name="free_description" className={field} /></div>
              <div><label htmlFor="free_quantity" className={label}>Menge</label><input id="free_quantity" name="free_quantity" inputMode="decimal" defaultValue="1" className={field} /></div>
              <div><label htmlFor="free_unit_net_eur" className={label}>Einzelpreis netto (EUR)</label><input id="free_unit_net_eur" name="free_unit_net_eur" inputMode="decimal" className={field} /></div>
              <div className="md:col-span-3"><label htmlFor="notes" className={label}>Hinweistext auf der Rechnung</label><textarea id="notes" name="notes" rows={2} className={field} /></div>
            </div>
          </Card>
        </ActionForm>
      )}
    </div>
  );
}
