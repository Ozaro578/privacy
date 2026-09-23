import * as SecureStore from "expo-secure-store";

/**
 * Speicher für die Supabase-Sitzung im verschlüsselten Schlüsselbund (iOS Keychain, Android Keystore).
 * SecureStore erlaubt je Eintrag etwa 2 KB; Sitzungen sind größer und werden deshalb in Teile zerlegt.
 */
const CHUNK = 1800;
const countKey = (key: string) => `${key}.n`;
const partKey = (key: string, i: number) => `${key}.${i}`;
// SecureStore erlaubt nur Buchstaben, Ziffern, Punkt, Minus und Unterstrich in Schlüsseln
const safe = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, "_");

export function splitIntoChunks(value: string, size: number = CHUNK): string[] {
  const parts: string[] = [];
  for (let i = 0; i < value.length; i += size) parts.push(value.slice(i, i + size));
  return parts.length ? parts : [""];
}

export const secureSessionStorage = {
  async getItem(rawKey: string): Promise<string | null> {
    const key = safe(rawKey);
    const n = Number(await SecureStore.getItemAsync(countKey(key)));
    if (!Number.isInteger(n) || n <= 0) return null;
    const parts: string[] = [];
    for (let i = 0; i < n; i++) {
      const p = await SecureStore.getItemAsync(partKey(key, i));
      if (p === null) return null;
      parts.push(p);
    }
    return parts.join("");
  },
  async setItem(rawKey: string, value: string): Promise<void> {
    const key = safe(rawKey);
    const old = Number(await SecureStore.getItemAsync(countKey(key))) || 0;
    const parts = splitIntoChunks(value);
    for (let i = 0; i < parts.length; i++) await SecureStore.setItemAsync(partKey(key, i), parts[i]!);
    for (let i = parts.length; i < old; i++) await SecureStore.deleteItemAsync(partKey(key, i));
    await SecureStore.setItemAsync(countKey(key), String(parts.length));
  },
  async removeItem(rawKey: string): Promise<void> {
    const key = safe(rawKey);
    const n = Number(await SecureStore.getItemAsync(countKey(key))) || 0;
    for (let i = 0; i < n; i++) await SecureStore.deleteItemAsync(partKey(key, i));
    await SecureStore.deleteItemAsync(countKey(key));
  },
};
