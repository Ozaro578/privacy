import { describe, expect, it } from "vitest";
import { MemoryQueueStore, applySyncResponse, buildSyncBatch, enqueueAttempt, enqueueSession, pendingCount, persistOutcome } from "../offline/queue";
import { KV_DAILY_GOAL, KV_LAST_SYNC, KV_STREAK, SyncService, type KeyValueStore, type StateStore } from "../offline/sync";
import type { LocalQuestionState, QueuedAttempt, ServerQuestionState, SyncRequestBody, SyncResponse } from "../offline/types";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const attempt = (n: number, answeredAt: string, session = uuid(900)): QueuedAttempt => ({ client_attempt_id: uuid(n), client_session_id: session, question_id: uuid(100 + n), selected: [1], numeric_answer: null, confidence: 2, response_ms: 1200, answered_at: answeredAt });

class MemoryStates implements StateStore {
  map = new Map<string, LocalQuestionState>();
  async loadAll() { return new Map(this.map); }
  async saveMany(states: Iterable<LocalQuestionState>) { for (const s of states) this.map.set(s.question_id, s); }
}
class MemoryKv implements KeyValueStore {
  map = new Map<string, string>();
  async get(k: string) { return this.map.get(k) ?? null; }
  async set(k: string, v: string) { this.map.set(k, v); }
}
const serverState = (questionId: string, lastAnsweredAt: string, mastery: number): ServerQuestionState => ({ question_id: questionId, attempts: 3, correct: 2, consecutive_correct: 1, last_correct: true, last_answered_at: lastAnsweredAt, last_confidence: 2, avg_response_ms: 1000, ease: 2.5, interval_days: 1, due_at: "2026-09-19T10:00:00.000Z", mastery, bookmarked: false, row_version: 4 });

describe("Sync-Queue: Reihenfolge", () => {
  it("sendet Sessions vor Versuchen und Versuche nach answered_at, dann Einreihung", async () => {
    const store = new MemoryQueueStore();
    await enqueueAttempt(store, attempt(2, "2026-09-18T10:05:00.000Z"));
    await enqueueAttempt(store, attempt(1, "2026-09-18T10:00:00.000Z"));
    await enqueueSession(store, { client_session_id: uuid(900), mode: "review", topic_id: null, ended: false });
    await enqueueAttempt(store, attempt(3, "2026-09-18T10:05:00.000Z"));
    const batch = buildSyncBatch(await store.list(), null);
    expect(batch.body.sessions.map((s) => s.client_session_id)).toEqual([uuid(900)]);
    expect(batch.body.attempts.map((a) => a.client_attempt_id)).toEqual([uuid(1), uuid(2), uuid(3)]);
    expect(batch.items[0]?.operation).toBe("upsert_session");
  });

  it("begrenzt einen Batch auf max Versuche und behält die Reihenfolge", async () => {
    const store = new MemoryQueueStore();
    for (let i = 1; i <= 7; i++) await enqueueAttempt(store, attempt(i, `2026-09-18T10:0${i}:00.000Z`));
    const batch = buildSyncBatch(await store.list(), null, 5);
    expect(batch.body.attempts).toHaveLength(5);
    expect(batch.body.attempts.map((a) => a.client_attempt_id)).toEqual([1, 2, 3, 4, 5].map(uuid));
  });
});

describe("Sync-Queue: Idempotenz", () => {
  it("reiht denselben Versuch nur einmal ein", async () => {
    const store = new MemoryQueueStore();
    const a = await enqueueAttempt(store, attempt(1, "2026-09-18T10:00:00.000Z"));
    const b = await enqueueAttempt(store, attempt(1, "2026-09-18T10:00:00.000Z"));
    expect(a.id).toBe(b.id);
    expect(await store.list()).toHaveLength(1);
  });

  it("aktualisiert eine Session auf ended statt sie doppelt einzureihen", async () => {
    const store = new MemoryQueueStore();
    await enqueueSession(store, { client_session_id: uuid(900), mode: "topic", topic_id: uuid(5), ended: false });
    await enqueueSession(store, { client_session_id: uuid(900), mode: "topic", topic_id: uuid(5), ended: true });
    const items = await store.list();
    expect(items).toHaveLength(1);
    expect((items[0]!.payload as { ended: boolean }).ended).toBe(true);
  });

  it("markiert bestätigte Versuche als done und sendet sie nicht erneut", async () => {
    const store = new MemoryQueueStore();
    await enqueueAttempt(store, attempt(1, "2026-09-18T10:00:00.000Z"));
    await enqueueAttempt(store, attempt(2, "2026-09-18T10:01:00.000Z"));
    const batch = buildSyncBatch(await store.list(), null);
    const outcome = applySyncResponse(batch, { results: [{ client_attempt_id: uuid(1), ok: true, correct: true }, { client_attempt_id: uuid(2), ok: false, error: "Frage nicht gefunden" }], states: [], streak: null, daily_goal: null, server_time: "2026-09-18T10:02:00.000Z" });
    await persistOutcome(store, outcome, batch.items);
    const items = await store.list();
    expect(items.find((i) => i.idempotency_key === `attempt:${uuid(1)}`)?.status).toBe("done");
    expect(items.find((i) => i.idempotency_key === `attempt:${uuid(2)}`)?.status).toBe("failed");
    expect(buildSyncBatch(items, null).body.attempts).toHaveLength(0);
    expect(pendingCount(items)).toBe(0);
  });

  it("wiederholt Versuche, deren Session der Server noch nicht kennt", async () => {
    const store = new MemoryQueueStore();
    await enqueueSession(store, { client_session_id: uuid(900), mode: "random", topic_id: null, ended: false });
    await enqueueAttempt(store, attempt(1, "2026-09-18T10:00:00.000Z"));
    const batch = buildSyncBatch(await store.list(), null);
    const outcome = applySyncResponse(batch, { results: [{ client_attempt_id: uuid(1), ok: false, error: "Session unbekannt" }], states: [], streak: null, daily_goal: null, server_time: "x" });
    await persistOutcome(store, outcome, batch.items);
    const items = await store.list();
    expect(items.every((i) => i.status === "pending")).toBe(true);
    expect(items.find((i) => i.operation === "insert_attempts")?.attempts).toBe(1);
  });
});

