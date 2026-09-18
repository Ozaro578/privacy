"use client";
import { useActionState } from "react";
import { loginAction, magicLinkAction, type ActionState } from "@/lib/actions/auth";
import { btn, Alert } from "@/components/ui";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(loginAction, {});
  const [magic, magicAction, magicPending] = useActionState<ActionState, FormData>(magicLinkAction, {});
  return (
    <div className="space-y-6">
      <form action={action} className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">E-Mail-Adresse</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="w-full rounded-xl border border-ink-300 px-3 py-3" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">Passwort</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} className="w-full rounded-xl border border-ink-300 px-3 py-3" />
        </div>
        {state.error && <Alert tone="error">{state.error}</Alert>}
        <button type="submit" disabled={pending} className={`${btn.primary} w-full`}>{pending ? "Anmelden …" : "Anmelden"}</button>
      </form>
      <form action={magicAction} className="rounded-xl border border-ink-100 p-4">
        <p className="mb-2 text-sm text-ink-700">Ohne Passwort: Anmeldelink per E-Mail erhalten.</p>
        <div className="flex gap-2">
          <label htmlFor="magic-email" className="sr-only">E-Mail-Adresse für Anmeldelink</label>
          <input id="magic-email" name="email" type="email" required placeholder="name@beispiel.de" className="min-w-0 flex-1 rounded-xl border border-ink-300 px-3 py-2" />
          <button type="submit" disabled={magicPending} className={btn.secondary}>Link senden</button>
        </div>
        {magic.error && <p className="mt-2 text-sm text-danger-500">{magic.error}</p>}
        {magic.message && <p className="mt-2 text-sm text-success-500">{magic.message}</p>}
      </form>
    </div>
  );
}
