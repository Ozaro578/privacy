import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { TenantRole } from "@fahrpilot/db";
import { ADMIN_ROLES, OFFICE_ROLES, STAFF_ROLES } from "@fahrpilot/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AppSession {
  userId: string;
  email: string | null;
  tenantId: string | null;
  role: TenantRole | null;
  platformAdmin: boolean;
}

interface JwtAppMetadata { tenant_id?: string | null; tenant_role?: TenantRole | null; platform_admin?: boolean }

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    return JSON.parse(Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Liest die geprüften Claims des aktuellen Nutzers (Tenant und Rolle stammen aus dem Custom Access Token Hook).
 * Pro Request gecacht. Gibt null zurück, wenn niemand angemeldet ist.
 */
export const getSession = cache(async (): Promise<AppSession | null> => {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  let claims: Record<string, unknown> | null = (claimsData?.claims as Record<string, unknown> | undefined) ?? null;
  if (!claims) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return null;
    // Nur als Fallback: getUser() verifiziert das Token gegen den Auth-Server, bevor Claims verwendet werden.
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;
    claims = decodeJwtPayload(token);
    if (!claims) return null;
  }
  const meta = (claims["app_metadata"] as JwtAppMetadata | undefined) ?? {};
  return {
    userId: String(claims["sub"]),
    email: (claims["email"] as string | undefined) ?? null,
    tenantId: meta.tenant_id ?? null,
    role: meta.tenant_role ?? null,
    platformAdmin: meta.platform_admin === true,
  };
});

export async function requireSession(): Promise<AppSession> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(allowed: readonly TenantRole[]): Promise<AppSession & { tenantId: string; role: TenantRole }> {
  const session = await requireSession();
  if (!session.tenantId || !session.role || !allowed.includes(session.role)) redirect("/zugang-verweigert");
  return session as AppSession & { tenantId: string; role: TenantRole };
}

export const requireStudent = () => requireRole(["student"]);
export const requireStaff = () => requireRole(STAFF_ROLES);
export const requireOffice = () => requireRole(OFFICE_ROLES);
export const requireAdmin = () => requireRole(ADMIN_ROLES);

export async function requirePlatformAdmin(): Promise<AppSession> {
  const session = await requireSession();
  if (!session.platformAdmin) redirect("/zugang-verweigert");
  return session;
}

/** Startroute je Rolle. */
export function homeFor(session: AppSession | null): string {
  if (!session) return "/login";
  if (session.platformAdmin && !session.role) return "/plattform";
  switch (session.role) {
    case "student": return "/heute";
    case "instructor": return "/lehrer";
    case "office": case "admin": case "owner": return "/verwaltung";
    default: return "/onboarding";
  }
}
