import Link from "next/link";
import type { DashboardData } from "@/lib/data/dashboard";
import { Card, ProgressBar, ReadinessGauge, StatTile, Alert, btn, fmt } from "@/components/ui";
import { TodayItemLink, todayHref } from "@/components/today-item-link";

export interface TodayViewProps { firstName: string; licenseName: string; transmission: string; rulesNeedVerification: boolean; d: DashboardData }

function greeting(): string {
  const h = Number(new Date().toLocaleTimeString("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", hour12: false }));
  return h < 11 ? "Guten Morgen" : h < 18 ? "Hallo" : "Guten Abend";
}

/** Darstellung der Heute-Seite, getrennt vom Datenzugriff (auch für die Vorschau nutzbar). */
export function TodayView({ firstName, licenseName, transmission, rulesNeedVerification, d }: TodayViewProps) {
  const first = d.today[0];
  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{greeting()}, {firstName} 👋</h1>
          <p className="text-sm text-ink-700">{licenseName} · {transmission === "automatic" ? "Automatik" : "Schaltung"}</p>
        </div>
        {d.streak && d.streak.current_days > 0 && <div className="rounded-full bg-accent-400/30 px-3 py-1 text-sm font-semibold" title="Lernserie">🔥 {d.streak.current_days} Tage</div>}
      </header>

      {rulesNeedVerification && <Alert tone="warning" title="Regelwerte in Prüfung">Die Prüfungsregeln für {licenseName} sind hinterlegt, aber noch nicht fachlich freigegeben. Simulationen sind vorläufig.</Alert>}

      <Card>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <ReadinessGauge score={d.readinessScore} />
          <div className="flex-1 space-y-3">
            <p className="text-xs uppercase tracking-wide text-ink-500">Prüfungsreife</p>
            <ProgressBar value={d.theoryPercent} label="Theorie" />
            <ProgressBar value={d.practicalPercent ?? 0} label="Praxis" tone="success" />
            <p className="text-xs text-ink-500">Die Prüfungsreife ist eine Einschätzung aus deinem Lernverhalten und keine Garantie für das Bestehen.</p>
            <Link href="/lernen/statistik" className="text-sm text-brand-700 underline">Wie setzt sich der Wert zusammen?</Link>
          </div>
        </div>
      </Card>

      {first && (
        <Card className="border border-brand-200 bg-brand-50">
          <p className="text-xs uppercase tracking-wide text-brand-700">Heute empfohlen</p>
          <p className="mt-1 text-lg font-semibold">{first.title}</p>
          {first.subtitle && <p className="text-sm text-ink-700">{first.subtitle}</p>}
          <Link href={todayHref(first)} className={`${btn.primary} mt-3`}>Training starten</Link>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Nächste Fahrstunde" value={d.nextLesson ? `${fmt.weekday(d.nextLesson.start).slice(0, 2)} ${fmt.time(d.nextLesson.start)}` : "Keine"} hint={d.nextLesson ? `${fmt.date(d.nextLesson.start)} · ${d.nextLesson.instructor}` : "Jetzt buchen"} href="/fahren" />
        <StatTile label="Theorieunterricht" value={d.nextTheoryClass ? fmt.date(d.nextTheoryClass.start) : `${d.training.theory?.basic_attended ?? 0}/${d.training.theory?.basic_required ?? 12}`} hint={d.nextTheoryClass ? d.nextTheoryClass.title : "Grundstoff besucht"} href="/theorie" />
        <StatTile label="Offene Aufgaben" value={d.missingDocuments.length + (d.overview.dueCount > 0 ? 1 : 0)} hint={d.missingDocuments.length ? `${d.missingDocuments.length} Dokument(e) fehlen` : "Alles erledigt"} href="/profil" />
        <StatTile label="Offene Zahlungen" value={fmt.eur(d.openInvoiceCents)} hint={d.openInvoiceCents > 0 ? "Jetzt ansehen" : "Nichts offen"} href="/finanzen" />
      </div>

      <Card title="Heute" action={<span className="text-xs text-ink-500">automatisch priorisiert</span>}>
        {d.today.length === 0 ? <p className="text-sm text-ink-700">Für heute ist nichts offen. Wiederhole trotzdem ein paar Fragen, um deine Serie zu halten.</p> : (
          <ol className="space-y-2">{d.today.map((item, i) => <li key={`${item.kind}-${i}`}><TodayItemLink item={item} index={i + 1} /></li>)}</ol>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Lernstand">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-ink-500">Fragen beantwortet</dt><dd className="text-lg font-semibold">{d.overview.answeredQuestions} / {d.overview.totalQuestions}</dd></div>
            <div><dt className="text-ink-500">Fällige Wiederholungen</dt><dd className="text-lg font-semibold">{d.overview.dueCount}</dd></div>
            <div><dt className="text-ink-500">Tagesziel</dt><dd className="text-lg font-semibold">{d.todayGoal ? `${d.todayGoal.answered} / ${d.todayGoal.target}` : "0 / 20"}</dd></div>
            <div><dt className="text-ink-500">Level</dt><dd className="text-lg font-semibold">{d.streak?.level ?? 1} · {d.streak?.total_xp ?? 0} XP</dd></div>
          </dl>
          {d.weaknessStatement && <p className="mt-3 rounded-lg bg-warn-100 p-2 text-sm">{d.weaknessStatement}</p>}
          {d.training.profile.statement && <p className="mt-2 rounded-lg bg-brand-50 p-2 text-sm">{d.training.profile.statement}</p>}
        </Card>
        <Card title="Nachrichten der Fahrschule" action={<Link href="/profil/nachrichten" className="text-sm text-brand-700 underline">Alle</Link>}>
          {d.unreadNotifications.length === 0 && d.unreadMessages === 0 ? <p className="text-sm text-ink-700">Keine neuen Nachrichten.</p> : (
            <ul className="space-y-2 text-sm">
              {d.unreadMessages > 0 && <li className="rounded-lg bg-brand-50 p-2">{d.unreadMessages} ungelesene Chat-Nachricht(en)</li>}
              {d.unreadNotifications.map((n) => <li key={n.id} className="rounded-lg border border-ink-100 p-2"><p className="font-medium">{n.title}</p><p className="text-ink-700">{n.body}</p></li>)}
            </ul>
          )}
        </Card>
      </div>

      {(d.exams.theoryAt || d.exams.practicalAt) && (
        <Card title="Prüfungstermine">
          <ul className="space-y-1 text-sm">
            {d.exams.theoryAt && <li>Theorieprüfung: <strong>{fmt.date(d.exams.theoryAt)} {fmt.time(d.exams.theoryAt)}</strong></li>}
            {d.exams.practicalAt && <li>Praktische Prüfung: <strong>{fmt.date(d.exams.practicalAt)} {fmt.time(d.exams.practicalAt)}</strong></li>}
          </ul>
        </Card>
      )}
    </div>
  );
}
