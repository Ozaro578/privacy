import { expect, test } from "@playwright/test";

test.describe("Lernsession (Vorschau mit Beispieldaten)", () => {
  test("zeigt Prüfungsreife, Heute-Plan und eine Frage mit Situationsgrafik", async ({ page }) => {
    await page.goto("/vorschau");
    await expect(page.getByText("Prüfungsreife", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Heute empfohlen")).toBeVisible();
    const session = page.locator("#session");
    await expect(session.getByText("Frage 1 von 1")).toBeVisible();
    const img = session.locator("img").first();
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute("alt", /Kreuzung/);
    await expect.poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  });

  test("Antwort auswählen und Sicherheit angeben aktiviert die Prüfung", async ({ page }) => {
    await page.goto("/vorschau#session");
    const session = page.locator("#session");
    await expect(session.locator('[data-ready="true"]')).toBeVisible({ timeout: 30_000 });
    const check = session.getByRole("button", { name: "Antwort prüfen" });
    await expect(check).toBeDisabled();
    await session.getByLabel("Rechts vor links").check();
    await session.getByRole("button", { name: "Sicher", exact: true }).click();
    await expect(check).toBeEnabled();
  });

  test("Farbwelt und Dunkelmodus wirken über html-Attribute", async ({ page }) => {
    await page.goto("/vorschau");
    const before = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
    await page.evaluate(() => { document.documentElement.setAttribute("data-theme", "dark"); document.documentElement.setAttribute("data-palette", "wald"); });
    const after = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
    expect(after).not.toBe(before);
    const brand = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--fp-brand-500").trim());
    expect(brand).toBe("#22a24d");
  });
});
