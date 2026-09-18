import { getStudentContext } from "@/lib/data/student";
import { loadDashboard } from "@/lib/data/dashboard";
import { Card, ProgressBar, ReadinessGauge } from "@/components/ui";

export const metadata = { title: "Lernstatistik" };

export default async function StatsPage() {
  const ctx = await getStudentContext();
  const d = await loadDashboard(ctx);
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [{ data: attempts }, { data: sessions }, { data: snapshots }, { data: badges }] = await Promise.all([
    ctx.db.from("student_question_attempts").select("is_correct, answered_at, response_ms").eq("student_id", ctx.student.id).gte("answered_at", since),
    ctx.db.from("learning_sessions").select("started_at, ended_at").eq("student_id", ctx.student.id).gte("started_at", since),
    ctx.db.from("readiness_snapshots").select("computed_at, overall_score, theory_score").eq("student_license_id", ctx.license.id).order("computed_at", { ascending: false }).limit(30),
    ctx.db.from("student_badges").select("badge_code, earned_at, badges(name_i18n)").eq("student_id", ctx.student.id),
  ]);
  const total = attempts?.length ?? 0;
  const correct = (attempts ?? []).filter((a) => a.is_correct).length;
  const minutes = Math.round((sessions ?? []).reduce((s, x) => s + (x.ended_at ? (new Date(x.ended_at).getTime() - new Date(x.started_at).getTime()) / 60000 : 0), 0));
  const best = [...d.overview.topics].sort((a, b) => b.mastery - a.mastery)[0];
  const worst = [...d.overview.topics].filter((t) => t.attempts > 0).sort((a, b) => a.mastery - b.mastery)[0];
  const series = [...(snapshots ?? [])].reverse();
  const max = 100;
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Lernstatistik</h1>
      <Card title="Diese Woche">
        <dl className="grid grid-cols-3 gap-3 text-center">
          <div><dt className="text-xs text-ink-500">Fragen beantwortet</dt><dd className="text-2xl font-bold tabular-nums">{total}</dd></div>
          <div><dt className="text-xs text-ink-500">Richtig</dt><dd className="text-2xl font-bold tabular-nums">{total ? Math.round((correct / total) * 100) : 0} %</dd></div>
          <div><dt className="text-xs text-ink-500">Gelernt</dt><dd className="text-2xl font-bold tabular-nums">{(minutes / 60).toFixed(1).replace(".", ",")} h</dd></div>
        </dl>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <p className="rounded-lg bg-success-100 p-2">Stärkstes Thema: <strong>{best?.name ?? "noch offen"}</strong></p>
          <p className="rounded-lg bg-warn-100 p-2">Schwächstes Thema: <strong>{worst?.name ?? "noch offen"}</strong></p>
        </div>
      </Card>
      <Card title="Prüfungsreife im Verlauf">
        <div className="flex gap-6">
          <ReadinessGauge score={d.readinessScore} size={120} />
          <div className="flex-1">
            {series.length > 1 ? (
              <svg viewBox="0 0 320 120" className="h-32 w-full" role="img" aria-label="Verlauf der Prüfungsreife">
                <polyline fill="none" stroke="#1d4ed8" strokeWidth="2" points={series.map((s, i) => `${(i / (series.length - 1)) * 310 + 5},${115 - (s.overall_score / max) * 110}`).join(" ")} />
                {[40, 70, 85].map((y) => <line key={y} x1="5" x2="315" y1={115 - (y / max) * 110} y2={115 - (y / max) * 110} stroke="#d6d3d1" strokeDasharray="4 4" />)}
              </svg>
            ) : <p className="text-sm text-ink-700">Der Verlauf erscheint, sobald mehrere Berechnungen vorliegen.</p>}
            <ul className="mt-2 space-y-1 text-xs text-ink-700">{d.readinessFactors.map((f) => <li key={f.key} className="flex justify-between"><span>{f.label}</span><span>{f.detail}</span></li>)}</ul>
          </div>
        </div>
        <p className="mt-2 text-xs text-ink-500">Der Score ist eine Einschätzung und keine Garantie für das Bestehen.</p>
      </Card>
      <Card title="Themen">
        <ul className="space-y-3">{d.overview.topics.map((t) => <li key={t.id}><ProgressBar value={t.mastery * 100} label={t.name} tone={t.weak ? "warn" : "success"} /></li>)}</ul>
      </Card>
      <Card title="Abzeichen">
        {(badges ?? []).length === 0 ? <p className="text-sm text-ink-700">Noch keine Abzeichen. 7 Tage in Folge lernen bringt das erste.</p> : <ul className="flex flex-wrap gap-2">{(badges ?? []).map((b) => <li key={b.badge_code} className="rounded-full bg-accent-400/30 px-3 py-1 text-sm">🏅 {((b.badges as unknown as { name_i18n: Record<string, string> } | null)?.name_i18n["de"]) ?? b.badge_code}</li>)}</ul>}
      </Card>
    </div>
  );
}
