import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useSession } from "./session";
import { loadProfile, refreshContent, type StudentProfile } from "./content";
import { kvGet } from "./content-store";
import { startAutoSync } from "./sync";
import { useAppearance } from "./appearance";

interface Ctx { profile: StudentProfile | null; loading: boolean; error: string | null; online: boolean; refresh: () => Promise<void>; lastRefresh: string | null }
const ProfileContext = createContext<Ctx>({ profile: null, loading: true, error: null, online: true, refresh: async () => undefined, lastRefresh: null });

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { claims } = useSession();
  const { setAppearance } = useAppearance();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    if (!claims?.tenantId) return;
    try {
      const p = await loadProfile(claims.userId, claims.tenantId);
      setProfile(p);
      if (p) { void setAppearance(p.appearance, false); }
      if (p) { await refreshContent(p); setLastRefresh(new Date().toISOString()); }
      setError(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Daten konnten nicht geladen werden"); }
  }, [claims?.tenantId, claims?.userId, setAppearance]);
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const cached = await kvGet("content.refreshed_at");
      if (active) setLastRefresh(cached);
      await refresh();
      if (active) setLoading(false);
    })();
    const stop = startAutoSync((s) => setOnline(s.skipped !== "offline" && !s.error));
    return () => { active = false; stop(); };
  }, [refresh]);
  return <ProfileContext.Provider value={{ profile, loading, error, online, refresh, lastRefresh }}>{children}</ProfileContext.Provider>;
}
export const useProfile = () => useContext(ProfileContext);
