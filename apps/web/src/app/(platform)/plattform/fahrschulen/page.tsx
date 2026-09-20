import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, Pill, fmt } from "@/components/ui";
import { TenantForm } from "@/components/platform/tenant-form";
import { startSupportSession } from "@/lib/actions/platform";
import { btn } from "@/components/ui";

export default async function TenantsPage() {
  const db = await createSupabaseServerClient();
  const [{ data: schools }, { data: grants }] = await Promise.all([
    db.from("driving_schools").select("id, name, slug, status, city, created_at").order("created_at", { ascending: false }),
    db.from("support_access_grants").select("tenant_id, reason, expires_at").is("revoked_at", null).gt("expires_at", new Date().toISOString()),
  ]);
  const grantFor = new Map((grants ?? []).map((g) => [g.tenant_id, g]));
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Fahrschulen</h1>
      <Card title="Neue Fahrschule"><TenantForm /></Card>
      <Card title="Alle Fahrschulen">
        <ul className="divide-y divide-ink-100">{(schools ?? []).map((s) => <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><span><span className="font-medium">{s.name}</span> <span className="text-xs text-ink-500">/{s.slug}{s.city ? ` · ${s.city}` : ""} · seit {fmt.date(s.created_at)}</span></span><span className="flex items-center gap-2"><Pill tone={s.status === "active" ? "success" : s.status === "trial" ? "brand" : "neutral"}>{s.status}</Pill>{(() => { const g = grantFor.get(s.id); return g ? <form action={startSupportSession.bind(null, s.id)}><button className={`${btn.secondary} min-h-9 px-3 text-sm`} title={`Freigabe bis ${fmt.date(g.expires_at)} ${fmt.time(g.expires_at)}: ${g.reason}`}>Support-Sitzung starten</button></form> : <span className="text-xs text-ink-500">keine Support-Freigabe</span>; })()}</span></li>)}</ul>
        <p className="mt-3 text-xs text-ink-500">Support-Sitzungen sind nur möglich, wenn die Fahrschule unter Einstellungen einen befristeten Zugriff erteilt hat. Jede Sitzung wird im Änderungsprotokoll der Fahrschule festgehalten.</p>
      </Card>
    </div>
  );
}
