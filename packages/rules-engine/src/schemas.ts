import { z } from "zod";

/** Regeltypen entsprechen app.rule_type in der Datenbank. */
export const RuleType = z.enum(["exam_theory", "exam_practical", "training_requirements", "theory_lessons"]);
export type RuleType = z.infer<typeof RuleType>;

export const ReviewStatus = z.enum(["draft", "in_review", "approved", "published", "retired", "needs_verification"]);
export type ReviewStatus = z.infer<typeof ReviewStatus>;

export const AcquisitionKind = z.enum(["first", "extension", "any"]);
export type AcquisitionKind = z.infer<typeof AcquisitionKind>;

/** Theorieprüfung: alle Werte stammen aus rule_versions.payload, nie aus dem Code. */
export const ExamTheoryRules = z.object({
  questions_total: z.number().int().positive(),
  basic_questions: z.number().int().nonnegative(),
  class_specific_questions: z.number().int().nonnegative(),
  total_points: z.number().int().positive().optional(),
  max_error_points: z.number().int().nonnegative(),
  fail_if_two_five_point_questions_wrong: z.boolean().default(true),
  time_limit_seconds: z.number().int().positive().nullable().default(null),
  exam_languages: z.array(z.string()).optional(),
  note: z.string().optional(),
}).refine((r) => r.basic_questions + r.class_specific_questions === r.questions_total, {
  message: "basic_questions + class_specific_questions muss questions_total ergeben",
});
export type ExamTheoryRules = z.infer<typeof ExamTheoryRules>;

export const ExamPracticalRules = z.object({
  duration_minutes: z.number().int().positive(),
  min_driving_minutes: z.number().int().positive().optional(),
  task_catalog: z.string().optional(),
  electronic_protocol: z.boolean().optional(),
  retry_wait_days: z.number().int().nonnegative().optional(),
  theory_validity_months: z.number().int().positive().optional(),
});
export type ExamPracticalRules = z.infer<typeof ExamPracticalRules>;

export const SpecialDriveKind = z.enum(["overland", "motorway", "night"]);
export type SpecialDriveKind = z.infer<typeof SpecialDriveKind>;

export const TrainingRequirements = z.object({
  unit_minutes: z.number().int().positive().default(45),
  special_drives: z.record(SpecialDriveKind, z.number().int().nonnegative()).default({}),
  min_practice_lessons: z.number().int().nonnegative().nullable().optional(),
  manual_transmission_lessons_min: z.number().int().nonnegative().optional(),
  manual_test_drive_minutes: z.number().int().positive().optional(),
  automatic_only: z.boolean().optional(),
  notes: z.string().optional(),
});
export type TrainingRequirements = z.infer<typeof TrainingRequirements>;

export const TheoryLessonsRules = z.object({
  unit_minutes: z.number().int().positive().default(90),
  basic_units: z.number().int().nonnegative(),
  class_specific_units: z.number().int().nonnegative(),
  basic_unit_titles: z.array(z.string()).optional(),
  class_specific_unit_titles: z.array(z.string()).optional(),
});
export type TheoryLessonsRules = z.infer<typeof TheoryLessonsRules>;

export const payloadSchemaFor = {
  exam_theory: ExamTheoryRules,
  exam_practical: ExamPracticalRules,
  training_requirements: TrainingRequirements,
  theory_lessons: TheoryLessonsRules,
} as const;

/** Zeile aus public.rule_versions (payload noch unvalidiert). */
export const RuleVersionRow = z.object({
  id: z.string().uuid(),
  rule_type: RuleType,
  license_code: z.string().nullable(),
  acquisition_kind: AcquisitionKind,
  version: z.number().int(),
  valid_from: z.string(),
  valid_until: z.string().nullable(),
  payload: z.unknown(),
  source: z.string(),
  legal_basis_date: z.string().nullable().optional(),
  review_status: ReviewStatus,
});
export type RuleVersionRow = z.infer<typeof RuleVersionRow>;

export function parsePayload<T extends RuleType>(ruleType: T, payload: unknown): z.infer<(typeof payloadSchemaFor)[T]> {
  const schema = payloadSchemaFor[ruleType];
  return schema.parse(payload) as z.infer<(typeof payloadSchemaFor)[T]>;
}
