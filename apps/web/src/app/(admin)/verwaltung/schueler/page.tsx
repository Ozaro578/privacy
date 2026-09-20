import Link from "next/link";
import { listStudents } from "@/lib/data/admin-students";
import { EXAM_STATUS_LABEL, LICENSE_STATUS_LABEL } from "@/lib/data/admin";
import { Card, EmptyState, Pill, btn, fmt } from "@/components/ui";
import { field, label } from "@/components/admin/action-form";
import { DataRequestForm } from "@/components/admin/students/data-request-form";

export const metadata = { title: "Schüler" };

const STATUS_TONE: Record<string, "neutral" | "brand" | "success" | "warn" | "danger"> = { lead: "neutral", registered: "warn", active: "brand", paused: "neutral", completed: "success", cancelled: "danger" };

export default async function StudentsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const filters = { q: sp["q"]?.trim() || undefined, status: sp["status"] || undefined, license: sp["license"] || undefined, instructor: sp["instructor"] || undefined, dataRequests: sp["data_requests"] === "1" };
  const d = await listStudents(filters);
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Schüler</h1>
          <p className="text-sm text-ink-700">{d.rows.length} Einträge</p>
        </div>
        <Link href="/verwaltung/schueler/neu" className={btn.primary}>Schüler anlegen</Link>
      </header>
      <Card>
        <form method="get" className="grid gap-3 md:grid-cols-5">
          <div className="md:col-span-2"><label htmlFor="q" className={label}>Suche</label><input id="q" name="q" defaultValue={filters.q ?? ""} placeholder="Name, E-Mail, Schülernummer" className={field} /></div>
          <div><label htmlFor="status" className={label}>Status</label><select id="status" name="status" defaultValue={filters.status ?? ""} className={field}><option value="">Alle</option>{Object.entries(LICENSE_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><label htmlFor="license" className={label}>Klasse</label><select id="license" name="license" defaultValue={filters.license ?? ""} className={field}><option value="">Alle</option>{d.licenses.map((l) => <option key={l.code} value={l.code}>{l.code}</option>)}</select></div>
          <div><label htmlFor="instructor" className={label}>Fahrlehrer</label><select id="instructor" name="instructor" defaultValue={filters.instructor ?? ""} className={field}><option value="">Alle</option>{d.instructors.map((i) => <option key={i.id} value={i.id}>{i.display_name}</option>)}</select></div>
          <div className="flex items-end gap-2 md:col-span-5"><button className={btn.secondary}>Filtern</button><Link href="/verwaltung/schueler" className={btn.ghost}>Zurücksetzen</Link></div>
        </form>
      </Card>
      {filters.dataRequests && (
        <Card title="Offene Datenschutzanfragen">
          {d.dataRequests.length === 0 ? <p className="text-sm text-ink-700">Keine offenen Anfragen.</p> : (
            <ul className="divide-y divide-ink-100">
              {d.dataRequests.map((r) => {
                const st = d.rows.find((s) => s.id === r.student_id);
                return (
                  <li key={r.id} className="grid gap-3 py-3 md:grid-cols-[1fr_2fr]">
                    <div className="text-sm">
                      <p className="font-medium">{r.kind === "export" ? "Datenexport" : r.kind === "deletion" ? "Löschung" : "Berichtigung"} vom {fmt.date(r.created_at)}</p>
                      <p>{st ? <Link href={`/verwaltung/schueler/${st.id}`} className="text-brand-700 underline">{st.first_name} {st.last_name}</Link> : "Schüler nicht zugeordnet"}</p>
                    </div>
                    <DataRequestForm request={{ id: r.id, status: r.status, student_id: r.student_id, kind: r.kind, reason: null, legal_hold_until: null }} />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}
      {d.rows.length === 0 ? (
        <EmptyState title="Keine Schüler gefunden" text="Passe die Filter an oder lege einen neuen Schüler an." action={<Link href="/verwaltung/schueler/neu" className={btn.primary}>Schüler anlegen</Link>} />
      ) : (
        <div className="overflow-x-auto rounded-card bg-surface shadow-card">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink-500">
              <tr><th className="p-3">Name</th><th className="p-3">Status</th><th className="p-3">Ausbildung</th><th className="p-3">Fahrlehrer</th><th className="p-3">Prüfungen</th><th className="p-3 text-right">Offen</th></tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {d.rows.map((s) => {
                const open = d.openByStudent.get(s.id) ?? 0;
                return (
                  <tr key={s.id} className="hover:bg-ink-50">
                    <td className="p-3"><Link href={`/verwaltung/schueler/${s.id}`} className="font-medium text-brand-700 hover:underline">{s.last_name}, {s.first_name}</Link>{s.student_number && <span className="ml-2 text-xs text-ink-500">{s.student_number}</span>}<p className="text-xs text-ink-500">{s.email ?? "keine E-Mail"}</p></td>
                    <td className="p-3"><Pill tone={STATUS_TONE[s.status] ?? "neutral"}>{LICENSE_STATUS_LABEL[s.status] ?? s.status}</Pill></td>
                    <td className="p-3">{s.student_licenses.map((l) => <span key={l.id} className="mr-1 inline-block">{l.license_code} ({l.transmission === "automatic" ? "Automatik" : "Schaltung"})</span>)}</td>
                    <td className="p-3">{Array.from(new Set(s.student_licenses.map((l) => l.instructors?.display_name).filter(Boolean))).join(", ") || "nicht zugewiesen"}</td>
                    <td className="p-3 text-xs">{s.student_licenses.map((l) => <p key={l.id}>T: {EXAM_STATUS_LABEL[l.theory_exam_status]} / P: {EXAM_STATUS_LABEL[l.practical_exam_status]}</p>)}</td>
                    <td className="p-3 text-right tabular-nums">{open > 0 ? <span className="text-danger-500">{fmt.eur(open)}</span> : <span className="text-ink-500">0,00 €</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
