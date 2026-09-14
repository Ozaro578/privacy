import { describe, expect, it } from "vitest";
import { analyzeErrors } from "./analysis";
import { badgeEarned, levelForXp, newlyEarnedBadges, updateStreak } from "./gamification";
import { overallMastery, topicMastery, type QuestionMeta } from "./mastery";
import { competencyProfile, forecastRemainingLessons } from "./practical";
import { computeReadiness, readinessBand } from "./readiness";
import { selectQuestions } from "./selection";
import { initialQuestionState, isDue, reviewQuestion } from "./srs";
import { planToday } from "./today";

const T0 = new Date("2026-09-14T10:00:00Z");
const h = (n: number) => new Date(T0.getTime() + n * 3_600_000);

describe("Spaced Repetition", () => {
  it("zeigt mehrfach falsche Fragen sehr bald erneut", () => {
    let s = initialQuestionState(T0);
    s = reviewQuestion(s, { correct: false, now: T0 });
    expect(new Date(s.due_at).getTime() - T0.getTime()).toBe(4 * 3_600_000);
    s = reviewQuestion(s, { correct: false, now: h(4) });
    expect(new Date(s.due_at).getTime() - h(4).getTime()).toBe(10 * 60_000);
    expect(s.mastery).toBeLessThan(0.3);
  });
  it("verlängert Intervalle bei sicheren richtigen Antworten", () => {
    let s = initialQuestionState(T0);
    s = reviewQuestion(s, { correct: true, confidence: 3, now: T0 });
    expect(s.interval_days).toBe(1);
    s = reviewQuestion(s, { correct: true, confidence: 3, now: h(24) });
    expect(s.interval_days).toBe(3);
    s = reviewQuestion(s, { correct: true, confidence: 3, now: h(96) });
    expect(s.interval_days).toBeGreaterThanOrEqual(6);
    s = reviewQuestion(s, { correct: true, confidence: 3, now: h(300) });
    expect(s.interval_days).toBeGreaterThan(10);
    expect(s.mastery).toBeGreaterThan(0.8);
    expect(isDue(s, h(301))).toBe(false);
  });
  it("halbiert das Intervall bei unsicher richtigen Antworten", () => {
    let s = initialQuestionState(T0);
    s = reviewQuestion(s, { correct: true, confidence: 3, now: T0 });
    s = reviewQuestion(s, { correct: true, confidence: 3, now: h(24) });
    const sure = reviewQuestion(s, { correct: true, confidence: 3, now: h(96) });
    const unsure = reviewQuestion(s, { correct: true, confidence: 1, now: h(96) });
    expect(unsure.interval_days).toBeLessThan(sure.interval_days);
  });
  it("bestraft sicher-falsche Antworten stärker als unsicher-falsche", () => {
    const base = reviewQuestion(initialQuestionState(T0), { correct: true, confidence: 2, now: T0 });
    const sureWrong = reviewQuestion(base, { correct: false, confidence: 3, now: h(1) });
    const unsureWrong = reviewQuestion(base, { correct: false, confidence: 1, now: h(1) });
    expect(sureWrong.ease).toBeLessThan(unsureWrong.ease);
  });
});

const questions: QuestionMeta[] = [
  { id: "q1", topic_id: "vorfahrt", points: 5, tags: ["rechts_vor_links"] },
  { id: "q2", topic_id: "vorfahrt", points: 5, tags: ["vorfahrt_beschildert"] },
  { id: "q3", topic_id: "vorfahrt", points: 4, tags: ["rechts_vor_links"] },
  { id: "q4", topic_id: "vorfahrt", points: 3, tags: ["vorfahrt_beschildert"] },
  { id: "q5", topic_id: "geschwindigkeit", points: 3 },
  { id: "q6", topic_id: "geschwindigkeit", points: 3 },
  { id: "q7", topic_id: "verkehrszeichen", points: 2, difficulty: 0.8 },
  { id: "q8", topic_id: "verkehrszeichen", points: 2 },
];
const topics = [{ id: "vorfahrt", name: "Vorfahrt" }, { id: "geschwindigkeit", name: "Geschwindigkeit" }, { id: "verkehrszeichen", name: "Verkehrszeichen" }];

function statesFrom(spec: Record<string, { attempts: number; correct: number; mastery: number; lastCorrect?: boolean; due?: Date }>) {
  const m = new Map<string, ReturnType<typeof initialQuestionState>>();
  for (const [id, s] of Object.entries(spec)) {
    m.set(id, { ...initialQuestionState(T0), attempts: s.attempts, correct: s.correct, mastery: s.mastery, last_correct: s.lastCorrect ?? s.correct > 0, due_at: (s.due ?? T0).toISOString() });
  }
  return m;
}

