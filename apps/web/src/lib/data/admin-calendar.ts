import "server-only";
import { addDays, berlinDate, dayBounds, getOfficeContext, startOfWeek } from "./admin";
import { parseRange } from "@/components/ui";

export type CalendarView = "day" | "week" | "month";
export interface CalendarFilters { view: CalendarView; date: string; instructor?: string; vehicle?: string; transmission?: string; license?: string; status?: string }

export interface CalendarLesson { id: string; kind: "lesson"; period: string; start: string; end: string; status: string; lesson_kind: string; units: number; transmission: string | null; license_codes: string[]; instructor_id: string; vehicle_id: string | null; student_id: string | null; student_license_id: string | null; meeting_point: string | null; price_cents: number | null; instructor: string; color: string | null; vehicle: string | null; student: string | null }
export interface CalendarClass { id: string; kind: "class"; period: string; start: string; end: string; status: string; title: string; unit_code: string; instructor: string | null; attendees: number; capacity: number | null }

export function rangeFor(view: CalendarView, date: string): { from: string; to: string; days: string[] } {
  if (view === "day") return { from: date, to: addDays(date, 1), days: [date] };
  if (view === "week") { const s = startOfWeek(date); return { from: s, to: addDays(s, 7), days: Array.from({ length: 7 }, (_, i) => addDays(s, i)) }; }
  const first = `${date.slice(0, 7)}-01`;
  const gridStart = startOfWeek(first);
  const nextMonth = new Date(`${first}T00:00:00Z`); nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  const lastDay = addDays(nextMonth.toISOString().slice(0, 10), -1);
  const gridEnd = addDays(startOfWeek(lastDay), 7);
  const days: string[] = [];
  for (let d = gridStart; d < gridEnd; d = addDays(d, 1)) days.push(d);
  return { from: gridStart, to: gridEnd, days };
}

