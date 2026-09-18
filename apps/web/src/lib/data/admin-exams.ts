import "server-only";
import type { Tables } from "@fahrpilot/db";
import { resolveRulesFor, type ResolvedRules } from "./student";
import { getOfficeContext } from "./admin";

export type ExamLicenseRow = Tables<"student_licenses"> & { students: { id: string; first_name: string; last_name: string } | null; instructors: { display_name: string } | null };

/** Alle Ausbildungen mit Prüfungsaktivität (freigegeben, angefragt, terminiert, nicht bestanden) inklusive Versuche. */
export async function listExams(filter: { status?: string; kind?: string }) {
  const ctx = await getOfficeContext();
  const active = ["awaiting_instructor_release", "ready", "requested", "scheduled", "failed"];
  const { data: licenses } = await ctx.db.from("student_licenses").select("*, students(id, first_name, last_name), instructors(display_name)").eq("status", "active").or(`theory_exam_status.in.(${active.join(",")}),practical_exam_status.in.(${active.join(",")})`).order("updated_at", { ascending: false }).limit(300);
  let rows = (licenses ?? []) as unknown as ExamLicenseRow[];
  if (filter.status) rows = rows.filter((l) => (filter.kind !== "practical" && l.theory_exam_status === filter.status) || (filter.kind !== "theory" && l.practical_exam_status === filter.status));
  const ids = rows.map((l) => l.id);
  const [te, pe, { data: instructors }, { data: vehicles }] = await Promise.all([
    ids.length ? ctx.db.from("theory_exams").select("*").in("student_license_id", ids).order("attempt_no") : Promise.resolve({ data: [] as Tables<"theory_exams">[] }),
    ids.length ? ctx.db.from("practical_exams").select("*").in("student_license_id", ids).order("attempt_no") : Promise.resolve({ data: [] as Tables<"practical_exams">[] }),
    ctx.db.from("instructors").select("id, display_name").eq("active", true).order("display_name"),
    ctx.db.from("vehicles").select("id, license_plate, transmission").eq("status", "active").order("license_plate"),
  ]);
  const rulesCache = new Map<string, ResolvedRules>();
  for (const l of rows) {
    const key = `${l.license_code}:${l.acquisition_kind}`;
    if (!rulesCache.has(key)) rulesCache.set(key, await resolveRulesFor(ctx.db, l.license_code, l.acquisition_kind as "first" | "extension"));
  }
  const upcoming = [...(te.data ?? []).map((e) => ({ ...e, kind: "theory" as const })), ...(pe.data ?? []).map((e) => ({ ...e, kind: "practical" as const }))]
    .filter((e) => e.status === "scheduled" && e.scheduled_at && new Date(e.scheduled_at).getTime() >= Date.now() - 86_400_000)
    .sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""));
  return { ctx, rows, theoryExams: (te.data ?? []) as Tables<"theory_exams">[], practicalExams: (pe.data ?? []) as Tables<"practical_exams">[], instructors: instructors ?? [], vehicles: vehicles ?? [], rulesCache, upcoming };
}
