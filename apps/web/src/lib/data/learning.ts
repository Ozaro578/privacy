import "server-only";
import type { Tables } from "@fahrpilot/db";
import { topicMastery, type QuestionMeta, type QuestionState, type TopicMastery } from "@fahrpilot/learning-engine";
import type { Db } from "./student";

export interface QuestionWithVersion {
  id: string;
  topic_id: string;
  material_kind: "basic" | "class_specific";
  points: number;
  difficulty: number;
  question_kind: string;
  source: string;
  external_ref: string | null;
  tags: string[];
  version: {
    id: string;
    text: string;
    media_path: string | null;
    media_kind: string | null;
    media_alt: string | null;
    media_credit: string | null;
    explanation: string | null;
    mnemonic: string | null;
    legal_reference: string | null;
    legal_basis_date: string | null;
    numeric_answer: number | null;
    numeric_tolerance: number | null;
    answers: Array<{ id: string; position: number; text: string; is_correct: boolean; explanation: string | null }>;
  };
}

/** Veröffentlichte Fragen für eine Klasse (global + Tenant) mit aktueller Version und Antworten. Für Prüfungen und Lernsessions. */
export async function loadQuestionPool(db: Db, licenseCode: string, baseClass: string | null, locale = "de"): Promise<QuestionWithVersion[]> {
  const { data, error } = await db
    .from("theory_questions")
    .select("id, topic_id, material_kind, points, difficulty, question_kind, source, external_ref, license_codes, tags, current_version_id, question_versions!theory_questions_current_version_fk(id, text, media_path, media_kind, media_alt, media_credit, explanation, mnemonic, legal_reference, legal_basis_date, numeric_answer, numeric_tolerance, locale, question_answers(id, position, text, is_correct, explanation))")
    .eq("status", "published");
  if (error) throw new Error(error.message);
  const codes = [licenseCode, baseClass].filter(Boolean) as string[];
  const out: QuestionWithVersion[] = [];
  for (const q of data ?? []) {
    const lc = (q.license_codes ?? []) as string[];
    if (lc.length > 0 && !lc.some((c) => codes.includes(c))) continue;
    const v = q.question_versions as unknown as (QuestionWithVersion["version"] & { locale: string; question_answers: QuestionWithVersion["version"]["answers"] }) | null;
    if (!v || v.locale !== locale) continue;
    out.push({
      id: q.id, topic_id: q.topic_id, material_kind: q.material_kind as "basic" | "class_specific", points: q.points, difficulty: Number(q.difficulty), question_kind: q.question_kind, source: q.source, external_ref: q.external_ref, tags: (q.tags ?? []) as string[],
      version: { ...v, answers: [...(v.question_answers ?? [])].sort((a, b) => a.position - b.position) },
    });
  }
  return out;
}

export function toMeta(q: QuestionWithVersion, tags?: string[]): QuestionMeta {
  return { id: q.id, topic_id: q.topic_id, points: q.points, difficulty: q.difficulty, tags: tags ?? q.tags };
}

export function rowToState(r: Tables<"student_question_state">): QuestionState {
  return {
    attempts: r.attempts, correct: r.correct, consecutive_correct: r.consecutive_correct, last_correct: r.last_correct, last_answered_at: r.last_answered_at,
    last_confidence: r.last_confidence, avg_response_ms: r.avg_response_ms, ease: Number(r.ease), interval_days: Number(r.interval_days), due_at: r.due_at, mastery: Number(r.mastery),
  };
}

export async function loadStates(db: Db, studentId: string): Promise<Map<string, QuestionState & { bookmarked: boolean; row_version: number }>> {
  const { data } = await db.from("student_question_state").select("*").eq("student_id", studentId);
  const map = new Map<string, QuestionState & { bookmarked: boolean; row_version: number }>();
  for (const r of data ?? []) map.set(r.question_id, { ...rowToState(r), bookmarked: r.bookmarked, row_version: r.row_version });
  return map;
}

export interface TopicRow { id: string; code: string; name: string; material_kind: string; practical_skill_code: string | null; sort_order: number }

export async function loadTopics(db: Db, locale = "de"): Promise<TopicRow[]> {
  const { data } = await db.from("topics").select("id, code, name_i18n, material_kind, practical_skill_code, sort_order").eq("active", true).order("sort_order");
  return (data ?? []).map((t) => ({ id: t.id, code: t.code, name: ((t.name_i18n as Record<string, string>)[locale] ?? (t.name_i18n as Record<string, string>)["de"] ?? t.code), material_kind: t.material_kind, practical_skill_code: t.practical_skill_code, sort_order: t.sort_order }));
}

export interface LearningOverview {
  topics: Array<TopicRow & TopicMastery>;
  totalQuestions: number;
  answeredQuestions: number;
  dueCount: number;
  wrongCount: number;
  bookmarkedCount: number;
  unseenCount: number;
  hardCount: number;
  overallMastery: number;
}

/** Lernstand für Übersicht und Dashboard. */
export function buildLearningOverview(pool: QuestionWithVersion[], states: Map<string, QuestionState & { bookmarked: boolean }>, topics: TopicRow[]): LearningOverview {
  const meta = pool.map((q) => toMeta(q));
  const tm = topicMastery(meta, states as Map<string, QuestionState>);
  const now = Date.now();
  let answered = 0, due = 0, wrong = 0, bookmarked = 0, hard = 0;
  for (const q of pool) {
    const s = states.get(q.id);
    if (s?.bookmarked) bookmarked++;
    if (q.difficulty >= 0.65 || ((s?.attempts ?? 0) >= 2 && (s?.mastery ?? 0) < 0.5)) hard++;
    if (!s || s.attempts === 0) continue;
    answered++;
    if (new Date(s.due_at).getTime() <= now) due++;
    if (s.last_correct === false) wrong++;
  }
  const withTopics = topics.filter((t) => tm.some((m) => m.topic_id === t.id)).map((t) => ({ ...t, ...tm.find((m) => m.topic_id === t.id)! }));
  const totalWeight = withTopics.reduce((s, t) => s + t.question_count, 0);
  const overall = totalWeight ? withTopics.reduce((s, t) => s + t.mastery * t.question_count, 0) / totalWeight : 0;
  return { topics: withTopics, totalQuestions: pool.length, answeredQuestions: answered, dueCount: due, wrongCount: wrong, bookmarkedCount: bookmarked, unseenCount: pool.length - answered, hardCount: hard, overallMastery: Math.round(overall * 1000) / 1000 };
}
