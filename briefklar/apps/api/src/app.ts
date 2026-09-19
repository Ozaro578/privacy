import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Hono, type Context } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { serveStatic } from "@hono/node-server/serve-static";
import { getConnInfo } from "@hono/node-server/conninfo";
import { LANGUAGES, LIMITS, isLanguageCode, type ExplainResult, type LanguageCode } from "@briefklar/shared";
import { loadConfig, type Config } from "./config.js";
import { AppError } from "./errors.js";
import { explainLetter as defaultExplainLetter, type ExplainLetterInput } from "./claude.js";
import { errorMeta, log } from "./log.js";
import { sniffMediaType } from "./media.js";
import { createRateLimiter } from "./rate-limit.js";

const RATE_WINDOW_MS = 15 * 60 * 1000;
/** Multipart-Overhead (Boundaries, Felder) großzügig einplanen */
const MAX_BODY_BYTES = LIMITS.MAX_TOTAL_BYTES + 1024 * 1024;

function readVersion(): string {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(readFileSync(join(here, "..", "package.json"), "utf8")) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export const VERSION = readVersion();

export interface AppOptions {
  config?: Config;
  explainLetter?: (input: ExplainLetterInput) => Promise<ExplainResult>;
}

export interface App {
  app: Hono;
  config: Config;
  /** Räumt Timer auf (z.B. beim Shutdown oder in Tests) */
  close(): void;
}

function clientIp(c: Context, trustProxy: boolean): string {
  if (trustProxy) {
    // Der letzte Eintrag wurde vom eigenen Edge-Proxy angehängt; alles davor kann der Client fälschen.
    const xff = c.req.header("x-forwarded-for");
    const last = xff?.split(",").map((s) => s.trim()).filter(Boolean).at(-1);
    if (last) return last;
  }
  try {
    const info = getConnInfo(c);
    if (info.remote.address) return info.remote.address;
  } catch {
    // Kein Node-Server-Kontext (z.B. app.request() in Tests)
  }
  return "unknown";
}

function errorResponse(c: Context, err: AppError): Response {
  return c.json(err.toBody(), err.status as 400);
}

export function createApp(options: AppOptions = {}): App {
  const config = options.config ?? loadConfig();
  const explainLetter = options.explainLetter ?? defaultExplainLetter;
  const limiter = createRateLimiter({ limit: config.rateLimitPer15Min, windowMs: RATE_WINDOW_MS });

  const app = new Hono();

  app.use("*", secureHeaders());
  // Die App läuft same-origin (API liefert das Frontend aus). CORS nur, wenn explizit konfiguriert.
  if (config.corsOrigin) {
    app.use(
      "/api/*",
      cors({
        origin: config.corsOrigin === "*" ? "*" : config.corsOrigin.split(",").map((o) => o.trim()),
        allowMethods: ["GET", "POST", "OPTIONS"],
        allowHeaders: ["Content-Type"],
        maxAge: 600,
      }),
    );
  }
  // Cache-Regeln: API nie cachen, App-Shell immer neu prüfen, gehashte Assets lange cachen.
  app.use("*", async (c, next) => {
    await next();
    const p = c.req.path;
    if (p.startsWith("/api/")) c.header("Cache-Control", "no-store");
    else if (p.startsWith("/assets/")) c.header("Cache-Control", "public, max-age=31536000, immutable");
    else if (!c.res.headers.get("Cache-Control")) c.header("Cache-Control", "no-cache");
  });

  app.onError((err, c) => {
    if (err instanceof AppError) {
      if (err.status >= 500) log.error("request.error", { path: c.req.path, code: err.code, ...errorMeta(err.cause) });
      return errorResponse(c, err);
    }
    log.error("request.unhandled", { path: c.req.path, ...errorMeta(err) });
    return errorResponse(c, new AppError("internal_error", undefined, { cause: err }));
  });

  app.notFound((c) => {
    if (c.req.path.startsWith("/api/")) {
      return c.json({ error: { code: "internal_error", message: "Unbekannter Endpunkt." } }, 404);
    }
    return c.text("Not found", 404);
  });

  app.get("/api/health", (c) => c.json({ ok: true, model: config.model, version: VERSION }));

  app.get("/api/languages", (c) => c.json(LANGUAGES));

  app.post(
    "/api/explain",
    async (c, next) => {
      const { allowed, retryAfterSec } = limiter.hit(clientIp(c, config.trustProxy));
      if (!allowed) {
        c.header("Retry-After", String(retryAfterSec));
        throw new AppError("rate_limited");
      }
      await next();
    },
    bodyLimit({
      maxSize: MAX_BODY_BYTES,
      onError: (c) => errorResponse(c, new AppError("image_too_large")),
    }),
    async (c) => {
      const contentType = c.req.header("content-type") ?? "";
      if (!contentType.toLowerCase().includes("multipart/form-data")) {
        throw new AppError("no_image", "Bitte die Bilder als multipart/form-data im Feld „images“ senden.");
      }

      let form: FormData;
      try {
        form = await c.req.formData();
      } catch {
        throw new AppError("no_image", "Die Anfrage konnte nicht gelesen werden. Bitte erneut versuchen.");
      }

      const rawLanguage = form.get("language");
      let language: LanguageCode = "de";
      if (rawLanguage !== null) {
        if (typeof rawLanguage !== "string" || !isLanguageCode(rawLanguage)) {
          throw new AppError("invalid_language");
        }
        language = rawLanguage;
      }

      const files = form
        .getAll("images")
        .filter((f): f is Exclude<ReturnType<FormData["get"]>, string | null> => typeof f !== "string" && f.size > 0);
      if (files.length === 0) throw new AppError("no_image");
      if (files.length > LIMITS.MAX_IMAGES) throw new AppError("too_many_images");

      const images: ExplainLetterInput["images"] = [];
      const totalBytes = files.reduce((s, f) => s + f.size, 0);
      if (totalBytes > LIMITS.MAX_TOTAL_BYTES) throw new AppError("image_too_large");
      for (const file of files) {
        if (file.size > LIMITS.MAX_IMAGE_BYTES) throw new AppError("image_too_large");
        const bytes = new Uint8Array(await file.arrayBuffer());
        const mediaType = sniffMediaType(bytes);
        if (!mediaType) throw new AppError("unsupported_media_type");
        images.push({ mediaType, base64: Buffer.from(bytes).toString("base64") });
      }

      const started = performance.now();
      const result = await explainLetter({ images, language });
      log.info("explain.ok", { durationMs: Math.round(performance.now() - started), language, pages: images.length });
      return c.json(result);
    },
  );

  if (config.staticDir) {
    const root = config.staticDir;
    let indexHtml: string | undefined;
    const loadIndex = (): string | undefined => {
      if (indexHtml === undefined) {
        try {
          indexHtml = readFileSync(join(root, "index.html"), "utf8");
        } catch {
          return undefined;
        }
      }
      return indexHtml;
    };
    app.use("*", serveStatic({ root }));
    // SPA-Fallback: alles außerhalb von /api auf index.html
    app.get("*", (c) => {
      if (c.req.path.startsWith("/api/")) return c.notFound();
      const html = loadIndex();
      if (html === undefined) return c.notFound();
      return c.html(html);
    });
  }

  return {
    app,
    config,
    close: () => limiter.stop(),
  };
}
