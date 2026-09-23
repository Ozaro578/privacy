"use server";
import { allow } from "@/lib/security/rate-limit";
import { z } from "zod";
import { createAiServices, explainQuestion, coachAnswer } from "@fahrpilot/ai";
import type { Json } from "@fahrpilot/db";
import { getStudentContext } from "@/lib/data/student";
import { SupabaseKnowledgeRepository } from "@/lib/ai/knowledge";

export interface WhyExplanation {
  whyCorrect: string;
  whyOthersWrong: string[];
  rule: string | null;
  mnemonic: string | null;
  example: string | null;
  confidence: "verified" | "partial" | "uncertain";
  sources: string[];
  legalBasisDate: string | null;
  disclaimer: string | null;
}

const Schema = z.object({ questionId: z.string().uuid(), selected: z.array(z.number().int()).default([]), style: z.enum(["simple", "detailed", "example", "mnemonic"]).default("simple") });
type Locale = "de" | "en" | "tr" | "ar";
const asLocale = (l: string): Locale => (["de", "en", "tr", "ar"].includes(l) ? (l as Locale) : "de");

/**
 * Warum-Button. Primärquelle ist immer die geprüfte Erklärung aus der Datenbank. Ohne KI-Anbieter werden die geprüften
 * Texte direkt gezeigt; mit Anbieter formuliert der Coach sie im gewünschten Stil um, ohne ungeprüfte Fakten zu ergänzen.
 */
export async function explainQuestionAction(raw: z.input<typeof Schema>): Promise<WhyExplanation> {
  const input = Schema.parse(raw);
  const ctx = await getStudentContext();
  const { data: q } = await ctx.db.from("theory_questions").select("id, topic_id, question_versions!theory_questions_current_version_fk(id, text, explanation, mnemonic, legal_reference, legal_basis_date, question_answers(position, text, is_correct, explanation))").eq("id", input.questionId).single();
  if (!q) throw new Error("Frage nicht gefunden");
  const v = q.question_versions as unknown as { id: string; text: string; explanation: string | null; mnemonic: string | null; legal_reference: string | null; legal_basis_date: string | null; question_answers: Array<{ position: number; text: string; is_correct: boolean; explanation: string | null }> };
  const answers = [...v.question_answers].sort((a, b) => a.position - b.position);
  const services = createAiServices();
  if (!services.coach) {
    const missed = answers.filter((a) => a.is_correct && !input.selected.includes(a.position));
    return {
      whyCorrect: (v.explanation ?? "Für diese Frage liegt noch keine geprüfte Erklärung vor. Bitte mit deinem Fahrlehrer klären.") + (missed.length ? ` Nicht ausgewählt, aber richtig: „${missed.map((m) => m.text).join("“, „")}“.` : ""),
      whyOthersWrong: answers.filter((a) => !a.is_correct).map((a) => `„${a.text}“: ${a.explanation ?? "trifft nicht zu."}`),
      rule: v.legal_reference, mnemonic: v.mnemonic, example: null, confidence: v.explanation ? "verified" : "uncertain",
      sources: v.legal_reference ? [v.legal_reference] : [], legalBasisDate: v.legal_basis_date, disclaimer: v.explanation ? null : "Ohne geprüfte Quelle.",
    };
  }
  if (!(await allow("coachStudentDay", ctx.student.id))) throw new Error("Das Tageskontingent für KI-Erklärungen ist erreicht. Die geprüfte Erklärung steht weiterhin unter der Frage; morgen geht es mit dem Coach weiter.");
  const out = await explainQuestion({ provider: services.coach, model: services.models.coach }, {
    question_text: v.text, answers: answers.map((a) => ({ position: a.position, text: a.text, is_correct: a.is_correct, explanation: a.explanation })),
    verified: { question_version_id: v.id, explanation: v.explanation, mnemonic: v.mnemonic, legal_reference: v.legal_reference, legal_basis_date: v.legal_basis_date },
    selected_positions: input.selected, style: input.style, locale: asLocale(ctx.student.preferred_locale),
  });
  const { data: conv } = await ctx.db.from("coach_conversations").insert({ tenant_id: ctx.tenantId, student_id: ctx.student.id, context_kind: "question", context_ref: q.id, locale: ctx.student.preferred_locale }).select("id").single();
  if (conv) await ctx.db.from("coach_messages").insert({ conversation_id: conv.id, role: "assistant", content: out.why_correct, style: input.style, sources: out.sources as unknown as Json, confidence: out.confidence, model: out.usage.model, input_tokens: out.usage.input_tokens, output_tokens: out.usage.output_tokens });
  return {
    whyCorrect: out.why_correct, whyOthersWrong: out.why_others_wrong.map((w) => `„${w.text}“: ${w.reason}`), rule: out.rule, mnemonic: out.mnemonic, example: out.similar_example,
    confidence: out.confidence, sources: out.sources.map((s) => s.title), legalBasisDate: v.legal_basis_date, disclaimer: out.disclaimer,
  };
}

