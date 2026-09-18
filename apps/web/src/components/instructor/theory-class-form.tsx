"use client";
import { useState, useTransition } from "react";
import { createTheoryClassAction, cancelTheoryClassAction } from "@/lib/actions/instructor";
import { btn, Card } from "@/components/ui";

interface Unit { code: string; title: string }
const input = "min-h-11 w-full rounded-xl border border-ink-300 px-3";

export function TheoryClassForm({ basicUnits, classUnits, licenses, locations, defaultDate }: { basicUnits: Unit[]; classUnits: Record<string, Unit[]>; licenses: Array<{ code: string; name: string }>; locations: Array<{ id: string; name: string }>; defaultDate: string }) {
  const [open, setOpen] = useState(false);
  const [materialKind, setMaterialKind] = useState<"basic" | "class_specific">("basic");
  const [licenseCode, setLicenseCode] = useState(licenses[0]?.code ?? "B");
  const [unitCode, setUnitCode] = useState(basicUnits[0]?.code ?? "G1");
  const [title, setTitle] = useState(basicUnits[0]?.title ?? "");
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:30");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [isOnline, setIsOnline] = useState(false);
  const [capacity, setCapacity] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const units = materialKind === "basic" ? basicUnits : (classUnits[licenseCode] ?? []);
  const pickUnit = (code: string, list: Unit[]) => { setUnitCode(code); const u = list.find((x) => x.code === code); if (u) setTitle(u.title); };
  if (!open) return <button type="button" className={btn.primary} onClick={() => setOpen(true)}>Unterricht anlegen</button>;
  return (
    <Card title="Theorieunterricht anlegen" action={<button type="button" className={btn.ghost} onClick={() => setOpen(false)}>Schließen</button>}>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await createTheoryClassAction({ materialKind, unitCode, title, date, startTime, endTime, locationId: locationId || null, isOnline, capacity: capacity ? Number(capacity) : null, licenseCodes: materialKind === "basic" ? [] : [licenseCode] }); setMsg(r.message); }); }}>
        <div><label htmlFor="t-kind" className="mb-1 block text-sm font-medium">Stoff</label><select id="t-kind" value={materialKind} onChange={(e) => { const k = e.target.value as "basic" | "class_specific"; setMaterialKind(k); const list = k === "basic" ? basicUnits : (classUnits[licenseCode] ?? []); if (list[0]) pickUnit(list[0].code, list); }} className={input}><option value="basic">Grundstoff (G1 bis G{basicUnits.length})</option><option value="class_specific">Zusatzstoff je Klasse</option></select></div>
        {materialKind === "class_specific" && <div><label htmlFor="t-lic" className="mb-1 block text-sm font-medium">Klasse</label><select id="t-lic" value={licenseCode} onChange={(e) => { setLicenseCode(e.target.value); const list = classUnits[e.target.value] ?? []; if (list[0]) pickUnit(list[0].code, list); }} className={input}>{licenses.map((l) => <option key={l.code} value={l.code}>{l.code} · {l.name}</option>)}</select></div>}
        <div><label htmlFor="t-unit" className="mb-1 block text-sm font-medium">Einheit</label><select id="t-unit" value={unitCode} onChange={(e) => pickUnit(e.target.value, units)} className={input}>{units.map((u) => <option key={u.code} value={u.code}>{u.code} · {u.title}</option>)}</select>{units.length === 0 && <p className="mt-1 text-xs text-ink-500">Für diese Klasse ist keine Regel für den Zusatzstoff hinterlegt.</p>}</div>
        <div className="sm:col-span-2"><label htmlFor="t-title" className="mb-1 block text-sm font-medium">Titel</label><input id="t-title" required value={title} onChange={(e) => setTitle(e.target.value)} className={input} /></div>
        <div><label htmlFor="t-date" className="mb-1 block text-sm font-medium">Datum</label><input id="t-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={input} /></div>
        <div className="grid grid-cols-2 gap-2"><div><label htmlFor="t-start" className="mb-1 block text-sm font-medium">Von</label><input id="t-start" type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className={input} /></div><div><label htmlFor="t-end" className="mb-1 block text-sm font-medium">Bis</label><input id="t-end" type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className={input} /></div></div>
        <div><label htmlFor="t-loc" className="mb-1 block text-sm font-medium">Ort</label><select id="t-loc" value={locationId} disabled={isOnline} onChange={(e) => setLocationId(e.target.value)} className={input}><option value="">Kein Standort</option>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select><label className="mt-1 flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={isOnline} onChange={(e) => setIsOnline(e.target.checked)} className="h-5 w-5" /> Online-Unterricht</label></div>
        <div><label htmlFor="t-cap" className="mb-1 block text-sm font-medium">Kapazität (Plätze)</label><input id="t-cap" type="number" min={1} max={500} value={capacity} onChange={(e) => setCapacity(e.target.value)} className={input} placeholder="Unbegrenzt" /></div>
        <div className="flex items-center gap-3 sm:col-span-2"><button type="submit" className={btn.primary} disabled={pending || !title || units.length === 0}>{pending ? "Lege an …" : "Unterricht anlegen"}</button>{msg && <span className="text-sm" role="status" aria-live="polite">{msg}</span>}</div>
      </form>
    </Card>
  );
}

export function CancelClassButton({ classId }: { classId: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  if (msg) return <span className="text-xs" role="status">{msg}</span>;
  return <button type="button" className="text-xs text-danger-500 underline" disabled={pending} onClick={() => { if (confirm("Unterricht absagen?")) start(async () => setMsg((await cancelTheoryClassAction(classId)).message)); }}>Absagen</button>;
}
