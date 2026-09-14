import type { QuestionState } from "./srs";

export interface QuestionMeta {
  id: string;
  topic_id: string;
  points: number;
  difficulty?: number;
  tags?: string[];
}

export interface TopicMastery {
  topic_id: string;
  mastery: number;       // 0..1, Mittel über beantwortete Fragen (unbeantwortete zählen als 0 mit halbem Gewicht)
  coverage: number;      // Anteil beantworteter Fragen
  attempts: number;
  correct: number;
  question_count: number;
  weak: boolean;
}

/** Aggregiert Fragezustände zu Themen-Mastery. */
export function topicMastery(questions: QuestionMeta[], states: Map<string, QuestionState>): TopicMastery[] {
  const byTopic = new Map<string, QuestionMeta[]>();
  for (const q of questions) {
    const list = byTopic.get(q.topic_id) ?? [];
    list.push(q);
    byTopic.set(q.topic_id, list);
  }
  const out: TopicMastery[] = [];
  for (const [topic_id, qs] of byTopic) {
    let answered = 0, attempts = 0, correct = 0, weighted = 0, weight = 0;
    for (const q of qs) {
      const s = states.get(q.id);
      const w = q.points;   // 5-Punkte-Fragen wiegen mehr
      if (s && s.attempts > 0) { answered++; attempts += s.attempts; correct += s.correct; weighted += s.mastery * w; weight += w; }
      else { weight += w * 0.5; }
    }
    const mastery = weight === 0 ? 0 : Math.round((weighted / weight) * 1000) / 1000;
    const coverage = qs.length === 0 ? 0 : Math.round((answered / qs.length) * 1000) / 1000;
    out.push({ topic_id, mastery, coverage, attempts, correct, question_count: qs.length, weak: answered >= 3 && mastery < 0.6 });
  }
  return out.sort((a, b) => a.mastery - b.mastery);
}

export function overallMastery(topics: TopicMastery[]): number {
  if (topics.length === 0) return 0;
  const w = topics.reduce((s, t) => s + t.question_count, 0);
  if (w === 0) return 0;
  return Math.round((topics.reduce((s, t) => s + t.mastery * t.question_count, 0) / w) * 1000) / 1000;
}
