// Spielt die eigenen Übungsinhalte idempotent in die Datenbank ein (globale Inhalte, tenant_id NULL).
// Aufruf: pnpm --filter @fahrpilot/content seed   (DATABASE_URL, Default: lokale Testdatenbank)
import postgres from "postgres";
import { chapters } from "./chapters.de";
import { validateContent } from "./index";
import { knowledgeEntries } from "./knowledge.de";
import { mediaForQuestion, mediaPublicPath } from "./media";
import { practicalQuestions } from "./practical-questions.de";
import { questions } from "./questions.de";
import { TOPICS } from "./topics";
import { CONTENT_SOURCE, type TopicCode } from "./types";

const DEFAULT_URL = "postgresql://postgres@127.0.0.1:54329/fahrpilot_test";
const LOCALE = "de";
const VERSION = 1;

type Sql = postgres.TransactionSql<Record<string, never>>;

async function seedTopics(sql: Sql): Promise<Map<TopicCode, string>> {
  const ids = new Map<TopicCode, string>();
  for (const t of TOPICS) {
    const [row] = await sql<{ id: string }[]>`
      insert into public.topics (tenant_id, code, name_i18n, material_kind, license_codes, sort_order)
      values (null, ${t.code}, ${sql.json({ de: t.nameDe })}, ${t.materialKind}, ${sql.array(t.materialKind === "class_specific" ? ["B", "B197", "B78"] : [])}, ${t.sortOrder})
      on conflict (code) where tenant_id is null do update
        set name_i18n = public.topics.name_i18n || excluded.name_i18n,
            material_kind = excluded.material_kind,
            sort_order = excluded.sort_order
      returning id`;
    if (!row) throw new Error(`Thema ${t.code} konnte nicht angelegt werden`);
    ids.set(t.code, row.id);
  }
  return ids;
}

async function seedQuestions(sql: Sql, topicIds: Map<TopicCode, string>): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;
  for (const q of questions) {
    const topicId = topicIds.get(q.topic);
    if (!topicId) throw new Error(`Unbekanntes Thema ${q.topic}`);
    const existing = await sql<{ id: string }[]>`
      select id from public.theory_questions where tenant_id is null and external_ref = ${q.code} and source = ${CONTENT_SOURCE}`;
    let questionId: string;
    if (existing[0]) {
      questionId = existing[0].id;
      await sql`
        update public.theory_questions
        set topic_id = ${topicId}, material_kind = ${q.materialKind}, license_codes = ${sql.array(q.licenseCodes)}, points = ${q.points},
            difficulty = ${q.difficulty}, question_kind = ${q.kind}, status = ${q.reviewStatus}, tags = ${sql.array(q.tags)}
        where id = ${questionId}`;
      updated += 1;
    } else {
      const [row] = await sql<{ id: string }[]>`
        insert into public.theory_questions (tenant_id, external_ref, source, topic_id, material_kind, license_codes, points, difficulty, question_kind, status, tags)
        values (null, ${q.code}, ${CONTENT_SOURCE}, ${topicId}, ${q.materialKind}, ${sql.array(q.licenseCodes)}, ${q.points}, ${q.difficulty}, ${q.kind}, ${q.reviewStatus}, ${sql.array(q.tags)})
        returning id`;
      if (!row) throw new Error(`Frage ${q.code} konnte nicht angelegt werden`);
      questionId = row.id;
      inserted += 1;
    }

    const media = mediaForQuestion(q.code);
    const [version] = await sql<{ id: string }[]>`
      insert into public.question_versions (question_id, version, locale, text, explanation, mnemonic, legal_reference, legal_basis_date, numeric_answer, numeric_tolerance, review_status, source_note, media_path, media_kind, media_alt, media_credit)
      values (${questionId}, ${VERSION}, ${LOCALE}, ${q.text}, ${q.explanation}, ${q.mnemonic ?? null}, ${q.legalReference ?? null}, ${q.legalBasisDate},
              ${q.numericAnswer ?? null}, ${q.tolerance ?? null}, ${q.reviewStatus}, ${"Eigene Übungsfrage (kein amtlicher Prüfungsinhalt)"},
              ${media ? mediaPublicPath(media) : null}, ${media ? "image" : null}, ${media?.alt ?? null}, ${media?.credit ?? null})
      on conflict (question_id, version, locale) do update
        set text = excluded.text, explanation = excluded.explanation, mnemonic = excluded.mnemonic, legal_reference = excluded.legal_reference,
            legal_basis_date = excluded.legal_basis_date, numeric_answer = excluded.numeric_answer, numeric_tolerance = excluded.numeric_tolerance,
            review_status = excluded.review_status, source_note = excluded.source_note,
            media_path = excluded.media_path, media_kind = excluded.media_kind, media_alt = excluded.media_alt, media_credit = excluded.media_credit
      returning id`;
    if (!version) throw new Error(`Version für ${q.code} konnte nicht angelegt werden`);

    await sql`delete from public.question_answers where question_version_id = ${version.id}`;
    for (const [i, a] of q.answers.entries()) {
      await sql`
        insert into public.question_answers (question_version_id, position, text, is_correct, explanation)
        values (${version.id}, ${i + 1}, ${a.text}, ${a.correct}, ${a.explanation ?? null})`;
    }
    await sql`update public.theory_questions set current_version_id = ${version.id} where id = ${questionId}`;
  }
  return { inserted, updated };
}

