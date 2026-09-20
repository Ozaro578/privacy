import { requireSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { switchTenantAction, logoutAction } from "@/lib/actions/auth";

/** Nutzer ohne aktiven Tenant: Mitgliedschaften auswählen oder Hinweis. */
export default async function Onboarding() {
  const session = await requireSession();
  const db = await createSupabaseServerClient();
  const { data: memberships } = await db.from("tenant_memberships").select("tenant_id, role, status, driving_schools(name)").eq("user_id", session.userId);
  const active = (memberships ?? []).filter((m) => m.status === "active");
  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-semibold">Willkommen bei FahrPilot</h1>
      {active.length === 0 ? (
        <p className="mt-3 text-ink-700">Dein Konto ist noch keiner Fahrschule zugeordnet. Bitte nutze den Anmeldelink deiner Fahrschule oder warte auf die Freischaltung durch das Büro.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {active.map((m) => (
            <li key={m.tenant_id}>
              <form action={switchTenantAction.bind(null, m.tenant_id)}>
                <button className="w-full rounded-card border border-ink-300 bg-surface p-4 text-left hover:border-brand-500">
                  <span className="font-medium">{(m.driving_schools as unknown as { name: string } | null)?.name}</span>
                  <span className="ml-2 text-sm text-ink-500">{m.role}</span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form action={logoutAction} className="mt-8"><button className="text-sm text-ink-500 underline">Abmelden</button></form>
    </main>
  );
}
