import Link from "next/link";
import { notFound } from "next/navigation";
import { getInstructorContext, loadStudentDetail, LESSON_KIND_LABEL, LESSON_STATUS_LABEL, EXAM_STATUS_LABEL } from "@/lib/data/instructor";
import { Card, Pill, ProgressBar, ReadinessGauge, fmt, Alert } from "@/components/ui";
import { ReleaseButton, NotesForm, MessageStudentButton, StartMockButton } from "@/components/instructor/student-detail-actions";

export const metadata = { title: "Schülerprofil" };

const SPECIAL_LABEL: Record<string, string> = { overland: "Überlandfahrten", motorway: "Autobahnfahrten", night: "Nachtfahrten" };
const Stars = ({ n }: { n: number }) => <span aria-label={`${n} von 5 Sternen`} className="text-accent-400">{"★".repeat(n)}<span className="text-ink-300">{"★".repeat(5 - n)}</span></span>;

function releaseBlock(status: string, kind: "theory" | "practical", canRelease: boolean, readiness: number | null, theoryPassed: boolean): string | null {
  if (!canRelease) return "Nur der zuständige Fahrlehrer oder das Büro darf freigeben.";
  if (["ready", "requested", "scheduled", "passed"].includes(status)) return `Bereits ${EXAM_STATUS_LABEL[status]?.toLowerCase() ?? status}.`;
  if (kind === "practical" && !theoryPassed) return "Die Theorieprüfung ist noch nicht bestanden.";
  if (kind === "theory" && readiness !== null && readiness < 40) return null;
  return null;
}

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getInstructorContext();
  const d = await loadStudentDetail(ctx, id);
  if (!d) notFound();
  const t = d.training;
  const theoryPassed = d.license.theory_exam_status === "passed";
  const skillName = (code: string) => d.skills.find((s) => s.code === code)?.name ?? code;
  const weakTopics = d.topicMastery.filter((m) => m.mastery < 0.5 && m.attempts > 0);
  const canEdit = d.canRelease;
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/lehrer/schueler" className="text-sm text-brand-700 underline">Zurück zur Liste</Link>
          <h1 className="text-2xl font-bold">{d.student.first_name} {d.student.last_name}</h1>
          <p className="text-sm text-ink-700">{d.licenseName} · {d.license.transmission === "automatic" ? "Automatik" : "Schaltung"} · seit {fmt.date(d.license.started_at)}{d.license.status !== "active" ? ` · ${d.license.status === "paused" ? "pausiert" : d.license.status}` : ""}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MessageStudentButton studentId={d.student.id} hasAccount={!!d.student.user_id} />
          <StartMockButton licenseId={d.license.id} canStart={!!ctx.instructor} />
        </div>
      </header>

      {d.rules.training?.needsVerification && <Alert tone="warning" title="Regelwerte in Prüfung">Die Ausbildungsregeln für {d.licenseName} sind noch nicht fachlich freigegeben.</Alert>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Prüfungsreife">
          <div className="flex flex-col items-center gap-2">
            <ReadinessGauge score={d.readiness?.overall ?? null} size={132} />
            {d.readiness && <p className="text-xs text-ink-500">Theorie {d.readiness.theory} %{d.readiness.practical !== null ? ` · Praxis ${d.readiness.practical} %` : ""} · Stand {fmt.date(d.readiness.computedAt)}</p>}
          </div>
        </Card>
        <Card title="Sonderfahrten" className="md:col-span-2">
          {t ? (
            <>
              <ul className="space-y-3">{t.special_drives.map((s) => <li key={s.kind}><ProgressBar value={s.percent} label={`${SPECIAL_LABEL[s.kind] ?? s.kind}: ${s.completed_units} von ${s.required_units} Einheiten`} tone={s.remaining_units === 0 ? "success" : "brand"} /></li>)}</ul>
              {t.manual_lessons_required !== null && <p className="mt-3 text-sm">Schaltstunden (B197): {t.manual_lessons_completed} von {t.manual_lessons_required}{t.manual_requirement_met ? " erfüllt" : ""}</p>}
              <p className="mt-2 text-xs text-ink-500">Gesamt {t.special_drives_percent} %{t.all_special_drives_done ? ", alle Pflichtfahrten absolviert" : ""}.</p>
            </>
          ) : <p className="text-sm text-ink-700">Für diese Klasse sind keine Sonderfahrten hinterlegt.</p>}
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Prüfungsstatus">
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><dt>Theorieprüfung</dt><dd><Pill tone={theoryPassed ? "success" : d.license.theory_exam_status === "awaiting_instructor_release" ? "warn" : "neutral"}>{EXAM_STATUS_LABEL[d.license.theory_exam_status] ?? d.license.theory_exam_status}</Pill></dd></div>
            {d.theoryExam?.scheduled_at && <p className="text-xs text-ink-500">Termin: {fmt.date(d.theoryExam.scheduled_at)} {fmt.time(d.theoryExam.scheduled_at)}{d.theoryExam.result ? ` · ${d.theoryExam.result === "passed" ? "bestanden" : "nicht bestanden"}` : ""} (Versuch {d.theoryExam.attempt_no})</p>}
            <div className="flex items-center justify-between"><dt>Praktische Prüfung</dt><dd><Pill tone={d.license.practical_exam_status === "passed" ? "success" : d.license.practical_exam_status === "awaiting_instructor_release" ? "warn" : "neutral"}>{EXAM_STATUS_LABEL[d.license.practical_exam_status] ?? d.license.practical_exam_status}</Pill></dd></div>
            {d.practicalExam?.scheduled_at && <p className="text-xs text-ink-500">Termin: {fmt.date(d.practicalExam.scheduled_at)} {fmt.time(d.practicalExam.scheduled_at)}{d.practicalExam.result ? ` · ${d.practicalExam.result === "passed" ? "bestanden" : "nicht bestanden"}` : ""} (Versuch {d.practicalExam.attempt_no})</p>}
          </dl>
          <div className="mt-4 space-y-3">
            <ReleaseButton licenseId={d.license.id} kind="theory" disabledReason={releaseBlock(d.license.theory_exam_status, "theory", d.canRelease, d.readiness?.overall ?? null, theoryPassed)} />
            <ReleaseButton licenseId={d.license.id} kind="practical" disabledReason={releaseBlock(d.license.practical_exam_status, "practical", d.canRelease, d.readiness?.overall ?? null, theoryPassed)} />
            <p className="text-xs text-ink-500">Die Freigabe ist eine fachliche Entscheidung des Fahrlehrers. Die Prüfungsreife ist eine Orientierung, keine Voraussetzung.</p>
          </div>
        </Card>

        <Card title="Kompetenzprofil">
          {d.profile.overall_percent === null ? <p className="text-sm text-ink-700">Noch keine Bewertungen. Nach der nächsten dokumentierten Fahrstunde erscheint hier das Profil.</p> : (
            <>
              <p className="mb-3 text-sm">Gesamt <strong>{d.profile.overall_percent} %</strong>{d.profile.statement ? ` · ${d.profile.statement}` : ""}</p>
              <ul className="space-y-2">{d.profile.skills.filter((s) => s.percent !== null).map((s) => (
                <li key={s.skill_code}>
                  <ProgressBar value={s.percent!} label={`${s.name}${s.trend !== null ? ` (${s.trend > 0 ? "▲" : s.trend < 0 ? "▼" : "▬"} ${s.trend > 0 ? "+" : ""}${s.trend} %)` : ""}`} tone={s.percent! < 60 ? "warn" : "success"} />
                </li>
              ))}</ul>
              <p className="mt-2 text-xs text-ink-500">Trend: Vergleich der jüngsten mit der ältesten Bewertung je Kompetenz.</p>
            </>
          )}
        </Card>
      </div>

      <Card title="Nächste Lernziele">
        {d.nextGoals.length === 0 ? <p className="text-sm text-ink-700">Noch keine Lernziele aus der letzten Dokumentation.</p> : <ul className="list-disc space-y-1 pl-5 text-sm">{d.nextGoals.map((g, i) => <li key={i}>{g}</li>)}</ul>}
      </Card>

      <Card title="Theorie-Lernstand">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-500">Themen mit Schwächen</p>
            {weakTopics.length === 0 ? <p className="mt-1 text-sm text-ink-700">Keine Themen unter 50 % Beherrschung{d.topicMastery.length === 0 ? " (noch keine Lerndaten)" : ""}.</p> : (
              <ul className="mt-1 space-y-2">{weakTopics.slice(0, 8).map((m) => <li key={m.topicId}><ProgressBar value={m.mastery * 100} label={`${m.name}${m.practicalSkillCode ? ` (Praxis: ${skillName(m.practicalSkillCode)})` : ""}`} tone="warn" /></li>)}</ul>
            )}
            {d.topicMastery.length > 0 && <p className="mt-2 text-xs text-ink-500">{d.topicMastery.length} Themen bearbeitet, Grundstoff-Unterricht besucht: {[...new Set(d.attendedUnits.filter((u) => u.startsWith("G")))].length} Einheiten.</p>}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-500">Letzte Prüfungssimulationen</p>
            {d.simulations.length === 0 ? <p className="mt-1 text-sm text-ink-700">Noch keine Simulation abgeschlossen.</p> : (
              <ul className="mt-1 divide-y divide-ink-100 text-sm">{d.simulations.map((s) => <li key={s.id} className="flex items-center justify-between py-2"><span>{fmt.date(s.submitted_at)} · {s.error_points ?? 0} Fehlerpunkte · {s.correct_count ?? 0} richtig, {s.wrong_count ?? 0} falsch</span><Pill tone={s.passed ? "success" : "danger"}>{s.passed ? "bestanden" : "nicht bestanden"}</Pill></li>)}</ul>
            )}
          </div>
        </div>
      </Card>

      <Card title="Letzte Fahrstunden">
        {d.lessons.length === 0 ? <p className="text-sm text-ink-700">Noch keine Fahrstunden.</p> : (
          <ul className="divide-y divide-ink-100">{d.lessons.slice(0, 20).map((l) => (
            <li key={l.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{fmt.date(l.start)} · {fmt.time(l.start)} bis {fmt.time(l.end)} · {LESSON_KIND_LABEL[l.kind] ?? l.kind} · {l.units} × 45 Min{l.instructor ? ` · ${l.instructor}` : ""}</p>
                <div className="flex items-center gap-2">
                  <Pill tone={l.status === "completed" ? "success" : l.status === "no_show" ? "danger" : "neutral"}>{LESSON_STATUS_LABEL[l.status] ?? l.status}</Pill>
                  {(l.status === "completed" || l.status === "confirmed" || l.status === "booked") && <Link href={`/lehrer/dokumentation/${l.id}`} className="text-sm text-brand-700 underline">{l.evaluation ? "Dokumentation" : "Dokumentieren"}</Link>}
                </div>
              </div>
              {l.evaluation && (
                <div className="mt-2 rounded-xl bg-ink-100 p-3 text-sm">
                  {l.evaluation.overall_rating && <p>Gesamteindruck: <Stars n={l.evaluation.overall_rating} /></p>}
                  {l.evaluation.contents.length > 0 && <p>Inhalte: {l.evaluation.contents.map(skillName).join(", ")}</p>}
                  {l.ratings.length > 0 && <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">{l.ratings.map((r) => <li key={r.skill_code}>{skillName(r.skill_code)} <Stars n={r.rating} /></li>)}</ul>}
                  {l.evaluation.comment && <p className="mt-1 text-ink-700">{l.evaluation.comment}</p>}
                  {l.evaluation.next_goals.length > 0 && <p className="mt-1 text-ink-700">Nächste Ziele: {l.evaluation.next_goals.join("; ")}</p>}
                  {!l.evaluation.shared_with_student && <p className="mt-1 text-xs text-ink-500">Nicht für den Schüler sichtbar.</p>}
                </div>
              )}
            </li>
          ))}</ul>
        )}
      </Card>

      {d.mocks.length > 0 && (
        <Card title="Prüfungssimulationen (Praxis)" action={<Link href={`/lehrer/mock/${d.license.id}`} className="text-sm text-brand-700 underline">Alle</Link>}>
          <ul className="divide-y divide-ink-100 text-sm">{d.mocks.map((m) => <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><span>{fmt.date(m.started_at)} {fmt.time(m.started_at)}{m.improvements.length ? ` · Üben: ${m.improvements.slice(0, 3).join(", ")}` : ""}</span><Pill tone={m.status === "running" ? "warn" : (m.overall_score ?? 0) >= 80 ? "success" : "neutral"}>{m.status === "running" ? "läuft" : m.status === "aborted" ? "abgebrochen" : `${m.overall_score ?? 0} / 100`}</Pill></li>)}</ul>
        </Card>
      )}

      <Card title="Notizen">
        <NotesForm studentId={d.student.id} initial={d.student.notes_internal ?? ""} editable={canEdit} />
      </Card>
    </div>
  );
}
