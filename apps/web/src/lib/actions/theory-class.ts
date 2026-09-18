"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getStudentContext } from "@/lib/data/student";
import type { ActionResult } from "./lessons";

/** QR-Check-in im Theorieunterricht (Code ist kurzlebig, serverseitig gehasht). */
export async function checkinTheoryClassAction(token: string, deviceFingerprint: string | null): Promise<ActionResult> {
  const t = z.string().min(8).max(200).parse(token.trim());
  const ctx = await getStudentContext();
  const { error } = await ctx.db.rpc("checkin_theory_class", { p_token: t, p_device_fingerprint: deviceFingerprint });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/theorie");
  return { ok: true, message: "Anwesenheit registriert." };
}

export async function registerForTheoryClass(theoryClassId: string): Promise<ActionResult> {
  const ctx = await getStudentContext();
  const { data: cls } = await ctx.db.from("theory_classes").select("id, capacity").eq("id", theoryClassId).single();
  if (!cls) return { ok: false, message: "Unterricht nicht gefunden." };
  if (cls.capacity) {
    const { count } = await ctx.db.from("attendance").select("id", { count: "exact", head: true }).eq("theory_class_id", cls.id).neq("status", "absent");
    if ((count ?? 0) >= cls.capacity) return { ok: false, message: "Dieser Termin ist ausgebucht." };
  }
  const { error } = await ctx.db.from("attendance").upsert({ tenant_id: ctx.tenantId, theory_class_id: cls.id, student_id: ctx.student.id, student_license_id: ctx.license.id, status: "registered" }, { onConflict: "theory_class_id,student_id" });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/theorie");
  return { ok: true, message: "Angemeldet." };
}
