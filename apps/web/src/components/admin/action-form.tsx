"use client";
import { useActionState, useEffect, useRef, type ReactNode } from "react";
import type { ActionResult } from "@/lib/actions/lessons";
import { btn, Alert } from "@/components/ui";

export type FormAction = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;

/** Formular mit Server Action, Ladezustand und Rückmeldung (aria-live). Felder werden als Kinder übergeben. */
export function ActionForm({ action, children, submitLabel, pendingLabel = "Speichere …", className = "grid gap-3", tone = "primary", resetOnSuccess = false }: { action: FormAction; children: ReactNode; submitLabel: string; pendingLabel?: string; className?: string; tone?: "primary" | "secondary" | "danger"; resetOnSuccess?: boolean }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (resetOnSuccess && state?.ok) ref.current?.reset(); }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      <div aria-live="polite" className="md:col-span-2">{state?.message && <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>}</div>
      <div className="md:col-span-2"><button type="submit" className={btn[tone]} disabled={pending}>{pending ? pendingLabel : submitLabel}</button></div>
    </form>
  );
}

export const field = "w-full min-h-11 rounded-xl border border-ink-300 bg-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500";
export const label = "mb-1 block text-sm font-medium text-ink-900";
