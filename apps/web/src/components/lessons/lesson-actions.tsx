"use client";
import { useState, useTransition } from "react";
import { bookLessonAction, cancelLessonAction, respondWaitlistOffer } from "@/lib/actions/lessons";
import { btn } from "@/components/ui";

export function BookButton({ lessonId, label = "Buchen" }: { lessonId: string; label?: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={btn.primary} disabled={pending} onClick={() => start(async () => { const r = await bookLessonAction(lessonId); setMsg(r.message); })}>{pending ? "Buche …" : label}</button>
      {msg && <span className="text-sm" role="status">{msg}</span>}
    </div>
  );
}

export function CancelButton({ lessonId, freeUntilHours, startIso, nowIso }: { lessonId: string; freeUntilHours: number | null; startIso: string; nowIso: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const hoursLeft = (new Date(startIso).getTime() - new Date(nowIso).getTime()) / 3_600_000;
  const late = freeUntilHours !== null && hoursLeft < freeUntilHours;
  if (msg) return <p className="text-sm" role="status">{msg}</p>;
  return (
    <div>
      {!open ? <button type="button" className={btn.ghost} onClick={() => setOpen(true)}>Stornieren</button> : (
        <div className="mt-2 rounded-xl border border-ink-100 p-3 text-sm">
          {late ? <p className="mb-2 rounded-lg bg-warn-100 p-2">Weniger als {freeUntilHours} Stunden vor Beginn. Laut deinem Ausbildungsvertrag kann eine Ausfallgebühr anfallen. Zeitpunkt und Regelgrundlage werden dokumentiert.</p> : <p className="mb-2 text-ink-700">Kostenfreie Stornierung möglich{freeUntilHours !== null ? ` (bis ${freeUntilHours} Stunden vor Beginn)` : ""}.</p>}
          <label htmlFor={`reason-${lessonId}`} className="mb-1 block">Grund (optional)</label>
          <input id={`reason-${lessonId}`} value={reason} onChange={(e) => setReason(e.target.value)} className="mb-2 w-full rounded-lg border border-ink-300 px-2 py-2" />
          <div className="flex gap-2">
            <button type="button" className={btn.danger} disabled={pending} onClick={() => start(async () => { const r = await cancelLessonAction(lessonId, reason); setMsg(r.feeReason ? `${r.message} ${r.feeReason}` : r.message); })}>{pending ? "Storniere …" : "Jetzt stornieren"}</button>
            <button type="button" className={btn.ghost} onClick={() => setOpen(false)}>Abbrechen</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function OfferButtons({ offerId }: { offerId: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  if (msg) return <p className="text-sm">{msg}</p>;
  return <div className="flex gap-2"><button type="button" className={btn.primary} disabled={pending} onClick={() => start(async () => setMsg((await respondWaitlistOffer(offerId, true)).message))}>Annehmen</button><button type="button" className={btn.ghost} disabled={pending} onClick={() => start(async () => setMsg((await respondWaitlistOffer(offerId, false)).message))}>Ablehnen</button></div>;
}
