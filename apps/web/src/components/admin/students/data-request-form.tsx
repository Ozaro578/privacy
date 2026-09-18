import { updateDataRequest } from "@/lib/actions/admin-students";
import { ActionForm, field, label } from "@/components/admin/action-form";

export function DataRequestForm({ request }: { request: { id: string; status: string; student_id: string | null; kind: string; reason: string | null; legal_hold_until: string | null } }) {
  return (
    <ActionForm action={updateDataRequest} submitLabel="Anfrage aktualisieren" className="grid gap-3 md:grid-cols-2">
      <input type="hidden" name="id" value={request.id} />
      {request.student_id && <input type="hidden" name="student_id" value={request.student_id} />}
      <div><label htmlFor={`st-${request.id}`} className={label}>Status</label><select id={`st-${request.id}`} name="status" defaultValue={request.status} className={field}><option value="open">Offen</option><option value="in_progress">In Bearbeitung</option><option value="completed">Erledigt</option><option value="rejected">Abgelehnt</option></select></div>
      {request.kind === "deletion" && <div><label htmlFor={`lh-${request.id}`} className={label}>Aufbewahrungspflicht bis</label><input id={`lh-${request.id}`} name="legal_hold_until" type="date" defaultValue={request.legal_hold_until ?? ""} className={field} /></div>}
      <div className="md:col-span-2"><label htmlFor={`rs-${request.id}`} className={label}>Begründung oder Hinweis</label><input id={`rs-${request.id}`} name="reason" defaultValue={request.reason ?? ""} className={field} /></div>
    </ActionForm>
  );
}
