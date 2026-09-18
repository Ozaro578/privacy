"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Json } from "@fahrpilot/db";
import { composeExam, scoreExam, type AnsweredQuestion } from "@fahrpilot/rules-engine";
import { analyzeErrors, XP_TABLE } from "@fahrpilot/learning-engine";
import { getStudentContext } from "@/lib/data/student";
import { buildLearningOverview, loadQuestionPool, loadStates, loadTopics, toMeta } from "@/lib/data/learning";
import { computeAndStoreReadiness } from "@/lib/data/readiness";
import { loadTrainingStatus } from "@/lib/data/training";

/** Startet eine Prüfungssimulation nach der gültigen Regelversion und friert Regeln und Fragen ein. */
export async function startExamSimulation(): Promise<never> {
  const ctx = await getStudentContext();
  const rule = ctx.rules.examTheory;
  if (!rule) throw new Error("Für diese Klasse ist noch keine Prüfungsregel hinterlegt.");
  const pool = await loadQuestionPool(ctx.db, ctx.license.license_code, ctx.licenseInfo.base_class, ctx.student.preferred_locale);
  const { data: recent } = await ctx.db.from("exam_simulations").select("question_ids").eq("student_id", ctx.student.id).order("started_at", { ascending: false }).limit(3);
  const recentlyUsed = new Set((recent ?? []).flatMap((r) => r.question_ids));
  const questions = composeExam(rule.rules, pool.map((q) => ({ id: q.id, material_kind: q.material_kind, points: q.points, topic_id: q.topic_id })), { recentlyUsed });
  const clientSessionId = crypto.randomUUID();
  const { data: sim, error } = await ctx.db.from("exam_simulations").insert({
    tenant_id: ctx.tenantId, student_id: ctx.student.id, student_license_id: ctx.license.id, license_code: ctx.license.license_code, rule_version_id: rule.version.id,
    rule_snapshot: rule.rules as unknown as Json, client_session_id: clientSessionId, time_limit_seconds: rule.rules.time_limit_seconds, question_ids: questions.map((q) => q.id),
  }).select("id").single();
  if (error || !sim) throw new Error("Simulation konnte nicht gestartet werden");
  const byId = new Map(pool.map((q) => [q.id, q]));
  await ctx.db.from("exam_results").insert(questions.map((q, i) => ({ exam_simulation_id: sim.id, question_id: q.id, question_version_id: byId.get(q.id)!.version.id, position: i + 1, points: q.points })));
  redirect(`/lernen/pruefung/${sim.id}`);
}

const SubmitSchema = z.object({
  simulationId: z.string().uuid(),
  answers: z.array(z.object({ questionId: z.string().uuid(), selected: z.array(z.number().int()).default([]), numericAnswer: z.number().nullable().default(null), unsure: z.boolean().default(false), responseMs: z.number().int().nullable().default(null) })),
});

