"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { initialQuestionState, reviewQuestion, selectQuestions, updateStreak, XP_TABLE, levelForXp, newlyEarnedBadges, type LearningMode, type BadgeCriteria } from "@fahrpilot/learning-engine";
import { isAnswerCorrect } from "@fahrpilot/rules-engine";
import { getStudentContext } from "@/lib/data/student";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { buildLearningOverview, loadQuestionPool, loadStates, loadTopics, toMeta, type QuestionWithVersion } from "@/lib/data/learning";

const ModeSchema = z.enum(["topic", "question_list", "exam", "random", "hard", "wrong", "bookmarked", "unseen", "review", "weakness", "daily_goal", "generated", "ladder", "signs"]);

export interface SessionQuestion {
  id: string;
  topicName: string;
  points: number;
  kind: string;
  source: string;
  text: string;
  mediaPath: string | null;
  mediaAlt: string | null;
  mediaCredit: string | null;
  answers: Array<{ position: number; text: string }>;
  numeric: boolean;
}

export interface StartedSession {
  sessionId: string;
  clientSessionId: string;
  mode: LearningMode;
  challenge: boolean;
  questions: SessionQuestion[];
}

/** Startet eine Lernsession und wählt Fragen adaptiv aus (fällige und schwache zuerst, neue eingestreut). */
export async function startLearningSession(input: { mode: LearningMode; topicId?: string; limit?: number; clientSessionId?: string; challenge?: boolean }): Promise<StartedSession> {
  const mode = ModeSchema.parse(input.mode);
  const limit = Math.min(Math.max(input.limit ?? 10, 1), 50);
  const ctx = await getStudentContext();
  const locale = ctx.student.preferred_locale;
  const [pool, states, topics] = await Promise.all([loadQuestionPool(ctx.db, ctx.license.license_code, ctx.licenseInfo.base_class, locale), loadStates(ctx.db, ctx.student.id), loadTopics(ctx.db, locale)]);
  const overview = buildLearningOverview(pool, states, topics);
  const bookmarked = new Set([...states.entries()].filter(([, s]) => s.bookmarked).map(([id]) => id));
  const selected = selectQuestions(pool.map((q) => toMeta(q)), states, { mode, limit, topicMastery: overview.topics, bookmarked, ...(input.topicId ? { topicId: input.topicId } : {}) });
  if (selected.length === 0) throw new Error("Für diesen Modus gibt es aktuell keine Fragen.");
  const clientSessionId = input.clientSessionId ?? crypto.randomUUID();
  const admin = createSupabaseAdminClient();
  const { data: session, error } = await admin.from("learning_sessions").upsert({ tenant_id: ctx.tenantId, student_id: ctx.student.id, student_license_id: ctx.license.id, mode, topic_id: input.topicId ?? null, client_session_id: clientSessionId, device: "web", is_challenge: input.challenge === true }, { onConflict: "student_id,client_session_id" }).select("id").single();
  if (error || !session) throw new Error("Session konnte nicht gestartet werden");
  const byId = new Map(pool.map((q) => [q.id, q]));
  const topicName = (id: string) => topics.find((t) => t.id === id)?.name ?? "";
  return {
    sessionId: session.id, clientSessionId, mode, challenge: input.challenge === true,
    questions: selected.map((m) => byId.get(m.id)!).map((q) => ({
      id: q.id, topicName: topicName(q.topic_id), points: q.points, kind: q.question_kind, source: q.source, text: q.version.text, mediaPath: q.version.media_path, mediaAlt: q.version.media_alt, mediaCredit: q.version.media_credit,
      answers: q.version.answers.map((a) => ({ position: a.position, text: a.text })), numeric: q.version.numeric_answer !== null,
    })),
  };
}

const AttemptSchema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.string().uuid(),
  clientAttemptId: z.string().uuid(),
  selected: z.array(z.number().int().min(1).max(6)).default([]),
  numericAnswer: z.number().nullable().default(null),
  confidence: z.union([z.literal(1), z.literal(2), z.literal(3)]).nullable().default(null),
  responseMs: z.number().int().min(0).max(3_600_000).nullable().default(null),
});

