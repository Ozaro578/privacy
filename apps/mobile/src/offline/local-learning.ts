import { initialQuestionState, reviewQuestion, selectQuestions, topicMastery, type LearningMode, type QuestionMeta, type QuestionState, type TopicMastery } from "@fahrpilot/learning-engine";
import { isAnswerCorrect } from "@fahrpilot/rules-engine";
import type { LocalQuestion, LocalQuestionState } from "./types";

/** Fragen für Klasse und Sprache aus dem lokalen Pool (globale Fragen ohne Klassenbindung zählen immer). */
export function filterPoolForLicense(pool: LocalQuestion[], licenseCode: string, baseClass: string | null, locale: string): LocalQuestion[] {
  const codes = [licenseCode, baseClass].filter((c): c is string => !!c);
  return pool.filter((q) => q.locale === locale && (q.license_codes.length === 0 || q.license_codes.some((c) => codes.includes(c))));
}

export function toMeta(q: LocalQuestion): QuestionMeta {
  return { id: q.id, topic_id: q.topic_id, points: q.points, difficulty: q.difficulty, tags: q.tags };
}

export function toEngineState(s: LocalQuestionState): QuestionState {
  return { attempts: s.attempts, correct: s.correct, consecutive_correct: s.consecutive_correct, last_correct: s.last_correct, last_answered_at: s.last_answered_at, last_confidence: s.last_confidence, avg_response_ms: s.avg_response_ms, ease: s.ease, interval_days: s.interval_days, due_at: s.due_at, mastery: s.mastery };
}

export function engineStates(states: Map<string, LocalQuestionState>): Map<string, QuestionState> {
  const out = new Map<string, QuestionState>();
  for (const [id, s] of states) out.set(id, toEngineState(s));
  return out;
}

export interface LocalSelectionOptions {
  mode: LearningMode;
  limit: number;
  topicId?: string;
  now?: Date;
  random?: () => number;
}

/** Wählt Fragen offline aus dem lokalen Pool: fällige und schwache zuerst, neue eingestreut (gleiche Logik wie der Server). */
export function selectLocalQuestions(pool: LocalQuestion[], states: Map<string, LocalQuestionState>, opts: LocalSelectionOptions): LocalQuestion[] {
  const meta = pool.map(toMeta);
  const es = engineStates(states);
  const bookmarked = new Set([...states.values()].filter((s) => s.bookmarked).map((s) => s.question_id));
  const tm: TopicMastery[] = topicMastery(meta, es);
  const selected = selectQuestions(meta, es, {
    mode: opts.mode, limit: opts.limit, bookmarked, topicMastery: tm,
    ...(opts.topicId ? { topicId: opts.topicId } : {}),
    ...(opts.now ? { now: opts.now } : {}),
    ...(opts.random ? { random: opts.random } : {}),
  });
  const byId = new Map(pool.map((q) => [q.id, q]));
  return selected.map((m) => byId.get(m.id)).filter((q): q is LocalQuestion => !!q);
}

/** Bewertet eine Antwort lokal, identisch zur Serverlogik (genau die richtigen Antworten, numerisch mit Toleranz). */
export function evaluateAnswer(q: LocalQuestion, selected: number[], numericAnswer: number | null): boolean {
  return isAnswerCorrect({
    question_id: q.id, points: q.points, correct_positions: q.answers.filter((a) => a.is_correct).map((a) => a.position), selected_positions: selected,
    ...(q.numeric_answer !== null ? { numeric: { expected: q.numeric_answer, tolerance: q.numeric_tolerance ?? 0, given: numericAnswer } } : {}),
  });
}

export interface LocalReviewInput {
  correct: boolean;
  confidence: 1 | 2 | 3 | null;
  responseMs: number | null;
  points: number;
  now?: Date;
}

/** Sofortiges Feedback offline: Spaced-Repetition-Zustand lokal fortschreiben (dirty, bis der Server bestätigt). */
export function applyLocalReview(questionId: string, previous: LocalQuestionState | undefined, input: LocalReviewInput): LocalQuestionState {
  const now = input.now ?? new Date();
  const base = previous ? toEngineState(previous) : initialQuestionState(now);
  const next = reviewQuestion(base, { correct: input.correct, confidence: input.confidence, responseMs: input.responseMs, points: input.points, now });
  return { ...next, question_id: questionId, bookmarked: previous?.bookmarked ?? false, row_version: previous?.row_version ?? 0, dirty: true };
}

export interface LocalOverview {
  total: number;
  answered: number;
  due: number;
  wrong: number;
  bookmarked: number;
  unseen: number;
  hard: number;
  overallMastery: number;
  topics: TopicMastery[];
}

export function localOverview(pool: LocalQuestion[], states: Map<string, LocalQuestionState>, now = new Date()): LocalOverview {
  const meta = pool.map(toMeta);
  const topics = topicMastery(meta, engineStates(states));
  let answered = 0, due = 0, wrong = 0, bookmarked = 0, hard = 0;
  for (const q of pool) {
    const s = states.get(q.id);
    if (s?.bookmarked) bookmarked++;
    if (q.difficulty >= 0.65 || ((s?.attempts ?? 0) >= 2 && (s?.mastery ?? 0) < 0.5)) hard++;
    if (!s || s.attempts === 0) continue;
    answered++;
    if (new Date(s.due_at).getTime() <= now.getTime()) due++;
    if (s.last_correct === false) wrong++;
  }
  const w = topics.reduce((s, t) => s + t.question_count, 0);
  const overall = w ? topics.reduce((s, t) => s + t.mastery * t.question_count, 0) / w : 0;
  return { total: pool.length, answered, due, wrong, bookmarked, unseen: pool.length - answered, hard, overallMastery: Math.round(overall * 1000) / 1000, topics };
}
