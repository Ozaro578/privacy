import type { ErrorAnalysis, ErrorCluster } from "@fahrpilot/learning-engine";
import { z } from "zod/v4";
import { dataBlock, stripLegalReferences } from "../guardrails";
import { BASE_RULES, languageInstruction } from "../prompts";
import type { AiProvider, Locale, Usage } from "../types";
import { ZERO_USAGE } from "../types";

/** Lernmodi, die als Übungsvorschlag erlaubt sind (Teilmenge von LearningMode aus @fahrpilot/learning-engine). */
export const EXERCISE_MODES = ["topic", "wrong", "review", "hard", "exam", "random"] as const;
export type ExerciseMode = (typeof EXERCISE_MODES)[number];

export const ExerciseSuggestion = z.object({
  mode: z.enum(EXERCISE_MODES),
  topic_id: z.string().nullable().describe("Nur ids aus dem Block fehlercluster; null bei themenübergreifenden Modi."),
  count: z.number().int().min(5).max(50).describe("Anzahl Fragen."),
  reason: z.string().describe("Ein Satz in einfacher Sprache, warum diese Übung hilft."),
});
export type ExerciseSuggestion = z.infer<typeof ExerciseSuggestion>;

export const ErrorPatternModelOutput = z.object({
  explanation: z.string().describe("Erklärung des Fehlermusters in einfacher Sprache, 2 bis 4 Sätze, ohne Zahlenwerte aus dem Straßenverkehr und ohne Paragrafen."),
  exercises: z.array(ExerciseSuggestion).min(3).max(5),
});
export type ErrorPatternModelOutput = z.infer<typeof ErrorPatternModelOutput>;

export interface AnalyzeErrorPatternInput {
  analysis: ErrorAnalysis;
  locale: Locale;
}

export interface AnalyzeErrorPatternResult {
  explanation: string;
  exercises: ExerciseSuggestion[];
  usage: Usage;
  diagnostics: { dropped_topic_ids: string[]; used_fallback: boolean };
}

export interface AnalyzeErrorPatternDeps {
  /** Optional: ohne Provider wird das Muster rein regelbasiert beschrieben. */
  provider?: AiProvider | null;
  model?: string;
}

function renderAnalysis(a: ErrorAnalysis): string {
  const clusters = a.clusters.map((c: ErrorCluster) => `- id=${c.topic_id} | ${c.topic_name} | Fehler: ${c.errors} | Anteil: ${Math.round(c.share * 100)} %`).join("\n");
  const confusions = a.confusions.map((c) => `- ${c.tag_a} / ${c.tag_b} (${c.errors} Fehler): ${c.description}`).join("\n");
  return [
    dataBlock("fehlercluster", clusters || "(keine)", { betrachtete_fehler: String(a.window) }),
    dataBlock("verwechslungen", confusions || "(keine)"),
    dataBlock("kennzahlen", `schnell_falsch_anteil=${a.fast_wrong_share.toFixed(2)}\nsicher_falsch_anteil=${a.confident_wrong_share.toFixed(2)}`),
    dataBlock("aussagen", a.statements.join("\n") || "(keine)"),
  ].join("\n\n");
}

/** Regelbasierte Vorschläge, die immer 3 bis 5 Einträge liefern. */
export function fallbackExercises(a: ErrorAnalysis): ExerciseSuggestion[] {
  const out: ExerciseSuggestion[] = [];
  const top = a.clusters.slice(0, 2);
  for (const c of top) out.push({ mode: "topic", topic_id: c.topic_id, count: 20, reason: `Hier passieren dir die meisten Fehler (${c.topic_name}). Gezieltes Üben festigt die Regel.` });
  out.push({ mode: "wrong", topic_id: null, count: 15, reason: "Falsch beantwortete Fragen noch einmal lösen und dabei die Erklärung lesen." });
  if (a.fast_wrong_share > 0.4) out.push({ mode: "hard", topic_id: null, count: 10, reason: "Schwere Fragen langsam lesen, damit du nicht aus Flüchtigkeit falsch antwortest." });
  else out.push({ mode: "review", topic_id: null, count: 15, reason: "Fällige Wiederholungen halten das Gelernte im Gedächtnis." });
  if (out.length < 3) out.push({ mode: "random", topic_id: null, count: 20, reason: "Gemischte Fragen zeigen, wo noch Lücken sind." });
  return out.slice(0, 5);
}

function fallbackExplanation(a: ErrorAnalysis): string {
  if (a.statements.length) return a.statements.join(" ");
  if (a.window === 0) return "Es liegen noch zu wenige Fehler vor, um ein Muster zu erkennen. Lerne einfach weiter.";
  return "Deine Fehler verteilen sich auf mehrere Themen. Ein klares Muster ist noch nicht erkennbar.";
}

/** Erklärt ein aggregiertes Fehlermuster in einfacher Sprache und schlägt 3 bis 5 Übungen vor. */
export async function analyzeErrorPattern(deps: AnalyzeErrorPatternDeps, input: AnalyzeErrorPatternInput): Promise<AnalyzeErrorPatternResult> {
  const a = input.analysis;
  const allowedTopics = new Set(a.clusters.map((c) => c.topic_id));
  if (a.recommendation) allowedTopics.add(a.recommendation.topic_id);

  if (!deps.provider) {
    return { explanation: fallbackExplanation(a), exercises: fallbackExercises(a), usage: ZERO_USAGE(), diagnostics: { dropped_topic_ids: [], used_fallback: true } };
  }

  const system = [
    BASE_RULES,
    languageInstruction(input.locale),
    "Aufgabe: Erkläre dem Fahrschüler sein Fehlermuster freundlich und in einfacher Sprache und schlage 3 bis 5 Übungen vor.",
    `Erlaubte Modi: ${EXERCISE_MODES.join(", ")}. topic_id nur aus dem Block fehlercluster übernehmen, sonst null. Keine Verkehrsregeln mit Zahlenwerten oder Paragrafen erklären, nur das Lernverhalten.`,
  ].join("\n\n");

  let data: ErrorPatternModelOutput;
  let usage: Usage;
  try {
    const res = await deps.provider.completeJson(
      { system, messages: [{ role: "user", content: renderAnalysis(a) }], ...(deps.model ? { model: deps.model } : {}), maxTokens: 1200, effort: "low", temperature: 0.3 },
      ErrorPatternModelOutput,
    );
    data = res.data;
    usage = res.usage;
  } catch {
    return { explanation: fallbackExplanation(a), exercises: fallbackExercises(a), usage: ZERO_USAGE(), diagnostics: { dropped_topic_ids: [], used_fallback: true } };
  }

  const dropped: string[] = [];
  let exercises = data.exercises.filter((e) => {
    if (e.topic_id === null) return true;
    if (allowedTopics.has(e.topic_id)) return true;
    dropped.push(e.topic_id);
    return false;
  });
  if (exercises.length < 3) {
    const seen = new Set(exercises.map((e) => `${e.mode}:${e.topic_id ?? ""}`));
    for (const f of fallbackExercises(a)) {
      if (exercises.length >= 3) break;
      const key = `${f.mode}:${f.topic_id ?? ""}`;
      if (!seen.has(key)) { exercises.push(f); seen.add(key); }
    }
  }
  exercises = exercises.slice(0, 5);

  const explanation = stripLegalReferences(data.explanation).text || fallbackExplanation(a);
  return { explanation, exercises, usage, diagnostics: { dropped_topic_ids: dropped, used_fallback: false } };
}
