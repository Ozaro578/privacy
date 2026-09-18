import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudentDetail } from "@/lib/data/admin-students";
import { addStudentLicense, createContract, inviteStudentAction, reviewDocument, updateContractStatus, updateStudent, updateStudentLicense, updateStudentNotes } from "@/lib/actions/admin-students";
import { DOC_STATUS_LABEL, EXAM_STATUS_LABEL, INVOICE_STATUS_LABEL, LESSON_KIND_LABEL, LESSON_STATUS_LABEL, LICENSE_STATUS_LABEL, PAYMENT_METHOD_LABEL, TRANSMISSION_LABEL } from "@/lib/data/admin";
import { Alert, Card, Pill, btn, fmt, parseRange } from "@/components/ui";
import { ActionForm, field, label } from "@/components/admin/action-form";
import { ActionButton } from "@/components/admin/action-button";
import { LicenseFields, StudentFields } from "@/components/admin/students/student-fields";
import { ExamPanel } from "@/components/admin/students/exam-panel";
import { DataRequestForm } from "@/components/admin/students/data-request-form";

const DOC_TONE: Record<string, "neutral" | "brand" | "success" | "warn" | "danger"> = { missing: "neutral", uploaded: "warn", verified: "success", rejected: "danger", expired: "danger" };
const CONTRACT_LABEL: Record<string, string> = { draft: "Entwurf", sent: "Versendet", signed: "Unterschrieben", active: "Aktiv", terminated: "Gekündigt", completed: "Erfüllt" };
const CONTRACT_NEXT: Record<string, string[]> = { draft: ["sent", "signed"], sent: ["signed", "draft"], signed: ["active"], active: ["terminated", "completed"], terminated: [], completed: [] };

