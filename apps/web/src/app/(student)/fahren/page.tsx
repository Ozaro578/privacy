import Link from "next/link";
import { getStudentContext } from "@/lib/data/student";
import { loadStudentLessons, LESSON_KIND_LABEL } from "@/lib/data/lessons";
import { loadTrainingStatus } from "@/lib/data/training";
import { Card, ProgressBar, Alert, btn, fmt, Pill, parseRange } from "@/components/ui";
import { CancelButton, OfferButtons } from "@/components/lessons/lesson-actions";

export const metadata = { title: "Fahren" };

export default async function DrivingPage() {
  const ctx = await getStudentContext();
  const [{ upcoming, past }, status, { data: policy }, { data: offers }, { data: skills }] = await Promise.all([
    loadStudentLessons(ctx), loadTrainingStatus(ctx),
    ctx.db.from("cancellation_policies").select("free_cancellation_hours").eq("tenant_id", ctx.tenantId).lte("valid_from", new Date().toISOString().slice(0, 10)).order("valid_from", { ascending: false }).limit(1).maybeSingle(),
    ctx.db.from("waitlist_offers").select("id, expires_at, lessons(period, instructors(display_name)), waitlist_entries!inner(student_id)").eq("waitlist_entries.student_id", ctx.student.id).is("response", null).gte("expires_at", new Date().toISOString()),
    ctx.db.from("skills").select("code, name_i18n"),
  ]);
  const skillName = (code: string) => ((skills ?? []).find((s) => s.code === code)?.name_i18n as Record<string, string> | undefined)?.["de"] ?? code;
  const t = status.training;
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Fahren</h1><p className="text-sm text-ink-700">Praxis {status.practicalPercent ?? 0} % · {status.completedPracticeUnits} Einheiten gefahren</p></div>
        <Link href="/fahren/buchen" className={btn.primary}>Fahrstunde buchen</Link>
      </header>

      {(offers ?? []).map((o) => { const l = o.lessons as unknown as { period: string; instructors: { display_name: string } | null } | null; const p = l ? parseRange(l.period) : null; return (
        <Alert key={o.id} tone="info" title="Fahrstunde frei geworden">
          <p>{p ? `${fmt.weekday(p.start)}, ${fmt.date(p.start)} um ${fmt.time(p.start)} Uhr` : ""}{l?.instructors ? ` bei ${l.instructors.display_name}` : ""}. Angebot gilt bis {fmt.time(o.expires_at)} Uhr.</p>
          <div className="mt-2"><OfferButtons offerId={o.id} /></div>
        </Alert>
      ); })}

      <Card title="Nächste Fahrstunden">
        {upcoming.length === 0 ? <p className="text-sm text-ink-700">Keine Fahrstunde geplant. <Link href="/fahren/buchen" className="text-brand-700 underline">Jetzt buchen</Link></p> : (
          <ul className="divide-y divide-ink-100">{upcoming.map((l) => (
            <li key={l.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><p className="font-semibold">{fmt.weekday(l.start)}, {fmt.date(l.start)} · {fmt.time(l.start)} bis {fmt.time(l.end)}</p><p className="text-sm text-ink-700">{LESSON_KIND_LABEL[l.kind] ?? l.kind} · {l.instructor}{l.vehicle ? ` · ${l.vehicle}` : ""}{l.meetingPoint ? ` · Treffpunkt: ${l.meetingPoint}` : ""}</p></div>
                <Pill tone={l.status === "confirmed" ? "success" : "warn"}>{l.status === "confirmed" ? "bestätigt" : "angefragt"}</Pill>
              </div>
              <div className="mt-2"><CancelButton lessonId={l.id} freeUntilHours={policy?.free_cancellation_hours ?? null} startIso={l.start} /></div>
            </li>
          ))}</ul>
        )}
      </Card>

      {t && (
        <Card title="Sonderfahrten" action={<span className="text-sm text-ink-700">{t.special_drives_percent} %</span>}>
          <ul className="space-y-3">{t.special_drives.map((d) => <li key={d.kind}><ProgressBar value={d.percent} label={`${{ overland: "Überlandfahrten", motorway: "Autobahnfahrten", night: "Nachtfahrten" }[d.kind]}: ${d.completed_units} von ${d.required_units}`} tone={d.remaining_units === 0 ? "success" : "brand"} /></li>)}</ul>
          {t.manual_lessons_required !== null && <p className="mt-3 text-sm">Schaltstunden (B197): {t.manual_lessons_completed} von {t.manual_lessons_required}{t.manual_requirement_met ? " ✓" : ""}</p>}
          <p className="mt-2 text-xs text-ink-500">Gesetzliche Mindestanforderungen nach Regelversion{ctx.rules.training?.needsVerification ? " (fachlich zu verifizieren)" : ""}. Übungsstunden richten sich nach deinem Ausbildungsstand.</p>
        </Card>
      )}

      <Card title="Kompetenzprofil">
        {status.profile.overall_percent === null ? <p className="text-sm text-ink-700">Dein Fahrlehrer bewertet nach jeder Stunde deine Fahrkompetenzen. Hier siehst du dann dein Profil.</p> : (
          <>
            <ul className="space-y-2">{status.profile.skills.filter((s) => s.percent !== null).map((s) => <li key={s.skill_code}><ProgressBar value={s.percent!} label={s.name} tone={s.percent! < 60 ? "warn" : "success"} /></li>)}</ul>
            {status.profile.statement && <p className="mt-3 rounded-lg bg-brand-50 p-2 text-sm">{status.profile.statement}</p>}
            {status.forecast && <div className="mt-3 rounded-lg bg-ink-100 p-3 text-sm"><p>{status.forecast.text}</p><p className="mt-1 text-xs text-ink-500">{status.forecast.disclaimer}</p></div>}
          </>
        )}
      </Card>

      <Card title="Vergangene Fahrstunden">
        {past.length === 0 ? <p className="text-sm text-ink-700">Noch keine Fahrstunde absolviert.</p> : (
          <ul className="divide-y divide-ink-100">{past.slice(0, 30).map((l) => (
            <li key={l.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{fmt.date(l.start)} · {fmt.time(l.start)} · {LESSON_KIND_LABEL[l.kind] ?? l.kind} · {l.units} × 45 Min</p><Pill tone={l.status === "completed" ? "success" : l.status === "no_show" ? "danger" : "neutral"}>{l.status === "completed" ? "absolviert" : l.status === "no_show" ? "nicht erschienen" : l.status}</Pill></div>
              <p className="text-sm text-ink-700">{l.instructor}{l.vehicle ? ` · ${l.vehicle}` : ""}</p>
              {l.evaluation && (
                <div className="mt-2 rounded-lg bg-ink-100 p-3 text-sm">
                  {l.evaluation.contents.length > 0 && <p>Inhalte: {l.evaluation.contents.map(skillName).join(", ")}</p>}
                  {l.evaluation.ratings.length > 0 && <ul className="mt-1 flex flex-wrap gap-2">{l.evaluation.ratings.map((r) => <li key={r.skill_code} className="rounded-full bg-white px-2 py-0.5">{skillName(r.skill_code)} {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</li>)}</ul>}
                  {l.evaluation.comment && <p className="mt-1">Feedback: {l.evaluation.comment}</p>}
                  {l.evaluation.next_goals.length > 0 && <p className="mt-1">Nächste Ziele: {l.evaluation.next_goals.join(", ")}</p>}
                </div>
              )}
            </li>
          ))}</ul>
        )}
      </Card>
    </div>
  );
}
