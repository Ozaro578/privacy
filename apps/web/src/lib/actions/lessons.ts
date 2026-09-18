"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getStudentContext } from "@/lib/data/student";

export interface ActionResult { ok: boolean; message: string }

export async function bookLessonAction(lessonId: string, clientRequestId?: string): Promise<ActionResult> {
  const id = z.string().uuid().parse(lessonId);
  const ctx = await getStudentContext();
  const { error } = await ctx.db.rpc("book_lesson", { p_lesson_id: id, p_student_license_id: ctx.license.id, p_client_request_id: clientRequestId ?? crypto.randomUUID() });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/fahren");
  revalidatePath("/heute");
  return { ok: true, message: "Fahrstunde gebucht." };
}

export async function cancelLessonAction(lessonId: string, reason: string): Promise<ActionResult & { feeCents?: number; feeReason?: string }> {
  const id = z.string().uuid().parse(lessonId);
  const ctx = await getStudentContext();
  const { data, error } = await ctx.db.rpc("cancel_lesson", { p_lesson_id: id, p_reason: reason.slice(0, 500), p_client_request_id: crypto.randomUUID() });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/fahren");
  revalidatePath("/heute");
  const booking = data as unknown as { fee_cents: number | null; fee_reason: string | null } | null;
  return { ok: true, message: booking?.fee_cents ? "Storniert. Es fällt eine Ausfallgebühr an." : "Fahrstunde storniert.", feeCents: booking?.fee_cents ?? 0, ...(booking?.fee_reason ? { feeReason: booking.fee_reason } : {}) };
}

const WaitlistSchema = z.object({ earliest: z.string(), latest: z.string(), instructorId: z.string().uuid().nullable().default(null), weekdays: z.array(z.number().int().min(1).max(7)).min(1), timeFrom: z.string().nullable().default(null), timeTo: z.string().nullable().default(null) });

export async function joinWaitlistAction(raw: z.input<typeof WaitlistSchema>): Promise<ActionResult> {
  const input = WaitlistSchema.parse(raw);
  const ctx = await getStudentContext();
  const { error } = await ctx.db.from("waitlist_entries").insert({ tenant_id: ctx.tenantId, student_id: ctx.student.id, student_license_id: ctx.license.id, instructor_id: input.instructorId, transmission: ctx.license.transmission, earliest: input.earliest, latest: input.latest, weekdays: input.weekdays, time_from: input.timeFrom, time_to: input.timeTo });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/fahren");
  return { ok: true, message: "Du stehst auf der Warteliste. Wir benachrichtigen dich, sobald ein passender Termin frei wird." };
}

export async function respondWaitlistOffer(offerId: string, accept: boolean): Promise<ActionResult> {
  const ctx = await getStudentContext();
  const { data: offer } = await ctx.db.from("waitlist_offers").select("id, lesson_id, expires_at, response").eq("id", offerId).single();
  if (!offer || offer.response) return { ok: false, message: "Angebot nicht mehr gültig." };
  if (new Date(offer.expires_at).getTime() < Date.now()) return { ok: false, message: "Angebot ist abgelaufen." };
  if (accept) {
    const res = await bookLessonAction(offer.lesson_id);
    if (!res.ok) return res;
  }
  await ctx.db.from("waitlist_offers").update({ response: accept ? "accepted" : "declined", responded_at: new Date().toISOString() }).eq("id", offerId);
  revalidatePath("/fahren");
  return { ok: true, message: accept ? "Fahrstunde gebucht." : "Angebot abgelehnt." };
}
