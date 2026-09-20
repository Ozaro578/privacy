import { defineConfig, devices } from "@playwright/test";

// E2E gegen den Dev-Server mit Platzhalter-Umgebung: öffentliche Seiten und die Vorschau (Lernsession mit Beispieldaten).
const PORT = 3111;
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: process.env["CI"] ? 1 : 0,
  reporter: process.env["CI"] ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}`, locale: "de-DE", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], ...(process.env["PW_CHROMIUM"] ? { launchOptions: { executablePath: process.env["PW_CHROMIUM"] } } : {}) } },
    { name: "phone", use: { ...devices["Pixel 7"], ...(process.env["PW_CHROMIUM"] ? { launchOptions: { executablePath: process.env["PW_CHROMIUM"] } } : {}) } },
  ],
  webServer: {
    command: `node scripts/sync-media.mjs && node scripts/build-palettes.mjs && npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: !process.env["CI"],
    timeout: 180_000,
    env: { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "e2e", SUPABASE_SERVICE_ROLE_KEY: "e2e", NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}` },
  },
});
