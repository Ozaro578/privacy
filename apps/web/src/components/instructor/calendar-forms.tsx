"use client";
import { useState, useTransition } from "react";
import { createSlotsAction, deleteSlotAction, cancelLessonByInstructorAction, createAbsenceAction, deleteAbsenceAction, createAvailabilityAction, deleteAvailabilityAction } from "@/lib/actions/instructor";
import { btn, Card, fmt } from "@/components/ui";

interface Vehicle { id: string; license_plate: string; make: string | null; model: string | null; transmission: string; license_classes: string[] }
interface Price { lessonKind: string; licenseCode: string | null; amountCents: number; unit: string; name: string }
const KINDS: Array<[string, string]> = [["practice", "Übungsstunde"], ["overland", "Überlandfahrt"], ["motorway", "Autobahnfahrt"], ["night", "Nachtfahrt"], ["special", "Sonderfahrt"], ["exam_prep", "Prüfungsvorbereitung"], ["practical_exam", "Praktische Prüfung"], ["manual_conversion", "Schaltstunde (B197)"], ["trailer", "Anhänger"]];
const WEEKDAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const input = "min-h-11 w-full rounded-xl border border-ink-300 px-3";

export function SlotForm({ defaultDate, vehicles, prices, licenses, instructorClasses }: { defaultDate: string; vehicles: Vehicle[]; prices: Price[]; licenses: Array<{ code: string; name: string }>; instructorClasses: string[] }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("08:00");
  const [units, setUnits] = useState(1);
  const [count, setCount] = useState(1);
  const [kind, setKind] = useState("practice");
  const [vehicleId, setVehicleId] = useState("");
  const [transmission, setTransmission] = useState("");
  const [codes, setCodes] = useState<string[]>(instructorClasses.length === 1 ? instructorClasses : []);
  const [meetingPoint, setMeetingPoint] = useState("");
  const [priceEur, setPriceEur] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const suggested = prices.find((p) => p.lessonKind === kind && (codes.length === 0 || (p.licenseCode && codes.includes(p.licenseCode)))) ?? prices.find((p) => p.lessonKind === kind && !p.licenseCode) ?? prices.find((p) => p.lessonKind === kind);
  const effectivePrice = priceEur.trim() ? Math.round(Number(priceEur.replace(",", ".")) * 100) : suggested ? suggested.amountCents * (suggested.unit === "unit" ? units : 1) : null;
  const selectable = licenses.filter((l) => instructorClasses.length === 0 || instructorClasses.includes(l.code));
  if (!open) return <button type="button" className={btn.primary} onClick={() => setOpen(true)}>Freie Slots anlegen</button>;
  return (
    <Card title="Freie Slots anlegen" action={<button type="button" className={btn.ghost} onClick={() => setOpen(false)}>Schließen</button>}>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await createSlotsAction({ date, startTime, units, count, kind: kind as "practice", vehicleId: vehicleId || null, transmission: (transmission || null) as "manual" | null, licenseCodes: codes, meetingPoint: meetingPoint || null, priceCents: effectivePrice !== null && Number.isFinite(effectivePrice) ? effectivePrice : null }); setMsg(r.message); }); }}>
        <div><label htmlFor="s-date" className="mb-1 block text-sm font-medium">Datum</label><input id="s-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={input} /></div>
        <div><label htmlFor="s-time" className="mb-1 block text-sm font-medium">Startzeit</label><input id="s-time" type="time" required step={300} value={startTime} onChange={(e) => setStartTime(e.target.value)} className={input} /></div>
        <div><label htmlFor="s-units" className="mb-1 block text-sm font-medium">Einheiten à 45 Minuten je Slot</label><select id="s-units" value={units} onChange={(e) => setUnits(Number(e.target.value))} className={input}>{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} ({n * 45} Min)</option>)}</select></div>
        <div><label htmlFor="s-count" className="mb-1 block text-sm font-medium">Anzahl Slots hintereinander</label><input id="s-count" type="number" min={1} max={12} value={count} onChange={(e) => setCount(Math.max(1, Math.min(12, Number(e.target.value))))} className={input} /></div>
        <div><label htmlFor="s-kind" className="mb-1 block text-sm font-medium">Art</label><select id="s-kind" value={kind} onChange={(e) => setKind(e.target.value)} className={input}>{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div><label htmlFor="s-vehicle" className="mb-1 block text-sm font-medium">Fahrzeug</label><select id="s-vehicle" value={vehicleId} onChange={(e) => { setVehicleId(e.target.value); const v = vehicles.find((x) => x.id === e.target.value); if (v) setTransmission(v.transmission); }} className={input}><option value="">Kein Fahrzeug festlegen</option>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.license_plate} · {[v.make, v.model].filter(Boolean).join(" ")} · {v.transmission === "automatic" ? "Automatik" : "Schaltung"}</option>)}</select></div>
        <div><label htmlFor="s-trans" className="mb-1 block text-sm font-medium">Getriebe</label><select id="s-trans" value={transmission} onChange={(e) => setTransmission(e.target.value)} className={input}><option value="">Beides</option><option value="manual">Schaltung</option><option value="automatic">Automatik</option></select></div>
        <div><label htmlFor="s-meet" className="mb-1 block text-sm font-medium">Treffpunkt</label><input id="s-meet" value={meetingPoint} onChange={(e) => setMeetingPoint(e.target.value)} className={input} placeholder="Fahrschule oder Adresse" /></div>
        <fieldset className="sm:col-span-2"><legend className="mb-1 text-sm font-medium">Klassen (leer = alle)</legend><div className="flex flex-wrap gap-2">{selectable.map((l) => <label key={l.code} className={`flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm ${codes.includes(l.code) ? "border-brand-500 bg-brand-50" : "border-ink-300"}`}><input type="checkbox" checked={codes.includes(l.code)} onChange={(e) => setCodes((c) => (e.target.checked ? [...c, l.code] : c.filter((x) => x !== l.code)))} />{l.code}</label>)}</div></fieldset>
        <div><label htmlFor="s-price" className="mb-1 block text-sm font-medium">Preis je Slot (EUR)</label><input id="s-price" inputMode="decimal" value={priceEur} onChange={(e) => setPriceEur(e.target.value)} className={input} placeholder={suggested ? (suggested.amountCents * (suggested.unit === "unit" ? units : 1) / 100).toFixed(2) : "Kein Preis"} /><p className="mt-1 text-xs text-ink-500">{suggested ? `Aus Preisliste: ${suggested.name}, ${fmt.eur(suggested.amountCents)} je ${suggested.unit === "unit" ? "Einheit" : "Position"}` : "Keine Preisposition für diese Art hinterlegt."}</p></div>
        <div className="flex items-end gap-3 sm:col-span-2"><button type="submit" className={btn.primary} disabled={pending}>{pending ? "Lege an …" : `${count} Slot${count === 1 ? "" : "s"} anlegen`}</button>{msg && <span className="text-sm" role="status" aria-live="polite">{msg}</span>}</div>
      </form>
    </Card>
  );
}

