"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Json } from "@fahrpilot/db";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionState } from "./auth";

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
  const admin = createSupabaseAdminClient();
  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email: data.email, password: data.password, email_confirm: false,
    user_metadata: { first_name: data.first_name, last_name: data.last_name, locale: data.locale },
  });
  if (authError || !created.user) return { error: authError?.message.includes("already") ? "Für diese E-Mail-Adresse existiert bereits ein Konto. Bitte anmelden." : "Konto konnte nicht angelegt werden." };
  const { data: tenant } = await admin.from("driving_schools").select("id").eq("slug", tenantSlug).single();
  if (!tenant) return { error: "Fahrschule nicht gefunden." };
  // Registrierung als der neue Nutzer ausführen (auth.uid() wird über die Service-Role-Session nicht gesetzt, daher explizit)
  const { data: studentId, error: regError } = await admin.rpc("register_student", { p_tenant_slug: tenantSlug, p_payload: { ...data, user_id: created.user.id } as unknown as Json });
  if (regError || !studentId) return { error: "Anmeldung konnte nicht gespeichert werden." };
  await admin.from("students").update({ user_id: created.user.id }).eq("id", studentId);
  await admin.from("tenant_memberships").upsert({ tenant_id: tenant.id, user_id: created.user.id, role: "student", status: "active" }, { onConflict: "tenant_id,user_id" });
  await admin.from("users").update({ active_tenant_id: tenant.id }).eq("id", created.user.id);
  await admin.from("consents").insert([
    { tenant_id: tenant.id, user_id: created.user.id, student_id: studentId, consent_type: "privacy_policy", text_version: "2026-09", granted: true },
    { tenant_id: tenant.id, user_id: created.user.id, student_id: studentId, consent_type: "terms", text_version: "2026-09", granted: true },
  ]);
  const supabase = await createSupabaseServerClient();
  const { error: loginError } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
  if (loginError) redirect("/login?registriert=1");
  redirect("/heute");
}
