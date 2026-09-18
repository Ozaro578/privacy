/**
 * Design Language "Klar" für FahrPilot.
 *
 * Grundsätze: ruhige, warme Neutraltöne als Fläche; ein tiefes Verkehrsblau als einzige
 * Aktionsfarbe; warmes Signalgelb nur für wenige Hervorhebungen (Streak, aktuelle Aufgabe);
 * Statusfarben tragen immer Text und Symbol, nie nur Farbe. Alle Textpaare erreichen
 * mindestens 4,5:1 (WCAG 2.1 AA), geprüft in tokens.test.ts.
 */

export const palette = {
  blue: {
    50: "#EEF4FB",
    100: "#D6E4F5",
    200: "#ADC8EA",
    300: "#7FA8DC",
    400: "#4F86CB",
    500: "#2B66B0",
    600: "#1F4F8F",
    700: "#173D70",
    800: "#112C52",
    900: "#0B1D37"
  },
  yellow: {
    50: "#FFF9E0",
    100: "#FFF0B3",
    200: "#FFE47A",
    300: "#FCD53F",
    400: "#F5C400",
    500: "#D9AC00",
    600: "#A98500",
    700: "#7A6000",
    800: "#4F3E00",
    900: "#2E2400"
  },
  green: {
    50: "#E9F6EE",
    100: "#CDEBD8",
    200: "#9FD8B4",
    300: "#6EC28F",
    400: "#3FA66A",
    500: "#2A8C52",
    600: "#1E7B3E",
    700: "#176132",
    800: "#114725",
    900: "#0B2F19"
  },
  orange: {
    50: "#FDF1E6",
    100: "#FADFC4",
    200: "#F5BF8B",
    300: "#EE9C4E",
    400: "#E07C1C",
    500: "#C96500",
    600: "#B85C00",
    700: "#8E4700",
    800: "#663300",
    900: "#3F2000"
  },
  red: {
    50: "#FCEDEC",
    100: "#F8D4D1",
    200: "#F0A9A3",
    300: "#E67C74",
    400: "#D9534A",
    500: "#C93D34",
    600: "#C0342B",
    700: "#9A2922",
    800: "#701D18",
    900: "#48120F"
  },
  lime: {
    50: "#F3F6E3",
    100: "#E4EBBD",
    200: "#CAD786",
    300: "#ADC04F",
    400: "#8FA51E",
    500: "#758A00",
    600: "#66780A",
    700: "#4F5D08",
    800: "#394305",
    900: "#232A03"
  },
  neutral: {
    0: "#FFFFFF",
    50: "#FAF8F5",
    100: "#F3F0EB",
    200: "#E6E1D9",
    300: "#D2CCC2",
    400: "#8E877D",
    500: "#6E6861",
    600: "#5C564E",
    700: "#433E38",
    800: "#2B2824",
    900: "#1A1815",
    950: "#12100E"
  }
} as const;

export type ThemeName = "light" | "dark";

export type ReadinessBandId = "red" | "orange" | "yellow_green" | "green";

export interface ReadinessBandColors {
  /** Text auf Oberfläche, mindestens 4,5:1. */
  text: string;
  /** Füllung von Ring, Balken und Symbol, mindestens 3:1 gegen die Oberfläche. */
  fill: string;
  /** Flächenfarbe für Chips und Hinweise; `text` darauf erreicht 4,5:1. */
  surface: string;
}

export interface SemanticColors {
  bg: { canvas: string; surface: string; raised: string; muted: string; inverse: string; overlay: string };
  text: { primary: string; secondary: string; muted: string; inverse: string; link: string; onPrimary: string; onAccent: string };
  border: { subtle: string; default: string; strong: string; focus: string };
  action: { primary: string; primaryHover: string; primaryActive: string; secondary: string; secondaryHover: string; danger: string; dangerHover: string; disabled: string; onDisabled: string };
  accent: { base: string; strong: string; surface: string };
  status: {
    success: { text: string; fill: string; surface: string };
    warning: { text: string; fill: string; surface: string };
    danger: { text: string; fill: string; surface: string };
    info: { text: string; fill: string; surface: string };
  };
  readiness: Record<ReadinessBandId, ReadinessBandColors>;
}