export function SlotActions({ lessonId, status, hasStudent }: { lessonId: string; status: string; hasStudent: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  if (msg) return <span className="text-xs" role="status">{msg}</span>;
  if (status === "open" && !hasStudent) return <button type="button" className="text-xs text-danger-500 underline" disabled={pending} onClick={() => { if (confirm("Freien Slot löschen?")) start(async () => setMsg((await deleteSlotAction(lessonId)).message)); }}>Löschen</button>;
  if (hasStudent && ["booked", "confirmed"].includes(status)) return <button type="button" className="text-xs text-danger-500 underline" disabled={pending} onClick={() => { const reason = prompt("Grund der Absage (der Schüler wird benachrichtigt):") ?? ""; if (reason !== null) start(async () => setMsg((await cancelLessonByInstructorAction(lessonId, reason)).message)); }}>Absagen</button>;
  return null;
}

export function AbsenceForm({ absences }: { absences: Array<{ id: string; start: string; end: string; title: string; subtitle: string | null }> }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("vacation");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div>
      {absences.length > 0 && <ul className="mb-3 divide-y divide-ink-100 text-sm">{absences.map((a) => <li key={a.id} className="flex items-center justify-between py-2"><span>{fmt.date(a.start)} bis {fmt.date(new Date(new Date(a.end).getTime() - 1).toISOString())} · {a.title}{a.subtitle ? ` · ${a.subtitle}` : ""}</span><button type="button" className="text-xs text-danger-500 underline" disabled={pending} onClick={() => start(async () => setMsg((await deleteAbsenceAction(a.id)).message))}>Entfernen</button></li>)}</ul>}
      <form className="grid gap-2 sm:grid-cols-4" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await createAbsenceAction({ from, to, reason: reason as "vacation", note: note || null }); setMsg(r.message); if (r.ok) { setFrom(""); setTo(""); setNote(""); } }); }}>
        <div><label htmlFor="a-from" className="mb-1 block text-sm font-medium">Von</label><input id="a-from" type="date" required value={from} onChange={(e) => setFrom(e.target.value)} className={input} /></div>
        <div><label htmlFor="a-to" className="mb-1 block text-sm font-medium">Bis (einschließlich)</label><input id="a-to" type="date" required value={to} onChange={(e) => setTo(e.target.value)} className={input} /></div>
        <div><label htmlFor="a-reason" className="mb-1 block text-sm font-medium">Grund</label><select id="a-reason" value={reason} onChange={(e) => setReason(e.target.value)} className={input}><option value="vacation">Urlaub</option><option value="sick">Krank</option><option value="training">Fortbildung</option><option value="other">Sonstiges</option></select></div>
        <div><label htmlFor="a-note" className="mb-1 block text-sm font-medium">Notiz</label><input id="a-note" value={note} onChange={(e) => setNote(e.target.value)} className={input} /></div>
        <div className="flex items-center gap-3 sm:col-span-4"><button type="submit" className={btn.secondary} disabled={pending || !from || !to}>Abwesenheit eintragen</button>{msg && <span className="text-sm" role="status" aria-live="polite">{msg}</span>}</div>
      </form>
    </div>
  );
}

