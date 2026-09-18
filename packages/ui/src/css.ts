/**
 * Erzeugt CSS-Custom-Properties aus den Tokens: `:root` (Light), `[data-theme="dark"]` und
 * Systemvorgabe über `prefers-color-scheme`, sofern kein `data-theme="light"` gesetzt ist.
 * Zusätzlich ein `@theme inline`-Block für Tailwind v4, damit Utilities wie `bg-primary`,
 * `text-fg-muted` oder `min-h-touch` direkt aus den Tokens entstehen.
 */
import { motion, radius, shadow, spacing, themes, typography, TOUCH_TARGET_MIN, breakpoints, zIndex, type SemanticColors, type ThemeName } from "./tokens";

export const CSS_PREFIX = "--klar";

function kebab(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/_/g, "-").toLowerCase();
}

function flatten(prefix: string, value: unknown, out: Record<string, string>): void {
  if (typeof value === "string" || typeof value === "number") {
    out[prefix] = String(value);
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) flatten(`${prefix}-${kebab(key)}`, child, out);
  }
}

/** Farbvariablen eines Themes, z. B. `--klar-color-bg-canvas`. */
export function colorVariables(colors: SemanticColors): Record<string, string> {
  const out: Record<string, string> = {};
  flatten(`${CSS_PREFIX}-color`, colors, out);
  return out;
}

/** Themeunabhängige Variablen: Abstände, Radien, Schatten, Typografie, Bewegung. */
export function staticVariables(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, px] of Object.entries(spacing)) out[`${CSS_PREFIX}-space-${key}`] = `${px}px`;
  for (const [key, px] of Object.entries(radius)) out[`${CSS_PREFIX}-radius-${key}`] = `${px}px`;
  for (const [key, value] of Object.entries(shadow)) out[`${CSS_PREFIX}-shadow-${key}`] = value;
  for (const [key, value] of Object.entries(typography.fontFamily)) out[`${CSS_PREFIX}-font-${key}`] = value;
  for (const [key, px] of Object.entries(typography.size)) out[`${CSS_PREFIX}-text-${key}`] = `${px / 16}rem`;
  for (const [key, value] of Object.entries(typography.lineHeight)) out[`${CSS_PREFIX}-leading-${key}`] = String(value);
  for (const [key, value] of Object.entries(typography.weight)) out[`${CSS_PREFIX}-weight-${key}`] = String(value);
  for (const [key, value] of Object.entries(typography.letterSpacing)) out[`${CSS_PREFIX}-tracking-${key}`] = value;
  for (const [key, ms] of Object.entries(motion.duration)) out[`${CSS_PREFIX}-duration-${key}`] = `${ms}ms`;
  for (const [key, value] of Object.entries(motion.easing)) out[`${CSS_PREFIX}-ease-${key}`] = value;
  for (const [key, value] of Object.entries(zIndex)) out[`${CSS_PREFIX}-z-${key}`] = String(value);
  for (const [key, px] of Object.entries(breakpoints)) out[`${CSS_PREFIX}-breakpoint-${key}`] = `${px}px`;
  out[`${CSS_PREFIX}-touch-target`] = `${TOUCH_TARGET_MIN}px`;
  return out;
}

function block(selector: string, vars: Record<string, string>, indent = ""): string {
  const lines = Object.entries(vars).map(([name, value]) => `${indent}  ${name}: ${value};`);
  return `${indent}${selector} {\n${lines.join("\n")}\n${indent}}`;
}

/**
 * Reines CSS mit Custom Properties, ohne Tailwind. Nutzbar in jeder Web-Umgebung.
 * Reihenfolge: :root (Light), Systemdunkel per Media Query, explizites data-theme.
 */
export function generateCssVariables(): string {
  const light = { ...staticVariables(), ...colorVariables(themes.light) };
  const dark = colorVariables(themes.dark);
  return [
    block(":root", light),
    `@media (prefers-color-scheme: dark) {\n${block(':root:not([data-theme="light"])', dark, "  ")}\n}`,
    block('[data-theme="dark"]', dark)
  ].join("\n\n");
}

/** Hilfsfunktion: Custom Properties eines Themes als Inline-Style-Objekt (z. B. für Vorschau oder White-Label-Override). */
export function themeStyle(theme: ThemeName): Record<string, string> {
  return colorVariables(themes[theme]);
}

const c = (path: string) => `var(${CSS_PREFIX}-color-${path})`;

