import type { Config } from "@netlify/functions";
import { LIMITS, isLanguageCode, type LanguageCode } from "@briefklar/shared";
import { explainLetter, type ExplainLetterInput } from "../../apps/api/src/claude.js";
import { AppError } from "../../apps/api/src/errors.js";
import { sniffMediaType } from "../../apps/api/src/media.js";
import { log, errorMeta } from "../../apps/api/src/log.js";
import { JOB_ID, saveJob } from "../lib/jobs.js";

/**
 * POST /api/explain – nimmt Brief-Seiten entgegen, antwortet sofort mit 202 und
 * wertet im Hintergrund aus. Die App holt das Ergebnis unter /api/result/:job ab.
 * Bilder werden nur im Speicher verarbeitet, nie abgelegt.
 */
export default async (req: Request) => {
  let job = "";
  try {
    const form = await req.formData();
    const rawJob = form.get("job");
    if (typeof rawJob !== "string" || !JOB_ID.test(rawJob)) {
      log.warn("explain.badjob", {});
      return;
    }
    job = rawJob;

    const rawLanguage = form.get("language");
    let language: LanguageCode = "de";
    if (rawLanguage !== null) {
      if (typeof rawLanguage !== "string" || !isLanguageCode(rawLanguage)) throw new AppError("invalid_language");
      language = rawLanguage;
    }
    const files = form.getAll("images").filter((f): f is File => typeof f !== "string" && f.size > 0);
    if (files.length === 0) throw new AppError("no_image");
    if (files.length > LIMITS.MAX_IMAGES) throw new AppError("too_many_images");
    if (files.reduce((s, f) => s + f.size, 0) > LIMITS.MAX_TOTAL_BYTES) throw new AppError("image_too_large");

    const images: ExplainLetterInput["images"] = [];
    for (const file of files) {
      if (file.size > LIMITS.MAX_IMAGE_BYTES) throw new AppError("image_too_large");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const mediaType = sniffMediaType(bytes);
      if (!mediaType) throw new AppError("unsupported_media_type");
      images.push({ mediaType, base64: Buffer.from(bytes).toString("base64") });
    }

    const started = Date.now();
    const result = await explainLetter({ images, language });
    await saveJob(job, { status: "done", result });
    log.info("explain.ok", { durationMs: Date.now() - started, language, pages: images.length });
  } catch (err) {
    const appErr = err instanceof AppError ? err : new AppError("internal_error", undefined, { cause: err });
    if (appErr.status >= 500) log.error("explain.error", { code: appErr.code, ...errorMeta(appErr.cause) });
    if (job) await saveJob(job, { status: "error", error: appErr.toBody().error }).catch(() => undefined);
  }
};

export const config: Config = {
  path: "/api/explain",
  method: "POST",
  // Kostenbremse: pro IP höchstens 20 Briefe in 15 Minuten (Netlify-Rate-Limit, liefert 429).
  rateLimit: { windowLimit: 20, windowSize: 900, aggregateBy: ["ip"], action: "rate_limit" },
};
