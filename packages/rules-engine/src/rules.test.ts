import { describe, expect, it } from "vitest";
import { composeExam, isAnswerCorrect, scoreExam, type AnsweredQuestion, type ExamQuestionCandidate } from "./exam";
import { resolveRule } from "./resolve";
import { ExamTheoryRules, type RuleVersionRow } from "./schemas";
import { theoryLessonsProgress, trainingProgress } from "./training";

const rulesB = ExamTheoryRules.parse({ questions_total: 30, basic_questions: 20, class_specific_questions: 10, max_error_points: 10, fail_if_two_five_point_questions_wrong: true });

function seeded(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
}

function pool(): ExamQuestionCandidate[] {
  const out: ExamQuestionCandidate[] = [];
  for (let i = 0; i < 60; i++) out.push({ id: `b${i}`, material_kind: "basic", points: (i % 3) + 2, topic_id: `t${i % 6}` });
  for (let i = 0; i < 25; i++) out.push({ id: `z${i}`, material_kind: "class_specific", points: 3, topic_id: `z${i % 3}` });
  return out;
}

describe("composeExam", () => {
  it("zieht Grund- und Zusatzstoff nach Regel", () => {
    const exam = composeExam(rulesB, pool(), { random: seeded(1) });
    expect(exam).toHaveLength(30);
    expect(exam.filter((q) => q.material_kind === "basic")).toHaveLength(20);
    expect(exam.filter((q) => q.material_kind === "class_specific")).toHaveLength(10);
    expect(new Set(exam.map((q) => q.id)).size).toBe(30);
  });
  it("bevorzugt Fragen, die zuletzt nicht vorkamen", () => {
    const recently = new Set(pool().filter((q) => q.material_kind === "basic").slice(0, 45).map((q) => q.id));
    const exam = composeExam(rulesB, pool(), { random: seeded(2), recentlyUsed: recently });
    const freshBasic = exam.filter((q) => q.material_kind === "basic" && !recently.has(q.id));
    expect(freshBasic.length).toBe(15);
  });
  it("wirft bei zu kleinem Katalog", () => {
    expect(() => composeExam(rulesB, pool().slice(0, 10), { random: seeded(3) })).toThrow(/Nicht genügend Fragen/);
  });
});

describe("scoreExam", () => {
  const q = (id: string, points: number, correct: number[], selected: number[], extra: Partial<AnsweredQuestion> = {}): AnsweredQuestion => ({ question_id: id, points, correct_positions: correct, selected_positions: selected, ...extra });
  const full = (wrongIdx: number[], fiveIdx: number[] = []) => Array.from({ length: 30 }, (_, i) => q(`q${i}`, fiveIdx.includes(i) ? 5 : 3, [1, 3], wrongIdx.includes(i) ? [1] : [1, 3]));

  it("besteht mit höchstens 10 Fehlerpunkten", () => {
    const r = scoreExam(rulesB, full([0, 1, 2]));
    expect(r.error_points).toBe(9);
    expect(r.passed).toBe(true);
  });
  it("fällt bei mehr als 10 Fehlerpunkten durch", () => {
    const r = scoreExam(rulesB, full([0, 1, 2, 3]));
    expect(r.error_points).toBe(12);
    expect(r.passed).toBe(false);
    expect(r.fail_reasons[0]).toMatch(/Fehlerpunkte/);
  });
  it("fällt bei zwei falschen 5-Punkte-Fragen durch, auch mit genau 10 Punkten", () => {
    const r = scoreExam(rulesB, full([0, 1], [0, 1]));
    expect(r.error_points).toBe(10);
    expect(r.passed).toBe(false);
    expect(r.fail_reasons.join()).toMatch(/5 Fehlerpunkten/);
  });
  it("wertet nur exakt richtige Mehrfachauswahl als richtig", () => {
    expect(isAnswerCorrect(q("a", 3, [1, 2], [2, 1]))).toBe(true);
    expect(isAnswerCorrect(q("a", 3, [1, 2], [1]))).toBe(false);
    expect(isAnswerCorrect(q("a", 3, [1], [1, 2]))).toBe(false);
  });
  it("bewertet numerische Fragen mit Toleranz", () => {
    expect(isAnswerCorrect({ question_id: "n", points: 2, correct_positions: [], selected_positions: [], numeric: { expected: 15, tolerance: 0.5, given: 15.4 } })).toBe(true);
    expect(isAnswerCorrect({ question_id: "n", points: 2, correct_positions: [], selected_positions: [], numeric: { expected: 15, tolerance: 0.5, given: null } })).toBe(false);
  });
  it("zählt unsichere und unbeantwortete Fragen", () => {
    const answers = full([]);
    answers[0] = { ...answers[0]!, marked_unsure: true };
    answers[1] = { ...answers[1]!, selected_positions: [] };
    const r = scoreExam(rulesB, answers);
    expect(r.unsure_count).toBe(1);
    expect(r.unanswered_count).toBe(1);
    expect(r.wrong_count).toBe(1);
  });
  it("erkennt unvollständige Prüfungen und Zeitüberschreitung", () => {
    const r = scoreExam(rulesB, full([]).slice(0, 29), { timeLimitExceeded: true });
    expect(r.passed).toBe(false);
    expect(r.fail_reasons).toHaveLength(2);
  });
});

