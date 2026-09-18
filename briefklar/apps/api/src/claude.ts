import Anthropic from "@anthropic-ai/sdk";
import type { AutoParseableOutputFormat } from "@anthropic-ai/sdk/lib/parser";
import { ExplainResult, type LanguageCode } from "@briefklar/shared";
import { loadConfig, type Config } from "./config.js";
import { AppError } from "./errors.js";
import { zodToJsonSchema } from "./json-schema.js";
import { errorMeta, log } from "./log.js";
import { SYSTEM_PROMPT, buildUserInstruction } from "./prompt.js";

export type ImageMediaType = "image/jpeg" | "image/png" | "image/webp";
export type LetterMediaType = ImageMediaType | "application/pdf";

export interface LetterFile {
  mediaType: LetterMediaType;
  /** Base64 ohne Zeilenumbrüche */
  base64: string;
}

export interface ExplainLetterInput {
  images: LetterFile[];
  language: LanguageCode;
}

export interface ExplainLetterDeps {
  client?: Anthropic;
  config?: Config;
}

/**
 * Structured-Output-Format für `messages.parse()`. Entspricht dem, was
 * `zodOutputFormat(ExplainResult)` liefern würde – siehe json-schema.ts, warum
 * wir das Zod-v3-Schema selbst übersetzen.
 */
export const EXPLAIN_OUTPUT_FORMAT: AutoParseableOutputFormat<ExplainResult> = {
  type: "json_schema",
  schema: zodToJsonSchema(ExplainResult),
  parse: (content: string) => ExplainResult.parse(JSON.parse(content)),
};

let defaultClient: Anthropic | undefined;

function getClient(config: Config): Anthropic {
  if (!config.anthropicApiKey && !process.env.ANTHROPIC_AUTH_TOKEN) {
    throw new AppError("internal_error", undefined, {
      cause: new Error("ANTHROPIC_API_KEY ist nicht gesetzt – der Server kann keine Briefe auswerten."),
    });
  }
  defaultClient ??= new Anthropic({ maxRetries: 2, timeout: 5 * 60 * 1000 });
  return defaultClient;
}

export function buildContentBlocks(images: LetterFile[]): Anthropic.ContentBlockParam[] {
  return images.map((img): Anthropic.ContentBlockParam => {
    if (img.mediaType === "application/pdf") {
      return {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: img.base64 },
      };
    }
    return {
      type: "image",
      source: { type: "base64", media_type: img.mediaType, data: img.base64 },
    };
  });
}

/**
 * Schickt die Seiten des Briefes an Claude und liefert das strukturierte Ergebnis.
 * Loggt ausschließlich Metadaten (Dauer, Tokens, Sprache, Seitenzahl).
 */
export async function explainLetter(
  input: ExplainLetterInput,
  deps: ExplainLetterDeps = {},
): Promise<ExplainResult> {
  const config = deps.config ?? loadConfig();
  const client = deps.client ?? getClient(config);
  const { images, language } = input;
  const started = performance.now();

  try {
    const response = await client.messages.parse({
      model: config.model,
      max_tokens: 8000,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      thinking: { type: "adaptive" },
      output_config: { effort: config.effort, format: EXPLAIN_OUTPUT_FORMAT },
      messages: [
        {
          role: "user",
          content: [...buildContentBlocks(images), { type: "text", text: buildUserInstruction(language, images.length) }],
        },
      ],
    });

    const usage = response.usage;
    log.info("claude.explain", {
      durationMs: Math.round(performance.now() - started),
      model: response.model,
      language,
      pages: images.length,
      stopReason: response.stop_reason,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      cacheReadInputTokens: usage.cache_read_input_tokens ?? 0,
      cacheCreationInputTokens: usage.cache_creation_input_tokens ?? 0,
    });

    if (response.stop_reason === "refusal") {
      throw new AppError("refused", undefined, {
        cause: new Error(`refusal: ${response.stop_details?.category ?? "unknown"}`),
      });
    }
    if (response.stop_reason === "max_tokens") {
      throw new AppError("upstream_error", undefined, { cause: new Error("max_tokens erreicht") });
    }
    if (response.parsed_output == null) {
      throw new AppError("upstream_error", undefined, { cause: new Error("Keine strukturierte Antwort erhalten") });
    }
    return response.parsed_output;
  } catch (err) {
    if (err instanceof AppError) throw err;
    log.warn("claude.error", {
      durationMs: Math.round(performance.now() - started),
      language,
      pages: images.length,
      ...errorMeta(err),
    });
    if (err instanceof Anthropic.RateLimitError) {
      throw new AppError("rate_limited", undefined, { cause: err });
    }
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.APIError) {
      throw new AppError("upstream_error", undefined, { cause: err });
    }
    // Parsing-Fehler (AnthropicError) oder Zod-Validierung: unbrauchbare Antwort
    throw new AppError("upstream_error", undefined, { cause: err });
  }
}
