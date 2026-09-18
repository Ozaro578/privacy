import Link from "next/link";
import { listTeam } from "@/lib/data/admin-team";
import { inviteTeamMember } from "@/lib/actions/admin-team";
import { MEMBERSHIP_STATUS_LABEL, ROLE_LABEL } from "@/lib/data/admin";
import { Card, EmptyState, Pill } from "@/components/ui";
import { ActionForm, field, label } from "@/components/admin/action-form";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const d = await listTeam();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Team</h1>
        <p className="text-sm text-ink-700">{d.members.length} Mitarbeitende. {d.ctx.isAdmin ? "Einladen und Rollen setzen ist für Admin und Inhaber möglich." : "Rollen und Einladungen verwaltet der Admin."}</p>
      </header>
      {d.members.length === 0 ? <EmptyState title="Noch keine Mitarbeitenden" text="Lade Fahrlehrer und Büro-Mitarbeitende per E-Mail ein." /> : (
        <div className="overflow-x-auto rounded-card bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink-500"><tr><th className="p-3">Name</th><th className="p-3">Rolle</th><th className="p-3">Status</th><th className="p-3">Fahrlehrerprofil</th><th className="p-3">Standort</th></tr></thead>
            <tbody className="divide-y divide-ink-100">
              {d.members.map((m) => {
                const ins = d.instructorsByUser.get(m.user_id);
                return (
                  <tr key={m.id} className="hover:bg-ink-50">
                    <td className="p-3"><Link href={`/verwaltung/team/${m.id}`} className="font-medium text-brand-700 hover:underline">{m.users ? `${m.users.first_name} ${m.users.last_name}`.trim() || m.users.email : "Unbekannt"}</Link><p className="text-xs text-ink-500">{m.users?.email}</p></td>
                    <td className="p-3">{ROLE_LABEL[m.role] ?? m.role}</td>
                    <td className="p-3"><Pill tone={m.status === "active" ? "success" : m.status === "invited" ? "warn" : "danger"}>{MEMBERSHIP_STATUS_LABEL[m.status] ?? m.status}</Pill></td>
                    <td className="p-3">{ins ? <span className="flex items-center gap-2">{ins.color && <span aria-hidden className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: ins.color }} />}{ins.display_name}: {ins.license_classes.length ? ins.license_classes.join(", ") : "keine Klassen"}{ins.teaches_theory ? ", Theorie" : ""}{ins.teaches_manual ? ", Schaltung" : ""}{ins.teaches_automatic ? ", Automatik" : ""}</span> : <span className="text-ink-500">kein Fahrlehrer</span>}</td>
                    <td className="p-3">{ins?.locations?.name ?? ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {d.ctx.isAdmin && (
        <Card title="Mitarbeitende einladen">
          <ActionForm action={inviteTeamMember} submitLabel="Einladung senden" pendingLabel="Sende …" className="grid gap-3 md:grid-cols-2" resetOnSuccess>
            <div><label htmlFor="email" className={label}>E-Mail</label><input id="email" name="email" type="email" required className={field} /></div>
            <div><label htmlFor="role" className={label}>Rolle</label><select id="role" name="role" className={field}><option value="instructor">Fahrlehrer</option><option value="office">Büro</option><option value="admin">Admin</option>{d.ctx.role === "owner" && <option value="owner">Inhaber</option>}</select></div>
            <div><label htmlFor="first_name" className={label}>Vorname</label><input id="first_name" name="first_name" className={field} /></div>
            <div><label htmlFor="last_name" className={label}>Nachname</label><input id="last_name" name="last_name" className={field} /></div>
            <div className="md:col-span-2"><label htmlFor="display_name" className={label}>Anzeigename (Fahrlehrer, optional)</label><input id="display_name" name="display_name" className={field} /></div>
          </ActionForm>
        </Card>
      )}
    </div>
  );
}
