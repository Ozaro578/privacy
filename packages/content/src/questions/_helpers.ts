// Hilfsfunktionen zum kompakten Formulieren der Übungsfragen.
import { defaultLicenseCodes, materialKindOf } from "../topics.js";
import { LEGAL_BASIS_DATE, type Answer, type Question } from "../types.js";

export type Draft = Omit<Question, "legalBasisDate" | "kind" | "reviewStatus" | "materialKind" | "licenseCodes"> &
  Partial<Pick<Question, "kind" | "reviewStatus" | "materialKind" | "licenseCodes">>;

/** Ergänzt Standardwerte (Rechtsstand, Stoffart, Klassen) für eine Frage. */
export function q(d: Draft): Question {
  const materialKind = d.materialKind ?? materialKindOf(d.topic);
  return {
    legalBasisDate: LEGAL_BASIS_DATE,
    kind: "multiple_choice",
    reviewStatus: "published",
    ...d,
    materialKind,
    licenseCodes: d.licenseCodes ?? defaultLicenseCodes(materialKind),
  };
}

/** Richtige Antwort. */
export function t(text: string, explanation?: string): Answer {
  return explanation === undefined ? { text, correct: true } : { text, correct: true, explanation };
}

/** Falsche Antwort. */
export function f(text: string, explanation?: string): Answer {
  return explanation === undefined ? { text, correct: false } : { text, correct: false, explanation };
}
