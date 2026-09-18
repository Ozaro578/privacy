import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@fahrpilot/db";
import { publicEnv, serverEnv } from "@/lib/env";

/** Supabase-Client für Server Components, Server Actions und Route Handler (nutzt Session-Cookies, RLS greift). */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(publicEnv.supabaseUrl(), publicEnv.supabaseAnonKey(), {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // In Server Components ist das Setzen nicht erlaubt; der Proxy erneuert die Session.
        }
      },
    },
  });
}

/** Service-Role-Client: umgeht RLS. Ausschließlich für serverseitige, geprüfte Abläufe (Webhooks, Registrierung, Cron). */
export function createSupabaseAdminClient() {
  return createClient<Database>(publicEnv.supabaseUrl(), serverEnv.supabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
