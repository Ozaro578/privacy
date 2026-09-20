import type { Tables } from "@fahrpilot/db";
import { getSettings, ROLE_MATRIX } from "@/lib/data/admin-settings";
import { berlinDate } from "@/lib/data/admin";
import { deleteCancellationPolicy, deleteLocation, grantSupportAccess, revokeSupportAccess, saveCancellationPolicy, saveLocation, updateBillingSettings, updateSchool } from "@/lib/actions/admin-settings";
import { Card, Pill, fmt } from "@/components/ui";
import { ActionForm, field, label } from "@/components/admin/action-form";
import { ActionButton } from "@/components/admin/action-button";

export const metadata = { title: "Einstellungen" };

function LocationFields({ l, idPrefix }: { l?: Tables<"locations">; idPrefix: string }) {
  const id = (n: string) => `${idPrefix}-${n}`;
  return (
    <>
      {l && <input type="hidden" name="id" value={l.id} />}
      <div><label htmlFor={id("name")} className={label}>Name</label><input id={id("name")} name="name" required defaultValue={l?.name ?? ""} className={field} /></div>
      <div><label htmlFor={id("addr")} className={label}>Straße und Hausnummer</label><input id={id("addr")} name="address_line1" defaultValue={l?.address_line1 ?? ""} className={field} /></div>
      <div><label htmlFor={id("plz")} className={label}>PLZ</label><input id={id("plz")} name="postal_code" defaultValue={l?.postal_code ?? ""} className={field} /></div>
      <div><label htmlFor={id("city")} className={label}>Ort</label><input id={id("city")} name="city" defaultValue={l?.city ?? ""} className={field} /></div>
      <div><label htmlFor={id("phone")} className={label}>Telefon</label><input id={id("phone")} name="phone" defaultValue={l?.phone ?? ""} className={field} /></div>
      <div><label htmlFor={id("email")} className={label}>E-Mail</label><input id={id("email")} name="email" type="email" defaultValue={l?.email ?? ""} className={field} /></div>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="is_primary" defaultChecked={l?.is_primary ?? false} className="h-5 w-5" /> Hauptstandort</label>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={l?.active ?? true} className="h-5 w-5" /> Aktiv</label>
    </>
  );
}

function PolicyFields({ p, idPrefix }: { p?: Tables<"cancellation_policies">; idPrefix: string }) {
  const id = (n: string) => `${idPrefix}-${n}`;
  const pct = (v: number | null) => (v === null ? "" : String(v).replace(".", ","));
  return (
    <>
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="md:col-span-2"><label htmlFor={id("name")} className={label}>Name</label><input id={id("name")} name="name" required defaultValue={p?.name ?? ""} className={field} /></div>
      <div><label htmlFor={id("hours")} className={label}>Kostenfreie Stornierung bis (Stunden vorher)</label><input id={id("hours")} name="free_cancellation_hours" type="number" min={0} required defaultValue={p?.free_cancellation_hours ?? 24} className={field} /></div>
      <div><label htmlFor={id("late")} className={label}>Gebühr bei später Absage (% des Stundenpreises)</label><input id={id("late")} name="late_fee_percent" inputMode="decimal" defaultValue={pct(p?.late_fee_percent ?? null)} className={field} /></div>
      <div><label htmlFor={id("fixed")} className={label}>Feste Gebühr bei später Absage (EUR)</label><input id={id("fixed")} name="late_fee_fixed_eur" inputMode="decimal" defaultValue={p?.late_fee_fixed_cents !== null && p?.late_fee_fixed_cents !== undefined ? (p.late_fee_fixed_cents / 100).toFixed(2).replace(".", ",") : ""} className={field} /></div>
      <div><label htmlFor={id("noshow")} className={label}>Gebühr bei Nichterscheinen (%)</label><input id={id("noshow")} name="no_show_fee_percent" inputMode="decimal" defaultValue={pct(p?.no_show_fee_percent ?? null)} className={field} /></div>
      <div><label htmlFor={id("clause")} className={label}>Vertragsklausel (Referenz)</label><input id={id("clause")} name="contract_clause_reference" defaultValue={p?.contract_clause_reference ?? ""} className={field} /></div>
      <div><label htmlFor={id("from")} className={label}>Gültig ab</label><input id={id("from")} name="valid_from" type="date" required defaultValue={p?.valid_from ?? berlinDate()} className={field} /></div>
      <div><label htmlFor={id("until")} className={label}>Gültig bis</label><input id={id("until")} name="valid_until" type="date" defaultValue={p?.valid_until ?? ""} className={field} /></div>
    </>
  );
}

