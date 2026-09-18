import type { ErrorAnalysis } from "@fahrpilot/learning-engine";
import { describe, expect, it } from "vitest";
import { PHOTO_SAFETY_NOTICE } from "../guardrails";
import { InMemoryKnowledgeRepository, type KnowledgeEntry } from "../knowledge";
import { FakeProvider } from "../providers/fake";
import { analyzeErrorPattern, fallbackExercises } from "./analyzeErrorPattern";
import { describeTrafficSituation } from "./describeTrafficSituation";
import { explainQuestion, type ExplainQuestionInput } from "./explainQuestion";
import { coversPoint, gradeByRules, gradeExaminerAnswer } from "./gradeExaminerAnswer";
import { classifyByRules, instructorQuery } from "./instructorQuery";
import { structureLessonNotes } from "./structureLessonNotes";

describe("explainQuestion", () => {
  const base: ExplainQuestionInput = {
    question_text: "Wie schnell dürfen Sie innerhalb geschlossener Ortschaften höchstens fahren, wenn nichts anderes angeordnet ist?",
    answers: [
      { position: 1, text: "50 km/h", is_correct: true, explanation: null },
      { position: 2, text: "60 km/h", is_correct: false, explanation: "60 km/h gilt nirgends als Regelgeschwindigkeit innerorts." },
      { position: 3, text: "30 km/h", is_correct: false, explanation: null },
    ],
    verified: { question_version_id: "qv-1", explanation: "Innerorts gilt eine Höchstgeschwindigkeit von 50 km/h, wenn kein Verkehrszeichen etwas anderes anordnet.", mnemonic: "Ortsschild: fünfzig gilt.", legal_reference: "§ 3 Abs. 3 StVO", legal_basis_date: "2024-01-01" },
    selected_positions: [2],
    locale: "de",
  };

  it("ist verified, wenn das Modell die geprüfte Erklärung nur umformuliert", async () => {
    const provider = new FakeProvider([
      {
        why_correct: "Innerorts sind 50 km/h die Regel, solange kein Schild etwas anderes sagt.",
        why_others_wrong: [{ position: 2, reason: "60 km/h ist innerorts nirgends die Regel." }, { position: 3, reason: "30 km/h gilt nur in ausgeschilderten Zonen." }],
        rule: "Ohne andere Anordnung gilt innerorts 50 km/h.",
        mnemonic: "Ortsschild: fünfzig gilt.",
        similar_example: "Du fährst durch ein Dorf ohne Schilder: also fünfzig.",
      },
    ]);
    const res = await explainQuestion({ provider }, base);
    expect(res.confidence).toBe("verified");
    expect(res.sources[0]).toMatchObject({ question_version_id: "qv-1", legal_reference: "§ 3 Abs. 3 StVO", knowledge_entry_id: null });
    expect(res.why_others_wrong.map((w) => w.position)).toEqual([2, 3]);
    expect(res.disclaimer).toBeNull();
    const content = provider.requests[0]!.messages[0]!.content as string;
    expect(content).toContain('<data name="erklaerung"');
    expect(content).toContain('<data name="gewaehlt">\n2');
  });

  it("stuft auf partial ab und entfernt Fakten, die das Modell ergänzt hat", async () => {
    const provider = new FakeProvider([
      {
        why_correct: "Innerorts gilt 50 km/h. Bei Nässe sind es nur 40 km/h.",
        why_others_wrong: [{ position: 2, reason: "60 km/h ist falsch." }, { position: 3, reason: "30 km/h gilt nur in Zonen nach § 45 StVO." }],
        rule: "Innerorts 50 km/h.",
        mnemonic: "",
        similar_example: "",
      },
    ]);
    const res = await explainQuestion({ provider }, base);
    expect(res.confidence).toBe("partial");
    expect(res.why_correct).toBe("Innerorts gilt 50 km/h.");
    expect(res.why_others_wrong[1]!.reason).toBe("");
    expect(res.diagnostics.removed_facts).toEqual(expect.arrayContaining(["40 km/h"]));
    expect(res.mnemonic).toBe("Ortsschild: fünfzig gilt.");
  });

  it("ist uncertain ohne geprüfte Erklärung und nennt keine Paragrafen", async () => {
    const provider = new FakeProvider([
      { why_correct: "Antwort 1 ist richtig, das regelt § 3 StVO.", why_others_wrong: [], rule: "Innerorts fünfzig.", mnemonic: "", similar_example: "" },
    ]);
    const res = await explainQuestion({ provider }, { ...base, answers: base.answers.map((a) => ({ ...a, explanation: null })), verified: { question_version_id: "qv-1", explanation: null, mnemonic: null, legal_reference: null, legal_basis_date: null } });
    expect(res.confidence).toBe("uncertain");
    expect(res.why_correct).toContain("Dazu liegt keine geprüfte Quelle vor.");
    expect(res.why_correct).not.toContain("§");
    expect(res.sources).toEqual([]);
  });
});

