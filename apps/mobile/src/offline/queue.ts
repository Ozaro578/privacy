import type { QueueItem, QueueOperation, QueueStatus, QueuedAttempt, QueuedSession, SyncRequestBody, SyncResponse } from "./types";

/** Abstraktion über die Tabelle sync_queue, damit die Logik ohne SQLite testbar ist. */
export interface QueueStore {
  list(status?: QueueStatus): Promise<QueueItem[]>;
  /** Fügt ein Element ein; bei bereits vorhandenem idempotency_key wird das vorhandene zurückgegeben. */
  insert(item: Omit<QueueItem, "id">): Promise<QueueItem>;
  update(id: number, patch: Partial<Pick<QueueItem, "status" | "attempts" | "last_error" | "payload">>): Promise<void>;
  remove(status: QueueStatus, olderThanIso: string): Promise<number>;
}

/** In-Memory-Implementierung für Tests und als Referenz für die SQLite-Variante. */
export class MemoryQueueStore implements QueueStore {
  private items: QueueItem[] = [];
  private nextId = 1;
  async list(status?: QueueStatus): Promise<QueueItem[]> {
    return this.items.filter((i) => !status || i.status === status).sort((a, b) => a.id - b.id).map((i) => ({ ...i }));
  }
  async insert(item: Omit<QueueItem, "id">): Promise<QueueItem> {
    const existing = this.items.find((i) => i.idempotency_key === item.idempotency_key);
    if (existing) return { ...existing };
    const created: QueueItem = { ...item, id: this.nextId++ };
    this.items.push(created);
    return { ...created };
  }
  async update(id: number, patch: Partial<Pick<QueueItem, "status" | "attempts" | "last_error" | "payload">>): Promise<void> {
    const it = this.items.find((i) => i.id === id);
    if (it) Object.assign(it, patch);
  }
  async remove(status: QueueStatus, olderThanIso: string): Promise<number> {
    const before = this.items.length;
    this.items = this.items.filter((i) => !(i.status === status && i.created_at < olderThanIso));
    return before - this.items.length;
  }
}

export const MAX_ATTEMPTS_PER_SYNC = 500;
export const MAX_RETRIES = 8;

const nowIso = () => new Date().toISOString();

/** Reiht eine Lernsession ein (Idempotenz über client_session_id). Ein erneuter Aufruf mit ended=true aktualisiert den Eintrag. */
export async function enqueueSession(store: QueueStore, session: QueuedSession): Promise<QueueItem> {
  const key = `session:${session.client_session_id}`;
  const item = await store.insert({ operation: "upsert_session", table: "learning_sessions", payload: session, idempotency_key: key, created_at: nowIso(), attempts: 0, last_error: null, status: "pending" });
  const existing = item.payload as QueuedSession;
  if (session.ended && !existing.ended) {
    await store.update(item.id, { payload: { ...existing, ended: true }, status: "pending" });
    return { ...item, payload: { ...existing, ended: true }, status: "pending" };
  }
  return item;
}

/** Reiht einen Versuch ein (Idempotenz über client_attempt_id). */
export async function enqueueAttempt(store: QueueStore, attempt: QueuedAttempt): Promise<QueueItem> {
  return store.insert({ operation: "insert_attempts", table: "student_question_attempts", payload: attempt, idempotency_key: `attempt:${attempt.client_attempt_id}`, created_at: nowIso(), attempts: 0, last_error: null, status: "pending" });
}

export interface SyncBatch {
  items: QueueItem[];
  body: SyncRequestBody;
}

/**
 * Baut aus der Warteschlange den Request für POST /api/sync.
 * Reihenfolge: Sessions zuerst (damit Versuche eine Session finden), Versuche nach answered_at und Einreihungsnummer.
 * Doppelte Idempotenzschlüssel werden nur einmal gesendet.
 */
