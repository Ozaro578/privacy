import * as SQLite from "expo-sqlite";
import type { QueueStore } from "@/offline/queue";
import type { KeyValueStore, StateStore } from "@/offline/sync";
import type { LocalQuestion, LocalQuestionState, LocalTopic, QueueItem, QueueStatus } from "@/offline/types";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Öffnet die lokale Datenbank und legt die Tabellen an (Fragen, Themen, Zustände, Sync-Warteschlange, Metadaten). */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= SQLite.openDatabaseAsync("fahrpilot.db").then(async (db) => {
    await db.execAsync(`
      pragma journal_mode = wal;
      create table if not exists kv (key text primary key, value text not null);
      create table if not exists topics (id text primary key, json text not null);
      create table if not exists questions (id text primary key, topic_id text not null, json text not null);
      create table if not exists question_states (question_id text primary key, json text not null, due_at text not null, dirty integer not null default 0);
      create table if not exists sync_queue (id integer primary key autoincrement, operation text not null, tbl text not null, payload text not null, idempotency_key text not null unique, created_at text not null, attempts integer not null default 0, last_error text, status text not null default 'pending');
      create index if not exists sync_queue_status_idx on sync_queue(status);
    `);
    return db;
  });
  return dbPromise;
}

export class SqliteQueueStore implements QueueStore {
  async list(status?: QueueStatus): Promise<QueueItem[]> {
    const db = await getDb();
    const rows = status ? await db.getAllAsync<Row>("select * from sync_queue where status = ? order by id", status) : await db.getAllAsync<Row>("select * from sync_queue order by id");
    return rows.map(toItem);
  }
  async insert(item: Omit<QueueItem, "id">): Promise<QueueItem> {
    const db = await getDb();
    await db.runAsync("insert or ignore into sync_queue (operation, tbl, payload, idempotency_key, created_at, attempts, last_error, status) values (?,?,?,?,?,?,?,?)", item.operation, item.table, JSON.stringify(item.payload), item.idempotency_key, item.created_at, item.attempts, item.last_error, item.status);
    const row = await db.getFirstAsync<Row>("select * from sync_queue where idempotency_key = ?", item.idempotency_key);
    return toItem(row!);
  }
  async update(id: number, patch: Partial<Pick<QueueItem, "status" | "attempts" | "last_error" | "payload">>): Promise<void> {
    const db = await getDb();
    const sets: string[] = []; const vals: (string | number | null)[] = [];
    if (patch.status !== undefined) { sets.push("status = ?"); vals.push(patch.status); }
    if (patch.attempts !== undefined) { sets.push("attempts = ?"); vals.push(patch.attempts); }
    if (patch.last_error !== undefined) { sets.push("last_error = ?"); vals.push(patch.last_error); }
    if (patch.payload !== undefined) { sets.push("payload = ?"); vals.push(JSON.stringify(patch.payload)); }
    if (!sets.length) return;
    await db.runAsync(`update sync_queue set ${sets.join(", ")} where id = ?`, ...vals, id);
  }
  async remove(status: QueueStatus, olderThanIso: string): Promise<number> {
    const db = await getDb();
    const r = await db.runAsync("delete from sync_queue where status = ? and created_at < ?", status, olderThanIso);
    return r.changes;
  }
}
interface Row { id: number; operation: string; tbl: string; payload: string; idempotency_key: string; created_at: string; attempts: number; last_error: string | null; status: string }
const toItem = (r: Row): QueueItem => ({ id: r.id, operation: r.operation as QueueItem["operation"], table: r.tbl, payload: JSON.parse(r.payload), idempotency_key: r.idempotency_key, created_at: r.created_at, attempts: r.attempts, last_error: r.last_error, status: r.status as QueueStatus });

export class SqliteStateStore implements StateStore {
  async loadAll(): Promise<Map<string, LocalQuestionState>> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ json: string }>("select json from question_states");
    return new Map(rows.map((r) => { const s = JSON.parse(r.json) as LocalQuestionState; return [s.question_id, s]; }));
  }
  async saveMany(states: Iterable<LocalQuestionState>): Promise<void> {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      for (const s of states) await db.runAsync("insert or replace into question_states (question_id, json, due_at, dirty) values (?,?,?,?)", s.question_id, JSON.stringify(s), s.due_at, s.dirty ? 1 : 0);
    });
  }
}

export class SqliteKvStore implements KeyValueStore {
  async get(key: string): Promise<string | null> { const r = await (await getDb()).getFirstAsync<{ value: string }>("select value from kv where key = ?", key); return r?.value ?? null; }
  async set(key: string, value: string): Promise<void> { await (await getDb()).runAsync("insert or replace into kv (key, value) values (?,?)", key, value); }
}

export async function saveQuestions(questions: LocalQuestion[], topics: LocalTopic[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync("delete from questions"); await db.runAsync("delete from topics");
    for (const q of questions) await db.runAsync("insert into questions (id, topic_id, json) values (?,?,?)", q.id, q.topic_id, JSON.stringify(q));
    for (const t of topics) await db.runAsync("insert into topics (id, json) values (?,?)", t.id, JSON.stringify(t));
  });
}
export async function loadQuestions(): Promise<LocalQuestion[]> { return (await (await getDb()).getAllAsync<{ json: string }>("select json from questions")).map((r) => JSON.parse(r.json) as LocalQuestion); }
export async function loadTopics(): Promise<LocalTopic[]> { return (await (await getDb()).getAllAsync<{ json: string }>("select json from topics")).map((r) => JSON.parse(r.json) as LocalTopic).sort((a, b) => a.sort_order - b.sort_order); }
export async function clearLocalData(): Promise<void> { const db = await getDb(); await db.execAsync("delete from kv; delete from topics; delete from questions; delete from question_states; delete from sync_queue;"); }
