import Link from "next/link";
import type { CalendarClass, CalendarLesson } from "@/lib/data/admin-calendar";
import { cancelLessonForm, confirmBooking, deleteOpenSlot, setLessonOutcome } from "@/lib/actions/admin-calendar";
import { LESSON_KIND_LABEL, LESSON_STATUS_LABEL } from "@/lib/data/admin";
import { Pill, fmt } from "@/components/ui";
import { ActionForm, field, label } from "@/components/admin/action-form";
import { ActionButton } from "@/components/admin/action-button";

const TONE: Record<string, "neutral" | "brand" | "success" | "warn" | "danger"> = { open: "neutral", booked: "warn", confirmed: "brand", completed: "success", no_show: "danger" };

/** Ein Kalendereintrag (Fahrstunde oder Theorieunterricht) mit passenden Aktionen. */
export function CalendarItem({ item, compact = false, backHref }: { item: CalendarLesson | CalendarClass; compact?: boolean; backHref: string }) {
  if (item.kind === "class") {
    return (
      <Link href={`/verwaltung/theorie/${item.id}`} className="block rounded-lg border-l-4 border-accent-500 bg-ink-50 px-2 py-1 text-xs hover:bg-ink-100">
        <span className="font-medium tabular-nums">{fmt.time(item.start)}</span> Theorie {item.unit_code}{!compact && <span className="block truncate">{item.title} ({item.attendees}{item.capacity ? `/${item.capacity}` : ""})</span>}
      </Link>
    );
  }
  const past = new Date(item.end).getTime() < Date.now();
  return (
    <div className="rounded-lg border-l-4 bg-white px-2 py-1 text-xs shadow-sm" style={{ borderLeftColor: item.color ?? "#94a3b8" }}>
      <div className="flex flex-wrap items-center gap-1">
        <span className="font-medium tabular-nums">{fmt.time(item.start)}{!compact && ` bis ${fmt.time(item.end)}`}</span>
        <Pill tone={TONE[item.status] ?? "neutral"}>{LESSON_STATUS_LABEL[item.status] ?? item.status}</Pill>
      </div>
      <p className="truncate">{item.student ? <Link href={`/verwaltung/schueler/${item.student_id}`} className="hover:underline">{item.student}</Link> : "Freier Slot"}{!compact && <span className="text-ink-500"> · {item.instructor}{item.vehicle ? ` · ${item.vehicle}` : ""}</span>}</p>
      {!compact && <p className="text-ink-500">{LESSON_KIND_LABEL[item.lesson_kind] ?? item.lesson_kind}, {item.units} E{item.transmission ? `, ${item.transmission === "automatic" ? "Automatik" : "Schaltung"}` : ""}{item.license_codes.length ? `, ${item.license_codes.join("/")}` : ""}{item.meeting_point ? `, ${item.meeting_point}` : ""}</p>}
      {!compact && (
        <div className="mt-1 flex flex-wrap gap-1">
          {item.status === "open" && !past && <Link href={`${backHref}${backHref.includes("?") ? "&" : "?"}slot=${item.id}#buchen`} className="inline-flex min-h-9 items-center rounded-full border border-ink-300 px-3 text-xs hover:border-brand-500">Buchen</Link>}
          {item.status === "open" && <ActionButton action={deleteOpenSlot.bind(null, item.id)} label="Slot löschen" tone="ghost" small confirm="Freien Slot löschen?" />}
          {item.status === "booked" && <ActionButton action={confirmBooking.bind(null, item.id)} label="Bestätigen" tone="primary" small />}
          {(item.status === "booked" || item.status === "confirmed") && past && <ActionButton action={setLessonOutcome.bind(null, item.id, "completed")} label="Abgeschlossen" tone="secondary" small />}
          {(item.status === "booked" || item.status === "confirmed") && past && <ActionButton action={setLessonOutcome.bind(null, item.id, "no_show")} label="Nicht erschienen" tone="ghost" small />}
          {(item.status === "booked" || item.status === "confirmed") && (
            <details className="w-full">
              <summary className="cursor-pointer text-brand-700">{item.status === "booked" ? "Ablehnen" : "Absagen"}</summary>
              <ActionForm action={cancelLessonForm} submitLabel={item.status === "booked" ? "Anfrage ablehnen" : "Stunde absagen"} tone="danger" className="mt-1 grid gap-2">
                <input type="hidden" name="lesson_id" value={item.id} />
                <div><label htmlFor={`reason-${item.id}`} className={label}>Grund (wird dem Schüler mitgeteilt)</label><input id={`reason-${item.id}`} name="reason" required className={field} /></div>
              </ActionForm>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
