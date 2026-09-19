import { describe, expect, it } from "vitest";
import { reviewQuestion, initialQuestionState } from "@fahrpilot/learning-engine";
import { applyLocalReview, evaluateAnswer } from "../offline/local-learning";
import type { LocalQuestion } from "../offline/types";

const now = new Date("2026-09-18T10:00:00.000Z");
const question = (over: Partial<LocalQuestion> = {}): LocalQuestion => ({
  id: "q1", topic_id: "t1", material_kind: "basic", points: 3, difficulty: 0.5, question_kind: "multiple_choice", source: "official", license_codes: [], tags: [], version_id: "v1", locale: "de",
  text: "Wann gilt rechts vor links?", media_path: null, media_alt: null, media_credit: null, explanation: "Ohne Verkehrszeichen.", mnemonic: null, legal_reference: "§ 8 StVO", legal_basis_date: "2025-01-01", numeric_answer: null, numeric_tolerance: null,
  answers: [{ position: 1, text: "Ohne Regelung", is_correct: true, explanation: null }, { position: 2, text: "Immer", is_correct: false, explanation: null }, { position: 3, text: "Auf Vorfahrtstraßen", is_correct: false, explanation: null }],
  updated_at: "2026-09-01T00:00:00.000Z", ...over,
});

describe("Offline-Bewertung", () => {
  it("bewertet Mehrfachauswahl nur bei exakt richtigen Antworten als richtig", () => {
    const q = question({ answers: [{ position: 1, text: "a", is_correct: true, explanation: null }, { position: 2, text: "b", is_correct: true, explanation: null }, { position: 3, text: "c", is_correct: false, explanation: null }] });
    expect(evaluateAnswer(q, [1, 2], null)).toBe(true);
    expect(evaluateAnswer(q, [2, 1], null)).toBe(true);
    expect(evaluateAnswer(q, [1], null)).toBe(false);
    expect(evaluateAnswer(q, [1, 2, 3], null)).toBe(false);
    expect(evaluateAnswer(q, [], null)).toBe(false);
  });
  it("bewertet numerische Antworten mit Toleranz", () => {
    const q = question({ numeric_answer: 50, numeric_tolerance: 2, answers: [] });
    expect(evaluateAnswer(q, [], 51)).toBe(true);
    expect(evaluateAnswer(q, [], 53)).toBe(false);
    expect(evaluateAnswer(q, [], null)).toBe(false);
  });
});

describe("Offline-SRS-Berechnung", () => {
  it("liefert exakt das Ergebnis der learning-engine (deterministisch wie der Server)", () => {
    const local = applyLocalReview("q1", undefined, { correct: true, confidence: 3, responseMs: 2500, points: 3, now });
    const expected = reviewQuestion(initialQuestionState(now), { correct: true, confidence: 3, responseMs: 2500, points: 3, now });
    expect(local).toMatchObject(expected);
    expect(local.dirty).toBe(true);
    expect(local.question_id).toBe("q1");
    expect(local.interval_days).toBe(1);
    expect(local.due_at).toBe(new Date(now.getTime() + 86_400_000).toISOString());
  });
  it("erhöht das Intervall bei aufeinanderfolgenden richtigen Antworten und setzt es bei Fehlern zurück", () => {
    let s = applyLocalReview("q1", undefined, { correct: true, confidence: 2, responseMs: 3000, points: 3, now });
    s = applyLocalReview("q1", s, { correct: true, confidence: 2, responseMs: 3000, points: 3, now: new Date(now.getTime() + 86_400_000) });
    expect(s.consecutive_correct).toBe(2);
    expect(s.interval_days).toBe(3);
    s = applyLocalReview("q1", s, { correct: true, confidence: 3, responseMs: 3000, points: 3, now: new Date(now.getTime() + 4 * 86_400_000) });
    expect(s.interval_days).toBeGreaterThanOrEqual(6);
    const wrong = applyLocalReview("q1", s, { correct: false, confidence: 3, responseMs: 1000, points: 5, now: new Date(now.getTime() + 10 * 86_400_000) });
    expect(wrong.consecutive_correct).toBe(0);
    expect(wrong.interval_days).toBe(0);
    expect(wrong.mastery).toBeLessThan(s.mastery);
    // einmal falsch: in vier Stunden erneut
    expect(new Date(wrong.due_at).getTime() - (now.getTime() + 10 * 86_400_000)).toBe(4 * 3_600_000);
  });
  it("behält Merken-Flag und row_version des bisherigen Zustands", () => {
    const prev = applyLocalReview("q1", undefined, { correct: true, confidence: 2, responseMs: null, points: 3, now });
    const withFlag = { ...prev, bookmarked: true, row_version: 7, dirty: false };
    const next = applyLocalReview("q1", withFlag, { correct: false, confidence: 1, responseMs: 500, points: 3, now });
    expect(next.bookmarked).toBe(true);
    expect(next.row_version).toBe(7);
    expect(next.dirty).toBe(true);
    expect(next.attempts).toBe(2);
  });
});
