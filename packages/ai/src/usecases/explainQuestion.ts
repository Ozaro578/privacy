import { z } from "zod/v4";
import { dataBlock, findLegalReferences, stripLegalReferences, stripUnsupportedFacts, uncertainNotice } from "../guardrails";
import { BASE_RULES, STYLE_INSTRUCTIONS, languageInstruction } from "../prompts";
import type { AiProvider, AnswerStyle, Confidence, Locale, Source, Usage } from "../types";

export interface ExplainAnswerInput {
  /** Position 1..6 wie in question_answers.position. */
  position: number;
  text: string;
  is_correct: boolean;
  /** question_answers.explanation, geprüft. */
  explanation: string | null;
}

export interface ExplainQuestionInput {
  question_text: string;
  answers: ExplainAnswerInput[];
  /** Geprüfte Inhalte aus question_versions (Primärquelle). */
  verified: {
    question_version_id: string;
    explanation: string | null;
    mnemonic: string | null;
    legal_reference: string | null;
    legal_basis_date: string | null;
  };
  /** Vom Schüler gewählte Antworten (Positionen). */
  selected_positions: number[];
  style?: AnswerStyle;
  locale: Locale;
}

export const ExplainModelOutput = z.object({
  why_correct: z.string().describe("Warum die richtige(n) Antwort(en) richtig sind, nur auf Basis der geprüften Erklärung."),
  why_others_wrong: z
    .array(z.object({ position: z.number().int(), reason: z.string() }))
    .describe("Je falscher Antwort ein Grund. Nur Positionen aus dem Antwortblock."),
  rule: z.string().describe("Die zugrunde liegende Regel in einem Satz, aus der geprüften Erklärung abgeleitet."),
  mnemonic: z.string().describe("Merksatz. Vorhandenen Merksatz übernehmen oder leicht umformulieren; leer, wenn keiner vorliegt und der Stil nicht mnemonic ist."),
  similar_example: z.string().describe("Ein ähnliches Alltagsbeispiel ohne neue Zahlenwerte oder Paragrafen."),
});
export type ExplainModelOutput = z.infer<typeof ExplainModelOutput>;

export interface ExplainQuestionResult {
  why_correct: string;
  why_others_wrong: Array<{ position: number; text: string; reason: string }>;
  rule: string;
  mnemonic: string | null;
  similar_example: string | null;
  sources: Source[];
  confidence: Confidence;
  /** Gesetzt bei confidence = uncertain, sonst null. */
  disclaimer: string | null;
  usage: Usage;
  diagnostics: { removed_facts: string[] };
}

export interface ExplainDeps {
  provider: AiProvider;
  model?: string;
}

export function explainSystemPrompt(locale: Locale, style: AnswerStyle, hasVerified: boolean): string {
  return [
    BASE_RULES,
    languageInstruction(locale),
    STYLE_INSTRUCTIONS[style],
    "Aufgabe: Erkläre dem Fahrschüler, warum die richtige Antwort richtig ist und warum die anderen falsch sind.",
    hasVerified
      ? "Die geprüfte Erklärung im Block <data name=\"erklaerung\"> ist die einzige Quelle. Du darfst sie umformulieren, kürzen und an den Stil anpassen, aber keine neuen Fakten, Zahlenwerte oder Paragrafen ergänzen. Was dort nicht steht, lässt du weg."
      : `Es liegt keine geprüfte Erklärung vor. Erkläre nur, welche Antwort richtig ist, ohne Zahlen, Fristen oder Paragrafen, und weise mit dem Satz "${uncertainNotice(locale)}" darauf hin.`,
    "Wenn der Schüler eine falsche Antwort gewählt hat (Block gewaehlt), gehe in why_others_wrong zuerst auf diese ein.",
  ].join("\n\n");
}

