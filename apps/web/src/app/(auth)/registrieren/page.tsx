import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth/session";
import { SelfStudyForm } from "@/components/auth/self-study-form";

export const metadata = { title: "Konto erstellen" };

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect(homeFor(session));
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold text-brand-700">FahrPilot</h1>
      <p className="mb-1 text-lg font-semibold">Theorie lernen ohne Fahrschule</p>
      <p className="mb-6 text-sm text-ink-700">Übungsfragen mit Bildern, Stufen-Modus, Prüfungssimulation und alle Verkehrszeichen. Wenn du später eine Fahrschule hast, verbindest du dein Konto und nimmst deinen Lernstand mit.</p>
      <SelfStudyForm />
      <p className="mt-6 text-center text-sm">Schon ein Konto? <Link href="/login" className="text-brand-700 underline">Anmelden</Link></p>
      <p className="mt-6 text-xs text-ink-500">Übungsfragen sind eigene Formulierungen (kein amtlicher Prüfungsinhalt). Rechtsstand 1.9.2026.</p>
    </main>
  );
}
