/** "Heute"-Modus: priorisiert, was für den Schüler jetzt am wichtigsten ist. */
export interface TodayContext {
  now: Date;
  dueQuestions: number;
  weakestTopic: { id: string; name: string } | null;
  instructorFlaggedSkills: Array<{ skill_code: string; topic_id: string | null; topic_name: string | null; rated_at: string }>;
  nextLesson: { starts_at: string; instructor_name: string } | null;
  nextTheoryClass: { starts_at: string; title: string } | null;
  missingDocuments: string[];
  theoryExamAt: string | null;
  practicalExamAt: string | null;
  openInvoiceCents: number;
  dailyGoalDone: boolean;
  learnedToday: boolean;
  streakDays: number;
  readinessScore: number | null;
}

export interface TodayItem {
  kind: "review" | "weakness" | "coupling" | "lesson" | "theory_class" | "document" | "exam" | "invoice" | "goal" | "streak" | "message";
  priority: number;              // höher = wichtiger
  title: string;
  subtitle?: string;
  action?: { type: "learn" | "open" ; mode?: string; topic_id?: string; route?: string; minutes?: number };
}

const TZ = "Europe/Berlin";
const hoursUntil = (iso: string, now: Date) => (new Date(iso).getTime() - now.getTime()) / 3_600_000;
const calendarDay = (d: Date) => { const [y, m, day] = d.toLocaleDateString("en-CA", { timeZone: TZ }).split("-").map(Number); return Date.UTC(y!, m! - 1, day!); };
/** Kalendertage bis zum Termin in der Zeitzone der Fahrschule (0 = heute, 1 = morgen). */
export const daysUntil = (iso: string, now: Date) => Math.round((calendarDay(new Date(iso)) - calendarDay(now)) / 86_400_000);
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
const fmtDay = (iso: string, now: Date) => {
  const d = daysUntil(iso, now);
  return d <= 0 ? "Heute" : d === 1 ? "Morgen" : new Date(iso).toLocaleDateString("de-DE", { weekday: "long", timeZone: "Europe/Berlin" });
};

export function planToday(ctx: TodayContext, limit = 5): TodayItem[] {
  const items: TodayItem[] = [];
  if (ctx.theoryExamAt) {
    const d = daysUntil(ctx.theoryExamAt, ctx.now);
    if (d >= 0 && d <= 30) items.push({ kind: "exam", priority: 100 - d, title: d === 0 ? "Heute: Theorieprüfung" : `Theorieprüfung in ${d} Tag${d === 1 ? "" : "en"}`, ...(ctx.readinessScore !== null ? { subtitle: `Prüfungsreife ${ctx.readinessScore} %` } : {}), action: { type: "learn", mode: "exam" } });
  }
  if (ctx.practicalExamAt) {
    const d = daysUntil(ctx.practicalExamAt, ctx.now);
    if (d >= 0 && d <= 30) items.push({ kind: "exam", priority: 100 - d, title: d === 0 ? "Heute: Praktische Prüfung" : `Praktische Prüfung in ${d} Tag${d === 1 ? "" : "en"}`, action: { type: "open", route: "/praxis/pruefung" } });
  }
  if (ctx.nextLesson) {
    const h = hoursUntil(ctx.nextLesson.starts_at, ctx.now);
    if (h >= 0 && h <= 48) items.push({ kind: "lesson", priority: 90 - h, title: `${fmtDay(ctx.nextLesson.starts_at, ctx.now)}: Fahrstunde ${fmtTime(ctx.nextLesson.starts_at)}`, subtitle: ctx.nextLesson.instructor_name, action: { type: "open", route: "/fahren" } });
  }
  // Kopplung Praxis -> Theorie: vom Fahrlehrer markierte Schwäche wird zum Theorie-Training
  const flagged = ctx.instructorFlaggedSkills.filter((f) => f.topic_id && hoursUntil(f.rated_at, ctx.now) > -24 * 14)[0];
  if (flagged) items.push({ kind: "coupling", priority: 85, title: `${flagged.topic_name}-Training für heute`, subtitle: "Dein Fahrlehrer hat hier Übungsbedarf gesehen", action: { type: "learn", mode: "topic", topic_id: flagged.topic_id!, minutes: 10 } });
  if (ctx.dueQuestions > 0) items.push({ kind: "review", priority: 70 + Math.min(15, ctx.dueQuestions / 2), title: `${Math.min(ctx.dueQuestions, 20)} fällige Fragen wiederholen`, action: { type: "learn", mode: "review", minutes: Math.ceil(Math.min(ctx.dueQuestions, 20) / 2) } });
  if (ctx.weakestTopic && ctx.weakestTopic.id !== flagged?.topic_id) items.push({ kind: "weakness", priority: 65, title: `${ctx.weakestTopic.name}: 5 Minuten Training`, action: { type: "learn", mode: "topic", topic_id: ctx.weakestTopic.id, minutes: 5 } });
  if (ctx.nextTheoryClass) {
    const h = hoursUntil(ctx.nextTheoryClass.starts_at, ctx.now);
    if (h >= 0 && h <= 48) items.push({ kind: "theory_class", priority: 60, title: `${fmtDay(ctx.nextTheoryClass.starts_at, ctx.now)}: Theorieunterricht ${fmtTime(ctx.nextTheoryClass.starts_at)}`, subtitle: ctx.nextTheoryClass.title, action: { type: "open", route: "/theorie/unterricht" } });
  }
  for (const doc of ctx.missingDocuments.slice(0, 2)) items.push({ kind: "document", priority: 55, title: `Dokument fehlt: ${doc}`, action: { type: "open", route: "/profil/dokumente" } });
  if (ctx.openInvoiceCents > 0) items.push({ kind: "invoice", priority: 50, title: `Offener Betrag: ${(ctx.openInvoiceCents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}`, action: { type: "open", route: "/finanzen" } });
  if (!ctx.dailyGoalDone && !ctx.learnedToday && ctx.dueQuestions === 0 && !ctx.weakestTopic) items.push({ kind: "goal", priority: 45, title: "Tagesziel: 20 Fragen", action: { type: "learn", mode: "random", minutes: 10 } });
  if (ctx.streakDays >= 3 && !ctx.learnedToday) items.push({ kind: "streak", priority: 40, title: `Serie halten: ${ctx.streakDays} Tage in Folge gelernt`, action: { type: "learn", mode: "review", minutes: 5 } });
  return items.sort((a, b) => b.priority - a.priority).slice(0, limit);
}
