import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, StatTile } from "@/components/ui";

export default async function PlatformHome() {
  const db = await createSupabaseServerClient();
  const [{ count: schools }, { count: pendingRules }, { count: pendingQuestions }, { count: pendingKb }, { data: legal }] = await Promise.all([
    db.from("driving_schools").select("id", { count: "exact", head: true }),
    db.from("rule_versions").select("id", { count: "exact", head: true }).in("review_status", ["draft", "in_review", "needs_verification", "approved"]),
    db.from("theory_questions").select("id", { count: "exact", head: true }).in("status", ["draft", "in_review", "needs_verification", "approved"]),
    db.from("knowledge_entries").select("id", { count: "exact", head: true }).in("review_status", ["draft", "in_review", "needs_verification", "approved"]),
    db.from("rule_versions").select("legal_basis_date").eq("review_status", "published").order("legal_basis_date", { ascending: false }).limit(1).maybeSingle(),
  ]);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Plattform-Übersicht</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Fahrschulen" value={schools ?? 0} href="/plattform/fahrschulen" />
        <StatTile label="Regeln zu prüfen" value={pendingRules ?? 0} href="/plattform/regeln" />
        <StatTile label="Fragen zu prüfen" value={pendingQuestions ?? 0} href="/plattform/inhalte?tab=fragen" />
        <StatTile label="Wissensbasis zu prüfen" value={pendingKb ?? 0} href="/plattform/inhalte?tab=wissen" />
      </div>
      <Card title="Rechtsstand">
        <p className="text-sm">Aktuell veröffentlichter Rechtsstand: <strong>{legal?.legal_basis_date ? new Date(legal.legal_basis_date).toLocaleDateString("de-DE") : "keine veröffentlichte Regel"}</strong>. Änderungen an Prüfungs- oder Ausbildungsregeln werden als neue Version angelegt, fachlich geprüft und mit Gültigkeitsdatum veröffentlicht. Historische Prüfungsergebnisse bleiben an ihre Regelversion gebunden.</p>
        <Link href="/plattform/regeln" className="mt-2 inline-block text-sm text-brand-700 underline">Regelversionen verwalten</Link>
      </Card>
    </div>
  );
}
