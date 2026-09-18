import Link from "next/link";
import { notFound } from "next/navigation";
import type { ErrorAnalysis } from "@fahrpilot/learning-engine";
import { getStudentContext } from "@/lib/data/student";
import { ExamRunner, type ExamQuestionView } from "@/components/learn/exam-runner";
import { Card, Pill, btn, fmt } from "@/components/ui";

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getStudentContext();
  const { data: sim } = await ctx.db.from("exam_simulations").select("*").eq("id", id).eq("student_id", ctx.student.id).maybeSingle();
  if (!sim) notFound();
  const { data: results } = await ctx.db.from("exam_results").select("id, position, question_id, points, selected_positions, is_correct, marked_unsure, question_versions(text, media_path, numeric_answer, explanation, question_answers(position, text, is_correct))").eq("exam_simulation_id", sim.id).order("position");
  type V = { text: string; media_path: string | null; numeric_answer: number | null; explanation: string | null; question_answers: Array<{ position: number; text: string; is_correct: boolean }> };
  if (sim.status === "in_progress") {
    const questions: ExamQuestionView[] = (results ?? []).map((r) => { const v = r.question_versions as unknown as V; return { id: r.question_id, position: r.position, text: v.text, points: r.points, mediaPath: v.media_path, numeric: v.numeric_answer !== null, answers: v.question_answers.sort((a, b) => a.position - b.position).map((a) => ({ position: a.position, text: a.text })) }; });
    return <ExamRunner simulationId={sim.id} questions={questions} timeLimitSeconds={sim.time_limit_seconds} startedAt={sim.started_at} />;
  }
  const analysis = sim.analysis as unknown as ErrorAnalysis | null;
  const total = (sim.correct_count ?? 0) + (sim.wrong_count ?? 0);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Ergebnis</h1>
      <Card className={sim.passed ? "border-2 border-success-500" : "border-2 border-danger-500"}>
        <p className="text-3xl font-bold">{sim.passed ? "Bestanden" : "Nicht bestanden"}</p>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
          <div><dt className="text-ink-500">Fehlerpunkte</dt><dd className="text-xl font-semibold tabular-nums">{sim.error_points}</dd></div>
          <div><dt className="text-ink-500">Bearbeitungszeit</dt><dd className="text-xl font-semibold tabular-nums">{Math.floor((sim.duration_seconds ?? 0) / 60)}:{String((sim.duration_seconds ?? 0) % 60).padStart(2, "0")}</dd></div>
          <div><dt className="text-ink-500">Richtig</dt><dd className="text-xl font-semibold tabular-nums">{sim.correct_count} / {total}</dd></div>
          <div><dt className="text-ink-500">Falsch</dt><dd className="text-xl font-semibold tabular-nums">{sim.wrong_count}</dd></div>
          <div><dt className="text-ink-500">Unsicher</dt><dd className="text-xl font-semibold tabular-nums">{sim.unsure_count}</dd></div>
        </dl>
        {sim.fail_reasons.length > 0 && <ul className="mt-3 list-disc pl-5 text-sm text-danger-500">{sim.fail_reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
        <p className="mt-3 text-xs text-ink-500">Bewertet nach Regelversion vom {fmt.date((sim.rule_snapshot as { valid_from?: string } | null)?.valid_from ?? sim.started_at)} (eingefroren zum Zeitpunkt der Simulation).</p>
      </Card>
      {analysis && analysis.statements.length > 0 && (
        <Card title="Analyse">
          <ul className="space-y-1 text-sm">{analysis.statements.map((s, i) => <li key={i}>{s}</li>)}</ul>
          {analysis.recommendation && <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-brand-50 p-3 text-sm"><span>{analysis.recommendation.text}</span><Link href={`/lernen/session?mode=topic&topic=${analysis.recommendation.topic_id}&limit=15`} className={btn.primary}>Kapitel üben</Link></div>}
          {analysis.clusters.length > 0 && <ul className="mt-3 space-y-1 text-xs text-ink-700">{analysis.clusters.slice(0, 5).map((c) => <li key={c.topic_id}>{c.topic_name}: {c.errors} Fehler ({Math.round(c.share * 100)} %)</li>)}</ul>}
        </Card>
      )}
      <Card title="Alle Fragen">
        <ol className="space-y-4">
          {(results ?? []).map((r) => { const v = r.question_versions as unknown as V; return (
            <li key={r.id} className="rounded-xl border border-ink-100 p-3">
              <div className="flex items-start justify-between gap-2"><p className="font-medium">{r.position}. {v.text}</p><Pill tone={r.is_correct ? "success" : "danger"}>{r.is_correct ? "richtig" : `${r.points} FP`}</Pill></div>
              <ul className="mt-2 space-y-1 text-sm">{v.question_answers.sort((a, b) => a.position - b.position).map((a) => <li key={a.position} className={`rounded-md px-2 py-1 ${a.is_correct ? "bg-success-100" : r.selected_positions.includes(a.position) ? "bg-danger-100" : ""}`}>{r.selected_positions.includes(a.position) ? "☑" : "☐"} {a.text}</li>)}</ul>
              {v.numeric_answer !== null && <p className="mt-1 text-sm">Richtige Antwort: {v.numeric_answer}</p>}
              {!r.is_correct && v.explanation && <p className="mt-2 text-sm text-ink-700">{v.explanation}</p>}
            </li>
          ); })}
        </ol>
      </Card>
      <div className="flex flex-wrap gap-2"><Link href="/lernen/pruefung" className={btn.primary}>Neue Simulation</Link><Link href="/lernen/session?mode=wrong&limit=15" className={btn.secondary}>Fehler wiederholen</Link></div>
    </div>
  );
}
