"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { recordAttempt, finishLearningSession, toggleBookmark, type StartedSession, type AttemptResult } from "@/lib/actions/learning";
import { btn, Alert } from "@/components/ui";
import { WhyButton } from "./why-button";
import { QuestionMedia, VIDEO_GATE_HINT, videoGateOpen } from "./question-media";
import { Confetti, playSuccessTone } from "./celebration";
import { ReadAloud } from "./read-aloud";

type Phase = "answer" | "feedback" | "done";

export function SessionRunner({ session }: { session: StartedSession }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [numeric, setNumeric] = useState("");
  const [confidence, setConfidence] = useState<1 | 2 | 3 | null>(null);
  const [phase, setPhase] = useState<Phase>("answer");
  const [videoSeen, setVideoSeen] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, xp: 0, badges: [] as string[] });
  const [finish, setFinish] = useState<{ challengeCompleted: boolean; bonusXp: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => { rootRef.current?.setAttribute("data-ready", "true"); }, []);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const startedAt = useRef(0);
  const attemptId = useRef("");
  const q = session.questions[index]!;
  const total = session.questions.length;

  useEffect(() => { startedAt.current = Date.now(); attemptId.current = crypto.randomUUID(); }, [index]);

  const gateOpen = videoGateOpen(q.mediaPath, null, videoSeen);
  const canSubmit = gateOpen && (q.numeric ? numeric.trim() !== "" : selected.length > 0);

  function submit() {
    if (!canSubmit || pending) return;
    start(async () => {
      try {
        const r = await recordAttempt({ sessionId: session.sessionId, questionId: q.id, clientAttemptId: attemptId.current || crypto.randomUUID(), selected, numericAnswer: q.numeric ? Number(numeric.replace(",", ".")) : null, confidence, responseMs: Date.now() - startedAt.current });
        setResult(r);
        setStats((s) => ({ correct: s.correct + (r.correct ? 1 : 0), wrong: s.wrong + (r.correct ? 0 : 1), xp: s.xp + r.xpGained, badges: [...s.badges, ...r.newBadges] }));
        if (r.correct) playSuccessTone("correct");
        setPhase("feedback");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Antwort konnte nicht gespeichert werden. Bitte erneut versuchen.");
      }
    });
  }

  function next() {
    if (index + 1 >= total) {
      start(async () => { const f = await finishLearningSession(session.sessionId); setFinish(f); setPhase("done"); if (f.challengeCompleted || stats.correct / total >= 0.8) playSuccessTone("finish"); });
      return;
    }
    setIndex(index + 1); setSelected([]); setNumeric(""); setConfidence(null); setResult(null); setPhase("answer"); setError(null); setVideoSeen(false);
  }

  const progress = useMemo(() => Math.round(((index + (phase === "feedback" ? 1 : 0)) / total) * 100), [index, phase, total]);

  if (phase === "done") {
    const pct = Math.round((stats.correct / total) * 100);
    const celebrate = (finish?.challengeCompleted ?? false) || pct >= 80;
    return (
      <div className="space-y-4">
        <Confetti active={celebrate} />
        <h1 className="text-2xl font-bold">{session.challenge ? (finish?.challengeCompleted ? "Tages-Challenge geschafft!" : "Tages-Challenge beendet") : "Session abgeschlossen"}</h1>
        <div className="rounded-card bg-surface p-5 shadow-card">
          <p className="text-4xl font-bold tabular-nums">{pct} %</p>
          <p className="text-ink-700">{stats.correct} richtig, {stats.wrong} falsch · +{stats.xp + (finish?.bonusXp ?? 0)} XP{finish?.bonusXp ? ` (davon ${finish.bonusXp} Challenge-Bonus)` : ""}</p>
          {session.challenge && !finish?.challengeCompleted && <p className="mt-2 text-sm text-ink-700">Für die Challenge brauchst du 10 Fragen mit mindestens 80 % richtig. Morgen gibt es eine neue Chance, oder du versuchst es gleich noch einmal.</p>}
          {stats.badges.length > 0 && <p className="mt-2 rounded-lg bg-accent-400/30 p-2 text-sm">Neues Abzeichen: {stats.badges.join(", ")}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/lernen/session?mode=${session.mode}&limit=${total}`} className={btn.primary}>Noch eine Runde</Link>
          <Link href="/lernen" className={btn.secondary}>Zur Übersicht</Link>
          {stats.wrong > 0 && <Link href="/lernen/session?mode=wrong&limit=15" className={btn.ghost}>Fehler wiederholen</Link>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" ref={rootRef}>
      <div className="flex items-center justify-between text-sm text-ink-700">
        <span>Frage {index + 1} von {total}</span>
        <span>{q.topicName} · {q.points} {q.points === 1 ? "Punkt" : "Punkte"}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-brand-500" style={{ width: `${progress}%` }} /></div>
      <div className="rounded-card bg-surface p-5 shadow-card">
        <div className="mb-2 flex items-center justify-between gap-2">{q.source === "own" ? <p className="text-xs text-ink-500">Übungsfrage (kein amtlicher Prüfungsinhalt)</p> : <span />}<ReadAloud text={[q.text, ...q.answers.map((a, i) => `Antwort ${i + 1}: ${a.text}`), ...(phase === "feedback" && result ? [result.correct ? "Richtig." : "Nicht richtig.", result.explanation ?? ""] : [])].join(". ")} /></div>
        <QuestionMedia path={q.mediaPath} alt={q.mediaAlt} credit={q.mediaCredit} onEnded={() => setVideoSeen(true)} />
        <p className="text-lg font-medium">{q.text}</p>
        {!gateOpen ? (
          <p className="mt-4 rounded-xl bg-ink-100 p-3 text-sm text-ink-700" role="status">{VIDEO_GATE_HINT}</p>
        ) : q.numeric ? (
          <div className="mt-4">
            <label htmlFor="numeric" className="mb-1 block text-sm font-medium">Antwort (Zahl)</label>
            <input id="numeric" inputMode="decimal" value={numeric} onChange={(e) => setNumeric(e.target.value)} disabled={phase === "feedback"} className="w-40 rounded-xl border border-ink-300 px-3 py-3 text-lg" />
            {result && <p className={`mt-2 text-sm ${result.correct ? "text-success-500" : "text-danger-500"}`}>{result.correct ? "Richtig" : `Falsch. Richtige Antwort: ${result.numericAnswer}`}</p>}
          </div>
        ) : (
          <ul className="mt-4 space-y-2" role="group" aria-label="Antworten (Mehrfachauswahl möglich)">
            {q.answers.map((a) => {
              const isSel = selected.includes(a.position);
              const isCorrect = result?.correctPositions.includes(a.position);
              let cls = "border-ink-300 bg-surface";
              if (phase === "feedback") cls = isCorrect ? "border-success-500 bg-success-100" : isSel ? "border-danger-500 bg-danger-100" : "border-ink-100 opacity-70";
              else if (isSel) cls = "border-brand-500 bg-brand-50";
              const expl = result?.answerExplanations.find((x) => x.position === a.position)?.explanation;
              return (
                <li key={a.position}>
                  <label className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 ${cls}`}>
                    <input type="checkbox" className="mt-1 h-5 w-5" checked={isSel} disabled={phase === "feedback"} onChange={() => setSelected((s) => (s.includes(a.position) ? s.filter((p) => p !== a.position) : [...s, a.position]))} />
                    <span className="flex-1">
                      <span>{a.text}</span>
                      {phase === "feedback" && expl && <span className="mt-1 block text-sm text-ink-700">{expl}</span>}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        {phase === "answer" && (
          <fieldset className="mt-4">
            <legend className="text-sm text-ink-700">Wie sicher bist du?</legend>
            <div className="mt-1 flex gap-2">
              {([1, 2, 3] as const).map((c) => <button key={c} type="button" onClick={() => setConfidence(c)} className={`rounded-full border px-3 py-1.5 text-sm ${confidence === c ? "border-brand-500 bg-brand-50 font-medium" : "border-ink-300"}`}>{c === 1 ? "Unsicher" : c === 2 ? "Mittel" : "Sicher"}</button>)}
            </div>
          </fieldset>
        )}
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {phase === "feedback" && result && (
        <div className={`rounded-card p-4 ${result.correct ? "bg-success-100" : "bg-danger-100"}`} role="status">
          <p className="font-semibold">{result.correct ? "Richtig!" : "Leider falsch."} {result.xpGained > 0 && <span className="text-sm font-normal">+{result.xpGained} XP</span>}</p>
          {result.explanation && <p className="mt-1 text-sm">{result.explanation}</p>}
          {result.mnemonic && <p className="mt-1 text-sm italic">Merksatz: {result.mnemonic}</p>}
          <p className="mt-1 text-xs text-ink-700">{result.legalReference ? `${result.legalReference} · ` : ""}Nächste Wiederholung: {new Date(result.nextDueAt).toLocaleDateString("de-DE")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <WhyButton questionId={q.id} selected={selected} />
            <button type="button" className={btn.ghost} onClick={() => start(async () => { await toggleBookmark(q.id); })}>Merken</button>
          </div>
        </div>
      )}
      <div className="flex justify-end gap-2">
        {phase === "answer" ? <button type="button" onClick={submit} disabled={!canSubmit || pending} className={btn.primary}>{pending ? "Prüfe …" : "Antwort prüfen"}</button>
          : <button type="button" onClick={next} disabled={pending} className={btn.primary}>{index + 1 >= total ? "Abschließen" : "Weiter"}</button>}
      </div>
    </div>
  );
}
