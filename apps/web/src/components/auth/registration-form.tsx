"use client";
import { useActionState, useState } from "react";
import { registerStudentAction } from "@/lib/actions/registration";
import type { ActionState } from "@/lib/actions/auth";
import { btn, Alert } from "@/components/ui";

interface Props { slug: string; schoolName: string; licenses: Array<{ code: string; name: string }>; locations: Array<{ id: string; name: string }>; }

const field = "w-full rounded-xl border border-ink-300 px-3 py-3";

export function RegistrationForm({ slug, schoolName, licenses, locations }: Props) {
  const bound = registerStudentAction.bind(null, slug);
  const [state, action, pending] = useActionState<ActionState, FormData>(bound, {});
  const [dob, setDob] = useState("");
  const minor = dob !== "" && new Date(dob) > new Date(new Date().setFullYear(new Date().getFullYear() - 18));
  return (
    <form action={action} className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-lg font-semibold">Persönliche Daten</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="first_name" className="mb-1 block text-sm font-medium">Vorname</label><input id="first_name" name="first_name" required className={field} /></div>
          <div><label htmlFor="last_name" className="mb-1 block text-sm font-medium">Nachname</label><input id="last_name" name="last_name" required className={field} /></div>
        </div>
        <div><label htmlFor="date_of_birth" className="mb-1 block text-sm font-medium">Geburtsdatum</label><input id="date_of_birth" name="date_of_birth" type="date" required className={field} value={dob} onChange={(e) => setDob(e.target.value)} /></div>
        <div><label htmlFor="email" className="mb-1 block text-sm font-medium">E-Mail-Adresse</label><input id="email" name="email" type="email" required className={field} /></div>
        <div><label htmlFor="phone" className="mb-1 block text-sm font-medium">Telefon (optional)</label><input id="phone" name="phone" type="tel" className={field} /></div>
        <div><label htmlFor="address_line1" className="mb-1 block text-sm font-medium">Straße und Hausnummer</label><input id="address_line1" name="address_line1" className={field} /></div>
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
          <div><label htmlFor="postal_code" className="mb-1 block text-sm font-medium">PLZ</label><input id="postal_code" name="postal_code" className={field} /></div>
          <div><label htmlFor="city" className="mb-1 block text-sm font-medium">Ort</label><input id="city" name="city" className={field} /></div>
        </div>
        <div><label htmlFor="password" className="mb-1 block text-sm font-medium">Passwort (mindestens 8 Zeichen)</label><input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" className={field} /></div>
      </fieldset>
      {minor && (
        <fieldset className="space-y-3 rounded-xl border border-warn-500/40 bg-warn-100 p-4">
          <legend className="px-1 text-base font-semibold">Erziehungsberechtigte</legend>
          <p className="text-sm">Du bist noch nicht volljährig. Wir brauchen die Angaben einer erziehungsberechtigten Person.</p>
          <div><label htmlFor="guardian_name" className="mb-1 block text-sm font-medium">Name</label><input id="guardian_name" name="guardian_name" required className={field} /></div>
          <div><label htmlFor="guardian_email" className="mb-1 block text-sm font-medium">E-Mail-Adresse</label><input id="guardian_email" name="guardian_email" type="email" className={field} /></div>
          <div><label htmlFor="guardian_phone" className="mb-1 block text-sm font-medium">Telefon</label><input id="guardian_phone" name="guardian_phone" type="tel" className={field} /></div>
        </fieldset>
      )}
      <fieldset className="space-y-3">
        <legend className="text-lg font-semibold">Ausbildung</legend>
        <div><label htmlFor="license_code" className="mb-1 block text-sm font-medium">Führerscheinklasse</label>
          <select id="license_code" name="license_code" className={field} defaultValue="B">{licenses.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}</select></div>
        <div><label htmlFor="transmission" className="mb-1 block text-sm font-medium">Getriebe</label>
          <select id="transmission" name="transmission" className={field} defaultValue="manual"><option value="manual">Schaltung</option><option value="automatic">Automatik</option></select></div>
        <div><label htmlFor="acquisition_kind" className="mb-1 block text-sm font-medium">Ersterwerb oder Erweiterung</label>
          <select id="acquisition_kind" name="acquisition_kind" className={field} defaultValue="first"><option value="first">Ersterwerb (erste Fahrerlaubnis)</option><option value="extension">Erweiterung (ich besitze bereits eine Klasse)</option></select></div>
        <div><label htmlFor="existing_license_codes" className="mb-1 block text-sm font-medium">Vorhandene Fahrerlaubnisse (optional)</label>
          <select id="existing_license_codes" name="existing_license_codes" multiple className={`${field} h-28`}>{licenses.map((l) => <option key={l.code} value={l.code}>{l.code}</option>)}</select></div>
        {locations.length > 0 && (<div><label htmlFor="location_id" className="mb-1 block text-sm font-medium">Standort</label>
          <select id="location_id" name="location_id" className={field}>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>)}
        <div><label htmlFor="locale" className="mb-1 block text-sm font-medium">Sprache der App</label>
          <select id="locale" name="locale" className={field} defaultValue="de"><option value="de">Deutsch</option><option value="en">English</option><option value="tr">Türkçe</option><option value="ar">العربية</option></select></div>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="accompanied_driving" className="mt-1 h-5 w-5" />Begleitetes Fahren ab 17 (BF17)</label>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="text-lg font-semibold">Einwilligungen</legend>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="consent_privacy" required className="mt-1 h-5 w-5" />Ich habe die <a href="/datenschutz" className="underline" target="_blank">Datenschutzerklärung</a> gelesen. Version 2026-09.</label>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="consent_terms" required className="mt-1 h-5 w-5" />Ich akzeptiere die Vertragsbedingungen der {schoolName}. Der Ausbildungsvertrag wird von der Fahrschule bereitgestellt und gesondert unterschrieben.</label>
      </fieldset>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <button type="submit" disabled={pending} className={`${btn.primary} w-full`}>{pending ? "Wird gesendet …" : "Anmeldung absenden"}</button>
    </form>
  );
}
