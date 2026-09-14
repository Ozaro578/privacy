import type { SpecialDriveKind, TrainingRequirements, TheoryLessonsRules } from "./schemas";

export interface SpecialDriveStatus {
  kind: SpecialDriveKind;
  required_units: number;
  completed_units: number;
  remaining_units: number;
  percent: number;
}

export interface TrainingProgress {
  special_drives: SpecialDriveStatus[];
  special_drives_percent: number;
  all_special_drives_done: boolean;
  manual_lessons_required: number | null;
  manual_lessons_completed: number;
  manual_requirement_met: boolean;
}

/** Fortschritt der gesetzlich geforderten Sonderfahrten (Einheiten à unit_minutes) aus abgeschlossenen Stunden. */
export function trainingProgress(
  rules: TrainingRequirements,
  completedUnits: Partial<Record<SpecialDriveKind, number>>,
  manualLessonsCompleted = 0,
): TrainingProgress {
  const kinds = Object.entries(rules.special_drives) as [SpecialDriveKind, number][];
  const drives = kinds.map(([kind, required]) => {
    const done = Math.max(0, completedUnits[kind] ?? 0);
    const remaining = Math.max(0, required - done);
    return { kind, required_units: required, completed_units: done, remaining_units: remaining, percent: required === 0 ? 100 : Math.min(100, Math.round((done / required) * 100)) };
  });
  const totalRequired = drives.reduce((s, d) => s + d.required_units, 0);
  const totalDone = drives.reduce((s, d) => s + Math.min(d.completed_units, d.required_units), 0);
  const manualReq = rules.manual_transmission_lessons_min ?? null;
  return {
    special_drives: drives,
    special_drives_percent: totalRequired === 0 ? 100 : Math.round((totalDone / totalRequired) * 100),
    all_special_drives_done: drives.every((d) => d.remaining_units === 0),
    manual_lessons_required: manualReq,
    manual_lessons_completed: manualLessonsCompleted,
    manual_requirement_met: manualReq === null || manualLessonsCompleted >= manualReq,
  };
}

export interface TheoryLessonsProgress {
  basic_required: number;
  basic_attended: number;
  class_specific_required: number;
  class_specific_attended: number;
  percent: number;
  complete: boolean;
}

/** Fortschritt im Theorieunterricht (besuchte Doppelstunden, Wiederholungen derselben Einheit zählen nicht doppelt). */
export function theoryLessonsProgress(rules: TheoryLessonsRules, attendedUnitCodes: string[]): TheoryLessonsProgress {
  const unique = new Set(attendedUnitCodes);
  const basic = [...unique].filter((c) => c.startsWith("G")).length;
  const specific = [...unique].filter((c) => !c.startsWith("G")).length;
  const basicAttended = Math.min(basic, rules.basic_units);
  const specificAttended = Math.min(specific, rules.class_specific_units);
  const required = rules.basic_units + rules.class_specific_units;
  const percent = required === 0 ? 100 : Math.round(((basicAttended + specificAttended) / required) * 100);
  return {
    basic_required: rules.basic_units,
    basic_attended: basicAttended,
    class_specific_required: rules.class_specific_units,
    class_specific_attended: specificAttended,
    percent,
    complete: basicAttended >= rules.basic_units && specificAttended >= rules.class_specific_units,
  };
}
