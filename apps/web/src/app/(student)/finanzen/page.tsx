import { getStudentContext } from "@/lib/data/student";
import { loadTrainingStatus } from "@/lib/data/training";
import { Card, fmt, Pill } from "@/components/ui";

export const metadata = { title: "Finanzen" };

const STATUS: Record<string, { label: string; tone: "neutral" | "brand" | "success" | "warn" | "danger" }> = { draft: { label: "Entwurf", tone: "neutral" }, issued: { label: "offen", tone: "brand" }, partially_paid: { label: "teilweise bezahlt", tone: "warn" }, paid: { label: "bezahlt", tone: "success" }, overdue: { label: "überfällig", tone: "danger" }, cancelled: { label: "storniert", tone: "neutral" }, credited: { label: "gutgeschrieben", tone: "neutral" } };

export default async function FinancePage() {
  const ctx = await getStudentContext();
  const [{ data: invoices }, { data: payments }, { data: mandates }, status] = await Promise.all([
    ctx.db.from("invoices").select("id, invoice_number, status, issued_at, due_at, gross_cents, paid_cents, dunning_level, pdf_path, invoice_items(description, quantity, unit_net_cents, vat_rate, price_item_code)").eq("student_id", ctx.student.id).neq("status", "draft").order("issued_at", { ascending: false }),
    ctx.db.from("payments").select("id, amount_cents, method, status, paid_at, receipt_path, invoice_id").eq("student_id", ctx.student.id).order("created_at", { ascending: false }).limit(50),
    ctx.db.from("payment_mandates").select("id, method, status, masked_iban, mandate_reference").eq("student_id", ctx.student.id),
    loadTrainingStatus(ctx),
  ]);
  const inv = invoices ?? [];
  const total = inv.filter((i) => !["cancelled", "credited"].includes(i.status)).reduce((s, i) => s + i.gross_cents, 0);
  const paid = inv.reduce((s, i) => s + i.paid_cents, 0);
  const open = Math.max(0, total - paid);
  const byCategory = new Map<string, number>();
  for (const i of inv) for (const it of (i.invoice_items ?? []) as Array<{ description: string; quantity: number; unit_net_cents: number; vat_rate: number; price_item_code: string | null }>) {
    const key = it.price_item_code?.startsWith("lesson_") ? (it.price_item_code === "lesson_practice" ? "Fahrstunden" : "Sonderfahrten") : it.price_item_code?.startsWith("exam") ? "Prüfungsleistungen" : it.price_item_code === "base_fee" ? "Grundbetrag" : "Weitere Leistungen";
    byCategory.set(key, (byCategory.get(key) ?? 0) + Math.round(it.quantity * it.unit_net_cents * (1 + Number(it.vat_rate) / 100)));
  }
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Finanzen</h1>
      <Card>
        <dl className="grid grid-cols-3 gap-3 text-center">
          <div><dt className="text-xs text-ink-500">Gesamtkosten bisher</dt><dd className="text-xl font-bold tabular-nums">{fmt.eur(total)}</dd></div>
          <div><dt className="text-xs text-ink-500">Bezahlt</dt><dd className="text-xl font-bold tabular-nums text-success-500">{fmt.eur(paid)}</dd></div>
          <div><dt className="text-xs text-ink-500">Offen</dt><dd className={`text-xl font-bold tabular-nums ${open > 0 ? "text-danger-500" : ""}`}>{fmt.eur(open)}</dd></div>
        </dl>
        {byCategory.size > 0 && <ul className="mt-4 divide-y divide-ink-100 text-sm">{[...byCategory.entries()].map(([k, v]) => <li key={k} className="flex justify-between py-1"><span>{k}</span><span className="tabular-nums">{fmt.eur(v)}</span></li>)}</ul>}
        {status.forecast && <div className="mt-4 rounded-lg bg-ink-100 p-3 text-sm"><p>{status.forecast.text}</p><p className="mt-1 text-xs text-ink-500">{status.forecast.disclaimer}</p></div>}
      </Card>
      <Card title="Rechnungen">
        {inv.length === 0 ? <p className="text-sm text-ink-700">Noch keine Rechnung ausgestellt.</p> : (
          <ul className="divide-y divide-ink-100">{inv.map((i) => { const s = STATUS[i.status] ?? { label: i.status, tone: "neutral" as const }; return (
            <li key={i.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{i.invoice_number} <span className="font-normal text-ink-700">· {fmt.date(i.issued_at)}</span></p><span className="flex items-center gap-2"><span className="tabular-nums">{fmt.eur(i.gross_cents)}</span><Pill tone={s.tone}>{s.label}</Pill>{i.dunning_level > 0 && <Pill tone="danger">Mahnstufe {i.dunning_level}</Pill>}</span></div>
              <ul className="mt-1 text-sm text-ink-700">{((i.invoice_items ?? []) as Array<{ description: string; quantity: number; unit_net_cents: number }>).map((it, k) => <li key={k}>{it.quantity} × {it.description}</li>)}</ul>
              <p className="mt-1 text-xs text-ink-500">Fällig am {fmt.date(i.due_at)} · bezahlt {fmt.eur(i.paid_cents)}{i.pdf_path && <> · <a href={`/api/files?path=${encodeURIComponent(i.pdf_path)}`} className="text-brand-700 underline">PDF</a></>}</p>
            </li>
          ); })}</ul>
        )}
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Zahlungen">
          {(payments ?? []).length === 0 ? <p className="text-sm text-ink-700">Noch keine Zahlung.</p> : <ul className="divide-y divide-ink-100 text-sm">{(payments ?? []).map((pm) => <li key={pm.id} className="flex justify-between py-2"><span>{fmt.date(pm.paid_at)} · {{ sepa_debit: "SEPA-Lastschrift", card: "Karte", bank_transfer: "Überweisung", cash: "Bar", other: "Sonstiges" }[pm.method] ?? pm.method}{pm.receipt_path && <> · <a href={`/api/files?path=${encodeURIComponent(pm.receipt_path)}`} className="text-brand-700 underline">Beleg</a></>}</span><span className="tabular-nums">{fmt.eur(pm.amount_cents)}</span></li>)}</ul>}
        </Card>
        <Card title="Zahlungsart">
          {(mandates ?? []).length === 0 ? <p className="text-sm text-ink-700">Noch kein SEPA-Mandat hinterlegt. Die Fahrschule richtet die Zahlungsart mit dir ein.</p> : <ul className="text-sm">{(mandates ?? []).map((m) => <li key={m.id}>{m.method === "sepa_debit" ? "SEPA-Lastschrift" : m.method} {m.masked_iban ?? ""} <Pill tone={m.status === "active" ? "success" : "neutral"}>{m.status}</Pill>{m.mandate_reference && <span className="block text-xs text-ink-500">Mandatsreferenz {m.mandate_reference}</span>}</li>)}</ul>}
        </Card>
      </div>
    </div>
  );
}
