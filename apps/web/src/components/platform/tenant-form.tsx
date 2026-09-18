"use client";
import { useActionState } from "react";
import { createTenant } from "@/lib/actions/platform";
import type { ActionResult } from "@/lib/actions/lessons";
import { btn, Alert } from "@/components/ui";

export function TenantForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(createTenant, null);
  const f = "w-full rounded-xl border border-ink-300 px-3 py-2";
  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      <div><label htmlFor="name" className="mb-1 block text-sm font-medium">Name der Fahrschule</label><input id="name" name="name" required className={f} /></div>
      <div><label htmlFor="slug" className="mb-1 block text-sm font-medium">Kennung (URL, nur a-z, 0-9, -)</label><input id="slug" name="slug" required pattern="[a-z0-9-]{3,40}" className={f} /></div>
      <div><label htmlFor="email" className="mb-1 block text-sm font-medium">Kontakt-E-Mail</label><input id="email" name="email" type="email" className={f} /></div>
      <div><label htmlFor="owner_email" className="mb-1 block text-sm font-medium">E-Mail des Inhabers (Einladung)</label><input id="owner_email" name="owner_email" type="email" required className={f} /></div>
      {state?.message && <div className="md:col-span-2"><Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert></div>}
      <div className="md:col-span-2"><button className={btn.primary} disabled={pending}>{pending ? "Lege an …" : "Fahrschule anlegen"}</button></div>
    </form>
  );
}
