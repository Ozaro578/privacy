"use client";
import { useState, useTransition } from "react";
import { checkinTheoryClassAction, registerForTheoryClass } from "@/lib/actions/theory-class";
import { btn } from "@/components/ui";

function fingerprint(): string {
  try {
    const key = "fp-device";
    let v = localStorage.getItem(key);
    if (!v) { v = crypto.randomUUID(); localStorage.setItem(key, v); }
    return v;
  } catch { return "unknown"; }
}

export function CheckinForm() {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await checkinTheoryClassAction(code, fingerprint()); setMsg(r.message); if (r.ok) setCode(""); }); }}>
      <div className="flex-1"><label htmlFor="code" className="mb-1 block text-sm font-medium">Check-in-Code (vom QR-Code)</label><input id="code" value={code} onChange={(e) => setCode(e.target.value)} className="w-full rounded-xl border border-ink-300 px-3 py-3 font-mono" placeholder="Code scannen oder eingeben" /></div>
      <button type="submit" className={btn.primary} disabled={pending || code.length < 8}>{pending ? "Prüfe …" : "Einchecken"}</button>
      {msg && <p className="w-full text-sm" role="status">{msg}</p>}
    </form>
  );
}

export function RegisterButton({ classId }: { classId: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  if (msg) return <span className="text-sm">{msg}</span>;
  return <button type="button" className={btn.secondary} disabled={pending} onClick={() => start(async () => setMsg((await registerForTheoryClass(classId)).message))}>Anmelden</button>;
}
