import Link from "next/link";
import { notFound } from "next/navigation";
import { getInstructorContext, loadMockExamContext } from "@/lib/data/instructor";
import { Card, Pill, fmt } from "@/components/ui";
import { MockRunner, StartMockCard, type MockEvent } from "@/components/instructor/mock-runner";

export const metadata = { title: "Mock-Prüfung" };

export default async function MockExamPage({ params, searchParams }: { params: Promise<{ licenseId: string }>; searchParams: Promise<{ ergebnis?: string }> }) {
  const { licenseId } = await params;
  const { ergebnis } = await searchParams;
  const ctx = await getInstructorContext();
  const d = await loadMockExamContext(ctx, licenseId);
  if (!d) notFound();
  const current = d.current;
  const result = ergebnis ? d.history.find((h) => h.id === ergebnis) ?? null : d.history[0] ?? null;
  const skillName = (code: string | null) => (code ? d.skills.find((s) => s.code === code)?.name ?? code : "");
  return (
    <div className="space-y-5">
      <header>
        <Link href={`/lehrer/schueler/${d.license.id}`} className="text-sm text-brand-700 underline">Zum Schülerprofil</Link>
        <h1 className="text-2xl font-bold">Mock-Prüfung: {d.studentName}</h1>
        <p className="text-sm text-ink-700">Klasse {d.license.license_code} · Simulation der praktischen Prüfung, kein amtliches Ergebnis</p>
      </header>

      {current ? (
        <MockRunner mockId={current.id} startedAt={current.started_at} initialEvents={((current.mock_exam_events ?? []) as MockEvent[]).map((e) => ({ ...e, label: e.skill_code && !e.label ? skillName(e.skill_code) : e.label }))} />
      ) : (
        <>
          <StartMockCard licenseId={d.license.id} canStart={!!ctx.instructor} />
          {result && (
            <Card title={`Ergebnis vom ${fmt.date(result.started_at)} ${fmt.time(result.started_at)}`}>
              <div className="flex flex-wrap items-center gap-4">
                <p className="text-4xl font-bold tabular-nums">{result.status === "aborted" ? "abgebrochen" : `${result.overall_score ?? 0}`}{result.status !== "aborted" && <span className="text-base font-normal text-ink-500"> / 100</span>}</p>
                {result.status !== "aborted" && <Pill tone={(result.overall_score ?? 0) >= 80 ? "success" : (result.overall_score ?? 0) >= 60 ? "warn" : "danger"}>{(result.overall_score ?? 0) >= 80 ? "Prüfungsnah" : (result.overall_score ?? 0) >= 60 ? "Noch üben" : "Deutlicher Bedarf"}</Pill>}
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div><p className="text-xs uppercase tracking-wide text-ink-500">Stärken</p>{result.strengths.length ? <ul className="mt-1 list-disc pl-5 text-sm">{result.strengths.map((s) => <li key={s}>{s}</li>)}</ul> : <p className="mt-1 text-sm text-ink-500">Keine positiven Ereignisse markiert.</p>}</div>
                <div><p className="text-xs uppercase tracking-wide text-ink-500">Verbesserungen</p>{result.improvements.length ? <ul className="mt-1 list-disc pl-5 text-sm">{result.improvements.map((s) => <li key={s}>{s}</li>)}</ul> : <p className="mt-1 text-sm text-ink-500">Keine negativen Ereignisse markiert.</p>}</div>
              </div>
              {result.summary && <p className="mt-4 whitespace-pre-line rounded-xl bg-ink-100 p-3 text-sm">{result.summary}</p>}
            </Card>
          )}
        </>
      )}

      {d.history.length > 0 && (
        <Card title="Bisherige Simulationen">
          <ul className="divide-y divide-ink-100 text-sm">{d.history.map((h) => <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><span>{fmt.date(h.started_at)} {fmt.time(h.started_at)}{h.ended_at ? ` bis ${fmt.time(h.ended_at)}` : ""}</span><span className="flex items-center gap-2"><Pill tone={h.status === "aborted" ? "neutral" : (h.overall_score ?? 0) >= 80 ? "success" : "warn"}>{h.status === "aborted" ? "abgebrochen" : `${h.overall_score ?? 0} / 100`}</Pill><Link href={`/lehrer/mock/${d.license.id}?ergebnis=${h.id}`} className="text-brand-700 underline">Details</Link></span></li>)}</ul>
        </Card>
      )}
    </div>
  );
}
