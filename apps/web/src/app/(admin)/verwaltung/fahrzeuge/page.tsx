import Link from "next/link";
import { listVehicles } from "@/lib/data/admin-vehicles";
import { createVehicle } from "@/lib/actions/admin-vehicles";
import { Card, EmptyState, Pill, fmt } from "@/components/ui";
import { ActionForm } from "@/components/admin/action-form";
import { VehicleFields } from "@/components/admin/vehicle-fields";

export const metadata = { title: "Fahrzeuge" };
const STATUS_LABEL: Record<string, string> = { active: "Aktiv", maintenance: "Werkstatt", inactive: "Inaktiv" };

export default async function VehiclesPage() {
  const d = await listVehicles();
  return (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-semibold">Fahrzeuge</h1><p className="text-sm text-ink-700">{d.vehicles.length} Fahrzeuge, {d.reminders.length} Erinnerungen</p></header>
      {d.reminders.length > 0 && (
        <Card title="Erinnerungen">
          <ul className="divide-y divide-ink-100 text-sm">
            {d.reminders.map((r, i) => <li key={`${r.vehicleId}-${r.kind}-${i}`} className="flex flex-wrap items-center gap-3 py-2"><Pill tone={r.tone === "neutral" ? "brand" : r.tone}>{r.licensePlate}</Pill><Link href={`/verwaltung/fahrzeuge/${r.vehicleId}`} className="hover:underline">{r.label}</Link>{r.dueDate && <span className="text-ink-500">{fmt.date(r.dueDate)}</span>}</li>)}
          </ul>
        </Card>
      )}
      {d.vehicles.length === 0 ? <EmptyState title="Noch keine Fahrzeuge" text="Lege das erste Fahrzeug mit Kennzeichen, Getriebe und Fristen an." /> : (
        <div className="overflow-x-auto rounded-card bg-surface shadow-card">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink-500"><tr><th className="p-3">Kennzeichen</th><th className="p-3">Fahrzeug</th><th className="p-3">Getriebe</th><th className="p-3">Klassen</th><th className="p-3">HU</th><th className="p-3">Wartung</th><th className="p-3">Status</th></tr></thead>
            <tbody className="divide-y divide-ink-100">
              {d.vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-ink-50">
                  <td className="p-3"><Link href={`/verwaltung/fahrzeuge/${v.id}`} className="font-medium text-brand-700 hover:underline">{v.license_plate}</Link></td>
                  <td className="p-3">{[v.make, v.model].filter(Boolean).join(" ")}{v.locations?.name ? <span className="block text-xs text-ink-500">{v.locations.name}</span> : null}</td>
                  <td className="p-3">{v.transmission === "automatic" ? "Automatik" : "Schaltung"}</td>
                  <td className="p-3">{v.license_classes.join(", ")}</td>
                  <td className="p-3">{v.next_inspection_due ? fmt.date(v.next_inspection_due) : "offen"}</td>
                  <td className="p-3">{v.next_service_due ? fmt.date(v.next_service_due) : v.next_service_km ? `${v.next_service_km} km` : "offen"}</td>
                  <td className="p-3"><Pill tone={v.status === "active" ? "success" : v.status === "maintenance" ? "warn" : "neutral"}>{STATUS_LABEL[v.status] ?? v.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Card title="Fahrzeug anlegen">
        <ActionForm action={createVehicle} submitLabel="Fahrzeug anlegen" className="grid gap-3 md:grid-cols-3">
          <VehicleFields locations={d.locations} licenses={d.licenses} />
        </ActionForm>
      </Card>
    </div>
  );
}
