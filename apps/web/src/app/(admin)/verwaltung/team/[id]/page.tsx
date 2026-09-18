import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeamMember } from "@/lib/data/admin-team";
import { addAbsence, addAvailability, changeMemberRole, deleteAbsence, deleteAvailability, setMemberStatus, updateInstructorProfile } from "@/lib/actions/admin-team";
import { MEMBERSHIP_STATUS_LABEL, ROLE_LABEL } from "@/lib/data/admin";
import { Card, Pill, fmt, parseRange } from "@/components/ui";
import { ActionForm, field, label } from "@/components/admin/action-form";
import { ActionButton } from "@/components/admin/action-button";

const WEEKDAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const ABSENCE_LABEL: Record<string, string> = { vacation: "Urlaub", sick: "Krank", training: "Fortbildung", other: "Sonstiges" };

export default async function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getTeamMember(id);
  if (!d) notFound();
  const { member: m, instructor: ins, ctx } = d;
  const name = m.users ? `${m.users.first_name} ${m.users.last_name}`.trim() || m.users.email : "Unbekannt";
  return (
    <div className="space-y-6">
      <header>
        <Link href="/verwaltung/team" className="text-sm text-brand-700 underline">Zurück zum Team</Link>
        <h1 className="text-2xl font-semibold">{name}</h1>
        <p className="flex flex-wrap items-center gap-2 text-sm text-ink-700"><span>{m.users?.email}</span>{m.users?.phone && <span>{m.users.phone}</span>}<Pill tone="brand">{ROLE_LABEL[m.role] ?? m.role}</Pill><Pill tone={m.status === "active" ? "success" : m.status === "invited" ? "warn" : "danger"}>{MEMBERSHIP_STATUS_LABEL[m.status] ?? m.status}</Pill><span>seit {fmt.date(m.created_at)}</span></p>
      </header>
      {ctx.isAdmin && (
        <Card title="Rolle und Zugang">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-wrap gap-2">
              {(["instructor", "office", "admin", "owner"] as const).filter((r) => r !== m.role && (r !== "owner" || ctx.role === "owner")).map((r) => (
                <ActionButton key={r} action={changeMemberRole.bind(null, m.id, r)} label={`Rolle: ${ROLE_LABEL[r]}`} small confirm={`Rolle auf ${ROLE_LABEL[r]} ändern?`} />
              ))}
            </div>
            {m.status === "disabled" ? <ActionButton action={setMemberStatus.bind(null, m.id, "active")} label="Zugang aktivieren" tone="primary" small /> : <ActionButton action={setMemberStatus.bind(null, m.id, "disabled")} label="Zugang deaktivieren" tone="danger" small confirm="Zugang wirklich deaktivieren? Die Person kann sich dann nicht mehr in dieser Fahrschule anmelden." />}
          </div>
        </Card>
      )}
      {ins && (
        <>
          <Card title="Fahrlehrerprofil">
            {ctx.isAdmin ? (
              <ActionForm action={updateInstructorProfile} submitLabel="Profil speichern" className="grid gap-3 md:grid-cols-3">
                <input type="hidden" name="id" value={ins.id} />
                <input type="hidden" name="membership_id" value={m.id} />
                <div><label htmlFor="display_name" className={label}>Anzeigename</label><input id="display_name" name="display_name" required defaultValue={ins.display_name} className={field} /></div>
                <div><label htmlFor="location_id" className={label}>Standort</label><select id="location_id" name="location_id" defaultValue={ins.location_id ?? ""} className={field}><option value="">Kein Standort</option>{d.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
                <div><label htmlFor="color" className={label}>Kalenderfarbe</label><input id="color" name="color" type="color" defaultValue={ins.color ?? "#1d4ed8"} className="h-11 w-full rounded-xl border border-ink-300" /></div>
                <fieldset className="md:col-span-3"><legend className="mb-1 text-sm font-medium">Fahrlehrerlaubnis je Klasse</legend><div className="flex flex-wrap gap-3">{d.licenses.map((l) => <label key={l.code} className="flex min-h-11 items-center gap-1 text-sm"><input type="checkbox" name="license_classes" value={l.code} defaultChecked={ins.license_classes.includes(l.code)} className="h-5 w-5" /> {l.code}</label>)}</div></fieldset>
                <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="teaches_theory" defaultChecked={ins.teaches_theory} className="h-5 w-5" /> Unterrichtet Theorie</label>
                <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="teaches_manual" defaultChecked={ins.teaches_manual} className="h-5 w-5" /> Schaltung</label>
                <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="teaches_automatic" defaultChecked={ins.teaches_automatic} className="h-5 w-5" /> Automatik</label>
                <div><label htmlFor="lesson_default_minutes" className={label}>Standarddauer einer Stunde (Minuten)</label><input id="lesson_default_minutes" name="lesson_default_minutes" type="number" min={30} max={180} defaultValue={ins.lesson_default_minutes} className={field} /></div>
              </ActionForm>
            ) : (
              <dl className="grid gap-2 text-sm md:grid-cols-2"><dt className="text-ink-500">Klassen</dt><dd>{ins.license_classes.join(", ") || "keine"}</dd><dt className="text-ink-500">Unterrichtet</dt><dd>{[ins.teaches_theory && "Theorie", ins.teaches_manual && "Schaltung", ins.teaches_automatic && "Automatik"].filter(Boolean).join(", ")}</dd><dt className="text-ink-500">Standort</dt><dd>{d.locations.find((l) => l.id === ins.location_id)?.name ?? "keiner"}</dd></dl>
            )}
          </Card>
          <Card title="Arbeitszeiten und Pausen">
            {d.availability.length === 0 ? <p className="mb-3 text-sm text-ink-700">Keine Arbeitszeiten gepflegt: Buchungen sind dann zu jeder Zeit möglich, außer bei Abwesenheit.</p> : (
              <ul className="mb-4 divide-y divide-ink-100 text-sm">
                {d.availability.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-3 py-2">
                    <span className="w-28 font-medium">{WEEKDAYS[a.weekday - 1]}</span>
                    <span className="tabular-nums">{a.start_time.slice(0, 5)} bis {a.end_time.slice(0, 5)}</span>
                    <Pill tone={a.kind === "work" ? "brand" : "neutral"}>{a.kind === "work" ? "Arbeitszeit" : "Pause"}</Pill>
                    <span className="text-ink-500">{a.valid_until ? `bis ${fmt.date(a.valid_until)}` : `ab ${fmt.date(a.valid_from)}`}</span>
                    <span className="ml-auto"><ActionButton action={deleteAvailability.bind(null, a.id, m.id)} label="Löschen" tone="ghost" small /></span>
                  </li>
                ))}
              </ul>
            )}
            <ActionForm action={addAvailability} submitLabel="Eintrag anlegen" className="grid gap-3 md:grid-cols-4">
              <input type="hidden" name="instructor_id" value={ins.id} />
              <input type="hidden" name="membership_id" value={m.id} />
              <div><label htmlFor="weekday" className={label}>Wochentag</label><select id="weekday" name="weekday" className={field}>{WEEKDAYS.map((w, i) => <option key={w} value={i + 1}>{w}</option>)}</select></div>
              <div><label htmlFor="start_time" className={label}>Von</label><input id="start_time" name="start_time" type="time" required defaultValue="08:00" className={field} /></div>
              <div><label htmlFor="end_time" className={label}>Bis</label><input id="end_time" name="end_time" type="time" required defaultValue="17:00" className={field} /></div>
              <div><label htmlFor="kind" className={label}>Art</label><select id="kind" name="kind" className={field}><option value="work">Arbeitszeit</option><option value="break">Pause</option></select></div>
              <div><label htmlFor="av-location" className={label}>Standort</label><select id="av-location" name="location_id" className={field}><option value="">Alle</option>{d.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
              <div><label htmlFor="valid_from" className={label}>Gültig ab</label><input id="valid_from" name="valid_from" type="date" className={field} /></div>
              <div><label htmlFor="valid_until" className={label}>Gültig bis</label><input id="valid_until" name="valid_until" type="date" className={field} /></div>
            </ActionForm>
          </Card>
          <Card title="Abwesenheiten">
            {d.absences.length === 0 ? <p className="mb-3 text-sm text-ink-700">Keine Abwesenheiten eingetragen.</p> : (
              <ul className="mb-4 divide-y divide-ink-100 text-sm">
                {d.absences.map((a) => { const r = parseRange(a.period); const end = new Date(new Date(r.end).getTime() - 1); return (
                  <li key={a.id} className="flex flex-wrap items-center gap-3 py-2">
                    <span className="font-medium">{fmt.date(r.start)} bis {fmt.date(end.toISOString())}</span>
                    <Pill tone={a.reason === "sick" ? "danger" : "neutral"}>{ABSENCE_LABEL[a.reason] ?? a.reason}</Pill>
                    {a.note && <span className="text-ink-700">{a.note}</span>}
                    <span className="ml-auto"><ActionButton action={deleteAbsence.bind(null, a.id, m.id)} label="Löschen" tone="ghost" small /></span>
                  </li>
                ); })}
              </ul>
            )}
            <ActionForm action={addAbsence} submitLabel="Abwesenheit eintragen" className="grid gap-3 md:grid-cols-4">
              <input type="hidden" name="instructor_id" value={ins.id} />
              <input type="hidden" name="membership_id" value={m.id} />
              <div><label htmlFor="from" className={label}>Von</label><input id="from" name="from" type="date" required className={field} /></div>
              <div><label htmlFor="to" className={label}>Bis (einschließlich)</label><input id="to" name="to" type="date" required className={field} /></div>
              <div><label htmlFor="reason" className={label}>Grund</label><select id="reason" name="reason" className={field}>{Object.entries(ABSENCE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div><label htmlFor="note" className={label}>Notiz</label><input id="note" name="note" className={field} /></div>
            </ActionForm>
          </Card>
        </>
      )}
      {!ins && m.role === "instructor" && <Card title="Fahrlehrerprofil"><p className="text-sm text-ink-700">Für diese Person existiert noch kein Fahrlehrerprofil. Es wird beim Setzen der Rolle Fahrlehrer angelegt.</p></Card>}
    </div>
  );
}
