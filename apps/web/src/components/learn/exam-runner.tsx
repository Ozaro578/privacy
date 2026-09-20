"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitExamSimulation } from "@/lib/actions/exam";
import { btn, Alert } from "@/components/ui";
import { QuestionMedia } from "./question-media";

export interface ExamQuestionView { id: string; position: number; text: string; points: number; mediaPath: string | null; mediaAlt: string | null; mediaCredit: string | null; numeric: boolean; answers: Array<{ position: number; text: string }>; }
interface Answer { selected: number[]; numeric: string; unsure: boolean; ms: number }

export function ExamRunner({ simulationId, questions, timeLimitSeconds, startedAt }: { simulationId: string; questions: ExamQuestionView[]; timeLimitSeconds: number | null; startedAt: string }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [now, setNow] = useState(Date.now());
  const enteredAt = useRef(Date.now());
  const q = questions[index]!;
  const a = answers[q.id] ?? { selected: [], numeric: "", unsure: false, ms: 0 };
  const elapsed = Math.floor((now - new Date(startedAt).getTime()) / 1000);
  const remaining = timeLimitSeconds !== null ? timeLimitSeconds - elapsed : null;

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { enteredAt.current = Date.now(); }, [index]);
  useEffect(() => { if (remaining !== null && remaining <= 0 && !pending) submit(); }, [remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  const answeredCount = useMemo(() => questions.filter((x) => { const an = answers[x.id]; return an && (x.numeric ? an.numeric !== "" : an.selected.length > 0); }).length, [answers, questions]);

  function update(patch: Partial<Answer>) {
    setAnswers((s) => ({ ...s, [q.id]: { ...a, ...patch, ms: (a.ms ?? 0) + (Date.now() - enteredAt.current) } }));
    enteredAt.current = Date.now();
  }
  function submit() {
    start(async () => {
      try {
        const res = await submitExamSimulation({ simulationId, answers: questions.map((x) => { const an = answers[x.id]; return { questionId: x.id, selected: an?.selected ?? [], numericAnswer: x.numeric && an?.numeric ? Number(an.numeric.replace(",", ".")) : null, unsure: an?.unsure ?? false, responseMs: an?.ms ?? null }; }) });
        router.replace(`/lernen/pruefung/${res.id}`);
        router.refresh();
      } catch (e) { setError(e instanceof Error ? e.message : "Abgabe fehlgeschlagen."); }
    });
  }
  const mm = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span>Frage {index + 1} / {questions.length} · {answeredCount} beantwortet</span>
        <span className="tabular-nums" aria-live="polite">{remaining !== null ? `Restzeit ${mm(Math.max(0, remaining))}` : `Zeit ${mm(elapsed)}`}</span>
      </div>
      <div className="flex flex-wrap gap-1" role="navigation" aria-label="Fragenübersicht">
        {questions.map((x, i) => { const an = answers[x.id]; const done = an && (x.numeric ? an.numeric !== "" : an.selected.length > 0); return <button key={x.id} type="button" onClick={() => setIndex(i)} aria-current={i === index ? "true" : undefined} className={`h-8 w-8 rounded-md text-xs ${i === index ? "ring-2 ring-brand-500" : ""} ${an?.unsure ? "bg-warn-100" : done ? "bg-success-100" : "bg-ink-100"}`}>{i + 1}</button>; })}
      </div>
      <div className="rounded-card bg-surface p-5 shadow-card">
        <p className="text-xs text-ink-500">{q.points} Punkte</p>
        <QuestionMedia path={q.mediaPath} alt={q.mediaAlt} credit={q.mediaCredit} />
        <p className="text-lg font-medium">{q.text}</p>
        {q.numeric ? (
          <div className="mt-4"><label htmlFor="num" className="mb-1 block text-sm">Antwort (Zahl)</label><input id="num" inputMode="decimal" value={a.numeric} onChange={(e) => update({ numeric: e.target.value })} className="w-40 rounded-xl border border-ink-300 px-3 py-3 text-lg" /></div>
        ) : (
          <ul className="mt-4 space-y-2">{q.answers.map((ans) => { const sel = a.selected.includes(ans.position); return <li key={ans.position}><label className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 ${sel ? "border-brand-500 bg-brand-50" : "border-ink-300"}`}><input type="checkbox" className="mt-1 h-5 w-5" checked={sel} onChange={() => update({ selected: sel ? a.selected.filter((p) => p !== ans.position) : [...a.selected, ans.position] })} /><span>{ans.text}</span></label></li>; })}</ul>
        )}
        <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={a.unsure} onChange={(e) => update({ unsure: e.target.checked })} />Unsicher, später prüfen</label>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex flex-wrap justify-between gap-2">
        <button type="button" className={btn.secondary} onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}>Zurück</button>
        <div className="flex gap-2">
          {index < questions.length - 1 ? <button type="button" className={btn.primary} onClick={() => setIndex(index + 1)}>Weiter</button> : null}
          {!confirm ? <button type="button" className={btn.danger} onClick={() => setConfirm(true)}>Prüfung abgeben</button> : (
            <span className="flex items-center gap-2 rounded-xl bg-warn-100 px-3 py-2 text-sm">{answeredCount < questions.length ? `${questions.length - answeredCount} unbeantwortet.` : "Alles beantwortet."} Wirklich abgeben?<button type="button" className={btn.danger} onClick={submit} disabled={pending}>{pending ? "Werte aus …" : "Ja, abgeben"}</button><button type="button" className={btn.ghost} onClick={() => setConfirm(false)}>Nein</button></span>
          )}
        </div>
      </div>
    </div>
  );
}
