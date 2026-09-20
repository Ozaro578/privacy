"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";
import { getStudentContext } from "@/lib/data/student";
import type { ActionResult } from "./lessons";

const PrefSchema = z.object({ type: z.string().min(1).max(60), push: z.boolean(), email: z.boolean(), in_app: z.boolean(), quietStart: z.string().nullable().default(null), quietEnd: z.string().nullable().default(null) });

export async function saveNotificationPreference(raw: z.input<typeof PrefSchema>): Promise<ActionResult> {
  const input = PrefSchema.parse(raw);
  const session = await requireSession();
  const db = await createSupabaseServerClient();
  const { error } = await db.from("notification_preferences").upsert({ user_id: session.userId, notification_type: input.type, push: input.push, email: input.email, in_app: input.in_app, quiet_hours_start: input.quietStart, quiet_hours_end: input.quietEnd }, { onConflict: "user_id,notification_type" });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/profil");
  return { ok: true, message: "Gespeichert." };
}

const DocSchema = z.object({ documentId: z.string().uuid(), storagePath: z.string().min(3).max(300), mimeType: z.string().max(100), sizeBytes: z.number().int().min(1).max(20_000_000) });

/** Nach dem Upload in den privaten Storage-Bucket (Pfad tenant/student/...) wird der Datensatz aktualisiert. */
export async function markDocumentUploaded(raw: z.input<typeof DocSchema>): Promise<ActionResult> {
  const input = DocSchema.parse(raw);
  const ctx = await getStudentContext();
  if (!input.storagePath.startsWith(`${ctx.tenantId}/${ctx.student.id}/`)) return { ok: false, message: "Ungültiger Speicherpfad." };
  const { error } = await ctx.db.from("documents").update({ storage_path: input.storagePath, mime_type: input.mimeType, size_bytes: input.sizeBytes, status: "uploaded", uploaded_by: ctx.userId }).eq("id", input.documentId).eq("student_id", ctx.student.id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/profil");
  revalidatePath("/heute");
  return { ok: true, message: "Dokument hochgeladen. Die Fahrschule prüft es." };
}

export async function requestDataExport(kind: "export" | "deletion"): Promise<ActionResult> {
  const session = await requireSession();
  const db = await createSupabaseServerClient();
  const { data: student } = await db.from("students").select("id").eq("user_id", session.userId).maybeSingle();
  const { error } = await db.from("data_requests").insert({ tenant_id: session.tenantId, user_id: session.userId, student_id: student?.id ?? null, kind });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: kind === "export" ? "Datenexport angefragt. Du erhältst eine Nachricht, sobald er bereitsteht." : "Löschung angefragt. Die Fahrschule prüft gesetzliche Aufbewahrungsfristen und meldet sich." };
}

export async function updateLocale(locale: "de" | "en" | "tr" | "ar"): Promise<void> {
  const session = await requireSession();
  const db = await createSupabaseServerClient();
  await db.from("users").update({ locale }).eq("id", session.userId);
  await db.from("students").update({ preferred_locale: locale }).eq("user_id", session.userId);
  revalidatePath("/", "layout");
}

const AppearanceSchema = z.object({
  palette: z.enum(["klar", "sonne", "wald", "beere", "meer", "graphit"]),
  theme: z.enum(["system", "light", "dark"]),
  fontSize: z.enum(["md", "lg", "xl"]),
  motion: z.enum(["system", "reduced"]),
  sound: z.boolean(),
});

/** Speichert Farbwelt, Hell/Dunkel, Schriftgröße, Bewegung und Ton des Nutzers (users.accessibility). */
export async function saveAppearance(raw: z.input<typeof AppearanceSchema>): Promise<ActionResult> {
  const session = await requireSession();
  const p = AppearanceSchema.safeParse(raw);
  if (!p.success) return { ok: false, message: "Ungültige Einstellung" };
  const db = await createSupabaseServerClient();
  const { error } = await db.from("users").update({ accessibility: p.data }).eq("id", session.userId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/", "layout");
  return { ok: true, message: "Darstellung gespeichert." };
}
