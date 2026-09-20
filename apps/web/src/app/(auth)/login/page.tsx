import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Anmelden" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; registriert?: string; fehler?: string }> }) {
  const session = await getSession();
  if (session) redirect(homeFor(session));
  const params = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center p-6">
      <h1 className="text-2xl font-bold text-brand-700">FahrPilot</h1>
      <p className="mb-6 text-ink-700">Lernen, Fahren, Prüfung. Alles in einer App.</p>
      {params.registriert && <p className="mb-4 rounded-xl bg-success-100 p-3 text-sm">Dein Konto wurde angelegt. Bitte melde dich an.</p>}
      {params.fehler && <p className="mb-4 rounded-xl bg-danger-100 p-3 text-sm">Der Anmeldelink ist ungültig oder abgelaufen.</p>}
      <LoginForm {...(params.next ? { next: params.next } : {})} />
      <p className="mt-8 text-center text-xs text-ink-500">Neu hier? Deine Fahrschule schickt dir einen Anmeldelink.</p>
      <p className="mt-2 text-center text-sm"><a href="/registrieren" className="text-brand-700 underline">Ohne Fahrschule lernen: Konto erstellen</a></p>
    </main>
  );
}