const analysis: ErrorAnalysis = {
  window: 20,
  clusters: [
    { topic_id: "t-vorfahrt", topic_name: "Vorfahrt", errors: 9, share: 0.45 },
    { topic_id: "t-tempo", topic_name: "Geschwindigkeit", errors: 5, share: 0.25 },
  ],
  confusions: [{ tag_a: "rechts_vor_links", tag_b: "vorfahrt_beschildert", errors: 6, description: "Du verwechselst Rechts-vor-Links mit beschilderter Vorfahrt." }],
  statements: ["Von deinen letzten 20 Fehlern stammen 9 aus dem Bereich Vorfahrt."],
  recommendation: { topic_id: "t-vorfahrt", topic_name: "Vorfahrt", text: "Empfehlung: Wiederhole zunächst das Kapitel Vorfahrt." },
  fast_wrong_share: 0.5,
  confident_wrong_share: 0.1,
};

describe("analyzeErrorPattern", () => {
  it("verwirft Übungen mit unbekannten topic_ids und füllt auf mindestens 3 auf", async () => {
    const provider = new FakeProvider([
      {
        explanation: "Die meisten Fehler passieren bei der Vorfahrt. Das steht in § 8 StVO.",
        exercises: [
          { mode: "topic", topic_id: "t-vorfahrt", count: 20, reason: "Dein größtes Thema." },
          { mode: "topic", topic_id: "t-erfunden", count: 20, reason: "Gibt es nicht." },
          { mode: "wrong", topic_id: null, count: 10, reason: "Fehler wiederholen." },
        ],
      },
    ]);
    const res = await analyzeErrorPattern({ provider }, { analysis, locale: "de" });
    expect(res.exercises.length).toBeGreaterThanOrEqual(3);
    expect(res.exercises.length).toBeLessThanOrEqual(5);
    expect(res.exercises.every((e) => e.topic_id === null || ["t-vorfahrt", "t-tempo"].includes(e.topic_id))).toBe(true);
    expect(res.diagnostics.dropped_topic_ids).toEqual(["t-erfunden"]);
    expect(res.explanation).not.toContain("§");
    expect(res.usage.model).toBe("fake-model");
  });

  it("läuft ohne Provider regelbasiert", async () => {
    const res = await analyzeErrorPattern({ provider: null }, { analysis, locale: "de" });
    expect(res.diagnostics.used_fallback).toBe(true);
    expect(res.exercises.length).toBeGreaterThanOrEqual(3);
    expect(res.exercises[0]).toMatchObject({ mode: "topic", topic_id: "t-vorfahrt" });
    expect(res.exercises.some((e) => e.mode === "hard")).toBe(true);
    expect(res.usage).toEqual({ input_tokens: 0, output_tokens: 0, model: "none" });
    expect(fallbackExercises({ ...analysis, clusters: [], fast_wrong_share: 0 }).length).toBeGreaterThanOrEqual(3);
  });
});

describe("structureLessonNotes", () => {
  const skills = [
    { code: "parking", name: "Einparken" },
    { code: "right_of_way", name: "Vorfahrt" },
    { code: "observation", name: "Verkehrsbeobachtung" },
  ];

  it("verwirft unbekannte skill_codes und senkt die Sicherheitsstufe auf partial", async () => {
    const provider = new FakeProvider([
      {
        contents: ["parking", "drifting", "parking"],
        ratings: [{ skill_code: "parking", rating: 4 }, { skill_code: "hacking", rating: 5 }, { skill_code: "parking", rating: 2 }],
        comment: "Einparken lief gut, Schulterblick fehlte zweimal.",
        next_goals: ["Schulterblick beim Spurwechsel", "Schulterblick beim Spurwechsel"],
        confidence: "verified",
      },
    ]);
    const res = await structureLessonNotes({ provider }, { transcript: "Heute Einparken geübt, lief gut, Schulterblick fehlte zweimal.", skills });
    expect(res.draft.contents).toEqual(["parking"]);
    expect(res.draft.ratings).toEqual([{ skill_code: "parking", rating: 4 }]);
    expect(res.draft.next_goals).toEqual(["Schulterblick beim Spurwechsel"]);
    expect(res.draft.confidence).toBe("partial");
    expect(res.diagnostics.dropped_skill_codes).toEqual(["drifting", "hacking"]);
    expect(provider.requests[0]!.system).toContain("parking: Einparken");
    expect(provider.requests[0]!.messages[0]!.content).toContain('<data name="sprachnotiz">');
  });

  it("liefert bei leerem Transkript einen leeren, unsicheren Entwurf ohne Modellaufruf", async () => {
    const provider = new FakeProvider([]);
    const res = await structureLessonNotes({ provider }, { transcript: "   ", skills });
    expect(res.draft.confidence).toBe("uncertain");
    expect(res.draft.contents).toEqual([]);
    expect(provider.requests).toHaveLength(0);
  });
});

