"use client";
import { useCallback, useEffect, useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { refreshCheckinTokenAction, manualAttendanceAction, finishTheoryClassAction, type CheckinCode } from "@/lib/actions/instructor";
import { btn, Pill } from "@/components/ui";

interface Row { id: string; studentId: string; name: string; status: string; method: string | null; checkedInAt: string | null }
const REFRESH_MS = 45_000;

export function QrPanel({ classId, initial, active }: { classId: string; initial: CheckinCode | null; active: boolean }) {
  const [code, setCode] = useState<CheckinCode | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(initial?.validSeconds ?? 0);
  const [big, setBig] = useState(false);
  const refresh = useCallback(async () => {
    const r = await refreshCheckinTokenAction(classId);
    if ("error" in r) { setError(r.error); return; }
    setCode(r); setError(null); setLeft(r.validSeconds);
  }, [classId]);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(refresh, REFRESH_MS);
    const c = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => { clearInterval(t); clearInterval(c); };
  }, [active, refresh]);
  if (!active) return <p className="text-sm text-ink-700">Der Unterricht ist beendet. Es werden keine neuen Codes erzeugt.</p>;
  return (
    <div className={big ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-white p-6" : "flex flex-col items-center"}>
      {code ? (
        <div className={`${big ? "w-[min(80vh,90vw)]" : "w-full max-w-sm"}`} aria-label="QR-Code für den Check-in" role="img" dangerouslySetInnerHTML={{ __html: code.svg }} />
      ) : <p className="text-sm text-danger-500" role="alert">{error ?? "Code wird erzeugt …"}</p>}
      {code && <p className="mt-3 text-center font-mono text-sm break-all">{code.token}</p>}
      <p className="mt-1 text-xs text-ink-500" aria-live="polite">Code gilt noch {left} s, wird automatisch erneuert.{error ? ` Fehler beim Erneuern: ${error}` : ""}</p>
      <div className="mt-3 flex gap-2">
        <button type="button" className={btn.secondary} onClick={refresh}>Neuen Code</button>
        <button type="button" className={btn.ghost} onClick={() => setBig((b) => !b)}>{big ? "Verkleinern" : "Vollbild"}</button>
      </div>
    </div>
  );
}

export function AttendanceList({ classId, initial, students, active }: { classId: string; initial: Row[]; students: Array<{ id: string; name: string }>; active: boolean }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [studentId, setStudentId] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const nameOf = useCallback((id: string) => students.find((s) => s.id === id)?.name ?? "Unbekannt", [students]);
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const load = async () => {
      const { data } = await supabase.from("attendance").select("id, student_id, status, check_in_method, checked_in_at").eq("theory_class_id", classId).order("checked_in_at", { ascending: false });
      if (data) setRows(data.map((a) => ({ id: a.id, studentId: a.student_id, name: nameOf(a.student_id), status: a.status, method: a.check_in_method, checkedInAt: a.checked_in_at })));
    };
    const channel = supabase.channel(`attendance-${classId}`).on("postgres_changes", { event: "*", schema: "public", table: "attendance", filter: `theory_class_id=eq.${classId}` }, () => { void load(); }).subscribe();
    const poll = setInterval(load, 20_000);
    return () => { supabase.removeChannel(channel); clearInterval(poll); };
  }, [classId, nameOf]);
  const present = rows.filter((r) => r.status === "present");
  const others = rows.filter((r) => r.status !== "present");
  const mark = (sid: string, status: "present" | "absent" | "excused") => start(async () => { const r = await manualAttendanceAction(classId, sid, status); setMsg(r.message); if (r.ok) setStudentId(""); });
  return (
    <div>
      <p className="mb-2 text-sm"><strong>{present.length}</strong> anwesend{others.length ? `, ${others.length} angemeldet oder abwesend` : ""}</p>
      <ul className="divide-y divide-ink-100 text-sm">
        {present.map((r) => <li key={r.id} className="flex items-center justify-between py-2"><span>{r.name}</span><span className="flex items-center gap-2 text-xs text-ink-500">{r.checkedInAt ? new Date(r.checkedInAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : ""} <Pill tone="success">{r.method === "qr" ? "QR" : r.method === "manual" ? "manuell" : "online"}</Pill></span></li>)}
        {others.map((r) => <li key={r.id} className="flex items-center justify-between py-2"><span>{r.name}</span><span className="flex items-center gap-2"><Pill tone={r.status === "excused" ? "neutral" : r.status === "absent" ? "danger" : "brand"}>{r.status === "registered" ? "angemeldet" : r.status === "absent" ? "abwesend" : "entschuldigt"}</Pill>{active && <button type="button" className="text-xs text-brand-700 underline" disabled={pending} onClick={() => mark(r.studentId, "present")}>Anwesend</button>}</span></li>)}
        {rows.length === 0 && <li className="py-2 text-ink-500">Noch niemand eingecheckt.</li>}
      </ul>
      <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (studentId) mark(studentId, "present"); }}>
        <div className="min-w-0 flex-1"><label htmlFor="manual-student" className="mb-1 block text-sm font-medium">Manuell nacherfassen</label><select id="manual-student" value={studentId} onChange={(e) => setStudentId(e.target.value)} className="min-h-11 w-full rounded-xl border border-ink-300 px-3"><option value="">Schüler wählen</option>{students.filter((s) => !present.some((p) => p.studentId === s.id)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <button type="submit" className={btn.secondary} disabled={pending || !studentId}>Anwesend</button>
        <button type="button" className={btn.ghost} disabled={pending || !studentId} onClick={() => studentId && mark(studentId, "excused")}>Entschuldigt</button>
      </form>
      {msg && <p className="mt-2 text-sm" role="status" aria-live="polite">{msg}</p>}
    </div>
  );
}

export function FinishClassButton({ classId }: { classId: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return <div className="flex items-center gap-2"><button type="button" className={btn.secondary} disabled={pending} onClick={() => { if (confirm("Unterricht beenden? Danach ist kein Check-in mehr möglich.")) start(async () => setMsg((await finishTheoryClassAction(classId)).message)); }}>Unterricht beenden</button>{msg && <span className="text-sm" role="status">{msg}</span>}</div>;
}
