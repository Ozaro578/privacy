import Link from "next/link";
import { getInstructorContext, loadInstructorToday, todayKey, LESSON_KIND_LABEL, LESSON_STATUS_LABEL } from "@/lib/data/instructor";
import { Card, Pill, Alert, StatTile, fmt } from "@/components/ui";
import { LessonQuickActions } from "@/components/instructor/today-actions";

export const metadata = { title: "Heute" };

function greeting(): string {
  const h = Number(new Date().toLocaleTimeString("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", hour12: false }));
  return h < 11 ? "Guten Morgen" : h < 18 ? "Hallo" : "Guten Abend";
}

const STATUS_TONE: Record<string, "neutral" | "brand" | "success" | "warn" | "danger"> = { open: "neutral", booked: "warn", confirmed: "brand", completed: "success", no_show: "danger", cancelled: "neutral" };

export default async function InstructorTodayPage() {
  const ctx = await getInstructorContext();
  const today = todayKey(ctx.school.timezone);
  const d = await loadInstructorToday(ctx, today);
  const nowIso = new Date().toISOString();
  const next = d.lessons.find((l) => l.end > nowIso && l.studentId && ["booked", "confirmed"].includes(l.status));
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">{greeting()}{ctx.instructor ? `, ${ctx.instructor.display_name}` : ""}</h1>
        <p className="text-sm text-ink-700">{fmt.weekday(`${today}T12:00:00Z`)}, {fmt.date(`${today}T12:00:00Z`)}{ctx.isOffice && !ctx.instructor ? " · Ansicht des Büros: alle Fahrlehrer" : ""}</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Fahrstunden heute" value={d.lessons.filter((l) => l.studentId).length} hint={`${d.lessons.filter((l) => !l.studentId).length} freie Slots`} href="/lehrer/kalender" />
        <StatTile label="Nächste Stunde" value={next ? fmt.time(next.start) : "Keine"} hint={next ? next.studentName ?? "" : "Heute nichts mehr offen"} />
        <StatTile label="Theorieunterricht" value={d.classes.length} hint={d.classes[0] ? `${fmt.time(d.classes[0].start)} ${d.classes[0].code}` : "Heute kein Unterricht"} href="/lehrer/unterricht" />
        <StatTile label="Offene Dokumentationen" value={d.openDocs.length} hint={d.openDocs.length ? "Bitte nachtragen" : "Alles dokumentiert"} />
      </div>

      <Card title="Fahrstunden heute" action={<Link href="/lehrer/kalender" className="text-sm text-brand-700 underline">Kalender</Link>}>
        {d.lessons.length === 0 ? <p className="text-sm text-ink-700">Für heute sind keine Fahrstunden eingetragen. <Link href="/lehrer/kalender" className="text-brand-700 underline">Freie Slots anlegen</Link></p> : (
          <ul className="divide-y divide-ink-100">{d.lessons.map((l) => (
            <li key={l.id} className={`py-3 ${next?.id === l.id ? "rounded-xl bg-brand-50 px-3" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold tabular-nums">{fmt.time(l.start)} bis {fmt.time(l.end)} · {l.studentLicenseId ? <Link href={`/lehrer/schueler/${l.studentLicenseId}`} className="text-brand-700 underline">{l.studentName}</Link> : <span className="text-ink-500">Freier Slot</span>}</p>
                  <p className="text-sm text-ink-700">{l.licenseCode ? `Klasse ${l.licenseCode} · ` : ""}{LESSON_KIND_LABEL[l.kind] ?? l.kind} · {l.units} × 45 Min{l.vehicle ? ` · ${l.vehicle}` : ""}{l.meetingPoint ? ` · Treffpunkt: ${l.meetingPoint}` : ""}{ctx.isOffice && !ctx.instructor && l.instructorName ? ` · ${l.instructorName}` : ""}</p>
                </div>
                <Pill tone={STATUS_TONE[l.status] ?? "neutral"}>{LESSON_STATUS_LABEL[l.status] ?? l.status}</Pill>
              </div>
              <div className="mt-2"><LessonQuickActions lessonId={l.id} status={l.status} hasEvaluation={l.hasEvaluation} hasStudent={!!l.studentId} /></div>
            </li>
          ))}</ul>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Theorieunterricht heute" action={<Link href="/lehrer/unterricht" className="text-sm text-brand-700 underline">Alle</Link>}>
          {d.classes.length === 0 ? <p className="text-sm text-ink-700">Heute kein Theorieunterricht.</p> : (
            <ul className="divide-y divide-ink-100">{d.classes.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div><p className="font-semibold">{fmt.time(c.start)} bis {fmt.time(c.end)} · <span className="font-mono text-xs">{c.code}</span> {c.title}</p><p className="text-sm text-ink-700">{c.location ?? "Online"} · {c.attendees} anwesend</p></div>
                <Link href={`/lehrer/unterricht/${c.id}`} className="rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white">{c.status === "running" ? "Weiter" : "Unterricht starten"}</Link>
              </li>
            ))}</ul>
          )}
        </Card>

        <Card title="Hinweise">
          <div className="space-y-3">
            {d.weaknesses.length === 0 && d.releases.length === 0 && d.openDocs.length === 0 && <p className="text-sm text-ink-700">Keine Hinweise. Alle heutigen Schüler sind in der Theorie ohne auffällige Schwächen.</p>}
            {d.weaknesses.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500">Theorie-Schwächen der heutigen Schüler</p>
                <ul className="mt-1 space-y-1 text-sm">{d.weaknesses.slice(0, 8).map((w, i) => (
                  <li key={`${w.studentLicenseId}-${w.topicName}-${i}`} className="rounded-lg bg-warn-100 p-2">
                    <span className="font-medium">{w.studentName}</span>: Theoretische Unsicherheit: {w.topicName} ({Math.round(w.mastery * 100)} %)
                    {w.studentLicenseId && <Link href={`/lehrer/schueler/${w.studentLicenseId}`} className="ml-1 text-brand-700 underline">Profil</Link>}
                  </li>
                ))}</ul>
              </div>
            )}
            {d.releases.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500">Offene Freigaben</p>
                <ul className="mt-1 space-y-1 text-sm">{d.releases.map((r) => (
                  <li key={`${r.studentLicenseId}-${r.kind}`} className="flex items-center justify-between rounded-lg bg-brand-50 p-2">
                    <span><span className="font-medium">{r.studentName}</span> (Klasse {r.licenseCode}): {r.kind === "theory" ? "Theorieprüfung" : "Praktische Prüfung"}</span>
                    <Link href={`/lehrer/schueler/${r.studentLicenseId}`} className="text-brand-700 underline">Prüfen</Link>
                  </li>
                ))}</ul>
              </div>
            )}
            {d.openDocs.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500">Offene Dokumentationen</p>
                <ul className="mt-1 space-y-1 text-sm">{d.openDocs.slice(0, 8).map((o) => (
                  <li key={o.id} className="flex items-center justify-between rounded-lg border border-ink-100 p-2">
                    <span>{fmt.date(o.start)} {fmt.time(o.start)} · {o.studentName}</span>
                    <Link href={`/lehrer/dokumentation/${o.id}`} className="text-brand-700 underline">Nachtragen</Link>
                  </li>
                ))}</ul>
              </div>
            )}
          </div>
        </Card>
      </div>

      {!ctx.instructor && ctx.isOffice && <Alert tone="info">Sie sehen diesen Bereich als Büro. Eigene Slots, Unterricht und Prüfungssimulationen können nur Fahrlehrer mit eigenem Datensatz anlegen.</Alert>}
    </div>
  );
}
