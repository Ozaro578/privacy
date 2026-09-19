import { describe, expect, it } from "vitest";
import { clearDirty, mergeState, mergeStates } from "../offline/merge";
import type { LocalQuestionState, ServerQuestionState } from "../offline/types";

const base = (over: Partial<ServerQuestionState> = {}): ServerQuestionState => ({ question_id: "q", attempts: 1, correct: 1, consecutive_correct: 1, last_correct: true, last_answered_at: "2026-09-18T10:00:00.000Z", last_confidence: 2, avg_response_ms: 900, ease: 2.6, interval_days: 1, due_at: "2026-09-19T10:00:00.000Z", mastery: 0.6, bookmarked: false, row_version: 2, ...over });

describe("Merge-Regel: Server gewinnt", () => {
  it("übernimmt den Serverzustand, wenn lokal nichts vorliegt", () => {
    const m = mergeState(undefined, base());
    expect(m.dirty).toBe(false);
    expect(m.mastery).toBe(0.6);
  });
  it("überschreibt einen sauberen lokalen Zustand immer mit dem Server, auch wenn er lokal jünger wirkt", () => {
    const local: LocalQuestionState = { ...base({ last_answered_at: "2026-09-18T12:00:00.000Z", mastery: 0.9 }), dirty: false };
    expect(mergeState(local, base()).mastery).toBe(0.6);
  });
  it("überschreibt einen dirty lokalen Zustand, wenn der Server gleich alt oder neuer ist", () => {
    const local: LocalQuestionState = { ...base({ mastery: 0.3 }), dirty: true };
    expect(mergeState(local, base({ mastery: 0.6 })).mastery).toBe(0.6);
    const older: LocalQuestionState = { ...base({ last_answered_at: "2026-09-18T09:00:00.000Z", mastery: 0.3 }), dirty: true };
    expect(mergeState(older, base()).dirty).toBe(false);
  });
  it("behält einen dirty lokalen Zustand nur, wenn er jünger als der Server ist, und übernimmt das Merken-Flag", () => {
    const local: LocalQuestionState = { ...base({ last_answered_at: "2026-09-18T11:00:00.000Z", mastery: 0.3, bookmarked: false, row_version: 1 }), dirty: true };
    const m = mergeState(local, base({ bookmarked: true, row_version: 5 }));
    expect(m.mastery).toBe(0.3);
    expect(m.dirty).toBe(true);
    expect(m.bookmarked).toBe(true);
    expect(m.row_version).toBe(5);
  });
  it("zählt übernommene und behaltene Zustände", () => {
    const local = new Map<string, LocalQuestionState>([
      ["a", { ...base({ question_id: "a", last_answered_at: "2026-09-18T11:00:00.000Z" }), dirty: true }],
      ["b", { ...base({ question_id: "b" }), dirty: true }],
    ]);
    const r = mergeStates(local, [base({ question_id: "a" }), base({ question_id: "b", last_answered_at: "2026-09-18T10:30:00.000Z" }), base({ question_id: "c" })]);
    expect(r.keptLocal).toBe(1);
    expect(r.applied).toBe(2);
    expect(r.merged.size).toBe(3);
    expect(clearDirty(r.merged, ["a", "c"])).toBe(1);
    expect(r.merged.get("a")?.dirty).toBe(false);
  });
});
