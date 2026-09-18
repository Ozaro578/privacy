import type { Source } from "./types";

/** Geprüfter Wissenseintrag, Spiegel von public.knowledge_entries (nur die für den Coach relevanten Felder). */
export interface KnowledgeEntry {
  id: string;
  slug: string;
  topic_id: string | null;
  title: string;
  locale: string;
  body_markdown: string;
  summary: string | null;
  legal_reference: string | null;
  legal_basis_date: string;
  license_codes: string[];
  source: string;
}

export interface KnowledgeSearchOptions {
  locale: string;
  licenseCodes?: string[];
  topicId?: string;
  limit: number;
}

export interface KnowledgeRepository {
  search(query: string, opts: KnowledgeSearchOptions): Promise<KnowledgeEntry[]>;
}

export function sourceFromEntry(e: KnowledgeEntry): Source {
  return {
    knowledge_entry_id: e.id,
    question_version_id: null,
    title: e.title,
    legal_reference: e.legal_reference,
    legal_basis_date: e.legal_basis_date,
  };
}

const STOPWORDS = new Set(["und", "oder", "der", "die", "das", "ein", "eine", "ist", "was", "wie", "ich", "bei", "mit", "von", "für", "auf", "dem", "den", "des", "im", "in", "an", "zu", "wann", "darf", "muss", "kann", "man", "the", "and", "for", "what", "how", "is", "a", "of", "to", "ve", "bir", "ne", "mi"]);

export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9\s§]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(s: string): string[] {
  return normalizeText(s).split(" ").filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

/** Einfache Stichwortsuche für Tests und lokale Entwicklung. Die produktive Suche läuft über den tsvector-Index in Supabase. */
export class InMemoryKnowledgeRepository implements KnowledgeRepository {
  constructor(private readonly entries: KnowledgeEntry[]) {}

  async search(query: string, opts: KnowledgeSearchOptions): Promise<KnowledgeEntry[]> {
    const terms = tokenize(query);
    const scored = this.entries
      .filter((e) => e.locale === opts.locale)
      .filter((e) => !opts.licenseCodes?.length || e.license_codes.length === 0 || e.license_codes.some((c) => opts.licenseCodes!.includes(c)))
      .map((e) => {
        const hay = normalizeText(`${e.title} ${e.summary ?? ""} ${e.body_markdown}`);
        let score = terms.filter((t) => hay.includes(t)).length;
        if (opts.topicId && e.topic_id === opts.topicId) score += 2;
        return { e, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, opts.limit).map((x) => x.e);
  }
}
