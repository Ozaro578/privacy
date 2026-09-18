import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { RegistrationForm } from "@/components/auth/registration-form";

export const metadata = { title: "Digitale Anmeldung" };

/** Öffentliche Anmeldeseite je Fahrschule (per Link/QR verteilt). Liest nur öffentliche Stammdaten. */
export default async function RegistrationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createSupabaseAdminClient();
  const { data: school } = await admin.from("driving_schools").select("id, name, slug, status").eq("slug", slug).maybeSingle();
  if (!school || !["trial", "active"].includes(school.status)) notFound();
  const [{ data: licenses }, { data: locations }] = await Promise.all([
    admin.from("licenses").select("code, name").eq("active", true).order("sort_order"),
    admin.from("locations").select("id, name").eq("tenant_id", school.id).eq("active", true).order("name"),
  ]);
  return (
    <main className="mx-auto max-w-xl p-6">
      <p className="text-sm text-ink-500">Anmeldung bei</p>
      <h1 className="text-2xl font-bold">{school.name}</h1>
      <p className="mb-6 mt-2 text-ink-700">In wenigen Minuten angemeldet. Danach siehst du sofort deine Checkliste, kannst Theorie lernen und Fahrstunden buchen.</p>
      <RegistrationForm slug={school.slug} schoolName={school.name} licenses={licenses ?? []} locations={locations ?? []} />
    </main>
  );
}
