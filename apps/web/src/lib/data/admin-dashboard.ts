import "server-only";
import { addDays, berlinDate, dayBounds, getOfficeContext } from "./admin";

export interface DashboardTask { title: string; count: number; href: string; tone: "brand" | "warn" | "danger" | "neutral" }

export async function getDashboard() {
  const ctx = await getOfficeContext();
  const today = berlinDate();
  const { start, end } = dayBounds(today);
  const weekEnd = addDays(today, 7);
  const in30 = addDays(today, 30);
  const [lessonsToday, bookingRequests, registrations, overdue, docsReview, examsWeek, practicalWeek, dataRequests, vehiclesDue, missingDocs] = await Promise.all([
    ctx.db.from("lessons").select("id, period, status, kind, student_id, students(first_name, last_name), instructors(display_name)").gte("period", start).lt("period", end).not("status", "in", "(cancelled,open)").order("period"),
    ctx.db.from("lessons").select("id", { count: "exact", head: true }).eq("status", "booked"),
    ctx.db.from("students").select("id", { count: "exact", head: true }).eq("status", "registered"),
    ctx.db.from("invoices").select("id, gross_cents, paid_cents").in("status", ["issued", "partially_paid", "overdue"]).lt("due_at", today),
    ctx.db.from("documents").select("id", { count: "exact", head: true }).eq("status", "uploaded"),
    ctx.db.from("theory_exams").select("id", { count: "exact", head: true }).eq("status", "scheduled").gte("scheduled_at", start).lt("scheduled_at", dayBounds(weekEnd).start),
    ctx.db.from("practical_exams").select("id", { count: "exact", head: true }).eq("status", "scheduled").gte("scheduled_at", start).lt("scheduled_at", dayBounds(weekEnd).start),
    ctx.db.from("data_requests").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
    ctx.db.from("vehicles").select("id, license_plate, next_inspection_due, next_service_due, insurance_renewal_due").neq("status", "inactive"),
    ctx.db.from("documents").select("id", { count: "exact", head: true }).eq("status", "missing"),
  ]);
  const overdueRows = overdue.data ?? [];
  const overdueCents = overdueRows.reduce((s, i) => s + (i.gross_cents - i.paid_cents), 0);
  const vehicleAlerts = (vehiclesDue.data ?? []).filter((v) => [v.next_inspection_due, v.next_service_due, v.insurance_renewal_due].some((d) => d && d <= in30)).length;
  const tasks: DashboardTask[] = [
    { title: "Buchungsanfragen bestätigen", count: bookingRequests.count ?? 0, href: "/verwaltung/kalender?status=booked", tone: "brand" },
    { title: "Anmeldungen bearbeiten", count: registrations.count ?? 0, href: "/verwaltung/schueler?status=registered", tone: "brand" },
    { title: "Dokumente prüfen", count: docsReview.count ?? 0, href: "/verwaltung/dokumente", tone: "warn" },
    { title: "Überfällige Rechnungen mahnen", count: overdueRows.length, href: "/verwaltung/finanzen?filter=overdue", tone: "danger" },
    { title: "Prüfungen in den nächsten 7 Tagen", count: (examsWeek.count ?? 0) + (practicalWeek.count ?? 0), href: "/verwaltung/pruefungen", tone: "neutral" },
    { title: "Fahrzeugfristen in 30 Tagen", count: vehicleAlerts, href: "/verwaltung/fahrzeuge", tone: "warn" },
    { title: "Datenschutzanfragen offen", count: dataRequests.count ?? 0, href: "/verwaltung/schueler?data_requests=1", tone: "danger" },
    { title: "Fehlende Pflichtdokumente", count: missingDocs.count ?? 0, href: "/verwaltung/dokumente?status=missing", tone: "neutral" },
  ];
  return {
    today,
    lessonsToday: (lessonsToday.data ?? []) as unknown as Array<{ id: string; period: string; status: string; kind: string; student_id: string | null; students: { first_name: string; last_name: string } | null; instructors: { display_name: string } | null }>,
    counts: { bookingRequests: bookingRequests.count ?? 0, registrations: registrations.count ?? 0, overdue: overdueRows.length, overdueCents, docsReview: docsReview.count ?? 0 },
    tasks,
  };
}
