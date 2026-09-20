"use client";
import { useActionState } from "react";
import { registerSelfStudyAction, joinSchoolAction } from "@/lib/actions/registration";
import type { ActionState } from "@/lib/actions/auth";
import { btn, Alert } from "@/components/ui";

const field = "w-full rounded-xl border border-ink-300 bg-surface px-3 py-3";

export function SelfStudyForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(registerSelfStudyAction, {});
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label htmlFor="first_name" className="mb-1 block text-sm font-medium">Vorname</label><input id="first_name" name="first_name" required className={field} autoComplete="given-name" /></div>
        <div><label htmlFor="last_name" className="mb-1 block text-sm font-medium">Nachname</label><input id="last_name" name="last_name" required className={field} autoComplete="family-name" /></div>
      </div>
      <div><label htmlFor="date_of_birth" className="mb-1 block text-sm font-medium">Geburtsdatum</label><input id="date_of_birth" name="date_of_birth" type="date" required className={field} /></div>
      <div><label htmlFor="email" className="mb-1 block text-sm font-medium">E-Mail-Adresse</label><input id="email" name="email" type="email" required className={field} autoComplete="email" /></div>
      <div><label htmlFor="password" className="mb-1 block text-sm font-medium">Passwort (mindestens 8 Zeichen)</label><input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" className={field} /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label htmlFor="license_code" className="mb-1 block text-sm font-medium">Klasse</label><select id="license_code" name="license_code" className={field} defaultValue="B"><option value="B">B (Pkw)</option><option value="B197">B197 (Automatik mit Schaltnachweis)</option><option value="B78">B78 (nur Automatik)</option></select></div>
        <div><label htmlFor="transmission" className="mb-1 block text-sm font-medium">Getriebe</label><select id="transmission" name="transmission" className={field} defaultValue="manual"><option value="manual">Schaltung</option><option value="automatic">Automatik</option></select></div>
      </div>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="consent_privacy" required className="mt-1 h-5 w-5" />Ich habe die <a href="/datenschutz" className="underline">Datenschutzerklärung</a> gelesen.</label>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="consent_terms" required className="mt-1 h-5 w-5" />Ich akzeptiere die <a href="/nutzungsbedingungen" className="underline">Nutzungsbedingungen</a>.</label>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <button type="submit" disabled={pending} className={`${btn.primary} w-full`}>{pending ? "Konto wird angelegt …" : "Konto erstellen und loslegen"}</button>
    </form>
  );
}

export function JoinSchoolForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(joinSchoolAction, {});
  return (
    <form action={action} className="space-y-3 text-sm">
      <p className="text-ink-700">Du hast eine Fahrschule gefunden? Gib den Anmelde-Code deiner Fahrschule ein (das Kürzel aus ihrem Anmeldelink). Dein Lernstand wird übernommen.</p>
      <div className="flex flex-wrap gap-2">
        <label htmlFor="slug" className="sr-only">Fahrschul-Code</label>
        <input id="slug" name="slug" required pattern="[a-z0-9-]{3,40}" placeholder="z. B. fahrschule-mueller" className={`${field} sm:max-w-xs`} />
        <button type="submit" disabled={pending} className={btn.secondary}>{pending ? "Verbinde …" : "Mit Fahrschule verbinden"}</button>
      </div>
      {state.error && <Alert tone="error">{state.error}</Alert>}
    </form>
  );
}
