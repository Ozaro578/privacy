import { z } from "zod/v4";
import { dataBlock } from "../guardrails";
import { normalizeText } from "../knowledge";
import { BASE_RULES } from "../prompts";
import type { AiProvider, Usage } from "../types";
import { ZERO_USAGE } from "../types";

/** Whitelist strukturierter Abfragen. Das Web-Projekt bildet jeden Typ auf eine feste, parametrisierte Datenbankabfrage ab. Kein freies SQL. */
export const InstructorStructuredQuery = z.discriminatedUnion("type", [
  z.object({ type: z.literal("students_ready_soon"), days: z.number().int().min(1).max(90).describe("Zeitraum in Tagen, Standard 14.") }),
  z.object({ type: z.literal("students_open_special_drives") }),
  z.object({ type: z.literal("students_without_lesson_this_week") }),
  z.object({ type: z.literal("students_weak_topic"), topic_code: z.string().min(1).describe("topics.code, z. B. vorfahrt.") }),
]);
export type InstructorStructuredQuery = z.infer<typeof InstructorStructuredQuery>;

export const InstructorQueryModelOutput = z.discriminatedUnion("type", [
  ...InstructorStructuredQuery.options,
  z.object({ type: z.literal("unknown"), clarification: z.string().describe("Rückfrage an den Fahrlehrer, welche der möglichen Auswertungen gemeint ist.") }),
]);
export type InstructorQueryModelOutput = z.infer<typeof InstructorQueryModelOutput>;

export type InstructorQueryResolution = InstructorStructuredQuery | { type: "unknown"; clarification: string };

export const QUERY_TYPES = InstructorStructuredQuery.options.map((o) => o.shape.type.value) as ReadonlyArray<InstructorStructuredQuery["type"]>;

export interface InstructorQueryInput {
  question: string;
  /** Erlaubte topics.code (mit Name) für students_weak_topic. Unbekannte Codes führen zu unknown. */
  topics?: Array<{ code: string; name: string }>;
}

export interface InstructorQueryResult {
  query: InstructorQueryResolution;
  usage: Usage;
  diagnostics: { rule_based: boolean; rejected_type: string | null };
}

export interface InstructorQueryDeps {
  /** Optional: ohne Provider greift eine einfache Stichwort-Zuordnung. */
  provider?: AiProvider | null;
  model?: string;
}

export const UNKNOWN_CLARIFICATION =
  "Das habe ich nicht eindeutig verstanden. Möglich sind: Schüler, die bald prüfungsreif sind; Schüler mit offenen Sonderfahrten; Schüler ohne Fahrstunde diese Woche; Schüler mit Schwächen in einem Thema. Was meinst du?";

const QUERY_DESCRIPTIONS = `Mögliche Abfragen:
- students_ready_soon {days}: Schüler, die in den nächsten Tagen prüfungsreif werden (Standard 14 Tage).
- students_open_special_drives: Schüler mit noch offenen Sonderfahrten (Überland, Autobahn, Nacht).
- students_without_lesson_this_week: Schüler, die diese Woche keine Fahrstunde haben.
- students_weak_topic {topic_code}: Schüler mit Schwächen in einem Theoriethema. topic_code nur aus dem Block themen.
- unknown {clarification}: wenn die Frage zu keiner Abfrage passt oder mehrdeutig ist.`;

/** Regelbasierte Zuordnung als Fallback ohne Provider. */
export function classifyByRules(question: string, topics: Array<{ code: string; name: string }> = []): InstructorQueryResolution {
  const q = normalizeText(question);
  const has = (...words: string[]) => words.some((w) => q.includes(normalizeText(w)));
  if (has("sonderfahrt", "ueberlandfahrt", "autobahnfahrt", "nachtfahrt")) return { type: "students_open_special_drives" };
  if (has("prüfungsreif", "pruefungsreif", "reif", "bereit für die prüfung", "ready")) {
    const m = q.match(/(\d{1,2})\s*(tag|tage|tagen|days?)/);
    const days = m ? Math.min(90, Math.max(1, Number(m[1]))) : 14;
    return { type: "students_ready_soon", days };
  }
  if (has("keine fahrstunde", "ohne fahrstunde", "nicht gefahren", "no lesson")) return { type: "students_without_lesson_this_week" };
  if (has("schwach", "schwaech", "probleme mit", "fehler bei", "schwierigkeiten")) {
    const topic = topics.find((t) => q.includes(normalizeText(t.name)) || q.includes(normalizeText(t.code)));
    if (topic) return { type: "students_weak_topic", topic_code: topic.code };
  }
  return { type: "unknown", clarification: UNKNOWN_CLARIFICATION };
}

/** Prüft eine Modellausgabe gegen die Whitelist und die erlaubten Themen. */
export function validateResolution(raw: unknown, topics: Array<{ code: string; name: string }> | undefined): { query: InstructorQueryResolution; rejected_type: string | null } {
  const parsed = InstructorQueryModelOutput.safeParse(raw);
  if (!parsed.success) {
    const t = typeof raw === "object" && raw !== null && "type" in raw ? String((raw as { type: unknown }).type) : null;
    return { query: { type: "unknown", clarification: UNKNOWN_CLARIFICATION }, rejected_type: t };
  }
  const q = parsed.data;
  if (q.type === "students_weak_topic" && topics && !topics.some((t) => t.code === q.topic_code)) {
    return { query: { type: "unknown", clarification: `Das Thema "${q.topic_code}" kenne ich nicht. Welches Thema meinst du?` }, rejected_type: null };
  }
  return { query: q, rejected_type: null };
}

/** Fahrlehrer-KI: übersetzt eine natürliche Frage in eine strukturierte, whitelisted Abfrage. */
export async function instructorQuery(deps: InstructorQueryDeps, input: InstructorQueryInput): Promise<InstructorQueryResult> {
  if (!deps.provider) {
    const { query, rejected_type } = validateResolution(classifyByRules(input.question, input.topics), input.topics);
    return { query, usage: ZERO_USAGE(), diagnostics: { rule_based: true, rejected_type } };
  }
  const system = [
    BASE_RULES,
    "Aufgabe: Ordne die Frage eines Fahrlehrers genau einer der erlaubten Abfragen zu. Du erzeugst kein SQL und keine freien Filter. Bei Unsicherheit wähle unknown mit einer kurzen Rückfrage auf Deutsch.",
    QUERY_DESCRIPTIONS,
  ].join("\n\n");
  const topicsBlock = input.topics?.length ? dataBlock("themen", input.topics.map((t) => `${t.code}: ${t.name}`).join("\n")) : "";
  try {
    const { data, usage } = await deps.provider.completeJson(
      { system, messages: [{ role: "user", content: [topicsBlock, dataBlock("frage", input.question)].filter(Boolean).join("\n\n") }], ...(deps.model ? { model: deps.model } : {}), maxTokens: 300, temperature: 0, effort: "low" },
      InstructorQueryModelOutput,
    );
    const { query, rejected_type } = validateResolution(data, input.topics);
    return { query, usage, diagnostics: { rule_based: false, rejected_type } };
  } catch {
    return { query: { type: "unknown", clarification: UNKNOWN_CLARIFICATION }, usage: ZERO_USAGE(), diagnostics: { rule_based: false, rejected_type: "invalid" } };
  }
}