export default async function StudentDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const d = await getStudentDetail(id);
  if (!d) notFound();
  const s = d.student;
  const nav = [["stammdaten", "Stammdaten"], ["ausbildung", "Ausbildungen"], ["fahrstunden", "Fahrstunden"], ["dokumente", "Dokumente"], ["vertrag", "Vertrag"], ["finanzen", "Finanzen"], ["pruefungen", "Prüfungen"], ["notizen", "Notizen"], ["datenschutz", "Datenschutz"]];
  const openCents = d.invoices.filter((i) => ["issued", "partially_paid", "overdue"].includes(i.status)).reduce((sum, i) => sum + (i.gross_cents - i.paid_cents), 0);
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/verwaltung/schueler" className="text-sm text-brand-700 underline">Zurück zur Liste</Link>
          <h1 className="text-2xl font-semibold">{s.first_name} {s.last_name}</h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-ink-700">
            <Pill tone={s.status === "active" ? "brand" : s.status === "completed" ? "success" : "neutral"}>{LICENSE_STATUS_LABEL[s.status] ?? s.status}</Pill>
            {s.student_number && <span>Nr. {s.student_number}</span>}
            <span>{s.user_id ? "App-Zugang aktiv" : "Kein App-Zugang"}</span>
            {openCents > 0 && <span className="text-danger-500">Offen: {fmt.eur(openCents)}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!s.user_id && s.email && <ActionButton action={inviteStudentAction.bind(null, s.id)} label="Zur App einladen" />}
          <Link href={`/verwaltung/finanzen/rechnungen/neu?student=${s.id}`} className={btn.secondary}>Rechnung erstellen</Link>
          <a href={`/verwaltung/schueler/${s.id}/export`} className={btn.ghost}>JSON-Export</a>
        </div>
      </header>
      {sp["hinweis"] && <Alert tone="success">{sp["hinweis"]}</Alert>}
      <nav aria-label="Abschnitte" className="flex flex-wrap gap-2 text-sm">{nav.map(([a, l]) => <a key={a} href={`#${a}`} className="rounded-full border border-ink-300 px-3 py-1 hover:border-brand-500">{l}</a>)}</nav>

      <Card title="Stammdaten" className="scroll-mt-4" >
        <div id="stammdaten" />
        <ActionForm action={updateStudent} submitLabel="Stammdaten speichern" className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="id" value={s.id} />
          <input type="hidden" name="row_version" value={s.row_version} />
          <StudentFields v={s} locations={d.options.locations} />
          <p className="text-xs text-ink-500 md:col-span-2">Version {s.row_version}, zuletzt geändert {fmt.date(s.updated_at)} {fmt.time(s.updated_at)}. Gleichzeitige Änderungen werden erkannt und als Konflikt gemeldet.</p>
        </ActionForm>
      </Card>

      <Card title="Ausbildungen">
        <div id="ausbildung" />
        <div className="space-y-4">
          {d.licenses.map((l) => (
            <div key={l.id} className="rounded-xl border border-ink-100 p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">Klasse {l.license_code}</h3>
                <Pill tone={l.status === "active" ? "brand" : l.status === "completed" ? "success" : "neutral"}>{LICENSE_STATUS_LABEL[l.status] ?? l.status}</Pill>
                <span className="text-sm text-ink-700">{l.acquisition_kind === "first" ? "Ersterwerb" : "Erweiterung"}, seit {fmt.date(l.started_at)}</span>
                {l.accompanied_driving && <Pill tone="brand">BF17</Pill>}
                <span className="text-sm text-ink-500">Theorie: {EXAM_STATUS_LABEL[l.theory_exam_status]}, Praxis: {EXAM_STATUS_LABEL[l.practical_exam_status]}</span>
              </div>
              <ActionForm action={updateStudentLicense} submitLabel="Ausbildung speichern" className="grid gap-3 md:grid-cols-4">
                <input type="hidden" name="id" value={l.id} />
                <input type="hidden" name="student_id" value={s.id} />
                <input type="hidden" name="row_version" value={l.row_version} />
                <div><label htmlFor={`tr-${l.id}`} className={label}>Getriebe</label><select id={`tr-${l.id}`} name="transmission" defaultValue={l.transmission} className={field}><option value="manual">Schaltung</option><option value="automatic">Automatik</option></select></div>
                <div><label htmlFor={`in-${l.id}`} className={label}>Fahrlehrer</label><select id={`in-${l.id}`} name="primary_instructor_id" defaultValue={l.primary_instructor_id ?? ""} className={field}><option value="">Nicht zugewiesen</option>{d.options.instructors.map((i) => <option key={i.id} value={i.id}>{i.display_name}</option>)}</select></div>
                <div><label htmlFor={`st-${l.id}`} className={label}>Status</label><select id={`st-${l.id}`} name="status" defaultValue={l.status} className={field}><option value="active">Aktiv</option><option value="paused">Pausiert</option><option value="completed">Abgeschlossen</option><option value="cancelled">Abgebrochen</option></select></div>
                <div className="flex items-end"><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="accompanied_driving" defaultChecked={l.accompanied_driving} className="h-5 w-5" /> BF17</label></div>
              </ActionForm>
            </div>
          ))}
          <details className="rounded-xl border border-dashed border-ink-300 p-4">
            <summary className="cursor-pointer font-medium text-brand-700">Weitere Ausbildung anlegen</summary>
            <ActionForm action={addStudentLicense} submitLabel="Ausbildung anlegen" className="mt-3 grid gap-3 md:grid-cols-2">
              <input type="hidden" name="student_id" value={s.id} />
              <LicenseFields licenses={d.options.licenses} instructors={d.options.instructors} prefix="new-" />
            </ActionForm>
          </details>
        </div>
      </Card>

      <Card title="Fahrstunden und Theorieunterricht" action={<Link href={`/verwaltung/kalender?student=${s.id}`} className="text-sm text-brand-700 underline">Stunde buchen</Link>}>
        <div id="fahrstunden" />
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Fahrstunden ({d.lessons.length})</h3>
            {d.lessons.length === 0 ? <p className="text-sm text-ink-700">Noch keine Fahrstunden.</p> : (
              <ul className="max-h-80 divide-y divide-ink-100 overflow-y-auto text-sm">
                {d.lessons.map((l) => { const r = parseRange(l.period); return <li key={l.id} className="flex flex-wrap justify-between gap-2 py-1.5"><span>{fmt.date(r.start)} {fmt.time(r.start)}</span><span>{LESSON_KIND_LABEL[l.kind] ?? l.kind} ({l.units} E)</span><span className="text-ink-500">{l.instructors?.display_name}</span><span>{LESSON_STATUS_LABEL[l.status]}</span></li>; })}
              </ul>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Theorieunterricht ({d.attendance.filter((a) => a.status === "present").length} besucht)</h3>
            {d.attendance.length === 0 ? <p className="text-sm text-ink-700">Noch keine Anwesenheiten.</p> : (
              <ul className="max-h-80 divide-y divide-ink-100 overflow-y-auto text-sm">
                {d.attendance.map((a) => <li key={a.id} className="flex flex-wrap justify-between gap-2 py-1.5"><span>{a.theory_classes ? fmt.date(parseRange(a.theory_classes.period).start) : ""}</span><span>{a.theory_classes?.lesson_unit_code} {a.theory_classes?.title}</span><span>{a.status === "present" ? "Anwesend" : a.status === "registered" ? "Angemeldet" : a.status === "excused" ? "Entschuldigt" : "Abwesend"}</span></li>)}
              </ul>
            )}
          </div>
        </div>
      </Card>

      <Card title="Dokumente">
        <div id="dokumente" />
        {d.documents.length === 0 ? <p className="text-sm text-ink-700">Keine Dokumente in der Checkliste.</p> : (
          <ul className="divide-y divide-ink-100">
            {d.documents.map((doc) => (
              <li key={doc.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{doc.title}</span>
                  <Pill tone={DOC_TONE[doc.status] ?? "neutral"}>{DOC_STATUS_LABEL[doc.status] ?? doc.status}</Pill>
                  {doc.storage_path && <a href={`/api/files?path=${encodeURIComponent(doc.storage_path)}`} target="_blank" rel="noreferrer" className="text-sm text-brand-700 underline">Datei öffnen</a>}
                  {doc.expires_at && <span className="text-xs text-ink-500">gültig bis {fmt.date(doc.expires_at)}</span>}
                  {doc.rejection_reason && <span className="text-xs text-danger-500">Grund: {doc.rejection_reason}</span>}
                </div>
                {(doc.status === "uploaded" || doc.status === "verified" || doc.status === "rejected") && (
                  <div className="mt-2 grid gap-3 md:grid-cols-2">
                    {doc.status !== "verified" && (
                      <ActionForm action={reviewDocument} submitLabel="Freigeben" tone="primary" className="grid gap-2 md:grid-cols-2">
                        <input type="hidden" name="id" value={doc.id} />
                        <input type="hidden" name="decision" value="verified" />
                        <div className="md:col-span-2"><label htmlFor={`ex-${doc.id}`} className={label}>Gültig bis (optional)</label><input id={`ex-${doc.id}`} name="expires_at" type="date" className={field} /></div>
                      </ActionForm>
                    )}
                    {doc.status !== "rejected" && (
                      <ActionForm action={reviewDocument} submitLabel="Ablehnen" tone="danger" className="grid gap-2 md:grid-cols-2">
                        <input type="hidden" name="id" value={doc.id} />
                        <input type="hidden" name="decision" value="rejected" />
                        <div className="md:col-span-2"><label htmlFor={`rj-${doc.id}`} className={label}>Ablehnungsgrund</label><input id={`rj-${doc.id}`} name="reason" required className={field} /></div>
                      </ActionForm>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Vertrag">
        <div id="vertrag" />
        {d.contracts.length > 0 && (
          <ul className="mb-4 divide-y divide-ink-100">
            {d.contracts.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                <span className="font-medium">{c.contract_number ?? "Ohne Nummer"}</span>
                <Pill tone={c.status === "active" ? "brand" : c.status === "completed" ? "success" : "neutral"}>{CONTRACT_LABEL[c.status] ?? c.status}</Pill>
                <span className="text-ink-700">Preisliste: {c.price_lists?.name ?? "keine"}</span>
                <span className="text-ink-700">Stornoregel: {c.cancellation_policies?.name ?? "keine"}</span>
                {c.signed_at && <span className="text-ink-500">unterschrieben {fmt.date(c.signed_at)}</span>}
                {c.document_path && <a href={`/api/files?path=${encodeURIComponent(c.document_path)}`} className="text-brand-700 underline">Dokument</a>}
                <span className="ml-auto flex gap-1">{(CONTRACT_NEXT[c.status] ?? []).map((n) => <ActionButton key={n} action={updateContractStatus.bind(null, c.id, s.id, n)} label={CONTRACT_LABEL[n] ?? n} small tone="ghost" />)}</span>
              </li>
            ))}
          </ul>
        )}
        <details open={d.contracts.length === 0}>
          <summary className="cursor-pointer font-medium text-brand-700">Vertrag anlegen</summary>
          <ActionForm action={createContract} submitLabel="Vertrag anlegen" className="mt-3 grid gap-3 md:grid-cols-3">
            <input type="hidden" name="student_id" value={s.id} />
            <div><label htmlFor="c-license" className={label}>Ausbildung</label><select id="c-license" name="student_license_id" className={field}><option value="">Keine Zuordnung</option>{d.licenses.map((l) => <option key={l.id} value={l.id}>Klasse {l.license_code}</option>)}</select></div>
            <div><label htmlFor="c-price" className={label}>Preisliste</label><select id="c-price" name="price_list_id" className={field}><option value="">Keine</option>{d.priceLists.map((p) => <option key={p.id} value={p.id}>{p.name}{p.license_code ? ` (${p.license_code})` : ""}</option>)}</select></div>
            <div><label htmlFor="c-policy" className={label}>Stornierungsregel</label><select id="c-policy" name="cancellation_policy_id" className={field}><option value="">Keine</option>{d.policies.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label htmlFor="c-number" className={label}>Vertragsnummer</label><input id="c-number" name="contract_number" className={field} /></div>
            <div><label htmlFor="c-status" className={label}>Status</label><select id="c-status" name="status" className={field}>{Object.entries(CONTRACT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div><label htmlFor="c-signed" className={label}>Unterschrieben am</label><input id="c-signed" name="signed_at" type="date" className={field} /></div>
            <div><label htmlFor="c-method" className={label}>Signaturart</label><select id="c-method" name="signature_method" className={field}><option value="">Nicht angegeben</option><option value="on_paper">Auf Papier</option><option value="simple_electronic">Einfache elektronische Signatur</option><option value="advanced_electronic">Fortgeschrittene elektronische Signatur</option><option value="qualified_electronic">Qualifizierte elektronische Signatur</option></select></div>
            <div><label htmlFor="c-terms" className={label}>AGB-Version</label><input id="c-terms" name="terms_version" className={field} /></div>
          </ActionForm>
        </details>
      </Card>

      <Card title="Finanzen" action={<Link href={`/verwaltung/finanzen/rechnungen/neu?student=${s.id}`} className="text-sm text-brand-700 underline">Rechnung erstellen</Link>}>
        <div id="finanzen" />
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Rechnungen</h3>
            {d.invoices.length === 0 ? <p className="text-sm text-ink-700">Keine Rechnungen.</p> : (
              <ul className="divide-y divide-ink-100 text-sm">
                {d.invoices.map((i) => <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5"><Link href={`/verwaltung/finanzen/rechnungen/${i.id}`} className="text-brand-700 underline">{i.invoice_number ?? "Entwurf"}</Link><span>{i.issued_at ? fmt.date(i.issued_at) : ""}</span><Pill tone={i.status === "paid" ? "success" : i.status === "overdue" ? "danger" : "neutral"}>{INVOICE_STATUS_LABEL[i.status]}</Pill><span className="tabular-nums">{fmt.eur(i.gross_cents)}</span></li>)}
              </ul>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Zahlungen</h3>
            {d.payments.length === 0 ? <p className="text-sm text-ink-700">Keine Zahlungen.</p> : (
              <ul className="divide-y divide-ink-100 text-sm">
                {d.payments.map((p) => <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5"><span>{p.paid_at ? fmt.date(p.paid_at) : "ausstehend"}</span><span>{PAYMENT_METHOD_LABEL[p.method] ?? p.method}</span><span className="text-ink-500">{p.invoices?.invoice_number ?? "ohne Rechnung"}</span><span className={`tabular-nums ${p.amount_cents < 0 ? "text-danger-500" : ""}`}>{fmt.eur(p.amount_cents)}</span></li>)}
              </ul>
            )}
            {d.mandates.length > 0 && <p className="mt-2 text-xs text-ink-500">SEPA-Mandat: {d.mandates[0]?.status}{d.mandates[0]?.masked_iban ? ` (${d.mandates[0].masked_iban})` : ""}</p>}
          </div>
        </div>
      </Card>

      <Card title="Prüfungen">
        <div id="pruefungen" />
        <div className="space-y-4">
          {d.licenses.map((l) => {
            const rules = d.rulesByLicense.get(l.id);
            return (
              <div key={l.id}>
                <h3 className="mb-2 font-semibold">Klasse {l.license_code}{rules?.legalBasisDate ? <span className="ml-2 text-xs font-normal text-ink-500">Rechtsstand {fmt.date(rules.legalBasisDate)}</span> : null}</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <ExamPanel kind="theory" licenseId={l.id} licenseStatus={l.theory_exam_status} exams={d.theoryExams.filter((e) => e.student_license_id === l.id)} instructors={d.options.instructors} vehicles={d.vehicles.filter((v) => v.transmission === l.transmission)} languages={rules?.examTheory?.rules.exam_languages} retryWaitDays={rules?.examPractical?.rules.retry_wait_days} />
                  <ExamPanel kind="practical" licenseId={l.id} licenseStatus={l.practical_exam_status} exams={d.practicalExams.filter((e) => e.student_license_id === l.id)} instructors={d.options.instructors} vehicles={d.vehicles.filter((v) => v.transmission === l.transmission)} languages={undefined} retryWaitDays={rules?.examPractical?.rules.retry_wait_days} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Interne Notizen">
        <div id="notizen" />
        <ActionForm action={updateStudentNotes} submitLabel="Notizen speichern">
          <input type="hidden" name="id" value={s.id} />
          <textarea name="notes_internal" rows={5} defaultValue={s.notes_internal ?? ""} aria-label="Interne Notizen" className={field} />
          <p className="text-xs text-ink-500">Nur für Mitarbeitende sichtbar, nicht im Export enthalten.</p>
        </ActionForm>
      </Card>

      <Card title="Datenschutz">
        <div id="datenschutz" />
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Anfragen</h3>
            {d.dataRequests.length === 0 ? <p className="text-sm text-ink-700">Keine Anfragen.</p> : (
              <ul className="space-y-3">
                {d.dataRequests.map((r) => (
                  <li key={r.id} className="rounded-xl border border-ink-100 p-3">
                    <p className="text-sm font-medium">{r.kind === "export" ? "Datenexport" : r.kind === "deletion" ? "Löschung" : "Berichtigung"} vom {fmt.date(r.created_at)}, Status {r.status}</p>
                    <DataRequestForm request={{ id: r.id, status: r.status, student_id: s.id, kind: r.kind, reason: r.reason, legal_hold_until: r.legal_hold_until }} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Einwilligungen</h3>
            {d.consents.length === 0 ? <p className="text-sm text-ink-700">Keine Einwilligungen erfasst.</p> : (
              <ul className="divide-y divide-ink-100 text-sm">{d.consents.map((c, i) => <li key={i} className="flex justify-between gap-2 py-1.5"><span>{c.consent_type} (v{c.text_version})</span><span>{c.revoked_at ? `widerrufen ${fmt.date(c.revoked_at)}` : c.granted ? `erteilt ${fmt.date(c.granted_at)}` : "abgelehnt"}</span></li>)}</ul>
            )}
            <p className="mt-3 text-sm"><a href={`/verwaltung/schueler/${s.id}/export`} className="text-brand-700 underline">Vollständigen Datenexport (JSON) herunterladen</a></p>
            <p className="text-xs text-ink-500">Ausbildungsstand: {d.licenses.map((l) => `${l.license_code}: ${TRANSMISSION_LABEL[l.transmission]}`).join(", ")}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
