import { getStudentContext } from "@/lib/data/student";
import { loadTrainingStatus } from "@/lib/data/training";
import { Card, ProgressBar, fmt, Pill, parseRange } from "@/components/ui";
import { CheckinForm, RegisterButton } from "@/components/theory/checkin";

export const metadata = { title: "Theorieunterricht" };

export default async function TheoryPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const p = await searchParams;
  const ctx = await getStudentContext();
  const status = await loadTrainingStatus(ctx);
  const rules = ctx.rules.theoryLessons?.rules;
  const [{ data: classes }, { data: mine }] = await Promise.all([
    ctx.db.from("theory_classes").select("id, lesson_unit_code, material_kind, title, period, capacity, status, license_codes, is_online, instructors(display_name), locations(name)").gte("period", `[${new Date().toISOString()},)`).neq("status", "cancelled").order("period").limit(40),
    ctx.db.from("attendance").select("theory_class_id, status").eq("student_id", ctx.student.id),
  ]);
  const myStatus = (id: string) => (mine ?? []).find((a) => a.theory_class_id === id)?.status;
  const attended = new Set(status.attendedCodes);
  const basicTitles = rules?.basic_unit_titles ?? [];
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Theorieunterricht</h1>
      <Card title="Anwesenheit per QR-Code">
        <p className="mb-3 text-sm text-ink-700">Dein Fahrlehrer zeigt im Unterricht einen QR-Code. Scanne ihn mit der Kamera oder gib den Code hier ein. Der Code wechselt regelmäßig und gilt nur während des Unterrichts.</p>
        <CheckinForm />
        {p.code && <p className="mt-2 text-xs text-ink-500">Code aus dem Link übernommen: {p.code}</p>}
      </Card>
      {status.theory && rules && (
        <Card title="Dein Unterrichtsplan" action={<span className="text-sm">{status.theory.percent} %</span>}>
          <ProgressBar value={status.theory.percent} label={`${status.theory.basic_attended + status.theory.class_specific_attended} von ${rules.basic_units + rules.class_specific_units} Doppelstunden besucht`} />
          <h3 className="mt-4 text-sm font-semibold">Grundstoff ({status.theory.basic_attended}/{rules.basic_units})</h3>
          <ol className="mt-1 grid gap-1 text-sm sm:grid-cols-2">{Array.from({ length: rules.basic_units }, (_, i) => { const code = `G${i + 1}`; return <li key={code} className={`flex items-center gap-2 rounded-md px-2 py-1 ${attended.has(code) ? "bg-success-100" : "bg-ink-100"}`}><span className="w-6 font-mono text-xs">{code}</span><span>{basicTitles[i] ?? `Einheit ${i + 1}`}</span>{attended.has(code) && <span aria-label="besucht">✓</span>}</li>; })}</ol>
          <h3 className="mt-4 text-sm font-semibold">Zusatzstoff {ctx.licenseInfo.code} ({status.theory.class_specific_attended}/{rules.class_specific_units})</h3>
          <ol className="mt-1 grid gap-1 text-sm sm:grid-cols-2">{Array.from({ length: rules.class_specific_units }, (_, i) => { const code = `${ctx.licenseInfo.base_class ?? ctx.licenseInfo.code}${i + 1}`; return <li key={code} className={`flex items-center gap-2 rounded-md px-2 py-1 ${attended.has(code) ? "bg-success-100" : "bg-ink-100"}`}><span className="w-6 font-mono text-xs">{code}</span><span>{rules.class_specific_unit_titles?.[i] ?? `Zusatzstoff ${i + 1}`}</span>{attended.has(code) && <span aria-label="besucht">✓</span>}</li>; })}</ol>
          <p className="mt-3 text-xs text-ink-500">Doppelstunden à {rules.unit_minutes} Minuten nach FahrschAusbO{ctx.rules.theoryLessons?.needsVerification ? " (fachlich zu verifizieren)" : ""}.</p>
        </Card>
      )}
      <Card title="Nächste Termine">
        {(classes ?? []).length === 0 ? <p className="text-sm text-ink-700">Aktuell sind keine Unterrichtstermine geplant.</p> : (
          <ul className="divide-y divide-ink-100">{(classes ?? []).map((c) => { const { start, end } = parseRange(c.period as unknown as string); const st = myStatus(c.id); const missing = !attended.has(c.lesson_unit_code); return (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div><p className="font-semibold">{fmt.weekday(start)}, {fmt.date(start)} · {fmt.time(start)} bis {fmt.time(end)}</p><p className="text-sm text-ink-700"><span className="font-mono text-xs">{c.lesson_unit_code}</span> {c.title}{(c.instructors as unknown as { display_name: string } | null)?.display_name ? ` · ${(c.instructors as unknown as { display_name: string }).display_name}` : ""}{c.is_online ? " · Online" : (c.locations as unknown as { name: string } | null)?.name ? ` · ${(c.locations as unknown as { name: string }).name}` : ""}</p></div>
              <div className="flex items-center gap-2">{missing && <Pill tone="brand">noch offen</Pill>}{st ? <Pill tone={st === "present" ? "success" : "neutral"}>{st === "present" ? "anwesend" : "angemeldet"}</Pill> : <RegisterButton classId={c.id} />}</div>
            </li>
          ); })}</ul>
        )}
      </Card>
    </div>
  );
}
