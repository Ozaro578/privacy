export type XpEventKind = "question_correct" | "question_correct_hard" | "session_completed" | "daily_goal" | "exam_simulation_passed" | "exam_simulation_completed" | "lesson_completed" | "streak_day" | "topic_mastered";

export const XP_TABLE: Record<XpEventKind, number> = {
  question_correct: 2, question_correct_hard: 4, session_completed: 10, daily_goal: 20, exam_simulation_completed: 15,
  exam_simulation_passed: 40, lesson_completed: 25, streak_day: 5, topic_mastered: 50,
};

/** Level steigt quadratisch: Level n benötigt 100 * (n-1)^2 XP. */
export function levelForXp(xp: number): { level: number; next_level_xp: number; progress: number } {
  const level = Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
  const current = 100 * (level - 1) ** 2, next = 100 * level ** 2;
  return { level, next_level_xp: next, progress: Math.round(((xp - current) / (next - current)) * 100) };
}

export interface StreakState { current_days: number; longest_days: number; last_active_date: string | null; }

/** Aktualisiert die Lernserie anhand des Kalendertags (Europe/Berlin) der Aktivität. */
export function updateStreak(state: StreakState, activityDate: string): StreakState {
  if (state.last_active_date === activityDate) return state;
  const prev = state.last_active_date ? new Date(state.last_active_date) : null;
  const cur = new Date(activityDate);
  const diffDays = prev ? Math.round((cur.getTime() - prev.getTime()) / 86_400_000) : null;
  const current = diffDays === 1 ? state.current_days + 1 : 1;
  return { current_days: current, longest_days: Math.max(state.longest_days, current), last_active_date: activityDate };
}

export interface BadgeCriteria { type: "streak_days" | "correct_answers" | "exam_simulations_passed" | "topic_mastery"; value: number; topic?: string; }
export interface BadgeStats { streak_days: number; correct_answers: number; exam_simulations_passed: number; topic_mastery: Record<string, number>; }

export function badgeEarned(criteria: BadgeCriteria, stats: BadgeStats): boolean {
  switch (criteria.type) {
    case "streak_days": return stats.streak_days >= criteria.value;
    case "correct_answers": return stats.correct_answers >= criteria.value;
    case "exam_simulations_passed": return stats.exam_simulations_passed >= criteria.value;
    case "topic_mastery": return criteria.topic !== undefined && (stats.topic_mastery[criteria.topic] ?? 0) >= criteria.value;
  }
}

export function newlyEarnedBadges(badges: Array<{ code: string; criteria: BadgeCriteria }>, owned: Set<string>, stats: BadgeStats): string[] {
  return badges.filter((b) => !owned.has(b.code) && badgeEarned(b.criteria, stats)).map((b) => b.code);
}
