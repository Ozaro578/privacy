import Link from "next/link";
import { notFound } from "next/navigation";
import { getTheoryClass } from "@/lib/data/admin-theory";
import { addAttendance, createCheckinCode, deleteTheoryClass, setAttendanceStatus, updateTheoryClass } from "@/lib/actions/admin-theory";
import { Card, Pill, fmt, parseRange } from "@/components/ui";
import { ActionForm, field, label } from "@/components/admin/action-form";
import { ActionButton } from "@/components/admin/action-button";
import { TheoryClassFields } from "@/components/admin/theory-class-fields";

const ATT: Record<string, string> = { registered: "Angemeldet", present: "Anwesend", absent: "Abwesend", excused: "Entschuldigt" };

export default async function TheoryClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getTheoryClass(id);
  if (!d) notFound();
  const c = d.cls;
  const r = parseRange(c.period);
  const present = d.attendance.filter((a) => a.status === "present").length;
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div><Link href="/verwaltung/theorie" className="text-sm text-brand-700 underline">Zurück zur Übersicht</Link><h1 className="text-2xl font-semibold">{c.lesson_unit_code}: {c.title}</h1><p className="text-sm text-ink-700">{fmt.weekday(r.start)}, {fmt.date(r.start)} von {fmt.time(r.start)} bis {fmt.time(r.end)} Uhr, {c.instructors?.display_name ?? "Fahrlehrer offen"}, {c.is_online ? "online" : (c.locations?.name ?? "ohne Standort")}</p></div>
        <div className="flex flex-wrap gap-2">
          {c.status !== "cancelled" && c.status !== "completed" && <ActionButton action={createCheckinCode.bind(null, c.id)} label="Check-in-Code erzeugen" tone="primary" />}
          <ActionButton action={deleteTheoryClass.bind(null, c.id)} label="Löschen" tone="danger" confirm="Unterricht wirklich löschen?" />
        </div>
      </header>
      <Card title={`Anwesenheit (${present} anwesend, ${d.attendance.length} erfasst${c.capacity ? `, Kapazität ${c.capacity}` : ""})`}>
        {d.attendance.length === 0 ? <p className="mb-3 text-sm text-ink-700">Noch keine Anwesenheiten. Schüler checken per QR-Code ein oder werden unten nacherfasst.</p> : (
          <ul className="mb-4 divide-y divide-ink-100 text-sm">
            {d.attendance.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-2 py-2">
                <Link href={`/verwaltung/schueler/${a.student_id}`} className="font-medium text-brand-700 hover:underline">{a.students ? `${a.students.last_name}, ${a.students.first_name}` : "?"}</Link>
                <span className="text-ink-500">{a.student_licenses?.license_code}</span>
                <Pill tone={a.status === "present" ? "success" : a.status === "absent" ? "danger" : "neutral"}>{ATT[a.status] ?? a.status}</Pill>
                <span className="text-xs text-ink-500">{a.check_in_method === "qr" ? "QR-Check-in" : a.check_in_method === "manual" ? `manuell${a.users ? ` durch ${a.users.first_name} ${a.users.last_name}` : ""}` : a.check_in_method ?? ""}{a.checked_in_at ? ` um ${fmt.time(a.checked_in_at)}` : ""}</span>
                <span className="ml-auto flex gap-1">{(["present", "excused", "absent"] as const).filter((s) => s !== a.status).map((s) => <ActionButton key={s} action={setAttendanceStatus.bind(null, a.id, c.id, s)} label={ATT[s] ?? s} tone="ghost" small />)}</span>
              </li>
            ))}
          </ul>
        )}
        <ActionForm action={addAttendance} submitLabel="Nacherfassen" className="grid gap-3 md:grid-cols-3">
          <input type="hidden" name="theory_class_id" value={c.id} />
          <div className="md:col-span-2"><label htmlFor="student_license_id" className={label}>Schüler</label><select id="student_license_id" name="student_license_id" required className={field}><option value="">Bitte wählen</option>{d.candidates.map((l) => <option key={l.id} value={l.id}>{l.students ? `${l.students.last_name}, ${l.students.first_name}` : "?"} ({l.license_code})</option>)}</select></div>
          <div><label htmlFor="att-status" className={label}>Status</label><select id="att-status" name="status" className={field}>{Object.entries(ATT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <p className="text-xs text-ink-500 md:col-span-3">Nacherfassungen werden mit Bearbeiter und Zeitpunkt protokolliert (Audit-Log).</p>
        </ActionForm>
      </Card>
      <Card title="Termin bearbeiten">
        <ActionForm action={updateTheoryClass} submitLabel="Speichern" className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="id" value={c.id} />
          <TheoryClassFields c={c} units={d.units} licenses={c.license_codes.length ? c.license_codes : ["B"]} licenseCode={c.license_codes[0] ?? "B"} instructors={d.instructors} locations={d.locations} unitMinutes={90} withStatus />
        </ActionForm>
      </Card>
    </div>
  );
}
