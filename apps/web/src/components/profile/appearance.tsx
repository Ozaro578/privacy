"use client";
import { useState, useTransition } from "react";
import { PALETTES, PALETTE_IDS, type Appearance, type PaletteId } from "@fahrpilot/ui/palettes";
import { saveAppearance } from "@/lib/actions/profile";

function apply(a: Appearance) {
  const root = document.documentElement;
  root.setAttribute("data-palette", a.palette);
  if (a.theme === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", a.theme);
  if (a.fontSize === "md") root.removeAttribute("data-fontsize"); else root.setAttribute("data-fontsize", a.fontSize);
  if (a.motion === "reduced") root.setAttribute("data-motion", "reduced"); else root.removeAttribute("data-motion");
}

const chip = (active: boolean) => `min-h-10 rounded-full border px-3 text-sm ${active ? "border-brand-500 bg-brand-50 font-medium text-brand-700" : "border-ink-300 bg-surface"}`;

/** Farbwelt, Hell/Dunkel, Schriftgröße, Bewegung und Ton. Änderungen wirken sofort und werden für alle Geräte gespeichert. */
export function AppearanceSettings({ initial }: { initial: Appearance }) {
  const [a, setA] = useState<Appearance>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const update = (patch: Partial<Appearance>) => {
    const next = { ...a, ...patch };
    setA(next);
    apply(next);
    start(async () => { const r = await saveAppearance(next); setMsg(r.ok ? "Gespeichert" : r.message); });
  };
  return (
    <div className="space-y-4 text-sm">
      <fieldset>
        <legend className="mb-2 font-medium">Farbwelt</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {PALETTE_IDS.map((id: PaletteId) => {
            const p = PALETTES[id];
            const active = a.palette === id;
            return (
              <button key={id} type="button" onClick={() => update({ palette: id })} aria-pressed={active} className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border-2 p-2 ${active ? "border-brand-500" : "border-ink-100"}`}>
                <span className="flex gap-1" aria-hidden="true"><span className="h-5 w-5 rounded-full" style={{ background: p.light["500"] }} /><span className="h-5 w-5 rounded-full" style={{ background: p.accent["400"] }} /></span>
                <span className="text-xs">{p.label.split(" (")[0]}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-medium">Hell oder dunkel</legend>
        <div className="flex flex-wrap gap-2">
          {([["system", "Wie das Gerät"], ["light", "Hell"], ["dark", "Dunkel"]] as const).map(([v, l]) => <button key={v} type="button" onClick={() => update({ theme: v })} aria-pressed={a.theme === v} className={chip(a.theme === v)}>{l}</button>)}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-medium">Schriftgröße</legend>
        <div className="flex flex-wrap gap-2">
          {([["md", "Normal"], ["lg", "Größer"], ["xl", "Sehr groß"]] as const).map(([v, l]) => <button key={v} type="button" onClick={() => update({ fontSize: v })} aria-pressed={a.fontSize === v} className={chip(a.fontSize === v)}>{l}</button>)}
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2"><input type="checkbox" className="h-5 w-5" checked={a.motion === "reduced"} onChange={(e) => update({ motion: e.target.checked ? "reduced" : "system" })} />Weniger Bewegung (keine Animationen, kein Konfetti)</label>
        <label className="flex items-center gap-2"><input type="checkbox" className="h-5 w-5" checked={a.sound} onChange={(e) => update({ sound: e.target.checked })} />Töne bei richtigen Antworten</label>
      </div>
      <p className="text-xs text-ink-500" aria-live="polite">{pending ? "Speichere …" : msg ?? "Gilt auf allen Geräten, auf denen du angemeldet bist."}</p>
    </div>
  );
}
