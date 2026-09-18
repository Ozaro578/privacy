import "server-only";
import { computeReadiness, type ReadinessResult } from "@fahrpilot/learning-engine";
import type { Db } from "./student";
import type { LearningOverview } from "./learning";

/** Berechnet die Prüfungsreife aus Simulationen, Mastery, Aktivität und speichert einen Snapshot (max. einer pro Stunde). */
export async function computeAndStoreReadiness(db: Db, writer: Db, tenantId: string, studentId: string, studentLicenseId: string, overview: LearningOverview, maxErrorPoints: number, practicalPercent: number | null): Promise<ReadinessResult> {
  const since14 = new Date(Date.now() - 14 * 86_400_000).toISOString();
  const since7 = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [{ data: sims }, { data: sessions }, { data: prevSnapshot }] = await Promise.all([
    db.from("exam_simulations").select("passed, error_points, submitted_at").eq("student_license_id", studentLicenseId).eq("status", "submitted").order("submitted_at", { ascending: false }).limit(20),
    db.from("learning_sessions").select("started_at, question_count, correct_count").eq("student_id", studentId).gte("started_at", since14).order("started_at", { ascending: false }).limit(60),
    db.from("readiness_snapshots").select("factors, computed_at").eq("student_license_id", studentLicenseId).lte("computed_at", since7).order("computed_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const activeDays = new Set((sessions ?? []).map((s) => s.started_at.slice(0, 10))).size;
  const recentAccuracy = (sessions ?? []).filter((s) => s.question_count >= 5).map((s) => s.correct_count / s.question_count);
  const prevMastery = (prevSnapshot?.factors as { mastery_value?: number } | null)?.mastery_value ?? overview.overallMastery;
  const weakShare = overview.topics.length ? overview.topics.filter((t) => t.weak).length / overview.topics.length : 0;
  const coverage = overview.topics.length ? overview.topics.filter((t) => t.coverage >= 0.5).length / overview.topics.length : 0;
  const result = computeReadiness({
    simulations: (sims ?? []).filter((s) => s.passed !== null).map((s) => ({ passed: !!s.passed, error_points: s.error_points ?? 0, submitted_at: s.submitted_at ?? "" })),
    overallMastery: overview.overallMastery, topicCoverage: coverage, weakTopicShare: weakShare,
    dueShare: overview.answeredQuestions ? overview.dueCount / overview.answeredQuestions : 0,
    activeDaysLast14: activeDays, masteryDelta7d: overview.overallMastery - prevMastery, recentAccuracy, maxErrorPoints,
  });
  const overall = practicalPercent === null ? result.score : Math.round(result.score * 0.6 + practicalPercent * 0.4);
  const { data: last } = await db.from("readiness_snapshots").select("computed_at").eq("student_license_id", studentLicenseId).order("computed_at", { ascending: false }).limit(1).maybeSingle();
  if (!last || Date.now() - new Date(last.computed_at).getTime() > 3_600_000) {
    await writer.from("readiness_snapshots").insert({
      tenant_id: tenantId, student_license_id: studentLicenseId, theory_score: result.score, practical_score: practicalPercent, overall_score: overall,
      factors: { ...Object.fromEntries(result.factors.map((f) => [f.key, { score: f.score, detail: f.detail }])), mastery_value: overview.overallMastery, band: result.band }, engine_version: result.engine_version,
    });
  }
  return result;
}
