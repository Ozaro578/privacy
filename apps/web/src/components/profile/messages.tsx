"use client";
import { useEffect, useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { sendMessageAction, startConversationAction } from "@/lib/actions/messages";
import { btn, Card } from "@/components/ui";

interface Conv { id: string; kind: string; subject: string | null; participants: string[] }
interface Msg { id: string; sender_id: string; body: string; created_at: string }

export function MessageThread({ conversations, userId, tenantId }: { conversations: Conv[]; userId: string; tenantId: string }) {
  const [active, setActive] = useState<string | null>(conversations[0]?.id ?? null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  useEffect(() => {
    if (!active) return;
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;
    supabase.from("messages").select("id, sender_id, body, created_at").eq("conversation_id", active).is("deleted_at", null).order("created_at").limit(200).then(({ data }) => { if (!cancelled) setMessages((data ?? []) as Msg[]); });
    const channel = supabase.channel(`conv-${active}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${active}` }, (payload) => setMessages((m) => (m.some((x) => x.id === (payload.new as Msg).id) ? m : [...m, payload.new as Msg]))).subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [active]);
  void tenantId;
  return (
    <Card title="Chat mit der Fahrschule">
      <div className="mb-3 flex flex-wrap gap-2">
        {conversations.map((c) => <button key={c.id} type="button" onClick={() => setActive(c.id)} className={`rounded-full px-3 py-1 text-sm ${active === c.id ? "bg-brand-500 text-white" : "bg-ink-100"}`}>{c.kind === "student_instructor" ? "Fahrlehrer" : "Büro"}{c.participants.length ? `: ${c.participants.join(", ")}` : ""}</button>)}
        <button type="button" className={btn.ghost} disabled={pending} onClick={() => start(async () => { const id = await startConversationAction("student_office"); setActive(id); })}>+ Büro anschreiben</button>
        <button type="button" className={btn.ghost} disabled={pending} onClick={() => start(async () => { const id = await startConversationAction("student_instructor"); setActive(id); })}>+ Fahrlehrer anschreiben</button>
      </div>
      {active ? (
        <>
          <ul className="max-h-96 space-y-2 overflow-y-auto rounded-xl bg-ink-100 p-3">{messages.length === 0 && <li className="text-sm text-ink-500">Noch keine Nachrichten.</li>}{messages.map((m) => <li key={m.id} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.sender_id === userId ? "ml-auto bg-brand-500 text-white" : "bg-white"}`}>{m.body}<span className="block text-[10px] opacity-70">{new Date(m.created_at).toLocaleString("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}</span></li>)}</ul>
          <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; const body = text; setText(""); start(async () => { await sendMessageAction(active, body); }); }}>
            <label htmlFor="msg" className="sr-only">Nachricht</label><input id="msg" value={text} onChange={(e) => setText(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-ink-300 px-3 py-2" placeholder="Nachricht schreiben …" />
            <button className={btn.primary} disabled={pending || !text.trim()}>Senden</button>
          </form>
          <p className="mt-1 text-xs text-ink-500">Keine privaten Telefonnummern nötig: Die Kommunikation läuft über die App.</p>
        </>
      ) : <p className="text-sm text-ink-700">Starte eine Unterhaltung mit dem Büro oder deinem Fahrlehrer.</p>}
    </Card>
  );
}
