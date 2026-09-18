import { z } from "zod/v4";
import { dataBlock } from "../guardrails";
import { BASE_RULES } from "../prompts";
import type { AiProvider, AudioInput, Confidence, TranscriptionProvider, Usage } from "../types";
import { addUsage, ZERO_USAGE } from "../types";

export interface SkillOption {
  code: string;
  name: string;
}

export interface StructureLessonNotesInput {
  transcript: string;
  /** Erlaubte Kompetenzen (skills.code mit Anzeigename). Andere Codes werden verworfen. */
  skills: SkillOption[];
}

/** Entwurf für lesson_evaluations.ai_draft. Wird erst nach Bestätigung durch den Fahrlehrer übernommen. */
export const LessonNotesDraft = z.object({
  contents: z.array(z.string()).describe("Gefahrene Inhalte als skill_code aus der Liste."),
  ratings: z.array(z.object({ skill_code: z.string(), rating: z.number().int().min(1).max(5) })).describe("Sterne 1 bis 5 je Kompetenz, nur wenn der Fahrlehrer eine Bewertung geäußert hat."),
  comment: z.string().describe("Kurzer Kommentar zur Fahrstunde in der Sprache des Transkripts."),
  next_goals: z.array(z.string()).describe("Ziele für die nächste Stunde, je ein kurzer Satz."),
  confidence: z.enum(["verified", "partial", "uncertain"]).describe("verified: Transkript klar zuordenbar. partial: Teile unklar. uncertain: Transkript kaum verwertbar."),
});
export type LessonNotesDraft = z.infer<typeof LessonNotesDraft>;

export interface StructureLessonNotesResult {
  draft: LessonNotesDraft;
  transcript: string;
  usage: Usage;
  diagnostics: { dropped_skill_codes: string[] };
}

export interface StructureLessonNotesDeps {
  provider: AiProvider;
  model?: string;
  transcription?: TranscriptionProvider;
}

export function lessonNotesSystemPrompt(skills: SkillOption[]): string {
  const list = skills.map((s) => `- ${s.code}: ${s.name}`).join("\n");
  return [
    BASE_RULES,
    "Aufgabe: Strukturiere die Sprachnotiz eines Fahrlehrers nach einer Fahrstunde zu einem Entwurf. Der Fahrlehrer prüft und bestätigt den Entwurf, du entscheidest nichts endgültig.",
    `Erlaubte Kompetenzen (skill_code: Name):\n${list}`,
    "Regeln: Verwende ausschließlich skill_codes aus dieser Liste. Erfinde keine Codes und keine Inhalte, die nicht in der Notiz vorkommen. Bewertungen nur, wenn der Fahrlehrer sie erkennbar äußert (z. B. 'lief gut' = 4, 'sehr gut' = 5, 'muss noch üben' = 2). Der Kommentar bleibt sachlich und kurz.",
  ].join("\n\n");
}

/** Bereinigt einen Entwurf: unbekannte skill_codes werden verworfen, Dubletten entfernt, Sicherheitsstufe ggf. gesenkt. */
export function sanitizeLessonNotesDraft(draft: LessonNotesDraft, skills: SkillOption[]): { draft: LessonNotesDraft; dropped: string[] } {
  const allowed = new Set(skills.map((s) => s.code));
  const dropped: string[] = [];
  const contents: string[] = [];
  for (const c of draft.contents) {
    if (!allowed.has(c)) { dropped.push(c); continue; }
    if (!contents.includes(c)) contents.push(c);
  }
  const ratings: LessonNotesDraft["ratings"] = [];
  for (const r of draft.ratings) {
    if (!allowed.has(r.skill_code)) { dropped.push(r.skill_code); continue; }
    if (ratings.some((x) => x.skill_code === r.skill_code)) continue;
    ratings.push({ skill_code: r.skill_code, rating: Math.min(5, Math.max(1, Math.round(r.rating))) });
  }
  const uniqueDropped = [...new Set(dropped)];
  let confidence: Confidence = draft.confidence;
  if (uniqueDropped.length > 0 && confidence === "verified") confidence = "partial";
  return {
    draft: {
      contents,
      ratings,
      comment: draft.comment.trim(),
      next_goals: [...new Set(draft.next_goals.map((g) => g.trim()).filter(Boolean))],
      confidence,
    },
    dropped: uniqueDropped,
  };
}

/** Sprachnotiz (Transkript) des Fahrlehrers zu einem strukturierten Entwurf (ai_draft) verarbeiten. */
export async function structureLessonNotes(deps: StructureLessonNotesDeps, input: StructureLessonNotesInput): Promise<StructureLessonNotesResult> {
  const transcript = input.transcript.trim();
  if (transcript.length < 10) {
    return {
      draft: { contents: [], ratings: [], comment: "", next_goals: [], confidence: "uncertain" },
      transcript,
      usage: ZERO_USAGE(),
      diagnostics: { dropped_skill_codes: [] },
    };
  }
  const { data, usage } = await deps.provider.completeJson(
    {
      system: lessonNotesSystemPrompt(input.skills),
      messages: [{ role: "user", content: dataBlock("sprachnotiz", transcript) }],
      ...(deps.model ? { model: deps.model } : {}),
      maxTokens: 1200,
      temperature: 0,
      effort: "low",
    },
    LessonNotesDraft,
  );
  const { draft, dropped } = sanitizeLessonNotesDraft(data, input.skills);
  return { draft, transcript, usage, diagnostics: { dropped_skill_codes: dropped } };
}

/** Komfortfunktion: Audio transkribieren und anschließend strukturieren. Benötigt deps.transcription. */
export async function structureLessonNotesFromAudio(
  deps: StructureLessonNotesDeps & { transcription: TranscriptionProvider },
  input: { audio: AudioInput; skills: SkillOption[] },
): Promise<StructureLessonNotesResult> {
  const { text } = await deps.transcription.transcribe(input.audio);
  const res = await structureLessonNotes(deps, { transcript: text, skills: input.skills });
  return { ...res, usage: addUsage(res.usage) };
}
