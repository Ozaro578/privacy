// Öffentliche Schnittstelle von @fahrpilot/content: eigene Übungsinhalte Klasse B (Stand September 2026).
export * from "./types.js";
export { TOPICS, TOPIC_BY_CODE, CLASS_B_CODES, materialKindOf, defaultLicenseCodes } from "./topics.js";
export { questions } from "./questions.de.js";
export { chapters } from "./chapters.de.js";
export { knowledgeEntries } from "./knowledge.de.js";
export { practicalQuestions } from "./practical-questions.de.js";
export { MEDIA, QUESTION_MEDIA, mediaById, mediaForQuestion, mediaPublicPath, PUBLIC_MEDIA_PREFIX, type MediaItem, type MediaKind } from "./media.js";

import { chapters } from "./chapters.de.js";
import { knowledgeEntries } from "./knowledge.de.js";
import { practicalQuestions } from "./practical-questions.de.js";
import { questions } from "./questions.de.js";
import { MEDIA, QUESTION_MEDIA, QUESTION_MEDIA_A } from "./media.js";
import { TOPICS, TOPIC_BY_CODE } from "./topics.js";
import { LEGAL_BASIS_DATE, PRACTICAL_CATEGORIES, TOPIC_CODES, type Question, type TopicCode } from "./types.js";

/** Fragen gruppiert nach Themen-Code (jedes Thema ist enthalten, ggf. mit leerer Liste). */
export function byTopic(list: readonly Question[] = questions): Record<TopicCode, Question[]> {
  const out = Object.fromEntries(TOPIC_CODES.map((c) => [c, [] as Question[]])) as Record<TopicCode, Question[]>;
  for (const q of list) out[q.topic].push(q);
  return out;
}

const DASH_RE = /[–—]/; // Gedankenstriche (– und —) sind in Inhalten nicht erlaubt.
const TOPIC_SET: ReadonlySet<string> = new Set(TOPIC_CODES);
const CATEGORY_SET: ReadonlySet<string> = new Set(PRACTICAL_CATEGORIES);

function checkDash(problems: string[], where: string, ...texts: (string | undefined)[]): void {
  for (const t of texts) if (t !== undefined && DASH_RE.test(t)) problems.push(`${where}: enthält Gedankenstrich`);
}

