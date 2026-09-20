// Erzeugt src/app/palettes.css aus @fahrpilot/ui palettes.json: Farbwelten, Hell/Dunkel, Schriftgröße, Bewegung.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const palettes = JSON.parse(fs.readFileSync(path.resolve(here, "../../../packages/ui/src/palettes.json"), "utf8"));
const NEUTRAL = {
  light: { paper: "#fbfaf8", surface: "#ffffff", ink900: "#1c1917", ink700: "#44403c", ink500: "#78716c", ink300: "#d6d3d1", ink100: "#f5f5f4", success100: "#dcf5e6", warn100: "#fdebd3", danger100: "#fbe0e3", shadow: "0 1px 2px rgba(28,25,23,.06), 0 8px 24px rgba(28,25,23,.06)" },
  dark: { paper: "#15140f", surface: "#201e19", ink900: "#f3efe8", ink700: "#d6d0c6", ink500: "#a39c90", ink300: "#4a463f", ink100: "#2b2924", success100: "#173824", warn100: "#3d2a10", danger100: "#42191d", shadow: "0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.35)" },
};
const brand = (scale) => Object.entries(scale).map(([k, v]) => `--fp-brand-${k}: ${v};`).join(" ");
const accent = (a) => `--fp-accent-400: ${a["400"]}; --fp-accent-500: ${a["500"]}; --fp-accent-text: ${a.text};`;
const neutral = (n) => `--fp-paper: ${n.paper}; --fp-surface: ${n.surface}; --fp-ink-900: ${n.ink900}; --fp-ink-700: ${n.ink700}; --fp-ink-500: ${n.ink500}; --fp-ink-300: ${n.ink300}; --fp-ink-100: ${n.ink100}; --fp-success-100: ${n.success100}; --fp-warn-100: ${n.warn100}; --fp-danger-100: ${n.danger100}; --fp-shadow: ${n.shadow};`;
let css = "/* Automatisch erzeugt von scripts/build-palettes.mjs aus @fahrpilot/ui palettes.json. Nicht von Hand bearbeiten. */\n";
css += `:root { ${neutral(NEUTRAL.light)} ${brand(palettes.klar.light)} ${accent(palettes.klar.accent)} color-scheme: light; }\n`;
for (const [id, p] of Object.entries(palettes)) css += `:root[data-palette="${id}"] { ${brand(p.light)} ${accent(p.accent)} }\n`;
const darkBlock = (sel) => `${sel} { ${neutral(NEUTRAL.dark)} ${brand(palettes.klar.dark)} color-scheme: dark; }\n` + Object.entries(palettes).map(([id, p]) => `${sel}[data-palette="${id}"] { ${brand(p.dark)} }\n`).join("");
css += `@media (prefers-color-scheme: dark) {\n${darkBlock(':root:not([data-theme="light"])').replace(/^/gm, "  ")}}\n`;
css += darkBlock(':root[data-theme="dark"]');
css += `:root[data-fontsize="lg"] { font-size: 112.5%; }\n:root[data-fontsize="xl"] { font-size: 125%; }\n`;
css += `:root[data-motion="reduced"] *, :root[data-motion="reduced"] *::before, :root[data-motion="reduced"] *::after { animation: none !important; transition: none !important; }\n`;
fs.writeFileSync(path.resolve(here, "../src/app/palettes.css"), css);
console.log(`palettes.css: ${Object.keys(palettes).length} Farbwelten`);