export const lightColors: SemanticColors = {
  bg: {
    canvas: palette.neutral[50],
    surface: palette.neutral[0],
    raised: palette.neutral[0],
    muted: palette.neutral[100],
    inverse: palette.neutral[900],
    overlay: "rgba(26, 24, 21, 0.55)"
  },
  text: {
    primary: palette.neutral[900],
    secondary: palette.neutral[600],
    muted: palette.neutral[500],
    inverse: palette.neutral[50],
    link: palette.blue[700],
    onPrimary: palette.neutral[0],
    onAccent: palette.neutral[900]
  },
  border: {
    subtle: palette.neutral[100],
    default: palette.neutral[200],
    strong: palette.neutral[400],
    focus: palette.blue[500]
  },
  action: {
    primary: palette.blue[600],
    primaryHover: palette.blue[700],
    primaryActive: palette.blue[800],
    secondary: palette.blue[50],
    secondaryHover: palette.blue[100],
    danger: palette.red[600],
    dangerHover: palette.red[700],
    disabled: palette.neutral[200],
    onDisabled: palette.neutral[600]
  },
  accent: { base: palette.yellow[400], strong: palette.yellow[700], surface: palette.yellow[50] },
  status: {
    success: { text: palette.green[700], fill: palette.green[600], surface: palette.green[50] },
    warning: { text: palette.orange[700], fill: palette.orange[600], surface: palette.orange[50] },
    danger: { text: palette.red[700], fill: palette.red[600], surface: palette.red[50] },
    info: { text: palette.blue[700], fill: palette.blue[600], surface: palette.blue[50] }
  },
  readiness: {
    red: { text: palette.red[700], fill: palette.red[600], surface: palette.red[50] },
    orange: { text: palette.orange[700], fill: palette.orange[600], surface: palette.orange[50] },
    yellow_green: { text: palette.lime[700], fill: palette.lime[600], surface: palette.lime[50] },
    green: { text: palette.green[700], fill: palette.green[600], surface: palette.green[50] }
  }
};

export const darkColors: SemanticColors = {
  bg: {
    canvas: palette.neutral[950],
    surface: palette.neutral[900],
    raised: palette.neutral[800],
    muted: palette.neutral[800],
    inverse: palette.neutral[50],
    overlay: "rgba(0, 0, 0, 0.65)"
  },
  text: {
    primary: palette.neutral[100],
    secondary: palette.neutral[200],
    muted: palette.neutral[300],
    inverse: palette.neutral[900],
    link: palette.blue[300],
    onPrimary: palette.neutral[950],
    onAccent: palette.neutral[950]
  },
  border: {
    subtle: palette.neutral[800],
    default: palette.neutral[700],
    strong: palette.neutral[500],
    focus: palette.blue[300]
  },
  action: {
    primary: palette.blue[300],
    primaryHover: palette.blue[200],
    primaryActive: palette.blue[100],
    secondary: palette.blue[900],
    secondaryHover: palette.blue[800],
    danger: palette.red[300],
    dangerHover: palette.red[200],
    disabled: palette.neutral[800],
    onDisabled: palette.neutral[300]
  },
  accent: { base: palette.yellow[300], strong: palette.yellow[200], surface: palette.yellow[900] },
  status: {
    success: { text: palette.green[200], fill: palette.green[300], surface: palette.green[900] },
    warning: { text: palette.orange[200], fill: palette.orange[300], surface: palette.orange[900] },
    danger: { text: palette.red[200], fill: palette.red[300], surface: palette.red[900] },
    info: { text: palette.blue[200], fill: palette.blue[300], surface: palette.blue[900] }
  },
  readiness: {
    red: { text: palette.red[200], fill: palette.red[300], surface: palette.red[900] },
    orange: { text: palette.orange[200], fill: palette.orange[300], surface: palette.orange[900] },
    yellow_green: { text: palette.lime[200], fill: palette.lime[300], surface: palette.lime[900] },
    green: { text: palette.green[200], fill: palette.green[300], surface: palette.green[900] }
  }
};

export const themes: Record<ThemeName, SemanticColors> = { light: lightColors, dark: darkColors };

