import { z } from "zod/v4";
import { allowedTextsOf, renderSources, resolveCitations } from "../citations";
import { dataBlock, enforceUncertainAnswer, stripUnsupportedFacts, uncertainNotice } from "../guardrails";
import type { KnowledgeRepository } from "../knowledge";
import { BASE_RULES, STYLE_INSTRUCTIONS, languageInstruction } from "../prompts";
import type { AiProvider, AnswerStyle, ChatMessage, Confidence, Locale, Source, Usage } from "../types";

export const CoachModelOutput = z.object({
  answer: z.string().describe("Die Antwort an den Fahrschüler in der angegebenen Sprache."),
  cited_source_ids: z.array(z.string()).describe("Nur ids aus den bereitgestellten Quellenblöcken, die tatsächlich verwendet wurden."),
  coverage: z.enum(["full", "partial", "none"]).describe("full: Quellen beantworten die Frage vollständig. partial: nur teilweise. none: keine Quelle passt."),
});
export type CoachModelOutput = z.infer<typeof CoachModelOutput>;

export interface CoachAnswerInput {
  question: string;
  locale: Locale;
  style?: AnswerStyle;
  licenseCodes?: string[];
  topicId?: string;
  /** Bisheriger Dialog (nur Text), älteste Nachricht zuerst. */
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  /** Maximale Anzahl Quellen im Prompt (Standard 5). */
  limit?: number;
}

export interface CoachAnswerResult {
  answer: string;
  sources: Source[];
  confidence: Confidence;
  /** Gesetzt bei confidence = uncertain (Pflichthinweis), sonst null. */
  disclaimer: string | null;
  usage: Usage;
  /** Diagnose für Logging: Anzahl Treffer, verworfene Fakten, unbekannte Zitate. */
  diagnostics: { retrieved: number; removed_facts: string[]; unknown_source_ids: string[] };
}

export interface CoachDeps {
  provider: AiProvider;
  knowledge: KnowledgeRepository;
  model?: string;
}

export function coachSystemPrompt(locale: Locale, style: AnswerStyle, hasSources: boolean): string {
  return [
    BASE_RULES,
    languageInstruction(locale),
    STYLE_INSTRUCTIONS[style],
    "Aufgabe: Beantworte die Frage des Fahrschülers ausschließlich auf Basis der Quellenblöcke.",
    hasSources
      ? "Nutze nur Aussagen, die in den Quellen stehen, und trage jede genutzte Quelle in cited_source_ids ein. Passt keine Quelle, setze coverage auf none, lasse cited_source_ids leer und antworte nur mit einem allgemeinen Hinweis ohne Zahlen und Paragrafen."
      : `Es liegen keine Quellen vor. Antworte mit dem Hinweis: "${uncertainNotice(locale)}" und höchstens einem allgemeinen Satz ohne Zahlen, Fristen oder Paragrafen. cited_source_ids bleibt leer, coverage ist none.`,
  ].join("\n\n");
}

/** Freie Frage an den KI-Fahrlehrer: Retrieval, Antwort mit Quellen, Sicherheitsstufe und Guardrails. */
export async function coachAnswer(deps: CoachDeps, input: CoachAnswerInput): Promise<CoachAnswerResult> {
  const style = input.style ?? "simple";
  const retrieved = await deps.knowledge.search(input.question, {
    locale: input.locale,
    limit: input.limit ?? 5,
    ...(input.licenseCodes ? { licenseCodes: input.licenseCodes } : {}),
    ...(input.topicId ? { topicId: input.topicId } : {}),
  });

  const history: ChatMessage[] = (input.history ?? []).map((h) => ({ role: h.role, content: dataBlock(h.role === "user" ? "frage_verlauf" : "antwort_verlauf", h.content) }));
  const userContent = `${renderSources(retrieved)}\n\n${dataBlock("frage", input.question)}`;

  const { data, usage } = await deps.provider.completeJson(
    {
      system: coachSystemPrompt(input.locale, style, retrieved.length > 0),
      messages: [...history, { role: "user", content: userContent }],
      ...(deps.model ? { model: deps.model } : {}),
      maxTokens: 1500,
      effort: "low",
    },
    CoachModelOutput,
  );

  const res = resolveCitations(retrieved, data.cited_source_ids, data.coverage, input.topicId);
  let confidence = res.confidence;
  let answer = data.answer.trim();
  let removed: string[] = [];

  if (confidence !== "uncertain") {
    const stripped = stripUnsupportedFacts(answer, allowedTextsOf(res.cited));
    removed = stripped.removed;
    if (removed.length) {
      answer = stripped.text;
      confidence = answer ? "partial" : "uncertain";
    }
  }

  if (confidence === "uncertain") {
    const enforced = enforceUncertainAnswer(answer, input.locale);
    answer = enforced.text;
    removed = [...new Set([...removed, ...enforced.removed])];
    return {
      answer,
      sources: [],
      confidence,
      disclaimer: uncertainNotice(input.locale),
      usage,
      diagnostics: { retrieved: retrieved.length, removed_facts: removed, unknown_source_ids: res.unknown_ids },
    };
  }

  return {
    answer,
    sources: res.sources,
    confidence,
    disclaimer: null,
    usage,
    diagnostics: { retrieved: retrieved.length, removed_facts: removed, unknown_source_ids: res.unknown_ids },
  };
}
