import { useEffect, useState } from "react";
import { View } from "react-native";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/profile";
import { useTheme, fmtDate, fmtEur } from "@/lib/theme";
import { Card, Loading, Pill, Screen, Txt } from "@/components/ui";

const ST: Record<string, string> = { issued: "offen", partially_paid: "teilweise bezahlt", paid: "bezahlt", overdue: "überfällig", cancelled: "storniert", credited: "gutgeschrieben" };

export default function Finance() {
  const t = useTheme();
  const { profile } = useProfile();
  const [inv, setInv] = useState<Array<{ id: string; invoice_number: string | null; status: string; issued_at: string | null; due_at: string | null; gross_cents: number; paid_cents: number }> | null>(null);
  const [pay, setPay] = useState<Array<{ id: string; amount_cents: number; method: string; paid_at: string | null }>>([]);
  useEffect(() => { if (!profile) return; (async () => {
    const [{ data: i }, { data: p }] = await Promise.all([supabase.from("invoices").select("id, invoice_number, status, issued_at, due_at, gross_cents, paid_cents").eq("student_id", profile.studentId).neq("status", "draft").order("issued_at", { ascending: false }), supabase.from("payments").select("id, amount_cents, method, paid_at").eq("student_id", profile.studentId).eq("status", "succeeded").order("paid_at", { ascending: false }).limit(30)]);
    setInv(i ?? []); setPay(p ?? []);
  })(); }, [profile]);
  if (!inv) return <Screen title="Finanzen"><Loading /></Screen>;
  const total = inv.filter((i) => !["cancelled", "credited"].includes(i.status)).reduce((s, i) => s + i.gross_cents, 0);
  const paid = inv.reduce((s, i) => s + i.paid_cents, 0);
  return (
    <Screen title="Finanzen">
      <Card><View style={{ flexDirection: "row", justifyContent: "space-around" }}><View><Txt muted size={12}>Gesamt</Txt><Txt bold size={18}>{fmtEur(total)}</Txt></View><View><Txt muted size={12}>Bezahlt</Txt><Txt bold size={18} color={t.colors.status.success.text}>{fmtEur(paid)}</Txt></View><View><Txt muted size={12}>Offen</Txt><Txt bold size={18} color={total - paid > 0 ? t.colors.status.danger.text : undefined}>{fmtEur(Math.max(0, total - paid))}</Txt></View></View></Card>
      <Card title="Rechnungen">{inv.length === 0 ? <Txt muted>Noch keine Rechnung.</Txt> : inv.map((i) => <View key={i.id} style={{ paddingVertical: 6, gap: 2 }}><View style={{ flexDirection: "row", justifyContent: "space-between" }}><Txt bold>{i.invoice_number}</Txt><Txt>{fmtEur(i.gross_cents)}</Txt></View><View style={{ flexDirection: "row", justifyContent: "space-between" }}><Txt muted size={13}>{i.issued_at ? fmtDate(i.issued_at) : ""} · fällig {i.due_at ? fmtDate(i.due_at) : ""}</Txt><Pill color={i.status === "paid" ? t.colors.status.success.surface : i.status === "overdue" ? t.colors.status.danger.surface : undefined}>{ST[i.status] ?? i.status}</Pill></View></View>)}</Card>
      <Card title="Zahlungen">{pay.length === 0 ? <Txt muted>Noch keine Zahlung.</Txt> : pay.map((p) => <View key={p.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}><Txt>{p.paid_at ? fmtDate(p.paid_at) : ""} · {{ sepa_debit: "SEPA", card: "Karte", bank_transfer: "Überweisung", cash: "Bar" }[p.method] ?? p.method}</Txt><Txt>{fmtEur(p.amount_cents)}</Txt></View>)}</Card>
    </Screen>
  );
}
