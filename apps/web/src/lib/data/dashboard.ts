import "server-only";
import { planToday, type TodayItem } from "@fahrpilot/learning-engine";
import { parseRange } from "@/components/ui";
import type { StudentContext } from "./student";
import { buildLearningOverview, loadQuestionPool, loadStates, loadTopics, type LearningOverview } from "./learning";
import { computeAndStoreReadiness } from "./readiness";
import { loadTrainingStatus } from "./training";

export interface DashboardData {
  overview: LearningOverview;
  readinessScore: number | null;
  readinessBand: string | null;
  readinessFactors: Array<{ key: string; label: string; detail: string; score: number }>;
  theoryPercent: number;
  practicalPercent: number | null;
  nextLesson: { id: string; start: string; end: string; instructor: string; kind: string } | null;
  nextTheoryClass: { id: string; start: string; title: string } | null;
  missingDocuments: Array<{ id: string; title: string }>;
  openInvoiceCents: number;
  unreadMessages: number;
  unreadNotifications: Array<{ id: string; title: string; body: string; created_at: string }>;
  streak: { current_days: number; longest_days: number; total_xp: number; level: number } | null;
  todayGoal: { answered: number; target: number; achieved: boolean } | null;
  learnedToday: boolean;
  today: TodayItem[];
  training: Awaited<ReturnType<typeof loadTrainingStatus>>;
  exams: { theoryAt: string | null; practicalAt: string | null; theoryStatus: string; practicalStatus: string };
  weaknessStatement: string | null;
}

export async function loadDashboard(ctx: StudentContext): Promise<DashboardData> {
  const { db, student, license } = ctx;
  const locale = student.preferred_locale;
  const nowIso = new Date().toISOString();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: ctx.school.timezone });
  const [pool, states, topics, training, { data: nextLessonRows }, { data: nextClassRows }, { data: docs }, { data: invoices }, { data: notifications }, { data: streak }, { data: goal }, { data: theoryExam }, { data: practicalExam }, { data: recentRatings }, { data: unreadMsgRows }] = await Promise.all([
    loadQuestionPool(db, license.license_code, ctx.licenseInfo.base_class, locale), loadStates(db, student.id), loadTopics(db, locale), loadTrainingStatus(ctx),
    db.from("lessons").select("id, period, kind, instructors(display_name)").eq("student_id", student.id).in("status", ["booked", "confirmed"]).gte("period", `[${nowIso},)`).order("period").limit(1),
    db.from("theory_classes").select("id, period, title, attendance!inner(status)").eq("attendance.student_id", student.id).gte("period", `[${nowIso},)`).order("period").limit(1),
    db.from("documents").select("id, title, status, requirement_code").eq("student_id", student.id).in("status", ["missing", "rejected"]),
    db.from("invoices").select("gross_cents, paid_cents, status").eq("student_id", student.id).in("status", ["issued", "partially_paid", "overdue"]),
    db.from("notifications").select("id, title, body, created_at").eq("user_id", ctx.userId).is("read_at", null).order("created_at", { ascending: false }).limit(5),
    db.from("student_streaks").select("*").eq("student_id", student.id).maybeSingle(),
    db.from("daily_goals").select("*").eq("student_id", student.id).eq("goal_date", today).maybeSingle(),
    db.from("theory_exams").select("scheduled_at, status").eq("student_license_id", license.id).order("attempt_no", { ascending: false }).limit(1).maybeSingle(),
    db.from("practical_exams").select("scheduled_at, status").eq("student_license_id", license.id).order("attempt_no", { ascending: false }).limit(1).maybeSingle(),
    db.from("student_skill_scores").select("skill_code, rating, rated_at").eq("student_license_id", license.id).lte("rating", 2).gte("rated_at", new Date(Date.now() - 14 * 86_400_000).toISOString()).order("rated_at", { ascending: false }).limit(5),
    db.from("conversation_participants").select("conversation_id, last_read_at, conversations!inner(last_message_at)").eq("user_id", ctx.userId),
  ]);
  const overview = buildLearningOverview(pool, states, topics);
  const maxErr = ctx.rules.examTheory?.rules.max_error_points ?? 10;
  const readiness = await computeAndStoreReadiness(db, ctx.tenantId, student.id, license.id, overview, maxErr, training.practicalPercent);
  const nl = nextLessonRows?.[0];
  const nextLesson = nl ? { id: nl.id, ...parseRange(nl.period as unknown as string), instructor: (nl.instructors as unknown as { display_name: string } | null)?.display_name ?? "", kind: nl.kind } : null;
  const nc = nextClassRows?.[0];
  const nextTheoryClass = nc ? { id: nc.id, start: parseRange(nc.period as unknown as string).start, title: nc.title } : null;
  const openInvoiceCents = (invoices ?? []).reduce((s, i) => s + Math.max(0, i.gross_cents - i.paid_cents), 0);
  const unread = (unreadMsgRows ?? []).filter((r) => { const last = (r.conversations as unknown as { last_message_at: string | null } | null)?.last_message_at; return last && (!r.last_read_at || last > r.last_read_at); }).length;
  const learnedToday = (goal?.answered ?? 0) > 0;
  // Praxis -> Theorie: schwache Fahrkompetenz (Bewertung <= 2) auf gekoppeltes Thema abbilden
  const flagged = (recentRatings ?? []).map((r) => { const t = topics.find((x) => x.practical_skill_code === r.skill_code); return { skill_code: r.skill_code, topic_id: t?.id ?? null, topic_name: t?.name ?? null, rated_at: r.rated_at }; });
  const weakest = overview.topics.filter((t) => t.weak)[0] ?? null;
  const theoryPercent = Math.round(((training.theory?.percent ?? 0) * 0.4) + (overview.overallMastery * 100 * 0.6));
  const todayItems = planToday({
    now: new Date(), dueQuestions: overview.dueCount, weakestTopic: weakest ? { id: weakest.id, name: weakest.name } : null, instructorFlaggedSkills: flagged,
    nextLesson: nextLesson ? { starts_at: nextLesson.start, instructor_name: nextLesson.instructor } : null, nextTheoryClass: nextTheoryClass ? { starts_at: nextTheoryClass.start, title: nextTheoryClass.title } : null,
    missingDocuments: (docs ?? []).map((d) => d.title), theoryExamAt: theoryExam?.scheduled_at ?? null, practicalExamAt: practicalExam?.scheduled_at ?? null, openInvoiceCents,
    dailyGoalDone: goal?.achieved ?? false, learnedToday, streakDays: streak?.current_days ?? 0, readinessScore: readiness.score,
  });
  return {
    overview, readinessScore: readiness.score, readinessBand: readiness.band, readinessFactors: readiness.factors.map((f) => ({ key: f.key, label: f.label, detail: f.detail, score: f.score })),
    theoryPercent, practicalPercent: training.practicalPercent, nextLesson, nextTheoryClass, missingDocuments: (docs ?? []).map((d) => ({ id: d.id, title: d.title })), openInvoiceCents, unreadMessages: unread,
    unreadNotifications: notifications ?? [], streak, todayGoal: goal ? { answered: goal.answered, target: goal.target_questions, achieved: goal.achieved } : null, learnedToday, today: todayItems, training,
    exams: { theoryAt: theoryExam?.scheduled_at ?? null, practicalAt: practicalExam?.scheduled_at ?? null, theoryStatus: license.theory_exam_status, practicalStatus: license.practical_exam_status },
    weaknessStatement: weakest ? `Persönliche Schwachstelle: ${weakest.name} (${Math.round(weakest.mastery * 100)} % Mastery)` : null,
  };
}
