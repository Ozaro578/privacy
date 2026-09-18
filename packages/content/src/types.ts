// Typen der eigenen Übungsinhalte (Klasse B, Deutschland). Alle Inhalte sind eigene Formulierungen
// (source "own") und werden im Produkt als "Übungsfrage (kein amtlicher Prüfungsinhalt)" gekennzeichnet.

export const LEGAL_BASIS_DATE = "2026-09-01" as const;
export type LegalBasisDate = typeof LEGAL_BASIS_DATE;

export const CONTENT_SOURCE = "own" as const;

/** Sichtbarer Hinweis im Produkt für jede Übungsfrage. */
export const PRACTICE_LABEL_DE = "Übungsfrage (kein amtlicher Prüfungsinhalt)";

export const TOPIC_CODES = [
  "gefahrenlehre",
  "recht",
  "verkehrszeichen",
  "strassenbenutzung",
  "vorfahrt",
  "verkehrsregelung",
  "geschwindigkeit",
  "andere_teilnehmer",
  "fahrmanoever",
  "kreisverkehr",
  "halten_parken",
  "besondere_situationen",
  "unfall_panne",
  "umwelt",
  "alkohol_drogen",
  "fahrzeugtechnik",
  "beleuchtung",
  "befoerderung",
  "fahrphysik",
] as const;
export type TopicCode = (typeof TOPIC_CODES)[number];

export type MaterialKind = "basic" | "class_specific";
export type ReviewStatus = "published" | "needs_verification";
export type QuestionKind = "multiple_choice" | "numeric";
export type Points = 2 | 3 | 4 | 5;

export interface TopicMeta {
  code: TopicCode;
  nameDe: string;
  materialKind: MaterialKind;
  /** Mindestanzahl Fragen laut Inhaltsplan (Grundstoff 8, Zusatzstoff 6). */
  minQuestions: number;
  sortOrder: number;
}

export interface Answer {
  text: string;
  correct: boolean;
  explanation?: string;
}

export interface Question {
  /** Stabiler Code, z. B. "own-vorfahrt-001". */
  code: string;
  topic: TopicCode;
  materialKind: MaterialKind;
  /** Leer = alle Klassen. */
  licenseCodes: string[];
  /** 5 Punkte nur bei Vorfahrt oder Tag "hohes_risiko". */
  points: Points;
  /** 0 = sehr leicht, 1 = sehr schwer. */
  difficulty: number;
  tags: string[];
  text: string;
  /** 2 bis 4 Antworten mit 1 bis 3 richtigen; bei numeric leer. */
  answers: Answer[];
  explanation: string;
  mnemonic?: string;
  legalReference?: string;
  legalBasisDate: LegalBasisDate;
  reviewStatus: ReviewStatus;
  kind: QuestionKind;
  numericAnswer?: number;
  tolerance?: number;
  /** Optionale Einheit für numerische Fragen (z. B. "m"). */
  unit?: string;
}

export interface Chapter {
  topic: TopicCode;
  title: string;
  bodyMarkdown: string;
  estimatedMinutes: number;
  licenseCodes: string[];
  legalBasisDate: LegalBasisDate;
  source: string;
  reviewStatus: ReviewStatus;
}

export interface KnowledgeEntry {
  slug: string;
  title: string;
  topic: TopicCode;
  summary: string;
  bodyMarkdown: string;
  legalReference: string;
  legalBasisDate: LegalBasisDate;
  licenseCodes: string[];
  source: string;
  reviewStatus: ReviewStatus;
}

export const PRACTICAL_CATEGORIES = [
  "lighting",
  "tires",
  "brakes",
  "fluids",
  "warning_lights",
  "steering",
  "safety_equipment",
  "general",
] as const;
export type PracticalCategory = (typeof PRACTICAL_CATEGORIES)[number];

export interface PracticalQuestion {
  category: PracticalCategory;
  question: string;
  /** 3 bis 6 Stichpunkte, die eine vollständige Antwort enthalten muss. */
  expectedPoints: string[];
  explanation: string;
  licenseCodes: string[];
  legalBasisDate: LegalBasisDate;
  source: string;
  reviewStatus: ReviewStatus;
}
