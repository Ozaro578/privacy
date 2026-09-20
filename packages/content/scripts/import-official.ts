// Importiert einen lizenzierten (amtlichen) Fragenkatalog im Format "fahrpilot-official-1" in die Datenbank.
// Aufruf: pnpm --filter @fahrpilot/content import-official -- <lieferung.json> [--media-dir <ordner>] [--dry-run]
//         [--retire-missing] [--skip-media-upload]
// Umgebung: DATABASE_URL (Default lokale Testdatenbank); für Medien-Upload SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY.
// Verhalten: neue Fragen werden angelegt, geänderte bekommen eine neue Version ab valid_from (alte Version endet am Vortag),
// unveränderte bleiben unberührt. Eine Fassung mit künftigem valid_from wird erst am Stichtag aktiv (activate_due_question_versions,
// täglich per Cron /api/cron/daily). Fragen der Lizenz, die in der Lieferung fehlen, werden nur mit --retire-missing zurückgezogen.
// Sichtbar sind die Fragen nur für Fahrschulen mit gültiger Lizenz (tenant_content_licenses, RLS in Migration 0027).
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";
import { TOPICS } from "../src/topics";
import { hashFromSourceNote, officialMediaPath, planImport, questionContentHash, sourceNoteFor, validateOfficialCatalog, type OfficialCatalog, type OfficialQuestion } from "../src/import-official";

const DEFAULT_URL = "postgresql://postgres@127.0.0.1:54329/fahrpilot_test";
const SOURCE = "official_licensed";
const MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", svg: "image/svg+xml", mp4: "video/mp4", webm: "video/webm" };

function arg(name: string): string | null { const i = process.argv.indexOf(name); return i >= 0 ? (process.argv[i + 1] ?? null) : null; }
const flag = (name: string) => process.argv.includes(name);

async function uploadMedia(catalog: OfficialCatalog, mediaDir: string | null, skip: boolean): Promise<number> {
  const withMedia = catalog.questions.filter((q) => q.media);
  if (withMedia.length === 0) return 0;
  if (skip) { console.warn(`Medien-Upload übersprungen (${withMedia.length} Dateien); Pfade werden trotzdem gesetzt.`); return 0; }
  if (!mediaDir) throw new Error("--media-dir fehlt (Ordner mit den Bild- und Videodateien der Lieferung)");
  const url = process.env["SUPABASE_URL"]; const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY werden für den Medien-Upload gebraucht (oder --skip-media-upload)");
  const storage = createClient(url, key, { auth: { persistSession: false } }).storage.from("content");
  let n = 0;
  for (const q of withMedia) {
    const file = path.join(mediaDir, q.media!.file);
    if (!fs.existsSync(file)) throw new Error(`Mediendatei fehlt: ${file} (Frage ${q.external_ref})`);
    const ext = q.media!.file.split(".").pop()!.toLowerCase();
    const { error } = await storage.upload(officialMediaPath(catalog.license_id, q.media!.file), fs.readFileSync(file), { contentType: MIME[ext] ?? "application/octet-stream", upsert: true });
    if (error) throw new Error(`Upload fehlgeschlagen für ${q.media!.file}: ${error.message}`);
    n += 1;
  }
  return n;
}

async function main() {
  const file = process.argv[2];
  if (!file || file.startsWith("--")) { console.error("Aufruf: import-official <lieferung.json> [--media-dir <ordner>] [--dry-run] [--retire-missing] [--skip-media-upload]"); process.exit(2); }
  const raw: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
  const { catalog, problems } = validateOfficialCatalog(raw);
  if (!catalog || problems.length > 0) { console.error(`Lieferung ungültig (${problems.length} Probleme):\n${problems.map((p) => `- ${p}`).join("\n")}`); process.exit(1); }
  const dryRun = flag("--dry-run");
  const sql = postgres(process.env["DATABASE_URL"] ?? DEFAULT_URL, { max: 1, onnotice: () => undefined });
  try {
    const topicIds = new Map<string, string>();
    for (const t of TOPICS) {
      const [row] = await sql<{ id: string }[]>`select id from public.topics where tenant_id is null and code = ${t.code}`;
      if (!row) throw new Error(`Thema ${t.code} fehlt in der Datenbank; zuerst den Seed ausführen`);
      topicIds.set(t.code, row.id);
    }
    // Vergleich gegen die jeweils neueste Fassung (auch eine noch nicht aktive künftige), damit ein erneuter Import
    // derselben Lieferung keine doppelten Versionen anlegt. Zurückgezogene Fragen werden bei erneuter Lieferung wiederbelebt.
    const existingRows = await sql<{ id: string; external_ref: string; source_note: string | null; version: number | null }[]>`
      select q.id, q.external_ref, v.source_note, v.version from public.theory_questions q
      left join lateral (select source_note, version from public.question_versions x where x.question_id = q.id order by x.version desc limit 1) v on true
      where q.tenant_id is null and q.source = ${SOURCE} and q.license_id_for_source = ${catalog.license_id}`;
    const existing = new Map(existingRows.map((r) => [r.external_ref, hashFromSourceNote(r.source_note)]));
    const byRef = new Map(existingRows.map((r) => [r.external_ref, r]));
    const plan = planImport(catalog, existing);
    const counts: Record<string, number> = { insert: 0, new_version: 0, unchanged: 0, retired: 0, activated: 0 };
    for (const r of plan.rows) counts[r.action] = (counts[r.action] ?? 0) + 1;
    console.log(`Lieferung ${catalog.license_id} gültig ab ${catalog.valid_from}: ${catalog.questions.length} Fragen, ${counts.insert} neu, ${counts.new_version} geändert, ${counts.unchanged} unverändert, ${plan.missing.length} im Bestand aber nicht geliefert${flag("--retire-missing") ? " (werden zurückgezogen)" : ""}.`);
    if (dryRun) { console.log("Probelauf, keine Änderungen geschrieben."); return; }

    const uploaded = await uploadMedia(catalog, arg("--media-dir"), flag("--skip-media-upload"));
    const qByRef = new Map(catalog.questions.map((q) => [q.external_ref, q]));
    await sql.begin(async (tx) => {
      for (const r of plan.rows) {
        if (r.action === "unchanged") continue;
        const q = qByRef.get(r.external_ref)!;
        await writeQuestion(tx as unknown as postgres.Sql, catalog, q, topicIds, byRef.get(r.external_ref) ?? null);
      }
      if (flag("--retire-missing")) {
        for (const ref of plan.missing) {
          const row = byRef.get(ref)!;
          await tx`update public.theory_questions set status = 'retired' where id = ${row.id}`;
          await tx`update public.question_versions set valid_until = (${catalog.valid_from}::date - 1), review_status = 'retired' where question_id = ${row.id} and valid_until is null`;
          counts.retired += 1;
        }
      }
      const [{ activated }] = await tx<{ activated: number }[]>`select public.activate_due_question_versions() as activated`;
      counts.activated = activated;
      await tx`insert into public.audit_logs (tenant_id, actor_id, actor_role, action, entity_table, entity_id, new_data)
        values (null, null, 'import', 'update', 'theory_questions', ${catalog.license_id}, ${tx.json({ import: "official", license_id: catalog.license_id, valid_from: catalog.valid_from, counts, uploaded })})`;
    });
    console.log(`Import abgeschlossen: ${JSON.stringify({ ...counts, uploaded })}`);
  } finally {
    await sql.end();
  }
}

