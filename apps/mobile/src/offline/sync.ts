import { applySyncResponse, buildSyncBatch, pendingCount, persistOutcome, type QueueStore } from "./queue";
import { clearDirty, mergeStates } from "./merge";
import type { LocalQuestionState, QueuedAttempt, SyncRequestBody, SyncResponse } from "./types";

/** Lokaler Zustandsspeicher (SQLite-Tabelle question_states) hinter einer kleinen Schnittstelle. */
export interface StateStore {
  loadAll(): Promise<Map<string, LocalQuestionState>>;
  saveMany(states: Iterable<LocalQuestionState>): Promise<void>;
}

/** Schlüssel-Wert-Speicher für Metadaten (letzter Sync, Serie, Tagesziel). */
export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

export const KV_LAST_SYNC = "sync.last_server_time";
export const KV_STREAK = "sync.streak";
export const KV_DAILY_GOAL = "sync.daily_goal";

export interface SyncDeps {
  queue: QueueStore;
  states: StateStore;
  kv: KeyValueStore;
  /** Sendet die Warteschlange an POST /api/sync (mit Bearer-Token). Wirft bei Netzwerk- oder Auth-Fehlern. */
  send(body: SyncRequestBody): Promise<SyncResponse>;
  isOnline(): Promise<boolean>;
}

export interface SyncSummary {
  sent: number;
  done: number;
  failed: number;
  retry: number;
  statesApplied: number;
  statesKeptLocal: number;
  skipped: "offline" | "busy" | "empty" | null;
  error: string | null;
}

/**
 * Sync-Service: schickt die Warteschlange in Reihenfolge an den Server, übernimmt die zurückgegebenen
 * Zustände (Server gewinnt) und speichert Serie und Tagesziel. Parallele Aufrufe werden zusammengeführt.
 */
export class SyncService {
  private running: Promise<SyncSummary> | null = null;
  private listeners = new Set<(s: SyncSummary) => void>();
  constructor(private readonly deps: SyncDeps) {}

  onDone(listener: (s: SyncSummary) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  flush(): Promise<SyncSummary> {
    if (this.running) return this.running;
    this.running = this.run().finally(() => { this.running = null; });
    return this.running;
  }

  private async run(): Promise<SyncSummary> {
    const empty: SyncSummary = { sent: 0, done: 0, failed: 0, retry: 0, statesApplied: 0, statesKeptLocal: 0, skipped: null, error: null };
    if (!(await this.deps.isOnline())) return this.finish({ ...empty, skipped: "offline" });
    let summary = { ...empty };
    // Mehrere Runden, falls mehr als 500 Versuche anstehen
    for (let round = 0; round < 10; round++) {
      const items = await this.deps.queue.list();
      const since = await this.deps.kv.get(KV_LAST_SYNC);
      const batch = buildSyncBatch(items, since);
      const hasWork = batch.body.attempts.length > 0 || batch.body.sessions.length > 0;
      if (!hasWork && round > 0) break;
      for (const it of batch.items) await this.deps.queue.update(it.id, { status: "sent" });
      let response: SyncResponse;
      try {
        response = await this.deps.send(batch.body);
      } catch (e) {
        for (const it of batch.items) await this.deps.queue.update(it.id, { status: "pending" });
        return this.finish({ ...summary, error: e instanceof Error ? e.message : "Sync fehlgeschlagen" });
      }
      const outcome = applySyncResponse(batch, response);
      await persistOutcome(this.deps.queue, outcome, batch.items);
      // Zustände zusammenführen: Server gewinnt, lokale unbestätigte Zustände bleiben nur, wenn sie jünger sind
      const local = await this.deps.states.loadAll();
      const merged = mergeStates(local, response.states);
      const confirmed = batch.items.filter((i) => i.operation === "insert_attempts" && outcome.done.includes(i.id)).map((i) => (i.payload as QueuedAttempt).question_id);
      const stillPending = new Set((await this.deps.queue.list("pending")).filter((i) => i.operation === "insert_attempts").map((i) => (i.payload as QueuedAttempt).question_id));
      clearDirty(merged.merged, [...new Set(confirmed)].filter((id) => !stillPending.has(id)));
      await this.deps.states.saveMany(merged.merged.values());
      if (response.streak) await this.deps.kv.set(KV_STREAK, JSON.stringify(response.streak));
      if (response.daily_goal) await this.deps.kv.set(KV_DAILY_GOAL, JSON.stringify(response.daily_goal));
      if (response.server_time) await this.deps.kv.set(KV_LAST_SYNC, response.server_time);
      summary = {
        ...summary, sent: summary.sent + batch.body.attempts.length, done: summary.done + outcome.done.filter((id) => batch.items.find((i) => i.id === id)?.operation === "insert_attempts").length,
        failed: summary.failed + outcome.failed.length, retry: summary.retry + outcome.retry.length, statesApplied: summary.statesApplied + merged.applied, statesKeptLocal: summary.statesKeptLocal + merged.keptLocal,
      };
      if (!hasWork) { summary.skipped = "empty"; break; }
      if (pendingCount(await this.deps.queue.list()) === 0 || outcome.retry.length > 0) break;
    }
    // Erledigte Einträge nach 7 Tagen aufräumen
    await this.deps.queue.remove("done", new Date(Date.now() - 7 * 86_400_000).toISOString());
    return this.finish(summary);
  }

  private finish(s: SyncSummary): SyncSummary {
    for (const l of this.listeners) l(s);
    return s;
  }
}
