import Link from "next/link";
import { appliesWhenLabel, getDocumentsOverview, requirementDescription, requirementName, RETENTION_CATEGORIES, REVIEW_STATUS_LABEL, type DocumentFilter } from "@/lib/data/admin-documents";
import { DOC_STATUS_LABEL } from "@/lib/data/admin";
import { reviewDocument } from "@/lib/actions/admin-students";
import { copyPlatformRequirement, deleteRetentionPolicy, saveRequirement, saveRetentionPolicy, setRequirementActive } from "@/lib/actions/admin-documents";
import { Alert, Card, EmptyState, Pill, btn, fmt } from "@/components/ui";
import { ActionForm, field, label } from "@/components/admin/action-form";
import { ActionButton } from "@/components/admin/action-button";

export const metadata = { title: "Dokumente" };

const FILTER_LABEL: Record<DocumentFilter, string> = { uploaded: "Zur Prüfung", missing: "Fehlend", rejected: "Abgelehnt", verified: "Geprüft", expired: "Abgelaufen" };
const DOC_TONE: Record<string, "neutral" | "brand" | "success" | "warn" | "danger"> = { missing: "neutral", uploaded: "warn", verified: "success", rejected: "danger", expired: "danger" };

function RequirementFields({ r, licenses, idPrefix }: { r?: { code: string; name: string; description: string; license_codes: string[]; required: boolean; requires_upload: boolean; applies_when: string; sort_order: number }; licenses: string[]; idPrefix: string }) {
  const id = (n: string) => `${idPrefix}-${n}`;
  return (
    <>
      <div><label htmlFor={id("code")} className={label}>Code</label><input id={id("code")} name="code" required defaultValue={r?.code ?? ""} readOnly={Boolean(r)} className={`${field} ${r ? "bg-ink-50" : ""}`} /></div>
      <div><label htmlFor={id("name")} className={label}>Bezeichnung</label><input id={id("name")} name="name" required defaultValue={r?.name ?? ""} className={field} /></div>
      <div className="md:col-span-2"><label htmlFor={id("desc")} className={label}>Hinweis für Schüler</label><input id={id("desc")} name="description" defaultValue={r?.description ?? ""} className={field} /></div>
      <fieldset className="md:col-span-2"><legend className="mb-1 text-sm font-medium">Klassen (keine Auswahl = alle)</legend><div className="flex flex-wrap gap-3">{licenses.map((c) => <label key={c} className="flex min-h-11 items-center gap-1 text-sm"><input type="checkbox" name="license_codes" value={c} defaultChecked={r?.license_codes.includes(c) ?? false} className="h-5 w-5" /> {c}</label>)}</div></fieldset>
      <div><label htmlFor={id("when")} className={label}>Gilt</label><select id={id("when")} name="applies_when" defaultValue={r?.applies_when ?? "always"} className={field}><option value="always">Immer</option><option value="accompanied_driving">Nur Begleitetes Fahren</option><option value="minor">Nur Minderjährige</option></select></div>
      <div><label htmlFor={id("sort")} className={label}>Reihenfolge</label><input id={id("sort")} name="sort_order" type="number" min={0} defaultValue={r?.sort_order ?? 0} className={field} /></div>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="required" defaultChecked={r?.required ?? true} className="h-5 w-5" /> Pflichtdokument</label>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="requires_upload" defaultChecked={r?.requires_upload ?? true} className="h-5 w-5" /> Upload durch Schüler erforderlich</label>
    </>
  );
}

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const d = await getDocumentsOverview({ ...(sp.status ? { status: sp.status } : {}), ...(sp.q ? { q: sp.q } : {}) });
  const isAdmin = d.ctx.isAdmin;
  const appliesKey = (w: unknown) => { const o = (w ?? {}) as Record<string, unknown>; return "accompanied_driving" in o ? "accompanied_driving" : "minor" in o ? "minor" : "always"; };
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Dokumente</h1>
        <p className="text-sm text-ink-700">Hochgeladene Nachweise prüfen, Checklisten-Vorlagen pflegen und Aufbewahrungsfristen festlegen.</p>
      </header>

      <Card title="Dokumentenstatus aller Schüler">
        <form className="mb-3 flex flex-wrap items-center gap-2" role="search">
          {d.counts.map((c) => <Link key={c.status} href={`/verwaltung/dokumente?status=${c.status}`} className={`min-h-9 rounded-full px-3 py-1.5 text-sm ${d.status === c.status ? "bg-brand-50 font-semibold text-brand-700" : "text-ink-700 hover:bg-ink-100"}`}>{FILTER_LABEL[c.status]} ({c.count})</Link>)}
          <input type="hidden" name="status" value={d.status} />
          <label htmlFor="q" className="sr-only">Suche nach Schüler oder Dokument</label>
          <input id="q" name="q" defaultValue={sp.q ?? ""} placeholder="Schüler oder Dokument" className="min-h-9 rounded-xl border border-ink-300 px-3 text-sm" />
          <button type="submit" className={`${btn.secondary} min-h-9 px-3 text-sm`}>Suchen</button>
        </form>
        {d.rows.length === 0 ? <EmptyState title={d.status === "uploaded" ? "Nichts zu prüfen" : "Keine Dokumente"} text={d.status === "uploaded" ? "Alle hochgeladenen Dokumente sind geprüft." : "Für diese Auswahl gibt es keine Einträge."} /> : (
          <ul className="divide-y divide-ink-100">
            {d.rows.map((doc) => (
              <li key={doc.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  {doc.students ? <Link href={`/verwaltung/schueler/${doc.students.id}#dokumente`} className="font-medium text-brand-700 hover:underline">{doc.students.last_name}, {doc.students.first_name}</Link> : <span className="font-medium">Ohne Schüler</span>}
                  {doc.student_licenses && <span className="text-xs text-ink-500">Klasse {doc.student_licenses.license_code}</span>}
                  <span>{doc.title}</span>
                  <Pill tone={DOC_TONE[doc.status] ?? "neutral"}>{DOC_STATUS_LABEL[doc.status] ?? doc.status}</Pill>
                  {doc.storage_path && <a href={`/api/files?path=${encodeURIComponent(doc.storage_path)}`} target="_blank" rel="noreferrer" className="text-sm text-brand-700 underline">Vorschau öffnen</a>}
                  {doc.mime_type && <span className="text-xs text-ink-500">{doc.mime_type}{doc.size_bytes ? `, ${Math.round(doc.size_bytes / 1024)} KB` : ""}</span>}
                  <span className="text-xs text-ink-500">{fmt.date(doc.updated_at)}</span>
                  {doc.expires_at && <span className="text-xs text-ink-500">gültig bis {fmt.date(doc.expires_at)}</span>}
                  {doc.rejection_reason && doc.status === "rejected" && <span className="text-xs text-danger-500">Grund: {doc.rejection_reason}</span>}
                </div>
                {doc.status === "uploaded" && (
                  <div className="mt-2 grid gap-3 md:grid-cols-2">
                    <ActionForm action={reviewDocument} submitLabel="Freigeben" tone="primary" className="grid gap-2 md:grid-cols-2">
                      <input type="hidden" name="id" value={doc.id} /><input type="hidden" name="decision" value="verified" />
                      <div className="md:col-span-2"><label htmlFor={`ex-${doc.id}`} className={label}>Gültig bis (optional)</label><input id={`ex-${doc.id}`} name="expires_at" type="date" className={field} /></div>
                    </ActionForm>
                    <ActionForm action={reviewDocument} submitLabel="Ablehnen" tone="danger" className="grid gap-2 md:grid-cols-2">
                      <input type="hidden" name="id" value={doc.id} /><input type="hidden" name="decision" value="rejected" />
                      <div className="md:col-span-2"><label htmlFor={`rj-${doc.id}`} className={label}>Ablehnungsgrund (wird dem Schüler mitgeteilt)</label><input id={`rj-${doc.id}`} name="reason" required className={field} /></div>
                    </ActionForm>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Checklisten-Vorlagen der Fahrschule">
        {!isAdmin && <Alert tone="info">Vorlagen bearbeitet nur die Rolle Admin oder Inhaber.</Alert>}
        <p className="my-2 text-sm text-ink-700">Eigene Vorlagen ersetzen die Plattform-Vorlage mit gleichem Code. Sie werden bei neuen Anmeldungen und beim Anlegen einer Ausbildung in die Checkliste übernommen.</p>
        {d.tenantRequirements.length === 0 ? <p className="text-sm text-ink-500">Noch keine eigenen Vorlagen. Es gelten die Plattform-Vorlagen unten.</p> : (
          <ul className="divide-y divide-ink-100 text-sm">
            {d.tenantRequirements.map((r) => (
              <li key={r.id} className="py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{requirementName(r)}</span><span className="font-mono text-xs text-ink-500">{r.code}</span>
                  <Pill tone={r.active ? "success" : "neutral"}>{r.active ? "Aktiv" : "Deaktiviert"}</Pill>
                  {r.required && <Pill tone="brand">Pflicht</Pill>}{r.requires_upload && <Pill tone="neutral">Upload</Pill>}
                  <span className="text-ink-500">{r.license_codes.length ? `Klassen ${r.license_codes.join(", ")}` : "Alle Klassen"}, {appliesWhenLabel(r)}</span>
                  {isAdmin && <ActionButton action={setRequirementActive.bind(null, r.id, !r.active)} label={r.active ? "Deaktivieren" : "Aktivieren"} tone="ghost" small />}
                </div>
                {requirementDescription(r) && <p className="text-xs text-ink-500">{requirementDescription(r)}</p>}
                {isAdmin && (
                  <details className="mt-1"><summary className="cursor-pointer text-brand-700">Bearbeiten</summary>
                    <div className="mt-2 rounded-xl bg-ink-50 p-3"><ActionForm action={saveRequirement} submitLabel="Speichern" className="grid gap-2 md:grid-cols-2"><RequirementFields r={{ code: r.code, name: requirementName(r), description: requirementDescription(r), license_codes: r.license_codes, required: r.required, requires_upload: r.requires_upload, applies_when: appliesKey(r.applies_when), sort_order: r.sort_order }} licenses={d.licenses} idPrefix={`rq-${r.id}`} /></ActionForm></div>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
        {isAdmin && (
          <details className="mt-4 rounded-xl border border-ink-100 p-3"><summary className="cursor-pointer font-medium">Eigene Vorlage anlegen</summary>
            <div className="mt-3"><ActionForm action={saveRequirement} submitLabel="Vorlage anlegen" className="grid gap-2 md:grid-cols-2" resetOnSuccess><RequirementFields licenses={d.licenses} idPrefix="rq-new" /></ActionForm></div>
          </details>
        )}
        <h3 className="mt-6 mb-2 text-sm font-semibold">Plattform-Vorlagen (Referenz)</h3>
        <ul className="divide-y divide-ink-100 text-sm">
          {d.platformRequirements.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-2 py-2">
              <span className="font-medium">{requirementName(r)}</span><span className="font-mono text-xs text-ink-500">{r.code}</span>
              {r.required && <Pill tone="brand">Pflicht</Pill>}{r.requires_upload && <Pill tone="neutral">Upload</Pill>}{!r.active && <Pill tone="neutral">Inaktiv</Pill>}
              <span className="text-ink-500">{r.license_codes.length ? `Klassen ${r.license_codes.join(", ")}` : "Alle Klassen"}, {appliesWhenLabel(r)}</span>
              {r.overridden ? <Pill tone="success">Eigene Vorlage vorhanden</Pill> : isAdmin && <ActionButton action={copyPlatformRequirement.bind(null, r.id)} label="Als eigene Vorlage übernehmen" tone="ghost" small />}
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Aufbewahrung">
        <p className="mb-3 text-sm text-ink-700">Aufbewahrungsfristen je Datenart. Eigene Regeln gehen den Plattform-Vorgaben vor. Fristen sind rechtlich zu prüfen; der Prüfstatus dokumentiert das.</p>
        {!isAdmin && <Alert tone="info">Aufbewahrungsregeln bearbeitet nur die Rolle Admin oder Inhaber.</Alert>}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink-500"><tr><th className="p-2">Datenart</th><th className="p-2">Plattform-Vorgabe</th><th className="p-2">Eigene Regel</th><th className="p-2">Prüfstatus</th>{isAdmin && <th className="p-2"></th>}</tr></thead>
            <tbody className="divide-y divide-ink-100">
              {RETENTION_CATEGORIES.map((cat) => {
                const own = d.tenantPolicies.find((p) => p.data_category === cat.code);
                const platform = d.platformPolicies.find((p) => p.data_category === cat.code);
                const shown = own ?? platform;
                return (
                  <tr key={cat.code} className="align-top">
                    <td className="p-2"><span className="font-medium">{cat.label}</span><span className="block text-xs text-ink-500">{cat.hint}</span></td>
                    <td className="p-2">{platform ? `${platform.retention_months} Monate${platform.legal_basis ? ` (${platform.legal_basis})` : ""}` : "keine"}</td>
                    <td className="p-2">{own ? `${own.retention_months} Monate${own.legal_basis ? ` (${own.legal_basis})` : ""}` : <span className="text-ink-500">Vorgabe gilt</span>}</td>
                    <td className="p-2">{shown ? <Pill tone={shown.review_status === "approved" || shown.review_status === "published" ? "success" : "warn"}>{REVIEW_STATUS_LABEL[shown.review_status] ?? shown.review_status}</Pill> : ""}</td>
                    {isAdmin && (
                      <td className="p-2">
                        <details><summary className="cursor-pointer text-brand-700">{own ? "Bearbeiten" : "Eigene Regel"}</summary>
                          <div className="mt-2 w-72 rounded-xl bg-ink-50 p-3">
                            <ActionForm action={saveRetentionPolicy} submitLabel="Speichern" className="grid gap-2">
                              <input type="hidden" name="data_category" value={cat.code} />
                              <div><label htmlFor={`rm-${cat.code}`} className={label}>Monate</label><input id={`rm-${cat.code}`} name="retention_months" type="number" min={0} required defaultValue={own?.retention_months ?? platform?.retention_months ?? 120} className={field} /></div>
                              <div><label htmlFor={`lb-${cat.code}`} className={label}>Rechtsgrundlage</label><input id={`lb-${cat.code}`} name="legal_basis" defaultValue={own?.legal_basis ?? platform?.legal_basis ?? ""} className={field} /></div>
                              <div><label htmlFor={`rs-${cat.code}`} className={label}>Prüfstatus</label><select id={`rs-${cat.code}`} name="review_status" defaultValue={own?.review_status === "approved" || own?.review_status === "in_review" ? own.review_status : "needs_verification"} className={field}><option value="needs_verification">Zu verifizieren</option><option value="in_review">In Prüfung</option><option value="approved">Geprüft und freigegeben</option></select></div>
                            </ActionForm>
                            {own && <div className="mt-2"><ActionButton action={deleteRetentionPolicy.bind(null, own.id)} label="Eigene Regel entfernen" tone="ghost" small confirm="Eigene Regel entfernen? Danach gilt die Plattform-Vorgabe." /></div>}
                          </div>
                        </details>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
