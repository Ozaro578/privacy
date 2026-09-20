import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/lib/actions/auth";

const TABS = [
  { href: "/lehrer", label: "Heute", icon: "◎", exact: true },
  { href: "/lehrer/schueler", label: "Schüler", icon: "●", exact: false },
  { href: "/lehrer/kalender", label: "Kalender", icon: "▦", exact: false },
  { href: "/lehrer/unterricht", label: "Unterricht", icon: "▤", exact: false },
  { href: "/lehrer/nachrichten", label: "Nachrichten", icon: "✉", exact: false },
];

function isActive(current: string, tab: { href: string; exact: boolean }): boolean {
  if (tab.exact) return current === tab.href || current.startsWith("/lehrer/dokumentation") || current.startsWith("/lehrer/mock");
  return current.startsWith(tab.href);
}

export function InstructorShell({ children, schoolName, instructorName, current }: { children: ReactNode; schoolName: string; instructorName: string; current: string }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col md:flex-row">
      <nav aria-label="Hauptnavigation" className="hidden w-56 shrink-0 flex-col border-r border-ink-100 p-4 md:flex">
        <Link href="/lehrer" className="mb-1 text-lg font-bold text-brand-700">FahrPilot</Link>
        <p className="text-xs text-ink-500">{schoolName}</p>
        <p className="mb-6 text-sm font-medium text-ink-700">{instructorName}</p>
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} aria-current={isActive(current, t) ? "page" : undefined} className={`mb-1 rounded-xl px-3 py-2 ${isActive(current, t) ? "bg-brand-50 font-semibold text-brand-700" : "text-ink-700 hover:bg-ink-100"}`}>
            {t.label}
          </Link>
        ))}
        <div className="mt-auto pt-6 text-xs text-ink-500">
          <form action={logoutAction}><button className="underline">Abmelden</button></form>
        </div>
      </nav>
      <main className="flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-8">{children}</main>
      <nav aria-label="Hauptnavigation" className="fixed inset-x-0 bottom-0 z-20 flex border-t border-ink-100 bg-surface/95 backdrop-blur md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} aria-current={isActive(current, t) ? "page" : undefined} className={`flex min-h-14 flex-1 flex-col items-center justify-center text-xs ${isActive(current, t) ? "font-semibold text-brand-700" : "text-ink-500"}`}>
            <span aria-hidden className="text-lg leading-none">{t.icon}</span>
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
