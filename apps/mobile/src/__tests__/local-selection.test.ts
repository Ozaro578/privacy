import { describe, expect, it } from "vitest";
import { applyLocalReview, filterPoolForLicense, localOverview, selectLocalQuestions } from "../offline/local-learning";
import type { LocalQuestion, LocalQuestionState } from "../offline/types";

const now = new Date("2026-09-18T10:00:00.000Z");
const q = (id: string, over: Partial<LocalQuestion> = {}): LocalQuestion => ({
  id, topic_id: "t1", material_kind: "basic", points: 3, difficulty: 0.4, question_kind: "multiple_choice", source: "official", license_codes: [], tags: [], version_id: `v-${id}`, locale: "de",
  text: id, media_path: null, explanation: null, mnemonic: null, legal_reference: null, legal_basis_date: null, numeric_answer: null, numeric_tolerance: null,
  answers: [{ position: 1, text: "a", is_correct: true, explanation: null }, { position: 2, text: "b", is_correct: false, explanation: null }], updated_at: "2026-09-01T00:00:00.000Z", ...over,
});
const seq = () => { let i = 0; return () => { i = (i * 9301 + 49297) % 233280; return i / 233280; }; };

describe("Auswahl der lokalen Fragen", () => {
  it("filtert nach Klasse (inklusive Basisklasse) und Sprache", () => {
    const pool = [q("all"), q("b", { license_codes: ["B"] }), q("be", { license_codes: ["BE"] }), q("a", { license_codes: ["A"] }), q("en", { locale: "en" })];
    expect(filterPoolForLicense(pool, "BE", "B", "de").map((x) => x.id)).toEqual(["all", "b", "be"]);
    expect(filterPoolForLicense(pool, "A", null, "de").map((x) => x.id)).toEqual(["all", "a"]);
  });

  it("wählt im Themenmodus nur Fragen des Themas", () => {
    const pool = [q("1", { topic_id: "t1" }), q("2", { topic_id: "t2" }), q("3", { topic_id: "t1" })];
    const sel = selectLocalQuestions(pool, new Map(), { mode: "topic", topicId: "t1", limit: 10, now, random: seq() });
    expect(sel.map((x) => x.id).sort()).toEqual(["1", "3"]);
  });

  it("bevorzugt fällige Fragen mit niedriger Mastery und streut neue ein", () => {
    const pool = Array.from({ length: 10 }, (_, i) => q(`q${i}`));
    const states = new Map<string, LocalQuestionState>();
    const earlier = new Date(now.getTime() - 3 * 86_400_000);
    // q0..q3 beantwortet und fällig, q0 mit schlechtester Mastery
    for (let i = 0; i < 4; i++) states.set(`q${i}`, applyLocalReview(`q${i}`, undefined, { correct: i !== 0, confidence: 2, responseMs: 2000, points: 3, now: earlier }));
    // q4 beantwortet und nicht fällig
    states.set("q4", applyLocalReview("q4", undefined, { correct: true, confidence: 3, responseMs: 2000, points: 3, now }));
    const sel = selectLocalQuestions(pool, states, { mode: "review", limit: 5, now, random: seq() });
    expect(sel.map((x) => x.id)).not.toContain("q4");
    expect(sel[0]?.id).toBe("q0");
    expect(sel.every((x) => ["q0", "q1", "q2", "q3"].includes(x.id))).toBe(true);
    const mixed = selectLocalQuestions(pool, states, { mode: "random", limit: 5, now, random: seq() });
    expect(mixed).toHaveLength(5);
    expect(new Set(mixed.map((x) => x.id)).size).toBe(5);
  });

  it("liefert Falsche, Markierte und Unbeantwortete getrennt", () => {
    const pool = [q("1"), q("2"), q("3")];
    const states = new Map<string, LocalQuestionState>();
    states.set("1", applyLocalReview("1", undefined, { correct: false, confidence: 2, responseMs: 2000, points: 3, now }));
    states.set("2", { ...applyLocalReview("2", undefined, { correct: true, confidence: 2, responseMs: 2000, points: 3, now }), bookmarked: true });
    expect(selectLocalQuestions(pool, states, { mode: "wrong", limit: 10, now }).map((x) => x.id)).toEqual(["1"]);
    expect(selectLocalQuestions(pool, states, { mode: "bookmarked", limit: 10, now }).map((x) => x.id)).toEqual(["2"]);
    expect(selectLocalQuestions(pool, states, { mode: "unseen", limit: 10, now }).map((x) => x.id)).toEqual(["3"]);
    const ov = localOverview(pool, states, now);
    expect(ov).toMatchObject({ total: 3, answered: 2, wrong: 1, bookmarked: 1, unseen: 1 });
  });
});
