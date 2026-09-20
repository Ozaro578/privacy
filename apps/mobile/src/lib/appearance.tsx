import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_APPEARANCE, parseAppearance, type Appearance } from "@fahrpilot/ui/palettes";
import { kvGet, kvSet } from "./content-store";
import { supabase } from "./supabase";

interface Ctx { appearance: Appearance; setAppearance: (a: Appearance, persist?: boolean) => Promise<void>; ready: boolean }
const AppearanceContext = createContext<Ctx>({ appearance: DEFAULT_APPEARANCE, setAppearance: async () => undefined, ready: false });

/** Darstellung (Farbwelt, Hell/Dunkel, Schriftgröße, Bewegung, Ton): lokal gecacht, serverseitig in users.accessibility. */
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, set] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [ready, setReady] = useState(false);
  useEffect(() => { (async () => { try { const raw = await kvGet("appearance"); if (raw) set(parseAppearance(JSON.parse(raw))); } catch { /* Standard */ } setReady(true); })(); }, []);
  const setAppearance = useCallback(async (a: Appearance, persist = true) => {
    set(a);
    await kvSet("appearance", JSON.stringify(a));
    if (persist) {
      const { data } = await supabase.auth.getUser();
      if (data.user) await supabase.from("users").update({ accessibility: { ...a } }).eq("id", data.user.id);
    }
  }, []);
  return <AppearanceContext.Provider value={{ appearance, setAppearance, ready }}>{children}</AppearanceContext.Provider>;
}
export const useAppearance = () => useContext(AppearanceContext);