/** Warum-Button: erklärt eine Prüfungsfrage auf Basis der geprüften Erklärung aus question_versions. */
export async function explainQuestion(deps: ExplainDeps, input: ExplainQuestionInput): Promise<ExplainQuestionResult> {
  const style = input.style ?? "simple";
  const hasVerified = !!input.verified.explanation?.trim();
  const hasAnswerExplanations = input.answers.some((a) => !!a.explanation?.trim());

  const answersBlock = input.answers
    .map((a) => dataBlock("antwort", a.text, { position: String(a.position), richtig: a.is_correct ? "ja" : "nein" }) + (a.explanation ? `\n${dataBlock("antwort_erklaerung", a.explanation, { position: String(a.position) })}` : ""))
    .join("\n");
  const verifiedBlock = hasVerified
    ? dataBlock("erklaerung", input.verified.explanation!, { rechtsgrundlage: input.verified.legal_reference ?? "", stand: input.verified.legal_basis_date ?? "" })
    : dataBlock("erklaerung", "(keine geprüfte Erklärung vorhanden)");
  const mnemonicBlock = input.verified.mnemonic ? dataBlock("merksatz", input.verified.mnemonic) : "";
  const selectedBlock = dataBlock("gewaehlt", input.selected_positions.length ? input.selected_positions.join(", ") : "(keine Auswahl)");

  const { data, usage } = await deps.provider.completeJson(
    {
      system: explainSystemPrompt(input.locale, style, hasVerified),
      messages: [{ role: "user", content: [dataBlock("frage", input.question_text), answersBlock, verifiedBlock, mnemonicBlock, selectedBlock].filter(Boolean).join("\n\n") }],
      ...(deps.model ? { model: deps.model } : {}),
      maxTokens: 1500,
      effort: "low",
    },
    ExplainModelOutput,
  );

  // Erlaubte Fakten: alles, was geprüft in der Datenbank steht.
  const allowed = [
    input.question_text,
    ...input.answers.flatMap((a) => [a.text, a.explanation ?? ""]),
    input.verified.explanation ?? "",
    input.verified.mnemonic ?? "",
    input.verified.legal_reference ?? "",
  ];
  const removed = new Set<string>();
  const clean = (s: string): string => {
    const r = stripUnsupportedFacts(s, allowed);
    r.removed.forEach((f) => removed.add(f));
    if (hasVerified) return r.text;
    // Ohne geprüfte Erklärung sind Gesetzesangaben grundsätzlich tabu.
    const l = stripLegalReferences(r.text);
    l.removed.forEach((f) => removed.add(f));
    return l.text;
  };

  const validPositions = new Set(input.answers.map((a) => a.position));
  const wrongAnswers = input.answers.filter((a) => !a.is_correct);
  const why_others_wrong = wrongAnswers.map((a) => {
    const fromModel = data.why_others_wrong.find((w) => w.position === a.position && validPositions.has(w.position));
    return { position: a.position, text: a.text, reason: clean(fromModel?.reason ?? a.explanation ?? "") };
  });

  let confidence: Confidence = hasVerified ? "verified" : hasAnswerExplanations ? "partial" : "uncertain";
  let why_correct = clean(data.why_correct);
  const rule = clean(data.rule);
  const mnemonicText = clean(data.mnemonic).trim();
  const exampleText = clean(data.similar_example).trim();
  // Wenn die Antwort Paragrafen nennt, die nicht in der geprüften Rechtsgrundlage stehen, ist sie nur noch teilweise belegt.
  const knownRefs = findLegalReferences(allowed.join("\n"));
  const allText = [why_correct, rule, mnemonicText, exampleText, ...why_others_wrong.map((w) => w.reason)].join("\n");
  const foreignRefs = findLegalReferences(allText).filter((r) => !knownRefs.includes(r));
  if (removed.size > 0 || foreignRefs.length > 0) {
    if (confidence === "verified") confidence = "partial";
  }

  const sources: Source[] = hasVerified || input.verified.legal_reference
    ? [
        {
          knowledge_entry_id: null,
          question_version_id: input.verified.question_version_id,
          title: input.question_text.length > 80 ? `${input.question_text.slice(0, 77)}...` : input.question_text,
          legal_reference: input.verified.legal_reference,
          legal_basis_date: input.verified.legal_basis_date,
        },
      ]
    : [];

  let disclaimer: string | null = null;
  if (confidence === "uncertain") {
    disclaimer = uncertainNotice(input.locale);
    if (!why_correct.includes(disclaimer)) why_correct = `${disclaimer} ${why_correct}`.trim();
  }

  return {
    why_correct,
    why_others_wrong,
    rule,
    mnemonic: mnemonicText || input.verified.mnemonic || null,
    similar_example: exampleText || null,
    sources,
    confidence,
    disclaimer,
    usage,
    diagnostics: { removed_facts: [...removed] },
  };
}
