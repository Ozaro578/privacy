import type { Tables } from "@fahrpilot/db";
import type { TheoryUnit } from "@/lib/data/admin-theory";
import { field, label } from "@/components/admin/action-form";
import { fmt, parseRange } from "@/components/ui";

export function TheoryClassFields({ c, units, licenses, licenseCode, instructors, locations, unitMinutes, withStatus = false, withRepeat = false }: { c?: Tables<"theory_classes">; units: TheoryUnit[]; licenses: string[]; licenseCode: string; instructors: Array<{ id: string; display_name: string }>; locations: Array<{ id: string; name: string }>; unitMinutes: number; withStatus?: boolean; withRepeat?: boolean }) {
  const r = c ? parseRange(c.period) : null;
  const duration = r ? Math.round((new Date(r.end).getTime() - new Date(r.start).getTime()) / 60_000) : unitMinutes;
  return (
    <>
      <div><label htmlFor="license_code" className={label}>Klasse</label><select id="license_code" name="license_code" defaultValue={licenseCode} className={field}>{licenses.map((l) => <option key={l} value={l}>{l}</option>)}</select></div>
      <div><label htmlFor="lesson_unit_code" className={label}>Einheit</label><select id="lesson_unit_code" name="lesson_unit_code" defaultValue={c?.lesson_unit_code ?? units[0]?.code} className={field}>{units.map((u) => <option key={u.code} value={u.code}>{u.code}: {u.title}</option>)}</select></div>
      <div className="md:col-span-2"><label htmlFor="title" className={label}>Titel (leer = Titel der Einheit)</label><input id="title" name="title" defaultValue={c?.title ?? ""} className={field} /></div>
      <div><label htmlFor="date" className={label}>Datum</label><input id="date" name="date" type="date" required defaultValue={r ? new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date(r.start)) : ""} className={field} /></div>
      <div><label htmlFor="time" className={label}>Beginn</label><input id="time" name="time" type="time" required defaultValue={r ? fmt.time(r.start) : "18:00"} className={field} /></div>
      <div><label htmlFor="duration_minutes" className={label}>Dauer (Minuten)</label><input id="duration_minutes" name="duration_minutes" type="number" min={30} max={240} defaultValue={duration} className={field} /></div>
      <div><label htmlFor="capacity" className={label}>Kapazität</label><input id="capacity" name="capacity" type="number" min={1} defaultValue={c?.capacity ?? ""} className={field} /></div>
      <div><label htmlFor="instructor_id" className={label}>Fahrlehrer</label><select id="instructor_id" name="instructor_id" defaultValue={c?.instructor_id ?? ""} className={field}><option value="">Noch offen</option>{instructors.map((i) => <option key={i.id} value={i.id}>{i.display_name}</option>)}</select></div>
      <div><label htmlFor="location_id" className={label}>Standort</label><select id="location_id" name="location_id" defaultValue={c?.location_id ?? ""} className={field}><option value="">Kein Standort</option>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="is_online" defaultChecked={c?.is_online ?? false} className="h-5 w-5" /> Online-Unterricht</label>
      {withStatus && <div><label htmlFor="status" className={label}>Status</label><select id="status" name="status" defaultValue={c?.status ?? "planned"} className={field}><option value="planned">Geplant</option><option value="running">Läuft</option><option value="completed">Abgeschlossen</option><option value="cancelled">Abgesagt</option></select></div>}
      {withRepeat && <div><label htmlFor="repeat_weeks" className={label}>Serie: Anzahl Wochen (Einheiten fortlaufend)</label><input id="repeat_weeks" name="repeat_weeks" type="number" min={1} max={20} defaultValue={1} className={field} /></div>}
    </>
  );
}
