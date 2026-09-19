import { API_URL, supabase } from "./supabase";

/** Aufruf der Web-API (Next.js) mit dem Supabase-Access-Token als Bearer. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Nicht angemeldet");
  if (!API_URL) throw new Error("EXPO_PUBLIC_API_URL fehlt");
  const res = await fetch(`${API_URL}${path}`, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init.headers ?? {}) } });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `Fehler ${res.status}`);
  return body;
}
