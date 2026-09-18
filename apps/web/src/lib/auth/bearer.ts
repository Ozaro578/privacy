import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database, TenantRole } from "@fahrpilot/db";
import { publicEnv } from "@/lib/env";
import type { AppSession } from "@/lib/auth/session";

export interface BearerAuth {
  /** Supabase-Client mit dem Nutzer-Token (RLS greift wie im Browser). */
  db: SupabaseClient<Database>;
  session: AppSession;
  accessToken: string;
}

interface JwtAppMetadata { tenant_id?: string | null; tenant_role?: TenantRole | null; platform_admin?: boolean }

/**
 * Baut aus einem "Authorization: Bearer <access_token>"-Header einen Supabase-Client und prüft die Claims.
 * Für die Mobile-App (kein Cookie). Gibt null zurück, wenn kein oder ein ungültiges Token übergeben wurde.
 */
export async function getBearerAuth(authorization: string | null | undefined): Promise<BearerAuth | null> {
  if (!authorization) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  const token = match?.[1]?.trim();
  if (!token) return null;
  const db = createClient<Database>(publicEnv.supabaseUrl(), publicEnv.supabaseAnonKey(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data, error } = await db.auth.getClaims(token);
  if (error || !data?.claims) return null;
  const claims = data.claims as Record<string, unknown>;
  const meta = (claims["app_metadata"] as JwtAppMetadata | undefined) ?? {};
  const sub = claims["sub"];
  if (typeof sub !== "string" || !sub) return null;
  return {
    db,
    accessToken: token,
    session: {
      userId: sub,
      email: (claims["email"] as string | undefined) ?? null,
      tenantId: meta.tenant_id ?? null,
      role: meta.tenant_role ?? null,
      platformAdmin: meta.platform_admin === true,
    },
  };
}

/** Bearer-Auth aus den Headern des aktuellen Requests (Route Handler und darin aufgerufene Server-Funktionen). Pro Request gecacht. */
export const getBearerAuthFromRequest = cache(async (): Promise<BearerAuth | null> => {
  try {
    const h = await headers();
    return await getBearerAuth(h.get("authorization"));
  } catch {
    return null;
  }
});
