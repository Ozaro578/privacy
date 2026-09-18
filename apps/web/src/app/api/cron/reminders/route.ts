import { NextResponse, type NextRequest } from "next/server";
import { overridesFromRows, planExamCountdown, planLessonReminders, planTheoryClassReminder, planVehicleReminders, render, type PlannedNotification } from "@fahrpilot/notifications";
import type { Json } from "@fahrpilot/db";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { authorizeCron } from "@/lib/cron/auth";
import { parseRange } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * Plant Erinnerungen (Fahrstunde 24h/2h, Theorieunterricht, Prüfungs-Countdown, Fahrzeug-HU/Wartung) für die nächsten 8 Tage
 * und legt sie idempotent (user_id + dedupe_key) in notifications ab. Der Versand passiert in /api/cron/dispatch.
 */
export async function GET(request: NextRequest) {
  const denied = authorizeCron(request);
  if (denied) return denied;
  const admin = createSupabaseAdminClient();
  const now = new Date();
  const horizon = new Date(now.getTime() + 8 * 86_400_000).toISOString();
  const [{ data: lessons }, { data: classes }, { data: theoryExams }, { data: practicalExams }, { data: vehicles }, { data: prefRows }] = await Promise.all([
    admin.from("lessons").select("id, tenant_id, period, status, meeting_point, instructors(display_name), students(user_id, preferred_locale)").in("status", ["booked", "confirmed"]).gte("period", `[${now.toISOString()},)`).lte("period", `[${horizon},)`).not("student_id", "is", null),
    admin.from("attendance").select("student_id, status, theory_classes!inner(id, tenant_id, title, period, status), students(user_id, preferred_locale)").in("status", ["registered", "present"]).gte("theory_classes.period", `[${now.toISOString()},)`).lte("theory_classes.period", `[${horizon},)`),
    admin.from("theory_exams").select("id, tenant_id, scheduled_at, student_licenses!inner(students(user_id, preferred_locale))").eq("status", "scheduled").gte("scheduled_at", now.toISOString()),
    admin.from("practical_exams").select("id, tenant_id, scheduled_at, student_licenses!inner(students(user_id, preferred_locale))").eq("status", "scheduled").gte("scheduled_at", now.toISOString()),
    admin.from("vehicles").select("id, tenant_id, license_plate, next_inspection_due, next_service_due").eq("status", "active"),
    admin.from("notification_preferences").select("user_id, notification_type, push, email, in_app, quiet_hours_start, quiet_hours_end"),
  ]);
  const prefsByUser = new Map<string, ReturnType<typeof overridesFromRows>>();
  for (const r of prefRows ?? []) {
    const list = (prefsByUser.get(r.user_id) ?? overridesFromRows([]));
    prefsByUser.set(r.user_id, { ...list, ...overridesFromRows([r as never]) });
  }
  const prefs = (userId: string) => prefsByUser.get(userId);
  const rows: Array<{ tenant_id: string | null; user_id: string; notification_type: string; title: string; body: string; data: Json; channels: string[]; scheduled_for: string; dedupe_key: string }> = [];
  const push = (tenantId: string | null, userId: string, locale: string | null | undefined, p: PlannedNotification) => {
    const text = render(p.type, p.params as never, locale ?? "de");
    rows.push({ tenant_id: tenantId, user_id: userId, notification_type: p.type, title: text.title, body: text.body, data: p.data as Json, channels: p.channels, scheduled_for: p.scheduled_for, dedupe_key: p.dedupe_key });
  };
  for (const l of lessons ?? []) {
    const st = l.students as unknown as { user_id: string | null; preferred_locale: string } | null;
    if (!st?.user_id) continue;
    const { start } = parseRange(l.period as unknown as string);
    for (const p of planLessonReminders({ id: l.id, starts_at: start, status: l.status, instructor_name: (l.instructors as unknown as { display_name: string } | null)?.display_name ?? "", meeting_point: l.meeting_point }, prefs(st.user_id), now)) push(l.tenant_id, st.user_id, st.preferred_locale, p);
  }
  for (const a of classes ?? []) {
    const st = a.students as unknown as { user_id: string | null; preferred_locale: string } | null;
    const c = a.theory_classes as unknown as { id: string; tenant_id: string; title: string; period: string; status: string };
    if (!st?.user_id) continue;
    const p = planTheoryClassReminder({ id: c.id, title: c.title, starts_at: parseRange(c.period).start, status: c.status }, prefs(st.user_id), now);
    if (p) push(c.tenant_id, st.user_id, st.preferred_locale, p);
  }
  const exams = [...(theoryExams ?? []).map((e) => ({ ...e, kind: "theory" as const })), ...(practicalExams ?? []).map((e) => ({ ...e, kind: "practical" as const }))];
  for (const e of exams) {
    const st = (e.student_licenses as unknown as { students: { user_id: string | null; preferred_locale: string } | null } | null)?.students;
    if (!st?.user_id || !e.scheduled_at) continue;
    for (const p of planExamCountdown({ id: e.id, kind: e.kind, at: e.scheduled_at }, prefs(st.user_id), now)) push(e.tenant_id, st.user_id, st.preferred_locale, p);
  }
  // Fahrzeug-Erinnerungen gehen an Büro/Admin des Tenants
  const tenantIds = [...new Set((vehicles ?? []).map((v) => v.tenant_id))];
  const { data: office } = tenantIds.length ? await admin.from("tenant_memberships").select("tenant_id, user_id").in("tenant_id", tenantIds).in("role", ["office", "admin", "owner"]).eq("status", "active") : { data: [] };
  for (const v of vehicles ?? []) {
    const planned = planVehicleReminders({ id: v.id, license_plate: v.license_plate, next_inspection_due: v.next_inspection_due, next_service_due: v.next_service_due }, now);
    for (const m of (office ?? []).filter((o) => o.tenant_id === v.tenant_id)) for (const p of planned) push(v.tenant_id, m.user_id, "de", { ...p, dedupe_key: `${p.dedupe_key}:${m.user_id}` });
  }
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const { data, error } = await admin.from("notifications").upsert(rows.slice(i, i + 200), { onConflict: "user_id,dedupe_key", ignoreDuplicates: true }).select("id");
    if (error) return NextResponse.json({ error: error.message, planned: rows.length, inserted }, { status: 500 });
    inserted += data?.length ?? 0;
  }
  return NextResponse.json({ planned: rows.length, inserted });
}
