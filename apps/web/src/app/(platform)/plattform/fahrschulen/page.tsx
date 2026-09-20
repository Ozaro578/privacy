import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, Pill, fmt } from "@/components/ui";
import { TenantForm } from "@/components/platform/tenant-form";
import { ActionButton } from "@/components/admin/action-button";
import { ActionForm } from "@/components/admin/action-form";
import { endContentLicense, setContentLicense, startSupportSession } from "@/lib/actions/platform";
import { btn } from "@/components/ui";

const field = "w-full rounded-xl border border-ink-300 px-3 py-2";
const label = "mb-1 block text-sm font-medium";

export default async function TenantsPage() {
  const db = await createSupabaseServerClient();
  const nowIso = new Date().toISOString();
  const today = nowIso.slice(0, 10);
  const [{ data: schools }, { data: grants }, { data: licenses }] = await Promise.all([
    db.from("driving_schools").select("id, name, slug, status, city, created_at").order("created_at", { ascending: false }),
    db.from("support_access_grants").select("tenant_id, reason, expires_at").is("revoked_at", null).gt("expires_at", nowIso),
    db.from("tenant_content_licenses").select("id, tenant_id, license_id, licensor, valid_from, valid_until, seats, contract_reference").order("valid_from", { ascending: false }),
  ]);
  const grantFor = new Map((grants ?? []).map((g) => [g.tenant_id, g]));
  const licensesFor = new Map<string, NonNullable<typeof licenses>>();
  for (const l of licenses ?? []) licensesFor.set(l.tenant_id, [...(licensesFor.get(l.tenant_id) ?? []), l]);
  const isActive = (l: { valid_from: string; valid_until: string | null }) => l.valid_from <= today && (l.valid_until === null || l.valid_until >= today);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Fahrschulen</h1>
      <Card title="Neue Fahrschule"><TenantForm /></Card>
      <Card title="Alle Fahrschulen">
        <ul className="divide-y divide-ink-100">{(schools ?? []).map((s) => {
          const g = grantFor.get(s.id);
          const lics = licensesFor.get(s.id) ?? [];
          const activeLic = lics.filter(isActive);
          return (
            <li key={s.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span><span className="font-medium">{s.name}</span> <span className="text-xs text-ink-500">/{s.slug}{s.city ? ` · ${s.city}` : ""} · seit {fmt.date(s.created_at)}</span></span>
                <span className="flex items-center gap-2">
                  <Pill tone={s.status === "active" ? "success" : s.status === "trial" ? "brand" : "neutral"}>{s.status}</Pill>
                  <Pill tone={activeLic.length > 0 ? "success" : "neutral"}>{activeLic.length > 0 ? `${activeLic.length} Lizenz${activeLic.length > 1 ? "en" : ""}` : "nur Übungsfragen"}</Pill>
                  {g ? <form action={startSupportSession.bind(null, s.id)}><button className={`${btn.secondary} min-h-9 px-3 text-sm`} title={`Freigabe bis ${fmt.date(g.expires_at)} ${fmt.time(g.expires_at)}: ${g.reason}`}>Support-Sitzung starten</button></form> : <span className="text-xs text-ink-500">keine Support-Freigabe</span>}
                </span>
              </div>
              <details className="mt-2 rounded-xl border border-ink-100 p-3 text-sm">
                <summary className="cursor-pointer font-medium">Inhaltslizenzen ({lics.length})</summary>
                {lics.length > 0 && (
                  <ul className="mt-2 divide-y divide-ink-100">
                    {lics.map((l) => (
                      <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                        <span><Pill tone={isActive(l) ? "success" : "neutral"}>{isActive(l) ? "gültig" : l.valid_from > today ? "geplant" : "beendet"}</Pill> <span className="ml-2">{l.licensor}</span><span className="block text-xs text-ink-500">Lizenz {l.license_id}{l.contract_reference ? ` · Vertrag ${l.contract_reference}` : ""} · {fmt.date(l.valid_from)} bis {l.valid_until ? fmt.date(l.valid_until) : "unbefristet"}{l.seats ? ` · bis ${l.seats} Schüler` : ""}</span></span>
                        {(isActive(l) || l.valid_from > today) && <ActionButton action={endContentLicense.bind(null, l.id)} label="Beenden" tone="danger" small confirm={`Lizenz ${l.license_id} für ${s.name} heute beenden? Lizenzierte Fragen sind danach für die Schüler nicht mehr sichtbar.`} />}
                      </li>
                    ))}
                  </ul>
                )}
                <ActionForm action={setContentLicense} submitLabel="Lizenz hinterlegen" className="mt-3 grid gap-2 md:grid-cols-3" resetOnSuccess>
                  <input type="hidden" name="tenant_id" value={s.id} />
                  <div><label htmlFor={`lic-id-${s.id}`} className={label}>Lizenzkennung (wie im Katalogimport)</label><input id={`lic-id-${s.id}`} name="license_id" required className={field} placeholder="z. B. ARGE-2026-B" /></div>
                  <div><label htmlFor={`lic-or-${s.id}`} className={label}>Lizenzgeber</label><input id={`lic-or-${s.id}`} name="licensor" required defaultValue="TÜV | DEKRA arge tp 21" className={field} /></div>
                  <div><label htmlFor={`lic-ref-${s.id}`} className={label}>Vertragsnummer</label><input id={`lic-ref-${s.id}`} name="contract_reference" className={field} /></div>
                  <div><label htmlFor={`lic-from-${s.id}`} className={label}>Gültig ab</label><input id={`lic-from-${s.id}`} name="valid_from" type="date" required defaultValue={today} className={field} /></div>
                  <div><label htmlFor={`lic-until-${s.id}`} className={label}>Gültig bis (leer = unbefristet)</label><input id={`lic-until-${s.id}`} name="valid_until" type="date" className={field} /></div>
                  <div><label htmlFor={`lic-seats-${s.id}`} className={label}>Schülerplätze (leer = unbegrenzt)</label><input id={`lic-seats-${s.id}`} name="seats" type="number" min={1} className={field} /></div>
                </ActionForm>
              </details>
            </li>
          );
        })}</ul>
        <p className="mt-3 text-xs text-ink-500">Support-Sitzungen sind nur möglich, wenn die Fahrschule unter Einstellungen einen befristeten Zugriff erteilt hat. Lizenzierte Fragen (Quelle amtlicher Katalog) werden nur mit gültiger Lizenz und passender Lizenzkennung angezeigt; ohne Lizenz lernen Schüler mit eigenen Übungsfragen.</p>
      </Card>
    </div>
  );
}
