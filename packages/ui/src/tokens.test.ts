import { describe, expect, it } from "vitest";
import { CONTRAST_AA_LARGE, CONTRAST_AA_TEXT, contrastRatio, graphicPairs, meetsContrast, palette, parseColor, readinessBandFor, spacing, textPairs, themes, TOUCH_TARGET_MIN, typography } from "./tokens";

describe("contrastRatio", () => {
  it("liefert 21 für Schwarz auf Weiß und 1 für gleiche Farben", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBe(21);
    expect(contrastRatio("#FFFFFF", "#000000")).toBe(21);
    expect(contrastRatio("#1F4F8F", "#1F4F8F")).toBe(1);
  });

  it("versteht Kurzform, Alpha und rgb()", () => {
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor("#FFFFFF80")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor("rgba(26, 24, 21, 0.55)")).toEqual({ r: 26, g: 24, b: 21 });
    expect(() => parseColor("blau")).toThrow();
  });

  it("meetsContrast prüft gegen die Schwelle", () => {
    expect(meetsContrast("#FFFFFF", "#1F4F8F")).toBe(true);
    expect(meetsContrast("#FFFFFF", "#F5C400")).toBe(false);
  });
});

describe("Themes erreichen WCAG AA", () => {
  for (const [name, colors] of Object.entries(themes)) {
    describe(name, () => {
      it.each(textPairs(colors).map((p) => [p.name, p.fg, p.bg] as const))("Text %s erreicht mindestens 4,5:1", (_label, fg, bg) => {
        expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(CONTRAST_AA_TEXT);
      });
      it.each(graphicPairs(colors).map((p) => [p.name, p.fg, p.bg] as const))("Grafik %s erreicht mindestens 3:1", (_label, fg, bg) => {
        expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(CONTRAST_AA_LARGE);
      });
    });
  }

  it("Signalgelb wird nur mit dunklem Text kombiniert", () => {
    expect(contrastRatio(themes.light.text.onAccent, themes.light.accent.base)).toBeGreaterThanOrEqual(CONTRAST_AA_TEXT);
    expect(contrastRatio(palette.neutral[0], palette.yellow[400])).toBeLessThan(CONTRAST_AA_TEXT);
  });
});

describe("Struktur der Tokens", () => {
  it("Prüfungsreife-Bänder folgen den Schwellen der learning-engine", () => {
    expect(readinessBandFor(0)).toBe("red");
    expect(readinessBandFor(39)).toBe("red");
    expect(readinessBandFor(40)).toBe("orange");
    expect(readinessBandFor(69)).toBe("orange");
    expect(readinessBandFor(70)).toBe("yellow_green");
    expect(readinessBandFor(84)).toBe("yellow_green");
    expect(readinessBandFor(85)).toBe("green");
    expect(readinessBandFor(150)).toBe("green");
    expect(readinessBandFor(-5)).toBe("red");
  });

  it("Abstände liegen auf dem 4er-Raster", () => {
    for (const value of Object.values(spacing)) expect(value % 4).toBe(0);
  });

  it("Touch-Ziel ist mindestens 44 px und Basisschrift 16 px", () => {
    expect(TOUCH_TARGET_MIN).toBeGreaterThanOrEqual(44);
    expect(typography.size.base).toBe(16);
  });

  it("beide Themes haben identische Schlüsselstruktur", () => {
    const keys = (obj: unknown, prefix = ""): string[] =>
      Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => (typeof v === "object" && v !== null ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
    expect(keys(themes.dark).sort()).toEqual(keys(themes.light).sort());
  });
});
