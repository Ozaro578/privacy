// Datenspeicher (Netlify Blobs). Immer dauerhafter (globaler) Speicher, damit bei neuen
// Deployments nichts verloren geht. Vorschau-Deployments bekommen einen eigenen Namen.
import { getStore } from "@netlify/blobs";

type Store = {
  get(key: string, opt?: { type?: "json" | "text" }): Promise<any>;
  setJSON(key: string, value: unknown): Promise<void>;
  list(opt?: { prefix?: string }): Promise<{ blobs: { key: string }[] }>;
  delete(key: string): Promise<void>;
};

let cache: Store | null = null;

export function speicher(): Store {
  const g = globalThis as any;
  if (g.__ZB_TEST_STORE) return g.__ZB_TEST_STORE as Store; // nur für lokale Tests
  if (cache) return cache;
  const kontext = String(g.Netlify?.context?.deploy?.context || "production");
  const name = kontext === "production" ? "zukkabro" : "zukkabro-" + kontext.replace(/[^a-z0-9-]/gi, "").slice(0, 40);
  cache = getStore({ name, consistency: "strong" }) as unknown as Store;
  return cache;
}

export async function lese<T>(key: string): Promise<T | null> {
  return (await speicher().get(key, { type: "json" })) as T | null;
}

export async function schreibe(key: string, wert: unknown): Promise<void> {
  await speicher().setJSON(key, wert);
}

/** Alle Einträge mit Präfix laden (parallel, begrenzt). */
export async function leseAlle<T>(prefix: string): Promise<T[]> {
  const { blobs } = await speicher().list({ prefix });
  const keys = blobs.map((b) => b.key).sort();
  const out: T[] = new Array(keys.length);
  let i = 0;
  async function arbeiter() {
    while (i < keys.length) {
      const k = i++;
      out[k] = (await lese<T>(keys[k])) as T;
    }
  }
  await Promise.all(Array.from({ length: Math.min(16, keys.length) }, arbeiter));
  return out.filter(Boolean);
}
