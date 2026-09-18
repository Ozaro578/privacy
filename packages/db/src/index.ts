export type { Database, Json, Tables, TablesInsert, TablesUpdate, Enums } from "./database.types";

/** JWT-Claims, die der Supabase Custom Access Token Hook in app_metadata setzt. */
export interface AppJwtMetadata {
  tenant_id: string | null;
  tenant_role: "student" | "instructor" | "office" | "admin" | "owner" | null;
  platform_admin: boolean;
}

export const TENANT_ROLES = ["student", "instructor", "office", "admin", "owner"] as const;
export type TenantRole = (typeof TENANT_ROLES)[number];
export const STAFF_ROLES: readonly TenantRole[] = ["instructor", "office", "admin", "owner"];
export const OFFICE_ROLES: readonly TenantRole[] = ["office", "admin", "owner"];
export const ADMIN_ROLES: readonly TenantRole[] = ["admin", "owner"];
