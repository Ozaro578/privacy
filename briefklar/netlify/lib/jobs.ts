/**
 * Auftrags-Ablage für die Netlify-Variante: Die Auswertung läuft in einer
 * Background Function (bis 15 min), das Ergebnis wartet kurz in Netlify Blobs,
 * bis die App es abholt – danach wird es gelöscht (spätestens nach 1 Stunde).
 */
import { getStore } from "@netlify/blobs";
import type { ExplainResult, ApiError } from "@briefklar/shared";

export const JOB_TTL_MS = 60 * 60 * 1000;
export const JOB_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type JobRecord =
  | { status: "done"; result: ExplainResult }
  | { status: "error"; error: ApiError["error"] };

export function jobStore() {
  return getStore({ name: "briefklar-jobs", consistency: "strong" });
}

export async function saveJob(id: string, record: JobRecord): Promise<void> {
  await jobStore().setJSON(id, record, { metadata: { createdAt: Date.now() } });
}

export async function takeJob(id: string): Promise<JobRecord | null> {
  const store = jobStore();
  const record = (await store.get(id, { type: "json" })) as JobRecord | null;
  if (record) await store.delete(id);
  return record;
}

export async function sweepJobs(now = Date.now()): Promise<number> {
  const store = jobStore();
  const { blobs } = await store.list();
  let removed = 0;
  for (const { key } of blobs) {
    const meta = await store.getMetadata(key);
    const createdAt = Number((meta?.metadata as { createdAt?: number } | undefined)?.createdAt ?? 0);
    if (!createdAt || now - createdAt > JOB_TTL_MS) {
      await store.delete(key);
      removed++;
    }
  }
  return removed;
}
