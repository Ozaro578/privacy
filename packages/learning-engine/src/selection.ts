import type { QuestionMeta, TopicMastery } from "./mastery";
import { isDue, type QuestionState } from "./srs";

export type LearningMode = "topic" | "question_list" | "exam" | "random" | "hard" | "wrong" | "bookmarked" | "unseen" | "review" | "weakness" | "daily_goal" | "generated";

export interface SelectionOptions {
  mode: LearningMode;
  limit: number;
  topicId?: string;
  bookmarked?: Set<string>;
  topicMastery?: TopicMastery[];
  now?: Date;
  random?: () => number;
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [arr[i], arr[j]] = [arr[j]!, arr[i]!]; }
  return arr;
}

/**
 * Wählt Fragen für einen Lernmodus. Fällige Wiederholungen und schwache Fragen erscheinen häufiger
 * (Spaced Repetition), nie beantwortete Fragen werden eingestreut, damit die Abdeckung wächst.
 */
export function selectQuestions(questions: QuestionMeta[], states: Map<string, QuestionState>, opts: SelectionOptions): QuestionMeta[] {
  const now = opts.now ?? new Date();
  const random = opts.random ?? Math.random;
  const st = (q: QuestionMeta) => states.get(q.id);
  const unseen = (q: QuestionMeta) => !st(q) || st(q)!.attempts === 0;
  let pool: QuestionMeta[];
  switch (opts.mode) {
    case "topic":
      pool = questions.filter((q) => q.topic_id === opts.topicId);
      break;
    case "wrong":
      pool = questions.filter((q) => (st(q)?.attempts ?? 0) > 0 && st(q)?.last_correct === false);
      break;
    case "hard":
      pool = questions.filter((q) => (q.difficulty ?? 0.5) >= 0.65 || ((st(q)?.attempts ?? 0) >= 2 && (st(q)?.mastery ?? 0) < 0.5));
      break;
    case "bookmarked":
      pool = questions.filter((q) => opts.bookmarked?.has(q.id));
      break;
    case "unseen":
      pool = questions.filter(unseen);
      break;
    case "review":
      pool = questions.filter((q) => st(q) && st(q)!.attempts > 0 && isDue(st(q)!, now));
      break;
    case "weakness": {
      const weakTopics = new Set((opts.topicMastery ?? []).filter((t) => t.weak).slice(0, 3).map((t) => t.topic_id));
      pool = questions.filter((q) => weakTopics.has(q.topic_id));
      break;
    }
    default:
      pool = questions;
  }
  if (opts.mode === "random") return shuffle(pool, random).slice(0, opts.limit);
  // Priorität: fällige/schwache zuerst, dann nie beantwortete, dann Rest; innerhalb der Gruppen gemischt
  const due = shuffle(pool.filter((q) => st(q) && st(q)!.attempts > 0 && isDue(st(q)!, now)), random).sort((a, b) => (st(a)!.mastery - st(b)!.mastery));
  const fresh = shuffle(pool.filter(unseen), random);
  const rest = shuffle(pool.filter((q) => !unseen(q) && !isDue(st(q)!, now)), random);
  const result: QuestionMeta[] = [];
  const seen = new Set<string>();
  const push = (q: QuestionMeta) => { if (!seen.has(q.id) && result.length < opts.limit) { seen.add(q.id); result.push(q); } };
  // Mischung: etwa 60 % fällig, 30 % neu, 10 % Auffrischung (bei Bedarf aufgefüllt)
  const dueTarget = Math.ceil(opts.limit * 0.6), freshTarget = Math.ceil(opts.limit * 0.3);
  due.slice(0, dueTarget).forEach(push);
  fresh.slice(0, freshTarget).forEach(push);
  rest.forEach(push);
  due.slice(dueTarget).forEach(push);
  fresh.slice(freshTarget).forEach(push);
  return result;
}
