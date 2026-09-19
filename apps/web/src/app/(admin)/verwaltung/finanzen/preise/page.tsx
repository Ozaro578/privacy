import Link from "next/link";
import { getPriceLists } from "@/lib/data/admin-finance";
import { berlinDate, LESSON_KIND_LABEL } from "@/lib/data/admin";
import { createPriceList, deletePriceItem, deletePriceList, savePriceItem, updatePriceList } from "@/lib/actions/admin-finance";
import { Alert, Card, EmptyState, Pill, fmt } from "@/components/ui";
import { ActionForm, field, label } from "@/components/admin/action-form";
import { ActionButton } from "@/components/admin/action-button";
import { PriceItemFields, PRICE_CODE_SUGGESTIONS, PRICE_UNIT_LABEL } from "@/components/admin/price-item-fields";

export const metadata = { title: "Preislisten" };

function PriceListFields({ list, licenses, idPrefix }: { list?: { name: string; license_code: string | null; valid_from: string; valid_until: string | null; vat_rate: number }; licenses: string[]; idPrefix: string }) {
  const id = (n: string) => `${idPrefix}-${n}`;
  return (
    <>
      <div><label htmlFor={id("name")} className={label}>Name</label><input id={id("name")} name="name" required defaultValue={list?.name ?? ""} className={field} /></div>
      <div><label htmlFor={id("license")} className={label}>Klasse</label><select id={id("license")} name="license_code" defaultValue={list?.license_code ?? ""} className={field}><option value="">Alle Klassen</option>{licenses.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
      <div><label htmlFor={id("from")} className={label}>Gültig ab</label><input id={id("from")} name="valid_from" type="date" required defaultValue={list?.valid_from ?? berlinDate()} className={field} /></div>
      <div><label htmlFor={id("until")} className={label}>Gültig bis</label><input id={id("until")} name="valid_until" type="date" defaultValue={list?.valid_until ?? ""} className={field} /></div>
      <div><label htmlFor={id("vat")} className={label}>Umsatzsteuer (%)</label><input id={id("vat")} name="vat_rate" inputMode="decimal" required defaultValue={list ? String(list.vat_rate).replace(".", ",") : "19"} className={field} /></div>
    </>
  );
}

export default async function PriceListsPage() {
  const d = await getPriceLists();
  const isAdmin = d.ctx.isAdmin;
  const today = berlinDate();
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm"><Link href="/verwaltung/finanzen" className="text-brand-700 hover:underline">Finanzen</Link> / Preislisten</p>
        <h1 className="text-2xl font-semibold">Preislisten</h1>
        <p className="text-sm text-ink-700">Positionen mit Code, Bezeichnung, Einheit und Nettobetrag. Positionen mit Fahrstundenart werden beim Abrechnen von Fahrstunden automatisch vorgeschlagen.</p>
      </header>
      {!isAdmin && <Alert tone="info">Preislisten bearbeitet nur die Rolle Admin oder Inhaber. Du siehst die Listen zur Information.</Alert>}
      <datalist id="price-codes">{PRICE_CODE_SUGGESTIONS.map((c) => <option key={c} value={c} />)}</datalist>

      {d.lists.length === 0 ? <EmptyState title="Noch keine Preisliste" text="Lege die erste Preisliste mit Grundgebühr, Fahrstundenpreisen und Prüfungsgebühren an." /> : d.lists.map((l) => {
        const active = l.valid_from <= today && (!l.valid_until || l.valid_until >= today);
        return (
          <Card key={l.id} title={l.name} action={<div className="flex items-center gap-2"><Pill tone={active ? "success" : "neutral"}>{active ? "Gültig" : l.valid_from > today ? "Künftig" : "Abgelaufen"}</Pill>{isAdmin && <ActionButton action={deletePriceList.bind(null, l.id)} label="Löschen" tone="ghost" small confirm={`Preisliste „${l.name}“ mit allen Positionen löschen?`} />}</div>}>
            <p className="mb-3 text-sm text-ink-700">{l.license_code ? `Klasse ${l.license_code}` : "Alle Klassen"}, gültig ab {fmt.date(l.valid_from)}{l.valid_until ? ` bis ${fmt.date(l.valid_until)}` : ""}, USt {String(l.vat_rate).replace(".", ",")} %</p>
            {l.price_items.length === 0 ? <p className="text-sm text-ink-500">Noch keine Positionen.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-ink-500"><tr><th className="p-2">Code</th><th className="p-2">Bezeichnung</th><th className="p-2">Einheit</th><th className="p-2 text-right">Netto</th><th className="p-2">Fahrstundenart</th>{isAdmin && <th className="p-2"></th>}</tr></thead>
                  <tbody className="divide-y divide-ink-100">
                    {l.price_items.map((it) => (
                      <tr key={it.id}>
                        <td className="p-2 font-mono text-xs">{it.code}</td>
                        <td className="p-2">{it.name}</td>
                        <td className="p-2">{PRICE_UNIT_LABEL[it.unit] ?? it.unit}</td>
                        <td className="p-2 text-right tabular-nums">{fmt.eur(it.amount_cents)}</td>
                        <td className="p-2">{it.lesson_kind ? (LESSON_KIND_LABEL[it.lesson_kind] ?? it.lesson_kind) : ""}</td>
                        {isAdmin && (
                          <td className="p-2">
                            <details>
                              <summary className="cursor-pointer text-brand-700">Bearbeiten</summary>
                              <div className="mt-2 rounded-xl bg-ink-50 p-3">
                                <ActionForm action={savePriceItem} submitLabel="Speichern" className="grid gap-2 md:grid-cols-2">
                                  <PriceItemFields item={it} listId={l.id} idPrefix={`pi-${it.id}`} />
                                </ActionForm>
                                <div className="mt-2"><ActionButton action={deletePriceItem.bind(null, it.id)} label="Position löschen" tone="ghost" small confirm={`Position ${it.code} löschen?`} /></div>
                              </div>
                            </details>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {isAdmin && (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <details className="rounded-xl border border-ink-100 p-3">
                  <summary className="cursor-pointer font-medium">Position hinzufügen</summary>
                  <div className="mt-3">
                    <ActionForm action={savePriceItem} submitLabel="Position speichern" className="grid gap-2 md:grid-cols-2" resetOnSuccess>
                      <PriceItemFields listId={l.id} idPrefix={`new-${l.id}`} />
                    </ActionForm>
                  </div>
                </details>
                <details className="rounded-xl border border-ink-100 p-3">
                  <summary className="cursor-pointer font-medium">Preisliste bearbeiten</summary>
                  <div className="mt-3">
                    <ActionForm action={updatePriceList} submitLabel="Preisliste speichern" tone="secondary" className="grid gap-2 md:grid-cols-2">
                      <input type="hidden" name="id" value={l.id} />
                      <PriceListFields list={l} licenses={d.licenses} idPrefix={`pl-${l.id}`} />
                    </ActionForm>
                  </div>
                </details>
              </div>
            )}
          </Card>
        );
      })}

      {isAdmin && (
        <Card title="Neue Preisliste">
          <ActionForm action={createPriceList} submitLabel="Preisliste anlegen" className="grid gap-3 md:grid-cols-2" resetOnSuccess>
            <PriceListFields licenses={d.licenses} idPrefix="new-list" />
          </ActionForm>
        </Card>
      )}
    </div>
  );
}
