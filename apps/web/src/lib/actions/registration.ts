"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Json } from "@fahrpilot/db";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionState } from "./auth";
import { allow, clientIp, TOO_MANY } from "@/lib/security/rate-limit";

/**
 * Legt das Auth-Konto über den normalen Registrierungsweg an: Supabase verschickt die Bestätigungsmail, solange
 * "Confirm email" im Projekt aktiv ist (empfohlen), und liefert nur ohne Bestätigungspflicht sofort eine Sitzung.
 * Schülerdatensätze mit derselben E-Mail werden erst nach Bestätigung verknüpft (Trigger, Migration 0031).
 */
async function signUpAccount(email: string, password: string, meta: { first_name: string; last_name: string; locale: string }): Promise<{ userId: string; hasSession: boolean } | { error: string }> {
  const supabase = await createSupabaseServerClient();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: meta, emailRedirectTo: `${appUrl}/auth/callback?next=/heute` } });
  // Bei bestehender Adresse liefert Supabase (mit Bestätigungspflicht) einen Platzhalter ohne Identitäten statt eines Fehlers
  if (error?.message.toLowerCase().includes("already") || (data.user && (data.user.identities ?? []).length === 0)) return { error: "Für diese E-Mail-Adresse existiert bereits ein Konto. Bitte anmelden." };
  if (error || !data.user) return { error: "Konto konnte nicht angelegt werden. Bitte E-Mail und Passwort prüfen." };
  return { userId: data.user.id, hasSession: data.session !== null };
}

function finish(hasSession: boolean): never {
  if (hasSession) redirect("/heute");
  redirect("/login?bestaetigen=1");
}

const RegistrationSchema = z.object({
  first_name: z.string().min(1).max(80),
  last_name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  phone: z.string().max(40).optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  address_line1: z.string().max(120).optional(),
  postal_code: z.string().max(10).optional(),
  city: z.string().max(80).optional(),
  license_code: z.string().min(1).max(5),
  transmission: z.enum(["manual", "automatic"]),
  acquisition_kind: z.enum(["first", "extension"]).default("first"),
  accompanied_driving: z.boolean().default(false),
  existing_license_codes: z.array(z.string()).default([]),
  location_id: z.string().uuid().optional(),
  locale: z.enum(["de", "en", "tr", "ar"]).default("de"),
  guardian_name: z.string().max(120).optional(),
  guardian_email: z.string().email().optional().or(z.literal("")),
  guardian_phone: z.string().max(40).optional(),
  consent_privacy: z.literal(true, { errorMap: () => ({ message: "Datenschutzerklärung muss akzeptiert werden" }) }),
  consent_terms: z.literal(true, { errorMap: () => ({ message: "Vertragsbedingungen müssen akzeptiert werden" }) }),
});

function isMinor(dob: string): boolean {
  const d = new Date(dob);
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 18);
  return d > cutoff;
}

/**
 * Digitale Anmeldung: legt Auth-Nutzer, Profil, Schüler (registered), Ausbildung und Dokumenten-Checkliste an.
 * Einwilligungen werden versioniert protokolliert. Läuft mit Service-Role, weil der Nutzer noch keinen Tenant im Token hat.
 */