export async function getCalendar(f: CalendarFilters) {
  const ctx = await getOfficeContext();
  const range = rangeFor(f.view, f.date);
  const fromIso = dayBounds(range.from).start;
  const toIso = dayBounds(range.to).start;
  let lessonsQ = ctx.db.from("lessons").select("id, period, status, kind, units, transmission, license_codes, instructor_id, vehicle_id, student_id, student_license_id, meeting_point, price_cents, instructors(display_name, color), vehicles(license_plate), students(first_name, last_name)").gte("period", fromIso).lt("period", toIso).neq("status", "cancelled").order("period");
  if (f.instructor) lessonsQ = lessonsQ.eq("instructor_id", f.instructor);
  if (f.vehicle) lessonsQ = lessonsQ.eq("vehicle_id", f.vehicle);
  if (f.transmission) lessonsQ = lessonsQ.eq("transmission", f.transmission);
  if (f.license) lessonsQ = lessonsQ.contains("license_codes", [f.license]);
  if (f.status) lessonsQ = lessonsQ.eq("status", f.status as "open");
  let classesQ = ctx.db.from("theory_classes").select("id, period, status, title, lesson_unit_code, capacity, instructor_id, instructors(display_name), attendance(count)").gte("period", fromIso).lt("period", toIso).neq("status", "cancelled").order("period");
  if (f.instructor) classesQ = classesQ.eq("instructor_id", f.instructor);
  const [{ data: lessons }, { data: classes }, { data: instructors }, { data: vehicles }, { data: licenses }, { data: requests }, { data: waitlist }, { data: absences }, { data: blocks }, { data: activeLicenses }] = await Promise.all([
    lessonsQ,
    f.vehicle || f.transmission || f.license || f.status ? Promise.resolve({ data: [] }) : classesQ,
    ctx.db.from("instructors").select("id, display_name, color, license_classes, teaches_manual, teaches_automatic").eq("active", true).order("display_name"),
    ctx.db.from("vehicles").select("id, license_plate, transmission, license_classes").eq("status", "active").order("license_plate"),
    ctx.db.from("licenses").select("code").eq("active", true).order("sort_order"),
    ctx.db.from("lessons").select("id, period, kind, units, instructors(display_name), students(first_name, last_name), student_licenses(license_code)").eq("status", "booked").gte("period", new Date().toISOString()).order("period").limit(50),
    ctx.db.from("waitlist_entries").select("id, earliest, latest, weekdays, time_from, time_to, transmission, status, created_at, students(first_name, last_name), instructors(display_name), student_licenses(license_code)").in("status", ["active", "offered"]).order("created_at").limit(100),
    ctx.db.from("instructor_absences").select("id, instructor_id, period, reason, instructors(display_name)").gte("period", fromIso).lt("period", toIso),
    ctx.db.from("vehicle_blocks").select("id, vehicle_id, period, reason, vehicles(license_plate)").gte("period", fromIso).lt("period", toIso),
    ctx.db.from("student_licenses").select("id, student_id, license_code, transmission, students(first_name, last_name)").eq("status", "active").order("license_code").limit(1000),
  ]);
  type LessonRaw = { id: string; period: string; status: string; kind: string; units: number; transmission: string | null; license_codes: string[]; instructor_id: string; vehicle_id: string | null; student_id: string | null; student_license_id: string | null; meeting_point: string | null; price_cents: number | null; instructors: { display_name: string; color: string | null } | null; vehicles: { license_plate: string } | null; students: { first_name: string; last_name: string } | null };
  const lessonItems: CalendarLesson[] = ((lessons ?? []) as unknown as LessonRaw[]).map((l) => { const r = parseRange(l.period); return { id: l.id, kind: "lesson", period: l.period, start: r.start, end: r.end, status: l.status, lesson_kind: l.kind, units: l.units, transmission: l.transmission, license_codes: l.license_codes, instructor_id: l.instructor_id, vehicle_id: l.vehicle_id, student_id: l.student_id, student_license_id: l.student_license_id, meeting_point: l.meeting_point, price_cents: l.price_cents, instructor: l.instructors?.display_name ?? "", color: l.instructors?.color ?? null, vehicle: l.vehicles?.license_plate ?? null, student: l.students ? `${l.students.first_name} ${l.students.last_name}` : null }; });
  type ClassRaw = { id: string; period: string; status: string; title: string; lesson_unit_code: string; capacity: number | null; instructors: { display_name: string } | null; attendance: Array<{ count: number }> };
  const classItems: CalendarClass[] = ((classes ?? []) as unknown as ClassRaw[]).map((c) => { const r = parseRange(c.period); return { id: c.id, kind: "class", period: c.period, start: r.start, end: r.end, status: c.status, title: c.title, unit_code: c.lesson_unit_code, instructor: c.instructors?.display_name ?? null, attendees: c.attendance[0]?.count ?? 0, capacity: c.capacity }; });
  const items = [...lessonItems, ...classItems].sort((a, b) => a.start.localeCompare(b.start));
  const byDay = new Map<string, Array<CalendarLesson | CalendarClass>>();
  for (const day of range.days) byDay.set(day, []);
  for (const it of items) { const day = berlinDate(new Date(it.start)); byDay.get(day)?.push(it); }
  return {
    ctx, range, byDay, items,
    instructors: instructors ?? [], vehicles: vehicles ?? [], licenses: (licenses ?? []).map((l) => l.code),
    requests: (requests ?? []) as unknown as Array<{ id: string; period: string; kind: string; units: number; instructors: { display_name: string } | null; students: { first_name: string; last_name: string } | null; student_licenses: { license_code: string } | null }>,
    waitlist: (waitlist ?? []) as unknown as Array<{ id: string; earliest: string; latest: string; weekdays: number[]; time_from: string | null; time_to: string | null; transmission: string | null; status: string; created_at: string; students: { first_name: string; last_name: string } | null; instructors: { display_name: string } | null; student_licenses: { license_code: string } | null }>,
    absences: (absences ?? []) as unknown as Array<{ id: string; instructor_id: string; period: string; reason: string; instructors: { display_name: string } | null }>,
    blocks: (blocks ?? []) as unknown as Array<{ id: string; vehicle_id: string; period: string; reason: string; vehicles: { license_plate: string } | null }>,
    activeLicenses: (activeLicenses ?? []) as unknown as Array<{ id: string; student_id: string; license_code: string; transmission: string; students: { first_name: string; last_name: string } | null }>,
    openSlots: lessonItems.filter((l) => l.status === "open" && l.start >= new Date().toISOString()),
  };
}