/** Zuordnung Tailwind-Theme-Variable zu Token-Variable. Jede Zeile erzeugt Utilities (bg-*, text-*, border-*, ...). */
export function tailwindThemeVariables(): Record<string, string> {
  const out: Record<string, string> = {
    "--color-canvas": c("bg-canvas"),
    "--color-surface": c("bg-surface"),
    "--color-raised": c("bg-raised"),
    "--color-muted": c("bg-muted"),
    "--color-inverse": c("bg-inverse"),
    "--color-overlay": c("bg-overlay"),
    "--color-fg": c("text-primary"),
    "--color-fg-secondary": c("text-secondary"),
    "--color-fg-muted": c("text-muted"),
    "--color-fg-inverse": c("text-inverse"),
    "--color-link": c("text-link"),
    "--color-on-primary": c("text-on-primary"),
    "--color-on-accent": c("text-on-accent"),
    "--color-line-subtle": c("border-subtle"),
    "--color-line": c("border-default"),
    "--color-line-strong": c("border-strong"),
    "--color-focus": c("border-focus"),
    "--color-primary": c("action-primary"),
    "--color-primary-hover": c("action-primary-hover"),
    "--color-primary-active": c("action-primary-active"),
    "--color-secondary": c("action-secondary"),
    "--color-secondary-hover": c("action-secondary-hover"),
    "--color-danger": c("action-danger"),
    "--color-danger-hover": c("action-danger-hover"),
    "--color-disabled": c("action-disabled"),
    "--color-on-disabled": c("action-on-disabled"),
    "--color-accent": c("accent-base"),
    "--color-accent-strong": c("accent-strong"),
    "--color-accent-surface": c("accent-surface")
  };
  for (const status of ["success", "warning", "danger", "info"] as const) {
    out[`--color-${status}-text`] = c(`status-${status}-text`);
    out[`--color-${status}-fill`] = c(`status-${status}-fill`);
    out[`--color-${status}-surface`] = c(`status-${status}-surface`);
  }
  for (const band of ["red", "orange", "yellow-green", "green"] as const) {
    out[`--color-readiness-${band}-text`] = c(`readiness-${band}-text`);
    out[`--color-readiness-${band}-fill`] = c(`readiness-${band}-fill`);
    out[`--color-readiness-${band}-surface`] = c(`readiness-${band}-surface`);
  }
  out["--font-sans"] = `var(${CSS_PREFIX}-font-sans)`;
  out["--font-mono"] = `var(${CSS_PREFIX}-font-mono)`;
  out["--font-arabic"] = `var(${CSS_PREFIX}-font-arabic)`;
  for (const key of Object.keys(typography.size)) out[`--text-${key}`] = `var(${CSS_PREFIX}-text-${key})`;
  out["--text-xs--line-height"] = `var(${CSS_PREFIX}-leading-normal)`;
  out["--text-sm--line-height"] = `var(${CSS_PREFIX}-leading-normal)`;
  out["--text-base--line-height"] = `var(${CSS_PREFIX}-leading-normal)`;
  out["--text-lg--line-height"] = `var(${CSS_PREFIX}-leading-snug)`;
  out["--text-xl--line-height"] = `var(${CSS_PREFIX}-leading-snug)`;
  out["--text-2xl--line-height"] = `var(${CSS_PREFIX}-leading-tight)`;
  out["--text-3xl--line-height"] = `var(${CSS_PREFIX}-leading-tight)`;
  out["--text-4xl--line-height"] = `var(${CSS_PREFIX}-leading-tight)`;
  out["--text-5xl--line-height"] = `var(${CSS_PREFIX}-leading-tight)`;
  for (const key of Object.keys(typography.weight)) out[`--font-weight-${key}`] = `var(${CSS_PREFIX}-weight-${key})`;
  for (const key of Object.keys(typography.letterSpacing)) out[`--tracking-${key}`] = `var(${CSS_PREFIX}-tracking-${key})`;
  out["--spacing"] = "0.25rem";
  out["--spacing-touch"] = `var(${CSS_PREFIX}-touch-target)`;
  for (const key of Object.keys(radius)) out[`--radius-${key}`] = `var(${CSS_PREFIX}-radius-${key})`;
  for (const key of Object.keys(shadow)) out[`--shadow-${key}`] = `var(${CSS_PREFIX}-shadow-${key})`;
  for (const key of Object.keys(motion.easing)) out[`--ease-${key}`] = `var(${CSS_PREFIX}-ease-${key})`;
  for (const [key, px] of Object.entries(breakpoints)) out[`--breakpoint-${key}`] = `${px}px`;
  return out;
}

const BASE_STYLES = `@layer base {
  :root {
    color-scheme: light;
  }
  [data-theme="dark"] {
    color-scheme: dark;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      color-scheme: dark;
    }
  }
  html {
    font-family: var(${CSS_PREFIX}-font-sans);
    -webkit-text-size-adjust: 100%;
  }
  body {
    background: var(${CSS_PREFIX}-color-bg-canvas);
    color: var(${CSS_PREFIX}-color-text-primary);
    line-height: var(${CSS_PREFIX}-leading-normal);
  }
  :lang(ar) {
    font-family: var(${CSS_PREFIX}-font-arabic);
  }
  :focus-visible {
    outline: 2px solid var(${CSS_PREFIX}-color-border-focus);
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    :root {
      ${CSS_PREFIX}-duration-fast: 0ms;
      ${CSS_PREFIX}-duration-base: 0ms;
      ${CSS_PREFIX}-duration-slow: 0ms;
      ${CSS_PREFIX}-duration-deliberate: 0ms;
    }
    *,
    ::before,
    ::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}`;

/**
 * Vollständige theme.css für Tailwind v4. In apps/web nach \`@import "tailwindcss";\` einbinden:
 * \`@import "@fahrpilot/ui/theme.css";\`. Der @source-Eintrag sorgt dafür, dass Tailwind die
 * Klassen der Komponenten dieses Packages erkennt.
 */
export function generateThemeCss(): string {
  return [
    "/* Automatisch erzeugt aus src/tokens.ts durch scripts/build-theme-css.ts. Nicht von Hand bearbeiten. */",
    '@source "./components";',
    generateCssVariables(),
    block("@theme inline", tailwindThemeVariables()),
    BASE_STYLES,
    ""
  ].join("\n\n");
}
