/**
 * Prüfungsreife 0-100. Der Wert ist eine Einschätzung aus mehreren Faktoren und nie eine Garantie für das Bestehen.
 */
export interface SimulationSummary { passed: boolean; error_points: number; submitted_at: string; }

export interface ReadinessInput {
  simulations: SimulationSummary[];           // chronologisch beliebig, wird sortiert
  overallMastery: number;                     // 0..1
  topicCoverage: number;                      // Anteil der Themen mit coverage >= 0.5
  weakTopicShare: number;                     // Anteil schwacher Themen
  dueShare: number;                           // Anteil fälliger Fragen an beantworteten (Wiederholungsbedarf)
  activeDaysLast14: number;                   // Lernaktivität
  masteryDelta7d: number;                     // Entwicklung (Mastery heute minus vor 7 Tagen)
  recentAccuracy: number[];                   // Trefferquoten der letzten Sessions (0..1), für Konsistenz
  maxErrorPoints: number;                     // aus Regelversion
  now?: Date;
}

export interface ReadinessFactor { key: string; label: string; weight: number; score: number; detail: string; }

export type ReadinessBand = "red" | "orange" | "yellow_green" | "green";

export interface ReadinessResult {
  score: number;
  band: ReadinessBand;
  band_label: string;
  factors: ReadinessFactor[];
  disclaimer: string;
  engine_version: string;
}

export const READINESS_ENGINE_VERSION = "readiness-1.0.0";
export const READINESS_DISCLAIMER = "Die Prüfungsreife ist eine Einschätzung aus deinem Lernverhalten und ersetzt keine Prüfung. Sie ist keine Garantie für das Bestehen.";

export function readinessBand(score: number): { band: ReadinessBand; label: string } {
  if (score < 40) return { band: "red", label: "Noch nicht prüfungsbereit" };
  if (score < 70) return { band: "orange", label: "Auf gutem Weg" };
  if (score < 85) return { band: "yellow_green", label: "Fast bereit" };
  return { band: "green", label: "Sehr gute Vorbereitung" };
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
}

export function computeReadiness(input: ReadinessInput): ReadinessResult {
  const sims = input.simulations.slice().sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
  const recent = sims.slice(0, 5);
  const passRate = recent.length ? recent.filter((s) => s.passed).length / recent.length : 0;
  const passedCount = sims.filter((s) => s.passed).length;
  const avgErr = recent.length ? recent.reduce((s, x) => s + x.error_points, 0) / recent.length : input.maxErrorPoints * 2;
  const errScore = clamp01(1 - avgErr / (input.maxErrorPoints * 1.5));
  const consistency = clamp01(1 - stddev(input.recentAccuracy.slice(0, 8)) * 2.5);
  const activity = clamp01(input.activeDaysLast14 / 10);
  const trend = clamp01(0.5 + input.masteryDelta7d * 2.5);
  const factors: ReadinessFactor[] = [
    { key: "simulations", label: "Bestandene Simulationen (letzte 5)", weight: 0.22, score: recent.length === 0 ? 0 : passRate, detail: `${recent.filter((s) => s.passed).length} von ${recent.length} bestanden` },
    { key: "error_points", label: "Fehlerpunkte in Simulationen", weight: 0.13, score: recent.length === 0 ? 0 : errScore, detail: recent.length ? `Durchschnitt ${avgErr.toFixed(1)} Fehlerpunkte` : "Noch keine Simulation" },
    { key: "mastery", label: "Beherrschung der Fragen", weight: 0.2, score: clamp01(input.overallMastery), detail: `${Math.round(input.overallMastery * 100)} % Mastery` },
    { key: "coverage", label: "Themenabdeckung", weight: 0.12, score: clamp01(input.topicCoverage), detail: `${Math.round(input.topicCoverage * 100)} % der Themen bearbeitet` },
    { key: "weak_topics", label: "Schwachstellen", weight: 0.08, score: clamp01(1 - input.weakTopicShare), detail: `${Math.round(input.weakTopicShare * 100)} % der Themen schwach` },
    { key: "consistency", label: "Antwortkonsistenz", weight: 0.07, score: input.recentAccuracy.length < 2 ? 0.5 : consistency, detail: `Schwankung ${Math.round(stddev(input.recentAccuracy.slice(0, 8)) * 100)} Prozentpunkte` },
    { key: "activity", label: "Lernaktivität (14 Tage)", weight: 0.06, score: activity, detail: `${input.activeDaysLast14} aktive Tage` },
    { key: "review_backlog", label: "Wiederholungsbedarf", weight: 0.06, score: clamp01(1 - input.dueShare), detail: `${Math.round(input.dueShare * 100)} % der Fragen fällig` },
    { key: "trend", label: "Entwicklung der letzten Tage", weight: 0.06, score: trend, detail: `${input.masteryDelta7d >= 0 ? "+" : ""}${Math.round(input.masteryDelta7d * 100)} Punkte Mastery in 7 Tagen` },
  ];
  let raw = factors.reduce((s, f) => s + f.weight * f.score, 0) * 100;
  // Harte Deckel: ohne bestandene Simulation nie über 69, ohne jede Simulation nie über 59
  if (recent.length === 0) raw = Math.min(raw, 59);
  else if (passedCount === 0) raw = Math.min(raw, 69);
  else if (passedCount < 3) raw = Math.min(raw, 84);
  const score = Math.round(Math.min(100, Math.max(0, raw)));
  const band = readinessBand(score);
  return { score, band: band.band, band_label: band.label, factors, disclaimer: READINESS_DISCLAIMER, engine_version: READINESS_ENGINE_VERSION };
}
