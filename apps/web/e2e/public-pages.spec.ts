import { expect, test } from "@playwright/test";

test.describe("Öffentliche Seiten", () => {
  test("Login zeigt Formular und Link zur Selbstlern-Registrierung", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "FahrPilot" })).toBeVisible();
    await expect(page.getByLabel(/E-Mail/i).first()).toBeVisible();
    await page.getByRole("link", { name: /Konto erstellen/ }).click();
    await expect(page).toHaveURL(/\/registrieren$/);
    await expect(page.getByRole("button", { name: /Konto erstellen/ })).toBeVisible();
  });

  test("Geschützte Seiten leiten zum Login", async ({ page }) => {
    await page.goto("/heute");
    await expect(page).toHaveURL(/\/login\?next=%2Fheute/);
    await page.goto("/verwaltung");
    await expect(page).toHaveURL(/\/login/);
  });

  test("Datenschutzseite ist erreichbar und nennt den Verantwortlichen", async ({ page }) => {
    await page.goto("/datenschutz");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Datenschutz/);
  });

  test("Seite scrollt bei Handybreite nicht horizontal", async ({ page }) => {
    await page.goto("/vorschau");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
  });
});
