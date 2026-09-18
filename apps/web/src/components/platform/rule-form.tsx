"use client";
import { useActionState } from "react";
import { createRuleVersion } from "@/lib/actions/platform";
import type { ActionResult } from "@/lib/actions/lessons";
import { btn, Alert } from "@/components/ui";

const EXAMPLES: Record<string, string> = {
  exam_theory: '{"questions_total": 30, "basic_questions": 20, "class_specific_questions": 10, "max_error_points": 10, "fail_if_two_five_point_questions_wrong": true, "time_limit_seconds": null}',
  exam_practical: '{"duration_minutes": 55, "min_driving_minutes": 25, "retry_wait_days": 14, "theory_validity_months": 12}',
  training_requirements: '{"unit_minutes": 45, "special_drives": {"overland": 5, "motorway": 4, "night": 3}}',
  theory_lessons: '{"unit_minutes": 90, "basic_units": 12, "class_specific_units": 2}',
};
const f = "w-full rounded-xl border border-ink-300 px-3 py-2";

export function RuleForm({ licenses }: { licenses: string[] }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(createRuleVersion, null);
  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      <div><label htmlFor="rule_type" className="mb-1 block text-sm font-medium">Regeltyp</label><select id="rule_type" name="rule_type" className={f} onChange={(e) => { const ta = document.getElementById("payload") as HTMLTextAreaElement | null; if (ta && !ta.value.trim()) ta.value = EXAMPLES[e.target.value] ?? ""; }}><option value="exam_theory">Theorieprüfung</option><option value="exam_practical">Praktische Prüfung</option><option value="training_requirements">Ausbildungsanforderungen</option><option value="theory_lessons">Theorieunterricht</option></select></div>
      <div><label htmlFor="license_code" className="mb-1 block text-sm font-medium">Klasse</label><select id="license_code" name="license_code" className={f}>{licenses.map((l) => <option key={l}>{l}</option>)}</select></div>
      <div><label htmlFor="acquisition_kind" className="mb-1 block text-sm font-medium">Erwerbsart</label><select id="acquisition_kind" name="acquisition_kind" className={f}><option value="first">Ersterwerb</option><option value="extension">Erweiterung</option><option value="any">Beide</option></select></div>
      <div><label htmlFor="valid_from" className="mb-1 block text-sm font-medium">Gültig ab</label><input id="valid_from" name="valid_from" type="date" required className={f} /></div>
      <div><label htmlFor="valid_until" className="mb-1 block text-sm font-medium">Gültig bis (optional)</label><input id="valid_until" name="valid_until" type="date" className={f} /></div>
      <div><label htmlFor="legal_basis_date" className="mb-1 block text-sm font-medium">Rechtsstand</label><input id="legal_basis_date" name="legal_basis_date" type="date" className={f} /></div>
      <div className="md:col-span-2"><label htmlFor="source" className="mb-1 block text-sm font-medium">Rechtsquelle</label><input id="source" name="source" required placeholder="z. B. FeV Anlage 7 Nr. 1, Prüfungsrichtlinie" className={f} /></div>
      <div className="md:col-span-2"><label htmlFor="payload" className="mb-1 block text-sm font-medium">Payload (JSON, wird gegen das Schema geprüft)</label><textarea id="payload" name="payload" rows={5} required className={`${f} font-mono text-sm`} defaultValue={EXAMPLES["exam_theory"]} /></div>
      <div className="md:col-span-2"><label htmlFor="notes" className="mb-1 block text-sm font-medium">Notizen</label><input id="notes" name="notes" className={f} /></div>
      {state?.message && <div className="md:col-span-2"><Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert></div>}
      <div className="md:col-span-2"><button className={btn.primary} disabled={pending}>{pending ? "Speichere …" : "Als Entwurf anlegen"}</button></div>
    </form>
  );
}
