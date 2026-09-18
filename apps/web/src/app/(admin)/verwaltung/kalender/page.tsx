import Link from "next/link";
import { getCalendar, type CalendarView } from "@/lib/data/admin-calendar";
import { bookForStudent, confirmBooking, createSlot } from "@/lib/actions/admin-calendar";
import { addDays, berlinDate, LESSON_KIND_LABEL } from "@/lib/data/admin";
import { Card, EmptyState, Pill, btn, fmt, parseRange } from "@/components/ui";
import { ActionForm, field, label } from "@/components/admin/action-form";
import { ActionButton } from "@/components/admin/action-button";
import { CalendarItem } from "@/components/admin/calendar-item";

export const metadata = { title: "Kalender" };
const WEEKDAY_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function shiftDate(view: CalendarView, date: string, dir: 1 | -1): string {
  if (view === "day") return addDays(date, dir);
  if (view === "week") return addDays(date, 7 * dir);
  const d = new Date(`${date.slice(0, 7)}-01T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() + dir); return d.toISOString().slice(0, 10);
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const view: CalendarView = sp["view"] === "day" || sp["view"] === "month" ? sp["view"] : "week";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp["date"] ?? "") ? (sp["date"] as string) : berlinDate();
  const filters = { view, date, instructor: sp["instructor"] || undefined, vehicle: sp["vehicle"] || undefined, transmission: sp["transmission"] || undefined, license: sp["license"] || undefined, status: sp["status"] || undefined };
  const d = await getCalendar(filters);
  const qs = (over: Record<string, string | undefined>) => { const p = new URLSearchParams(); for (const [k, v] of Object.entries({ ...filters, ...over })) if (v) p.set(k, v); return `/verwaltung/kalender?${p.toString()}`; };
  const self = qs({});
  const today = berlinDate();
  const monthLabel = new Date(`${date}T12:00:00Z`).toLocaleDateString("de-DE", { month: "long", year: "numeric" });
  const title = view === "day" ? `${fmt.weekday(`${date}T12:00:00Z`)}, ${fmt.date(`${date}T12:00:00Z`)}` : view === "week" ? `Woche ${fmt.date(`${d.range.from}T12:00:00Z`)} bis ${fmt.date(`${addDays(d.range.to, -1)}T12:00:00Z`)}` : monthLabel;
  const preselectLicense = sp["student"] ? d.activeLicenses.find((l) => l.student_id === sp["student"]) : undefined;
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">Kalender</h1><p className="text-sm text-ink-700">{title}</p></div>
        <div className="flex flex-wrap gap-2">
          <Link href={qs({ date: shiftDate(view, date, -1) })} className={btn.secondary}>Zurück</Link>
          <Link href={qs({ date: today })} className={btn.secondary}>Heute</Link>
          <Link href={qs({ date: shiftDate(view, date, 1) })} className={btn.secondary}>Weiter</Link>
          {(["day", "week", "month"] as const).map((v) => <Link key={v} href={qs({ view: v })} aria-current={view === v ? "page" : undefined} className={view === v ? btn.primary : btn.ghost}>{v === "day" ? "Tag" : v === "week" ? "Woche" : "Monat"}</Link>)}
        </div>
      </header>
      <Card>
        <form method="get" className="grid gap-3 md:grid-cols-6">
          <input type="hidden" name="view" value={view} />
          <div><label htmlFor="date" className={label}>Datum</label><input id="date" name="date" type="date" defaultValue={date} className={field} /></div>
          <div><label htmlFor="instructor" className={label}>Fahrlehrer</label><select id="instructor" name="instructor" defaultValue={filters.instructor ?? ""} className={field}><option value="">Alle</option>{d.instructors.map((i) => <option key={i.id} value={i.id}>{i.display_name}</option>)}</select></div>
          <div><label htmlFor="vehicle" className={label}>Fahrzeug</label><select id="vehicle" name="vehicle" defaultValue={filters.vehicle ?? ""} className={field}><option value="">Alle</option>{d.vehicles.map((v) => <option key={v.id} value={v.id}>{v.license_plate}</option>)}</select></div>
          <div><label htmlFor="transmission" className={label}>Getriebe</label><select id="transmission" name="transmission" defaultValue={filters.transmission ?? ""} className={field}><option value="">Alle</option><option value="manual">Schaltung</option><option value="automatic">Automatik</option></select></div>
          <div><label htmlFor="license" className={label}>Klasse</label><select id="license" name="license" defaultValue={filters.license ?? ""} className={field}><option value="">Alle</option>{d.licenses.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label htmlFor="status" className={label}>Status</label><select id="status" name="status" defaultValue={filters.status ?? ""} className={field}><option value="">Alle</option><option value="open">Frei</option><option value="booked">Anfrage</option><option value="confirmed">Bestätigt</option><option value="completed">Abgeschlossen</option></select></div>
          <div className="flex gap-2 md:col-span-6"><button className={btn.secondary}>Anwenden</button><Link href={`/verwaltung/kalender?view=${view}&date=${date}`} className={btn.ghost}>Filter zurücksetzen</Link></div>
        </form>
      </Card>

      {view === "month" ? (
        <div className="grid grid-cols-7 gap-1 text-xs">
          {WEEKDAY_SHORT.map((w) => <div key={w} className="p-1 text-center font-medium text-ink-500">{w}</div>)}
          {d.range.days.map((day) => {
            const items = d.byDay.get(day) ?? [];
            const inMonth = day.slice(0, 7) === date.slice(0, 7);
            return (
              <div key={day} className={`min-h-24 rounded-lg border p-1 ${inMonth ? "border-ink-100 bg-white" : "border-transparent bg-ink-50 text-ink-500"} ${day === today ? "ring-2 ring-brand-500" : ""}`}>
                <Link href={qs({ view: "day", date: day })} className="block font-medium hover:underline">{Number(day.slice(8, 10))}</Link>
                <div className="mt-1 space-y-0.5">{items.slice(0, 3).map((it) => <CalendarItem key={it.id} item={it} compact backHref={self} />)}{items.length > 3 && <Link href={qs({ view: "day", date: day })} className="block text-brand-700">+{items.length - 3} weitere</Link>}</div>
              </div>
            );
          })}
        </div>
      ) : view === "week" ? (
        <div className="grid gap-2 md:grid-cols-7">
          {d.range.days.map((day, i) => {
            const items = d.byDay.get(day) ?? [];
            return (
              <div key={day} className={`rounded-card bg-ink-50 p-2 ${day === today ? "ring-2 ring-brand-500" : ""}`}>
                <Link href={qs({ view: "day", date: day })} className="mb-2 block text-sm font-semibold hover:underline">{WEEKDAY_SHORT[i]} {fmt.date(`${day}T12:00:00Z`).slice(0, 5)}</Link>
                <div className="space-y-1">{items.length === 0 ? <p className="text-xs text-ink-500">Keine Termine</p> : items.map((it) => <CalendarItem key={it.id} item={it} backHref={self} />)}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {(() => {
            const items = d.byDay.get(date) ?? [];
            if (items.length === 0) return <EmptyState title="Keine Termine an diesem Tag" text="Lege unten einen Slot an oder wechsle den Tag." />;
            const groups = new Map<string, typeof items>();
            for (const it of items) { const key = it.kind === "lesson" ? it.instructor : `Theorie${it.instructor ? ` (${it.instructor})` : ""}`; groups.set(key, [...(groups.get(key) ?? []), it]); }
            return Array.from(groups.entries()).map(([name, list]) => (
              <Card key={name} title={name}>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">{list.map((it) => <CalendarItem key={it.id} item={it} backHref={self} />)}</div>
              </Card>
            ));
          })()}
          {d.absences.length > 0 && <p className="text-sm text-ink-700">Abwesend: {d.absences.map((a) => `${a.instructors?.display_name ?? ""} (${a.reason})`).join(", ")}</p>}
          {d.blocks.length > 0 && <p className="text-sm text-ink-700">Gesperrte Fahrzeuge: {d.blocks.map((b) => `${b.vehicles?.license_plate ?? ""} (${b.reason})`).join(", ")}</p>}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={`Buchungsanfragen (${d.requests.length})`}>
          {d.requests.length === 0 ? <p className="text-sm text-ink-700">Keine offenen Anfragen.</p> : (
            <ul className="divide-y divide-ink-100 text-sm">
              {d.requests.map((r) => { const p = parseRange(r.period); return (
                <li key={r.id} className="flex flex-wrap items-center gap-2 py-2">
                  <span className="tabular-nums">{fmt.date(p.start)} {fmt.time(p.start)}</span>
                  <span className="font-medium">{r.students ? `${r.students.first_name} ${r.students.last_name}` : ""}</span>
                  <span className="text-ink-500">{r.student_licenses?.license_code}, {LESSON_KIND_LABEL[r.kind] ?? r.kind}, {r.instructors?.display_name}</span>
                  <span className="ml-auto flex gap-1"><ActionButton action={confirmBooking.bind(null, r.id)} label="Bestätigen" tone="primary" small /><Link href={qs({ view: "day", date: berlinDate(new Date(p.start)) })} className={`${btn.ghost} min-h-9 px-3 text-sm`}>Im Kalender</Link></span>
                </li>
              ); })}
            </ul>
          )}
        </Card>
        <Card title={`Warteliste (${d.waitlist.length})`}>
          {d.waitlist.length === 0 ? <p className="text-sm text-ink-700">Niemand auf der Warteliste.</p> : (
            <ul className="divide-y divide-ink-100 text-sm">
              {d.waitlist.map((w) => (
                <li key={w.id} className="flex flex-wrap items-center gap-2 py-2">
                  <span className="font-medium">{w.students ? `${w.students.first_name} ${w.students.last_name}` : ""}</span>
                  <span className="text-ink-500">{w.student_licenses?.license_code}{w.transmission ? `, ${w.transmission === "automatic" ? "Automatik" : "Schaltung"}` : ""}{w.instructors ? `, ${w.instructors.display_name}` : ""}</span>
                  <span>{fmt.date(w.earliest)} bis {fmt.date(w.latest)}, {w.weekdays.map((n) => WEEKDAY_SHORT[n - 1]).join("/")}{w.time_from ? ` ${w.time_from.slice(0, 5)} bis ${w.time_to?.slice(0, 5) ?? ""}` : ""}</span>
                  <Pill tone={w.status === "offered" ? "warn" : "neutral"}>{w.status === "offered" ? "Angebot offen" : "Wartet"}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Stunde für Schüler buchen">
          <div id="buchen" />
          {d.openSlots.length === 0 ? <p className="text-sm text-ink-700">Im angezeigten Zeitraum gibt es keine freien Slots. Lege rechts einen Slot an und wähle dabei direkt den Schüler.</p> : (
            <ActionForm action={bookForStudent} submitLabel="Buchen" className="grid gap-3">
              <div><label htmlFor="lesson_id" className={label}>Freier Slot</label><select id="lesson_id" name="lesson_id" defaultValue={sp["slot"] ?? ""} required className={field}><option value="">Bitte wählen</option>{d.openSlots.map((s) => <option key={s.id} value={s.id}>{fmt.date(s.start)} {fmt.time(s.start)}, {s.instructor}{s.vehicle ? `, ${s.vehicle}` : ""}{s.transmission ? `, ${s.transmission === "automatic" ? "Automatik" : "Schaltung"}` : ""}{s.license_codes.length ? `, ${s.license_codes.join("/")}` : ""}</option>)}</select></div>
              <div><label htmlFor="student_license_id" className={label}>Schüler und Ausbildung</label><select id="student_license_id" name="student_license_id" defaultValue={preselectLicense?.id ?? ""} required className={field}><option value="">Bitte wählen</option>{d.activeLicenses.map((l) => <option key={l.id} value={l.id}>{l.students ? `${l.students.last_name}, ${l.students.first_name}` : "?"} (Klasse {l.license_code}, {l.transmission === "automatic" ? "Automatik" : "Schaltung"})</option>)}</select></div>
              <p className="text-xs text-ink-500">Die Buchung prüft Klasse, Getriebe, Fahrlehrerlaubnis, Verfügbarkeit und Fahrzeugsperren und wird sofort bestätigt.</p>
            </ActionForm>
          )}
        </Card>
        <Card title="Slot anlegen">
          <ActionForm action={createSlot} submitLabel="Slot anlegen" className="grid gap-3 md:grid-cols-2">
            <div><label htmlFor="s-instructor" className={label}>Fahrlehrer</label><select id="s-instructor" name="instructor_id" required defaultValue={filters.instructor ?? ""} className={field}><option value="">Bitte wählen</option>{d.instructors.map((i) => <option key={i.id} value={i.id}>{i.display_name}</option>)}</select></div>
            <div><label htmlFor="s-vehicle" className={label}>Fahrzeug</label><select id="s-vehicle" name="vehicle_id" defaultValue={filters.vehicle ?? ""} className={field}><option value="">Kein Fahrzeug</option>{d.vehicles.map((v) => <option key={v.id} value={v.id}>{v.license_plate} ({v.transmission === "automatic" ? "Automatik" : "Schaltung"})</option>)}</select></div>
            <div><label htmlFor="s-date" className={label}>Datum</label><input id="s-date" name="date" type="date" required defaultValue={date} className={field} /></div>
            <div><label htmlFor="s-time" className={label}>Beginn</label><input id="s-time" name="time" type="time" required defaultValue="08:00" className={field} /></div>
            <div><label htmlFor="s-units" className={label}>Einheiten (45 Minuten)</label><select id="s-units" name="units" className={field}><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></div>
            <div><label htmlFor="s-kind" className={label}>Art</label><select id="s-kind" name="kind" className={field}>{Object.entries(LESSON_KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div><label htmlFor="s-transmission" className={label}>Getriebe</label><select id="s-transmission" name="transmission" className={field}><option value="">Beides</option><option value="manual">Schaltung</option><option value="automatic">Automatik</option></select></div>
            <div><label htmlFor="s-price" className={label}>Preis (EUR, optional)</label><input id="s-price" name="price_eur" inputMode="decimal" placeholder="z. B. 65,00" className={field} /></div>
            <fieldset className="md:col-span-2"><legend className="mb-1 text-sm font-medium">Klassen (leer = alle)</legend><div className="flex flex-wrap gap-2">{d.licenses.map((c) => <label key={c} className="flex min-h-9 items-center gap-1 text-sm"><input type="checkbox" name="license_codes" value={c} className="h-4 w-4" /> {c}</label>)}</div></fieldset>
            <div className="md:col-span-2"><label htmlFor="s-meeting" className={label}>Treffpunkt</label><input id="s-meeting" name="meeting_point" className={field} /></div>
            <div><label htmlFor="s-student" className={label}>Direkt buchen für</label><select id="s-student" name="student_license_id" defaultValue={preselectLicense?.id ?? ""} className={field}><option value="">Als freien Slot anlegen</option>{d.activeLicenses.map((l) => <option key={l.id} value={l.id}>{l.students ? `${l.students.last_name}, ${l.students.first_name}` : "?"} ({l.license_code})</option>)}</select></div>
            <div><label htmlFor="s-repeat" className={label}>Wöchentlich wiederholen (Wochen)</label><input id="s-repeat" name="repeat_weeks" type="number" min={1} max={12} defaultValue={1} className={field} /></div>
            <p className="text-xs text-ink-500 md:col-span-2">Überschneidungen mit anderen Stunden des Fahrlehrers oder Fahrzeugs werden von der Datenbank abgelehnt und hier gemeldet. Freie Slots werden der Warteliste angeboten.</p>
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}