export interface AttemptResult {
  correct: boolean;
  correctPositions: number[];
  explanation: string | null;
  mnemonic: string | null;
  legalReference: string | null;
  legalBasisDate: string | null;
  answerExplanations: Array<{ position: number; is_correct: boolean; explanation: string | null }>;
  numericAnswer: number | null;
  mastery: number;
  nextDueAt: string;
  xpGained: number;
  newBadges: string[];
}

/** Bewertet eine Antwort serverseitig, aktualisiert Spaced-Repetition-Zustand, Themen-Mastery, XP, Serie und Tagesziel. Idempotent je clientAttemptId. */
export async function recordAttempt(raw: z.input<typeof AttemptSchema>): Promise<AttemptResult> {
  const input = AttemptSchema.parse(raw);
  const ctx = await getStudentContext();
  const { db } = ctx;
  // Berechnete Ergebnisse schreibt nur der Server (RLS erlaubt Schülern kein direktes Schreiben)
  const admin = createSupabaseAdminClient();
  const { data: q, error } = await db.from("theory_questions").select("id, topic_id, points, current_version_id, question_versions!theory_questions_current_version_fk(id, explanation, mnemonic, legal_reference, legal_basis_date, numeric_answer, numeric_tolerance, question_answers(position, is_correct, explanation))").eq("id", input.questionId).single();
  if (error || !q) throw new Error("Frage nicht gefunden");
  const v = q.question_versions as unknown as QuestionWithVersion["version"] & { question_answers: Array<{ position: number; is_correct: boolean; explanation: string | null }> };
  const correctPositions = v.question_answers.filter((a) => a.is_correct).map((a) => a.position);
  const correct = isAnswerCorrect({
    question_id: q.id, points: q.points, correct_positions: correctPositions, selected_positions: input.selected,
    ...(v.numeric_answer !== null ? { numeric: { expected: Number(v.numeric_answer), tolerance: Number(v.numeric_tolerance ?? 0), given: input.numericAnswer } } : {}),
  });
  // Idempotenz: bereits verbuchter Versuch wird nicht doppelt gezählt
  const { data: existing } = await db.from("student_question_attempts").select("id").eq("student_id", ctx.student.id).eq("client_attempt_id", input.clientAttemptId).maybeSingle();
  const { data: stateRow } = await db.from("student_question_state").select("*").eq("student_id", ctx.student.id).eq("question_id", q.id).maybeSingle();
  const prev = stateRow ? { attempts: stateRow.attempts, correct: stateRow.correct, consecutive_correct: stateRow.consecutive_correct, last_correct: stateRow.last_correct, last_answered_at: stateRow.last_answered_at, last_confidence: stateRow.last_confidence, avg_response_ms: stateRow.avg_response_ms, ease: Number(stateRow.ease), interval_days: Number(stateRow.interval_days), due_at: stateRow.due_at, mastery: Number(stateRow.mastery) } : initialQuestionState();
  let xpGained = 0;
  const newBadges: string[] = [];
  let next = prev;
  if (!existing) {
    next = reviewQuestion(prev, { correct, confidence: input.confidence, responseMs: input.responseMs, points: q.points });
    await Promise.all([
      admin.from("student_question_attempts").insert({ tenant_id: ctx.tenantId, student_id: ctx.student.id, question_id: q.id, question_version_id: v.id, session_id: input.sessionId, client_attempt_id: input.clientAttemptId, selected_positions: input.selected, numeric_answer: input.numericAnswer, is_correct: correct, points: q.points, confidence: input.confidence, response_ms: input.responseMs }),
      admin.from("student_question_state").upsert({ tenant_id: ctx.tenantId, student_id: ctx.student.id, question_id: q.id, ...next, bookmarked: stateRow?.bookmarked ?? false }, { onConflict: "student_id,question_id" }),
    ]);
    const { data: sess } = await admin.from("learning_sessions").select("question_count, correct_count").eq("id", input.sessionId).eq("student_id", ctx.student.id).maybeSingle();
    if (sess) await admin.from("learning_sessions").update({ question_count: sess.question_count + 1, correct_count: sess.correct_count + (correct ? 1 : 0) }).eq("id", input.sessionId);
    if (correct) {
      xpGained = q.points >= 4 ? XP_TABLE.question_correct_hard : XP_TABLE.question_correct;
      await admin.from("xp_events").insert({ tenant_id: ctx.tenantId, student_id: ctx.student.id, kind: "question_correct", xp: xpGained, ref_id: q.id, client_event_id: input.clientAttemptId });
    }
    const today = new Date().toLocaleDateString("en-CA", { timeZone: ctx.school.timezone });
    const { data: streak } = await db.from("student_streaks").select("*").eq("student_id", ctx.student.id).maybeSingle();
    const updated = updateStreak(streak ?? { current_days: 0, longest_days: 0, last_active_date: null }, today);
    const totalXp = (streak?.total_xp ?? 0) + xpGained;
    await admin.from("student_streaks").upsert({ tenant_id: ctx.tenantId, student_id: ctx.student.id, ...updated, total_xp: totalXp, level: levelForXp(totalXp).level, updated_at: new Date().toISOString() }, { onConflict: "student_id" });
    const { data: goal } = await db.from("daily_goals").select("*").eq("student_id", ctx.student.id).eq("goal_date", today).maybeSingle();
    const answered = (goal?.answered ?? 0) + 1;
    await admin.from("daily_goals").upsert({ tenant_id: ctx.tenantId, student_id: ctx.student.id, goal_date: today, target_questions: goal?.target_questions ?? 20, answered, target_minutes: goal?.target_minutes ?? 15, minutes: goal?.minutes ?? 0, achieved: answered >= (goal?.target_questions ?? 20) }, { onConflict: "student_id,goal_date" });
    // Abzeichen
    const [{ data: badges }, { data: owned }, { data: correctCount }, { data: passedSims }] = await Promise.all([
      db.from("badges").select("code, criteria"), db.from("student_badges").select("badge_code").eq("student_id", ctx.student.id),
      db.from("student_question_attempts").select("id", { count: "exact", head: true }).eq("student_id", ctx.student.id).eq("is_correct", true),
      db.from("exam_simulations").select("id", { count: "exact", head: true }).eq("student_id", ctx.student.id).eq("passed", true),
    ]);
    void correctCount; void passedSims;
    const { count: correctTotal } = await db.from("student_question_attempts").select("id", { count: "exact", head: true }).eq("student_id", ctx.student.id).eq("is_correct", true);
    const { count: simsPassed } = await db.from("exam_simulations").select("id", { count: "exact", head: true }).eq("student_id", ctx.student.id).eq("passed", true);
    const { data: tm } = await db.from("student_topic_mastery").select("topic_id, mastery, topics(code)").eq("student_id", ctx.student.id);
    const topicMasteryMap = Object.fromEntries((tm ?? []).map((t) => [((t.topics as unknown as { code: string } | null)?.code ?? t.topic_id), Number(t.mastery)]));
    const earned = newlyEarnedBadges((badges ?? []).map((b) => ({ code: b.code, criteria: b.criteria as unknown as BadgeCriteria })), new Set((owned ?? []).map((o) => o.badge_code)), { streak_days: updated.current_days, correct_answers: correctTotal ?? 0, exam_simulations_passed: simsPassed ?? 0, topic_mastery: topicMasteryMap });
    if (earned.length) {
      await admin.from("student_badges").insert(earned.map((code) => ({ tenant_id: ctx.tenantId, student_id: ctx.student.id, badge_code: code })));
      newBadges.push(...earned);
    }
    // Themen-Mastery aktualisieren (nur das betroffene Thema)
    const [pool, states] = await Promise.all([loadQuestionPool(db, ctx.license.license_code, ctx.licenseInfo.base_class, ctx.student.preferred_locale), loadStates(db, ctx.student.id)]);
    const topics = await loadTopics(db, ctx.student.preferred_locale);
    const ov = buildLearningOverview(pool, states, topics);
    const t = ov.topics.find((x) => x.id === q.topic_id);
    if (t) await admin.from("student_topic_mastery").upsert({ tenant_id: ctx.tenantId, student_id: ctx.student.id, topic_id: t.id, mastery: t.mastery, coverage: t.coverage, attempts: t.attempts, correct: t.correct, updated_at: new Date().toISOString() }, { onConflict: "student_id,topic_id" });
  }
  return {
    correct, correctPositions, explanation: v.explanation, mnemonic: v.mnemonic, legalReference: v.legal_reference, legalBasisDate: v.legal_basis_date,
    answerExplanations: v.question_answers.map((a) => ({ position: a.position, is_correct: a.is_correct, explanation: a.explanation })),
    numericAnswer: v.numeric_answer === null ? null : Number(v.numeric_answer), mastery: next.mastery, nextDueAt: next.due_at, xpGained, newBadges,
  };
}