async function writeQuestion(sql: postgres.Sql, catalog: OfficialCatalog, q: OfficialQuestion, topicIds: Map<string, string>, existing: { id: string; version: number | null } | null) {
  const topicId = topicIds.get(q.topic)!;
  const hash = questionContentHash(q);
  let questionId: string;
  if (existing) {
    questionId = existing.id;
    await sql`update public.theory_questions set topic_id = ${topicId}, material_kind = ${q.material_kind}, license_codes = ${sql.array(q.license_codes)}, points = ${q.points},
      difficulty = ${q.difficulty ?? 0.5}, question_kind = ${q.kind}, status = 'published', tags = ${sql.array(q.tags)} where id = ${questionId}`;
    // Bisherige Fassung endet am Vortag des Stichtags
    await sql`update public.question_versions set valid_until = (${catalog.valid_from}::date - 1) where question_id = ${questionId} and valid_until is null and valid_from < ${catalog.valid_from}::date`;
  } else {
    const [row] = await sql<{ id: string }[]>`insert into public.theory_questions (tenant_id, external_ref, source, license_id_for_source, topic_id, material_kind, license_codes, points, difficulty, question_kind, status, tags)
      values (null, ${q.external_ref}, ${SOURCE}, ${catalog.license_id}, ${topicId}, ${q.material_kind}, ${sql.array(q.license_codes)}, ${q.points}, ${q.difficulty ?? 0.5}, ${q.kind}, 'published', ${sql.array(q.tags)}) returning id`;
    questionId = row!.id;
  }
  const [{ next }] = await sql<{ next: number }[]>`select coalesce(max(version), 0) + 1 as next from public.question_versions where question_id = ${questionId}`;
  const [version] = await sql<{ id: string }[]>`insert into public.question_versions (question_id, version, locale, text, explanation, legal_reference, legal_basis_date, numeric_answer, numeric_tolerance, valid_from, review_status, source_note, media_path, media_kind, media_alt, media_credit)
    values (${questionId}, ${next}, ${catalog.locale}, ${q.text}, ${q.explanation ?? null}, ${q.legal_reference ?? null}, ${catalog.legal_basis_date}, ${q.numeric_answer ?? null}, ${q.tolerance ?? null}, ${catalog.valid_from}, 'published', ${sourceNoteFor(catalog.license_id, hash, catalog.source_note)},
            ${q.media ? officialMediaPath(catalog.license_id, q.media.file) : null}, ${q.media?.kind ?? null}, ${q.media?.alt ?? null}, ${q.media?.credit ?? catalog.licensor}) returning id`;
  for (const [i, a] of q.answers.entries()) {
    await sql`insert into public.question_answers (question_version_id, position, text, is_correct, explanation) values (${version!.id}, ${i + 1}, ${a.text}, ${a.correct}, ${a.explanation ?? null})`;
  }
  // Sichtbar wird die neue Fassung erst am Stichtag; activate_due_question_versions() setzt current_version_id und Status.
  if (!existing) await sql`update public.theory_questions set current_version_id = ${version!.id}, status = case when ${catalog.valid_from}::date <= current_date then 'published'::app.review_status else 'approved'::app.review_status end where id = ${questionId}`;
}

main().catch((e: unknown) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
