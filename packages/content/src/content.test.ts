import { describe, expect, it } from "vitest";
import { chapters } from "./chapters.de.js";
import { byTopic, validateContent } from "./index.js";
import { knowledgeEntries } from "./knowledge.de.js";
import { practicalQuestions } from "./practical-questions.de.js";
import { questions } from "./questions.de.js";
import { TOPICS } from "./topics.js";
import { LEGAL_BASIS_DATE, PRACTICAL_CATEGORIES, TOPIC_CODES } from "./types.js";

const DASH = /[–—]/;
const topicSet = new Set<string>(TOPIC_CODES);

function sentences(text: string): number {
  return text.split(/[.!?](?:\s+|$)/).filter((s) => s.trim().length > 0).length;
}

describe("Übungsfragen", () => {
  it("enthält mindestens 160 Fragen", () => {
    expect(questions.length).toBeGreaterThanOrEqual(160);
  });

  it("deckt jedes Thema mit der Mindestanzahl ab (Grundstoff 8, Zusatzstoff 6)", () => {
    const grouped = byTopic();
    for (const t of TOPICS) {
      expect(grouped[t.code].length, t.code).toBeGreaterThanOrEqual(t.minQuestions);
    }
  });

  it("hat eindeutige, stabile Codes im Format own-<thema>-NNN", () => {
    const codes = questions.map((q) => q.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const q of questions) {
      expect(q.code).toMatch(/^own-[a-z_]+-\d{3}$/);
      expect(q.code.startsWith(`own-${q.topic}-`)).toBe(true);
    }
  });

  it("verwendet nur gültige Themen-Codes und passende Stoffart", () => {
    for (const q of questions) {
      expect(topicSet.has(q.topic), q.code).toBe(true);
      const meta = TOPICS.find((t) => t.code === q.topic);
      expect(q.materialKind, q.code).toBe(meta?.materialKind);
    }
  });

  it("hat bei Multiple-Choice 2 bis 4 Antworten mit mindestens einer richtigen und einer falschen", () => {
    for (const q of questions.filter((x) => x.kind === "multiple_choice")) {
      expect(q.answers.length, q.code).toBeGreaterThanOrEqual(2);
      expect(q.answers.length, q.code).toBeLessThanOrEqual(4);
      const correct = q.answers.filter((a) => a.correct).length;
      expect(correct, q.code).toBeGreaterThanOrEqual(1);
      expect(correct, q.code).toBeLessThanOrEqual(3);
      expect(correct, q.code).toBeLessThan(q.answers.length);
    }
  });

  it("ist bei numerischen Fragen konsistent", () => {
    const numeric = questions.filter((q) => q.kind === "numeric");
    expect(numeric.length).toBeGreaterThan(0);
    for (const q of numeric) {
      expect(q.answers, q.code).toEqual([]);
      expect(typeof q.numericAnswer, q.code).toBe("number");
      expect(q.tolerance, q.code).toBeGreaterThanOrEqual(0);
    }
    for (const q of questions.filter((x) => x.kind === "multiple_choice")) {
      expect(q.numericAnswer, q.code).toBeUndefined();
    }
  });

  it("vergibt 2 bis 5 Punkte, 5 nur bei Vorfahrt oder hohem Risiko", () => {
    for (const q of questions) {
      expect(q.points, q.code).toBeGreaterThanOrEqual(2);
      expect(q.points, q.code).toBeLessThanOrEqual(5);
      if (q.points === 5) expect(q.topic === "vorfahrt" || q.tags.includes("hohes_risiko"), q.code).toBe(true);
      expect(q.difficulty, q.code).toBeGreaterThanOrEqual(0);
      expect(q.difficulty, q.code).toBeLessThanOrEqual(1);
    }
  });

  it("enthält keine Gedankenstriche und trägt den Rechtsstand", () => {
    for (const q of questions) {
      const texts = [q.text, q.explanation, q.mnemonic ?? "", ...q.answers.flatMap((a) => [a.text, a.explanation ?? ""])];
      for (const t of texts) expect(t, q.code).not.toMatch(DASH);
      expect(q.legalBasisDate).toBe(LEGAL_BASIS_DATE);
      expect(q.tags.length, q.code).toBeGreaterThan(0);
    }
  });

  it("nutzt die vereinbarten Schlagwörter", () => {
    const all = new Set(questions.flatMap((q) => q.tags));
    for (const tag of ["rechts_vor_links", "vorfahrt_beschildert", "halten", "parken", "innerorts", "ausserorts", "bremsweg", "anhalteweg"]) {
      expect(all.has(tag), tag).toBe(true);
    }
  });
});

