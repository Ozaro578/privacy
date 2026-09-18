"use client";
import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/actions/lessons";
import { btn } from "@/components/ui";

/** Schaltfläche, die eine gebundene Server Action ausführt und die Rückmeldung anzeigt. Optional mit Bestätigungsabfrage. */
export function ActionButton({ action, label, pendingLabel, tone = "secondary", confirm, className = "", small = false }: { action: () => Promise<ActionResult>; label: string; pendingLabel?: string; tone?: "primary" | "secondary" | "ghost" | "danger"; confirm?: string; className?: string; small?: boolean }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const size = small ? " min-h-9 px-3 text-sm" : "";
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        className={`${btn[tone]}${size} ${className}`}
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          start(async () => setResult(await action()));
        }}
      >
        {pending ? (pendingLabel ?? "Bitte warten …") : label}
      </button>
      <span aria-live="polite" className={`text-xs ${result ? (result.ok ? "text-success-500" : "text-danger-500") : "sr-only"}`}>{result?.message ?? ""}</span>
    </span>
  );
}
