// Farbwelten für die Personalisierung (Web und Mobile). Die Web-App erzeugt daraus CSS-Variablen (apps/web/scripts/build-palettes.mjs).
import palettesJson from "./palettes.json" with { type: "json" };

export type PaletteId = "klar" | "sonne" | "wald" | "beere" | "meer" | "graphit";
export type ThemeMode = "system" | "light" | "dark";
export type FontSize = "md" | "lg" | "xl";
export type MotionPref = "system" | "reduced";

export interface PaletteScale { "50": string; "100": string; "200": string; "300": string; "500": string; "600": string; "700": string; "900": string }
export interface Palette { label: string; emoji: string; light: PaletteScale; dark: PaletteScale; accent: { "400": string; "500": string; text: string } }

export const PALETTES = palettesJson as Record<PaletteId, Palette>;
export const PALETTE_IDS = Object.keys(PALETTES) as PaletteId[];

/** Darstellungseinstellungen je Nutzer (users.accessibility). Fehlende Werte fallen auf Standard zurück. */
export interface Appearance { palette: PaletteId; theme: ThemeMode; fontSize: FontSize; motion: MotionPref; sound: boolean }
export const DEFAULT_APPEARANCE: Appearance = { palette: "klar", theme: "system", fontSize: "md", motion: "system", sound: true };

export function parseAppearance(raw: unknown): Appearance {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const palette = typeof o["palette"] === "string" && (PALETTE_IDS as string[]).includes(o["palette"]) ? (o["palette"] as PaletteId) : DEFAULT_APPEARANCE.palette;
  const theme = o["theme"] === "light" || o["theme"] === "dark" ? o["theme"] : "system";
  const fontSize = o["fontSize"] === "lg" || o["fontSize"] === "xl" ? o["fontSize"] : "md";
  const motion = o["motion"] === "reduced" ? "reduced" : "system";
  const sound = o["sound"] !== false;
  return { palette, theme, fontSize, motion, sound };
}
