import type { Tables } from "@fahrpilot/db";
import { cancelExam, recordExamResult, requestExam, scheduleExam } from "@/lib/actions/admin-exams";
import { EXAM_STATUS_LABEL } from "@/lib/data/admin";
import { Pill, fmt } from "@/components/ui";
import { ActionForm, field, label } from "@/components/admin/action-form";
import { ActionButton } from "@/components/admin/action-button";

type Kind = "theory" | "practical";
export type PracticalExamRow = Tables<"practical_exams"> & { instructors?: { display_name: string } | null; vehicles?: { license_plate: string } | null };
export type ExamRow = Tables<"theory_exams"> | PracticalExamRow;

export const EXAM_TONE: Record<string, "neutral" | "brand" | "success" | "warn" | "danger"> = { not_ready: "neutral", awaiting_instructor_release: "warn", ready: "brand", requested: "warn", scheduled: "brand", passed: "success", failed: "danger", cancelled: "neutral" };

export function countdown(iso: string | null): string | null {
  if (!iso) return null;
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return "Termin liegt in der Vergangenheit";
  if (days === 0) return "Heute";
  if (days === 1) return "Morgen";
  return `In ${days} Tagen`;
}

/** Prüfungsbereich einer Ausbildung: Versuche, Workflow (anfragen, terminieren, Ergebnis, absagen). */
export function ExamPanel({ kind, licenseId, licenseStatus, exams, instructors, vehicles, languages, retryWaitDays }: { kind: Kind; licenseId: string; licenseStatus: string; exams: ExamRow[]; instructors: Array<{ id: string; display_name: string }>; vehicles: Array<{ id: string; license_plate: string }>; languages: string[] | undefined; retryWaitDays: number | undefined }) {
  const title = kind === "theory" ? "Theorieprüfung" : "Praktische Prüfung";
  const open = exams.find((e) => e.result === null);
  const canRequest = !["passed", "requested", "scheduled"].includes(licenseStatus);
  const lastFailed = [...exams].reverse().find((e) => e.result === "failed");
  const earliestRetry = lastFailed?.result_at && retryWaitDays !== undefined ? new Date(new Date(lastFailed.result_at).getTime() + retryWaitDays * 86_400_000) : null;
  return (
    <div className="rounded-xl border border-ink-100 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-semibold">{title}</h4>
        <Pill tone={EXAM_TONE[licenseStatus] ?? "neutral"}>{EXAM_STATUS_LABEL[licenseStatus] ?? licenseStatus}</Pill>
      </div>
      {open?.scheduled_at && open.status === "scheduled" && <p className="mt-1 text-sm text-ink-700">Termin: {fmt.date(open.scheduled_at)} um {fmt.time(open.scheduled_at)} Uhr ({countdown(open.scheduled_at)}){open.examining_body ? `, ${open.examining_body}` : ""}</p>}
      {earliestRetry && licenseStatus === "failed" && <p className="mt-1 text-sm text-warn-500">Sperrfrist: Wiederholung frühestens am {earliestRetry.toLocaleDateString("de-DE")} ({retryWaitDays} Tage laut Regel exam_practical).</p>}
      {exams.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm">
          {exams.map((e) => (
            <li key={e.id} className="flex flex-wrap gap-2">
              <span className="text-ink-500">Versuch {e.attempt_no}</span>
              <span>{EXAM_STATUS_LABEL[e.status] ?? e.status}</span>
              {e.scheduled_at && <span>{fmt.date(e.scheduled_at)} {fmt.time(e.scheduled_at)}</span>}
              {e.result && <span className={e.result === "passed" ? "text-success-500" : "text-danger-500"}>{e.result === "passed" ? "bestanden" : "nicht bestanden"}{"error_points" in e && e.error_points !== null ? ` (${e.error_points} Fehlerpunkte)` : ""}</span>}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {canRequest && <ActionButton action={requestExam.bind(null, licenseId, kind)} label="Prüfung anfragen" small />}
        {open && open.status === "scheduled" && <ActionButton action={cancelExam.bind(null, open.id, kind)} label="Termin absagen" tone="ghost" small confirm="Termin wirklich absagen?" />}
      </div>
      {open && (open.status === "requested" || open.status === "ready" || open.status === "scheduled") && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-brand-700">{open.status === "scheduled" ? "Termin ändern" : "Terminieren"}</summary>
          <ActionForm action={scheduleExam} submitLabel="Termin speichern" className="mt-2 grid gap-3 md:grid-cols-2">
            <input type="hidden" name="exam_id" value={open.id} />
            <input type="hidden" name="kind" value={kind} />
            <div><label htmlFor={`d-${open.id}`} className={label}>Datum</label><input id={`d-${open.id}`} name="date" type="date" required defaultValue={open.scheduled_at ? new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date(open.scheduled_at)) : ""} className={field} /></div>
            <div><label htmlFor={`t-${open.id}`} className={label}>Uhrzeit</label><input id={`t-${open.id}`} name="time" type="time" required defaultValue={open.scheduled_at ? fmt.time(open.scheduled_at) : ""} className={field} /></div>
            <div><label htmlFor={`b-${open.id}`} className={label}>Prüforganisation</label><input id={`b-${open.id}`} name="examining_body" required list="examining-bodies" defaultValue={open.examining_body ?? ""} className={field} /><datalist id="examining-bodies"><option value="TÜV" /><option value="DEKRA" /></datalist></div>
            {kind === "theory" ? (
              <div><label htmlFor={`l-${open.id}`} className={label}>Prüfungssprache</label><select id={`l-${open.id}`} name="language_code" defaultValue={("language_code" in open && open.language_code) || "de"} className={field}>{(languages ?? ["de"]).map((l) => <option key={l} value={l}>{l}</option>)}</select></div>
            ) : (
              <>
                <div><label htmlFor={`i-${open.id}`} className={label}>Fahrlehrer</label><select id={`i-${open.id}`} name="instructor_id" defaultValue={("instructor_id" in open && open.instructor_id) || ""} className={field}><option value="">Nicht festgelegt</option>{instructors.map((i) => <option key={i.id} value={i.id}>{i.display_name}</option>)}</select></div>
                <div><label htmlFor={`v-${open.id}`} className={label}>Fahrzeug</label><select id={`v-${open.id}`} name="vehicle_id" defaultValue={("vehicle_id" in open && open.vehicle_id) || ""} className={field}><option value="">Nicht festgelegt</option>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.license_plate}</option>)}</select></div>
              </>
            )}
            <div className="md:col-span-2"><label htmlFor={`o-${open.id}`} className={label}>{kind === "theory" ? "Prüfort" : "Treffpunkt"}</label><input id={`o-${open.id}`} name="location_text" defaultValue={kind === "theory" ? (("location_text" in open && open.location_text) || "") : (("meeting_point" in open && open.meeting_point) || "")} className={field} /></div>
            <div className="md:col-span-2"><label htmlFor={`n-${open.id}`} className={label}>Notiz</label><input id={`n-${open.id}`} name="notes" defaultValue={open.notes ?? ""} className={field} /></div>
          </ActionForm>
        </details>
      )}
      {open && open.status === "scheduled" && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-brand-700">Ergebnis eintragen</summary>
          <ActionForm action={recordExamResult} submitLabel="Ergebnis speichern" className="mt-2 grid gap-3 md:grid-cols-2">
            <input type="hidden" name="exam_id" value={open.id} />
            <input type="hidden" name="kind" value={kind} />
            <div><label htmlFor={`r-${open.id}`} className={label}>Ergebnis</label><select id={`r-${open.id}`} name="result" className={field}><option value="passed">Bestanden</option><option value="failed">Nicht bestanden</option></select></div>
            <div><label htmlFor={`rd-${open.id}`} className={label}>Datum</label><input id={`rd-${open.id}`} name="result_date" type="date" defaultValue={open.scheduled_at ? new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date(open.scheduled_at)) : ""} className={field} /></div>
            {kind === "theory" && <div><label htmlFor={`ep-${open.id}`} className={label}>Fehlerpunkte</label><input id={`ep-${open.id}`} name="error_points" type="number" min={0} className={field} /></div>}
            <div className="md:col-span-2"><label htmlFor={`ef-${open.id}`} className={label}>{kind === "theory" ? "Anmerkung" : "Rückmeldung des Prüfers"}</label><textarea id={`ef-${open.id}`} name="examiner_feedback" rows={2} className={field} /></div>
          </ActionForm>
        </details>
      )}
    </div>
  );
}
