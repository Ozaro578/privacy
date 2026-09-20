import { expect, test } from "@playwright/test";

test.describe("Vorfahrt-Trainer (Vorschau)", () => {
  test("Reihenfolge antippen, prüfen, Erklärung sehen", async ({ page }) => {
    await page.goto("/vorschau#vorfahrt");
    const v = page.locator("#vorfahrt");
    const group = v.getByRole("group", { name: "Fahrzeuge" });
    await expect(group).toBeVisible();
    const check = v.getByRole("button", { name: "Reihenfolge prüfen" });
    await expect(check).toBeDisabled();
    const buttons = group.getByRole("button");
    const n = await buttons.count();
    expect(n).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < n; i++) await buttons.nth(i).click();
    await expect(check).toBeEnabled();
    await check.click();
    await expect(v.getByRole("status")).toContainText(/Richtig|Nicht ganz/);
    await expect(v.getByText(/Rechtsgrundlage/)).toBeVisible();
    await expect(v.getByRole("button", { name: "Weiter" })).toBeVisible();
  });
});
