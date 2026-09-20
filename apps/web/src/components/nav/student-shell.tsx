import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/lib/actions/auth";

const TABS = [
  { href: "/heute", label: "Heute", icon: "◎" },
  { href: "/lernen", label: "Lernen", icon: "▤" },
  { href: "/fahren", label: "Fahren", icon: "⌖" },
  { href: "/finanzen", label: "Finanzen", icon: "€" },
  { href: "/profil", label: "Profil", icon: "●" },
];

export function StudentShell({ children, schoolName, legalBasisDate, current }: { children: ReactNode; schoolName: string; legalBasisDate: string | null; current: string }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col md:flex-row">
      <nav aria-label="Hauptnavigation" className="hidden w-56 shrink-0 flex-col border-r border-ink-100 p-4 md:flex">
        <Link href="/heute" className="mb-6 text-lg font-bold text-brand-700">FahrPilot</Link>
        <p className="mb-4 text-xs text-ink-500">{schoolName}</p>
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} aria-current={current.startsWith(t.href) ? "page" : undefined} className={`mb-1 rounded-xl px-3 py-2 ${current.startsWith(t.href) ? "bg-brand-50 font-semibold text-brand-700" : "text-ink-700 hover:bg-ink-100"}`}>
            {t.label}
          </Link>
        ))}
        <Link href="/theorie" className={`mb-1 rounded-xl px-3 py-2 ${current.startsWith("/theorie") ? "bg-brand-50 font-semibold text-brand-700" : "text-ink-700 hover:bg-ink-100"}`}>Theorieunterricht</Link>
        <Link href="/praxis" className={`mb-1 rounded-xl px-3 py-2 ${current.startsWith("/praxis") ? "bg-brand-50 font-semibold text-brand-700" : "text-ink-700 hover:bg-ink-100"}`}>Praktische Prüfung</Link>
        <div className="mt-auto pt-6 text-xs text-ink-500">
          {legalBasisDate && <p>Rechtsstand: {new Date(legalBasisDate).toLocaleDateString("de-DE")}</p>}
          <form action={logoutAction}><button className="mt-2 underline">Abmelden</button></form>
        </div>
      </nav>
      <main className="flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-8">{children}</main>
      <nav aria-label="Hauptnavigation" className="fixed inset-x-0 bottom-0 z-20 flex border-t border-ink-100 bg-surface/95 backdrop-blur md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} aria-current={current.startsWith(t.href) ? "page" : undefined} className={`flex min-h-14 flex-1 flex-col items-center justify-center text-xs ${current.startsWith(t.href) ? "font-semibold text-brand-700" : "text-ink-500"}`}>
            <span aria-hidden className="text-lg leading-none">{t.icon}</span>
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
