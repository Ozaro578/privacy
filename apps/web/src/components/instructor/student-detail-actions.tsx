"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { releaseExamAction, updateStudentNotesAction, startInstructorConversationAction, startMockExamAction } from "@/lib/actions/instructor";
import { btn } from "@/components/ui";

export function ReleaseButton({ licenseId, kind, disabledReason }: { licenseId: string; kind: "theory" | "practical"; disabledReason: string | null }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const label = kind === "theory" ? "Für Theorieprüfung freigeben" : "Für praktische Prüfung freigeben";
  return (
    <div>
      <button type="button" className={btn.primary} disabled={pending || !!disabledReason} title={disabledReason ?? undefined} onClick={() => { if (!confirm(`${label}? Der Schüler wird benachrichtigt und die Fahrschule meldet zur Prüfung an.`)) return; start(async () => setMsg((await releaseExamAction(licenseId, kind)).message)); }}>{pending ? "Gebe frei …" : label}</button>
      {disabledReason && <p className="mt-1 text-xs text-ink-500">{disabledReason}</p>}
      {msg && <p className="mt-1 text-sm" role="status" aria-live="polite">{msg}</p>}
    </div>
  );
}

export function NotesForm({ studentId, initial, editable }: { studentId: string; initial: string; editable: boolean }) {
  const [text, setText] = useState(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <form onSubmit={(e) => { e.preventDefault(); start(async () => setMsg((await updateStudentNotesAction(studentId, text)).message)); }}>
      <label htmlFor="notes" className="mb-1 block text-sm font-medium">Interne Notizen (nur für Mitarbeiter sichtbar)</label>
      <textarea id="notes" value={text} onChange={(e) => setText(e.target.value)} rows={4} disabled={!editable} className="w-full rounded-xl border border-ink-300 px-3 py-2 disabled:bg-ink-100" placeholder="Besonderheiten, Absprachen, Hinweise für Kollegen" />
      <div className="mt-2 flex items-center gap-3">
        <button type="submit" className={btn.secondary} disabled={pending || !editable || text === initial}>{pending ? "Speichere …" : "Notizen speichern"}</button>
        {msg && <span className="text-sm" role="status" aria-live="polite">{msg}</span>}
      </div>
    </form>
  );
}

export function MessageStudentButton({ studentId, hasAccount }: { studentId: string; hasAccount: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div>
      <button type="button" className={btn.secondary} disabled={pending || !hasAccount} title={hasAccount ? undefined : "Schüler hat kein Nutzerkonto"} onClick={() => start(async () => { const r = await startInstructorConversationAction(studentId); if (r.ok && r.conversationId) router.push(`/lehrer/nachrichten?c=${r.conversationId}`); else setMsg(r.message); })}>{pending ? "Öffne …" : "Nachricht schreiben"}</button>
      {msg && <p className="mt-1 text-sm" role="status">{msg}</p>}
    </div>
  );
}

export function StartMockButton({ licenseId, canStart }: { licenseId: string; canStart: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div>
      <button type="button" className={btn.primary} disabled={pending || !canStart} title={canStart ? undefined : "Nur mit eigenem Fahrlehrerdatensatz"} onClick={() => start(async () => { const r = await startMockExamAction(licenseId); if (r.ok) router.push(`/lehrer/mock/${licenseId}`); else setMsg(r.message); })}>{pending ? "Starte …" : "Mock-Prüfung starten"}</button>
      {msg && <p className="mt-1 text-sm" role="status">{msg}</p>}
    </div>
  );
}
