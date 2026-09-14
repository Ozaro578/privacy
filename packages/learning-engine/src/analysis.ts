import type { QuestionMeta } from "./mastery";

export interface AttemptRecord {
  question_id: string;
  is_correct: boolean;
  answered_at: string;
  confidence?: number | null;
  response_ms?: number | null;
}

export interface TopicLabel { id: string; name: string; }

export interface ErrorCluster {
  topic_id: string;
  topic_name: string;
  errors: number;
  share: number;
}

export interface ConfusionPattern {
  tag_a: string;
  tag_b: string;
  errors: number;
  description: string;
}

export interface ErrorAnalysis {
  window: number;                 // betrachtete Fehler
  clusters: ErrorCluster[];
  confusions: ConfusionPattern[];
  statements: string[];           // "Von deinen letzten 24 Fehlern stammen 11 aus dem Bereich Vorfahrt."
  recommendation: { topic_id: string; topic_name: string; text: string } | null;
  fast_wrong_share: number;       // Anteil schneller falscher Antworten (Flüchtigkeit)
  confident_wrong_share: number;  // Anteil sicher-falscher Antworten (Fehlvorstellung)
}

const CONFUSION_PAIRS: Array<[string, string, string]> = [
  ["rechts_vor_links", "vorfahrt_beschildert", "Du verwechselst Situationen, in denen Rechts-vor-Links gilt, mit Situationen, in denen die Vorfahrt durch Verkehrszeichen geregelt ist."],
  ["halten", "parken", "Du verwechselst die Regeln für Halten mit den Regeln für Parken."],
  ["innerorts", "ausserorts", "Du wendest Geschwindigkeits- und Abstandsregeln von innerorts und außerorts nicht auseinander."],
  ["bremsweg", "anhalteweg", "Du verwechselst Bremsweg und Anhalteweg in den Faustformeln."],
];

/** Analysiert die letzten Fehler eines Schülers nach Themen und bekannten Verwechslungsmustern. */
export function analyzeErrors(attempts: AttemptRecord[], questions: Map<string, QuestionMeta>, topics: TopicLabel[], windowSize = 30): ErrorAnalysis {
  const sorted = attempts.slice().sort((a, b) => b.answered_at.localeCompare(a.answered_at));
  const errors = sorted.filter((a) => !a.is_correct).slice(0, windowSize);
  const topicName = (id: string) => topics.find((t) => t.id === id)?.name ?? id;
  const counts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  let fastWrong = 0, confidentWrong = 0;
  for (const e of errors) {
    const q = questions.get(e.question_id);
    if (!q) continue;
    counts.set(q.topic_id, (counts.get(q.topic_id) ?? 0) + 1);
    for (const t of q.tags ?? []) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    if (e.response_ms != null && e.response_ms < 4000) fastWrong++;
    if (e.confidence === 3) confidentWrong++;
  }
  const clusters = [...counts.entries()].map(([topic_id, n]) => ({ topic_id, topic_name: topicName(topic_id), errors: n, share: errors.length ? n / errors.length : 0 }))
    .sort((a, b) => b.errors - a.errors);
  const confusions: ConfusionPattern[] = [];
  for (const [a, b, description] of CONFUSION_PAIRS) {
    const n = (tagCounts.get(a) ?? 0) + (tagCounts.get(b) ?? 0);
    if ((tagCounts.get(a) ?? 0) >= 2 && (tagCounts.get(b) ?? 0) >= 2) confusions.push({ tag_a: a, tag_b: b, errors: n, description });
  }
  const statements: string[] = [];
  const top = clusters[0];
  const second = clusters[1];
  if (top && errors.length >= 5) {
    statements.push(`Von deinen letzten ${errors.length} Fehlern stammen ${top.errors} aus dem Bereich ${top.topic_name}.`);
    if (second && second.share >= 0.2) statements.push(`Du hast aktuell Schwierigkeiten mit ${top.topic_name} und ${second.topic_name}.`);
    else statements.push(`Du hast aktuell Schwierigkeiten mit ${top.topic_name}.`);
  }
  for (const c of confusions) statements.push(c.description);
  if (errors.length >= 8 && fastWrong / errors.length > 0.4) statements.push("Viele Fehler entstehen bei sehr schnellen Antworten. Lies Frage und alle Antworten vollständig, bevor du auswählst.");
  if (errors.length >= 8 && confidentWrong / errors.length > 0.3) statements.push("Bei vielen Fehlern warst du dir sicher. Hier lohnt sich das Lesen der Erklärungen, weil eine Regel falsch verinnerlicht ist.");
  return {
    window: errors.length,
    clusters,
    confusions,
    statements,
    recommendation: top && errors.length >= 5 ? { topic_id: top.topic_id, topic_name: top.topic_name, text: `Empfehlung: Wiederhole zunächst das Kapitel ${top.topic_name}.` } : null,
    fast_wrong_share: errors.length ? fastWrong / errors.length : 0,
    confident_wrong_share: errors.length ? confidentWrong / errors.length : 0,
  };
}
