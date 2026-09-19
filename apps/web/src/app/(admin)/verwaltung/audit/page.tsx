import Link from "next/link";
import { AUDIT_TABLES, auditTableLabel, getAuditLog } from "@/lib/data/admin-audit";
import { Card, Pill, btn, fmt } from "@/components/ui";

export const metadata = { title: "Änderungsprotokoll" };

const ACTION_LABEL = { insert: "angelegt", update: "geändert", delete: "gelöscht" } as const;
const ACTION_TONE = { insert: "success", update: "brand", delete: "danger" } as const;

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const days = [1, 7, 30, 90].includes(Number(sp.tage)) ? Number(sp.tage) : 7;
  const page = Math.max(1, Number(sp.seite ?? 1) || 1);
  const table = sp.tabelle && AUDIT_TABLES.includes(sp.tabelle) ? sp.tabelle : undefined;
  const action = sp.aktion;
  const d = await getAuditLog({ table, action, days, page });
  const link = (patch: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const merged = { tage: days, tabelle: table, aktion: action, seite: 1, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "" && !(k === "seite" && v === 1)) p.set(k, String(v));
    const s = p.toString();
    return `/verwaltung/audit${s ? `?${s}` : ""}`;
  };
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Änderungsprotokoll</h1>
        <p className="text-sm text-ink-700">Wer hat wann was geändert. Es werden nur Metadaten und Statuswerte angezeigt, keine Inhalte mit Personenbezug. Einträge sind unveränderlich.</p>
      </header>
      <Card title="Filter">
        <form className="grid gap-3 md:grid-cols-4" action="/verwaltung/audit" method="get">
          <label className="text-sm">Zeitraum<select name="tage" defaultValue={String(days)} className="mt-1 w-full rounded-xl border border-ink-300 px-3 py-2"><option value="1">Heute</option><option value="7">7 Tage</option><option value="30">30 Tage</option><option value="90">90 Tage</option></select></label>
          <label className="text-sm">Bereich<select name="tabelle" defaultValue={table ?? ""} className="mt-1 w-full rounded-xl border border-ink-300 px-3 py-2"><option value="">Alle</option>{AUDIT_TABLES.map((t) => <option key={t} value={t}>{auditTableLabel(t)}</option>)}</select></label>
          <label className="text-sm">Aktion<select name="aktion" defaultValue={action ?? ""} className="mt-1 w-full rounded-xl border border-ink-300 px-3 py-2"><option value="">Alle</option><option value="insert">angelegt</option><option value="update">geändert</option><option value="delete">gelöscht</option></select></label>
          <div className="flex items-end"><button type="submit" className={btn.primary}>Anwenden</button></div>
        </form>
      </Card>
      <Card title={`${d.total} Einträge`}>
        {d.entries.length === 0 ? <p className="text-sm text-ink-500">Keine Einträge im gewählten Zeitraum.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-ink-500"><th className="py-2 pr-3">Zeit</th><th className="py-2 pr-3">Wer</th><th className="py-2 pr-3">Aktion</th><th className="py-2 pr-3">Bereich</th><th className="py-2 pr-3">Details</th></tr></thead>
              <tbody className="divide-y divide-ink-100">
                {d.entries.map((e) => (
                  <tr key={e.id} className="align-top">
                    <td className="whitespace-nowrap py-2 pr-3 tabular-nums">{fmt.date(e.created_at)} {fmt.time(e.created_at)}</td>
                    <td className="py-2 pr-3">{e.actor}{e.actor_role ? <span className="text-ink-500"> ({e.actor_role})</span> : null}</td>
                    <td className="py-2 pr-3"><Pill tone={ACTION_TONE[e.action]}>{ACTION_LABEL[e.action]}</Pill></td>
                    <td className="py-2 pr-3">{auditTableLabel(e.entity_table)}{e.entity_id ? <span className="block text-xs text-ink-500">{e.entity_id.slice(0, 8)}</span> : null}</td>
                    <td className="py-2 pr-3 text-ink-700">{e.summary || "keine weiteren Angaben"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {d.pages > 1 && (
          <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Seiten">
            {d.page > 1 ? <Link href={link({ seite: d.page - 1 })} className={btn.secondary}>Zurück</Link> : <span />}
            <span>Seite {d.page} von {d.pages}</span>
            {d.page < d.pages ? <Link href={link({ seite: d.page + 1 })} className={btn.secondary}>Weiter</Link> : <span />}
          </nav>
        )}
      </Card>
    </div>
  );
}
