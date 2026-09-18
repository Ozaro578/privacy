"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSession, homeFor } from "@/lib/auth/session";

const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(8), next: z.string().optional() });

export interface ActionState { error?: string; ok?: boolean; message?: string }

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = LoginSchema.safeParse({ email: formData.get("email"), password: formData.get("password"), next: formData.get("next") ?? undefined });
  if (!parsed.success) return { error: "Bitte E-Mail-Adresse und ein Passwort mit mindestens 8 Zeichen eingeben." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) return { error: "Anmeldung fehlgeschlagen. Bitte Zugangsdaten prüfen." };
  const session = await getSession();
  redirect(parsed.data.next && parsed.data.next.startsWith("/") ? parsed.data.next : homeFor(session));
}

export async function magicLinkAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = z.string().email().safeParse(formData.get("email"));
  if (!email.success) return { error: "Bitte eine gültige E-Mail-Adresse eingeben." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({ email: email.data, options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/auth/callback` } });
  if (error) return { error: "Der Anmeldelink konnte nicht gesendet werden." };
  return { ok: true, message: "Wir haben dir einen Anmeldelink per E-Mail geschickt." };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Wechselt die aktive Fahrschule (Nutzer mit mehreren Mitgliedschaften) und erneuert die Session-Claims. */
export async function switchTenantAction(tenantId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("switch_active_tenant", { p_tenant_id: tenantId });
  if (error) throw new Error(error.message);
  await supabase.auth.refreshSession();
  const session = await getSession();
  redirect(homeFor(session));
}