describe("Lernkapitel", () => {
  it("hat genau ein Kapitel je Thema mit 250 bis 500 Wörtern", () => {
    expect(new Set(chapters.map((c) => c.topic)).size).toBe(TOPIC_CODES.length);
    expect(chapters.length).toBe(TOPIC_CODES.length);
    for (const c of chapters) {
      const words = c.bodyMarkdown.split(/\s+/).filter(Boolean).length;
      expect(words, c.topic).toBeGreaterThanOrEqual(250);
      expect(words, c.topic).toBeLessThanOrEqual(500);
      expect(c.bodyMarkdown, c.topic).not.toMatch(DASH);
      expect(c.source).toBe("own");
      expect(c.legalBasisDate).toBe(LEGAL_BASIS_DATE);
    }
  });
});

describe("Wissensbasis", () => {
  it("hat mindestens 60 Einträge mit eindeutigen Slugs", () => {
    expect(knowledgeEntries.length).toBeGreaterThanOrEqual(60);
    const slugs = knowledgeEntries.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("hat je Eintrag Thema, Rechtsquelle und 3 bis 8 Sätze", () => {
    for (const e of knowledgeEntries) {
      expect(topicSet.has(e.topic), e.slug).toBe(true);
      expect(e.legalReference.length, e.slug).toBeGreaterThan(0);
      const n = sentences(e.bodyMarkdown);
      expect(n, e.slug).toBeGreaterThanOrEqual(3);
      expect(n, e.slug).toBeLessThanOrEqual(8);
      expect(e.bodyMarkdown, e.slug).not.toMatch(DASH);
      expect(e.source).toBe("own");
    }
  });

  it("deckt jedes Thema ab", () => {
    const covered = new Set(knowledgeEntries.map((e) => e.topic));
    for (const t of TOPIC_CODES) expect(covered.has(t), t).toBe(true);
  });
});

describe("Prüferfragen", () => {
  it("hat mindestens 40 Fragen mit gültiger Kategorie und 3 bis 6 Stichpunkten", () => {
    expect(practicalQuestions.length).toBeGreaterThanOrEqual(40);
    const cats = new Set<string>(PRACTICAL_CATEGORIES);
    const seen = new Set<string>();
    for (const p of practicalQuestions) {
      expect(cats.has(p.category), p.question).toBe(true);
      expect(p.expectedPoints.length, p.question).toBeGreaterThanOrEqual(3);
      expect(p.expectedPoints.length, p.question).toBeLessThanOrEqual(6);
      expect(seen.has(p.question), p.question).toBe(false);
      seen.add(p.question);
      for (const t of [p.question, p.explanation, ...p.expectedPoints]) expect(t).not.toMatch(DASH);
    }
  });

  it("deckt jede Kategorie ab", () => {
    const covered = new Set(practicalQuestions.map((p) => p.category));
    for (const c of PRACTICAL_CATEGORIES) expect(covered.has(c), c).toBe(true);
  });
});

describe("validateContent", () => {
  it("meldet keine Probleme", () => {
    expect(validateContent()).toEqual([]);
  });
});

describe("Bildmedien", () => {
  it("jede zugeordnete Datei existiert und ist ein SVG mit Titel", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { MEDIA, QUESTION_MEDIA } = await import("./media.js");
    for (const m of MEDIA) {
      const file = path.resolve(import.meta.dirname, "..", "media", m.file);
      expect(fs.existsSync(file), m.file).toBe(true);
      const svg = fs.readFileSync(file, "utf8");
      expect(svg.startsWith("<svg"), m.file).toBe(true);
      expect(svg.includes("<title>"), m.file).toBe(true);
      expect(svg.includes("<script"), m.file).toBe(false);
    }
    expect(Object.keys(QUESTION_MEDIA).length).toBeGreaterThanOrEqual(80);
  });

  it("Vorfahrt- und Verkehrszeichen-Fragen haben durchgehend Bilder", async () => {
    const { mediaForQuestion } = await import("./media.js");
    for (const q of questions) {
      if (q.topic === "verkehrszeichen" || (q.topic === "vorfahrt" && q.code !== "own-vorfahrt-009")) expect(mediaForQuestion(q.code), q.code).toBeDefined();
    }
  });
});
