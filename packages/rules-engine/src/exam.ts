import type { ExamTheoryRules } from "./schemas";

export interface ExamQuestionCandidate {
  id: string;
  material_kind: "basic" | "class_specific";
  points: number;
  topic_id: string;
}

export interface ComposeOptions {
  /** deterministischer Zufall für Tests; Standard Math.random */
  random?: () => number;
  /** Fragen, die zuletzt in Simulationen vorkamen, werden nachrangig gezogen */
  recentlyUsed?: Set<string>;
  /** Themen möglichst gleichmäßig streuen */
  spreadTopics?: boolean;
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function pick(pool: ExamQuestionCandidate[], n: number, opts: Required<Pick<ComposeOptions, "random" | "spreadTopics">> & { recentlyUsed: Set<string> }): ExamQuestionCandidate[] {
  if (pool.length < n) throw new Error(`Nicht genügend Fragen im Katalog: ${pool.length} vorhanden, ${n} benötigt`);
  const fresh = shuffle(pool.filter((q) => !opts.recentlyUsed.has(q.id)), opts.random);
  const used = shuffle(pool.filter((q) => opts.recentlyUsed.has(q.id)), opts.random);
  const ordered = fresh.concat(used);
  if (!opts.spreadTopics) return ordered.slice(0, n);
  // Round-Robin über Themen, damit nicht zehn Vorfahrtsfragen in einer Simulation landen
  const byTopic = new Map<string, ExamQuestionCandidate[]>();
  for (const q of ordered) {
    const list = byTopic.get(q.topic_id) ?? [];
    list.push(q);
    byTopic.set(q.topic_id, list);
  }
  const topics = shuffle([...byTopic.keys()], opts.random);
  const result: ExamQuestionCandidate[] = [];
  while (result.length < n) {
    let progressed = false;
    for (const t of topics) {
      const next = byTopic.get(t)?.shift();
      if (next) { result.push(next); progressed = true; }
      if (result.length === n) break;
    }
    if (!progressed) break;
  }
  return result;
}

/** Stellt eine Prüfungssimulation nach den Regeln zusammen (Grundstoff/Zusatzstoff getrennt gezogen). */
export function composeExam(rules: ExamTheoryRules, pool: ExamQuestionCandidate[], options: ComposeOptions = {}): ExamQuestionCandidate[] {
  const opts = { random: options.random ?? Math.random, recentlyUsed: options.recentlyUsed ?? new Set<string>(), spreadTopics: options.spreadTopics ?? true };
  const basic = pick(pool.filter((q) => q.material_kind === "basic"), rules.basic_questions, opts);
  const specific = pick(pool.filter((q) => q.material_kind === "class_specific"), rules.class_specific_questions, opts);
  return shuffle(basic.concat(specific), opts.random);
}

export interface AnsweredQuestion {
  question_id: string;
  points: number;
  correct_positions: number[];
  selected_positions: number[];
  marked_unsure?: boolean;
  /** numerische Frage: erwarteter Wert und Toleranz */
  numeric?: { expected: number; tolerance: number; given: number | null };
}

/** Eine Frage gilt nur als richtig, wenn genau die richtigen Antworten gewählt wurden. */
export function isAnswerCorrect(q: AnsweredQuestion): boolean {
  if (q.numeric) {
    if (q.numeric.given === null || Number.isNaN(q.numeric.given)) return false;
    return Math.abs(q.numeric.given - q.numeric.expected) <= q.numeric.tolerance;
  }
  const correct = [...new Set(q.correct_positions)].sort((a, b) => a - b);
  const selected = [...new Set(q.selected_positions)].sort((a, b) => a - b);
  return correct.length === selected.length && correct.every((v, i) => v === selected[i]);
}

export interface ExamScore {
  passed: boolean;
  error_points: number;
  correct_count: number;
  wrong_count: number;
  unsure_count: number;
  unanswered_count: number;
  fail_reasons: string[];
  wrong_question_ids: string[];
  five_point_wrong: number;
}

/** Bewertet eine abgegebene Simulation strikt nach der Regelversion (keine Werte im Code). */
export function scoreExam(rules: ExamTheoryRules, answers: AnsweredQuestion[], opts: { timeLimitExceeded?: boolean } = {}): ExamScore {
  let errorPoints = 0, correct = 0, wrong = 0, unsure = 0, unanswered = 0, fiveWrong = 0;
  const wrongIds: string[] = [];
  for (const a of answers) {
    const answered = a.numeric ? a.numeric.given !== null : a.selected_positions.length > 0;
    if (!answered) unanswered++;
    if (a.marked_unsure) unsure++;
    if (isAnswerCorrect(a)) {
      correct++;
    } else {
      wrong++;
      errorPoints += a.points;
      wrongIds.push(a.question_id);
      if (a.points === 5) fiveWrong++;
    }
  }
  const reasons: string[] = [];
  if (errorPoints > rules.max_error_points) reasons.push(`Mehr als ${rules.max_error_points} Fehlerpunkte (${errorPoints})`);
  if (rules.fail_if_two_five_point_questions_wrong && fiveWrong >= 2) reasons.push("Zwei Fragen mit je 5 Fehlerpunkten falsch beantwortet");
  if (opts.timeLimitExceeded) reasons.push("Zeitlimit überschritten");
  if (answers.length !== rules.questions_total) reasons.push(`Unvollständige Prüfung: ${answers.length} von ${rules.questions_total} Fragen`);
  return {
    passed: reasons.length === 0,
    error_points: errorPoints,
    correct_count: correct,
    wrong_count: wrong,
    unsure_count: unsure,
    unanswered_count: unanswered,
    fail_reasons: reasons,
    wrong_question_ids: wrongIds,
    five_point_wrong: fiveWrong,
  };
}
