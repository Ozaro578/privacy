import { defineConfig } from "vitest/config";

// Tests laufen in Node ohne React Native: nur reine Module unter src/offline und src/lib werden geladen.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
