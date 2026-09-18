"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@fahrpilot/db";

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

/** Browser-Client (nur Anon-Key, RLS greift). */
export function createSupabaseBrowserClient() {
  client ??= createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  return client;
}
