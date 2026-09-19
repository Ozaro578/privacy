import Link from "next/link";
import { getFinanceOverview } from "@/lib/data/admin-finance";
import { INVOICE_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/data/admin";
import { runDunning } from "@/lib/actions/admin-finance";
import { Card, EmptyState, Pill, StatTile, btn, fmt } from "@/components/ui";
import { ActionButton } from "@/components/admin/action-button";

export const metadata = { title: "Finanzen" };

const FILTERS: Array<{ key: string; label: string }> = [
  { key: "", label: "Alle" },
  { key: "open", label: "Offen" },
  { key: "overdue", label: "Überfällig" },
  { key: "draft", label: "Entwürfe" },
  { key: "paid", label: "Bezahlt" },
];
const STATUS_TONE: Record<string, "neutral" | "brand" | "success" | "warn" | "danger"> = { draft: "neutral", issued: "brand", partially_paid: "warn", paid: "success", overdue: "danger", cancelled: "neutral", credited: "neutral" };
const MANDATE_LABEL: Record<string, string> = { pending: "Ausstehend", active: "Aktiv", revoked: "Widerrufen", failed: "Fehlgeschlagen" };
const PAYMENT_STATUS_LABEL: Record<string, string> = { pending: "Offen", succeeded: "Erfolgreich", failed: "Fehlgeschlagen", refunded: "Erstattet", chargeback: "Rücklastschrift" };

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string }> }) {
  const sp = await searchParams;
  const d = await getFinanceOverview({ ...(sp.filter ? { filter: sp.filter } : {}), ...(sp.q ? { q: sp.q } : {}) });
  const dunningLevelLabel = (level: number) => (level === 1 ? "Zahlungserinnerung" : `${level - 1}. Mahnung`);
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Finanzen</h1>
          <p className="text-sm text-ink-700">Rechnungen, Zahlungen, Mahnwesen und SEPA-Mandate</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/verwaltung/finanzen/preise" className={btn.secondary}>Preislisten</Link>
          <Link href="/verwaltung/finanzen/rechnung/neu" className={btn.primary}>Rechnung erstellen</Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Offene Forderungen" value={fmt.eur(d.openCents)} hint={`${d.openCount} Rechnungen`} href="/verwaltung/finanzen?filter=open" />
        <StatTile label="Davon überfällig" value={fmt.eur(d.overdueCents)} hint={`Stand ${fmt.date(d.today)}`} href="/verwaltung/finanzen?filter=overdue" />
        <StatTile label="Mahnungen fällig" value={d.dunningDue.length} hint={`${d.dunningWaiting.length} in Wartefrist`} />
      </div>

      <Card title="Mahnlauf" action={<ActionButton action={runDunning.bind(null, undefined)} label="Mahnlauf starten" pendingLabel="Mahnlauf läuft …" tone="primary" small confirm={`${d.dunningDue.length} Mahnung(en) setzen und die Schüler benachrichtigen?`} />}>
        <p className="mb-3 text-sm text-ink-700">Mahnstufen nach {d.settings.dunning_reminder_days.join(", ")} Tagen nach Fälligkeit, Gebühren {d.settings.dunning_fees_cents.map((c) => fmt.eur(c)).join(", ")}. Die Gebührenhöhe gegenüber Verbrauchern ist rechtlich zu prüfen.</p>
        {d.dunningDue.length === 0 ? <p className="text-sm text-ink-500">Derzeit ist keine Mahnstufe fällig.</p> : (
          <ul className="divide-y divide-ink-100 text-sm">
            {d.dunningDue.map(({ invoice, plan }) => (
              <li key={invoice.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span><Link href={`/verwaltung/finanzen/rechnung/${invoice.id}`} className="font-medium text-brand-700 hover:underline">{invoice.invoice_number}</Link> <span className="text-ink-700">{invoice.students ? `${invoice.students.first_name} ${invoice.students.last_name}` : ""}</span></span>
                <span className="text-ink-700">{plan.action === "send" ? `${dunningLevelLabel(plan.level)}, offen ${fmt.eur(plan.open_cents)}` : ""}{!invoice.students?.user_id && <span className="ml-2 text-xs text-warn-500">ohne Nutzerkonto</span>}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Rechnungen">
        <form className="mb-3 flex flex-wrap items-center gap-2" role="search">
          {FILTERS.map((f) => <Link key={f.key} href={f.key ? `/verwaltung/finanzen?filter=${f.key}` : "/verwaltung/finanzen"} className={`min-h-9 rounded-full px-3 py-1.5 text-sm ${(sp.filter ?? "") === f.key ? "bg-brand-50 font-semibold text-brand-700" : "text-ink-700 hover:bg-ink-100"}`}>{f.label}</Link>)}
          {sp.filter && <input type="hidden" name="filter" value={sp.filter} />}
          <label htmlFor="q" className="sr-only">Suche nach Nummer oder Name</label>
          <input id="q" name="q" defaultValue={sp.q ?? ""} placeholder="Nummer oder Name" className="min-h-9 rounded-xl border border-ink-300 px-3 text-sm" />
          <button type="submit" className={`${btn.secondary} min-h-9 px-3 text-sm`}>Suchen</button>
        </form>
        {d.rows.length === 0 ? <EmptyState title="Keine Rechnungen" text="Für diese Auswahl gibt es keine Rechnungen." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-ink-500"><tr><th className="p-2">Nummer</th><th className="p-2">Schüler</th><th className="p-2">Datum</th><th className="p-2">Fällig</th><th className="p-2 text-right">Brutto</th><th className="p-2 text-right">Offen</th><th className="p-2">Status</th><th className="p-2">Mahnstufe</th></tr></thead>
              <tbody className="divide-y divide-ink-100">
                {d.rows.map((i) => {
                  const open = i.gross_cents - i.paid_cents;
                  const overdue = ["issued", "partially_paid", "overdue"].includes(i.status) && i.due_at !== null && i.due_at < d.today;
                  return (
                    <tr key={i.id} className="hover:bg-ink-50">
                      <td className="p-2"><Link href={`/verwaltung/finanzen/rechnung/${i.id}`} className="font-medium text-brand-700 hover:underline">{i.invoice_number ?? "Entwurf"}</Link></td>
                      <td className="p-2">{i.students ? <Link href={`/verwaltung/schueler/${i.student_id}`} className="hover:underline">{i.students.first_name} {i.students.last_name}</Link> : ""}</td>
                      <td className="p-2">{i.issued_at ? fmt.date(i.issued_at) : fmt.date(i.created_at)}</td>
                      <td className={`p-2 ${overdue ? "text-danger-500" : ""}`}>{i.due_at ? fmt.date(i.due_at) : ""}</td>
                      <td className="p-2 text-right tabular-nums">{fmt.eur(i.gross_cents)}</td>
                      <td className="p-2 text-right tabular-nums">{["issued", "partially_paid", "overdue"].includes(i.status) ? fmt.eur(open) : ""}</td>
                      <td className="p-2"><Pill tone={overdue ? "danger" : (STATUS_TONE[i.status] ?? "neutral")}>{overdue && i.status !== "overdue" ? "Überfällig" : (INVOICE_STATUS_LABEL[i.status] ?? i.status)}</Pill></td>
                      <td className="p-2">{i.dunning_level > 0 ? `${dunningLevelLabel(i.dunning_level)} (${fmt.date(i.dunning_last_at)})` : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Letzte Zahlungen">
          {d.payments.length === 0 ? <p className="text-sm text-ink-500">Noch keine Zahlungen gebucht.</p> : (
            <ul className="divide-y divide-ink-100 text-sm">
              {d.payments.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>{p.students ? `${p.students.first_name} ${p.students.last_name}` : ""}{p.invoice_id && <> · <Link href={`/verwaltung/finanzen/rechnung/${p.invoice_id}`} className="text-brand-700 hover:underline">{p.invoices?.invoice_number ?? "Rechnung"}</Link></>}</span>
                  <span className="flex items-center gap-2"><span className={`tabular-nums ${p.amount_cents < 0 ? "text-danger-500" : ""}`}>{fmt.eur(p.amount_cents)}</span><span className="text-ink-500">{PAYMENT_METHOD_LABEL[p.method] ?? p.method}</span><Pill tone={p.status === "succeeded" ? "success" : p.status === "pending" ? "warn" : "danger"}>{PAYMENT_STATUS_LABEL[p.status] ?? p.status}</Pill><span className="text-xs text-ink-500">{fmt.date(p.paid_at)}</span></span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="SEPA-Mandate">
          {!d.stripeConfigured && <p className="mb-2 text-xs text-ink-500">Zahlungsanbieter nicht konfiguriert: Mandate werden manuell auf der Rechnungsseite erfasst.</p>}
          {d.mandates.length === 0 ? <p className="text-sm text-ink-500">Noch keine Mandate.</p> : (
            <ul className="divide-y divide-ink-100 text-sm">
              {d.mandates.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>{m.students ? `${m.students.first_name} ${m.students.last_name}` : ""} <span className="text-ink-500">({m.provider === "stripe" ? "Stripe" : "manuell"})</span></span>
                  <Pill tone={m.status === "active" ? "success" : m.status === "pending" ? "warn" : "neutral"}>{MANDATE_LABEL[m.status] ?? m.status}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
