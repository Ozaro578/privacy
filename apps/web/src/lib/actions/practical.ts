"use server";
import { allow } from "@/lib/security/rate-limit";
import { z } from "zod";
import { createAiServices, gradeExaminerAnswer } from "@fahrpilot/ai";
import { getStudentContext } from "@/lib/data/student";

const Schema = z.object({ questionId: z.string().uuid(), answer: z.string().min(1).max(2000) });
export interface GradeResult { score: number; covered: string[]; missing: string[]; feedback: string; explanation: string | null }

/** Prüfer-Fragen-Trainer: bewertet die Antwort regelbasiert gegen die geprüften Stichpunkte, KI formuliert nur das Feedback. */
export async function gradePracticalAnswer(raw: z.input<typeof Schema>): Promise<GradeResult> {
  const input = Schema.parse(raw);
  const ctx = await getStudentContext();
  const { data: q } = await ctx.db.from("practical_check_questions").select("question, expected_points, explanation").eq("id", input.questionId).eq("review_status", "published").single();
  if (!q) throw new Error("Frage nicht gefunden");
  if (!(await allow("coachStudentDay", ctx.student.id))) throw new Error("Das Tageskontingent für KI-Auswertungen ist erreicht. Morgen geht es weiter.");
  const services = createAiServices();
  const out = await gradeExaminerAnswer({ provider: services.fast }, { question: q.question, expected_points: q.expected_points, student_answer: input.answer, locale: (["de", "en", "tr", "ar"].includes(ctx.student.preferred_locale) ? ctx.student.preferred_locale : "de") as "de" | "en" | "tr" | "ar", explanation: q.explanation });
  return { score: out.score, covered: out.covered_points, missing: out.missing_points, feedback: out.feedback, explanation: q.explanation };
}