/** Schwellen identisch mit learning-engine readinessBand(): <40 rot, <70 orange, <85 gelbgrün, sonst grün. */
export const READINESS_THRESHOLDS: ReadonlyArray<{ band: ReadinessBandId; min: number }> = [
  { band: "green", min: 85 },
  { band: "yellow_green", min: 70 },
  { band: "orange", min: 40 },
  { band: "red", min: 0 }
];

export function readinessBandFor(score: number): ReadinessBandId {
  const clamped = Math.max(0, Math.min(100, score));
  for (const entry of READINESS_THRESHOLDS) if (clamped >= entry.min) return entry.band;
  return "red";
}

export const typography = {
  fontFamily: {
    sans: "\"Inter\", \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, ui-sans-serif, system-ui, sans-serif",
    mono: "\"JetBrains Mono\", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    arabic: "\"Noto Sans Arabic\", \"Segoe UI\", Tahoma, Arial, sans-serif"
  },
  /** Größen in px; die App rendert in rem (Basis 16), damit Systemschriftgrößen wirken. */
  size: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, "2xl": 24, "3xl": 30, "4xl": 36, "5xl": 48 },
  lineHeight: { tight: 1.2, snug: 1.35, normal: 1.5, relaxed: 1.65 },
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  letterSpacing: { tight: "-0.01em", normal: "0", wide: "0.02em" }
} as const;

/** 4er-Raster in px. */
export const spacing = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 14: 56, 16: 64, 20: 80, 24: 96 } as const;

export const radius = { none: 0, sm: 4, md: 8, lg: 12, xl: 16, "2xl": 24, full: 9999 } as const;

export const shadow = {
  none: "none",
  sm: "0 1px 2px rgba(26, 24, 21, 0.06)",
  md: "0 2px 6px rgba(26, 24, 21, 0.08), 0 1px 2px rgba(26, 24, 21, 0.06)",
  lg: "0 8px 24px rgba(26, 24, 21, 0.12), 0 2px 6px rgba(26, 24, 21, 0.06)",
  focus: "0 0 0 3px rgba(43, 102, 176, 0.35)"
} as const;

/** Dauer in ms, Kurven als CSS-Easing. Bei prefers-reduced-motion werden Dauern auf 0 gesetzt. */
export const motion = {
  duration: { instant: 0, fast: 120, base: 200, slow: 320, deliberate: 480 },
  easing: { standard: "cubic-bezier(0.2, 0, 0, 1)", enter: "cubic-bezier(0, 0, 0.2, 1)", exit: "cubic-bezier(0.4, 0, 1, 1)" }
} as const;

/** Mindestgröße interaktiver Elemente in px (WCAG 2.5.5, Mobile-Vorgabe 44 Punkte). */
export const TOUCH_TARGET_MIN = 44;

export const zIndex = { base: 0, raised: 10, sticky: 100, overlay: 1000, dialog: 1100, toast: 1200 } as const;

export const breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280 } as const;

export const tokens = { palette, themes, typography, spacing, radius, shadow, motion, zIndex, breakpoints, touchTargetMin: TOUCH_TARGET_MIN } as const;

export type Tokens = typeof tokens;

/* ---------------------------------------------------------------------------------------- */
/* Kontrast nach WCAG 2.1                                                                   */
/* ---------------------------------------------------------------------------------------- */

export interface Rgb { r: number; g: number; b: number }

/** Akzeptiert #RGB, #RRGGBB, #RRGGBBAA sowie rgb()/rgba() (Alpha wird ignoriert). */
export function parseColor(input: string): Rgb {
  const value = input.trim();
  if (value.startsWith("#")) {
    const hex = value.slice(1);
    const full = hex.length === 3 || hex.length === 4 ? hex.split("").map((c) => c + c).join("") : hex;
    if (full.length !== 6 && full.length !== 8) throw new Error(`Ungültige Farbe: ${input}`);
    const num = Number.parseInt(full.slice(0, 6), 16);
    if (Number.isNaN(num)) throw new Error(`Ungültige Farbe: ${input}`);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }
  const match = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(value);
  if (!match) throw new Error(`Ungültige Farbe: ${input}`);
  return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) };
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(color: string | Rgb): number {
  const { r, g, b } = typeof color === "string" ? parseColor(color) : color;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Kontrastverhältnis 1..21 zwischen zwei Farben, unabhängig von der Reihenfolge. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [light, dark] = la >= lb ? [la, lb] : [lb, la];
  return Math.round(((light + 0.05) / (dark + 0.05)) * 100) / 100;
}