export interface SessionFinishResult { challengeCompleted: boolean; bonusXp: number }

/** Beendet eine Session; ab 5 Fragen gibt es Session-XP. Eine Tages-Challenge (10 Fragen, mindestens 80 % richtig) bringt einmal am Tag Bonus-XP. */
export async function finishLearningSession(sessionId: string): Promise<SessionFinishResult> {
  const ctx = await getStudentContext();
  const admin = createSupabaseAdminClient();
  await admin.from("learning_sessions").update({ ended_at: new Date().toISOString() }).eq("id", sessionId).eq("student_id", ctx.student.id);
  const { data: s } = await admin.from("learning_sessions").select("question_count, correct_count, is_challenge").eq("id", sessionId).eq("student_id", ctx.student.id).single();
  if ((s?.question_count ?? 0) >= 5) {
    await admin.from("xp_events").insert({ tenant_id: ctx.tenantId, student_id: ctx.student.id, kind: "session_completed", xp: XP_TABLE.session_completed, ref_id: sessionId, client_event_id: crypto.randomUUID() });
  }
  let challengeCompleted = false, bonusXp = 0;
  if (s?.is_challenge && s.question_count >= 10 && s.correct_count / s.question_count >= 0.8) {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: ctx.school.timezone });
    const { data: goal } = await ctx.db.from("daily_goals").select("challenge_done, answered, target_questions, target_minutes, minutes, achieved").eq("student_id", ctx.student.id).eq("goal_date", today).maybeSingle();
    if (!goal?.challenge_done) {
      bonusXp = XP_TABLE.daily_goal;
      await admin.from("daily_goals").upsert({ tenant_id: ctx.tenantId, student_id: ctx.student.id, goal_date: today, challenge_done: true, answered: goal?.answered ?? 0, target_questions: goal?.target_questions ?? 20, target_minutes: goal?.target_minutes ?? 15, minutes: goal?.minutes ?? 0, achieved: goal?.achieved ?? false }, { onConflict: "student_id,goal_date" });
      await admin.from("xp_events").insert({ tenant_id: ctx.tenantId, student_id: ctx.student.id, kind: "daily_goal", xp: bonusXp, ref_id: sessionId, client_event_id: crypto.randomUUID() });
      const { data: streak } = await ctx.db.from("student_streaks").select("total_xp").eq("student_id", ctx.student.id).maybeSingle();
      const totalXp = (streak?.total_xp ?? 0) + bonusXp;
      await admin.from("student_streaks").update({ total_xp: totalXp, level: levelForXp(totalXp).level }).eq("student_id", ctx.student.id);
    }
    challengeCompleted = true;
  }
  revalidatePath("/heute");
  revalidatePath("/lernen");
  return { challengeCompleted, bonusXp };
}

export async function toggleBookmark(questionId: string): Promise<boolean> {
  const ctx = await getStudentContext();
  const { data: row } = await ctx.db.from("student_question_state").select("bookmarked").eq("student_id", ctx.student.id).eq("question_id", questionId).maybeSingle();
  const next = !(row?.bookmarked ?? false);
  const { error } = await ctx.db.rpc("set_question_bookmark", { p_question_id: questionId, p_bookmarked: next });
  if (error) throw new Error(error.message);
  return next;
}