describe("SyncService: Server gewinnt", () => {
  function makeService(opts: { online?: boolean; respond: (body: SyncRequestBody) => SyncResponse | Promise<SyncResponse> }) {
    const queue = new MemoryQueueStore();
    const states = new MemoryStates();
    const kv = new MemoryKv();
    const sentBodies: SyncRequestBody[] = [];
    const service = new SyncService({ queue, states, kv, isOnline: async () => opts.online ?? true, send: async (body) => { sentBodies.push(body); return opts.respond(body); } });
    return { queue, states, kv, service, sentBodies };
  }

  it("überspringt offline ohne die Warteschlange zu verändern", async () => {
    const { queue, service } = makeService({ online: false, respond: () => { throw new Error("nicht erreichbar"); } });
    await enqueueAttempt(queue, attempt(1, "2026-09-18T10:00:00.000Z"));
    const s = await service.flush();
    expect(s.skipped).toBe("offline");
    expect((await queue.list())[0]?.status).toBe("pending");
  });

  it("übernimmt Serverzustände, behält jüngere unbestätigte lokale Zustände und löscht dirty nach Bestätigung", async () => {
    const q1 = uuid(101), q2 = uuid(102), q3 = uuid(103);
    const { queue, states, kv, service, sentBodies } = makeService({
      respond: (body) => ({
        results: body.attempts.map((a) => ({ client_attempt_id: a.client_attempt_id, ok: true, correct: true })),
        states: [serverState(q1, "2026-09-18T10:00:00.000Z", 0.7), serverState(q2, "2026-09-18T09:00:00.000Z", 0.2), serverState(q3, "2026-09-18T08:00:00.000Z", 0.9)],
        streak: { current_days: 3, longest_days: 5, total_xp: 120, level: 2, last_active_date: "2026-09-18" },
        daily_goal: { answered: 4, target_questions: 20, achieved: false },
        server_time: "2026-09-18T10:30:00.000Z",
      }),
    });
    await kv.set(KV_LAST_SYNC, "2026-09-17T00:00:00.000Z");
    // q1: lokal dirty, aber älter als Server -> Server gewinnt
    states.map.set(q1, { ...serverState(q1, "2026-09-18T09:30:00.000Z", 0.4), dirty: true });
    // q2: lokal dirty und jünger (Versuch noch nicht bestätigt, nicht in diesem Batch) -> lokal bleibt
    states.map.set(q2, { ...serverState(q2, "2026-09-18T09:45:00.000Z", 0.5), dirty: true });
    // q3: lokal sauber -> Server gewinnt
    states.map.set(q3, { ...serverState(q3, "2026-09-18T09:59:00.000Z", 0.1), dirty: false });
    await enqueueAttempt(queue, { ...attempt(1, "2026-09-18T10:00:00.000Z"), question_id: q1 });
    const summary = await service.flush();
    expect(summary.error).toBeNull();
    expect(summary.done).toBe(1);
    expect(sentBodies[0]?.states_since).toBe("2026-09-17T00:00:00.000Z");
    expect(states.map.get(q1)?.mastery).toBe(0.7);
    expect(states.map.get(q1)?.dirty).toBe(false);
    expect(states.map.get(q2)?.mastery).toBe(0.5);
    expect(states.map.get(q2)?.dirty).toBe(true);
    expect(states.map.get(q3)?.mastery).toBe(0.9);
    expect(summary.statesKeptLocal).toBe(1);
    expect(summary.statesApplied).toBe(2);
    expect(JSON.parse((await kv.get(KV_STREAK))!)).toMatchObject({ current_days: 3 });
    expect(JSON.parse((await kv.get(KV_DAILY_GOAL))!)).toMatchObject({ answered: 4 });
    expect(await kv.get(KV_LAST_SYNC)).toBe("2026-09-18T10:30:00.000Z");
    expect((await queue.list())[0]?.status).toBe("done");
  });

  it("setzt Einträge bei Netzwerkfehler auf pending zurück und führt parallele Aufrufe zusammen", async () => {
    let calls = 0;
    const { queue, service } = makeService({ respond: () => { calls++; throw new Error("Timeout"); } });
    await enqueueAttempt(queue, attempt(1, "2026-09-18T10:00:00.000Z"));
    const [a, b] = await Promise.all([service.flush(), service.flush()]);
    expect(calls).toBe(1);
    expect(a.error).toBe("Timeout");
    expect(b).toBe(a);
    expect((await queue.list())[0]?.status).toBe("pending");
  });

  it("sendet mehrere Runden, bis die Warteschlange leer ist, ohne Duplikate", async () => {
    const seen: string[] = [];
    const { queue, service } = makeService({ respond: (body) => { seen.push(...body.attempts.map((a) => a.client_attempt_id)); return { results: body.attempts.map((a) => ({ client_attempt_id: a.client_attempt_id, ok: true })), states: [], streak: null, daily_goal: null, server_time: new Date().toISOString() }; } });
    for (let i = 1; i <= 3; i++) await enqueueAttempt(queue, attempt(i, `2026-09-18T10:0${i}:00.000Z`));
    const s = await service.flush();
    expect(s.done).toBe(3);
    expect(new Set(seen).size).toBe(3);
    expect(pendingCount(await queue.list())).toBe(0);
  });
});
