import Link from "next/link";
import { getInstructorContext, loadInstructorWeek, todayKey, mondayOf, addDaysKey, LESSON_STATUS_LABEL } from "@/lib/data/instructor";
import { Card, Pill, fmt, Alert } from "@/components/ui";
import { SlotForm, SlotActions, AbsenceForm, AvailabilityForm } from "@/components/instructor/calendar-forms";

export const metadata = { title: "Kalender" };

const TONE: Record<string, string> = { open: "border-ink-300 bg-surface", booked: "border-warn-500/50 bg-warn-100", confirmed: "border-brand-200 bg-brand-50", completed: "border-success-500/30 bg-success-100", no_show: "border-danger-500/40 bg-danger-100", absence: "border-ink-300 bg-ink-100", planned: "border-accent-400/50 bg-accent-400/20", running: "border-accent-400/50 bg-accent-400/20" };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ woche?: string }> }) {
  const { woche } = await searchParams;
  const ctx = await getInstructorContext();
  const tz = ctx.school.timezone;
  const today = todayKey(tz);
  const monday = /^\d{4}-\d{2}-\d{2}$/.test(woche ?? "") ? mondayOf(woche!) : mondayOf(today);
  const week = await loadInstructorWeek(ctx, monday);
  const days = Array.from({ length: 7 }, (_, i) => addDaysKey(monday, i));
  const label = (k: string) => new Date(`${k}T12:00:00Z`).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
  const stats = { open: week.entries.filter((e) => e.kind === "lesson" && e.status === "open").length, booked: week.entries.filter((e) => e.kind === "lesson" && ["booked", "confirmed"].includes(e.status)).length };
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Kalender</h1><p className="text-sm text-ink-700">Woche ab {fmt.date(`${monday}T12:00:00Z`)} · {stats.booked} gebucht, {stats.open} frei{ctx.isOffice && !ctx.instructor ? " · alle Fahrlehrer" : ""}</p></div>
        <nav aria-label="Woche wechseln" className="flex gap-2">
          <Link href={`/lehrer/kalender?woche=${addDaysKey(monday, -7)}`} className="rounded-full border border-ink-300 px-4 py-2 text-sm">Vorige Woche</Link>
          <Link href="/lehrer/kalender" className="rounded-full border border-ink-300 px-4 py-2 text-sm">Heute</Link>
          <Link href={`/lehrer/kalender?woche=${addDaysKey(monday, 7)}`} className="rounded-full border border-ink-300 px-4 py-2 text-sm">Nächste Woche</Link>
        </nav>
      </header>

      {ctx.instructor ? <SlotForm defaultDate={today >= monday && today < addDaysKey(monday, 7) ? today : monday} vehicles={week.vehicles} prices={week.prices} licenses={week.licenses} instructorClasses={week.instructorClasses} /> : <Alert tone="info">Slots, Abwesenheiten und Arbeitszeiten legt jeder Fahrlehrer für sich an. Als Büro sehen Sie hier die Termine aller Fahrlehrer.</Alert>}

      <div className="grid gap-2 md:grid-cols-7">{days.map((d) => {
        const items = week.entries.filter((e) => e.dayKey === d);
        return (
          <section key={d} className={`rounded-card bg-surface p-2 shadow-card ${d === today ? "ring-2 ring-brand-500" : ""}`} aria-label={label(d)}>
            <h2 className="mb-2 text-sm font-semibold">{label(d)}</h2>
            {items.length === 0 ? <p className="text-xs text-ink-500">Keine Termine</p> : (
              <ul className="space-y-1">{items.map((e) => (
                <li key={`${e.kind}-${e.id}`} className={`rounded-lg border p-2 text-xs ${TONE[e.status] ?? "border-ink-300 bg-surface"}`}>
                  <p className="font-semibold tabular-nums">{fmt.time(e.start)} bis {fmt.time(e.end)}</p>
                  <p>{e.kind === "theory" ? <Link href={`/lehrer/unterricht/${e.id}`} className="text-brand-700 underline">{e.title}</Link> : e.title}</p>
                  {e.subtitle && <p className="text-ink-700">{e.subtitle}</p>}
                  {ctx.isOffice && !ctx.instructor && e.instructorName && <p className="text-ink-500">{e.instructorName}</p>}
                  <div className="mt-1 flex items-center justify-between gap-1">
                    {e.kind === "lesson" && <Pill tone={e.status === "open" ? "neutral" : e.status === "confirmed" ? "brand" : e.status === "completed" ? "success" : e.status === "no_show" ? "danger" : "warn"}>{LESSON_STATUS_LABEL[e.status] ?? e.status}</Pill>}
                    {e.kind === "lesson" && (e.status === "completed" || e.status === "confirmed") && e.title !== "Freier Slot" && <Link href={`/lehrer/dokumentation/${e.id}`} className="text-brand-700 underline">Doku</Link>}
                    {e.kind === "lesson" && <SlotActions lessonId={e.id} status={e.status} hasStudent={e.title !== "Freier Slot"} />}
                  </div>
                </li>
              ))}</ul>
            )}
          </section>
        );
      })}</div>

      {ctx.instructor && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Abwesenheiten"><AbsenceForm absences={week.entries.filter((e) => e.kind === "absence").map((a) => ({ id: a.id, start: a.start, end: a.end, title: a.title, subtitle: a.subtitle }))} /></Card>
          <Card title="Arbeitszeiten und Pausen"><AvailabilityForm rows={week.availability.map((r) => ({ id: r.id, weekday: r.weekday, start_time: r.start_time, end_time: r.end_time, kind: r.kind }))} /></Card>
        </div>
      )}
    </div>
  );
}
