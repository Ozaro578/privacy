"use client";
import { useState, useTransition } from "react";
import { gradePracticalAnswer, type GradeResult } from "@/lib/actions/practical";
import { btn } from "@/components/ui";

export interface CheckQuestion { id: string; category: string; question: string; expectedPoints: string[]; explanation: string | null }

const CAT: Record<string, string> = { lighting: "Beleuchtung", tires: "Reifen", brakes: "Bremsen", fluids: "Flüssigkeitsstände", warning_lights: "Kontrollleuchten", steering: "Lenkung", safety_equipment: "Sicherheitsausstattung", general: "Allgemein" };

export function PracticalTrainer({ questions }: { questions: CheckQuestion[] }) {
  const [filter, setFilter] = useState<string>("all");
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<GradeResult | null>(null);
  const [reveal, setReveal] = useState(false);
  const [pending, start] = useTransition();
  const list = filter === "all" ? questions : questions.filter((q) => q.category === filter);
  const q = list[i % Math.max(1, list.length)];
  if (!q) return <p className="text-sm text-ink-700">Noch keine Prüfer-Fragen hinterlegt.</p>;
  function next() { setI((x) => (x + 1) % list.length); setAnswer(""); setResult(null); setReveal(false); }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1">{["all", ...Object.keys(CAT)].map((c) => <button key={c} type="button" onClick={() => { setFilter(c); setI(0); setResult(null); setReveal(false); }} className={`rounded-full px-3 py-1 text-sm ${filter === c ? "bg-brand-500 text-white" : "bg-ink-100"}`}>{c === "all" ? "Alle" : CAT[c]}</button>)}</div>
      <div className="rounded-card bg-white p-5 shadow-card">
        <p className="text-xs text-ink-500">{CAT[q.category] ?? q.category} · Frage {(i % list.length) + 1} von {list.length}</p>
        <p className="mt-1 text-lg font-medium">{q.question}</p>
        <label htmlFor="answer" className="mt-4 mb-1 block text-sm">Deine Antwort (so, wie du sie dem Prüfer sagen würdest)</label>
        <textarea id="answer" value={answer} onChange={(e) => setAnswer(e.target.value)} rows={4} className="w-full rounded-xl border border-ink-300 px-3 py-2" disabled={!!result} />
        <div className="mt-3 flex flex-wrap gap-2">
          {!result && <button type="button" className={btn.primary} disabled={pending || answer.trim().length < 3} onClick={() => start(async () => setResult(await gradePracticalAnswer({ questionId: q.id, answer })))}>{pending ? "Bewerte …" : "Antwort bewerten"}</button>}
          <button type="button" className={btn.ghost} onClick={() => setReveal((r) => !r)}>{reveal ? "Musterlösung ausblenden" : "Musterlösung zeigen"}</button>
          <button type="button" className={btn.secondary} onClick={next}>Nächste Frage</button>
        </div>
        {result && (
          <div className={`mt-4 rounded-xl p-3 text-sm ${result.score >= 70 ? "bg-success-100" : "bg-warn-100"}`} role="status">
            <p className="font-semibold">{result.score} von 100 Punkten</p>
            <p className="mt-1">{result.feedback}</p>
            {result.missing.length > 0 && <p className="mt-1">Fehlt noch: {result.missing.join("; ")}</p>}
          </div>
        )}
        {reveal && <div className="mt-3 rounded-xl bg-ink-100 p-3 text-sm"><p className="font-semibold">Das sollte deine Antwort enthalten</p><ul className="mt-1 list-disc pl-5">{q.expectedPoints.map((p) => <li key={p}>{p}</li>)}</ul>{q.explanation && <p className="mt-2 text-ink-700">{q.explanation}</p>}</div>}
      </div>
    </div>
  );
}
