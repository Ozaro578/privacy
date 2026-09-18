import "server-only";
import { parseRange } from "@/components/ui";
import type { StudentContext } from "./student";

export interface LessonView { id: string; start: string; end: string; kind: string; status: string; instructor: string; instructorId: string; vehicle: string | null; units: number; priceCents: number | null; meetingPoint: string | null; evaluation: { contents: string[]; comment: string | null; next_goals: string[]; overall_rating: number | null; ratings: Array<{ skill_code: string; rating: number }> } | null; }

export async function loadStudentLessons(ctx: StudentContext): Promise<{ upcoming: LessonView[]; past: LessonView[] }> {
  const { data } = await ctx.db.from("lessons").select("id, period, kind, status, units, price_cents, meeting_point, instructor_id, instructors(display_name), vehicles(license_plate, make, model), lesson_evaluations(contents, comment, next_goals, overall_rating, shared_with_student)").eq("student_id", ctx.student.id).neq("status", "cancelled").order("period", { ascending: false }).limit(200);
  const { data: ratings } = await ctx.db.from("student_skill_scores").select("lesson_id, skill_code, rating").eq("student_license_id", ctx.license.id);
  const now = Date.now();
  const views: LessonView[] = (data ?? []).map((l) => {
    const { start, end } = parseRange(l.period as unknown as string);
    const ev = l.lesson_evaluations as unknown as { contents: string[]; comment: string | null; next_goals: string[]; overall_rating: number | null; shared_with_student: boolean } | null;
    const veh = l.vehicles as unknown as { license_plate: string; make: string | null; model: string | null } | null;
    return { id: l.id, start, end, kind: l.kind, status: l.status, instructor: (l.instructors as unknown as { display_name: string } | null)?.display_name ?? "", instructorId: l.instructor_id, vehicle: veh ? [veh.make, veh.model].filter(Boolean).join(" ") || veh.license_plate : null, units: l.units, priceCents: l.price_cents, meetingPoint: l.meeting_point,
      evaluation: ev && ev.shared_with_student ? { ...ev, ratings: (ratings ?? []).filter((r) => r.lesson_id === l.id).map((r) => ({ skill_code: r.skill_code, rating: r.rating })) } : null };
  });
  return { upcoming: views.filter((v) => new Date(v.start).getTime() >= now).sort((a, b) => a.start.localeCompare(b.start)), past: views.filter((v) => new Date(v.start).getTime() < now) };
}

export interface OpenSlot { id: string; start: string; end: string; kind: string; instructor: string; instructorId: string; transmission: string | null; units: number; priceCents: number | null; vehicle: string | null; }

export async function loadOpenSlots(ctx: StudentContext, opts: { from: Date; to: Date; instructorId?: string; transmission?: string }): Promise<OpenSlot[]> {
  let q = ctx.db.from("lessons").select("id, period, kind, units, price_cents, transmission, license_codes, instructor_id, instructors(display_name, active, license_classes), vehicles(license_plate, make, model, transmission)").eq("status", "open").is("student_id", null).gte("period", `[${opts.from.toISOString()},)`).lte("period", `[${opts.to.toISOString()},)`).order("period");
  if (opts.instructorId) q = q.eq("instructor_id", opts.instructorId);
  const { data } = await q.limit(300);
  const codes = [ctx.license.license_code, ctx.licenseInfo.base_class].filter(Boolean) as string[];
  return (data ?? []).filter((l) => {
    const lc = (l.license_codes ?? []) as string[];
    if (lc.length && !lc.some((c) => codes.includes(c))) return false;
    if (l.transmission && l.transmission !== ctx.license.transmission) return false;
    if (opts.transmission && l.transmission && l.transmission !== opts.transmission) return false;
    const ins = l.instructors as unknown as { display_name: string; active: boolean; license_classes: string[] } | null;
    if (!ins?.active) return false;
    if (ins.license_classes.length && !ins.license_classes.some((c) => codes.includes(c))) return false;
    return true;
  }).map((l) => { const { start, end } = parseRange(l.period as unknown as string); const veh = l.vehicles as unknown as { license_plate: string; make: string | null; model: string | null } | null; return { id: l.id, start, end, kind: l.kind, instructor: (l.instructors as unknown as { display_name: string }).display_name, instructorId: l.instructor_id, transmission: l.transmission, units: l.units, priceCents: l.price_cents, vehicle: veh ? [veh.make, veh.model].filter(Boolean).join(" ") || veh.license_plate : null }; });
}

export const LESSON_KIND_LABEL: Record<string, string> = { practice: "Übungsstunde", overland: "Überlandfahrt", motorway: "Autobahnfahrt", night: "Nachtfahrt", special: "Sonderfahrt", exam_prep: "Prüfungsvorbereitung", practical_exam: "Praktische Prüfung", manual_conversion: "Schaltstunde (B197)", trailer: "Anhänger" };
