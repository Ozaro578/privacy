import type { Tables } from "@fahrpilot/db";
import { field, label } from "@/components/admin/action-form";

export function VehicleFields({ v, locations, licenses }: { v?: Tables<"vehicles">; locations: Array<{ id: string; name: string }>; licenses: string[] }) {
  return (
    <>
      <div><label htmlFor="license_plate" className={label}>Kennzeichen</label><input id="license_plate" name="license_plate" required defaultValue={v?.license_plate ?? ""} className={field} /></div>
      <div><label htmlFor="make" className={label}>Hersteller</label><input id="make" name="make" defaultValue={v?.make ?? ""} className={field} /></div>
      <div><label htmlFor="model" className={label}>Modell</label><input id="model" name="model" defaultValue={v?.model ?? ""} className={field} /></div>
      <div><label htmlFor="transmission" className={label}>Getriebe</label><select id="transmission" name="transmission" defaultValue={v?.transmission ?? "manual"} className={field}><option value="manual">Schaltung</option><option value="automatic">Automatik</option></select></div>
      <div><label htmlFor="status" className={label}>Status</label><select id="status" name="status" defaultValue={v?.status ?? "active"} className={field}><option value="active">Aktiv</option><option value="maintenance">In Werkstatt</option><option value="inactive">Inaktiv</option></select></div>
      <div><label htmlFor="location_id" className={label}>Standort</label><select id="location_id" name="location_id" defaultValue={v?.location_id ?? ""} className={field}><option value="">Kein Standort</option>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
      <fieldset className="md:col-span-3"><legend className="mb-1 text-sm font-medium">Klassen</legend><div className="flex flex-wrap gap-3">{licenses.map((c) => <label key={c} className="flex min-h-11 items-center gap-1 text-sm"><input type="checkbox" name="license_classes" value={c} defaultChecked={v?.license_classes.includes(c) ?? c === "B"} className="h-5 w-5" /> {c}</label>)}</div></fieldset>
      <div><label htmlFor="mileage_km" className={label}>Kilometerstand</label><input id="mileage_km" name="mileage_km" type="number" min={0} defaultValue={v?.mileage_km ?? ""} className={field} /></div>
      <div><label htmlFor="next_inspection_due" className={label}>HU fällig am</label><input id="next_inspection_due" name="next_inspection_due" type="date" defaultValue={v?.next_inspection_due ?? ""} className={field} /></div>
      <div><label htmlFor="next_service_due" className={label}>Wartung fällig am</label><input id="next_service_due" name="next_service_due" type="date" defaultValue={v?.next_service_due ?? ""} className={field} /></div>
      <div><label htmlFor="next_service_km" className={label}>Wartung fällig bei km</label><input id="next_service_km" name="next_service_km" type="number" min={0} defaultValue={v?.next_service_km ?? ""} className={field} /></div>
      <div><label htmlFor="tire_set" className={label}>Reifensatz</label><input id="tire_set" name="tire_set" placeholder="z. B. Sommer 2026" defaultValue={v?.tire_set ?? ""} className={field} /></div>
      <div><label htmlFor="tire_change_due" className={label}>Reifenwechsel fällig am</label><input id="tire_change_due" name="tire_change_due" type="date" defaultValue={v?.tire_change_due ?? ""} className={field} /></div>
      <div><label htmlFor="insurance_provider" className={label}>Versicherer</label><input id="insurance_provider" name="insurance_provider" defaultValue={v?.insurance_provider ?? ""} className={field} /></div>
      <div><label htmlFor="insurance_policy_number" className={label}>Versicherungsnummer</label><input id="insurance_policy_number" name="insurance_policy_number" defaultValue={v?.insurance_policy_number ?? ""} className={field} /></div>
      <div><label htmlFor="insurance_renewal_due" className={label}>Versicherung fällig am</label><input id="insurance_renewal_due" name="insurance_renewal_due" type="date" defaultValue={v?.insurance_renewal_due ?? ""} className={field} /></div>
      <div className="md:col-span-3"><label htmlFor="notes" className={label}>Notizen</label><textarea id="notes" name="notes" rows={2} defaultValue={v?.notes ?? ""} className={field} /></div>
    </>
  );
}
