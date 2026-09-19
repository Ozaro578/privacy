import Link from "next/link";
import { getAnalytics, type UtilizationRow } from "@/lib/data/admin-analytics";
import { Card, ProgressBar, StatTile, fmt } from "@/components/ui";
import { BarChart } from "@/components/admin/bar-chart";

export const metadata = { title: "Analytics" };

function UtilizationList({ rows, emptyText }: { rows: UtilizationRow[]; emptyText: string }) {
  if (rows.length === 0) return <p className="text-sm text-ink-500">{emptyText}</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.id}>
          <ProgressBar value={r.rate} label={`${r.label}: ${r.used} belegt, ${r.open} frei, ${r.completed} abgeschlossen`} tone={r.rate >= 75 ? "success" : r.rate >= 40 ? "brand" : "warn"} />
        </li>
      ))}
    </ul>
  );
}

export default async function AnalyticsPage() {
  const d = await getAnalytics();
  const eurShort = (c: number) => (Math.abs(c) >= 100_000 ? `${Math.round(c / 100_000)} T€` : fmt.eur(c));
  const months = d.avgTrainingDays !== null ? Math.round((d.avgTrainingDays / 30.4) * 10) / 10 : null;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-ink-700">Kennzahlen der Fahrschule, Stand {fmt.date(d.today)}. Auslastung bezieht sich auf die letzten vier Wochen ab {fmt.date(d.fourWeeksStart)}.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Aktive Schüler" value={d.activeStudents} hint="Status In Ausbildung" href="/verwaltung/schueler?status=active" />
        <StatTile label="Neue Schüler" value={d.newStudents30} hint="in den letzten 30 Tagen" href="/verwaltung/schueler" />
        <StatTile label="Fahrstunden" value={d.lessons12} hint="abgeschlossen in 12 Wochen" />
        <StatTile label="Ausbildungsdauer" value={months !== null ? `${String(months).replace(".", ",")} Monate` : "noch keine Daten"} hint={d.completedCount ? `Durchschnitt aus ${d.completedCount} bestandenen Prüfungen (${d.avgTrainingDays} Tage)` : "ab der ersten bestandenen praktischen Prüfung"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Fahrstunden pro Woche">
          <BarChart data={d.lessonsPerWeek} ariaLabel={`Abgeschlossene Fahrstunden je Woche seit ${fmt.date(d.weeksStart)}, insgesamt ${d.lessons12}`} format={(v) => String(Math.round(v))} tableCaption="Abgeschlossene Fahrstunden je Kalenderwoche (Montag)" unit="Fahrstunden" />
        </Card>
        <Card title="Umsatz pro Monat">
          <BarChart data={d.revenuePerMonth} ariaLabel={`Umsatz je Monat der letzten zwölf Monate, insgesamt ${fmt.eur(d.revenue12)}`} format={eurShort} tableCaption="Ausgestellte Rechnungen brutto abzüglich Gutschriften je Monat" unit="EUR" />
          <p className="mt-2 text-xs text-ink-500">Ausgestellte Rechnungen brutto nach Rechnungsdatum, Gutschriften abgezogen. Summe zwölf Monate: {fmt.eur(d.revenue12)}.</p>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Theorieprüfung bestanden" value={d.theoryRate.rate !== null ? `${d.theoryRate.rate} %` : "keine Daten"} hint={`${d.theoryRate.passed} von ${d.theoryRate.total} Versuchen`} href="/verwaltung/pruefungen?kind=theory" />
        <StatTile label="Praktische Prüfung bestanden" value={d.practicalRate.rate !== null ? `${d.practicalRate.rate} %` : "keine Daten"} hint={`${d.practicalRate.passed} von ${d.practicalRate.total} Versuchen`} href="/verwaltung/pruefungen?kind=practical" />
        <StatTile label="Offene Forderungen" value={fmt.eur(d.openCents)} hint={`${d.openCount} offene Rechnungen`} href="/verwaltung/finanzen?filter=open" />
        <StatTile label="Davon überfällig" value={fmt.eur(d.overdueCents)} hint="Fälligkeit überschritten" href="/verwaltung/finanzen?filter=overdue" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Auslastung je Fahrlehrer" action={<Link href="/verwaltung/team" className="text-sm text-brand-700 hover:underline">Team</Link>}>
          <p className="mb-3 text-xs text-ink-500">Belegte Slots (angefragt, bestätigt, abgeschlossen, nicht erschienen) im Verhältnis zu allen angebotenen Slots.</p>
          <UtilizationList rows={d.instructorUtilization} emptyText="Keine Fahrstunden im Zeitraum." />
        </Card>
        <Card title="Auslastung je Fahrzeug" action={<Link href="/verwaltung/fahrzeuge" className="text-sm text-brand-700 hover:underline">Fahrzeuge</Link>}>
          <p className="mb-3 text-xs text-ink-500">Nur Slots mit zugewiesenem Fahrzeug.</p>
          <UtilizationList rows={d.vehicleUtilization} emptyText="Keine Fahrstunden mit Fahrzeug im Zeitraum." />
        </Card>
      </div>
    </div>
  );
}