async function seedKnowledge(sql: Sql, topicIds: Map<TopicCode, string>): Promise<number> {
  for (const e of knowledgeEntries) {
    await sql`
      insert into public.knowledge_entries (tenant_id, slug, topic_id, title, locale, body_markdown, summary, legal_reference, legal_basis_date, license_codes, version, review_status, source)
      values (null, ${e.slug}, ${topicIds.get(e.topic) ?? null}, ${e.title}, ${LOCALE}, ${e.bodyMarkdown}, ${e.summary}, ${e.legalReference}, ${e.legalBasisDate},
              ${sql.array(e.licenseCodes)}, ${VERSION}, ${e.reviewStatus}, ${e.source})
      on conflict (slug, locale, version) do update
        set topic_id = excluded.topic_id, title = excluded.title, body_markdown = excluded.body_markdown, summary = excluded.summary,
            legal_reference = excluded.legal_reference, legal_basis_date = excluded.legal_basis_date, license_codes = excluded.license_codes,
            review_status = excluded.review_status, source = excluded.source`;
  }
  return knowledgeEntries.length;
}

async function seedChapters(sql: Sql, topicIds: Map<TopicCode, string>): Promise<number> {
  for (const c of chapters) {
    const topicId = topicIds.get(c.topic);
    if (!topicId) throw new Error(`Unbekanntes Thema ${c.topic}`);
    const sortOrder = TOPICS.find((t) => t.code === c.topic)?.sortOrder ?? 0;
    const existing = await sql<{ id: string }[]>`
      select id from public.chapters where tenant_id is null and topic_id = ${topicId} and locale = ${LOCALE} and version = ${VERSION}`;
    if (existing[0]) {
      await sql`
        update public.chapters
        set title = ${c.title}, body_markdown = ${c.bodyMarkdown}, estimated_minutes = ${c.estimatedMinutes}, license_codes = ${sql.array(c.licenseCodes)},
            review_status = ${c.reviewStatus}, source = ${c.source}, sort_order = ${sortOrder}
        where id = ${existing[0].id}`;
    } else {
      await sql`
        insert into public.chapters (tenant_id, topic_id, locale, title, body_markdown, estimated_minutes, license_codes, version, review_status, source, sort_order)
        values (null, ${topicId}, ${LOCALE}, ${c.title}, ${c.bodyMarkdown}, ${c.estimatedMinutes}, ${sql.array(c.licenseCodes)}, ${VERSION}, ${c.reviewStatus}, ${c.source}, ${sortOrder})`;
    }
  }
  return chapters.length;
}

async function seedPractical(sql: Sql): Promise<number> {
  for (const p of practicalQuestions) {
    const existing = await sql<{ id: string }[]>`
      select id from public.practical_check_questions where tenant_id is null and locale = ${LOCALE} and question = ${p.question}`;
    if (existing[0]) {
      await sql`
        update public.practical_check_questions
        set category = ${p.category}, license_codes = ${sql.array(p.licenseCodes)}, expected_points = ${sql.array(p.expectedPoints)},
            explanation = ${p.explanation}, source = ${p.source}, review_status = ${p.reviewStatus}, legal_basis_date = ${p.legalBasisDate}
        where id = ${existing[0].id}`;
    } else {
      await sql`
        insert into public.practical_check_questions (tenant_id, category, license_codes, locale, question, expected_points, explanation, source, review_status, legal_basis_date)
        values (null, ${p.category}, ${sql.array(p.licenseCodes)}, ${LOCALE}, ${p.question}, ${sql.array(p.expectedPoints)}, ${p.explanation}, ${p.source}, ${p.reviewStatus}, ${p.legalBasisDate})`;
    }
  }
  return practicalQuestions.length;
}

async function main(): Promise<void> {
  const problems = validateContent();
  if (problems.length > 0) {
    for (const p of problems) console.error(`Inhaltsfehler: ${p}`);
    throw new Error(`${problems.length} Inhaltsfehler, Seed abgebrochen`);
  }
  const url = process.env["DATABASE_URL"] ?? DEFAULT_URL;
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    const summary = await sql.begin(async (tx) => {
      const topicIds = await seedTopics(tx);
      const q = await seedQuestions(tx, topicIds);
      const knowledge = await seedKnowledge(tx, topicIds);
      const chapterCount = await seedChapters(tx, topicIds);
      const practical = await seedPractical(tx);
      return { topics: topicIds.size, questionsInserted: q.inserted, questionsUpdated: q.updated, knowledge, chapters: chapterCount, practical };
    });
    console.log(`Seed abgeschlossen: ${JSON.stringify(summary)}`);
  } finally {
    await sql.end();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
