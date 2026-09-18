"use client";
import { useState, useTransition } from "react";
import { saveNotificationPreference, requestDataExport, updateLocale } from "@/lib/actions/profile";
import { btn } from "@/components/ui";

const TYPES: Array<{ type: string; label: string }> = [
  { type: "lesson_reminder_24h", label: "Fahrstunde morgen" }, { type: "lesson_reminder_2h", label: "Fahrstunde in 2 Stunden" }, { type: "earlier_slot_available", label: "Frühere Fahrstunde verfügbar" },
  { type: "learn_reminder", label: "Heute noch nicht gelernt" }, { type: "exam_countdown", label: "Prüfungs-Countdown" }, { type: "invoice_due", label: "Rechnung fällig" }, { type: "message_received", label: "Neue Nachricht" }, { type: "waitlist_offer", label: "Wartelisten-Angebot" }, { type: "document_missing", label: "Dokument fehlt" },
];

export function NotificationSettings({ prefs }: { prefs: Array<{ notification_type: string; push: boolean; email: boolean; in_app: boolean }> }) {
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState<string | null>(null);
  return (
    <table className="w-full text-sm">
      <thead><tr className="text-left text-xs text-ink-500"><th className="py-1">Benachrichtigung</th><th>Push</th><th>E-Mail</th></tr></thead>
      <tbody>
        {TYPES.map((t) => { const p = prefs.find((x) => x.notification_type === t.type) ?? { push: true, email: false, in_app: true }; return (
          <tr key={t.type} className="border-t border-ink-100">
            <td className="py-2">{t.label}</td>
            {(["push", "email"] as const).map((ch) => <td key={ch}><input type="checkbox" aria-label={`${t.label} per ${ch}`} className="h-5 w-5" defaultChecked={p[ch]} disabled={pending} onChange={(e) => start(async () => { await saveNotificationPreference({ type: t.type, push: ch === "push" ? e.target.checked : p.push, email: ch === "email" ? e.target.checked : p.email, in_app: true }); setSaved(t.type); })} /></td>)}
          </tr>
        ); })}
      </tbody>
      {saved && <caption className="caption-bottom pt-2 text-left text-xs text-success-500">Gespeichert.</caption>}
    </table>
  );
}

export function PrivacyActions() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="space-y-2 text-sm">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn.secondary} disabled={pending} onClick={() => start(async () => setMsg((await requestDataExport("export")).message))}>Meine Daten exportieren</button>
        <button type="button" className={btn.ghost} disabled={pending} onClick={() => { if (confirm("Löschung deiner Daten beantragen? Gesetzliche Aufbewahrungsfristen (z. B. Rechnungen) bleiben bestehen.")) start(async () => setMsg((await requestDataExport("deletion")).message)); }}>Löschung beantragen</button>
      </div>
      {msg && <p role="status">{msg}</p>}
    </div>
  );
}

export function LocaleSelect({ current }: { current: string }) {
  const [pending, start] = useTransition();
  return (
    <label className="flex items-center gap-2 text-sm">App-Sprache
      <select defaultValue={current} disabled={pending} className="rounded-lg border border-ink-300 px-2 py-1" onChange={(e) => start(async () => { await updateLocale(e.target.value as "de" | "en" | "tr" | "ar"); })}>
        <option value="de">Deutsch</option><option value="en">English</option><option value="tr">Türkçe</option><option value="ar">العربية</option>
      </select>
    </label>
  );
}
