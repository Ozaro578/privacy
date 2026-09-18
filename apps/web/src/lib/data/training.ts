import "server-only";
import { trainingProgress, theoryLessonsProgress, type SpecialDriveKind } from "@fahrpilot/rules-engine";
import { competencyProfile, forecastRemainingLessons, type CompetencyProfile, type LessonForecast } from "@fahrpilot/learning-engine";
import type { StudentContext } from "./student";

export async function loadTrainingStatus(ctx: StudentContext) {
  const { db, license, rules } = ctx;
  const [{ data: drives }, { data: attendance }, { data: ratings }, { data: skills }, { data: lessons }] = await Promise.all([
    db.rpc("special_drive_progress", { p_student_license_id: license.id }),
    db.from("attendance").select("theory_class_id, status, theory_classes(lesson_unit_code)").eq("student_id", ctx.student.id).eq("status", "present"),
    db.from("student_skill_scores").select("skill_code, rating, rated_at").eq("student_license_id", license.id).order("rated_at", { ascending: false }).limit(300),
    db.from("skills").select("code, name_i18n, category, sort_order").eq("active", true).order("sort_order"),
    db.from("lessons").select("id, kind, units, status").eq("student_license_id", license.id).in("status", ["completed"]),
  ]);
  const completedUnits: Partial<Record<SpecialDriveKind, number>> = {};
  for (const d of (drives ?? []) as Array<{ kind: SpecialDriveKind; units: number }>) completedUnits[d.kind] = d.units;
  const manualUnits = (lessons ?? []).filter((l) => l.kind === "manual_conversion").reduce((s, l) => s + l.units, 0);
  const practiceUnits = (lessons ?? []).reduce((s, l) => s + l.units, 0);
  const training = rules.training ? trainingProgress(rules.training.rules, completedUnits, manualUnits) : null;
  const attendedCodes = (attendance ?? []).map((a) => (a.theory_classes as unknown as { lesson_unit_code: string } | null)?.lesson_unit_code).filter((c): c is string => !!c);
  const theory = rules.theoryLessons ? theoryLessonsProgress(rules.theoryLessons.rules, attendedCodes) : null;
  const skillLabels = (skills ?? []).map((s) => ({ code: s.code, name: (s.name_i18n as Record<string, string>)[ctx.student.preferred_locale] ?? (s.name_i18n as Record<string, string>)["de"] ?? s.code }));
  const profile: CompetencyProfile = competencyProfile((ratings ?? []).map((r) => ({ skill_code: r.skill_code, rating: r.rating, rated_at: r.rated_at })), skillLabels);
  const forecast: LessonForecast | null = forecastRemainingLessons({
    overall_percent: profile.overall_percent, rated_skills: profile.skills.filter((s) => s.percent !== null).length, total_skills: skillLabels.length,
    special_drives_remaining_units: training?.special_drives.reduce((s, d) => s + d.remaining_units, 0) ?? 0, completed_practice_units: practiceUnits,
  });
  // Praxisfortschritt: Sonderfahrten (50 %) + Kompetenzprofil (50 %)
  const practicalPercent = training ? Math.round((training.special_drives_percent * 0.5) + ((profile.overall_percent ?? 0) * 0.5)) : profile.overall_percent;
  return { training, theory, profile, forecast, practicalPercent, completedPracticeUnits: practiceUnits, attendedCodes };
}