describe("Mastery und Fehleranalyse", () => {
  it("aggregiert Themen und markiert Schwächen", () => {
    const states = statesFrom({ q1: { attempts: 3, correct: 1, mastery: 0.3 }, q2: { attempts: 2, correct: 0, mastery: 0.2 }, q3: { attempts: 2, correct: 1, mastery: 0.5 }, q5: { attempts: 3, correct: 3, mastery: 0.9 }, q6: { attempts: 2, correct: 2, mastery: 0.85 } });
    const tm = topicMastery(questions, states);
    const v = tm.find((t) => t.topic_id === "vorfahrt")!;
    expect(v.weak).toBe(true);
    expect(v.coverage).toBe(0.75);
    expect(tm.find((t) => t.topic_id === "geschwindigkeit")!.weak).toBe(false);
    expect(overallMastery(tm)).toBeGreaterThan(0);
  });
  it("erzeugt konkrete Aussagen und erkennt Verwechslungsmuster", () => {
    const attempts = [] as Parameters<typeof analyzeErrors>[0];
    const push = (q: string, ok: boolean, i: number, conf?: number) => attempts.push({ question_id: q, is_correct: ok, answered_at: h(-i).toISOString(), confidence: conf ?? null, response_ms: 8000 });
    for (let i = 0; i < 11; i++) push(["q1", "q2", "q3", "q4"][i % 4]!, false, i, 3);
    for (let i = 11; i < 24; i++) push(i % 2 ? "q5" : "q7", false, i);
    for (let i = 24; i < 40; i++) push("q6", true, i);
    const a = analyzeErrors(attempts, new Map(questions.map((q) => [q.id, q])), topics);
    expect(a.window).toBe(24);
    expect(a.statements[0]).toBe("Von deinen letzten 24 Fehlern stammen 11 aus dem Bereich Vorfahrt.");
    expect(a.recommendation?.text).toBe("Empfehlung: Wiederhole zunächst das Kapitel Vorfahrt.");
    expect(a.confusions[0]?.description).toMatch(/Rechts-vor-Links/);
    expect(a.statements.some((s) => s.includes("sicher"))).toBe(true);
  });
});

describe("Fragenauswahl", () => {
  it("bevorzugt fällige und schwache Fragen und streut neue ein", () => {
    const states = statesFrom({ q1: { attempts: 2, correct: 0, mastery: 0.1, due: h(-1) }, q2: { attempts: 2, correct: 2, mastery: 0.9, due: h(48) }, q5: { attempts: 1, correct: 0, mastery: 0.2, due: h(-2) } });
    const sel = selectQuestions(questions, states, { mode: "review", limit: 5, now: T0, random: () => 0.42 });
    expect(sel.map((q) => q.id)).toEqual(["q1", "q5"]);
    const mixed = selectQuestions(questions, states, { mode: "daily_goal", limit: 4, now: T0, random: () => 0.42 });
    expect(mixed.slice(0, 2).map((q) => q.id).sort()).toEqual(["q1", "q5"]);
    expect(mixed.length).toBe(4);
  });
  it("filtert nach Modus", () => {
    const states = statesFrom({ q1: { attempts: 2, correct: 0, mastery: 0.1, lastCorrect: false }, q7: { attempts: 0, correct: 0, mastery: 0 } });
    expect(selectQuestions(questions, states, { mode: "wrong", limit: 10 }).map((q) => q.id)).toEqual(["q1"]);
    expect(selectQuestions(questions, states, { mode: "hard", limit: 10 }).map((q) => q.id).sort()).toEqual(["q1", "q7"]);
    expect(selectQuestions(questions, states, { mode: "unseen", limit: 10 })).toHaveLength(7);
    expect(selectQuestions(questions, states, { mode: "bookmarked", limit: 10, bookmarked: new Set(["q8"]) }).map((q) => q.id)).toEqual(["q8"]);
    expect(selectQuestions(questions, states, { mode: "topic", limit: 10, topicId: "geschwindigkeit" })).toHaveLength(2);
  });
});

describe("Prüfungsreife", () => {
  const base = { overallMastery: 0.9, topicCoverage: 0.95, weakTopicShare: 0.05, dueShare: 0.1, activeDaysLast14: 12, masteryDelta7d: 0.05, recentAccuracy: [0.9, 0.88, 0.92, 0.9], maxErrorPoints: 10 };
  it("bleibt ohne Simulation unter 60 und ohne bestandene unter 70", () => {
    expect(computeReadiness({ ...base, simulations: [] }).score).toBeLessThanOrEqual(59);
    expect(computeReadiness({ ...base, simulations: [{ passed: false, error_points: 14, submitted_at: T0.toISOString() }] }).score).toBeLessThanOrEqual(69);
  });
  it("erreicht grün nur mit mehreren bestandenen Simulationen", () => {
    const sims = Array.from({ length: 5 }, (_, i) => ({ passed: true, error_points: 3, submitted_at: h(-i * 24).toISOString() }));
    const r = computeReadiness({ ...base, simulations: sims });
    expect(r.score).toBeGreaterThanOrEqual(85);
    expect(r.band).toBe("green");
    expect(r.disclaimer).toMatch(/keine Garantie/);
    expect(r.factors.reduce((s, f) => s + f.weight, 0)).toBeCloseTo(1, 5);
  });
  it("ordnet Bänder korrekt zu", () => {
    expect(readinessBand(0).band).toBe("red");
    expect(readinessBand(39).band).toBe("red");
    expect(readinessBand(40).band).toBe("orange");
    expect(readinessBand(70).band).toBe("yellow_green");
    expect(readinessBand(85).band).toBe("green");
  });
});

