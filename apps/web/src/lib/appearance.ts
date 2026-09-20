import { cache } from "react";
import { DEFAULT_APPEARANCE, parseAppearance, type Appearance } from "@fahrpilot/ui/palettes";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Darstellungseinstellungen des angemeldeten Nutzers (users.accessibility); Standard ohne Anmeldung. */
export const getAppearance = cache(async (): Promise<Appearance> => {
  const session = await getSession();
  if (!session) return DEFAULT_APPEARANCE;
  const db = await createSupabaseServerClient();
  const { data } = await db.from("users").select("accessibility").eq("id", session.userId).maybeSingle();
  return parseAppearance(data?.accessibility);
});

/** Attribute für <html>, die palettes.css auswertet. */
export function appearanceAttributes(a: Appearance): Record<string, string | undefined> {
  return {
    "data-palette": a.palette,
    "data-theme": a.theme === "system" ? undefined : a.theme,
    "data-fontsize": a.fontSize === "md" ? undefined : a.fontSize,
    "data-motion": a.motion === "reduced" ? "reduced" : undefined,
    "data-sound": a.sound ? undefined : "off",
  };
}
