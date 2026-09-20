// Schwierigkeitsstufen 1 bis 5: Fragen werden nach Schwierigkeit und Punktwert eingestuft; der Stufen-Modus
// ("ladder") führt von leicht nach schwer und schaltet hoch, sobald eine Stufe beherrscht wird.
import type { QuestionMeta } from "./mastery";
import type { QuestionState } from "./srs";

export type Level = 1 | 2 | 3 | 4 | 5;
export const LEVEL_LABEL: Record<Level, string> = { 1: "Einstieg", 2: "Grundlagen", 3: "Fortgeschritten", 4: "Prüfungsniveau", 5: "Profi" };

/** Stufe einer Frage: 0..0.2 → 1, 0.2..0.4 → 2, 0.4..0.6 → 3, 0.6..0.8 → 4, ab 0.8 → 5; 5-Punkte-Fragen mindestens Stufe 3. */
export function questionLevel(q: Pick<QuestionMeta, "difficulty" | "points">): Level {
  const d = q.difficulty ?? 0.5;
  let level: Level = d < 0.2 ? 1 : d < 0.4 ? 2 : d < 0.6 ? 3 : d < 0.8 ? 4 : 5;
  if (q.points >= 5 && level < 3) level = 3;
  return level;
}

export interface LevelProgress {
  level: Level;
  total: number;
  answered: number;
  mastered: number;   // mastery >= 0.8
  accuracy: number;   // Anteil zuletzt richtig unter den beantworteten
  /** Stufe gilt als beherrscht: mindestens 80 % beantwortet, davon 75 % gemeistert, Trefferquote >= 0,8 */
  cleared: boolean;
}

export function levelProgress(questions: QuestionMeta[], states: Map<string, QuestionState>): LevelProgress[] {
  const out: LevelProgress[] = [];
  for (const level of [1, 2, 3, 4, 5] as Level[]) {
    const qs = questions.filter((q) => questionLevel(q) === level);
    let answered = 0, mastered = 0, correct = 0;
    for (const q of qs) {
      const s = states.get(q.id);
      if (!s || s.attempts === 0) continue;
      answered++;
      if (s.mastery >= 0.8) mastered++;
      if (s.last_correct) correct++;
    }
    const total = qs.length;
    const accuracy = answered ? correct / answered : 0;
    const cleared = total > 0 && answered >= Math.ceil(total * 0.8) && mastered >= Math.ceil(answered * 0.75) && accuracy >= 0.8;
    out.push({ level, total, answered, mastered, accuracy: Math.round(accuracy * 1000) / 1000, cleared });
  }
  return out;
}

/** Aktuelle Stufe: die erste nicht beherrschte Stufe (mindestens 1, höchstens 5). */
export function currentLevel(progress: LevelProgress[]): Level {
  for (const p of progress) if (!p.cleared && p.total > 0) return p.level;
  return 5;
}

/**
 * Fragen für den Stufen-Modus: überwiegend aus der aktuellen Stufe, ein kleiner Anteil aus der nächsten
 * (Herausforderung) und aus fälligen Wiederholungen niedrigerer Stufen (Festigung).
 */
export function ladderPool(questions: QuestionMeta[], states: Map<string, QuestionState>, level: Level, limit: number, random: () => number = Math.random): QuestionMeta[] {
  const byLevel = (l: number) => questions.filter((q) => questionLevel(q) === l);
  const shuffle = <T,>(items: T[]) => { const a = items.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; } return a; };
  const notMastered = (q: QuestionMeta) => (states.get(q.id)?.mastery ?? 0) < 0.8;
  const main = shuffle(byLevel(level).filter(notMastered).length ? byLevel(level).filter(notMastered) : byLevel(level));
  const next = level < 5 ? shuffle(byLevel(level + 1).filter(notMastered)) : [];
  const lower = shuffle(questions.filter((q) => questionLevel(q) < level && notMastered(q)));
  const result: QuestionMeta[] = [];
  const seen = new Set<string>();
  const push = (q: QuestionMeta) => { if (!seen.has(q.id) && result.length < limit) { seen.add(q.id); result.push(q); } };
  const nextTarget = Math.floor(limit * 0.2), lowerTarget = Math.floor(limit * 0.1);
  main.slice(0, limit - nextTarget - lowerTarget).forEach(push);
  next.slice(0, nextTarget).forEach(push);
  lower.slice(0, lowerTarget).forEach(push);
  main.forEach(push); next.forEach(push); lower.forEach(push);
  return result;
}
