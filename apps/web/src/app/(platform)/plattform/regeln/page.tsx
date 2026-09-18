import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, Pill, fmt } from "@/components/ui";
import { WorkflowButtons } from "@/components/platform/workflow-buttons";
import { RuleForm } from "@/components/platform/rule-form";

const TYPE: Record<string, string> = { exam_theory: "Theorieprüfung", exam_practical: "Praktische Prüfung", training_requirements: "Ausbildung", theory_lessons: "Theorieunterricht" };
const TONE: Record<string, "neutral" | "brand" | "success" | "warn" | "danger"> = { draft: "neutral", in_review: "brand", approved: "brand", published: "success", retired: "neutral", needs_verification: "warn" };

export default async function RulesPage() {
  const db = await createSupabaseServerClient();
  const [{ data: rules }, { data: licenses }] = await Promise.all([
    db.from("rule_versions").select("*").order("rule_type").order("license_code").order("version", { ascending: false }),
    db.from("licenses").select("code").eq("active", true).order("sort_order"),
  ]);
  const grouped = new Map<string, NonNullable<typeof rules>>();
  for (const r of rules ?? []) { const k = `${r.rule_type}|${r.license_code}|${r.acquisition_kind}`; grouped.set(k, [...(grouped.get(k) ?? []), r]); }
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Regelversionen</h1>
      <p className="text-sm text-ink-700">Gesetzliche und prüfungsbezogene Werte werden hier versioniert. Workflow: Entwurf, fachliche Prüfung, Freigabe, Veröffentlichung, Versionierung. Werte mit Status „fachlich zu verifizieren“ werden Schülern nur mit Kennzeichnung angezeigt.</p>
      <Card title="Neue Version anlegen"><RuleForm licenses={(licenses ?? []).map((l) => l.code)} /></Card>
      {[...grouped.entries()].map(([key, list]) => { const [type, code, acq] = key.split("|"); return (
        <Card key={key} title={`${TYPE[type!] ?? type} · Klasse ${code} · ${acq === "first" ? "Ersterwerb" : acq === "extension" ? "Erweiterung" : "beide"}`}>
          <ul className="divide-y divide-ink-100">{list.map((r) => (
            <li key={r.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">Version {r.version} · gültig ab {fmt.date(r.valid_from)}{r.valid_until ? ` bis ${fmt.date(r.valid_until)}` : ""} <Pill tone={TONE[r.review_status] ?? "neutral"}>{r.review_status}</Pill></p>
                <WorkflowButtons status={r.review_status} target={{ kind: "rule", id: r.id }} />
              </div>
              <p className="mt-1 text-xs text-ink-500">Quelle: {r.source}{r.legal_basis_date ? ` · Rechtsstand ${fmt.date(r.legal_basis_date)}` : ""}{r.reviewed_at ? ` · geprüft ${fmt.date(r.reviewed_at)}` : ""}{r.notes ? ` · ${r.notes}` : ""}</p>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-ink-100 p-2 text-xs">{JSON.stringify(r.payload, null, 1)}</pre>
            </li>
          ))}</ul>
        </Card>
      ); })}
    </div>
  );
}