const AskSchema = z.object({ question: z.string().min(2).max(1000), topicId: z.string().uuid().optional(), style: z.enum(["simple", "detailed", "example", "mnemonic"]).default("simple"), conversationId: z.string().uuid().optional() });

export interface CoachReply { conversationId: string; answer: string; confidence: "verified" | "partial" | "uncertain"; sources: Array<{ title: string; legal_reference: string | null }>; disclaimer: string | null; }

/** Freie Frage an den KI-Fahrlehrer, Antworten nur mit Quellen aus der geprüften Wissensbasis. */
export async function askCoachAction(raw: z.input<typeof AskSchema>): Promise<CoachReply> {
  const input = AskSchema.parse(raw);
  const ctx = await getStudentContext();
  if (!(await allow("coachStudentDay", ctx.student.id))) throw new Error("Das Tageskontingent für Fragen an den KI-Coach ist erreicht. Morgen geht es weiter.");
  const services = createAiServices();
  const locale = asLocale(ctx.student.preferred_locale);
  let conversationId = input.conversationId;
  if (!conversationId) {
    const { data: conv } = await ctx.db.from("coach_conversations").insert({ tenant_id: ctx.tenantId, student_id: ctx.student.id, context_kind: input.topicId ? "topic" : "free", context_ref: input.topicId ?? null, locale }).select("id").single();
    conversationId = conv?.id;
  }
  if (!conversationId) throw new Error("Konversation konnte nicht angelegt werden");
  const { data: history } = await ctx.db.from("coach_messages").select("role, content").eq("conversation_id", conversationId).order("created_at").limit(12);
  await ctx.db.from("coach_messages").insert({ conversation_id: conversationId, role: "user", content: input.question });
  const repo = new SupabaseKnowledgeRepository(ctx.db);
  if (!services.coach) {
    const hits = await repo.search(input.question, { locale, limit: 3, ...(input.topicId ? { topicId: input.topicId } : {}) });
    const answer = hits.length ? hits.map((h) => `${h.title}: ${h.summary ?? h.body_markdown.slice(0, 300)}`).join("\n\n") : "Dazu liegt keine geprüfte Quelle vor. Bitte mit deinem Fahrlehrer klären.";
    await ctx.db.from("coach_messages").insert({ conversation_id: conversationId, role: "assistant", content: answer, confidence: hits.length ? "partial" : "uncertain", sources: hits.map((h) => ({ knowledge_entry_id: h.id, title: h.title })) as unknown as Json });
    return { conversationId, answer, confidence: hits.length ? "partial" : "uncertain", sources: hits.map((h) => ({ title: h.title, legal_reference: h.legal_reference })), disclaimer: hits.length ? "Der KI-Coach ist nicht konfiguriert. Dies sind die passenden Einträge der Wissensbasis." : null };
  }
  const out = await coachAnswer({ provider: services.coach, knowledge: repo, model: services.models.coach }, {
    question: input.question, locale, style: input.style, licenseCodes: [ctx.license.license_code], ...(input.topicId ? { topicId: input.topicId } : {}),
    history: (history ?? []).filter((h) => h.role !== "system").map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
  });
  await ctx.db.from("coach_messages").insert({ conversation_id: conversationId, role: "assistant", content: out.answer, style: input.style, sources: out.sources as unknown as Json, confidence: out.confidence, model: out.usage.model, input_tokens: out.usage.input_tokens, output_tokens: out.usage.output_tokens });
  return { conversationId, answer: out.answer, confidence: out.confidence, sources: out.sources.map((s) => ({ title: s.title, legal_reference: s.legal_reference ?? null })), disclaimer: out.disclaimer ?? null };
}
