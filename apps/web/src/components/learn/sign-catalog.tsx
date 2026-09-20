"use client";
import { useDeferredValue, useMemo, useState } from "react";
import type { SignCategory, SignEntry } from "@fahrpilot/content/signs";

const CATEGORY_LABEL: Record<SignCategory, string> = { gefahrzeichen: "Gefahrzeichen", vorschriftzeichen: "Vorschriftzeichen", richtzeichen: "Richtzeichen", verkehrseinrichtungen: "Verkehrseinrichtungen", zusatzzeichen: "Zusatzzeichen" };
const ORDER: SignCategory[] = ["gefahrzeichen", "vorschriftzeichen", "richtzeichen", "verkehrseinrichtungen", "zusatzzeichen"];

/** Verkehrszeichenkatalog mit Suche nach Nummer, Name und Bedeutung; Gruppen nach StVO-Anlage. */
export function SignCatalog({ signs }: { signs: readonly SignEntry[] }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<SignCategory | "alle">("alle");
  const [open, setOpen] = useState<string | null>(null);
  const q = useDeferredValue(query.trim().toLowerCase());
  const filtered = useMemo(() => signs.filter((s) => (cat === "alle" || s.category === cat) && (!q || s.number.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.meaning.toLowerCase().includes(q))), [signs, cat, q]);
  const groups = ORDER.map((c) => ({ c, items: filtered.filter((s) => s.category === c) })).filter((g) => g.items.length > 0);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="sign-search">Zeichen suchen</label>
        <input id="sign-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nummer, Name oder Bedeutung, z. B. 205 oder Vorfahrt" className="min-h-11 w-full rounded-xl border border-ink-300 bg-surface px-3 sm:max-w-md" />
        <div className="flex flex-wrap gap-1" role="group" aria-label="Gruppe">
          {(["alle", ...ORDER] as const).map((c) => <button key={c} type="button" onClick={() => setCat(c)} aria-pressed={cat === c} className={`min-h-9 rounded-full border px-3 text-xs ${cat === c ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-300 bg-surface"}`}>{c === "alle" ? `Alle (${signs.length})` : `${CATEGORY_LABEL[c]} (${signs.filter((s) => s.category === c).length})`}</button>)}
        </div>
      </div>
      {groups.length === 0 && <p className="text-sm text-ink-500">Kein Zeichen gefunden.</p>}
      {groups.map((g) => (
        <section key={g.c} aria-labelledby={`cat-${g.c}`}>
          <h2 id={`cat-${g.c}`} className="mb-2 text-base font-semibold">{CATEGORY_LABEL[g.c]} <span className="text-sm font-normal text-ink-500">{g.items.length}</span></h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {g.items.map((s) => {
              const isOpen = open === s.id;
              return (
                <li key={s.id} className={`rounded-card bg-surface p-3 shadow-card ${isOpen ? "col-span-2 sm:col-span-3 lg:col-span-4" : ""}`}>
                  <button type="button" onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen} className={`flex w-full gap-3 text-left ${isOpen ? "items-start" : "flex-col items-center"}`}>
                    <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-ink-100 p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element -- statische SVG-Zeichnung */}
                      <img src={`/media/questions/${s.file}`} alt={s.alt} className="max-h-full max-w-full" loading="lazy" decoding="async" />
                    </span>
                    <span className={isOpen ? "flex-1" : "text-center"}>
                      <span className="block text-xs text-ink-500">Zeichen {s.number}</span>
                      <span className="block font-medium">{s.name}</span>
                      {isOpen && <span className="mt-2 block text-sm text-ink-700">{s.meaning}</span>}
                      {isOpen && s.note && <span className="mt-2 block text-xs text-warn-500">Hinweis zur fachlichen Prüfung: {s.note}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