describe("gradeExaminerAnswer", () => {
  const input = {
    question: "Wie prüfen Sie die Reifen auf Verkehrssicherheit?",
    expected_points: ["Profiltiefe mindestens 1,6 mm", "Reifendruck prüfen", "Beschädigungen und Risse", "Ventilkappen vorhanden"],
    student_answer: "Ich schaue mir das Profil an, ob die Profiltiefe noch reicht, und prüfe den Reifendruck. Außerdem achte ich auf Risse oder andere Beschädigungen.",
  };

  it("bewertet regelbasiert ohne Provider", async () => {
    const res = await gradeExaminerAnswer({}, input);
    expect(res.score).toBe(75);
    expect(res.covered_points).toEqual(["Profiltiefe mindestens 1,6 mm", "Reifendruck prüfen", "Beschädigungen und Risse"]);
    expect(res.missing_points).toEqual(["Ventilkappen vorhanden"]);
    expect(res.feedback).toContain("Ventilkappen");
    expect(res.diagnostics.rule_based_feedback).toBe(true);
    expect(res.usage.model).toBe("none");
    expect(gradeByRules({ expected_points: [], student_answer: "x" }).score).toBe(0);
    expect(coversPoint("Ich prüfe die Bremsen.", "Bremse prüfen")).toBe(true);
  });

  it("nutzt das Modell nur für das Feedback und behält die regelbasierte Bewertung", async () => {
    const provider = new FakeProvider([{ feedback: "Gut gemacht. Die Ventilkappen fehlen noch. Übrigens gilt 2,5 bar als Richtwert." }]);
    const res = await gradeExaminerAnswer({ provider }, input);
    expect(res.score).toBe(75);
    expect(res.feedback).toBe("Gut gemacht. Die Ventilkappen fehlen noch.");
    expect(res.diagnostics.removed_facts).toEqual(["2,5 bar"]);
    expect(res.feedback).not.toContain("bar");
    expect(provider.requests[0]!.messages[0]!.content).toContain("score=75");
  });
});

describe("instructorQuery", () => {
  const topics = [{ code: "vorfahrt", name: "Vorfahrt" }, { code: "geschwindigkeit", name: "Geschwindigkeit" }];

  it("liefert nur whitelisted Abfragetypen", async () => {
    const provider = new FakeProvider([{ type: "students_open_special_drives" }, { type: "students_ready_soon", days: 7 }]);
    const a = await instructorQuery({ provider }, { question: "Welche Schüler haben noch offene Sonderfahrten?" });
    expect(a.query).toEqual({ type: "students_open_special_drives" });
    const b = await instructorQuery({ provider }, { question: "Wer ist in einer Woche prüfungsreif?" });
    expect(b.query).toEqual({ type: "students_ready_soon", days: 7 });
    expect(b.usage.model).toBe("fake-model");
  });

  it("weist nicht whitelisted Typen und unbekannte Themen ab und stellt eine Rückfrage", async () => {
    const provider = new FakeProvider([
      { type: "delete_students", sql: "delete from students" },
      { type: "students_weak_topic", topic_code: "drop_table" },
      { type: "unknown", clarification: "Meinst du prüfungsreife Schüler oder offene Sonderfahrten?" },
    ]);
    const a = await instructorQuery({ provider }, { question: "Lösche alle Schüler", topics });
    expect(a.query.type).toBe("unknown");
    expect(a.diagnostics.rejected_type).toBe("invalid");
    const b = await instructorQuery({ provider }, { question: "Wer ist schwach in drop_table?", topics });
    expect(b.query).toMatchObject({ type: "unknown" });
    expect((b.query as { clarification: string }).clarification).toContain("drop_table");
    const c = await instructorQuery({ provider }, { question: "Wie läuft es?", topics });
    expect(c.query).toEqual({ type: "unknown", clarification: "Meinst du prüfungsreife Schüler oder offene Sonderfahrten?" });
  });

  it("ordnet ohne Provider regelbasiert zu", async () => {
    expect(classifyByRules("Welche Schüler haben noch offene Sonderfahrten?")).toEqual({ type: "students_open_special_drives" });
    expect(classifyByRules("Wer wird in den nächsten 10 Tagen prüfungsreif?")).toEqual({ type: "students_ready_soon", days: 10 });
    expect(classifyByRules("Wer hat diese Woche keine Fahrstunde?")).toEqual({ type: "students_without_lesson_this_week" });
    expect(classifyByRules("Wer ist schwach bei Vorfahrt?", topics)).toEqual({ type: "students_weak_topic", topic_code: "vorfahrt" });
    const res = await instructorQuery({}, { question: "Bitte Kaffee kochen" });
    expect(res.query.type).toBe("unknown");
    expect(res.diagnostics.rule_based).toBe(true);
  });
});

