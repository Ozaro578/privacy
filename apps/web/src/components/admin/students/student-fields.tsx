import { field, label } from "@/components/admin/action-form";

export interface StudentFieldValues { first_name?: string; last_name?: string; email?: string | null; phone?: string | null; date_of_birth?: string | null; address_line1?: string | null; postal_code?: string | null; city?: string | null; location_id?: string | null; student_number?: string | null; preferred_locale?: string; guardian_name?: string | null; guardian_email?: string | null; guardian_phone?: string | null; status?: string }

/** Stammdatenfelder (für Anlage und Bearbeitung). */
export function StudentFields({ v = {}, locations, withStatus = true }: { v?: StudentFieldValues; locations: Array<{ id: string; name: string }>; withStatus?: boolean }) {
  return (
    <>
      <div><label htmlFor="first_name" className={label}>Vorname</label><input id="first_name" name="first_name" required defaultValue={v.first_name ?? ""} className={field} /></div>
      <div><label htmlFor="last_name" className={label}>Nachname</label><input id="last_name" name="last_name" required defaultValue={v.last_name ?? ""} className={field} /></div>
      <div><label htmlFor="email" className={label}>E-Mail</label><input id="email" name="email" type="email" defaultValue={v.email ?? ""} className={field} /></div>
      <div><label htmlFor="phone" className={label}>Telefon</label><input id="phone" name="phone" defaultValue={v.phone ?? ""} className={field} /></div>
      <div><label htmlFor="date_of_birth" className={label}>Geburtsdatum</label><input id="date_of_birth" name="date_of_birth" type="date" defaultValue={v.date_of_birth ?? ""} className={field} /></div>
      <div><label htmlFor="student_number" className={label}>Schülernummer</label><input id="student_number" name="student_number" defaultValue={v.student_number ?? ""} className={field} /></div>
      <div className="md:col-span-2"><label htmlFor="address_line1" className={label}>Straße und Hausnummer</label><input id="address_line1" name="address_line1" defaultValue={v.address_line1 ?? ""} className={field} /></div>
      <div><label htmlFor="postal_code" className={label}>PLZ</label><input id="postal_code" name="postal_code" defaultValue={v.postal_code ?? ""} className={field} /></div>
      <div><label htmlFor="city" className={label}>Ort</label><input id="city" name="city" defaultValue={v.city ?? ""} className={field} /></div>
      <div><label htmlFor="location_id" className={label}>Standort</label><select id="location_id" name="location_id" defaultValue={v.location_id ?? ""} className={field}><option value="">Kein Standort</option>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
      <div><label htmlFor="preferred_locale" className={label}>Sprache</label><select id="preferred_locale" name="preferred_locale" defaultValue={v.preferred_locale ?? "de"} className={field}><option value="de">Deutsch</option><option value="en">Englisch</option><option value="tr">Türkisch</option><option value="ar">Arabisch</option></select></div>
      {withStatus && (
        <div><label htmlFor="status" className={label}>Status</label><select id="status" name="status" defaultValue={v.status ?? "registered"} className={field}><option value="lead">Interessent</option><option value="registered">Angemeldet</option><option value="active">In Ausbildung</option><option value="paused">Pausiert</option><option value="completed">Abgeschlossen</option><option value="cancelled">Abgebrochen</option></select></div>
      )}
      <fieldset className="grid gap-3 md:col-span-2 md:grid-cols-3">
        <legend className="mb-1 text-sm font-medium">Erziehungsberechtigte (bei Minderjährigen)</legend>
        <div><label htmlFor="guardian_name" className={label}>Name</label><input id="guardian_name" name="guardian_name" defaultValue={v.guardian_name ?? ""} className={field} /></div>
        <div><label htmlFor="guardian_email" className={label}>E-Mail</label><input id="guardian_email" name="guardian_email" type="email" defaultValue={v.guardian_email ?? ""} className={field} /></div>
        <div><label htmlFor="guardian_phone" className={label}>Telefon</label><input id="guardian_phone" name="guardian_phone" defaultValue={v.guardian_phone ?? ""} className={field} /></div>
      </fieldset>
    </>
  );
}

export function LicenseFields({ licenses, instructors, prefix = "" }: { licenses: Array<{ code: string; name: string }>; instructors: Array<{ id: string; display_name: string; license_classes: string[] }>; prefix?: string }) {
  const id = (n: string) => `${prefix}${n}`;
  return (
    <>
      <div><label htmlFor={id("license_code")} className={label}>Klasse</label><select id={id("license_code")} name="license_code" className={field} defaultValue="B">{licenses.map((l) => <option key={l.code} value={l.code}>{l.code}: {l.name}</option>)}</select></div>
      <div><label htmlFor={id("acquisition_kind")} className={label}>Erwerbsart</label><select id={id("acquisition_kind")} name="acquisition_kind" className={field}><option value="first">Ersterwerb</option><option value="extension">Erweiterung</option></select></div>
      <div><label htmlFor={id("transmission")} className={label}>Getriebe</label><select id={id("transmission")} name="transmission" className={field}><option value="manual">Schaltung</option><option value="automatic">Automatik</option></select></div>
      <div><label htmlFor={id("primary_instructor_id")} className={label}>Fahrlehrer</label><select id={id("primary_instructor_id")} name="primary_instructor_id" className={field}><option value="">Noch nicht zugewiesen</option>{instructors.map((i) => <option key={i.id} value={i.id}>{i.display_name}{i.license_classes.length ? ` (${i.license_classes.join(", ")})` : ""}</option>)}</select></div>
      <div><label htmlFor={id("existing_license_codes")} className={label}>Vorbesitz (Klassen, kommagetrennt)</label><input id={id("existing_license_codes")} name="existing_license_codes" placeholder="z. B. AM, A1" className={field} /></div>
      <div className="flex items-end"><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="accompanied_driving" className="h-5 w-5" /> Begleitetes Fahren ab 17 (BF17)</label></div>
    </>
  );
}
