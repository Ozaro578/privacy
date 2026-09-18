import { getInstructorContext, loadInstructorConversations, loadStudentsForConversation } from "@/lib/data/instructor";
import { Card, fmt } from "@/components/ui";
import { InstructorMessages } from "@/components/instructor/instructor-messages";

export const metadata = { title: "Nachrichten" };

export default async function InstructorMessagesPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const ctx = await getInstructorContext();
  const [conversations, students, { data: notifications }] = await Promise.all([
    loadInstructorConversations(ctx), loadStudentsForConversation(ctx),
    ctx.db.from("notifications").select("id, title, body, created_at, read_at").eq("user_id", ctx.userId).order("created_at", { ascending: false }).limit(20),
  ]);
  await ctx.db.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", ctx.userId).is("read_at", null);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Nachrichten</h1>
      <InstructorMessages conversations={conversations} students={students} userId={ctx.userId} initialId={c ?? null} />
      <Card title="Mitteilungen">
        {(notifications ?? []).length === 0 ? <p className="text-sm text-ink-700">Keine Mitteilungen.</p> : <ul className="divide-y divide-ink-100 text-sm">{(notifications ?? []).map((n) => <li key={n.id} className="py-2"><p className="font-medium">{n.title}</p><p className="text-ink-700">{n.body}</p><p className="text-xs text-ink-500">{fmt.date(n.created_at)} {fmt.time(n.created_at)}</p></li>)}</ul>}
      </Card>
    </div>
  );
}
