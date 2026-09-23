/** Nur echte relative Pfade innerhalb der App zulassen (kein //host, kein /\host, keine absoluten URLs). */
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || typeof next !== "string") return fallback;
  if (!/^\/(?![\/\\])/.test(next)) return fallback;
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  return next;
}
