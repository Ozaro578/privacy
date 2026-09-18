import { NextResponse, type NextRequest } from "next/server";
import { dispatch, ExpoPushSender, SmtpEmailSender, overridesFromRows, resolvePreference, type PushToken, type NotificationType } from "@fahrpilot/notifications";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { authorizeCron } from "@/lib/cron/auth";

export const dynamic = "force-dynamic";

function senders() {
  const push = [new ExpoPushSender(process.env.EXPO_ACCESS_TOKEN ? { accessToken: process.env.EXPO_ACCESS_TOKEN } : {})];
  const email = process.env.SMTP_HOST ? new SmtpEmailSender({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 587), secure: process.env.SMTP_SECURE === "true", user: process.env.SMTP_USER ?? "", password: process.env.SMTP_PASSWORD ?? "", from: process.env.SMTP_FROM ?? "FahrPilot <noreply@localhost>" }) : undefined;
  return { push, ...(email ? { email } : {}) };
}

/** Versendet fällige Benachrichtigungen (scheduled_for <= jetzt, sent_at null) per Push und E-Mail nach Nutzerpräferenz. */
export async function GET(request: NextRequest) {
  const denied = authorizeCron(request);
  if (denied) return denied;
  const admin = createSupabaseAdminClient();
  const { data: due } = await admin.from("notifications").select("id, user_id, notification_type, title, body, data, channels").is("sent_at", null).lte("scheduled_for", new Date().toISOString()).order("scheduled_for").limit(300);
  if (!due?.length) return NextResponse.json({ sent: 0 });
  const userIds = [...new Set(due.map((n) => n.user_id))];
  const [{ data: tokens }, { data: prefRows }, { data: users }] = await Promise.all([
    admin.from("push_tokens").select("user_id, provider, token, locale").in("user_id", userIds),
    admin.from("notification_preferences").select("user_id, notification_type, push, email, in_app, quiet_hours_start, quiet_hours_end").in("user_id", userIds),
    admin.from("users").select("id, email").in("id", userIds),
  ]);
  const s = senders();
  const invalid = new Set<string>();
  let sent = 0, failed = 0;
  for (const n of due) {
    const prefs = overridesFromRows((prefRows ?? []).filter((p) => p.user_id === n.user_id) as never);
    const pref = resolvePreference(n.notification_type as NotificationType, prefs);
    const userTokens: PushToken[] = (tokens ?? []).filter((t) => t.user_id === n.user_id).map((t) => ({ provider: t.provider as PushToken["provider"], token: t.token, locale: t.locale }));
    const email = (users ?? []).find((u) => u.id === n.user_id)?.email ?? null;
    try {
      const result = await dispatch({ id: n.id, user_id: n.user_id, type: n.notification_type as NotificationType, title: n.title, body: n.body, data: (n.data as Record<string, unknown>) ?? {} }, pref, userTokens, s, { email });
      result.invalidTokens.forEach((t) => invalid.add(t));
      await admin.from("notifications").update({ sent_at: new Date().toISOString(), channels: result.channels.length ? result.channels : ["in_app"] }).eq("id", n.id);
      sent++;
    } catch {
      failed++;
    }
  }
  if (invalid.size) await admin.from("push_tokens").delete().in("token", [...invalid]);
  return NextResponse.json({ sent, failed, invalidTokens: invalid.size });
}
