// Passwörter, Sitzungen, Schutz vor Missbrauch
import { createHmac, randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";

export type Rolle = "admin" | "haendler";
export interface Sitzung { r: Rolle; id: string; n: string; exp: number }

const COOKIE = "zb_sess";
const DAUER_S = 8 * 60 * 60; // 8 Stunden

function env(name: string): string {
  const g = globalThis as any;
  const v = g.Netlify?.env?.get?.(name) ?? process.env[name];
  return typeof v === "string" ? v : "";
}

/* ---------- Passwort-Hashes (scrypt) ---------- */
export function hashPasswort(passwort: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(passwort, salt, 32, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function pruefePasswort(passwort: string, gespeichert: string): boolean {
  const teile = (gespeichert || "").split("$");
  if (teile.length !== 4 || teile[0] !== "scrypt") {
    scryptSync(passwort, "ausgleich", 32); // gleiche Rechenzeit, auch wenn Konto fehlt
    return false;
  }
  const N = parseInt(teile[1], 10);
  const salt = Buffer.from(teile[2], "base64");
  const soll = Buffer.from(teile[3], "base64");
  const ist = scryptSync(passwort, salt, soll.length, { N, r: 8, p: 1 });
  return ist.length === soll.length && timingSafeEqual(ist, soll);
}

/* ---------- Admin-Konten aus Umgebungsvariable ADMIN_USERS ----------
   Format: name1=scrypt$...;name2=scrypt$...                        */
export function adminKonten(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const eintrag of env("ADMIN_USERS").split(";")) {
    const i = eintrag.indexOf("=");
    if (i > 0) out[eintrag.slice(0, i).trim().toLowerCase()] = eintrag.slice(i + 1).trim();
  }
  return out;
}

/* ---------- Sitzungs-Cookie (HMAC-signiert) ---------- */
function geheim(): string {
  const s = env("SESSION_SECRET");
  if (s.length < 32) throw new Error("SESSION_SECRET fehlt oder ist zu kurz");
  return s;
}
function b64u(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}
function signiere(daten: string): string {
  return createHmac("sha256", geheim()).update(daten).digest("base64url");
}

export function sitzungsCookie(s: Omit<Sitzung, "exp">): string {
  const payload = b64u(JSON.stringify({ ...s, exp: Math.floor(Date.now() / 1000) + DAUER_S }));
  const wert = `${payload}.${signiere(payload)}`;
  return `${COOKIE}=${wert}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${DAUER_S}`;
}
export function abmeldeCookie(): string {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function leseSitzung(req: Request): Sitzung | null {
  const cookies = req.headers.get("cookie") || "";
  const m = cookies.split(/;\s*/).find((c) => c.startsWith(COOKIE + "="));
  if (!m) return null;
  const [payload, sig] = m.slice(COOKIE.length + 1).split(".");
  if (!payload || !sig) return null;
  const soll = Buffer.from(signiere(payload));
  const ist = Buffer.from(sig);
  if (soll.length !== ist.length || !timingSafeEqual(soll, ist)) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Sitzung;
    if (!s.exp || s.exp < Date.now() / 1000) return null;
    if (s.r !== "admin" && s.r !== "haendler") return null;
    return s;
  } catch {
    return null;
  }
}

export function kurzHash(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 32);
}

export function neueId(praefix = ""): string {
  const d = new Date();
  const datum = d.toISOString().slice(0, 10).replace(/-/g, "");
  return `${praefix}${datum}-${randomBytes(4).toString("hex").toUpperCase()}`;
}
