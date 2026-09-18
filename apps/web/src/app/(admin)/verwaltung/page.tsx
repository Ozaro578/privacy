import Link from "next/link";
import { getDashboard } from "@/lib/data/admin-dashboard";
import { LESSON_KIND_LABEL, LESSON_STATUS_LABEL } from "@/lib/data/admin";
import { Card, EmptyState, Pill, StatTile, fmt, parseRange } from "@/components/ui";

export const metadata = { title: "Übersicht" };

export default async function AdminOverview() {
  const d = await getDashboard();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Übersicht</h1>
        <p className="text-sm text-ink-700">Stand {fmt.date(`${d.today}T12:00:00Z`)}</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile label="Fahrstunden heute" value={d.lessonsToday.length} href="/verwaltung/kalender" />
        <StatTile label="Buchungsanfragen" value={d.counts.bookingRequests} href="/verwaltung/kalender?status=booked" hint="warten auf Bestätigung" />
        <StatTile label="Anmeldungen" value={d.counts.registrations} href="/verwaltung/schueler?status=registered" hint="noch nicht aktiviert" />
        <StatTile label="Überfällige Rechnungen" value={d.counts.overdue} href="/verwaltung/finanzen?filter=overdue" hint={d.counts.overdueCents > 0 ? `${fmt.eur(d.counts.overdueCents)} offen` : "nichts überfällig"} />
        <StatTile label="Dokumente in Prüfung" value={d.counts.docsReview} href="/verwaltung/dokumente" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Aufgaben">
          <ul className="divide-y divide-ink-100">
            {d.tasks.map((t) => (
              <li key={t.title}>
                <Link href={t.href} className="flex min-h-11 items-center justify-between gap-3 py-2 hover:text-brand-700">
                  <span>{t.title}</span>
                  <Pill tone={t.count === 0 ? "neutral" : t.tone}>{t.count}</Pill>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Fahrstunden heute" action={<Link href="/verwaltung/kalender" className="text-sm text-brand-700 underline">Kalender</Link>}>
          {d.lessonsToday.length === 0 ? (
            <EmptyState title="Heute sind keine Fahrstunden geplant" action={<Link href="/verwaltung/kalender" className="text-brand-700 underline">Slot anlegen</Link>} />
          ) : (
            <ul className="divide-y divide-ink-100">
              {d.lessonsToday.map((l) => {
                const r = parseRange(l.period);
                return (
                  <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span className="tabular-nums font-medium">{fmt.time(r.start)} bis {fmt.time(r.end)}</span>
                    <span>{l.students ? `${l.students.first_name} ${l.students.last_name}` : "Ohne Schüler"}</span>
                    <span className="text-ink-700">{l.instructors?.display_name}</span>
                    <span className="text-ink-500">{LESSON_KIND_LABEL[l.kind] ?? l.kind}</span>
                    <Pill tone={l.status === "booked" ? "warn" : l.status === "completed" ? "success" : "brand"}>{LESSON_STATUS_LABEL[l.status] ?? l.status}</Pill>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
