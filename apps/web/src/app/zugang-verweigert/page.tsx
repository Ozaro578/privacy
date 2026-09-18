import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";

export default function Forbidden() {
  return (
    <main className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-2xl font-semibold">Kein Zugriff</h1>
      <p className="mt-3 text-ink-700">Dein Konto hat für diesen Bereich keine Berechtigung, oder es ist noch keiner Fahrschule zugeordnet.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="rounded-full bg-brand-500 px-5 py-2 text-white">Zur Startseite</Link>
        <form action={logoutAction}><button className="rounded-full border border-ink-300 px-5 py-2">Abmelden</button></form>
      </div>
    </main>
  );
}
