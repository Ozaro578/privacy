import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@fahrpilot/db";
import { secureSessionStorage } from "./secure-storage";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

/** Supabase-Client der App (nur Anon-Key, RLS greift). Die Sitzung liegt verschlüsselt im Schlüsselbund des Geräts. */
export const supabase = createClient<Database>(url, anonKey, {
  auth: { storage: secureSessionStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});
