/**
 * Token-Export für React Native (apps/mobile). Nur Zahlen und Strings, keine CSS-Ausdrücke.
 * Farben sind Hex/RGBA-Strings, Maße Zahlen in dp, Schriftgewichte Strings wie von RN erwartet.
 */
import { breakpoints, motion, palette, radius, spacing, themes, typography, TOUCH_TARGET_MIN, zIndex, type SemanticColors, type ThemeName } from "./tokens";

export interface NativeShadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export const nativeShadow: Record<"none" | "sm" | "md" | "lg", NativeShadow> = {
  none: { shadowColor: "#000000", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  sm: { shadowColor: palette.neutral[900], shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: palette.neutral[900], shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  lg: { shadowColor: palette.neutral[900], shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 8 }
};

export type NativeFontWeight = "400" | "500" | "600" | "700";

export const nativeTypography = {
  fontFamily: { sans: "Inter", mono: "JetBrainsMono", arabic: "NotoSansArabic" },
  fontSize: typography.size,
  /** Zeilenhöhe in dp je Größe (Größe mal Faktor, gerundet). */
  lineHeight: Object.fromEntries(
    Object.entries(typography.size).map(([key, size]) => [key, Math.round(size * (size >= 24 ? typography.lineHeight.tight : size >= 18 ? typography.lineHeight.snug : typography.lineHeight.normal))])
  ) as Record<keyof typeof typography.size, number>,
  fontWeight: { regular: "400", medium: "500", semibold: "600", bold: "700" } satisfies Record<string, NativeFontWeight>
} as const;

export interface NativeTheme {
  name: ThemeName;
  colors: SemanticColors;
  spacing: typeof spacing;
  radius: typeof radius;
  shadow: typeof nativeShadow;
  typography: typeof nativeTypography;
  duration: typeof motion.duration;
  zIndex: typeof zIndex;
  breakpoints: typeof breakpoints;
  touchTargetMin: number;
}

export function nativeTheme(name: ThemeName): NativeTheme {
  return { name, colors: themes[name], spacing, radius, shadow: nativeShadow, typography: nativeTypography, duration: motion.duration, zIndex, breakpoints, touchTargetMin: TOUCH_TARGET_MIN };
}

export const nativeLight = nativeTheme("light");
export const nativeDark = nativeTheme("dark");