describe("Praxis", () => {
  it("bildet Kompetenzprofil und größten Trainingsbedarf", () => {
    const skills = [{ code: "lane_change", name: "Fahrstreifenwechsel" }, { code: "turning", name: "Abbiegen" }, { code: "right_of_way", name: "Vorfahrt" }];
    const p = competencyProfile([
      { skill_code: "lane_change", rating: 2, rated_at: h(-48).toISOString() }, { skill_code: "lane_change", rating: 3, rated_at: h(-2).toISOString() },
      { skill_code: "turning", rating: 3, rated_at: h(-2).toISOString() }, { skill_code: "right_of_way", rating: 5, rated_at: h(-2).toISOString() },
    ], skills);
    expect(p.statement).toBe("Aktuell größter Trainingsbedarf: Fahrstreifenwechsel und Abbiegen.");
    expect(p.skills.find((s) => s.skill_code === "right_of_way")?.percent).toBe(100);
    expect(p.skills.find((s) => s.skill_code === "lane_change")?.trend).toBe(25);
  });
  it("prognostiziert Fahrstunden mit Disclaimer, aber erst bei genug Bewertungen", () => {
    expect(forecastRemainingLessons({ overall_percent: 60, rated_skills: 2, total_skills: 10, special_drives_remaining_units: 3, completed_practice_units: 10 })).toBeNull();
    const f = forecastRemainingLessons({ overall_percent: 70, rated_skills: 6, total_skills: 10, special_drives_remaining_units: 3, completed_practice_units: 10 })!;
    expect(f.min_units).toBeLessThan(f.max_units);
    expect(f.text).toMatch(/voraussichtlich noch etwa/);
    expect(f.disclaimer).toMatch(/Schätzung/);
  });
});

describe("Heute-Modus", () => {
  it("priorisiert Prüfung, Fahrstunde, Kopplung, Wiederholung, Dokument", () => {
    const items = planToday({
      now: T0, dueQuestions: 10, weakestTopic: { id: "geschwindigkeit", name: "Geschwindigkeit" },
      instructorFlaggedSkills: [{ skill_code: "right_of_way", topic_id: "vorfahrt", topic_name: "Vorfahrt", rated_at: h(-20).toISOString() }],
      nextLesson: { starts_at: h(24.5).toISOString(), instructor_name: "Max Mustermann" }, nextTheoryClass: null,
      missingDocuments: ["Passfoto"], theoryExamAt: h(24 * 5).toISOString(), practicalExamAt: null, openInvoiceCents: 61000,
      dailyGoalDone: false, learnedToday: false, streakDays: 4, readinessScore: 71,
    }, 6);
    expect(items[0]!.title).toBe("Theorieprüfung in 5 Tagen");
    expect(items[1]!.kind).toBe("coupling");
    expect(items[1]!.title).toBe("Vorfahrt-Training für heute");
    expect(items.some((i) => i.kind === "lesson" && i.title.startsWith("Morgen"))).toBe(true);
    expect(items.some((i) => i.kind === "document" && i.title.includes("Passfoto"))).toBe(true);
    expect(items).toHaveLength(6);
  });
});

describe("Gamification", () => {
  it("berechnet Level und Serien", () => {
    expect(levelForXp(0).level).toBe(1);
    expect(levelForXp(100).level).toBe(2);
    expect(levelForXp(399).level).toBe(2);
    expect(levelForXp(400).level).toBe(3);
    let s = updateStreak({ current_days: 0, longest_days: 0, last_active_date: null }, "2026-09-10");
    s = updateStreak(s, "2026-09-11");
    s = updateStreak(s, "2026-09-11");
    expect(s.current_days).toBe(2);
    s = updateStreak(s, "2026-09-13");
    expect(s.current_days).toBe(1);
    expect(s.longest_days).toBe(2);
  });
  it("vergibt Abzeichen nur einmal", () => {
    const badges = [{ code: "streak_7", criteria: { type: "streak_days" as const, value: 7 } }, { code: "topic_vorfahrt", criteria: { type: "topic_mastery" as const, value: 0.9, topic: "vorfahrt" } }];
    const stats = { streak_days: 7, correct_answers: 10, exam_simulations_passed: 0, topic_mastery: { vorfahrt: 0.95 } };
    expect(newlyEarnedBadges(badges, new Set(["streak_7"]), stats)).toEqual(["topic_vorfahrt"]);
    expect(badgeEarned({ type: "exam_simulations_passed", value: 5 }, stats)).toBe(false);
  });
});
