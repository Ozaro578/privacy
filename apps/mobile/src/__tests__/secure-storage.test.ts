import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();
vi.mock("expo-secure-store", () => ({
  getItemAsync: async (k: string) => store.get(k) ?? null,
  setItemAsync: async (k: string, v: string) => { if (!/^[A-Za-z0-9._-]+$/.test(k)) throw new Error("ungültiger Schlüssel"); if (v.length > 2048) throw new Error("zu groß"); store.set(k, v); },
  deleteItemAsync: async (k: string) => { store.delete(k); },
}));

import { secureSessionStorage, splitIntoChunks } from "../lib/secure-storage";

describe("Sitzungsablage im Schlüsselbund", () => {
  beforeEach(() => store.clear());
  it("zerlegt große Werte in Teile unter 2 KB und setzt sie wieder zusammen", async () => {
    const session = JSON.stringify({ access_token: "a".repeat(3000), refresh_token: "r".repeat(500), user: { id: "u" } });
    await secureSessionStorage.setItem("sb-projekt-auth-token", session);
    expect([...store.values()].every((v) => v.length <= 2048)).toBe(true);
    expect(await secureSessionStorage.getItem("sb-projekt-auth-token")).toBe(session);
  });
  it("räumt überzählige Teile beim Verkleinern und beim Entfernen auf", async () => {
    await secureSessionStorage.setItem("k", "x".repeat(5000));
    await secureSessionStorage.setItem("k", "kurz");
    expect(store.has("k.1")).toBe(false);
    expect(await secureSessionStorage.getItem("k")).toBe("kurz");
    await secureSessionStorage.removeItem("k");
    expect(store.size).toBe(0);
    expect(await secureSessionStorage.getItem("k")).toBeNull();
  });
  it("macht unzulässige Zeichen im Schlüssel unschädlich", async () => {
    await secureSessionStorage.setItem("sb:projekt/auth token", "wert");
    expect(await secureSessionStorage.getItem("sb:projekt/auth token")).toBe("wert");
    expect(splitIntoChunks("")).toEqual([""]);
  });
});
