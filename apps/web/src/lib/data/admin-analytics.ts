import "server-only";
import { requireAdmin } from "@/lib/auth/session";
import { addDays, berlinDate, berlinToIso, getOfficeContext, startOfWeek } from "./admin";

export interface SeriesPoint { key: string; label: string; value: number }
export interface UtilizationRow { id: string; label: string; open: number; used: number; completed: number; rate: number }

function rangeStart(period: string): string {
  const m = period.match(/^[\[(]"?([^,"]+)"?,/);
  return m?.[1] ?? period;
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

const MONTH_SHORT = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

/** Kennzahlen der Fahrschule: Schüler, Fahrstunden je Woche, Auslastung, Prüfungsquoten, Umsatz, Forderungen, Ausbildungsdauer. Nur Admin und Inhaber. */
export async function getAnalytics() {
  await requireAdmin();
  const ctx = await getOfficeContext();
  const today = berlinDate();
  const thisWeek = startOfWeek(today);
  const weeksStart = addDays(thisWeek, -7 * 11);
  const fourWeeksStart = addDays(thisWeek, -7 * 3);
  const weeksStartIso = berlinToIso(weeksStart, "00:00");
  const fourWeeksIso = berlinToIso(fourWeeksStart, "00:00");
  const nextWeekIso = berlinToIso(addDays(thisWeek, 7), "00:00");
  const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const monthsStart = `${addDays(today, -365).slice(0, 7)}-01`;

  const [activeStudents, newStudents, { data: weekLessons }, { data: recentLessons }, { data: instructors }, { data: vehicles }, { data: theory }, { data: practical }, { data: invoices }, { data: openInvoices }, { data: licenses }] = await Promise.all([
    ctx.db.from("students").select("id", { count: "exact", head: true }).eq("status", "active"),
    ctx.db.from("students").select("id", { count: "exact", head: true }).gte("created_at", since30),
    ctx.db.from("lessons").select("period").eq("status", "completed").gte("period", `[${weeksStartIso},)`).lt("period", `[${nextWeekIso},)`).limit(5000),
    ctx.db.from("lessons").select("instructor_id, vehicle_id, status").gte("period", `[${fourWeeksIso},)`).lt("period", `[${nextWeekIso},)`).neq("status", "cancelled").limit(5000),
    ctx.db.from("instructors").select("id, display_name").order("display_name"),
    ctx.db.from("vehicles").select("id, license_plate").order("license_plate"),
    ctx.db.from("theory_exams").select("result").not("result", "is", null),
    ctx.db.from("practical_exams").select("result").not("result", "is", null),
    ctx.db.from("invoices").select("issued_at, gross_cents, status, credit_note_for").not("issued_at", "is", null).gte("issued_at", monthsStart).neq("status", "cancelled"),
    ctx.db.from("invoices").select("gross_cents, paid_cents, due_at").in("status", ["issued", "partially_paid", "overdue"]),
    ctx.db.from("student_licenses").select("started_at, practical_exam_passed_at").not("practical_exam_passed_at", "is", null),
  ]);

  // Fahrstunden je Woche (12 Wochen, Montag als Schlüssel)
  const weekKeys = Array.from({ length: 12 }, (_, i) => addDays(weeksStart, 7 * i));
  const weekCounts = new Map<string, number>(weekKeys.map((k) => [k, 0]));
  for (const l of weekLessons ?? []) {
    const day = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(rangeStart(l.period)));
    const key = startOfWeek(day);
    if (weekCounts.has(key)) weekCounts.set(key, (weekCounts.get(key) ?? 0) + 1);
  }
  const lessonsPerWeek: SeriesPoint[] = weekKeys.map((k) => ({ key: k, label: `${k.slice(8, 10)}.${k.slice(5, 7)}.`, value: weekCounts.get(k) ?? 0 }));

  // Auslastung je Fahrlehrer und Fahrzeug (letzte 4 Wochen inkl. laufender Woche): belegte Slots gegenüber freien
  const usedStatus = new Set(["booked", "confirmed", "completed", "no_show"]);
  const util = (rows: Array<{ id: string; label: string }>, pick: (l: { instructor_id: string; vehicle_id: string | null }) => string | null): UtilizationRow[] => {
    const acc = new Map<string, { open: number; used: number; completed: number }>();
    for (const l of recentLessons ?? []) {
      const id = pick(l);
      if (!id) continue;
      const a = acc.get(id) ?? { open: 0, used: 0, completed: 0 };
      if (l.status === "open") a.open++;
      else if (usedStatus.has(l.status)) { a.used++; if (l.status === "completed") a.completed++; }
      acc.set(id, a);
    }
    return rows.map((r) => { const a = acc.get(r.id) ?? { open: 0, used: 0, completed: 0 }; const total = a.open + a.used; return { id: r.id, label: r.label, ...a, rate: total ? Math.round((a.used / total) * 100) : 0 }; }).filter((r) => r.open + r.used > 0).sort((a, b) => b.rate - a.rate);
  };
  const instructorUtilization = util((instructors ?? []).map((i) => ({ id: i.id, label: i.display_name })), (l) => l.instructor_id);
  const vehicleUtilization = util((vehicles ?? []).map((v) => ({ id: v.id, label: v.license_plate })), (l) => l.vehicle_id);

  // Prüfungsquoten
  const rate = (rows: Array<{ result: string | null }> | null) => { const total = (rows ?? []).length; const passed = (rows ?? []).filter((r) => r.result === "passed").length; return { total, passed, rate: total ? Math.round((passed / total) * 100) : null }; };
  const theoryRate = rate(theory);
  const practicalRate = rate(practical);

  // Umsatz je Monat (12 Monate): ausgestellte Rechnungen brutto abzüglich Gutschriften
  const monthKeys: string[] = [];
  for (let i = 11; i >= 0; i--) { const d = new Date(`${today.slice(0, 7)}-01T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() - i); monthKeys.push(d.toISOString().slice(0, 7)); }
  const monthSums = new Map<string, number>(monthKeys.map((k) => [k, 0]));
  for (const inv of invoices ?? []) {
    if (!inv.issued_at) continue;
    const key = monthKey(inv.issued_at);
    if (!monthSums.has(key)) continue;
    const sign = inv.credit_note_for || inv.status === "credited" ? -1 : 1;
    monthSums.set(key, (monthSums.get(key) ?? 0) + sign * inv.gross_cents);
  }
  const revenuePerMonth: SeriesPoint[] = monthKeys.map((k) => ({ key: k, label: `${MONTH_SHORT[Number(k.slice(5, 7)) - 1] ?? k.slice(5, 7)} ${k.slice(2, 4)}`, value: monthSums.get(k) ?? 0 }));
  const revenue12 = revenuePerMonth.reduce((s, p) => s + p.value, 0);

  const open = openInvoices ?? [];
  const openCents = open.reduce((s, i) => s + (i.gross_cents - i.paid_cents), 0);
  const overdueCents = open.filter((i) => i.due_at && i.due_at < today).reduce((s, i) => s + (i.gross_cents - i.paid_cents), 0);

  // Durchschnittliche Ausbildungsdauer (Beginn bis bestandene praktische Prüfung)
  const durations = (licenses ?? []).map((l) => (new Date(l.practical_exam_passed_at as string).getTime() - new Date(l.started_at).getTime()) / 86_400_000).filter((d) => d >= 0);
  const avgTrainingDays = durations.length ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length) : null;

  return {
    today, weeksStart, fourWeeksStart,
    activeStudents: activeStudents.count ?? 0, newStudents30: newStudents.count ?? 0,
    lessonsPerWeek, lessons12: lessonsPerWeek.reduce((s, p) => s + p.value, 0),
    instructorUtilization, vehicleUtilization, theoryRate, practicalRate,
    revenuePerMonth, revenue12, openCents, overdueCents, openCount: open.length,
    avgTrainingDays, completedCount: durations.length,
  };
}
