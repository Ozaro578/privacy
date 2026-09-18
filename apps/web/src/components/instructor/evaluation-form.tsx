"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import type { LessonNotesDraft } from "@fahrpilot/ai";
import { saveEvaluationAction, draftFromTranscriptAction, draftFromAudioAction, type DraftResult } from "@/lib/actions/instructor";
import { btn, Card } from "@/components/ui";

interface Skill { code: string; name: string; category: string }
type Existing = { contents: string[]; comment: string | null; next_goals: string[]; overall_rating: number | null; shared_with_student: boolean; ai_draft: unknown; ai_transcript: string | null; ai_draft_model: string | null; ai_confirmed: boolean } | null;

const CATEGORY_LABEL: Record<string, string> = { basic_tasks: "Grundfahraufgaben", traffic: "Verkehr", special_drives: "Sonderfahrten", eco: "Umwelt", independent: "Selbstständig" };

function StarInput({ value, onChange, label, id }: { value: number | null; onChange: (v: number | null) => void; label: string; id: string }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-labelledby={id}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${label}: ${n} von 5`} onClick={() => onChange(value === n ? null : n)} className={`min-h-11 min-w-11 text-2xl leading-none ${value !== null && n <= value ? "text-accent-400" : "text-ink-300"} hover:text-accent-400`}>★</button>
      ))}
      {value !== null && <span className="ml-1 text-xs text-ink-500">{value}/5</span>}
    </div>
  );
}

export function EvaluationForm({ lessonId, skills, existing, existingRatings, previousGoals, sttAvailable, aiAvailable, readOnly }: { lessonId: string; skills: Skill[]; existing: Existing; existingRatings: Array<{ skill_code: string; rating: number }>; previousGoals: string[]; sttAvailable: boolean; aiAvailable: boolean; readOnly: boolean }) {
  const [contents, setContents] = useState<Set<string>>(new Set(existing?.contents ?? []));
  const [ratings, setRatings] = useState<Record<string, number | null>>(() => Object.fromEntries(existingRatings.map((r) => [r.skill_code, r.rating])));
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [goals, setGoals] = useState<string[]>(existing?.next_goals?.length ? existing.next_goals : [""]);
  const [overall, setOverall] = useState<number | null>(existing?.overall_rating ?? null);
  const [shared, setShared] = useState(existing?.shared_with_student ?? true);
  const [transcript, setTranscript] = useState(existing?.ai_transcript ?? "");
  const [draft, setDraft] = useState<LessonNotesDraft | null>((existing?.ai_draft as LessonNotesDraft | null) ?? null);
  const [draftModel, setDraftModel] = useState<string | null>(existing?.ai_draft_model ?? null);
  const [aiConfirmed, setAiConfirmed] = useState(existing?.ai_confirmed ?? false);
  const [draftMsg, setDraftMsg] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [drafting, startDraft] = useTransition();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const canRecord = sttAvailable && typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); recorder.current?.stream.getTracks().forEach((t) => t.stop()); }, []);

  const applyDraft = (r: DraftResult) => {
    setDraftMsg(r.message);
    if (r.transcript) setTranscript(r.transcript);
    if (r.draft) {
      setDraft(r.draft); setDraftModel(r.model); setAiConfirmed(false);
      setContents(new Set(r.draft.contents));
      setRatings((prev) => { const next = { ...prev }; for (const x of r.draft!.ratings) next[x.skill_code] = x.rating; return next; });
      if (r.draft.comment) setComment(r.draft.comment);
      if (r.draft.next_goals.length) setGoals(r.draft.next_goals);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((m) => MediaRecorder.isTypeSupported(m));
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
        if (blob.size === 0) { setDraftMsg("Keine Aufnahme erhalten."); return; }
        const fd = new FormData();
        fd.set("lessonId", lessonId);
        fd.set("audio", blob, "sprachnotiz.webm");
        startDraft(async () => applyDraft(await draftFromAudioAction(fd)));
      };
      recorder.current = rec;
      rec.start();
      setRecording(true); setSeconds(0);
      timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setDraftMsg("Mikrofon nicht verfügbar. Bitte die Notiz als Text eingeben.");
    }
  };
  const stopRecording = () => { recorder.current?.stop(); setRecording(false); if (timer.current) clearInterval(timer.current); };

  const submit = () => start(async () => {
    const r = await saveEvaluationAction({
      lessonId, contents: [...contents], ratings: Object.entries(ratings).filter((e): e is [string, number] => e[1] !== null).map(([skill_code, rating]) => ({ skill_code, rating })),
      comment, nextGoals: goals.map((g) => g.trim()).filter(Boolean), overallRating: overall, sharedWithStudent: shared,
      aiDraft: draft, aiTranscript: transcript.trim() || null, aiDraftModel: draftModel, aiConfirmed: !!draft && aiConfirmed,
    });
    setMsg(r.message);
  });

  const grouped = skills.reduce<Record<string, Skill[]>>((acc, s) => { (acc[s.category] ??= []).push(s); return acc; }, {});
  const disabled = readOnly || pending;
  return (
    <div className="space-y-4">
      <Card title="Sprachnotiz">
        <p className="mb-2 text-sm text-ink-700">Sprich die Stunde kurz ein oder tippe die Notiz. Die KI erstellt daraus einen Entwurf, der das Formular vorbefüllt. Übernommen wird nur, was du prüfst und bestätigst.</p>
        <div className="flex flex-wrap items-center gap-2">
          {canRecord ? (
            recording ? <button type="button" className={btn.danger} onClick={stopRecording}>Aufnahme beenden ({seconds} s)</button> : <button type="button" className={btn.secondary} disabled={disabled || drafting} onClick={startRecording}>Aufnahme starten</button>
          ) : <span className="text-sm text-ink-500">{sttAvailable ? "Aufnahme in diesem Browser nicht möglich." : "Spracherkennung ist nicht konfiguriert: bitte Text eingeben."}</span>}
        </div>
        <label htmlFor="transcript" className="mt-3 mb-1 block text-sm font-medium">Transkript oder Textnotiz</label>
        <textarea id="transcript" value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={4} disabled={disabled} className="w-full rounded-xl border border-ink-300 px-3 py-2" placeholder="Beispiel: Heute Kreisverkehr und Abbiegen geübt, Schulterblick beim Spurwechsel noch unsicher, Geschwindigkeit lief gut. Nächstes Mal Autobahn." />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" className={btn.primary} disabled={disabled || drafting || transcript.trim().length < 10} onClick={() => startDraft(async () => applyDraft(await draftFromTranscriptAction(lessonId, transcript)))}>{drafting ? "Erstelle Entwurf …" : aiAvailable ? "Entwurf erstellen" : "Als Transkript übernehmen"}</button>
          {!aiAvailable && <span className="text-xs text-ink-500">Ohne KI-Anbieter bleibt der Text als Transkript gespeichert.</span>}
        </div>
        {draftMsg && <p className="mt-2 text-sm" role="status" aria-live="polite">{draftMsg}</p>}
        {draft && (
          <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm">
            <p className="font-medium">KI-Entwurf (Sicherheit: {draft.confidence === "verified" ? "hoch" : draft.confidence === "partial" ? "teilweise" : "gering"})</p>
            <p className="text-ink-700">Das Formular wurde mit dem Entwurf vorbefüllt. Prüfe Inhalte, Sterne und Ziele und bestätige den Entwurf vor dem Speichern.</p>
            <label className="mt-2 flex min-h-11 items-center gap-2"><input type="checkbox" checked={aiConfirmed} onChange={(e) => setAiConfirmed(e.target.checked)} disabled={disabled} className="h-5 w-5" /> Ich habe den Entwurf geprüft und übernehme ihn.</label>
          </div>
        )}
      </Card>

      <Card title="Gefahrene Inhalte">
        {Object.entries(grouped).map(([cat, list]) => (
          <fieldset key={cat} className="mb-3">
            <legend className="mb-1 text-xs uppercase tracking-wide text-ink-500">{CATEGORY_LABEL[cat] ?? cat}</legend>
            <div className="flex flex-wrap gap-2">{list.map((s) => (
              <label key={s.code} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm ${contents.has(s.code) ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-300"}`}>
                <input type="checkbox" className="h-4 w-4" checked={contents.has(s.code)} disabled={disabled} onChange={(e) => setContents((prev) => { const n = new Set(prev); if (e.target.checked) n.add(s.code); else n.delete(s.code); return n; })} />{s.name}
              </label>
            ))}</div>
          </fieldset>
        ))}
      </Card>

      <Card title="Bewertung je Kompetenz">
        <p className="mb-2 text-sm text-ink-700">Nur bewertete Kompetenzen werden gespeichert. Bei 1 oder 2 Sternen erhält der Schüler eine Trainingsempfehlung zum passenden Theoriethema.</p>
        <ul className="divide-y divide-ink-100">{skills.filter((s) => contents.has(s.code) || ratings[s.code] != null).map((s) => (
          <li key={s.code} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span id={`r-${s.code}`} className="text-sm font-medium">{s.name}</span>
            <StarInput id={`r-${s.code}`} label={s.name} value={ratings[s.code] ?? null} onChange={(v) => !disabled && setRatings((prev) => ({ ...prev, [s.code]: v }))} />
          </li>
        ))}</ul>
        {skills.filter((s) => contents.has(s.code) || ratings[s.code] != null).length === 0 && <p className="text-sm text-ink-500">Wähle oben gefahrene Inhalte aus, um sie zu bewerten.</p>}
      </Card>

      <Card title="Kommentar und Ziele">
        <label htmlFor="comment" className="mb-1 block text-sm font-medium">Kommentar</label>
        <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} disabled={disabled} className="w-full rounded-xl border border-ink-300 px-3 py-2" />
        {previousGoals.length > 0 && <p className="mt-3 text-xs text-ink-500">Ziele aus der letzten Stunde: {previousGoals.join("; ")}</p>}
        <p className="mt-3 mb-1 text-sm font-medium">Nächste Lernziele</p>
        <ul className="space-y-2">{goals.map((g, i) => (
          <li key={i} className="flex gap-2">
            <label htmlFor={`goal-${i}`} className="sr-only">Lernziel {i + 1}</label>
            <input id={`goal-${i}`} value={g} onChange={(e) => setGoals((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))} disabled={disabled} className="min-h-11 min-w-0 flex-1 rounded-xl border border-ink-300 px-3" placeholder="Zum Beispiel: Schulterblick beim Fahrstreifenwechsel festigen" />
            {goals.length > 1 && <button type="button" className={btn.ghost} disabled={disabled} onClick={() => setGoals((prev) => prev.filter((_, j) => j !== i))} aria-label="Ziel entfernen">Entfernen</button>}
          </li>
        ))}</ul>
        {goals.length < 10 && <button type="button" className={`${btn.ghost} mt-2`} disabled={disabled} onClick={() => setGoals((prev) => [...prev, ""])}>Weiteres Ziel</button>}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div><p id="overall-label" className="mb-1 text-sm font-medium">Gesamteindruck</p><StarInput id="overall-label" label="Gesamteindruck" value={overall} onChange={(v) => !disabled && setOverall(v)} /></div>
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={shared} disabled={disabled} onChange={(e) => setShared(e.target.checked)} /> Für den Schüler sichtbar</label>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={btn.primary} disabled={disabled || (!!draft && !aiConfirmed)} onClick={submit}>{pending ? "Speichere …" : "Dokumentation speichern"}</button>
        {draft && !aiConfirmed && <span className="text-sm text-ink-500">Bitte zuerst den KI-Entwurf bestätigen oder verwerfen.</span>}
        {draft && !aiConfirmed && <button type="button" className={btn.ghost} disabled={disabled} onClick={() => { setDraft(null); setDraftModel(null); setDraftMsg("Entwurf verworfen. Die Eingaben bleiben erhalten."); }}>Entwurf verwerfen</button>}
        {msg && <span className="text-sm" role="status" aria-live="polite">{msg}</span>}
      </div>
    </div>
  );
}