export function buildSyncBatch(items: QueueItem[], statesSince: string | null, max = MAX_ATTEMPTS_PER_SYNC): SyncBatch {
  const pending = items.filter((i) => (i.status === "pending" || i.status === "sent") && i.attempts < MAX_RETRIES).sort((a, b) => a.id - b.id);
  const seen = new Set<string>();
  const sessions: QueueItem[] = [];
  const attempts: QueueItem[] = [];
  for (const it of pending) {
    if (seen.has(it.idempotency_key)) continue;
    seen.add(it.idempotency_key);
    if (it.operation === "upsert_session") sessions.push(it);
    else if (it.operation === "insert_attempts") attempts.push(it);
  }
  attempts.sort((a, b) => {
    const pa = a.payload as QueuedAttempt, pb = b.payload as QueuedAttempt;
    return pa.answered_at.localeCompare(pb.answered_at) || a.id - b.id;
  });
  const limitedAttempts = attempts.slice(0, max);
  // Alle offenen Sessions mitsenden (Upsert ist idempotent und klein); Versuche finden so immer ihre Session
  const sentSessions = sessions;
  return {
    items: [...sentSessions, ...limitedAttempts],
    body: {
      sessions: sentSessions.map((s) => s.payload as QueuedSession),
      attempts: limitedAttempts.map((a) => a.payload as QueuedAttempt),
      states_since: statesSince,
    },
  };
}

export interface SyncOutcome {
  done: number[];
  failed: Array<{ id: number; error: string }>;
  retry: number[];
}

/**
 * Ordnet die Serverantwort den gesendeten Elementen zu. Versuche mit ok=true sind erledigt; Fehler, die vom Server
 * fachlich abgelehnt wurden (z. B. unbekannte Frage), werden als failed markiert. Sessions gelten als erledigt,
 * sobald der Server geantwortet hat (Upsert ist idempotent) und keine offenen Versuche mehr auf sie verweisen.
 */
export function applySyncResponse(batch: SyncBatch, response: SyncResponse): SyncOutcome {
  const byAttemptId = new Map(response.results.map((r) => [r.client_attempt_id, r]));
  const outcome: SyncOutcome = { done: [], failed: [], retry: [] };
  const openSessions = new Set<string>();
  for (const it of batch.items) {
    if (it.operation !== "insert_attempts") continue;
    const p = it.payload as QueuedAttempt;
    const r = byAttemptId.get(p.client_attempt_id);
    if (r?.ok) outcome.done.push(it.id);
    else if (r && r.error === "Session unbekannt") { outcome.retry.push(it.id); openSessions.add(p.client_session_id); }
    else if (r) outcome.failed.push({ id: it.id, error: r.error ?? "Vom Server abgelehnt" });
    else outcome.retry.push(it.id);
  }
  for (const it of batch.items) {
    if (it.operation !== "upsert_session") continue;
    const p = it.payload as QueuedSession;
    if (openSessions.has(p.client_session_id)) outcome.retry.push(it.id);
    else outcome.done.push(it.id);
  }
  return outcome;
}

/** Schreibt das Ergebnis in den Store. */
export async function persistOutcome(store: QueueStore, outcome: SyncOutcome, items: QueueItem[]): Promise<void> {
  const byId = new Map(items.map((i) => [i.id, i]));
  for (const id of outcome.done) await store.update(id, { status: "done", last_error: null });
  for (const f of outcome.failed) await store.update(f.id, { status: "failed", last_error: f.error, attempts: (byId.get(f.id)?.attempts ?? 0) + 1 });
  for (const id of outcome.retry) {
    const attempts = (byId.get(id)?.attempts ?? 0) + 1;
    await store.update(id, { status: attempts >= MAX_RETRIES ? "failed" : "pending", attempts, last_error: attempts >= MAX_RETRIES ? "Zu viele Versuche" : null });
  }
}

export function pendingCount(items: QueueItem[]): number {
  return items.filter((i) => i.operation === "insert_attempts" && (i.status === "pending" || i.status === "sent")).length;
}

export type { QueueOperation };
