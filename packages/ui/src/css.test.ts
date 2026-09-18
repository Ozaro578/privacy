import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { colorVariables, generateCssVariables, generateThemeCss, staticVariables, tailwindThemeVariables, themeStyle } from "./css";
import { themes } from "./tokens";

describe("CSS-Erzeugung", () => {
  it("flacht Farbtokens zu Custom Properties ab", () => {
    const vars = colorVariables(themes.light);
    expect(vars["--klar-color-bg-canvas"]).toBe(themes.light.bg.canvas);
    expect(vars["--klar-color-text-on-primary"]).toBe(themes.light.text.onPrimary);
    expect(vars["--klar-color-readiness-yellow-green-fill"]).toBe(themes.light.readiness.yellow_green.fill);
    expect(vars["--klar-color-status-success-surface"]).toBe(themes.light.status.success.surface);
  });

  it("enthält statische Tokens in rem und px", () => {
    const vars = staticVariables();
    expect(vars["--klar-space-4"]).toBe("16px");
    expect(vars["--klar-text-base"]).toBe("1rem");
    expect(vars["--klar-radius-md"]).toBe("8px");
    expect(vars["--klar-duration-base"]).toBe("200ms");
    expect(vars["--klar-touch-target"]).toBe("44px");
  });

  it("erzeugt :root, Systemdunkel und data-theme=dark", () => {
    const css = generateCssVariables();
    expect(css).toMatch(/^:root \{/);
    expect(css).toContain('@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {');
    expect(css).toContain('[data-theme="dark"] {');
    expect(css).toContain(`--klar-color-bg-canvas: ${themes.light.bg.canvas};`);
    expect(css).toContain(`--klar-color-bg-canvas: ${themes.dark.bg.canvas};`);
    expect(css.split(`--klar-color-bg-canvas: ${themes.dark.bg.canvas};`).length - 1).toBe(2);
  });

  it("bildet Tailwind-Theme-Variablen auf Token-Variablen ab", () => {
    const vars = tailwindThemeVariables();
    expect(vars["--color-primary"]).toBe("var(--klar-color-action-primary)");
    expect(vars["--color-readiness-yellow-green-text"]).toBe("var(--klar-color-readiness-yellow-green-text)");
    expect(vars["--spacing-touch"]).toBe("var(--klar-touch-target)");
    expect(vars["--spacing"]).toBe("0.25rem");
    expect(vars["--font-sans"]).toBe("var(--klar-font-sans)");
  });

  it("theme.css ist mit den Tokens synchron (pnpm build:css nach Token-Änderungen)", () => {
    const file = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "theme.css"), "utf8");
    expect(file).toBe(generateThemeCss());
    expect(file).toContain("@theme inline {");
    expect(file).toContain('@source "./components";');
    expect(file).toContain("prefers-reduced-motion");
    expect(file).not.toMatch(/[\u2013\u2014]/);
  });

  it("themeStyle liefert Inline-Style-Objekt für Dark", () => {
    expect(themeStyle("dark")["--klar-color-text-primary"]).toBe(themes.dark.text.primary);
  });
});
