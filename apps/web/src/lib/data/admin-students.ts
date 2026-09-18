import "server-only";
import type { Tables } from "@fahrpilot/db";
import { resolveRulesFor } from "./student";
import { getOfficeContext } from "./admin";

export interface StudentFilters { q?: string; status?: string; license?: string; instructor?: string; dataRequests?: boolean }

export interface StudentListRow {
  id: string;
  student_number: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  student_licenses: Array<{ id: string; license_code: string; transmission: string; status: string; primary_instructor_id: string | null; theory_exam_status: string; practical_exam_status: string; instructors: { display_name: string } | null }>;
}

export async function listStudents(filters: StudentFilters) {
  const ctx = await getOfficeContext();
  let query = ctx.db.from("students").select("id, student_number, first_name, last_name, email, phone, status, created_at, student_licenses(id, license_code, transmission, status, primary_instructor_id, theory_exam_status, practical_exam_status, instructors(display_name))").order("last_name").order("first_name").limit(500);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.q) {
    const q = filters.q.replace(/[%,()]/g, " ").trim();
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,student_number.ilike.%${q}%`);
  }
  const [{ data }, { data: instructors }, { data: licenses }, openInvoices] = await Promise.all([
    query,
    ctx.db.from("instructors").select("id, display_name").eq("active", true).order("display_name"),
    ctx.db.from("licenses").select("code, name").eq("active", true).order("sort_order"),
    ctx.db.from("invoices").select("student_id, gross_cents, paid_cents").in("status", ["issued", "partially_paid", "overdue"]),
  ]);
  let rows = (data ?? []) as unknown as StudentListRow[];
  if (filters.license) rows = rows.filter((s) => s.student_licenses.some((l) => l.license_code === filters.license));
  if (filters.instructor) rows = rows.filter((s) => s.student_licenses.some((l) => l.primary_instructor_id === filters.instructor));
  const openByStudent = new Map<string, number>();
  for (const i of openInvoices.data ?? []) openByStudent.set(i.student_id, (openByStudent.get(i.student_id) ?? 0) + (i.gross_cents - i.paid_cents));
  let dataRequests: Array<{ id: string; student_id: string | null; kind: string; status: string; created_at: string }> = [];
  if (filters.dataRequests) {
    const { data: dr } = await ctx.db.from("data_requests").select("id, student_id, kind, status, created_at").in("status", ["open", "in_progress"]).order("created_at");
    dataRequests = dr ?? [];
  }
  return { rows, instructors: instructors ?? [], licenses: licenses ?? [], openByStudent, dataRequests, isAdmin: ctx.isAdmin };
}

export async function getStudentFormOptions() {
  const ctx = await getOfficeContext();
  const [{ data: instructors }, { data: licenses }, { data: locations }] = await Promise.all([
    ctx.db.from("instructors").select("id, display_name, license_classes, teaches_manual, teaches_automatic").eq("active", true).order("display_name"),
    ctx.db.from("licenses").select("code, name, base_class").eq("active", true).order("sort_order"),
    ctx.db.from("locations").select("id, name").eq("active", true).order("name"),
  ]);
  return { instructors: instructors ?? [], licenses: licenses ?? [], locations: locations ?? [] };
}

export type StudentLicenseWithInstructor = Tables<"student_licenses"> & { instructors: { display_name: string } | null };

export async function getStudentDetail(id: string) {
  const ctx = await getOfficeContext();
  const { data: student } = await ctx.db.from("students").select("*").eq("id", id).maybeSingle();
  if (!student) return null;
  const [licenses, documents, contracts, invoices, payments, theoryExams, practicalExams, dataRequests, options, lessons, mandates, consents, attendance] = await Promise.all([
    ctx.db.from("student_licenses").select("*, instructors(display_name)").eq("student_id", id).order("started_at", { ascending: false }),
    ctx.db.from("documents").select("*").eq("student_id", id).order("created_at"),
    ctx.db.from("contracts").select("*, price_lists(name), cancellation_policies(name)").eq("student_id", id).order("created_at", { ascending: false }),
    ctx.db.from("invoices").select("id, invoice_number, status, issued_at, due_at, gross_cents, paid_cents, dunning_level, pdf_path").eq("student_id", id).order("created_at", { ascending: false }),
    ctx.db.from("payments").select("id, invoice_id, method, amount_cents, status, paid_at, provider, note, invoices(invoice_number)").eq("student_id", id).order("created_at", { ascending: false }),
    ctx.db.from("theory_exams").select("*").in("student_license_id", []).limit(0),
    ctx.db.from("practical_exams").select("*, instructors(display_name), vehicles(license_plate)").in("student_license_id", []).limit(0),
    ctx.db.from("data_requests").select("*").eq("student_id", id).order("created_at", { ascending: false }),
    getStudentFormOptions(),
    ctx.db.from("lessons").select("id, period, kind, status, units, instructors(display_name)").eq("student_id", id).order("period", { ascending: false }).limit(200),
    ctx.db.from("payment_mandates").select("*").eq("student_id", id).order("created_at", { ascending: false }),
    ctx.db.from("consents").select("consent_type, text_version, granted, granted_at, revoked_at").eq("student_id", id).order("granted_at", { ascending: false }),
    ctx.db.from("attendance").select("id, status, checked_in_at, theory_classes(title, lesson_unit_code, period)").eq("student_id", id).order("checked_in_at", { ascending: false }),
  ]);
  const licenseRows = (licenses.data ?? []) as unknown as StudentLicenseWithInstructor[];
  const licenseIds = licenseRows.map((l) => l.id);
  const [te, pe] = licenseIds.length
    ? await Promise.all([
        ctx.db.from("theory_exams").select("*").in("student_license_id", licenseIds).order("attempt_no"),
        ctx.db.from("practical_exams").select("*, instructors(display_name), vehicles(license_plate)").in("student_license_id", licenseIds).order("attempt_no"),
      ])
    : [theoryExams, practicalExams];
  const rulesByLicense = new Map<string, Awaited<ReturnType<typeof resolveRulesFor>>>();
  for (const l of licenseRows) rulesByLicense.set(l.id, await resolveRulesFor(ctx.db, l.license_code, l.acquisition_kind as "first" | "extension"));
  const [{ data: priceLists }, { data: policies }, { data: vehicles }] = await Promise.all([
    ctx.db.from("price_lists").select("id, name, license_code, valid_from, valid_until").order("valid_from", { ascending: false }),
    ctx.db.from("cancellation_policies").select("id, name, valid_from").order("valid_from", { ascending: false }),
    ctx.db.from("vehicles").select("id, license_plate, transmission").eq("status", "active").order("license_plate"),
  ]);
  return {
    ctx,
    student,
    licenses: licenseRows,
    documents: documents.data ?? [],
    contracts: (contracts.data ?? []) as unknown as Array<Tables<"contracts"> & { price_lists: { name: string } | null; cancellation_policies: { name: string } | null }>,
    invoices: invoices.data ?? [],
    payments: (payments.data ?? []) as unknown as Array<{ id: string; invoice_id: string | null; method: string; amount_cents: number; status: string; paid_at: string | null; provider: string; note: string | null; invoices: { invoice_number: string | null } | null }>,
    theoryExams: (te.data ?? []) as Tables<"theory_exams">[],
    practicalExams: (pe.data ?? []) as unknown as Array<Tables<"practical_exams"> & { instructors: { display_name: string } | null; vehicles: { license_plate: string } | null }>,
    dataRequests: dataRequests.data ?? [],
    options,
    lessons: (lessons.data ?? []) as unknown as Array<{ id: string; period: string; kind: string; status: string; units: number; instructors: { display_name: string } | null }>,
    mandates: mandates.data ?? [],
    consents: consents.data ?? [],
    attendance: (attendance.data ?? []) as unknown as Array<{ id: string; status: string; checked_in_at: string | null; theory_classes: { title: string; lesson_unit_code: string; period: string } | null }>,
    rulesByLicense,
    priceLists: priceLists ?? [],
    policies: policies ?? [],
    vehicles: vehicles ?? [],
  };
}

/** Vollständiger Datensatz eines Schülers für den Export (Auskunft nach Art. 15 DSGVO). */
export async function exportStudentData(id: string) {
  const ctx = await getOfficeContext();
  const { data: student } = await ctx.db.from("students").select("*").eq("id", id).maybeSingle();
  if (!student) return null;
  const [licenses, lessons, bookings, evaluations, documents, contracts, invoices, payments, theoryExams, practicalExams, attendance, consents, dataRequests, skillScores] = await Promise.all([
    ctx.db.from("student_licenses").select("*").eq("student_id", id),
    ctx.db.from("lessons").select("*").eq("student_id", id),
    ctx.db.from("lesson_bookings").select("*").eq("student_id", id),
    ctx.db.from("lesson_evaluations").select("*").in("student_license_id", []).limit(0),
    ctx.db.from("documents").select("id, requirement_code, kind, title, status, verified_at, rejection_reason, expires_at, created_at").eq("student_id", id),
    ctx.db.from("contracts").select("*").eq("student_id", id),
    ctx.db.from("invoices").select("*, invoice_items(*)").eq("student_id", id),
    ctx.db.from("payments").select("*").eq("student_id", id),
    ctx.db.from("theory_exams").select("*").in("student_license_id", []).limit(0),
    ctx.db.from("practical_exams").select("*").in("student_license_id", []).limit(0),
    ctx.db.from("attendance").select("*, theory_classes(title, lesson_unit_code, period)").eq("student_id", id),
    ctx.db.from("consents").select("*").eq("student_id", id),
    ctx.db.from("data_requests").select("*").eq("student_id", id),
    ctx.db.from("student_skill_scores").select("*").in("student_license_id", []).limit(0),
  ]);
  const licenseIds = (licenses.data ?? []).map((l) => l.id);
  const [ev, te, pe, ss] = licenseIds.length
    ? await Promise.all([
        ctx.db.from("lesson_evaluations").select("*").in("student_license_id", licenseIds),
        ctx.db.from("theory_exams").select("*").in("student_license_id", licenseIds),
        ctx.db.from("practical_exams").select("*").in("student_license_id", licenseIds),
        ctx.db.from("student_skill_scores").select("*").in("student_license_id", licenseIds),
      ])
    : [evaluations, theoryExams, practicalExams, skillScores];
  const { notes_internal: _notes, ...studentPublic } = student;
  void _notes;
  return {
    exported_at: new Date().toISOString(),
    driving_school: { id: ctx.school.id, name: ctx.school.name },
    student: studentPublic,
    student_licenses: licenses.data ?? [],
    lessons: lessons.data ?? [],
    lesson_bookings: bookings.data ?? [],
    lesson_evaluations: ev.data ?? [],
    student_skill_scores: ss.data ?? [],
    documents: documents.data ?? [],
    contracts: contracts.data ?? [],
    invoices: invoices.data ?? [],
    payments: payments.data ?? [],
    theory_exams: te.data ?? [],
    practical_exams: pe.data ?? [],
    attendance: attendance.data ?? [],
    consents: consents.data ?? [],
    data_requests: dataRequests.data ?? [],
  };
}
