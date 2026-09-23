import "server-only";
import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/** Grenzwerte je Aktion: Anzahl erlaubter Ereignisse im Zeitfenster (Sekunden). */
export const LIMITS = {
  loginIp: { max: 30, window: 600 },
  loginAccount: { max: 8, window: 600 },
  registerIp: { max: 10, window: 3600 },
  magicLinkIp: { max: 10, window: 3600 },
  coachStudentDay: { max: 60, window: 86_400 },
  instructorAiDay: { max: 100, window: 86_400 },
} as const;
export type LimitName = keyof typeof LIMITS;

/** Client-IP aus den Proxy-Headern (Vercel setzt x-forwarded-for; erster Eintrag ist der Client). */
export async function clientIp(): Promise<string> {
  try {
    const h = await headers();
    return (h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unbekannt").slice(0, 64);
  } catch {
    return "unbekannt";
  }
}

/**
 * Zählt ein Ereignis und meldet, ob es noch erlaubt ist. Ohne Datenbankverbindung (lokale Vorschau) wird nicht blockiert,
 * damit die App ohne Backend bedienbar bleibt; Fehler werden protokolliert.
 */
export async function allow(name: LimitName, subject: string): Promise<boolean> {
  const { max, window } = LIMITS[name];
  try {
    const { data, error } = await createSupabaseAdminClient().rpc("hit_rate_limit", { p_key: `${name}:${subject.toLowerCase()}`, p_window_seconds: window, p_max: max });
    if (error) { console.error("Rate-Limit nicht prüfbar", error.message); return true; }
    return data !== false;
  } catch (e) {
    console.error("Rate-Limit nicht prüfbar", e);
    return true;
  }
}

export const TOO_MANY = "Zu viele Versuche in kurzer Zeit. Bitte warte einige Minuten und versuche es dann erneut.";
