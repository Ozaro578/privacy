import Link from "next/link";
import { listExams } from "@/lib/data/admin-exams";
import { EXAM_STATUS_LABEL } from "@/lib/data/admin";
import { Card, EmptyState, Pill, btn, fmt } from "@/components/ui";
import { field, label } from "@/components/admin/action-form";
import { ExamPanel, EXAM_TONE, countdown } from "@/components/admin/students/exam-panel";

export const metadata = { title: "Prüfungen" };

export default async function ExamsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const filter = { status: sp["status"] || undefined, kind: sp["kind"] || undefined };
  const d = await listExams(filter);
  const byLicense = new Map(d.rows.map((l) => [l.id, l]));
  return (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-semibold">Prüfungen</h1><p className="text-sm text-ink-700">Statusworkflow: Freigabe durch Fahrlehrer, Anfrage bei der Prüforganisation, Termin, Ergebnis. {d.rows.length} Ausbildungen mit laufendem Prüfungsvorgang.</p></header>
      <Card title="Nächste Termine">
        {d.upcoming.length === 0 ? <p className="text-sm text-ink-700">Keine terminierten Prüfungen.</p> : (
          <ul className="divide-y divide-ink-100 text-sm">
            {d.upcoming.map((e) => { const l = byLicense.get(e.student_license_id); return (
              <li key={`${e.kind}-${e.id}`} className="flex flex-wrap items-center gap-2 py-2">
                <span className="tabular-nums font-medium">{fmt.date(e.scheduled_at)} {fmt.time(e.scheduled_at)}</span>
                <Pill tone="brand">{e.kind === "theory" ? "Theorie" : "Praxis"}</Pill>
                {l?.students && <Link href={`/verwaltung/schueler/${l.students.id}#pruefungen`} className="text-brand-700 hover:underline">{l.students.first_name} {l.students.last_name}</Link>}
                <span className="text-ink-500">Klasse {l?.license_code}, {e.examining_body ?? "Prüforganisation offen"}, Versuch {e.attempt_no}</span>
                <span className="ml-auto text-ink-700">{countdown(e.scheduled_at)}</span>
              </li>
            ); })}
          </ul>
        )}
      </Card>
      <Card>
        <form method="get" className="grid gap-3 md:grid-cols-4">
          <div><label htmlFor="kind" className={label}>Prüfungsart</label><select id="kind" name="kind" defaultValue={filter.kind ?? ""} className={field}><option value="">Beide</option><option value="theory">Theorie</option><option value="practical">Praxis</option></select></div>
          <div><label htmlFor="status" className={label}>Status</label><select id="status" name="status" defaultValue={filter.status ?? ""} className={field}><option value="">Alle laufenden</option>{["awaiting_instructor_release", "ready", "requested", "scheduled", "failed"].map((s) => <option key={s} value={s}>{EXAM_STATUS_LABEL[s]}</option>)}</select></div>
          <div className="flex items-end gap-2 md:col-span-2"><button className={btn.secondary}>Filtern</button><Link href="/verwaltung/pruefungen" className={btn.ghost}>Zurücksetzen</Link></div>
        </form>
      </Card>
      {d.rows.length === 0 ? <EmptyState title="Keine laufenden Prüfungsvorgänge" text="Sobald Fahrlehrer eine Prüfung freigeben, erscheint sie hier." /> : (
        <div className="space-y-4">
          {d.rows.map((l) => {
            const rules = d.rulesCache.get(`${l.license_code}:${l.acquisition_kind}`);
            const vehicles = d.vehicles.filter((v) => v.transmission === l.transmission);
            return (
              <Card key={l.id} title={`${l.students?.last_name ?? ""}, ${l.students?.first_name ?? ""} · Klasse ${l.license_code}`} action={<Link href={`/verwaltung/schueler/${l.student_id}#pruefungen`} className="text-sm text-brand-700 underline">Akte</Link>}>
                <p className="mb-3 flex flex-wrap gap-2 text-sm text-ink-700"><span>Fahrlehrer: {l.instructors?.display_name ?? "nicht zugewiesen"}</span><Pill tone={EXAM_TONE[l.theory_exam_status] ?? "neutral"}>Theorie: {EXAM_STATUS_LABEL[l.theory_exam_status]}</Pill><Pill tone={EXAM_TONE[l.practical_exam_status] ?? "neutral"}>Praxis: {EXAM_STATUS_LABEL[l.practical_exam_status]}</Pill>{rules?.legalBasisDate && <span className="text-xs text-ink-500">Rechtsstand {fmt.date(rules.legalBasisDate)}</span>}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {filter.kind !== "practical" && <ExamPanel kind="theory" licenseId={l.id} licenseStatus={l.theory_exam_status} exams={d.theoryExams.filter((e) => e.student_license_id === l.id)} instructors={d.instructors} vehicles={vehicles} languages={rules?.examTheory?.rules.exam_languages} retryWaitDays={rules?.examPractical?.rules.retry_wait_days} />}
                  {filter.kind !== "theory" && <ExamPanel kind="practical" licenseId={l.id} licenseStatus={l.practical_exam_status} exams={d.practicalExams.filter((e) => e.student_license_id === l.id)} instructors={d.instructors} vehicles={vehicles} languages={undefined} retryWaitDays={rules?.examPractical?.rules.retry_wait_days} />}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