export function AvailabilityForm({ rows }: { rows: Array<{ id: string; weekday: number; start_time: string; end_time: string; kind: string }> }) {
  const [weekday, setWeekday] = useState(1);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [kind, setKind] = useState<"work" | "break">("work");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const byDay = WEEKDAYS.map((name, i) => ({ name, rows: rows.filter((r) => r.weekday === i + 1).sort((a, b) => a.start_time.localeCompare(b.start_time)) }));
  return (
    <div>
      <ul className="mb-3 grid gap-1 text-sm sm:grid-cols-2">{byDay.map((d) => (
        <li key={d.name} className="rounded-lg bg-ink-100 p-2"><span className="font-medium">{d.name}</span>{d.rows.length === 0 ? <span className="text-ink-500"> · keine Arbeitszeit</span> : <ul className="mt-1 space-y-1">{d.rows.map((r) => <li key={r.id} className="flex items-center justify-between"><span>{r.kind === "break" ? "Pause" : "Arbeit"} {r.start_time.slice(0, 5)} bis {r.end_time.slice(0, 5)}</span><button type="button" className="text-xs text-danger-500 underline" disabled={pending} onClick={() => start(async () => setMsg((await deleteAvailabilityAction(r.id)).message))}>Entfernen</button></li>)}</ul>}</li>
      ))}</ul>
      <p className="mb-2 text-xs text-ink-500">Ohne Arbeitszeiten gilt: jederzeit buchbar. Mit Arbeitszeiten prüft die Buchung Fenster und Pausen.</p>
      <form className="grid gap-2 sm:grid-cols-5" onSubmit={(e) => { e.preventDefault(); start(async () => setMsg((await createAvailabilityAction({ weekday, startTime, endTime, kind })).message)); }}>
        <div><label htmlFor="av-day" className="mb-1 block text-sm font-medium">Wochentag</label><select id="av-day" value={weekday} onChange={(e) => setWeekday(Number(e.target.value))} className={input}>{WEEKDAYS.map((w, i) => <option key={w} value={i + 1}>{w}</option>)}</select></div>
        <div><label htmlFor="av-kind" className="mb-1 block text-sm font-medium">Art</label><select id="av-kind" value={kind} onChange={(e) => setKind(e.target.value as "work" | "break")} className={input}><option value="work">Arbeitszeit</option><option value="break">Pause</option></select></div>
        <div><label htmlFor="av-start" className="mb-1 block text-sm font-medium">Von</label><input id="av-start" type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className={input} /></div>
        <div><label htmlFor="av-end" className="mb-1 block text-sm font-medium">Bis</label><input id="av-end" type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className={input} /></div>
        <div className="flex items-end"><button type="submit" className={btn.secondary} disabled={pending}>Speichern</button></div>
        {msg && <p className="text-sm sm:col-span-5" role="status" aria-live="polite">{msg}</p>}
      </form>
    </div>
  );
}
