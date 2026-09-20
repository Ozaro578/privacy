"use client";
import { useState, useTransition } from "react";
import { askCoachAction, type CoachReply } from "@/lib/actions/coach";
import { btn } from "@/components/ui";

interface Msg { role: "user" | "assistant"; text: string; meta?: CoachReply }
const SUGGESTIONS = ["Wann muss ich im Kreisverkehr blinken?", "Was bedeutet Rechtsfahrgebot?", "Erklär mir ABS einfach.", "Warum darf ich in einer Zone nur 30 fahren?", "Wie überprüfe ich die Bremsleuchten?"];

export function CoachChat({ topicId, initialPrompt }: { topicId?: string; initialPrompt?: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState(initialPrompt ?? "");
  const [style, setStyle] = useState<"simple" | "detailed" | "example" | "mnemonic">("simple");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [pending, start] = useTransition();
  function send(text: string) {
    if (!text.trim() || pending) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    start(async () => {
      try {
        const r = await askCoachAction({ question: text, style, ...(topicId ? { topicId } : {}), ...(conversationId ? { conversationId } : {}) });
        setConversationId(r.conversationId);
        setMessages((m) => [...m, { role: "assistant", text: r.answer, meta: r }]);
      } catch (e) { setMessages((m) => [...m, { role: "assistant", text: e instanceof Error ? e.message : "Der Coach ist gerade nicht erreichbar." }]); }
    });
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">{(["simple", "detailed", "example", "mnemonic"] as const).map((s) => <button key={s} type="button" onClick={() => setStyle(s)} className={`rounded-full px-3 py-1 text-xs ${style === s ? "bg-brand-500 text-white" : "bg-ink-100"}`}>{{ simple: "Einfach", detailed: "Ausführlich", example: "Mit Beispiel", mnemonic: "Merksatz" }[s]}</button>)}</div>
      <div className="min-h-40 space-y-3 rounded-card bg-surface p-4 shadow-card" aria-live="polite">
        {messages.length === 0 && <div><p className="text-sm text-ink-700">Frag mich alles rund um Theorie und Praxis. Ich antworte nur mit geprüften Quellen und sage dir, wenn ich etwas nicht sicher weiß.</p><ul className="mt-3 flex flex-wrap gap-2">{SUGGESTIONS.map((s) => <li key={s}><button type="button" onClick={() => send(s)} className="rounded-full border border-ink-300 px-3 py-1 text-sm hover:border-brand-500">{s}</button></li>)}</ul></div>}
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "ml-auto bg-brand-500 text-white" : "bg-ink-100"}`}>
            <p className="whitespace-pre-wrap">{m.text}</p>
            {m.meta && <p className="mt-2 text-xs text-ink-500">{m.meta.confidence === "verified" ? "Geprüfte Quelle" : m.meta.confidence === "partial" ? "Teilweise belegt" : "Ohne geprüfte Quelle"}{m.meta.sources.length ? ` · ${m.meta.sources.map((s) => s.legal_reference ? `${s.title} (${s.legal_reference})` : s.title).join(", ")}` : ""}{m.meta.disclaimer ? ` · ${m.meta.disclaimer}` : ""}</p>}
          </div>
        ))}
        {pending && <p className="text-sm text-ink-500">Der Coach denkt nach …</p>}
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <label htmlFor="coach-q" className="sr-only">Deine Frage</label>
        <input id="coach-q" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Deine Frage …" className="min-w-0 flex-1 rounded-xl border border-ink-300 px-3 py-3" />
        <button type="submit" className={btn.primary} disabled={pending || !input.trim()}>Fragen</button>
      </form>
      <p className="text-xs text-ink-500">Der KI-Coach ist eine Lernhilfe und ersetzt nicht deinen Fahrlehrer. Nicht während der Fahrt verwenden.</p>
    </div>
  );
}