describe("resolveRule", () => {
  const v = (over: Partial<RuleVersionRow>): RuleVersionRow => ({
    id: "00000000-0000-0000-0000-00000000000" + Math.floor(Math.random() * 9), rule_type: "exam_theory", license_code: "B", acquisition_kind: "first", version: 1,
    valid_from: "2024-01-01", valid_until: null, payload: { questions_total: 30, basic_questions: 20, class_specific_questions: 10, max_error_points: 10 },
    source: "Test", review_status: "published", ...over,
  });
  const licenses = [{ code: "B", base_class: null }, { code: "B197", base_class: "B" }];

  it("löst Klassenvarianten auf die Basisklasse auf", () => {
    const r = resolveRule([v({})], { ruleType: "exam_theory", licenseCode: "B197", acquisition: "first", licenses });
    expect(r?.version.license_code).toBe("B");
    expect(r?.rules.max_error_points).toBe(10);
    expect(r?.needsVerification).toBe(false);
  });
  it("bevorzugt die exakte Klasse und die höhere Version", () => {
    const r = resolveRule([v({}), v({ license_code: "B197", version: 2 }), v({ license_code: "B197", version: 3, valid_from: "2030-01-01" })], { ruleType: "exam_theory", licenseCode: "B197", acquisition: "first", licenses, on: new Date("2026-06-01") });
    expect(r?.version.license_code).toBe("B197");
    expect(r?.version.version).toBe(2);
  });
  it("liefert unverifizierte Regeln nur mit Opt-in und kennzeichnet sie", () => {
    const versions = [v({ license_code: "D", review_status: "needs_verification" })];
    expect(resolveRule(versions, { ruleType: "exam_theory", licenseCode: "D", acquisition: "first" })).toBeNull();
    const r = resolveRule(versions, { ruleType: "exam_theory", licenseCode: "D", acquisition: "first", allowUnverified: true });
    expect(r?.needsVerification).toBe(true);
  });
  it("respektiert Gültigkeitszeiträume (historische Ergebnisse bleiben rekonstruierbar)", () => {
    const versions = [v({ valid_until: "2025-12-31" }), v({ version: 2, valid_from: "2026-01-01", payload: { questions_total: 30, basic_questions: 20, class_specific_questions: 10, max_error_points: 8 } })];
    expect(resolveRule(versions, { ruleType: "exam_theory", licenseCode: "B", acquisition: "first", on: new Date("2025-06-01") })?.rules.max_error_points).toBe(10);
    expect(resolveRule(versions, { ruleType: "exam_theory", licenseCode: "B", acquisition: "first", on: new Date("2026-06-01") })?.rules.max_error_points).toBe(8);
  });
});

describe("training", () => {
  it("berechnet Sonderfahrten-Fortschritt", () => {
    const p = trainingProgress({ unit_minutes: 45, special_drives: { overland: 5, motorway: 4, night: 3 } }, { overland: 3, motorway: 4 });
    expect(p.special_drives.find((d) => d.kind === "overland")?.remaining_units).toBe(2);
    expect(p.special_drives_percent).toBe(58);
    expect(p.all_special_drives_done).toBe(false);
  });
  it("prüft B197-Schaltanforderung", () => {
    const p = trainingProgress({ unit_minutes: 45, special_drives: {}, manual_transmission_lessons_min: 10 }, {}, 9);
    expect(p.manual_requirement_met).toBe(false);
  });
  it("zählt Theorie-Einheiten ohne Doppelungen", () => {
    const p = theoryLessonsProgress({ unit_minutes: 90, basic_units: 12, class_specific_units: 2 }, ["G1", "G1", "G2", "B1"]);
    expect(p.basic_attended).toBe(2);
    expect(p.class_specific_attended).toBe(1);
    expect(p.percent).toBe(21);
  });
});
