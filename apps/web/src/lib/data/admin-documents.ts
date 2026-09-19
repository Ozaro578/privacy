import "server-only";
import type { Tables } from "@fahrpilot/db";
import { getOfficeContext } from "./admin";

export type DocumentReviewRow = Tables<"documents"> & { students: { id: string; first_name: string; last_name: string; user_id: string | null } | null; student_licenses: { license_code: string } | null };

export const DOCUMENT_FILTERS = ["uploaded", "missing", "rejected", "verified", "expired"] as const;
export type DocumentFilter = (typeof DOCUMENT_FILTERS)[number];

export const RETENTION_CATEGORIES: Array<{ code: string; label: string; hint: string }> = [
  { code: "invoices", label: "Rechnungen und Buchungsbelege", hint: "Handels- und steuerrechtliche Aufbewahrung, in der Regel 10 Jahre (§ 147 AO, § 257 HGB)" },
  { code: "training_records", label: "Ausbildungsnachweise", hint: "Fahrschülerausbildungsordnung, Nachweise über Ausbildung und Prüfung" },
  { code: "documents", label: "Hochgeladene Dokumente der Schüler", hint: "Sehtest, Erste Hilfe, Anträge; nach Abschluss der Ausbildung nur so lange wie nötig" },
  { code: "learning_data", label: "Lerndaten", hint: "Fragenversuche, Lernsitzungen, Prognosen" },
  { code: "messages", label: "Nachrichten", hint: "Chatverläufe zwischen Schülern, Fahrlehrern und Büro" },
  { code: "audit_logs", label: "Audit-Log", hint: "Änderungsprotokoll, nach Vorgabe der Verfahrensdokumentation" },
];

export const REVIEW_STATUS_LABEL: Record<string, string> = { draft: "Entwurf", in_review: "In Prüfung", approved: "Freigegeben", published: "Veröffentlicht", retired: "Zurückgezogen", needs_verification: "Zu verifizieren" };

/** Dokumente zur Prüfung (Standard: hochgeladen), Checklisten-Vorlagen und Aufbewahrungsregeln der Fahrschule. */
export async function getDocumentsOverview(filter: { status?: string; q?: string }) {
  const ctx = await getOfficeContext();
  const status: DocumentFilter = (DOCUMENT_FILTERS as readonly string[]).includes(filter.status ?? "") ? (filter.status as DocumentFilter) : "uploaded";
  const [{ data: docs }, counts, { data: requirements }, { data: retention }, { data: licenses }] = await Promise.all([
    ctx.db.from("documents").select("*, students(id, first_name, last_name, user_id), student_licenses(license_code)").eq("status", status).order("updated_at", { ascending: status === "uploaded" }).limit(300),
    Promise.all(DOCUMENT_FILTERS.map(async (s) => ({ status: s, count: (await ctx.db.from("documents").select("id", { count: "exact", head: true }).eq("status", s)).count ?? 0 }))),
    ctx.db.from("document_requirements").select("*").order("sort_order").order("code"),
    ctx.db.from("retention_policies").select("*").order("data_category"),
    ctx.db.from("licenses").select("code").eq("active", true).order("sort_order"),
  ]);
  let rows = (docs ?? []) as unknown as DocumentReviewRow[];
  if (filter.q) {
    const s = filter.q.toLowerCase();
    rows = rows.filter((d) => `${d.students?.first_name ?? ""} ${d.students?.last_name ?? ""} ${d.title}`.toLowerCase().includes(s));
  }
  const reqs = requirements ?? [];
  const tenantReqs = reqs.filter((r) => r.tenant_id === ctx.tenantId);
  const platformReqs = reqs.filter((r) => r.tenant_id === null);
  const overriddenCodes = new Set(tenantReqs.map((r) => r.code));
  const policies = retention ?? [];
  return {
    ctx, status, rows, counts,
    tenantRequirements: tenantReqs,
    platformRequirements: platformReqs.map((r) => ({ ...r, overridden: overriddenCodes.has(r.code) })),
    tenantPolicies: policies.filter((p) => p.tenant_id === ctx.tenantId),
    platformPolicies: policies.filter((p) => p.tenant_id === null),
    licenses: (licenses ?? []).map((l) => l.code),
  };
}

/** Deutscher Name einer Vorlage (name_i18n.de, sonst Code). */
export function requirementName(r: Pick<Tables<"document_requirements">, "name_i18n" | "code">): string {
  const n = r.name_i18n as Record<string, string> | null;
  return n?.["de"] ?? n?.["en"] ?? r.code;
}

export function requirementDescription(r: Pick<Tables<"document_requirements">, "description_i18n">): string {
  const n = r.description_i18n as Record<string, string> | null;
  return n?.["de"] ?? "";
}

export function appliesWhenLabel(r: Pick<Tables<"document_requirements">, "applies_when">): string {
  const w = (r.applies_when ?? {}) as Record<string, unknown>;
  if ("accompanied_driving" in w) return w["accompanied_driving"] ? "Nur Begleitetes Fahren" : "Nicht bei Begleitetem Fahren";
  if ("minor" in w) return "Nur Minderjährige";
  return "Immer";
}
