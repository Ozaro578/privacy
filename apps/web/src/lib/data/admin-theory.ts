import "server-only";
import type { Tables } from "@fahrpilot/db";
import { resolveRulesFor } from "./student";
import { berlinDate, dayBounds, getOfficeContext } from "./admin";

export interface TheoryUnit { code: string; title: string; material_kind: "basic" | "class_specific" }

/** Einheitencodes aus der Regel theory_lessons (G1..Gn Grundstoff, <Klasse>1..n Zusatzstoff). */
export async function theoryUnitsFor(licenseCode: string) {
  const ctx = await getOfficeContext();
  const rules = await resolveRulesFor(ctx.db, licenseCode, "first");
  const r = rules.theoryLessons;
  const units: TheoryUnit[] = [];
  const basic = r?.rules.basic_units ?? 12;
  const specific = r?.rules.class_specific_units ?? 2;
  for (let i = 1; i <= basic; i++) units.push({ code: `G${i}`, title: r?.rules.basic_unit_titles?.[i - 1] ?? `Grundstoff Lektion ${i}`, material_kind: "basic" });
  for (let i = 1; i <= specific; i++) units.push({ code: `${licenseCode}${i}`, title: r?.rules.class_specific_unit_titles?.[i - 1] ?? `Zusatzstoff Klasse ${licenseCode} Lektion ${i}`, material_kind: "class_specific" });
  return { units, rule: r, unitMinutes: r?.rules.unit_minutes ?? 90 };
}

export type TheoryClassRow = Tables<"theory_classes"> & { instructors: { display_name: string } | null; locations: { name: string } | null; attendance: Array<{ count: number }> };

export async function listTheoryClasses(licenseCode: string, scope: "upcoming" | "past") {
  const ctx = await getOfficeContext();
  const now = dayBounds(berlinDate()).start;
  let q = ctx.db.from("theory_classes").select("*, instructors(display_name), locations(name), attendance(count)");
  q = scope === "upcoming" ? q.gte("period", now).order("period") : q.lt("period", now).order("period", { ascending: false }).limit(100);
  const [{ data: classes }, { data: instructors }, { data: locations }, { data: licenses }, unitInfo] = await Promise.all([
    q,
    ctx.db.from("instructors").select("id, display_name").eq("active", true).eq("teaches_theory", true).order("display_name"),
    ctx.db.from("locations").select("id, name").eq("active", true).order("name"),
    ctx.db.from("licenses").select("code, requires_theory_exam").eq("active", true).order("sort_order"),
    theoryUnitsFor(licenseCode),
  ]);
  return { ctx, classes: (classes ?? []) as unknown as TheoryClassRow[], instructors: instructors ?? [], locations: locations ?? [], licenses: (licenses ?? []).filter((l) => l.requires_theory_exam).map((l) => l.code), ...unitInfo };
}

export async function getTheoryClass(id: string) {
  const ctx = await getOfficeContext();
  const { data: cls } = await ctx.db.from("theory_classes").select("*, instructors(display_name), locations(name)").eq("id", id).maybeSingle();
  if (!cls) return null;
  const c = cls as unknown as Tables<"theory_classes"> & { instructors: { display_name: string } | null; locations: { name: string } | null };
  const [{ data: attendance }, { data: instructors }, { data: locations }, { data: candidates }, unitInfo] = await Promise.all([
    ctx.db.from("attendance").select("*, students(first_name, last_name), student_licenses(license_code), users:checked_in_by(first_name, last_name)").eq("theory_class_id", id).order("checked_in_at"),
    ctx.db.from("instructors").select("id, display_name").eq("active", true).eq("teaches_theory", true).order("display_name"),
    ctx.db.from("locations").select("id, name").eq("active", true).order("name"),
    ctx.db.from("student_licenses").select("id, student_id, license_code, students(first_name, last_name)").eq("status", "active").order("license_code").limit(1000),
    theoryUnitsFor(c.license_codes[0] ?? "B"),
  ]);
  type AttendanceRow = Tables<"attendance"> & { students: { first_name: string; last_name: string } | null; student_licenses: { license_code: string } | null; users: { first_name: string; last_name: string } | null };
  const att = (attendance ?? []) as unknown as AttendanceRow[];
  const present = new Set(att.map((a) => a.student_id));
  return {
    ctx, cls: c, attendance: att, instructors: instructors ?? [], locations: locations ?? [], units: unitInfo.units,
    candidates: ((candidates ?? []) as unknown as Array<{ id: string; student_id: string; license_code: string; students: { first_name: string; last_name: string } | null }>).filter((l) => !present.has(l.student_id)),
  };
}