export const CONTRAST_AA_TEXT = 4.5;
export const CONTRAST_AA_LARGE = 3;

export function meetsContrast(foreground: string, background: string, minimum = CONTRAST_AA_TEXT): boolean {
  return contrastRatio(foreground, background) >= minimum;
}

/** Text-auf-Hintergrund-Paare, die in beiden Themes mindestens 4,5:1 erreichen müssen. */
export function textPairs(colors: SemanticColors): ReadonlyArray<{ name: string; fg: string; bg: string }> {
  const pairs: Array<{ name: string; fg: string; bg: string }> = [];
  for (const [bgName, bg] of [["canvas", colors.bg.canvas], ["surface", colors.bg.surface], ["raised", colors.bg.raised], ["muted", colors.bg.muted]] as const) {
    pairs.push({ name: `text.primary/${bgName}`, fg: colors.text.primary, bg });
    pairs.push({ name: `text.secondary/${bgName}`, fg: colors.text.secondary, bg });
    pairs.push({ name: `text.muted/${bgName}`, fg: colors.text.muted, bg });
    pairs.push({ name: `text.link/${bgName}`, fg: colors.text.link, bg });
  }
  pairs.push({ name: "text.inverse/bg.inverse", fg: colors.text.inverse, bg: colors.bg.inverse });
  pairs.push({ name: "onPrimary/action.primary", fg: colors.text.onPrimary, bg: colors.action.primary });
  pairs.push({ name: "onPrimary/action.primaryHover", fg: colors.text.onPrimary, bg: colors.action.primaryHover });
  pairs.push({ name: "onPrimary/action.danger", fg: colors.text.onPrimary, bg: colors.action.danger });
  pairs.push({ name: "onAccent/accent.base", fg: colors.text.onAccent, bg: colors.accent.base });
  pairs.push({ name: "onDisabled/action.disabled", fg: colors.action.onDisabled, bg: colors.action.disabled });
  pairs.push({ name: "action.primary/secondary", fg: colors.action.primary, bg: colors.action.secondary });
  pairs.push({ name: "action.primary/secondaryHover", fg: colors.action.primary, bg: colors.action.secondaryHover });
  pairs.push({ name: "accent.strong/accent.surface", fg: colors.accent.strong, bg: colors.accent.surface });
  for (const [name, s] of Object.entries(colors.status)) {
    pairs.push({ name: `status.${name}.text/surface`, fg: s.text, bg: s.surface });
    pairs.push({ name: `status.${name}.text/bg.surface`, fg: s.text, bg: colors.bg.surface });
  }
  for (const [name, band] of Object.entries(colors.readiness)) {
    pairs.push({ name: `readiness.${name}.text/surface`, fg: band.text, bg: band.surface });
    pairs.push({ name: `readiness.${name}.text/bg.surface`, fg: band.text, bg: colors.bg.surface });
  }
  return pairs;
}

/** Nicht-Text-Paare (Füllungen, Ränder, Fokus) mit Mindestkontrast 3:1. */
export function graphicPairs(colors: SemanticColors): ReadonlyArray<{ name: string; fg: string; bg: string }> {
  const pairs: Array<{ name: string; fg: string; bg: string }> = [
    { name: "border.strong/bg.surface", fg: colors.border.strong, bg: colors.bg.surface },
    { name: "border.focus/bg.surface", fg: colors.border.focus, bg: colors.bg.surface },
    { name: "border.focus/bg.canvas", fg: colors.border.focus, bg: colors.bg.canvas },
    { name: "action.primary/bg.surface", fg: colors.action.primary, bg: colors.bg.surface }
  ];
  for (const [name, s] of Object.entries(colors.status)) pairs.push({ name: `status.${name}.fill/bg.surface`, fg: s.fill, bg: colors.bg.surface });
  for (const [name, band] of Object.entries(colors.readiness)) pairs.push({ name: `readiness.${name}.fill/bg.surface`, fg: band.fill, bg: colors.bg.surface });
  return pairs;
}
