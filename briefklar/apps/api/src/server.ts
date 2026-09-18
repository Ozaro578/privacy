import { serve } from "@hono/node-server";
import { createApp, VERSION } from "./app.js";
import { loadConfig } from "./config.js";
import { log } from "./log.js";

const config = loadConfig();
const { app, close } = createApp({ config });

if (!config.anthropicApiKey && !process.env.ANTHROPIC_AUTH_TOKEN) {
  log.warn("server.no_api_key", {
    hint: "ANTHROPIC_API_KEY ist nicht gesetzt – POST /api/explain antwortet mit internal_error, bis der Schlüssel gesetzt ist.",
  });
}

const server = serve({ fetch: app.fetch, port: config.port, hostname: "0.0.0.0" }, (info) => {
  log.info("server.listening", {
    port: info.port,
    version: VERSION,
    model: config.model,
    effort: config.effort,
    rateLimitPer15Min: config.rateLimitPer15Min,
    staticDir: config.staticDir ?? null,
    trustProxy: config.trustProxy,
  });
});

let shuttingDown = false;
function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  log.info("server.shutdown", { signal });
  close();
  const forceExit = setTimeout(() => process.exit(1), 10_000);
  forceExit.unref();
  server.close((err) => {
    if (err) {
      log.error("server.shutdown_error", { errorMessage: err.message });
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