export default async function SettingsPage() {
  const d = await getSettings();
  const s = d.ctx.school;
  const today = berlinDate();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Einstellungen</h1>
        <p className="text-sm text-ink-700">Stammdaten, Standorte, Stornierungsregeln, Anmeldelink und Rollen. Nur Admin und Inhaber.</p>
      </header>

      <Card title="Stammdaten der Fahrschule">
        <ActionForm action={updateSchool} submitLabel="Stammdaten speichern" className="grid gap-3 md:grid-cols-2">
          <div><label htmlFor="name" className={label}>Name</label><input id="name" name="name" required defaultValue={s.name} className={field} /></div>
          <div><label htmlFor="legal_name" className={label}>Rechtlicher Name (Rechnungsaussteller)</label><input id="legal_name" name="legal_name" defaultValue={s.legal_name ?? ""} className={field} /></div>
          <div><label htmlFor="tax_id" className={label}>Steuernummer</label><input id="tax_id" name="tax_id" defaultValue={s.tax_id ?? ""} className={field} /></div>
          <div><label htmlFor="vat_id" className={label}>USt-IdNr.</label><input id="vat_id" name="vat_id" defaultValue={s.vat_id ?? ""} className={field} /></div>
          <div><label htmlFor="email" className={label}>E-Mail</label><input id="email" name="email" type="email" defaultValue={s.email ?? ""} className={field} /></div>
          <div><label htmlFor="phone" className={label}>Telefon</label><input id="phone" name="phone" defaultValue={s.phone ?? ""} className={field} /></div>
          <div><label htmlFor="website" className={label}>Webseite</label><input id="website" name="website" type="url" defaultValue={s.website ?? ""} className={field} /></div>
          <div><label htmlFor="address_line1" className={label}>Straße und Hausnummer</label><input id="address_line1" name="address_line1" defaultValue={s.address_line1 ?? ""} className={field} /></div>
          <div><label htmlFor="address_line2" className={label}>Adresszusatz</label><input id="address_line2" name="address_line2" defaultValue={s.address_line2 ?? ""} className={field} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label htmlFor="postal_code" className={label}>PLZ</label><input id="postal_code" name="postal_code" defaultValue={s.postal_code ?? ""} className={field} /></div>
            <div className="col-span-2"><label htmlFor="city" className={label}>Ort</label><input id="city" name="city" defaultValue={s.city ?? ""} className={field} /></div>
          </div>
          <div><label htmlFor="invoice_number_prefix" className={label}>Rechnungsnummern-Präfix</label><input id="invoice_number_prefix" name="invoice_number_prefix" required defaultValue={s.invoice_number_prefix} className={field} /><p className="mt-1 text-xs text-ink-500">Format {s.invoice_number_prefix}-{today.slice(0, 4)}-00001, fortlaufend je Jahr.</p></div>
          <div><label htmlFor="default_locale" className={label}>Standardsprache</label><select id="default_locale" name="default_locale" defaultValue={s.default_locale} className={field}><option value="de">Deutsch</option><option value="en">Englisch</option><option value="tr">Türkisch</option><option value="ar">Arabisch</option></select></div>
          <label className="flex min-h-11 items-center gap-2 text-sm md:col-span-2"><input type="checkbox" name="auto_confirm_bookings" defaultChecked={d.settings.auto_confirm_bookings} className="h-5 w-5" /> Buchungen von Schülern automatisch bestätigen (sonst bestätigt das Büro jede Anfrage)</label>
        </ActionForm>
      </Card>

      <Card title="Rechnungen und Mahnwesen">
        <ActionForm action={updateBillingSettings} submitLabel="Rechnungseinstellungen speichern" className="grid gap-3 md:grid-cols-2">
          <div><label htmlFor="invoice_due_days" className={label}>Zahlungsziel (Tage)</label><input id="invoice_due_days" name="invoice_due_days" type="number" min={0} max={120} defaultValue={d.settings.invoice_due_days} className={field} /></div>
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="small_business" defaultChecked={d.settings.small_business} className="h-5 w-5" /> Kleinunternehmerregelung nach § 19 UStG (keine Umsatzsteuer ausweisen)</label>
          <div><label htmlFor="bank_account_holder" className={label}>Kontoinhaber</label><input id="bank_account_holder" name="bank_account_holder" defaultValue={d.settings.bank_account_holder} className={field} /></div>
          <div><label htmlFor="bank_iban" className={label}>IBAN</label><input id="bank_iban" name="bank_iban" defaultValue={d.settings.bank_iban} className={field} /></div>
          <div><label htmlFor="bank_bic" className={label}>BIC</label><input id="bank_bic" name="bank_bic" defaultValue={d.settings.bank_bic} className={field} /></div>
          <div><label htmlFor="sepa_creditor_id" className={label}>SEPA-Gläubiger-ID</label><input id="sepa_creditor_id" name="sepa_creditor_id" defaultValue={d.settings.sepa_creditor_id} className={field} /></div>
          <div><label htmlFor="dunning_reminder_days" className={label}>Mahnstufen (Tage nach Fälligkeit, durch Komma)</label><input id="dunning_reminder_days" name="dunning_reminder_days" defaultValue={d.settings.dunning_reminder_days.join(", ")} className={field} /></div>
          <div><label htmlFor="dunning_fees_eur" className={label}>Mahngebühren je Stufe (EUR, durch Komma)</label><input id="dunning_fees_eur" name="dunning_fees_eur" defaultValue={d.settings.dunning_fees_cents.map((c) => (c / 100).toFixed(2).replace(".", ",")).join(", ")} className={field} /><p className="mt-1 text-xs text-ink-500">Zulässigkeit und Höhe gegenüber Verbrauchern sind rechtlich zu prüfen.</p></div>
        </ActionForm>
      </Card>

      <Card title="Anmeldelink und QR-Code">
        <div className="flex flex-wrap items-start gap-6">
          <div className="rounded-xl border border-ink-100 bg-surface p-2" role="img" aria-label={`QR-Code für den Anmeldelink ${d.registrationUrl}`} dangerouslySetInnerHTML={{ __html: d.qrSvg }} />
          <div className="min-w-0 flex-1 text-sm">
            <p className="text-ink-700">Schüler melden sich über diesen Link digital an. Der QR-Code eignet sich für Aushang, Flyer und Webseite.</p>
            <p className="mt-2 break-all font-mono text-xs"><a href={d.registrationUrl} target="_blank" rel="noreferrer" className="text-brand-700 underline">{d.registrationUrl}</a></p>
            <p className="mt-2 text-xs text-ink-500">Slug der Fahrschule: {s.slug}. Aktive Mitglieder: {d.memberCount}.</p>
            <a href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(d.qrSvg)}`} download={`anmeldung-${s.slug}.svg`} className="mt-3 inline-flex min-h-11 items-center rounded-full border border-ink-300 px-4 font-medium hover:border-brand-500">QR-Code als SVG speichern</a>
          </div>
        </div>
      </Card>

      <Card title="Standorte">
        {d.locations.length === 0 ? <p className="text-sm text-ink-500">Noch kein Standort angelegt.</p> : (
          <ul className="divide-y divide-ink-100 text-sm">
            {d.locations.map((l) => (
              <li key={l.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{l.name}</span>
                  {l.is_primary && <Pill tone="brand">Hauptstandort</Pill>}
                  <Pill tone={l.active ? "success" : "neutral"}>{l.active ? "Aktiv" : "Inaktiv"}</Pill>
                  <span className="text-ink-500">{[l.address_line1, [l.postal_code, l.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}</span>
                  <ActionButton action={deleteLocation.bind(null, l.id)} label="Löschen" tone="ghost" small confirm={`Standort „${l.name}“ löschen?`} />
                </div>
                <details className="mt-1"><summary className="cursor-pointer text-brand-700">Bearbeiten</summary>
                  <div className="mt-2 rounded-xl bg-ink-50 p-3"><ActionForm action={saveLocation} submitLabel="Standort speichern" className="grid gap-2 md:grid-cols-2"><LocationFields l={l} idPrefix={`loc-${l.id}`} /></ActionForm></div>
                </details>
              </li>
            ))}
          </ul>
        )}
        <details className="mt-4 rounded-xl border border-ink-100 p-3"><summary className="cursor-pointer font-medium">Standort anlegen</summary>
          <div className="mt-3"><ActionForm action={saveLocation} submitLabel="Standort anlegen" className="grid gap-2 md:grid-cols-2" resetOnSuccess><LocationFields idPrefix="loc-new" /></ActionForm></div>
        </details>
      </Card>

      <Card title="Stornierungsregeln">
        <p className="mb-3 text-sm text-ink-700">Regeln werden Verträgen zugeordnet und beim Stornieren einer Fahrstunde angewendet (Frist, Gebühr, Nichterscheinen). Änderungen wirken nur über neue Regeln mit eigenem Gültigkeitsbeginn, bestehende Verträge behalten ihre Regel.</p>
        {d.policies.length === 0 ? <p className="text-sm text-ink-500">Noch keine Stornierungsregel.</p> : (
          <ul className="divide-y divide-ink-100 text-sm">
            {d.policies.map((p) => {
              const active = p.valid_from <= today && (!p.valid_until || p.valid_until >= today);
              return (
                <li key={p.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{p.name}</span>
                    <Pill tone={active ? "success" : "neutral"}>{active ? "Gültig" : p.valid_from > today ? "Künftig" : "Abgelaufen"}</Pill>
                    <span className="text-ink-500">kostenfrei bis {p.free_cancellation_hours} h vorher{p.late_fee_percent !== null ? `, danach ${String(p.late_fee_percent).replace(".", ",")} %` : ""}{p.late_fee_fixed_cents !== null ? `, fest ${fmt.eur(p.late_fee_fixed_cents)}` : ""}{p.no_show_fee_percent !== null ? `, Nichterscheinen ${String(p.no_show_fee_percent).replace(".", ",")} %` : ""}, ab {fmt.date(p.valid_from)}{p.valid_until ? ` bis ${fmt.date(p.valid_until)}` : ""}</span>
                    {p.contract_clause_reference && <span className="text-xs text-ink-500">Klausel {p.contract_clause_reference}</span>}
                    <ActionButton action={deleteCancellationPolicy.bind(null, p.id)} label="Löschen" tone="ghost" small confirm={`Regel „${p.name}“ löschen?`} />
                  </div>
                  <details className="mt-1"><summary className="cursor-pointer text-brand-700">Bearbeiten</summary>
                    <div className="mt-2 rounded-xl bg-ink-50 p-3"><ActionForm action={saveCancellationPolicy} submitLabel="Regel speichern" className="grid gap-2 md:grid-cols-2"><PolicyFields p={p} idPrefix={`pol-${p.id}`} /></ActionForm></div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
        <details className="mt-4 rounded-xl border border-ink-100 p-3"><summary className="cursor-pointer font-medium">Stornierungsregel anlegen</summary>
          <div className="mt-3"><ActionForm action={saveCancellationPolicy} submitLabel="Regel anlegen" className="grid gap-2 md:grid-cols-2" resetOnSuccess><PolicyFields idPrefix="pol-new" /></ActionForm></div>
        </details>
      </Card>

      <Card title="Inhaltslizenzen">
        <p className="mb-3 text-sm text-ink-700">Eigene Übungsfragen sind immer verfügbar. Fragen aus einem lizenzierten amtlichen Katalog sehen Ihre Schüler nur, solange eine Lizenz für Ihre Fahrschule gültig ist. Lizenzen vergibt die Plattform nach Vertragsabschluss mit dem Lizenzgeber.</p>
        {d.contentLicenses.length === 0 ? <p className="text-sm text-ink-500">Keine Lizenz hinterlegt. Ihre Schüler lernen mit eigenen Übungsfragen (kein amtlicher Prüfungsinhalt).</p> : (
          <ul className="divide-y divide-ink-100 text-sm">
            {d.contentLicenses.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span><Pill tone={l.active ? "success" : "neutral"}>{l.active ? "gültig" : l.valid_from > new Date().toISOString().slice(0, 10) ? "ab " + fmt.date(l.valid_from) : "abgelaufen"}</Pill> <span className="ml-2">{l.licensor}</span><span className="block text-xs text-ink-500">Lizenz {l.license_id}{l.contract_reference ? ` · Vertrag ${l.contract_reference}` : ""} · gültig {fmt.date(l.valid_from)} bis {l.valid_until ? fmt.date(l.valid_until) : "unbefristet"}{l.seats ? ` · bis ${l.seats} Schüler` : ""}</span></span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Support-Zugriff der Plattform">
        <p className="mb-3 text-sm text-ink-700">Der Plattform-Support kann Ihre Daten nur einsehen, wenn Sie es hier ausdrücklich und befristet freigeben. Jede Freigabe und jede Support-Sitzung steht im Änderungsprotokoll. Sie können jederzeit widerrufen.</p>
        {d.supportGrants.length === 0 ? <p className="text-sm text-ink-500">Keine Freigaben.</p> : (
          <ul className="mb-4 divide-y divide-ink-100 text-sm">
            {d.supportGrants.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span><Pill tone={g.active ? "success" : "neutral"}>{g.active ? "aktiv" : g.revoked_at ? "widerrufen" : "abgelaufen"}</Pill> <span className="ml-2">{g.reason}</span><span className="block text-xs text-ink-500">erteilt {fmt.date(g.created_at)} {fmt.time(g.created_at)}, gültig bis {fmt.date(g.expires_at)} {fmt.time(g.expires_at)}</span></span>
                {g.active && <ActionButton action={revokeSupportAccess.bind(null, g.id)} label="Widerrufen" tone="danger" small confirm="Support-Zugriff jetzt widerrufen? Laufende Support-Sitzungen werden beendet." />}
              </li>
            ))}
          </ul>
        )}
        <ActionForm action={grantSupportAccess} submitLabel="Support-Zugriff erteilen" className="grid gap-3 md:grid-cols-3" resetOnSuccess>
          <div className="md:col-span-2"><label htmlFor="sg-reason" className={label}>Grund (Ticket, Anliegen)</label><input id="sg-reason" name="reason" required minLength={5} className={field} placeholder="z. B. Rechnung 2026-0042 wird nicht erzeugt" /></div>
          <div><label htmlFor="sg-hours" className={label}>Dauer</label><select id="sg-hours" name="hours" defaultValue="24" className={field}><option value="4">4 Stunden</option><option value="24">24 Stunden</option><option value="72">3 Tage</option><option value="168">7 Tage</option></select></div>
        </ActionForm>
      </Card>

      <Card title="Rollen und Rechte">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink-500"><tr><th className="p-2">Rolle</th><th className="p-2">Reichweite</th><th className="p-2">Rechte</th></tr></thead>
            <tbody className="divide-y divide-ink-100">
              {ROLE_MATRIX.map((r) => (
                <tr key={r.role} className="align-top">
                  <td className="p-2"><span className="font-medium">{r.label}</span><span className="block font-mono text-xs text-ink-500">{r.role}</span></td>
                  <td className="p-2">{r.scope}</td>
                  <td className="p-2"><ul className="list-disc pl-4">{r.rights.map((x) => <li key={x}>{x}</li>)}</ul></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ink-500">Rollen werden je Mitglied unter Team vergeben. Die Navigation wird serverseitig aus der Rolle im Zugriffstoken abgeleitet.</p>
      </Card>
    </div>
  );
}
