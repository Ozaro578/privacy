"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { sendMessageAction } from "@/lib/actions/messages";
import { startInstructorConversationAction } from "@/lib/actions/instructor";
import { btn, Card } from "@/components/ui";

interface Conv { id: string; kind: string; title: string; lastMessageAt: string | null; unread: boolean }
interface Msg { id: string; sender_id: string; body: string; created_at: string }

export function InstructorMessages({ conversations, students, userId, initialId }: { conversations: Conv[]; students: Array<{ studentId: string; name: string }>; userId: string; initialId: string | null }) {
  const router = useRouter();
  const [active, setActive] = useState<string | null>(initialId && conversations.some((c) => c.id === initialId) ? initialId : conversations[0]?.id ?? null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [studentId, setStudentId] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!active) return;
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;
    supabase.from("messages").select("id, sender_id, body, created_at").eq("conversation_id", active).is("deleted_at", null).order("created_at").limit(200).then(({ data }) => { if (!cancelled) setMessages((data ?? []) as Msg[]); });
    void supabase.from("conversation_participants").update({ last_read_at: new Date().toISOString() }).eq("conversation_id", active).eq("user_id", userId);
    const channel = supabase.channel(`conv-${active}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${active}` }, (payload) => setMessages((m) => (m.some((x) => x.id === (payload.new as Msg).id) ? m : [...m, payload.new as Msg]))).subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [active, userId]);
  const current = conversations.find((c) => c.id === active);
  return (
    <div className="grid gap-4 md:grid-cols-[16rem_1fr]">
      <Card title="Unterhaltungen">
        <ul className="space-y-1">{conversations.length === 0 && <li className="text-sm text-ink-500">Noch keine Unterhaltungen.</li>}{conversations.map((c) => (
          <li key={c.id}><button type="button" onClick={() => setActive(c.id)} className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm ${active === c.id ? "bg-brand-50 font-semibold text-brand-700" : "hover:bg-ink-100"}`}><span className="truncate">{c.title}<span className="block text-xs font-normal text-ink-500">{c.kind === "student_instructor" ? "Schüler" : c.kind === "student_office" ? "Büro und Schüler" : "Team"}</span></span>{c.unread && <span aria-label="ungelesen" className="ml-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />}</button></li>
        ))}</ul>
        <form className="mt-4 border-t border-ink-100 pt-3" onSubmit={(e) => { e.preventDefault(); if (!studentId) return; start(async () => { const r = await startInstructorConversationAction(studentId); setMsg(r.ok ? null : r.message); if (r.ok && r.conversationId) { setStudentId(""); setActive(r.conversationId); router.refresh(); } }); }}>
          <label htmlFor="new-conv" className="mb-1 block text-sm font-medium">Schüler anschreiben</label>
          <select id="new-conv" value={studentId} onChange={(e) => setStudentId(e.target.value)} className="min-h-11 w-full rounded-xl border border-ink-300 px-3 text-sm"><option value="">Schüler wählen</option>{students.map((s) => <option key={s.studentId} value={s.studentId}>{s.name}</option>)}</select>
          <button type="submit" className={`${btn.secondary} mt-2 w-full`} disabled={pending || !studentId}>Unterhaltung starten</button>
          {msg && <p className="mt-1 text-sm" role="status">{msg}</p>}
        </form>
      </Card>
      <Card title={current ? current.title : "Chat"}>
        {active ? (
          <>
            <ul className="max-h-[60vh] space-y-2 overflow-y-auto rounded-xl bg-ink-100 p-3">{messages.length === 0 && <li className="text-sm text-ink-500">Noch keine Nachrichten.</li>}{messages.map((m) => <li key={m.id} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.sender_id === userId ? "ml-auto bg-brand-500 text-white" : "bg-surface"}`}>{m.body}<span className="block text-[10px] opacity-70">{new Date(m.created_at).toLocaleString("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}</span></li>)}</ul>
            <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; const body = text; setText(""); start(async () => { await sendMessageAction(active, body); }); }}>
              <label htmlFor="msg" className="sr-only">Nachricht</label><input id="msg" value={text} onChange={(e) => setText(e.target.value)} className="min-h-11 min-w-0 flex-1 rounded-xl border border-ink-300 px-3" placeholder="Nachricht schreiben" />
              <button className={btn.primary} disabled={pending || !text.trim()}>Senden</button>
            </form>
            <p className="mt-1 text-xs text-ink-500">Die Kommunikation läuft über die App, private Telefonnummern sind nicht nötig.</p>
          </>
        ) : <p className="text-sm text-ink-700">Wähle eine Unterhaltung oder schreibe einen Schüler an.</p>}
      </Card>
    </div>
  );
}
