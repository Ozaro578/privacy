"use client";
import { useState, useTransition } from "react";
import { transitionContent, transitionRuleVersion } from "@/lib/actions/platform";
import { btn } from "@/components/ui";

const NEXT: Record<string, Array<[string, string]>> = { draft: [["in_review", "Zur fachlichen Prüfung"], ["retired", "Verwerfen"]], needs_verification: [["in_review", "Zur fachlichen Prüfung"], ["retired", "Verwerfen"]], in_review: [["approved", "Freigeben"], ["draft", "Zurück an Entwurf"]], approved: [["published", "Veröffentlichen"], ["draft", "Zurück an Entwurf"]], published: [["retired", "Zurückziehen"]], retired: [] };

export function WorkflowButtons({ status, target }: { status: string; target: { kind: "rule"; id: string } | { kind: "content"; table: "theory_questions" | "knowledge_entries" | "chapters" | "practical_check_questions"; id: string } }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const options = NEXT[status] ?? [];
  if (options.length === 0) return <span className="text-xs text-ink-500">abgeschlossen</span>;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`c-${target.id}`}>Kommentar</label>
      <input id={`c-${target.id}`} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Kommentar" className="w-40 rounded-lg border border-ink-300 px-2 py-1 text-sm" />
      {options.map(([to, label]) => <button key={to} type="button" disabled={pending} className={to === "published" ? btn.primary : to === "retired" ? btn.danger : btn.secondary} onClick={() => start(async () => { const r = target.kind === "rule" ? await transitionRuleVersion(target.id, to, comment) : await transitionContent(target.table, target.id, to, comment); setMsg(r.message); })}>{label}</button>)}
      {msg && <span className="text-xs" role="status">{msg}</span>}
    </div>
  );
}
