"use client";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { instructorQueryAction, type InstructorQueryAnswer } from "@/lib/actions/instructor";
import type { StudentRow } from "@/lib/data/instructor";
import { btn, Card, Pill, ProgressBar, fmt } from "@/components/ui";

const EXAM_SHORT: Record<string, string> = { not_ready: "offen", awaiting_instructor_release: "Freigabe?", ready: "freigegeben", requested: "angefragt", scheduled: "terminiert", passed: "bestanden", failed: "nicht bestanden", cancelled: "abgesagt" };
const examTone = (s: string): "neutral" | "brand" | "success" | "warn" | "danger" => (s === "passed" ? "success" : s === "failed" ? "danger" : s === "awaiting_instructor_release" ? "warn" : s === "ready" || s === "scheduled" ? "brand" : "neutral");

export function StudentList({ students, showInstructor }: { students: StudentRow[]; showInstructor: boolean }) {
  const [q, setQ] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<InstructorQueryAnswer | null>(null);
  const [pending, start] = useTransition();
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const base = answer?.kind === "result" ? students.filter((s) => answer.rows.some((r) => r.licenseId === s.licenseId)) : students;
    if (!needle) return base;
    return base.filter((s) => s.name.toLowerCase().includes(needle) || s.licenseCode.toLowerCase().includes(needle) || s.weaknesses.some((w) => w.toLowerCase().includes(needle)));
  }, [q, students, answer]);
  const detailFor = (id: string) => (answer?.kind === "result" ? answer.rows.find((r) => r.licenseId === id)?.detail : undefined);
  return (
    <div className="space-y-4">
      <Card title="Fahrlehrer-KI">
        <p className="mb-2 text-sm text-ink-700">Frage in eigenen Worten, zum Beispiel „Wer ist bald prüfungsreif?“, „Wer hat noch Sonderfahrten offen?“, „Wer hat diese Woche keine Fahrstunde?“ oder „Wer hat Probleme mit Vorfahrt?“. Es werden nur feste Auswertungen ausgeführt.</p>
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); if (question.trim().length < 2) return; start(async () => setAnswer(await instructorQueryAction(question))); }}>
          <label htmlFor="ki-frage" className="sr-only">Frage an die Fahrlehrer-KI</label>
          <input id="ki-frage" value={question} onChange={(e) => setQuestion(e.target.value)} className="min-h-11 min-w-0 flex-1 rounded-xl border border-ink-300 px-3" placeholder="Frage eingeben" />
          <button type="submit" className={btn.primary} disabled={pending || question.trim().length < 2}>{pending ? "Werte aus …" : "Auswerten"}</button>
          {answer && <button type="button" className={btn.ghost} onClick={() => { setAnswer(null); setQuestion(""); }}>Zurücksetzen</button>}
        </form>
        <div aria-live="polite" className="mt-3 text-sm">
          {answer?.kind === "clarification" && <p className="rounded-lg bg-warn-100 p-2">{answer.text}</p>}
          {answer?.kind === "result" && <p className="rounded-lg bg-brand-50 p-2"><span className="font-medium">{answer.title}</span>: {answer.rows.length} Schüler{answer.ruleBased ? " (regelbasierte Zuordnung ohne KI-Anbieter)" : ""}</p>}
        </div>
      </Card>

      <div>
        <label htmlFor="suche" className="mb-1 block text-sm font-medium">Suche</label>
        <input id="suche" value={q} onChange={(e) => setQ(e.target.value)} className="min-h-11 w-full rounded-xl border border-ink-300 px-3" placeholder="Name, Klasse oder Schwachstelle" />
      </div>

      {filtered.length === 0 ? <p className="rounded-card border border-dashed border-ink-300 p-6 text-center text-sm text-ink-700">Keine Schüler gefunden.</p> : (
        <ul className="grid gap-3 md:grid-cols-2">{filtered.map((s) => (
          <li key={s.licenseId}>
            <Link href={`/lehrer/schueler/${s.licenseId}`} className="block rounded-card bg-white p-4 shadow-card hover:-translate-y-px">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-sm text-ink-700">Klasse {s.licenseCode} · {s.transmission === "automatic" ? "Automatik" : "Schaltung"}{s.status === "paused" ? " · pausiert" : ""}{showInstructor && s.primaryInstructor ? ` · ${s.primaryInstructor}` : ""}</p>
                </div>
                {s.readiness !== null && <Pill tone={s.readiness >= 85 ? "success" : s.readiness >= 70 ? "brand" : "neutral"}>Reife {s.readiness} %</Pill>}
              </div>
              <div className="mt-3 space-y-2">
                {s.specialDrivesPercent !== null && <ProgressBar value={s.specialDrivesPercent} label={`Sonderfahrten${s.openSpecialUnits ? ` (${s.openSpecialUnits} Einheiten offen)` : ""}`} tone={s.specialDrivesPercent >= 100 ? "success" : "brand"} />}
                {s.profileOverall !== null && <ProgressBar value={s.profileOverall} label="Kompetenzprofil" tone="band" />}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-ink-700">
                <dt>Letzte Stunde</dt><dd className="text-right">{s.lastLessonAt ? fmt.date(s.lastLessonAt) : "noch keine"}</dd>
                <dt>Nächste Stunde</dt><dd className="text-right">{s.nextLessonAt ? `${fmt.date(s.nextLessonAt)} ${fmt.time(s.nextLessonAt)}` : "keine geplant"}</dd>
                <dt>Theorieprüfung</dt><dd className="text-right"><Pill tone={examTone(s.theoryExamStatus)}>{EXAM_SHORT[s.theoryExamStatus] ?? s.theoryExamStatus}</Pill></dd>
                <dt>Praktische Prüfung</dt><dd className="text-right"><Pill tone={examTone(s.practicalExamStatus)}>{EXAM_SHORT[s.practicalExamStatus] ?? s.practicalExamStatus}</Pill></dd>
              </dl>
              {s.weaknesses.length > 0 && <p className="mt-2 text-xs"><span className="text-ink-500">Schwachstellen:</span> {s.weaknesses.join(", ")}</p>}
              {detailFor(s.licenseId) && <p className="mt-2 rounded-lg bg-brand-50 p-2 text-xs">{detailFor(s.licenseId)}</p>}
            </Link>
          </li>
        ))}</ul>
      )}
    </div>
  );
}