/** Prüft alle Inhalte auf strukturelle Konsistenz und liefert eine Liste von Problemen (leer = alles in Ordnung). */
export function validateContent(): string[] {
  const problems: string[] = [];

  const codes = new Set<string>();
  for (const q of questions) {
    const w = `Frage ${q.code}`;
    if (codes.has(q.code)) problems.push(`${w}: Code doppelt`);
    codes.add(q.code);
    if (!TOPIC_SET.has(q.topic)) problems.push(`${w}: ungültiges Thema ${q.topic}`);
    const codeMatch = /^own-([a-z_]+)-(\d{3}|z[a-z0-9._-]+)$/.exec(q.code);
    if (!codeMatch) problems.push(`${w}: Code entspricht nicht own-<thema>-NNN oder own-<thema>-z<zeichen>`);
    else if (codeMatch[1] !== q.topic) problems.push(`${w}: Code passt nicht zum Thema ${q.topic}`);
    if (q.materialKind !== TOPIC_BY_CODE[q.topic]?.materialKind) problems.push(`${w}: materialKind passt nicht zum Thema`);
    if (![2, 3, 4, 5].includes(q.points)) problems.push(`${w}: Punkte müssen 2..5 sein`);
    if (q.points === 5 && q.topic !== "vorfahrt" && !q.tags.includes("hohes_risiko")) problems.push(`${w}: 5 Punkte nur bei Vorfahrt oder Tag hohes_risiko`);
    if (!(q.difficulty >= 0 && q.difficulty <= 1)) problems.push(`${w}: difficulty außerhalb 0..1`);
    if (q.legalBasisDate !== LEGAL_BASIS_DATE) problems.push(`${w}: legalBasisDate abweichend`);
    if (q.text.trim().length === 0) problems.push(`${w}: leerer Fragetext`);
    if (q.explanation.trim().length === 0) problems.push(`${w}: leere Erklärung`);
    if (q.tags.length === 0) problems.push(`${w}: keine Tags`);
    if (q.kind === "numeric") {
      if (q.answers.length !== 0) problems.push(`${w}: numerische Frage darf keine Antworten haben`);
      if (typeof q.numericAnswer !== "number" || !Number.isFinite(q.numericAnswer)) problems.push(`${w}: numericAnswer fehlt`);
      if (typeof q.tolerance !== "number" || q.tolerance < 0) problems.push(`${w}: tolerance fehlt oder negativ`);
    } else {
      if (q.answers.length < 2 || q.answers.length > 4) problems.push(`${w}: 2 bis 4 Antworten erforderlich`);
      const correct = q.answers.filter((a) => a.correct).length;
      if (correct < 1 || correct > 3) problems.push(`${w}: 1 bis 3 richtige Antworten erforderlich`);
      if (correct === q.answers.length) problems.push(`${w}: mindestens eine falsche Antwort erforderlich`);
      if (q.numericAnswer !== undefined || q.tolerance !== undefined) problems.push(`${w}: numerische Felder nur bei kind numeric`);
      const texts = new Set(q.answers.map((a) => a.text));
      if (texts.size !== q.answers.length) problems.push(`${w}: doppelte Antworttexte`);
    }
    checkDash(problems, w, q.text, q.explanation, q.mnemonic, ...q.answers.flatMap((a) => [a.text, a.explanation]));
  }
  for (const t of TOPICS) {
    const n = questions.filter((q) => q.topic === t.code).length;
    if (n < t.minQuestions) problems.push(`Thema ${t.code}: ${n} Fragen, mindestens ${t.minQuestions} erforderlich`);
  }

  const chapterTopics = new Set<string>();
  for (const c of chapters) {
    const w = `Kapitel ${c.topic}`;
    if (!TOPIC_SET.has(c.topic)) problems.push(`${w}: ungültiges Thema`);
    if (chapterTopics.has(c.topic)) problems.push(`${w}: doppelt`);
    chapterTopics.add(c.topic);
    const words = c.bodyMarkdown.split(/\s+/).filter(Boolean).length;
    if (words < 250 || words > 500) problems.push(`${w}: ${words} Wörter, erlaubt sind 250 bis 500`);
    if (c.legalBasisDate !== LEGAL_BASIS_DATE) problems.push(`${w}: legalBasisDate abweichend`);
    checkDash(problems, w, c.title, c.bodyMarkdown);
  }
  for (const t of TOPICS) if (!chapterTopics.has(t.code)) problems.push(`Thema ${t.code}: kein Kapitel`);

  const slugs = new Set<string>();
  for (const e of knowledgeEntries) {
    const w = `Wissen ${e.slug}`;
    if (slugs.has(e.slug)) problems.push(`${w}: Slug doppelt`);
    slugs.add(e.slug);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.slug)) problems.push(`${w}: ungültiger Slug`);
    if (!TOPIC_SET.has(e.topic)) problems.push(`${w}: ungültiges Thema`);
    if (e.legalReference.trim().length === 0) problems.push(`${w}: legalReference fehlt`);
    if (e.summary.trim().length === 0) problems.push(`${w}: summary fehlt`);
    if (e.legalBasisDate !== LEGAL_BASIS_DATE) problems.push(`${w}: legalBasisDate abweichend`);
    checkDash(problems, w, e.title, e.summary, e.bodyMarkdown);
  }

  const practicalKeys = new Set<string>();
  for (const p of practicalQuestions) {
    const w = `Prüferfrage "${p.question.slice(0, 40)}"`;
    if (!CATEGORY_SET.has(p.category)) problems.push(`${w}: ungültige Kategorie ${p.category}`);
    if (p.expectedPoints.length < 3 || p.expectedPoints.length > 6) problems.push(`${w}: 3 bis 6 Stichpunkte erforderlich`);
    if (practicalKeys.has(p.question)) problems.push(`${w}: doppelt`);
    practicalKeys.add(p.question);
    if (p.legalBasisDate !== LEGAL_BASIS_DATE) problems.push(`${w}: legalBasisDate abweichend`);
    checkDash(problems, w, p.question, p.explanation, ...p.expectedPoints);
  }

  const mediaIds = new Set(MEDIA.map((m) => m.id));
  for (const m of MEDIA) {
    if (!/^(signs|scenes)\/[A-Za-z0-9_.-]+\.svg$/.test(m.file)) problems.push(`Medium ${m.id}: ungültiger Dateipfad ${m.file}`);
    if (m.alt.trim().length < 10) problems.push(`Medium ${m.id}: Alternativtext fehlt oder zu kurz`);
  }
  for (const [code, id] of [...Object.entries(QUESTION_MEDIA), ...Object.entries(QUESTION_MEDIA_A)]) {
    if (!codes.has(code)) problems.push(`Medienzuordnung ${code}: unbekannter Fragecode`);
    if (!mediaIds.has(id)) problems.push(`Medienzuordnung ${code}: unbekanntes Medium ${id}`);
  }

  return problems;
}
export * from "./signs.js";
export { priorityScenarios, type PriorityScenario, type PriorityVehicle } from "./vorfahrt-trainer.js";
