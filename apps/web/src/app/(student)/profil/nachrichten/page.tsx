import { getStudentContext } from "@/lib/data/student";
import { Card, fmt } from "@/components/ui";
import { MessageThread } from "@/components/profile/messages";

export const metadata = { title: "Nachrichten" };

export default async function MessagesPage() {
  const ctx = await getStudentContext();
  const [{ data: convs }, { data: notifications }] = await Promise.all([
    ctx.db.from("conversations").select("id, kind, subject, last_message_at, conversation_participants(user_id, last_read_at, users(first_name, last_name))").eq("student_id", ctx.student.id).order("last_message_at", { ascending: false }),
    ctx.db.from("notifications").select("id, title, body, created_at, read_at, notification_type").eq("user_id", ctx.userId).order("created_at", { ascending: false }).limit(30),
  ]);
  await ctx.db.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", ctx.userId).is("read_at", null);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Nachrichten</h1>
      <MessageThread conversations={(convs ?? []).map((c) => ({ id: c.id, kind: c.kind, subject: c.subject, participants: ((c.conversation_participants ?? []) as Array<{ user_id: string; users: { first_name: string; last_name: string } | null }>).filter((p) => p.user_id !== ctx.userId).map((p) => `${p.users?.first_name ?? ""} ${p.users?.last_name ?? ""}`.trim()) }))} userId={ctx.userId} tenantId={ctx.tenantId} />
      <Card title="Mitteilungen">
        {(notifications ?? []).length === 0 ? <p className="text-sm text-ink-700">Keine Mitteilungen.</p> : <ul className="divide-y divide-ink-100 text-sm">{(notifications ?? []).map((n) => <li key={n.id} className="py-2"><p className="font-medium">{n.title}</p><p className="text-ink-700">{n.body}</p><p className="text-xs text-ink-500">{fmt.date(n.created_at)} {fmt.time(n.created_at)}</p></li>)}</ul>}
      </Card>
    </div>
  );
}
