import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/lib/actions/auth";

const NAV: Array<{ href: string; label: string; adminOnly?: boolean }> = [
  { href: "/verwaltung", label: "Übersicht" },
  { href: "/verwaltung/schueler", label: "Schüler" },
  { href: "/verwaltung/team", label: "Team" },
  { href: "/verwaltung/fahrzeuge", label: "Fahrzeuge" },
  { href: "/verwaltung/kalender", label: "Kalender" },
  { href: "/verwaltung/theorie", label: "Theorieunterricht" },
  { href: "/verwaltung/pruefungen", label: "Prüfungen" },
  { href: "/verwaltung/finanzen", label: "Finanzen" },
  { href: "/verwaltung/dokumente", label: "Dokumente" },
  { href: "/verwaltung/einstellungen", label: "Einstellungen", adminOnly: true },
  { href: "/verwaltung/analytics", label: "Analytics", adminOnly: true },
];

function isCurrent(current: string, href: string): boolean {
  return href === "/verwaltung" ? current === "/verwaltung" : current.startsWith(href);
}

export function AdminShell({ children, schoolName, roleLabel, isAdmin, current }: { children: ReactNode; schoolName: string; roleLabel: string; isAdmin: boolean; current: string }) {
  const items = NAV.filter((n) => !n.adminOnly || isAdmin);
  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl flex-col md:flex-row">
      <nav aria-label="Verwaltung" className="border-b border-ink-100 p-4 md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <Link href="/verwaltung" className="text-lg font-bold text-brand-700">FahrPilot</Link>
        <p className="mb-1 text-xs text-ink-500">{schoolName}</p>
        <p className="mb-4 text-xs text-ink-500">Rolle: {roleLabel}</p>
        <ul className="flex flex-wrap gap-1 md:flex-col">
          {items.map((n) => (
            <li key={n.href}>
              <Link href={n.href} aria-current={isCurrent(current, n.href) ? "page" : undefined} className={`block min-h-11 rounded-xl px-3 py-2 ${isCurrent(current, n.href) ? "bg-brand-50 font-semibold text-brand-700" : "text-ink-700 hover:bg-ink-100"}`}>
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
        <form action={logoutAction} className="mt-6"><button className="text-sm underline">Abmelden</button></form>
      </nav>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
