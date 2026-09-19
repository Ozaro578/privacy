import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export interface Claims { tenantId: string | null; role: string | null; userId: string; email: string | null }

interface Ctx { session: Session | null; claims: Claims | null; loading: boolean; signOut: () => Promise<void> }
const SessionContext = createContext<Ctx>({ session: null, claims: null, loading: true, signOut: async () => undefined });

function decode(token: string): Claims | null {
  try {
    const part = token.split(".")[1] ?? "";
    const json = JSON.parse(decodeURIComponent(atob(part.replace(/-/g, "+").replace(/_/g, "/")).split("").map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""))) as Record<string, unknown>;
    const meta = (json["app_metadata"] as { tenant_id?: string; tenant_role?: string } | undefined) ?? {};
    return { tenantId: meta.tenant_id ?? null, role: meta.tenant_role ?? null, userId: String(json["sub"]), email: (json["email"] as string | undefined) ?? null };
  } catch { return null; }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  const value = useMemo<Ctx>(() => ({ session, claims: session ? decode(session.access_token) : null, loading, signOut: async () => { await supabase.auth.signOut(); } }), [session, loading]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
