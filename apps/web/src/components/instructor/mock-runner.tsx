"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addMockEventAction, deleteMockEventAction, finishMockExamAction, startMockExamAction } from "@/lib/actions/instructor";
import { btn, Card } from "@/components/ui";

export interface MockEvent { id: string; occurred_at: string; polarity: string; severity: number; label: string; skill_code: string | null; note: string | null }
const POSITIVE: Array<{ label: string; skill: string }> = [{ label: "Gute Verkehrsbeobachtung", skill: "observation" }, { label: "Gute Geschwindigkeitswahl", skill: "speed" }, { label: "Sauberes Abbiegen", skill: "turning" }];
const NEGATIVE: Array<{ label: string; skill: string; severity: number }> = [{ label: "Schulterblick vergessen", skill: "observation", severity: 2 }, { label: "Vorfahrtproblem", skill: "right_of_way", severity: 3 }, { label: "Zu geringer Abstand", skill: "distance", severity: 2 }, { label: "Geschwindigkeit", skill: "speed", severity: 2 }, { label: "Spurwechsel", skill: "lane_change", severity: 2 }];

export function scoreOf(events: MockEvent[]): number {
  const neg = events.filter((e) => e.polarity === "negative").reduce((s, e) => s + e.severity * 5, 0);
  const pos = events.filter((e) => e.polarity === "positive").length * 2;
  return Math.max(0, Math.min(100, 100 - neg + pos));
}

export function StartMockCard({ licenseId, canStart }: { licenseId: string; canStart: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <Card title="Prüfungssimulation">
      <p className="mb-3 text-sm text-ink-700">Simuliere eine praktische Prüfung: Während der Fahrt markierst du positive und negative Ereignisse mit einem Tipp. Am Ende entsteht ein Protokoll mit Stärken, Verbesserungen und Punktzahl.</p>
      <button type="button" className={btn.primary} disabled={pending || !canStart} onClick={() => start(async () => { const r = await startMockExamAction(licenseId); if (r.ok) router.refresh(); else setMsg(r.message); })}>{pending ? "Starte …" : "Mock-Prüfung starten"}</button>
      {!canStart && <p className="mt-1 text-xs text-ink-500">Nur mit eigenem Fahrlehrerdatensatz möglich.</p>}
      {msg && <p className="mt-2 text-sm" role="status">{msg}</p>}
    </Card>
  );
}

export function MockRunner({ mockId, startedAt, initialEvents }: { mockId: string; startedAt: string; initialEvents: MockEvent[] }) {
  const router = useRouter();
  const [events, setEvents] = useState<MockEvent[]>(initialEvents);
  const [summary, setSummary] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const add = (polarity: "positive" | "negative", label: string, skill: string, severity = 1) => start(async () => {
    const r = await addMockEventAction({ mockId, polarity, label, skillCode: skill, severity });
    if (r.ok && r.eventId) setEvents((e) => [...e, { id: r.eventId!, occurred_at: new Date().toISOString(), polarity, severity, label, skill_code: skill, note: null }]);
    else setMsg(r.message);
  });
  const remove = (id: string) => start(async () => { const r = await deleteMockEventAction(id); if (r.ok) setEvents((e) => e.filter((x) => x.id !== id)); else setMsg(r.message); });
  const score = scoreOf(events);
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-ink-700">Läuft seit {new Date(startedAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr · {events.length} Ereignisse</p>
          <p className="text-2xl font-bold tabular-nums" aria-live="polite">{score} <span className="text-sm font-normal text-ink-500">/ 100</span></p>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Positiv">
          <div className="grid gap-2">{POSITIVE.map((p) => <button key={p.label} type="button" disabled={pending} onClick={() => add("positive", p.label, p.skill)} className="min-h-16 rounded-2xl bg-success-100 px-4 text-lg font-semibold text-ink-900 active:scale-[0.98] disabled:opacity-50">{p.label}</button>)}</div>
        </Card>
        <Card title="Negativ">
          <div className="grid gap-2">{NEGATIVE.map((n) => <button key={n.label} type="button" disabled={pending} onClick={() => add("negative", n.label, n.skill, n.severity)} className="min-h-16 rounded-2xl bg-danger-100 px-4 text-lg font-semibold text-ink-900 active:scale-[0.98] disabled:opacity-50">{n.label}<span className="block text-xs font-normal text-ink-700">Schwere {n.severity}, minus {n.severity * 5}</span></button>)}</div>
        </Card>
      </div>
      <Card title="Protokoll">
        {events.length === 0 ? <p className="text-sm text-ink-500">Noch keine Ereignisse markiert.</p> : (
          <ul className="divide-y divide-ink-100 text-sm">{[...events].reverse().map((e) => <li key={e.id} className="flex items-center justify-between py-2"><span><span className="tabular-nums text-ink-500">{new Date(e.occurred_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</span> · <span className={e.polarity === "positive" ? "text-success-500" : "text-danger-500"}>{e.polarity === "positive" ? "+" : "−"}</span> {e.label}</span><button type="button" className="text-xs text-ink-500 underline" disabled={pending} onClick={() => remove(e.id)}>Entfernen</button></li>)}</ul>
        )}
      </Card>
      <Card title="Beenden">
        <label htmlFor="summary" className="mb-1 block text-sm font-medium">Zusammenfassung für den Schüler (optional)</label>
        <textarea id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} className="w-full rounded-xl border border-ink-300 px-3 py-2" />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" className={btn.primary} disabled={pending} onClick={() => start(async () => { const r = await finishMockExamAction(mockId, summary); setMsg(r.message); if (r.ok) router.refresh(); })}>Simulation beenden und auswerten</button>
          <button type="button" className={btn.ghost} disabled={pending} onClick={() => { if (confirm("Simulation ohne Wertung abbrechen?")) start(async () => { const r = await finishMockExamAction(mockId, summary, true); setMsg(r.message); if (r.ok) router.refresh(); }); }}>Abbrechen</button>
          {msg && <span className="text-sm" role="status" aria-live="polite">{msg}</span>}
        </div>
      </Card>
    </div>
  );
}
