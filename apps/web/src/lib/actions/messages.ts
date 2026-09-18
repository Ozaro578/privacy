"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";
import { getStudentContext } from "@/lib/data/student";

export async function sendMessageAction(conversationId: string, body: string): Promise<void> {
  const session = await requireSession();
  const text = z.string().min(1).max(4000).parse(body.trim());
  const db = await createSupabaseServerClient();
  const { data: conv } = await db.from("conversations").select("id, tenant_id").eq("id", conversationId).single();
  if (!conv) throw new Error("Unterhaltung nicht gefunden");
  const { error } = await db.from("messages").insert({ tenant_id: conv.tenant_id, conversation_id: conversationId, sender_id: session.userId, body: text, client_message_id: crypto.randomUUID() });
  if (error) throw new Error(error.message);
  await db.rpc("notify_conversation", { p_conversation_id: conversationId, p_preview: text });
}

/** Schüler startet eine Unterhaltung mit dem Büro oder dem zuständigen Fahrlehrer (bestehende wird wiederverwendet). */
export async function startConversationAction(kind: "student_office" | "student_instructor"): Promise<string> {
  const ctx = await getStudentContext();
  const { data: existing } = await ctx.db.from("conversations").select("id").eq("student_id", ctx.student.id).eq("kind", kind).limit(1).maybeSingle();
  if (existing) return existing.id;
  const { data: conv, error } = await ctx.db.from("conversations").insert({ tenant_id: ctx.tenantId, kind, student_id: ctx.student.id, last_message_at: new Date().toISOString() }).select("id").single();
  if (error || !conv) throw new Error("Unterhaltung konnte nicht gestartet werden");
  const participants = [ctx.userId];
  if (kind === "student_instructor" && ctx.license.primary_instructor_id) {
    const { data: ins } = await ctx.db.from("instructors").select("user_id").eq("id", ctx.license.primary_instructor_id).single();
    if (ins) participants.push(ins.user_id);
  } else {
    const { data: office } = await ctx.db.from("tenant_memberships").select("user_id").eq("tenant_id", ctx.tenantId).in("role", ["office", "admin", "owner"]).eq("status", "active").limit(3);
    for (const o of office ?? []) participants.push(o.user_id);
  }
  await ctx.db.from("conversation_participants").insert([...new Set(participants)].map((user_id) => ({ conversation_id: conv.id, user_id })));
  revalidatePath("/profil/nachrichten");
  return conv.id;
}
