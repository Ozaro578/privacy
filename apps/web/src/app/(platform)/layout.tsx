import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { logoutAction } from "@/lib/actions/auth";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();
  const nav = [["/plattform", "Übersicht"], ["/plattform/regeln", "Regelversionen"], ["/plattform/inhalte", "Inhalte und Freigaben"], ["/plattform/fahrschulen", "Fahrschulen"]];
  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col md:flex-row">
      <nav aria-label="Plattform" className="flex flex-wrap gap-2 border-b border-ink-100 p-4 md:w-56 md:flex-col md:border-b-0 md:border-r">
        <p className="w-full text-lg font-bold text-brand-700">FahrPilot Plattform</p>
        {nav.map(([href, label]) => <Link key={href} href={href} className="rounded-xl px-3 py-2 text-ink-700 hover:bg-ink-100">{label}</Link>)}
        <form action={logoutAction} className="md:mt-auto"><button className="text-sm underline">Abmelden</button></form>
      </nav>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
