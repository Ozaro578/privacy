import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, Pill, fmt } from "@/components/ui";
import { TenantForm } from "@/components/platform/tenant-form";

export default async function TenantsPage() {
  const db = await createSupabaseServerClient();
  const { data: schools } = await db.from("driving_schools").select("id, name, slug, status, city, created_at").order("created_at", { ascending: false });
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Fahrschulen</h1>
      <Card title="Neue Fahrschule"><TenantForm /></Card>
      <Card title="Alle Fahrschulen">
        <ul className="divide-y divide-ink-100">{(schools ?? []).map((s) => <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><span><span className="font-medium">{s.name}</span> <span className="text-xs text-ink-500">/{s.slug}{s.city ? ` · ${s.city}` : ""} · seit {fmt.date(s.created_at)}</span></span><Pill tone={s.status === "active" ? "success" : s.status === "trial" ? "brand" : "neutral"}>{s.status}</Pill></li>)}</ul>
      </Card>
    </div>
  );
}
