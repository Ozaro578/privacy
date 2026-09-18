import "server-only";
import type { KnowledgeEntry, KnowledgeRepository, KnowledgeSearchOptions } from "@fahrpilot/ai";
import type { Db } from "@/lib/data/student";

/** Wissensbasis-Suche über Postgres-Volltext (tsvector 'german'), nur veröffentlichte Einträge, global plus eigener Tenant (RLS). */
export class SupabaseKnowledgeRepository implements KnowledgeRepository {
  constructor(private readonly db: Db) {}
  async search(query: string, opts: KnowledgeSearchOptions): Promise<KnowledgeEntry[]> {
    const limit = opts.limit ?? 5;
    let q = this.db.from("knowledge_entries").select("id, slug, topic_id, title, locale, body_markdown, summary, legal_reference, legal_basis_date, license_codes, source").eq("review_status", "published").eq("locale", opts.locale ?? "de");
    if (opts.topicId) q = q.eq("topic_id", opts.topicId);
    const terms = query.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((t) => t.length > 2).slice(0, 8);
    const { data } = terms.length ? await q.textSearch("search_vector", terms.join(" | "), { config: "german" }).limit(limit) : await q.limit(limit);
    let rows = data ?? [];
    if (rows.length === 0 && opts.topicId) {
      const { data: fallback } = await this.db.from("knowledge_entries").select("id, slug, topic_id, title, locale, body_markdown, summary, legal_reference, legal_basis_date, license_codes, source").eq("review_status", "published").eq("topic_id", opts.topicId).limit(limit);
      rows = fallback ?? [];
    }
    const codes = opts.licenseCodes ?? [];
    return rows.filter((r) => codes.length === 0 || r.license_codes.length === 0 || r.license_codes.some((c) => codes.includes(c)));
  }
}
