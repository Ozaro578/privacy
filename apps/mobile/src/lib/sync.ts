import NetInfo from "@react-native-community/netinfo";
import { SyncService, type SyncSummary } from "@/offline/sync";
import { enqueueAttempt, enqueueSession } from "@/offline/queue";
import type { QueuedAttempt, QueuedSession, SyncRequestBody, SyncResponse } from "@/offline/types";
import { SqliteKvStore, SqliteQueueStore, SqliteStateStore } from "./db";
import { apiFetch } from "./api";

export const queueStore = new SqliteQueueStore();
export const stateStore = new SqliteStateStore();
export const kvStore = new SqliteKvStore();

export const syncService = new SyncService({
  queue: queueStore, states: stateStore, kv: kvStore,
  send: (body: SyncRequestBody) => apiFetch<SyncResponse>("/api/sync", { method: "POST", body: JSON.stringify(body) }),
  isOnline: async () => (await NetInfo.fetch()).isConnected === true,
});

export const queueSession = (s: QueuedSession) => enqueueSession(queueStore, s);
export const queueAttempt = (a: QueuedAttempt) => enqueueAttempt(queueStore, a);

/** Startet den Sync bei Netzwechsel und beim App-Start. */
export function startAutoSync(onDone?: (s: SyncSummary) => void): () => void {
  const off = onDone ? syncService.onDone(onDone) : () => undefined;
  const unsub = NetInfo.addEventListener((state) => { if (state.isConnected) void syncService.flush(); });
  void syncService.flush();
  return () => { off(); unsub(); };
}
