import { z } from "zod/v4";
import { dataBlock, stripUnsupportedFacts } from "../guardrails";
import { normalizeText, tokenize } from "../knowledge";
import { BASE_RULES, languageInstruction } from "../prompts";
import type { AiProvider, Locale, Usage } from "../types";
import { ZERO_USAGE } from "../types";

export interface GradeExaminerAnswerInput {
  question: string;
  /** practical_check_questions.expected_points */
  expected_points: string[];
  student_answer: string;
  locale?: Locale;
  /** Optionale geprüfte Erklärung (practical_check_questions.explanation) als zusätzliche Feedback-Quelle. */
  explanation?: string | null;
}

export interface GradeExaminerAnswerResult {
  score: number;
  covered_points: string[];
  missing_points: string[];
  feedback: string;
  usage: Usage;
  diagnostics: { rule_based_feedback: boolean; removed_facts: string[] };
}

export interface GradeExaminerAnswerDeps {
  /** Optional: ohne Provider wird das Feedback regelbasiert formuliert. */
  provider?: AiProvider | null;
  model?: string;
}

const FeedbackOutput = z.object({
  feedback: z.string().describe("2 bis 4 freundliche Sätze: was gut war, was fehlt, ohne neue Fakten."),
});

/** Wortstamm-Näherung für deutsche Flexion (Reifen/Reifens, prüfen/prüfe, Profiltiefe/Profil). */
export function stem(token: string): string {
  return token.length > 6 ? token.slice(0, 6) : token;
}

/** Deckt die Antwort einen erwarteten Punkt ab? Mindestens die Hälfte der Stichwörter (Stammvergleich) muss vorkommen. */
export function coversPoint(answer: string, point: string): boolean {
  const answerStems = new Set(tokenize(answer).map(stem));
  const terms = tokenize(point);
  if (terms.length === 0) return normalizeText(answer).includes(normalizeText(point));
  const hits = terms.filter((t) => answerStems.has(stem(t))).length;
  return hits / terms.length >= 0.5;
}

/** Regelbasierte Bewertung: Abdeckung der expected_points per normalisierter Stichwortsuche. */
export function gradeByRules(input: Pick<GradeExaminerAnswerInput, "expected_points" | "student_answer">): { score: number; covered_points: string[]; missing_points: string[] } {
  const covered: string[] = [];
  const missing: string[] = [];
  for (const p of input.expected_points) (coversPoint(input.student_answer, p) ? covered : missing).push(p);
  const total = input.expected_points.length;
  const score = total === 0 ? 0 : Math.round((covered.length / total) * 100);
  return { score, covered_points: covered, missing_points: missing };
}

function ruleFeedback(score: number, covered: string[], missing: string[]): string {
  if (missing.length === 0 && covered.length > 0) return "Sehr gut, du hast alle wichtigen Punkte genannt.";
  if (covered.length === 0) return `Da fehlt noch einiges. Wichtige Punkte sind: ${missing.join(", ")}. Wiederhole diese Prüfungsfrage noch einmal.`;
  const lead = score >= 60 ? "Gut, das Wichtigste hast du genannt." : "Ein guter Anfang, aber es fehlt noch etwas.";
  return `${lead} Genannt: ${covered.join(", ")}. Es fehlt noch: ${missing.join(", ")}.`;
}

/** Prüfer-Fragen-Trainer: bewertet primär regelbasiert, das Modell formuliert nur das Feedback. */
export async function gradeExaminerAnswer(deps: GradeExaminerAnswerDeps, input: GradeExaminerAnswerInput): Promise<GradeExaminerAnswerResult> {
  const graded = gradeByRules(input);
  const fallback = ruleFeedback(graded.score, graded.covered_points, graded.missing_points);
  if (!deps.provider) {
    return { ...graded, feedback: fallback, usage: ZERO_USAGE(), diagnostics: { rule_based_feedback: true, removed_facts: [] } };
  }
  const locale = input.locale ?? "de";
  const system = [
    BASE_RULES,
    languageInstruction(locale),
    "Aufgabe: Formuliere ein kurzes, freundliches Feedback zur Antwort eines Fahrschülers auf eine Prüferfrage. Die Bewertung (abgedeckte und fehlende Punkte) ist bereits festgelegt und darf nicht verändert oder ergänzt werden. Nenne keine Fakten, die nicht in den Blöcken stehen.",
  ].join("\n\n");
  const content = [
    dataBlock("pruefer_frage", input.question),
    dataBlock("erwartete_punkte", input.expected_points.join("\n")),
    input.explanation ? dataBlock("erklaerung", input.explanation) : "",
    dataBlock("schueler_antwort", input.student_answer),
    dataBlock("bewertung", `score=${graded.score}\nabgedeckt: ${graded.covered_points.join("; ") || "(keine)"}\nfehlend: ${graded.missing_points.join("; ") || "(keine)"}`),
  ].filter(Boolean).join("\n\n");

  try {
    const { data, usage } = await deps.provider.completeJson(
      { system, messages: [{ role: "user", content }], ...(deps.model ? { model: deps.model } : {}), maxTokens: 400, temperature: 0.3, effort: "low" },
      FeedbackOutput,
    );
    const allowed = [input.question, ...input.expected_points, input.explanation ?? ""];
    const stripped = stripUnsupportedFacts(data.feedback, allowed);
    const feedback = stripped.text.trim() || fallback;
    return { ...graded, feedback, usage, diagnostics: { rule_based_feedback: !stripped.text.trim(), removed_facts: stripped.removed } };
  } catch {
    return { ...graded, feedback: fallback, usage: ZERO_USAGE(), diagnostics: { rule_based_feedback: true, removed_facts: [] } };
  }
}
