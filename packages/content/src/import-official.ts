// Import eines lizenzierten (amtlichen) Fragenkatalogs: normiertes Austauschformat, Validierung und Änderungserkennung.
// Das Lieferformat des Lizenzgebers wird vorab mit einem kleinen Mapper in dieses Format gebracht; alles Weitere
// (Versionierung, Gültigkeit, Medien, Lizenzfreischaltung) übernimmt scripts/import-official.ts.
import { createHash } from "node:crypto";
import { z } from "zod";
import { TOPIC_CODES } from "./types";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum als JJJJ-MM-TT");

export const OfficialMediaSchema = z.object({
  /** Dateiname relativ zum Medienordner der Lieferung, z. B. "1.1.02-003.mp4". */
  file: z.string().min(1).regex(/^[^/\\]+\.(png|jpg|jpeg|webp|svg|mp4|webm)$/i, "Dateiname mit Endung png, jpg, webp, svg, mp4 oder webm, ohne Pfad"),
  kind: z.enum(["image", "video"]),
  alt: z.string().min(3).max(500),
  credit: z.string().max(200).optional(),
});

export const OfficialAnswerSchema = z.object({
  text: z.string().min(1).max(1000),
  correct: z.boolean(),
  explanation: z.string().max(2000).optional(),
});

export const OfficialQuestionSchema = z.object({
  /** Amtliche Fragenummer, stabil über Lieferungen hinweg (z. B. "1.1.02-003"). */
  external_ref: z.string().min(1).max(40).regex(/^[A-Za-z0-9._-]+$/, "Fragenummer nur mit Buchstaben, Ziffern, Punkt, Bindestrich, Unterstrich"),
  topic: z.enum(TOPIC_CODES),
  material_kind: z.enum(["basic", "class_specific"]),
  /** Leer = alle Klassen des Stoffs. */
  license_codes: z.array(z.string().min(1).max(5)).default([]),
  points: z.number().int().min(2).max(5),
  kind: z.enum(["multiple_choice", "numeric", "video"]).default("multiple_choice"),
  difficulty: z.number().min(0).max(1).optional(),
  text: z.string().min(5).max(2000),
  answers: z.array(OfficialAnswerSchema).max(4).default([]),
  numeric_answer: z.number().optional(),
  tolerance: z.number().min(0).optional(),
  explanation: z.string().max(4000).optional(),
  legal_reference: z.string().max(300).optional(),
  tags: z.array(z.string().regex(/^[a-z0-9_]+$/)).default([]),
  media: OfficialMediaSchema.optional(),
});

export const OfficialCatalogSchema = z.object({
  format: z.literal("fahrpilot-official-1"),
  /** Lizenzkennung, identisch mit tenant_content_licenses.license_id der Fahrschulen. */
  license_id: z.string().min(2).max(80).regex(/^[A-Za-z0-9._-]+$/),
  licensor: z.string().min(2).max(120),
  /** Änderungsdienst: Stichtag, ab dem diese Fassung gilt (1. April oder 1. Oktober). */
  valid_from: isoDate,
  locale: z.enum(["de", "en", "tr", "ar"]).default("de"),
  legal_basis_date: isoDate,
  source_note: z.string().max(300).default("Amtlicher Fragenkatalog, lizenziert"),
  questions: z.array(OfficialQuestionSchema).min(1),
});

export type OfficialCatalog = z.infer<typeof OfficialCatalogSchema>;
export type OfficialQuestion = z.infer<typeof OfficialQuestionSchema>;

