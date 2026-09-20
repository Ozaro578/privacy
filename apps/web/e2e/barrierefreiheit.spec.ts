import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** Automatische Prüfung nach WCAG 2.1 AA (axe-core) auf allen öffentlichen Seiten und der Vorschau. Schwere und kritische Verstöße lassen den Test scheitern. */
const PAGES = ["/login", "/registrieren", "/datenschutz", "/nutzungsbedingungen", "/vorschau"];

for (const path of PAGES) {
  test(`keine schweren Barrierefreiheits-Verstöße auf ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length} Stellen, z. B. ${v.nodes[0]?.target.join(" ")})`)).toEqual([]);
  });
}
