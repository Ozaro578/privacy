export interface SkillRating { skill_code: string; rating: number; rated_at: string; }
export interface SkillLabel { code: string; name: string; }

export interface SkillProfileEntry { skill_code: string; name: string; percent: number | null; ratings: number; trend: number | null; }

export interface CompetencyProfile {
  skills: SkillProfileEntry[];
  overall_percent: number | null;
  biggest_needs: SkillProfileEntry[];
  statement: string | null;
}

/**
 * Kompetenzprofil aus Fahrlehrer-Bewertungen: neuere Bewertungen wiegen mehr (exponentiell), Skala 1-5 wird auf 0-100 abgebildet.
 */
export function competencyProfile(ratings: SkillRating[], skills: SkillLabel[]): CompetencyProfile {
  const entries: SkillProfileEntry[] = skills.map((s) => {
    const rs = ratings.filter((r) => r.skill_code === s.code).sort((a, b) => b.rated_at.localeCompare(a.rated_at));
    if (rs.length === 0) return { skill_code: s.code, name: s.name, percent: null, ratings: 0, trend: null };
    let w = 1, sum = 0, wsum = 0;
    for (const r of rs) { sum += r.rating * w; wsum += w; w *= 0.7; }
    const avg = sum / wsum;
    const percent = Math.round(((avg - 1) / 4) * 100);
    const trend = rs.length >= 2 ? Math.round(((rs[0]!.rating - rs[rs.length - 1]!.rating) / 4) * 100) : null;
    return { skill_code: s.code, name: s.name, percent, ratings: rs.length, trend };
  });
  const rated = entries.filter((e) => e.percent !== null);
  const overall = rated.length ? Math.round(rated.reduce((s, e) => s + e.percent!, 0) / rated.length) : null;
  const needs = rated.filter((e) => e.percent! < 75).sort((a, b) => a.percent! - b.percent!).slice(0, 2);
  const statement = needs.length ? `Aktuell größter Trainingsbedarf: ${needs.map((n) => n.name).join(" und ")}.` : null;
  return { skills: entries, overall_percent: overall, biggest_needs: needs, statement };
}

export interface LessonForecastInput {
  overall_percent: number | null;          // Kompetenzprofil
  rated_skills: number;
  total_skills: number;
  special_drives_remaining_units: number;
  completed_practice_units: number;
}

export interface LessonForecast { min_units: number; max_units: number; text: string; disclaimer: string; }

export const FORECAST_DISCLAIMER = "Dies ist lediglich eine Schätzung. Der tatsächliche Ausbildungsbedarf richtet sich nach deinem individuellen Ausbildungsstand.";

/** Grobe Prognose verbleibender Fahrstunden (45-Minuten-Einheiten) aus Kompetenzprofil und offenen Sonderfahrten. */
export function forecastRemainingLessons(input: LessonForecastInput): LessonForecast | null {
  if (input.overall_percent === null || input.rated_skills < Math.min(4, input.total_skills)) return null;
  const gap = Math.max(0, 85 - input.overall_percent) / 100;   // Ziel: rund 85 % Gesamtkompetenz vor der Prüfung
  const base = Math.round(gap * 20);                            // je 5 Prozentpunkte etwa eine Einheit
  const min = Math.max(input.special_drives_remaining_units, base) + 1;
  const max = Math.max(input.special_drives_remaining_units, base + 4) + 3;
  return {
    min_units: min, max_units: max,
    text: `Auf Basis deines aktuellen Ausbildungsstands werden voraussichtlich noch etwa ${min} bis ${max} Fahrstunden benötigt.`,
    disclaimer: FORECAST_DISCLAIMER,
  };
}