export async function registerStudentAction(tenantSlug: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = RegistrationSchema.safeParse({
    ...raw,
    accompanied_driving: raw["accompanied_driving"] === "on",
    consent_privacy: raw["consent_privacy"] === "on" ? true : false,
    consent_terms: raw["consent_terms"] === "on" ? true : false,
    existing_license_codes: formData.getAll("existing_license_codes").map(String),
    location_id: raw["location_id"] ? String(raw["location_id"]) : undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  const data = parsed.data;
  if (isMinor(data.date_of_birth) && !data.guardian_name) return { error: "Für Minderjährige sind die Angaben der Erziehungsberechtigten erforderlich." };
  if (!(await allow("registerIp", await clientIp()))) return { error: TOO_MANY };
  const admin = createSupabaseAdminClient();
  const { data: tenant } = await admin.from("driving_schools").select("id").eq("slug", tenantSlug).in("status", ["trial", "active"]).single();
  if (!tenant) return { error: "Fahrschule nicht gefunden." };
  const account = await signUpAccount(data.email, data.password, { first_name: data.first_name, last_name: data.last_name, locale: data.locale });
  if ("error" in account) return { error: account.error };
  // Passwort und Einwilligungs-Flags gehören nicht in den Datensatz
  const profile: Record<string, unknown> = { ...data };
  delete profile["password"]; delete profile["consent_privacy"]; delete profile["consent_terms"];
  const { data: studentId, error: regError } = await admin.rpc("register_student", { p_tenant_slug: tenantSlug, p_payload: profile as unknown as Json });
  if (regError || !studentId) return { error: "Anmeldung konnte nicht gespeichert werden." };
  await admin.from("students").update({ user_id: account.userId }).eq("id", studentId);
  await admin.from("tenant_memberships").upsert({ tenant_id: tenant.id, user_id: account.userId, role: "student", status: "active" }, { onConflict: "tenant_id,user_id" });
  await admin.from("users").update({ active_tenant_id: tenant.id }).eq("id", account.userId);
  await admin.from("consents").insert([
    { tenant_id: tenant.id, user_id: account.userId, student_id: studentId, consent_type: "privacy_policy", text_version: "2026-09", granted: true },
    { tenant_id: tenant.id, user_id: account.userId, student_id: studentId, consent_type: "terms", text_version: "2026-09", granted: true },
  ]);
  finish(account.hasSession);
}

const SELF_STUDY_SLUG = "selbstlerner";
const SelfStudySchema = z.object({
  first_name: z.string().min(1, "Vorname fehlt").max(80),
  last_name: z.string().min(1, "Nachname fehlt").max(80),
  email: z.string().email("E-Mail ungültig"),
  password: z.string().min(8, "Passwort mindestens 8 Zeichen").max(128),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geburtsdatum fehlt"),
  license_code: z.enum(["B", "B197", "B78"]).default("B"),
  transmission: z.enum(["manual", "automatic"]).default("manual"),
  locale: z.enum(["de", "en", "tr", "ar"]).default("de"),
  consent_privacy: z.literal(true, { errorMap: () => ({ message: "Datenschutzerklärung muss akzeptiert werden" }) }),
  consent_terms: z.literal(true, { errorMap: () => ({ message: "Nutzungsbedingungen müssen akzeptiert werden" }) }),
});

/**
 * Selbstlern-Konto ohne Fahrschule: nur Name, Geburtsdatum (für den Rechtsrahmen Minderjähriger), E-Mail und Passwort.
 * Der Lernende gehört zum Plattform-Mandanten "Selbstlernen"; Dokumenten-Checkliste entfällt.
 */
export async function registerSelfStudyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = SelfStudySchema.safeParse({ ...raw, consent_privacy: raw["consent_privacy"] === "on" ? true : false, consent_terms: raw["consent_terms"] === "on" ? true : false });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  const data = parsed.data;
  if (!(await allow("registerIp", await clientIp()))) return { error: TOO_MANY };
  const admin = createSupabaseAdminClient();
  const { data: tenant } = await admin.from("driving_schools").select("id").eq("slug", SELF_STUDY_SLUG).single();
  if (!tenant) return { error: "Selbstlern-Bereich ist nicht eingerichtet." };
  const account = await signUpAccount(data.email, data.password, { first_name: data.first_name, last_name: data.last_name, locale: data.locale });
  if ("error" in account) return { error: account.error };
  const { data: studentId, error: regError } = await admin.rpc("register_student", { p_tenant_slug: SELF_STUDY_SLUG, p_payload: { first_name: data.first_name, last_name: data.last_name, email: data.email, date_of_birth: data.date_of_birth, license_code: data.license_code, transmission: data.transmission, locale: data.locale } as unknown as Json });
  if (regError || !studentId) return { error: "Registrierung konnte nicht gespeichert werden." };
  await Promise.all([
    admin.from("students").update({ user_id: account.userId, status: "active" }).eq("id", studentId),
    admin.from("tenant_memberships").upsert({ tenant_id: tenant.id, user_id: account.userId, role: "student", status: "active" }, { onConflict: "tenant_id,user_id" }),
    admin.from("users").update({ active_tenant_id: tenant.id }).eq("id", account.userId),
    admin.from("documents").delete().eq("student_id", studentId),
    admin.from("consents").insert([
      { tenant_id: tenant.id, user_id: account.userId, student_id: studentId, consent_type: "privacy_policy", text_version: "2026-09", granted: true },
      { tenant_id: tenant.id, user_id: account.userId, student_id: studentId, consent_type: "terms", text_version: "2026-09", granted: true },
    ]),
  ]);
  finish(account.hasSession);
}

const JoinSchema = z.object({ slug: z.string().regex(/^[a-z0-9-]{3,40}$/, "Fahrschul-Code ungültig") });

/** Selbstlernender verbindet sich mit einer Fahrschule (Code = Anmeldelink-Kürzel). Lernstand wird übernommen. */
export async function joinSchoolAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = JoinSchema.safeParse({ slug: String(formData.get("slug") ?? "").trim().toLowerCase() });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("join_school_from_self_study", { p_tenant_slug: parsed.data.slug, p_payload: {} as unknown as Json });
  if (error) return { error: error.message.includes("nicht gefunden") ? "Fahrschule nicht gefunden. Frag deine Fahrschule nach ihrem Anmelde-Code." : error.message };
  await supabase.auth.refreshSession();
  redirect("/heute?verbunden=1");
}