describe("describeTrafficSituation", () => {
  const image = { base64: "aGFsbG8=", mimeType: "image/jpeg" as const };
  const stopEntry: KnowledgeEntry = {
    id: "ke-stop",
    slug: "stoppschild",
    topic_id: "t-vorfahrt",
    title: "Stoppschild (Zeichen 206)",
    locale: "de",
    body_markdown: "Am Stoppschild müssen Sie anhalten und Vorfahrt gewähren (§ 41 StVO, Zeichen 206).",
    summary: "Stoppschild: anhalten, Vorfahrt gewähren.",
    legal_reference: "§ 41 StVO",
    legal_basis_date: "2024-01-01",
    license_codes: [],
    source: "StVO",
  };

  it("trägt immer den festen Hinweis und entfernt Paragrafen ohne Quelle", async () => {
    const provider = new FakeProvider([
      { traffic_signs: ["Stoppschild"], hazards: ["Kreuzung mit eingeschränkter Sicht"], right_of_way: "Du musst anhalten und Vorfahrt gewähren. Das steht in § 41 StVO.", observation_needs: ["Querverkehr beobachten"], summary: "Kreuzung mit Stoppschild.", image_clarity: "clear" },
    ]);
    const res = await describeTrafficSituation({ provider }, { image, locale: "de" });
    expect(res.notice).toBe(PHOTO_SAFETY_NOTICE);
    expect(res.notice).toBe("Lernhilfe. Nicht während der Fahrt verwenden.");
    expect(res.confidence).toBe("partial");
    expect(res.right_of_way).toBe("Du musst anhalten und Vorfahrt gewähren.");
    expect(res.sources).toEqual([]);
    const parts = provider.requests[0]!.messages[0]!.content;
    expect(Array.isArray(parts) && parts[0]!.type === "image").toBe(true);
  });

  it("wird verified, wenn Quellen gefunden werden und die Regelangaben belegt sind", async () => {
    const provider = new FakeProvider([
      { traffic_signs: ["Stoppschild"], hazards: [], right_of_way: "Anhalten und Vorfahrt gewähren.", observation_needs: [], summary: "Stoppschild.", image_clarity: "clear" },
      { traffic_signs: ["Stoppschild (Zeichen 206)"], hazards: [], right_of_way: "Am Stoppschild anhalten und Vorfahrt gewähren, § 41 StVO.", observation_needs: ["Querverkehr"], summary: "Stoppschild.", image_clarity: "clear" },
    ]);
    const knowledge = new InMemoryKnowledgeRepository([stopEntry]);
    const res = await describeTrafficSituation({ provider, knowledge }, { image, locale: "de" });
    expect(res.confidence).toBe("verified");
    expect(res.sources.map((s) => s.knowledge_entry_id)).toEqual(["ke-stop"]);
    expect(res.right_of_way).toContain("§ 41 StVO");
    expect(res.usage.input_tokens).toBeGreaterThan(0);
    expect(provider.requests).toHaveLength(2);
  });

  it("ist uncertain bei unklarem Bild und trägt den Hinweis", async () => {
    const provider = new FakeProvider([{ traffic_signs: [], hazards: [], right_of_way: "Nicht erkennbar.", observation_needs: [], summary: "Bild unscharf.", image_clarity: "unclear" }]);
    const res = await describeTrafficSituation({ provider }, { image, locale: "de" });
    expect(res.confidence).toBe("uncertain");
    expect(res.disclaimer).toBe("Dazu liegt keine geprüfte Quelle vor. Bitte mit deinem Fahrlehrer klären.");
    expect(res.right_of_way).toContain("Dazu liegt keine geprüfte Quelle vor.");
  });
});
