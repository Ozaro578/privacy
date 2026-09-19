import { requireAdmin } from "@/lib/auth/session";
import { getOfficeContext } from "@/lib/data/admin";

export interface AuditEntry {
  id: number;
  created_at: string;
  actor: string;
  actor_role: string | null;
  action: "insert" | "update" | "delete";
  entity_table: string;
  entity_id: string | null;
  changed_columns: string[];
  summary: string;
}

export interface AuditFilter { table?: string | undefined; action?: string | undefined; days: number; page: number }
const PAGE = 50;
const TABLE_LABEL: Record<string, string> = {
  students: "Schüler", student_licenses: "Ausbildungen", lessons: "Fahrstunden", lesson_bookings: "Buchungen", lesson_evaluations: "Bewertungen", student_skill_scores: "Kompetenzen",
  invoices: "Rechnungen", invoice_items: "Rechnungspositionen", payments: "Zahlungen", payment_mandates: "SEPA-Mandate", contracts: "Verträge", documents: "Dokumente", consents: "Einwilligungen",
  theory_exams: "Theorieprüfungen", practical_exams: "Praktische Prüfungen", rule_versions: "Regelversionen", theory_questions: "Fragen", question_versions: "Fragenversionen", knowledge_entries: "Wissen",
  cancellation_policies: "Stornoregeln", driving_schools: "Fahrschule", locations: "Standorte", attendance: "Anwesenheit",
};
export const auditTableLabel = (t: string): string => TABLE_LABEL[t] ?? t;
export const AUDIT_TABLES = Object.keys(TABLE_LABEL);

/** Nur Werte, die für eine Zusammenfassung unkritisch sind (keine Freitexte, keine Kontaktdaten). */
const SUMMARY_KEYS = ["status", "invoice_number", "student_number", "license_code", "kind", "lesson_kind", "amount_cents", "gross_cents", "paid_cents", "requirement_code", "title", "version", "review_status", "outcome", "code"];

function summarize(oldData: Record<string, unknown> | null, newData: Record<string, unknown> | null, changed: string[]): string {
  const row = newData ?? oldData ?? {};
  const parts: string[] = [];
  for (const k of SUMMARY_KEYS) {
    if (row[k] === undefined || row[k] === null) continue;
    const v = row[k];
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") parts.push(`${k}: ${String(v)}`);
    if (parts.length >= 3) break;
  }
  if (changed.length > 0) parts.push(`geändert: ${changed.slice(0, 6).join(", ")}${changed.length > 6 ? " …" : ""}`);
  return parts.join(" · ");
}

/** Änderungsprotokoll der Fahrschule (nur Admin und Inhaber). Personenbezogene Inhalte werden nicht angezeigt, nur Metadaten und Statuswerte. */
export async function getAuditLog(filter: AuditFilter): Promise<{ entries: AuditEntry[]; total: number; page: number; pages: number }> {
  await requireAdmin();
  const ctx = await getOfficeContext();
  const since = new Date(Date.now() - filter.days * 86_400_000).toISOString();
  let q = ctx.db.from("audit_logs").select("id, created_at, actor_id, actor_role, action, entity_table, entity_id, old_data, new_data, changed_columns", { count: "exact" }).gte("created_at", since).order("created_at", { ascending: false });
  if (filter.table) q = q.eq("entity_table", filter.table);
  if (filter.action === "insert" || filter.action === "update" || filter.action === "delete") q = q.eq("action", filter.action);
  const from = (filter.page - 1) * PAGE;
  const { data, count, error } = await q.range(from, from + PAGE - 1);
  if (error) throw new Error(error.message);
  const actorIds = [...new Set((data ?? []).map((r) => r.actor_id).filter((x): x is string => !!x))];
  const { data: users } = actorIds.length ? await ctx.db.from("users").select("id, first_name, last_name").in("id", actorIds) : { data: [] as Array<{ id: string; first_name: string | null; last_name: string | null }> };
  const name = new Map((users ?? []).map((u) => [u.id, `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || "Unbekannt"]));
  const entries: AuditEntry[] = (data ?? []).map((r) => {
    const changed = (r.changed_columns ?? []) as string[];
    return {
      id: Number(r.id), created_at: r.created_at, actor: r.actor_id ? (name.get(r.actor_id) ?? "Unbekannt") : "System", actor_role: r.actor_role,
      action: r.action as AuditEntry["action"], entity_table: r.entity_table, entity_id: r.entity_id, changed_columns: changed,
      summary: summarize(r.old_data as Record<string, unknown> | null, r.new_data as Record<string, unknown> | null, changed),
    };
  });
  const total = count ?? 0;
  return { entries, total, page: filter.page, pages: Math.max(1, Math.ceil(total / PAGE)) };
}
