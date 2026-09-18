import { dataBlock } from "./guardrails";
import { sourceFromEntry, type KnowledgeEntry } from "./knowledge";
import type { Confidence, Source } from "./types";

export interface CitationResolution {
  sources: Source[];
  cited: KnowledgeEntry[];
  confidence: Confidence;
  /** Vom Modell genannte ids, die nicht zu den bereitgestellten Quellen gehören (Erfindung oder Injektion). */
  unknown_ids: string[];
}

/**
 * Leitet die Sicherheitsstufe aus den tatsächlich bereitgestellten Quellen ab.
 * verified: mindestens eine zitierte Quelle mit passendem Thema, keine fremden ids, Modell meldet vollständige Abdeckung.
 * partial: gültige Zitate, aber Thema, Abdeckung oder Zitatdisziplin unvollständig.
 * uncertain: kein gültiges Zitat.
 */
export function resolveCitations(
  retrieved: KnowledgeEntry[],
  citedIds: string[],
  coverage: "full" | "partial" | "none",
  topicId?: string,
): CitationResolution {
  const byId = new Map(retrieved.map((e) => [e.id, e]));
  const unique = [...new Set(citedIds)];
  const cited = unique.map((id) => byId.get(id)).filter((e): e is KnowledgeEntry => e !== undefined);
  const unknown_ids = unique.filter((id) => !byId.has(id));
  if (cited.length === 0 || coverage === "none") return { sources: [], cited: [], confidence: "uncertain", unknown_ids };
  const topicMatch = topicId ? cited.some((e) => e.topic_id === topicId) : true;
  const confidence: Confidence = unknown_ids.length === 0 && topicMatch && coverage === "full" ? "verified" : "partial";
  return { sources: cited.map(sourceFromEntry), cited, confidence, unknown_ids };
}

/** Rendert Wissensquellen als abgegrenzte Datenblöcke für den Prompt. */
export function renderSources(entries: KnowledgeEntry[]): string {
  if (entries.length === 0) return dataBlock("quellen", "(keine geprüften Quellen gefunden)");
  return entries
    .map((e) =>
      dataBlock("quelle", `${e.summary ? `${e.summary}\n\n` : ""}${e.body_markdown}`, {
        id: e.id,
        titel: e.title,
        rechtsgrundlage: e.legal_reference ?? "",
        stand: e.legal_basis_date,
      }),
    )
    .join("\n");
}

/** Alle Texte einer Quelle, gegen die Fakten im Antworttext abgeglichen werden dürfen. */
export function allowedTextsOf(entries: KnowledgeEntry[]): string[] {
  return entries.flatMap((e) => [e.title, e.summary ?? "", e.body_markdown, e.legal_reference ?? ""]);
}
