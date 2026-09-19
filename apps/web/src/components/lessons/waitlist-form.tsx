"use client";
import { useState, useTransition } from "react";
import { joinWaitlistAction } from "@/lib/actions/lessons";
import { btn } from "@/components/ui";

const DAYS = [["1", "Mo"], ["2", "Di"], ["3", "Mi"], ["4", "Do"], ["5", "Fr"], ["6", "Sa"], ["7", "So"]] as const;

export function WaitlistForm({ instructors, today, inTwoWeeks }: { instructors: Array<{ id: string; name: string }>; today: string; inTwoWeeks: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <form className="space-y-3 text-sm" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); start(async () => { const r = await joinWaitlistAction({ earliest: `${f.get("from")}T00:00:00+02:00`, latest: `${f.get("to")}T23:59:59+02:00`, instructorId: (f.get("instructor") as string) || null, weekdays: f.getAll("day").map(Number), timeFrom: (f.get("time_from") as string) || null, timeTo: (f.get("time_to") as string) || null }); setMsg(r.message); }); }}>
      <div className="grid grid-cols-2 gap-2">
        <div><label htmlFor="wl-from" className="mb-1 block">Frühestens</label><input id="wl-from" name="from" type="date" defaultValue={today} min={today} className="w-full rounded-lg border border-ink-300 px-2 py-2" /></div>
        <div><label htmlFor="wl-to" className="mb-1 block">Spätestens</label><input id="wl-to" name="to" type="date" defaultValue={inTwoWeeks} className="w-full rounded-lg border border-ink-300 px-2 py-2" /></div>
        <div><label htmlFor="wl-tf" className="mb-1 block">Ab Uhrzeit</label><input id="wl-tf" name="time_from" type="time" className="w-full rounded-lg border border-ink-300 px-2 py-2" /></div>
        <div><label htmlFor="wl-tt" className="mb-1 block">Bis Uhrzeit</label><input id="wl-tt" name="time_to" type="time" className="w-full rounded-lg border border-ink-300 px-2 py-2" /></div>
      </div>
      <fieldset><legend className="mb-1">Wochentage</legend><div className="flex flex-wrap gap-2">{DAYS.map(([v, l]) => <label key={v} className="flex items-center gap-1 rounded-full border border-ink-300 px-2 py-1"><input type="checkbox" name="day" value={v} defaultChecked={Number(v) <= 5} />{l}</label>)}</div></fieldset>
      <div><label htmlFor="wl-ins" className="mb-1 block">Fahrlehrer (optional)</label><select id="wl-ins" name="instructor" className="w-full rounded-lg border border-ink-300 px-2 py-2"><option value="">Egal</option>{instructors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
      <button type="submit" className={btn.secondary} disabled={pending}>{pending ? "Speichere …" : "Auf die Warteliste"}</button>
      {msg && <p role="status">{msg}</p>}
    </form>
  );
}
