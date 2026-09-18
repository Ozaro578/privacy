"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { completeLessonAction, noShowLessonAction } from "@/lib/actions/instructor";
import { btn } from "@/components/ui";

export function LessonQuickActions({ lessonId, status, hasEvaluation, hasStudent }: { lessonId: string; status: string; hasEvaluation: boolean; hasStudent: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const current = done ?? status;
  const active = hasStudent && ["booked", "confirmed"].includes(current);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {active && (
        <>
          <button type="button" className={btn.primary} disabled={pending} onClick={() => start(async () => { const r = await completeLessonAction(lessonId); setMsg(r.message); if (r.ok) setDone("completed"); })}>Stunde abschließen</button>
          <button type="button" className={btn.secondary} disabled={pending} onClick={() => { if (!confirm("Schüler als nicht erschienen markieren?")) return; start(async () => { const r = await noShowLessonAction(lessonId); setMsg(r.message); if (r.ok) setDone("no_show"); }); }}>Nicht erschienen</button>
        </>
      )}
      {hasStudent && current !== "no_show" && current !== "cancelled" && <Link href={`/lehrer/dokumentation/${lessonId}`} className={hasEvaluation ? btn.ghost : current === "completed" ? btn.primary : btn.ghost}>{hasEvaluation ? "Dokumentation ansehen" : "Dokumentieren"}</Link>}
      {msg && <span className="w-full text-sm text-ink-700" role="status" aria-live="polite">{msg}</span>}
    </div>
  );
}
