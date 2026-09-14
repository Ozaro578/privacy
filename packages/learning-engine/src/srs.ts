/**
 * Adaptives Lernsystem: SM-2-Variante mit Sicherheitsangabe und Antwortzeit.
 * Der Zustand entspricht public.student_question_state.
 */
export interface QuestionState {
  attempts: number;
  correct: number;
  consecutive_correct: number;
  last_correct: boolean | null;
  last_answered_at: string | null;
  last_confidence: number | null;
  avg_response_ms: number | null;
  ease: number;
  interval_days: number;
  due_at: string;
  mastery: number;
}

export interface ReviewInput {
  correct: boolean;
  /** 1 unsicher, 2 mittel, 3 sicher (optional) */
  confidence?: 1 | 2 | 3 | null;
  responseMs?: number | null;
  /** Fehlerpunkte der Frage, gewichtet die Mastery-Strafe */
  points?: number;
  now?: Date;
}

export const initialQuestionState = (now = new Date()): QuestionState => ({
  attempts: 0, correct: 0, consecutive_correct: 0, last_correct: null, last_answered_at: null, last_confidence: null,
  avg_response_ms: null, ease: 2.5, interval_days: 0, due_at: now.toISOString(), mastery: 0,
});

const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
const MINUTE = 60_000;
const DAY = 86_400_000;

function clamp(v: number, lo: number, hi: number): number { return Math.min(hi, Math.max(lo, v)); }

/** Qualität 0-5 wie bei SM-2, abgeleitet aus Richtigkeit, Sicherheit und Antwortzeit. */
export function answerQuality(input: ReviewInput): number {
  if (!input.correct) return input.confidence === 3 ? 0 : 1; // sicher und falsch ist das schlechteste Signal
  const conf = input.confidence ?? 2;
  let q = conf === 3 ? 5 : conf === 2 ? 4 : 3;
  if (input.responseMs != null && input.responseMs > 60_000) q = Math.max(3, q - 1);
  return q;
}

/** Berechnet den neuen Zustand nach einer Antwort. Reine Funktion, damit Offline-Sync deterministisch nachrechnen kann. */
export function reviewQuestion(state: QuestionState, input: ReviewInput): QuestionState {
  const now = input.now ?? new Date();
  const q = answerQuality(input);
  const attempts = state.attempts + 1;
  const correct = state.correct + (input.correct ? 1 : 0);
  const consecutive = input.correct ? state.consecutive_correct + 1 : 0;
  let ease = state.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  ease = clamp(ease, MIN_EASE, MAX_EASE);
  let intervalDays: number;
  let dueMs: number;
  if (!input.correct) {
    intervalDays = 0;
    // mehrfach falsch: sehr bald erneut zeigen (10 Minuten), einmal falsch: in der nächsten Session (4 Stunden)
    dueMs = consecutive === 0 && state.last_correct === false ? 10 * MINUTE : 4 * 60 * MINUTE;
  } else if (consecutive === 1) {
    intervalDays = 1; dueMs = DAY;
  } else if (consecutive === 2) {
    intervalDays = 3; dueMs = 3 * DAY;
  } else {
    intervalDays = Math.round(state.interval_days * ease * 10) / 10;
    if (intervalDays < 6) intervalDays = 6;
    dueMs = intervalDays * DAY;
  }
  if (input.correct && (input.confidence === 1)) { intervalDays = Math.max(1, intervalDays / 2); dueMs = Math.max(DAY, dueMs / 2); }
  const avgResponse = input.responseMs == null ? state.avg_response_ms
    : state.avg_response_ms == null ? input.responseMs : Math.round(state.avg_response_ms * 0.7 + input.responseMs * 0.3);
  const mastery = computeMastery({ attempts, correct, consecutive, quality: q, previous: state.mastery, points: input.points ?? 3 });
  return {
    attempts, correct, consecutive_correct: consecutive, last_correct: input.correct, last_answered_at: now.toISOString(),
    last_confidence: input.confidence ?? null, avg_response_ms: avgResponse, ease, interval_days: intervalDays,
    due_at: new Date(now.getTime() + dueMs).toISOString(), mastery,
  };
}

/**
 * Mastery 0..1: exponentiell geglättete Qualität, mit Bonus für Serien richtiger Antworten und Malus je Fehlerpunkt.
 * Eine Frage gilt ab ~0.8 als sicher beherrscht.
 */
export function computeMastery(p: { attempts: number; correct: number; consecutive: number; quality: number; previous: number; points: number }): number {
  const signal = p.quality / 5;
  const alpha = p.attempts <= 2 ? 0.6 : 0.35;
  let m = p.previous * (1 - alpha) + signal * alpha;
  if (p.consecutive >= 3) m = Math.min(1, m + 0.05 * Math.min(p.consecutive - 2, 3));
  if (p.quality <= 1) m = Math.max(0, m - 0.05 * Math.max(0, p.points - 2));
  return Math.round(clamp(m, 0, 1) * 1000) / 1000;
}

export function isDue(state: QuestionState, now = new Date()): boolean {
  return new Date(state.due_at).getTime() <= now.getTime();
}
