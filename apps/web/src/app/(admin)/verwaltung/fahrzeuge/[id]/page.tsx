import Link from "next/link";
import { notFound } from "next/navigation";
import { getVehicle } from "@/lib/data/admin-vehicles";
import { addVehicleBlock, deleteVehicle, deleteVehicleBlock, updateVehicle } from "@/lib/actions/admin-vehicles";
import { LESSON_STATUS_LABEL } from "@/lib/data/admin";
import { Card, Pill, fmt, parseRange } from "@/components/ui";
import { ActionForm, field, label } from "@/components/admin/action-form";
import { ActionButton } from "@/components/admin/action-button";
import { VehicleFields } from "@/components/admin/vehicle-fields";

export default async function VehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getVehicle(id);
  if (!d) notFound();
  const v = d.vehicle;
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div><Link href="/verwaltung/fahrzeuge" className="text-sm text-brand-700 underline">Zurück zur Liste</Link><h1 className="text-2xl font-semibold">{v.license_plate}</h1><p className="text-sm text-ink-700">{[v.make, v.model].filter(Boolean).join(" ")}</p></div>
        <ActionButton action={deleteVehicle.bind(null, v.id)} label="Fahrzeug löschen" tone="danger" confirm="Fahrzeug wirklich löschen? Mit Fahrstunden verknüpfte Fahrzeuge werden stattdessen deaktiviert." />
      </header>
      {d.reminders.length > 0 && <Card title="Erinnerungen"><ul className="space-y-1 text-sm">{d.reminders.map((r, i) => <li key={i} className="flex items-center gap-2"><Pill tone={r.tone === "neutral" ? "brand" : r.tone}>{r.kind === "inspection" ? "HU" : r.kind === "insurance" ? "Versicherung" : r.kind === "tires" ? "Reifen" : "Wartung"}</Pill>{r.label}</li>)}</ul></Card>}
      <Card title="Stammdaten und Fristen">
        <ActionForm action={updateVehicle} submitLabel="Fahrzeug speichern" className="grid gap-3 md:grid-cols-3">
          <input type="hidden" name="id" value={v.id} />
          <VehicleFields v={v} locations={d.locations} licenses={d.licenses} />
        </ActionForm>
      </Card>
      <Card title="Sperrzeiten">
        {d.blocks.length === 0 ? <p className="mb-3 text-sm text-ink-700">Keine Sperrzeiten. In Sperrzeiten kann das Fahrzeug nicht gebucht werden.</p> : (
          <ul className="mb-4 divide-y divide-ink-100 text-sm">
            {d.blocks.map((b) => { const r = parseRange(b.period); return <li key={b.id} className="flex flex-wrap items-center gap-3 py-2"><span className="font-medium">{fmt.date(r.start)} {fmt.time(r.start)} bis {fmt.date(r.end)} {fmt.time(r.end)}</span><Pill tone="neutral">{b.reason}</Pill>{b.note && <span>{b.note}</span>}<span className="ml-auto"><ActionButton action={deleteVehicleBlock.bind(null, b.id, v.id)} label="Löschen" tone="ghost" small /></span></li>; })}
          </ul>
        )}
        <ActionForm action={addVehicleBlock} submitLabel="Sperrzeit eintragen" className="grid gap-3 md:grid-cols-4">
          <input type="hidden" name="vehicle_id" value={v.id} />
          <div><label htmlFor="from_date" className={label}>Von (Datum)</label><input id="from_date" name="from_date" type="date" required className={field} /></div>
          <div><label htmlFor="from_time" className={label}>Von (Uhrzeit)</label><input id="from_time" name="from_time" type="time" defaultValue="00:00" className={field} /></div>
          <div><label htmlFor="to_date" className={label}>Bis (Datum)</label><input id="to_date" name="to_date" type="date" required className={field} /></div>
          <div><label htmlFor="to_time" className={label}>Bis (Uhrzeit)</label><input id="to_time" name="to_time" type="time" defaultValue="23:59" className={field} /></div>
          <div><label htmlFor="reason" className={label}>Grund</label><select id="reason" name="reason" className={field}><option value="maintenance">Wartung</option><option value="inspection">HU</option><option value="tires">Reifenwechsel</option><option value="repair">Reparatur</option><option value="other">Sonstiges</option></select></div>
          <div className="md:col-span-3"><label htmlFor="note" className={label}>Notiz</label><input id="note" name="note" className={field} /></div>
        </ActionForm>
      </Card>
      <Card title="Nächste Einsätze">
        {d.upcoming.length === 0 ? <p className="text-sm text-ink-700">Keine geplanten Fahrstunden mit diesem Fahrzeug.</p> : (
          <ul className="divide-y divide-ink-100 text-sm">{d.upcoming.map((l) => { const r = parseRange(l.period); return <li key={l.id} className="flex flex-wrap gap-3 py-1.5"><span>{fmt.date(r.start)} {fmt.time(r.start)}</span><span>{l.instructors?.display_name}</span><span>{l.students ? `${l.students.first_name} ${l.students.last_name}` : "freier Slot"}</span><span className="text-ink-500">{LESSON_STATUS_LABEL[l.status]}</span></li>; })}</ul>
        )}
      </Card>
    </div>
  );
}
