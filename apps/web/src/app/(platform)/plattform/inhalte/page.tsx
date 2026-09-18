import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, Pill } from "@/components/ui";
import { WorkflowButtons } from "@/components/platform/workflow-buttons";

const TONE: Record<string, "neutral" | "brand" | "success" | "warn" | "danger"> = { draft: "neutral", in_review: "brand", approved: "brand", published: "success", retired: "neutral", needs_verification: "warn" };

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ tab?: string; status?: string }> }) {
  const p = await searchParams;
  const tab = p.tab ?? "fragen";
  const status = p.status ?? "offen";
  const db = await createSupabaseServerClient();
  const open = ["draft", "in_review", "needs_verification", "approved"];
  const tabs = [["fragen", "Übungsfragen"], ["wissen", "Wissensbasis"], ["kapitel", "Lernkapitel"], ["pruefer", "Prüfer-Fragen"]];
  let items: Array<{ id: string; title: string; meta: string; status: string; table: "theory_questions" | "knowledge_entries" | "chapters" | "practical_check_questions" }> = [];
  if (tab === "fragen") {
    let q = db.from("theory_questions").select("id, status, points, source, external_ref, topics(code), question_versions!theory_questions_current_version_fk(text, legal_reference)").order("updated_at", { ascending: false }).limit(200);
    q = status === "offen" ? q.in("status", open) : q.eq("status", status);
    const { data } = await q;
    items = (data ?? []).map((d) => { const v = d.question_versions as unknown as { text: string; legal_reference: string | null } | null; return { id: d.id, title: v?.text ?? "(ohne Version)", meta: `${(d.topics as unknown as { code: string } | null)?.code ?? ""} · ${d.points} Punkte · ${d.source}${d.external_ref ? ` · ${d.external_ref}` : ""}${v?.legal_reference ? ` · ${v.legal_reference}` : ""}`, status: d.status, table: "theory_questions" }; });
  } else if (tab === "wissen") {
    let q = db.from("knowledge_entries").select("id, review_status, title, slug, legal_reference, legal_basis_date, version").order("updated_at", { ascending: false }).limit(200);
    q = status === "offen" ? q.in("review_status", open) : q.eq("review_status", status);
    const { data } = await q;
    items = (data ?? []).map((d) => ({ id: d.id, title: d.title, meta: `${d.slug} v${d.version}${d.legal_reference ? ` · ${d.legal_reference}` : ""} · Rechtsstand ${d.legal_basis_date}`, status: d.review_status, table: "knowledge_entries" }));
  } else if (tab === "kapitel") {
    let q = db.from("chapters").select("id, review_status, title, version, source, topics(code)").order("updated_at", { ascending: false }).limit(200);
    q = status === "offen" ? q.in("review_status", open) : q.eq("review_status", status);
    const { data } = await q;
    items = (data ?? []).map((d) => ({ id: d.id, title: d.title, meta: `${(d.topics as unknown as { code: string } | null)?.code ?? ""} · v${d.version}${d.source ? ` · ${d.source}` : ""}`, status: d.review_status, table: "chapters" }));
  } else {
    let q = db.from("practical_check_questions").select("id, review_status, question, category, source").order("updated_at", { ascending: false }).limit(200);
    q = status === "offen" ? q.in("review_status", open) : q.eq("review_status", status);
    const { data } = await q;
    items = (data ?? []).map((d) => ({ id: d.id, title: d.question, meta: `${d.category}${d.source ? ` · ${d.source}` : ""}`, status: d.review_status, table: "practical_check_questions" }));
  }
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Inhalte und Freigaben</h1>
      <p className="text-sm text-ink-700">Keine KI-generierte Information wird automatisch veröffentlicht. Jeder Eintrag durchläuft Entwurf, fachliche Prüfung, Freigabe und Veröffentlichung (Vier-Augen-Prinzip). Eigene Übungsfragen sind strikt von lizenzierten amtlichen Fragen getrennt (Feld source).</p>
      <div className="flex flex-wrap gap-2">{tabs.map(([k, l]) => <Link key={k} href={`/plattform/inhalte?tab=${k}&status=${status}`} className={`rounded-full px-3 py-1 text-sm ${tab === k ? "bg-brand-500 text-white" : "bg-ink-100"}`}>{l}</Link>)}
        <span className="mx-2 text-ink-300">|</span>{["offen", "published", "retired"].map((s) => <Link key={s} href={`/plattform/inhalte?tab=${tab}&status=${s}`} className={`rounded-full px-3 py-1 text-sm ${status === s ? "bg-ink-900 text-white" : "bg-ink-100"}`}>{s === "offen" ? "Offen" : s === "published" ? "Veröffentlicht" : "Zurückgezogen"}</Link>)}</div>
      <Card>
        {items.length === 0 ? <p className="text-sm text-ink-700">Keine Einträge.</p> : (
          <ul className="divide-y divide-ink-100">{items.map((it) => (
            <li key={it.id} className="py-3">
              <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0 flex-1"><p className="font-medium">{it.title}</p><p className="text-xs text-ink-500">{it.meta}</p></div><Pill tone={TONE[it.status] ?? "neutral"}>{it.status}</Pill></div>
              <div className="mt-2"><WorkflowButtons status={it.status} target={{ kind: "content", table: it.table, id: it.id }} /></div>
            </li>
          ))}</ul>
        )}
      </Card>
    </div>
  );
}
