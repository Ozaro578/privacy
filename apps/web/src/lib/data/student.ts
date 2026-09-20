import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@fahrpilot/db";
import { resolveRule, type RuleVersionRow, type ExamTheoryRules, type TrainingRequirements, type TheoryLessonsRules, type ExamPracticalRules } from "@fahrpilot/rules-engine";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireStudent } from "@/lib/auth/session";
import { getBearerAuthFromRequest } from "@/lib/auth/bearer";

export type Db = SupabaseClient<Database>;

export interface ResolvedRules {
  examTheory: { rules: ExamTheoryRules; version: RuleVersionRow; needsVerification: boolean } | null;
  examPractical: { rules: ExamPracticalRules; version: RuleVersionRow; needsVerification: boolean } | null;
  training: { rules: TrainingRequirements; version: RuleVersionRow; needsVerification: boolean } | null;
  theoryLessons: { rules: TheoryLessonsRules; version: RuleVersionRow; needsVerification: boolean } | null;
  /** Rechtsstand (jüngstes legal_basis_date der verwendeten Versionen) */
  legalBasisDate: string | null;
}

export interface StudentContext {
  db: Db;
  userId: string;
  tenantId: string;
  student: Tables<"students">;
  license: Tables<"student_licenses">;
  licenses: Tables<"student_licenses">[];
  licenseInfo: Tables<"licenses">;
  rules: ResolvedRules;
  school: Pick<Tables<"driving_schools">, "id" | "name" | "slug" | "timezone" | "settings">;
  /** Selbstlern-Modus ohne Fahrschule: nur Lernen, Prüfung, Zeichen, Profil. */
  selfStudy: boolean;
}

/** Löst alle Regelversionen für eine Ausbildung auf (veröffentlicht bevorzugt, unverifiziert gekennzeichnet). */
export async function resolveRulesFor(db: Db, licenseCode: string, acquisition: "first" | "extension"): Promise<ResolvedRules> {
  const [{ data: versions }, { data: licenses }] = await Promise.all([
    db.from("rule_versions").select("*").in("review_status", ["published", "needs_verification"]),
    db.from("licenses").select("code, base_class"),
  ]);
  const rows = (versions ?? []) as unknown as RuleVersionRow[];
  const lic = licenses ?? [];
  const pick = <T extends RuleVersionRow["rule_type"]>(ruleType: T) =>
    resolveRule(rows, { ruleType, licenseCode, acquisition, licenses: lic, allowUnverified: true });
  const examTheory = pick("exam_theory");
  const examPractical = pick("exam_practical");
  const training = pick("training_requirements");
  const theoryLessons = pick("theory_lessons");
  const dates = [examTheory, examPractical, training, theoryLessons].map((r) => r?.version.legal_basis_date ?? null).filter((d): d is string => !!d).sort();
  return { examTheory, examPractical, training, theoryLessons, legalBasisDate: dates.at(-1) ?? null };
}

/** Kontext eines Schülers für einen bereits authentifizierten Client (Cookie- oder Bearer-Session). */
export async function getStudentContextFor(db: Db, userId: string, tenantId: string, licenseId?: string): Promise<StudentContext> {
  const { data: student } = await db.from("students").select("*").eq("user_id", userId).eq("tenant_id", tenantId).single();
  if (!student) throw new Error("Schülerprofil nicht gefunden");
  const { data: licenses } = await db.from("student_licenses").select("*").eq("student_id", student.id).order("started_at", { ascending: false });
  const all = licenses ?? [];
  const license = (licenseId ? all.find((l) => l.id === licenseId) : undefined) ?? all.find((l) => l.status === "active") ?? all[0];
  if (!license) throw new Error("Keine Ausbildung angelegt");
  const [{ data: licenseInfo }, { data: school }, rules] = await Promise.all([
    db.from("licenses").select("*").eq("code", license.license_code).single(),
    db.from("driving_schools").select("id, name, slug, timezone, settings").eq("id", tenantId).single(),
    resolveRulesFor(db, license.license_code, license.acquisition_kind as "first" | "extension"),
  ]);
  if (!licenseInfo || !school) throw new Error("Stammdaten unvollständig");
  const selfStudy = ((school.settings as Record<string, unknown> | null)?.["self_study"]) === true;
  return { db, userId, tenantId, student, license, licenses: all, licenseInfo, rules, school, selfStudy };
}

/**
 * Kontext des angemeldeten Schülers inkl. aktiver Ausbildung. Pro Request gecacht.
 * Trägt der Request ein Bearer-Token (Mobile-App), wird dieses genutzt, sonst die Cookie-Session.
 */
export const getStudentContext = cache(async (licenseId?: string): Promise<StudentContext> => {
  const bearer = await getBearerAuthFromRequest();
  if (bearer) {
    if (bearer.session.role !== "student" || !bearer.session.tenantId) throw new Error("Nur Schüler");
    return getStudentContextFor(bearer.db, bearer.session.userId, bearer.session.tenantId, licenseId);
  }
  const session = await requireStudent();
  const db = await createSupabaseServerClient();
  return getStudentContextFor(db, session.userId, session.tenantId, licenseId);
});