/** Prüft Struktur und fachliche Konsistenz. Liefert eine leere Liste, wenn alles in Ordnung ist. */
export function validateOfficialCatalog(input: unknown): { catalog: OfficialCatalog | null; problems: string[] } {
  const parsed = OfficialCatalogSchema.safeParse(input);
  if (!parsed.success) return { catalog: null, problems: parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`) };
  const c = parsed.data;
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const q of c.questions) {
    const p = `Frage ${q.external_ref}`;
    if (seen.has(q.external_ref)) problems.push(`${p}: Fragenummer doppelt`);
    seen.add(q.external_ref);
    if (q.kind === "numeric") {
      if (q.numeric_answer === undefined) problems.push(`${p}: numerische Frage ohne numeric_answer`);
      if (q.answers.length > 0) problems.push(`${p}: numerische Frage darf keine Antwortoptionen haben`);
    } else {
      if (q.answers.length < 2) problems.push(`${p}: mindestens zwei Antwortoptionen`);
      const correct = q.answers.filter((a) => a.correct).length;
      if (correct < 1) problems.push(`${p}: keine richtige Antwort`);
      if (correct === q.answers.length) problems.push(`${p}: alle Antworten richtig`);
      const texts = new Set(q.answers.map((a) => a.text.trim().toLowerCase()));
      if (texts.size !== q.answers.length) problems.push(`${p}: Antworttexte doppelt`);
    }
    if (q.kind === "video" && q.media?.kind !== "video") problems.push(`${p}: Videofrage ohne Video`);
    if (q.media?.kind === "video" && !/\.(mp4|webm)$/i.test(q.media.file)) problems.push(`${p}: Videodatei muss mp4 oder webm sein`);
    if (q.media?.kind === "image" && /\.(mp4|webm)$/i.test(q.media.file)) problems.push(`${p}: Bild mit Videoendung`);
    if (/[–—]/.test(q.text + (q.explanation ?? ""))) problems.push(`${p}: Gedankenstrich im Text (Hausstil: Komma oder Punkt)`);
  }
  return { catalog: c, problems };
}

/** Stabiler Inhalts-Hash einer Frage; nur bei Änderung entsteht eine neue Version in der Datenbank. */
export function questionContentHash(q: OfficialQuestion): string {
  const canonical = JSON.stringify({
    text: q.text, kind: q.kind, points: q.points, material_kind: q.material_kind, license_codes: [...q.license_codes].sort(),
    answers: q.answers.map((a) => ({ t: a.text, c: a.correct, e: a.explanation ?? null })),
    numeric_answer: q.numeric_answer ?? null, tolerance: q.tolerance ?? null, explanation: q.explanation ?? null,
    legal_reference: q.legal_reference ?? null, media: q.media ? { file: q.media.file, kind: q.media.kind, alt: q.media.alt, credit: q.media.credit ?? null } : null,
  });
  return createHash("sha256").update(canonical).digest("hex").slice(0, 32);
}

/** Speicherpfad im privaten Bucket "content": je Lizenz ein Ordner, Dateiname aus der Lieferung. */
export function officialMediaPath(licenseId: string, file: string): string {
  return `official/${licenseId}/${file}`;
}

/** Notiz in question_versions.source_note; trägt Lizenz und Hash, damit der nächste Import Änderungen erkennt. */
export function sourceNoteFor(licenseId: string, hash: string, note: string): string {
  return `${note} [lizenz:${licenseId} hash:${hash}]`;
}
export function hashFromSourceNote(note: string | null): string | null {
  const m = /hash:([0-9a-f]{32})\]/.exec(note ?? "");
  return m?.[1] ?? null;
}

export interface ImportPlanRow { external_ref: string; action: "insert" | "new_version" | "unchanged"; }
/** Vergleicht die Lieferung mit dem Bestand (external_ref → Hash der aktuellen Version). */
export function planImport(catalog: OfficialCatalog, existing: Map<string, string | null>): { rows: ImportPlanRow[]; missing: string[] } {
  const rows: ImportPlanRow[] = catalog.questions.map((q) => {
    if (!existing.has(q.external_ref)) return { external_ref: q.external_ref, action: "insert" };
    return { external_ref: q.external_ref, action: existing.get(q.external_ref) === questionContentHash(q) ? "unchanged" : "new_version" };
  });
  const delivered = new Set(catalog.questions.map((q) => q.external_ref));
  const missing = [...existing.keys()].filter((ref) => !delivered.has(ref));
  return { rows, missing };
}
