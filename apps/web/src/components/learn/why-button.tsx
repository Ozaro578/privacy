"use client";
import { useState, useTransition } from "react";
import { explainQuestionAction, type WhyExplanation } from "@/lib/actions/coach";
import { btn } from "@/components/ui";

/** Warum-Button: geprüfte Erklärung aus der Wissensbasis, optional vom KI-Coach umformuliert. */
export function WhyButton({ questionId, selected }: { questionId: string; selected: number[] }) {
  const [data, setData] = useState<WhyExplanation | null>(null);
  const [style, setStyle] = useState<"simple" | "detailed" | "example" | "mnemonic">("simple");
  const [pending, start] = useTransition();
  function load(s = style) {
    start(async () => { setData(await explainQuestionAction({ questionId, selected, style: s })); });
  }
  return (
    <div className="w-full">
      {!data ? <button type="button" onClick={() => load()} disabled={pending} className={btn.secondary}>{pending ? "Erkläre …" : "Warum?"}</button> : (
        <div className="mt-2 rounded-xl border border-ink-100 bg-surface p-3 text-sm">
          <div className="mb-2 flex flex-wrap gap-1">
            {(["simple", "detailed", "example", "mnemonic"] as const).map((s) => <button key={s} type="button" onClick={() => { setStyle(s); load(s); }} className={`rounded-full px-2.5 py-1 text-xs ${style === s ? "bg-brand-500 text-white" : "bg-ink-100"}`}>{{ simple: "Einfach", detailed: "Ausführlich", example: "Mit Beispiel", mnemonic: "Merksatz" }[s]}</button>)}
          </div>
          <p className="font-medium">Warum die richtige Antwort richtig ist</p>
          <p>{data.whyCorrect}</p>
          {data.whyOthersWrong.length > 0 && <><p className="mt-2 font-medium">Warum die anderen falsch sind</p><ul className="list-disc pl-5">{data.whyOthersWrong.map((w, i) => <li key={i}>{w}</li>)}</ul></>}
          {data.rule && <p className="mt-2"><span className="font-medium">Regel:</span> {data.rule}</p>}
          {data.mnemonic && <p className="mt-1"><span className="font-medium">Merksatz:</span> {data.mnemonic}</p>}
          {data.example && <p className="mt-1"><span className="font-medium">Beispiel:</span> {data.example}</p>}
          <p className="mt-2 text-xs text-ink-500">{data.confidence === "verified" ? "Geprüfte Quelle" : data.confidence === "partial" ? "Teilweise belegt" : "Ohne geprüfte Quelle. Bitte mit dem Fahrlehrer klären."}{data.sources.length ? ` · ${data.sources.join(", ")}` : ""}{data.legalBasisDate ? ` · Rechtsstand ${new Date(data.legalBasisDate).toLocaleDateString("de-DE")}` : ""}</p>
        </div>
      )}
    </div>
  );
}
