import { NextResponse, type NextRequest } from "next/server";
import { overridesFromRows, planLearnReminder, render } from "@fahrpilot/notifications";
import { dunningPlan } from "@fahrpilot/payments";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { authorizeCron } from "@/lib/cron/auth";

export const dynamic = "force-dynamic";

/**
 * Tägliche Jobs: Lern-Erinnerung für Schüler ohne Aktivität, Mahnstufen für überfällige Rechnungen,
 * Ablauf von Wartelisten-Angeboten, abgelaufene Prüfungssimulationen, Löschlauf nach Aufbewahrungsfristen und
 * Stichtags-Aktivierung lizenzierter Fragenfassungen.
 */
export async function GET(request: NextRequest) {
  const denied = authorizeCron(request);
  if (denied) return denied;
  const admin = createSupabaseAdminClient();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  // 1) Lernerinnerung
  const [{ data: students }, { data: prefRows }, { data: goals }] = await Promise.all([
    admin.from("students").select("id, tenant_id, user_id, preferred_locale").eq("status", "active").not("user_id", "is", null),
    admin.from("notification_preferences").select("user_id, notification_type, push, email, in_app, quiet_hours_start, quiet_hours_end").eq("notification_type", "learn_reminder"),
    admin.from("daily_goals").select("student_id, answered").eq("goal_date", today),
  ]);
  const learned = new Set((goals ?? []).filter((g) => g.answered > 0).map((g) => g.student_id));
  const rows = [];
  for (const s of students ?? []) {
    if (learned.has(s.id)) continue;
    const p = planLearnReminder(null, overridesFromRows((prefRows ?? []).filter((r) => r.user_id === s.user_id) as never), now);
    if (!p) continue;
    const text = render(p.type, p.params, s.preferred_locale);
    rows.push({ tenant_id: s.tenant_id, user_id: s.user_id!, notification_type: p.type, title: text.title, body: text.body, data: p.data, channels: p.channels, scheduled_for: p.scheduled_for, dedupe_key: p.dedupe_key });
  }
  if (rows.length) await admin.from("notifications").upsert(rows, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true });
  // 2) Mahnwesen
  const { data: overdue } = await admin.from("invoices").select("id, tenant_id, student_id, invoice_number, due_at, gross_cents, paid_cents, dunning_level, dunning_last_at, status, students(user_id)").in("status", ["issued", "partially_paid", "overdue"]).lt("due_at", today);
  let dunned = 0;
  for (const inv of overdue ?? []) {
    const plan = dunningPlan({ status: inv.status, due_at: inv.due_at, dunning_level: inv.dunning_level, dunning_last_at: inv.dunning_last_at, gross_cents: inv.gross_cents, paid_cents: inv.paid_cents }, today);
    if (inv.status !== "overdue") await admin.from("invoices").update({ status: "overdue" }).eq("id", inv.id);
    if (plan.action !== "send") continue;
    const nextLevel = plan.level;
    await admin.from("invoices").update({ status: "overdue", dunning_level: Math.min(3, nextLevel), dunning_last_at: today }).eq("id", inv.id);
    const userId = (inv.students as unknown as { user_id: string | null } | null)?.user_id;
    if (userId) await admin.from("notifications").upsert({ tenant_id: inv.tenant_id, user_id: userId, notification_type: "invoice_due", title: `Zahlungserinnerung ${inv.invoice_number}`, body: `Die Rechnung ${inv.invoice_number} ist seit dem ${new Date(inv.due_at!).toLocaleDateString("de-DE")} fällig. Offen: ${((inv.gross_cents - inv.paid_cents) / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}.`, data: { invoice_id: inv.id, dunning_level: nextLevel }, channels: ["push", "email", "in_app"], dedupe_key: `invoice_due:${inv.id}:${nextLevel}` }, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true });
    dunned++;
  }
  // 3) Aufräumen
  const { count: expiredOffers } = await admin.from("waitlist_offers").update({ response: "expired", responded_at: now.toISOString() }, { count: "exact" }).is("response", null).lt("expires_at", now.toISOString());
  const { data: stillOffered } = await admin.from("waitlist_entries").select("id, waitlist_offers(response)").eq("status", "offered");
  const reactivate = (stillOffered ?? []).filter((w) => !((w.waitlist_offers as unknown as Array<{ response: string | null }>) ?? []).some((o) => o.response === null)).map((w) => w.id);
  if (reactivate.length) await admin.from("waitlist_entries").update({ status: "active" }).in("id", reactivate);
  const { count: abandoned } = await admin.from("exam_simulations").update({ status: "abandoned" }, { count: "exact" }).eq("status", "in_progress").lt("started_at", new Date(now.getTime() - 6 * 3_600_000).toISOString());
  await admin.from("waitlist_entries").update({ status: "expired" }).eq("status", "active").lt("latest", now.toISOString());
  // 4) Löschlauf nach Aufbewahrung: Dokumente mit abgelaufener Frist (retention_until) samt Datei entfernen.
  //    Die Frist setzt das Büro je Dokument bzw. sie folgt aus der Aufbewahrungsregel (retention_policies) beim Anlegen.
  const { data: expiredDocs } = await admin.from("documents").select("id, storage_path").lt("retention_until", today).limit(500);
  let purgedDocuments = 0;
  if (expiredDocs && expiredDocs.length > 0) {
    const paths = expiredDocs.map((d) => d.storage_path).filter((p): p is string => !!p);
    if (paths.length) await admin.storage.from("documents").remove(paths);
    const { count } = await admin.from("documents").delete({ count: "exact" }).in("id", expiredDocs.map((d) => d.id));
    purgedDocuments = count ?? 0;
  }
  // Pseudonymisierte Datenschutzanfragen nach Ablauf der Aufbewahrungsfrist endgültig entfernen (Betroffener ist bereits gelöscht).
  const { count: purgedRequests } = await admin.from("data_requests").delete({ count: "exact" }).eq("kind", "deletion").eq("status", "completed").lt("legal_hold_until", today);
  const { data: endedSupport } = await admin.rpc("expire_support_sessions");
  // 5) Stichtage lizenzierter Fragenkataloge (1. April, 1. Oktober): fällige Fassungen aktivieren
  const { data: activatedVersions } = await admin.rpc("activate_due_question_versions");
  return NextResponse.json({ activatedVersions: activatedVersions ?? 0, learnReminders: rows.length, dunned, expiredOffers: expiredOffers ?? 0, abandonedSimulations: abandoned ?? 0, purgedDocuments, purgedRequests: purgedRequests ?? 0, endedSupportSessions: endedSupport ?? 0 });
}