/** Wertet die Simulation strikt nach dem eingefrorenen Regel-Snapshot aus und speichert Ergebnis, Analyse und Prüfungsreife. */
export async function submitExamSimulation(raw: z.input<typeof SubmitSchema>): Promise<{ id: string }> {
  const input = SubmitSchema.parse(raw);
  const ctx = await getStudentContext();
  const { db } = ctx;
  const { data: sim } = await db.from("exam_simulations").select("*").eq("id", input.simulationId).eq("student_id", ctx.student.id).single();
  if (!sim) throw new Error("Simulation nicht gefunden");
  if (sim.status !== "in_progress") return { id: sim.id };
  const rules = sim.rule_snapshot as unknown as Parameters<typeof scoreExam>[0];
  const { data: results } = await db.from("exam_results").select("*, question_versions(numeric_answer, numeric_tolerance, question_answers(position, is_correct))").eq("exam_simulation_id", sim.id).order("position");
  const answered: AnsweredQuestion[] = [];
  const updates: Array<PromiseLike<unknown>> = [];
  const attemptRows = [];
  for (const r of results ?? []) {
    const v = r.question_versions as unknown as { numeric_answer: number | null; numeric_tolerance: number | null; question_answers: Array<{ position: number; is_correct: boolean }> };
    const a = input.answers.find((x) => x.questionId === r.question_id);
    const aq: AnsweredQuestion = {
      question_id: r.question_id, points: r.points, correct_positions: v.question_answers.filter((x) => x.is_correct).map((x) => x.position), selected_positions: a?.selected ?? [], marked_unsure: a?.unsure ?? false,
      ...(v.numeric_answer !== null ? { numeric: { expected: Number(v.numeric_answer), tolerance: Number(v.numeric_tolerance ?? 0), given: a?.numericAnswer ?? null } } : {}),
    };
    answered.push(aq);
    const score = scoreExam({ ...rules, questions_total: 1, basic_questions: 1, class_specific_questions: 0 }, [aq]);
    const isCorrect = score.correct_count === 1;
    updates.push(db.from("exam_results").update({ selected_positions: aq.selected_positions, is_correct: isCorrect, marked_unsure: aq.marked_unsure ?? false, response_ms: a?.responseMs ?? null }).eq("id", r.id));
    attemptRows.push({ tenant_id: ctx.tenantId, student_id: ctx.student.id, question_id: r.question_id, question_version_id: r.question_version_id, exam_simulation_id: sim.id, client_attempt_id: crypto.randomUUID(), selected_positions: aq.selected_positions, numeric_answer: a?.numericAnswer ?? null, is_correct: isCorrect, points: r.points, confidence: aq.marked_unsure ? 1 : null, response_ms: a?.responseMs ?? null });
  }
  const started = new Date(sim.started_at).getTime();
  const durationSeconds = Math.round((Date.now() - started) / 1000);
  const timeLimitExceeded = sim.time_limit_seconds !== null && durationSeconds > sim.time_limit_seconds + 30;
  const score = scoreExam(rules, answered, { timeLimitExceeded });
  await Promise.all(updates);
  await db.from("student_question_attempts").insert(attemptRows);
  // Analyse: Fehlercluster aus den letzten Versuchen inkl. dieser Prüfung
  const locale = ctx.student.preferred_locale;
  const [pool, topics] = await Promise.all([loadQuestionPool(db, ctx.license.license_code, ctx.licenseInfo.base_class, locale), loadTopics(db, locale)]);
  const { data: recentAttempts } = await db.from("student_question_attempts").select("question_id, is_correct, answered_at, confidence, response_ms").eq("student_id", ctx.student.id).order("answered_at", { ascending: false }).limit(300);
  const analysis = analyzeErrors((recentAttempts ?? []).map((a) => ({ question_id: a.question_id, is_correct: a.is_correct, answered_at: a.answered_at, confidence: a.confidence, response_ms: a.response_ms })), new Map(pool.map((q) => [q.id, toMeta(q)])), topics.map((t) => ({ id: t.id, name: t.name })));
  await db.from("exam_simulations").update({
    status: "submitted", submitted_at: new Date().toISOString(), passed: score.passed, error_points: score.error_points, correct_count: score.correct_count, wrong_count: score.wrong_count,
    unsure_count: score.unsure_count, duration_seconds: durationSeconds, fail_reasons: score.fail_reasons, analysis: analysis as unknown as Json,
  }).eq("id", sim.id);
  await db.from("xp_events").insert({ tenant_id: ctx.tenantId, student_id: ctx.student.id, kind: score.passed ? "exam_simulation_passed" : "exam_simulation_completed", xp: score.passed ? XP_TABLE.exam_simulation_passed : XP_TABLE.exam_simulation_completed, ref_id: sim.id, client_event_id: crypto.randomUUID() });
  const states = await loadStates(db, ctx.student.id);
  const overview = buildLearningOverview(pool, states, topics);
  const trainingStatus = await loadTrainingStatus(ctx);
  await computeAndStoreReadiness(db, ctx.tenantId, ctx.student.id, ctx.license.id, overview, rules.max_error_points, trainingStatus.practicalPercent);
  revalidatePath("/heute");
  revalidatePath("/lernen");
  return { id: sim.id };
}
