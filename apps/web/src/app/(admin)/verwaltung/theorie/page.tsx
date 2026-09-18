import Link from "next/link";
import { listTheoryClasses } from "@/lib/data/admin-theory";
import { createTheoryClass } from "@/lib/actions/admin-theory";
import { Card, EmptyState, Pill, btn, fmt, parseRange } from "@/components/ui";
import { ActionForm } from "@/components/admin/action-form";
import { TheoryClassFields } from "@/components/admin/theory-class-fields";

export const metadata = { title: "Theorieunterricht" };
const STATUS: Record<string, string> = { planned: "Geplant", running: "Läuft", completed: "Abgeschlossen", cancelled: "Abgesagt" };

export default async function TheoryPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const scope = sp["bereich"] === "past" ? "past" : "upcoming";
  const licenseCode = sp["klasse"] ?? "B";
  const d = await listTheoryClasses(licenseCode, scope);
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">Theorieunterricht</h1><p className="text-sm text-ink-700">{d.rule ? `Regelversion ${d.rule.version.version} (${d.rule.rules.basic_units} Grundstoff, ${d.rule.rules.class_specific_units} Zusatzstoff, ${d.unitMinutes} Minuten je Einheit)${d.rule.needsVerification ? ", fachlich zu verifizieren" : ""}` : "Keine Regelversion für Theorieunterricht gefunden."}</p></div>
        <div className="flex gap-2"><Link href={`/verwaltung/theorie?klasse=${licenseCode}`} className={scope === "upcoming" ? btn.primary : btn.ghost}>Kommende</Link><Link href={`/verwaltung/theorie?klasse=${licenseCode}&bereich=past`} className={scope === "past" ? btn.primary : btn.ghost}>Vergangene</Link></div>
      </header>
      {d.classes.length === 0 ? <EmptyState title={scope === "upcoming" ? "Kein Unterricht geplant" : "Keine vergangenen Termine"} text="Lege unten einen Termin oder eine Serie an." /> : (
        <div className="overflow-x-auto rounded-card bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink-500"><tr><th className="p-3">Termin</th><th className="p-3">Einheit</th><th className="p-3">Fahrlehrer</th><th className="p-3">Ort</th><th className="p-3">Teilnehmer</th><th className="p-3">Status</th></tr></thead>
            <tbody className="divide-y divide-ink-100">
              {d.classes.map((c) => { const r = parseRange(c.period); return (
                <tr key={c.id} className="hover:bg-ink-50">
                  <td className="p-3 tabular-nums"><Link href={`/verwaltung/theorie/${c.id}`} className="font-medium text-brand-700 hover:underline">{fmt.date(r.start)} {fmt.time(r.start)}</Link></td>
                  <td className="p-3">{c.lesson_unit_code} {c.title}<span className="block text-xs text-ink-500">{c.license_codes.join(", ")}, {c.material_kind === "basic" ? "Grundstoff" : "Zusatzstoff"}</span></td>
                  <td className="p-3">{c.instructors?.display_name ?? "offen"}</td>
                  <td className="p-3">{c.is_online ? "Online" : (c.locations?.name ?? "")}</td>
                  <td className="p-3">{c.attendance[0]?.count ?? 0}{c.capacity ? ` / ${c.capacity}` : ""}</td>
                  <td className="p-3"><Pill tone={c.status === "completed" ? "success" : c.status === "cancelled" ? "danger" : c.status === "running" ? "warn" : "neutral"}>{STATUS[c.status] ?? c.status}</Pill></td>
                </tr>
              ); })}
            </tbody>
          </table>
        </div>
      )}
      <Card title="Unterricht anlegen">
        <form method="get" className="mb-3 flex items-end gap-2 text-sm"><input type="hidden" name="bereich" value={scope} /><label>Einheiten für Klasse <select name="klasse" defaultValue={licenseCode} className="ml-1 rounded-lg border border-ink-300 px-2 py-1">{d.licenses.map((l) => <option key={l} value={l}>{l}</option>)}</select></label><button className={`${btn.ghost} min-h-9 px-3 text-sm`}>Einheiten laden</button></form>
        <ActionForm action={createTheoryClass} submitLabel="Unterricht anlegen" className="grid gap-3 md:grid-cols-2" resetOnSuccess>
          <TheoryClassFields units={d.units} licenses={d.licenses} licenseCode={licenseCode} instructors={d.instructors} locations={d.locations} unitMinutes={d.unitMinutes} withRepeat />
        </ActionForm>
      </Card>
    </div>
  );
}
