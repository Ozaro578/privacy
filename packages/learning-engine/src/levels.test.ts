import { describe, expect, it } from "vitest";
import { currentLevel, ladderPool, levelProgress, questionLevel } from "./levels";
import { selectQuestions } from "./selection";
import type { QuestionMeta } from "./mastery";
import type { QuestionState } from "./srs";

const q = (id: string, difficulty: number, points = 3): QuestionMeta => ({ id, topic_id: "t", points, difficulty });
const state = (mastery: number, last_correct = true): QuestionState => ({ attempts: 2, correct: 2, consecutive_correct: 2, last_correct, last_answered_at: "2026-09-01T00:00:00Z", last_confidence: 2, avg_response_ms: 4000, ease: 2.5, interval_days: 3, due_at: "2026-09-04T00:00:00Z", mastery });

describe("Schwierigkeitsstufen", () => {
  it("stuft nach Schwierigkeit ein, 5-Punkte-Fragen mindestens Stufe 3", () => {
    expect(questionLevel(q("a", 0.1))).toBe(1);
    expect(questionLevel(q("b", 0.35))).toBe(2);
    expect(questionLevel(q("c", 0.5))).toBe(3);
    expect(questionLevel(q("d", 0.65))).toBe(4);
    expect(questionLevel(q("d2", 0.7))).toBe(5);
    expect(questionLevel(q("e", 0.9))).toBe(5);
    expect(questionLevel(q("f", 0.1, 5))).toBe(3);
  });

  it("aktuelle Stufe ist die erste nicht beherrschte", () => {
    const pool = [q("1", 0.1), q("2", 0.15), q("3", 0.3), q("4", 0.35), q("5", 0.5)];
    const states = new Map<string, QuestionState>([["1", state(0.9)], ["2", state(0.85)]]);
    const progress = levelProgress(pool, states);
    expect(progress[0]?.cleared).toBe(true);
    expect(progress[1]?.cleared).toBe(false);
    expect(currentLevel(progress)).toBe(2);
    expect(currentLevel(levelProgress(pool, new Map()))).toBe(1);
  });

  it("Stufen-Modus liefert überwiegend die aktuelle Stufe und etwas Herausforderung", () => {
    const pool = [...Array.from({ length: 20 }, (_, i) => q(`l2-${i}`, 0.3)), ...Array.from({ length: 20 }, (_, i) => q(`l3-${i}`, 0.5)), q("l1", 0.1)];
    const states = new Map<string, QuestionState>([["l1", state(0.3, false)]]);
    let seed = 1; const random = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const picked = ladderPool(pool, states, 2, 10, random);
    expect(picked).toHaveLength(10);
    expect(picked.filter((x) => questionLevel(x) === 2).length).toBeGreaterThanOrEqual(7);
    expect(picked.filter((x) => questionLevel(x) === 3).length).toBeGreaterThanOrEqual(1);
    const viaSelect = selectQuestions(pool, states, { mode: "ladder", limit: 5, random });
    expect(viaSelect).toHaveLength(5);
  });
});
