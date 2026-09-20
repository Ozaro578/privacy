"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { PriorityScenario } from "@fahrpilot/content/vorfahrt-trainer";
import { btn } from "@/components/ui";
import { Confetti, playSuccessTone } from "./celebration";

type Item = PriorityScenario & { file: string; alt: string };

function shuffle<T>(items: T[]): T[] { const a = items.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; } return a; }
/** Eine Runde umfasst höchstens 12 Situationen, gemischt über alle Stufen; "Noch eine Runde" zieht neu. */
const ROUND = 12;
const draw = <T,>(items: T[]) => shuffle(items).slice(0, ROUND);

/** Vorfahrt-Trainer: Fahrzeuge in der Reihenfolge antippen, in der sie fahren dürfen. */
export function PriorityTrainer({ scenarios }: { scenarios: Item[] }) {
  const [round, setRound] = useState(() => draw(scenarios));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);
  const [score, setScore] = useState({ ok: 0, total: 0 });
  const sc = round[i];
  const expected = useMemo(() => sc?.order.flat() ?? [], [sc]);
  if (!sc) return null;
  if (i >= round.length) return null;
  const isDone = score.total === round.length;
  const check = () => {
    const ok = picked.length === expected.length && sc.order.every((group, gi) => { const start = sc.order.slice(0, gi).reduce((n, g) => n + g.length, 0); const slice = picked.slice(start, start + group.length); return group.every((k) => slice.includes(k)); });
    setChecked(ok);
    setScore((s) => ({ ok: s.ok + (ok ? 1 : 0), total: s.total + 1 }));
    if (ok) playSuccessTone("correct");
  };
  const next = () => { setPicked([]); setChecked(null); if (i + 1 < round.length) setI(i + 1); };
  const restart = () => { setRound(draw(scenarios)); setI(0); setPicked([]); setChecked(null); setScore({ ok: 0, total: 0 }); };
  const orderLabel = (k: string) => sc.vehicles.find((v) => v.key === k)?.label ?? k;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-ink-700"><span>Situation {i + 1} von {round.length}</span><span>Stufe {sc.level} · {score.ok}/{score.total} richtig</span></div>
      <div className="rounded-card bg-surface p-5 shadow-card">
        <p className="text-xs text-ink-500">{sc.title}{sc.reviewStatus === "needs_verification" ? " · fachliche Verifikation ausstehend" : ""}</p>
        <figure className="my-3">
          <div className="flex justify-center rounded-xl bg-ink-100 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- statische SVG-Grafik */}
            <img src={`/media/questions/${sc.file}`} alt={sc.alt} className="max-h-80 w-auto max-w-full rounded-lg" />
          </div>
        </figure>
        <p className="text-lg font-medium">In welcher Reihenfolge dürfen die Fahrzeuge fahren? Tippe sie der Reihe nach an.</p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Fahrzeuge">
          {sc.vehicles.map((v) => {
            const pos = picked.indexOf(v.key);
            const correctPos = expected.indexOf(v.key);
            let cls = "border-ink-300 bg-surface";
            if (checked !== null) cls = pos === correctPos ? "border-success-500 bg-success-100" : "border-danger-500 bg-danger-100";
            else if (pos >= 0) cls = "border-brand-500 bg-brand-50";
            return (
              <button key={v.key} type="button" disabled={checked !== null} onClick={() => setPicked((p) => (p.includes(v.key) ? p.filter((x) => x !== v.key) : [...p, v.key]))} aria-pressed={pos >= 0} className={`min-h-11 rounded-full border-2 px-4 text-sm font-medium ${cls}`}>
                {pos >= 0 && <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs text-white">{pos + 1}</span>}{v.label}
              </button>
            );
          })}
        </div>
        {checked !== null && (
          <div className={`mt-4 rounded-xl p-3 text-sm ${checked ? "bg-success-100" : "bg-danger-100"}`} role="status">
            <p className="font-semibold">{checked ? "Richtig!" : `Nicht ganz. Richtige Reihenfolge: ${sc.order.map((g) => g.map(orderLabel).join(" und ")).join(", dann ")}`}</p>
            <p className="mt-1">{sc.explanation}</p>
            <p className="mt-1 text-xs text-ink-500">Rechtsgrundlage: {sc.legalReference}</p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        {checked === null ? <button type="button" onClick={check} disabled={picked.length !== expected.length} className={btn.primary}>Reihenfolge prüfen</button>
          : i + 1 < round.length ? <button type="button" onClick={next} className={btn.primary}>Weiter</button>
          : <><Confetti active={isDone && score.ok / round.length >= 0.8} /><span className="self-center text-sm">Fertig: {score.ok} von {round.length} richtig.</span><button type="button" onClick={restart} className={btn.primary}>Noch eine Runde</button><Link href="/lernen" className={btn.secondary}>Zur Übersicht</Link></>}
      </div>
    </div>
  );
}
