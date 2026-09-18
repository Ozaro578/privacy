import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod/v4";
import type { AiProvider, ChatMessage, CompletionRequest, CompletionResult, JsonCompletionResult, Usage } from "../types";

/** Standardmodell für dialogische Coach-Antworten. */
export const DEFAULT_COACH_MODEL = "claude-sonnet-5";
/** Standardmodell für Klassifikation und Strukturierung (schnell, günstig). */
export const DEFAULT_FAST_MODEL = "claude-haiku-4-5";

export interface AnthropicProviderOptions {
  /** Standardmodell; per Request über CompletionRequest.model überschreibbar. */
  model?: string;
  /** API-Key. Wird er weggelassen, liest das SDK ANTHROPIC_API_KEY aus der Umgebung. */
  apiKey?: string;
  maxTokens?: number;
  /** Vorkonfigurierter Client (z. B. für Tests oder eigene Timeouts). */
  client?: Anthropic;
}

export class AiRefusalError extends Error {
  constructor(public readonly category: string | null) {
    super("Das Modell hat die Anfrage abgelehnt.");
    this.name = "AiRefusalError";
  }
}

export class AiOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiOutputError";
  }
}

/**
 * Sampling-Parameter (temperature) akzeptieren nur Haiku 4.5, Sonnet 4.5/4.6 und Opus 4.5/4.6 sowie ältere Modelle.
 * Ab Opus 4.7, Sonnet 5 und Opus 5 lehnt die API sie mit 400 ab; dort wird temperature stillschweigend weggelassen.
 */
export function supportsSampling(model: string): boolean {
  return /(haiku|sonnet|opus)-4-[56]/.test(model) || /-3-/.test(model);
}

/** Effort-Steuerung gibt es ab Opus 4.5 sowie auf Sonnet 5 und Opus 5; Haiku 4.5 und Sonnet 4.5 lehnen sie ab. */
export function supportsEffort(model: string): boolean {
  return !/haiku-4-5|sonnet-4-5|-3-/.test(model);
}

function toMessageParam(m: ChatMessage): Anthropic.MessageParam {
  if (typeof m.content === "string") return { role: m.role, content: m.content };
  const blocks: Anthropic.ContentBlockParam[] = m.content.map((p) =>
    p.type === "text"
      ? { type: "text", text: p.text }
      : { type: "image", source: { type: "base64", media_type: p.mimeType, data: p.base64 } },
  );
  return { role: m.role, content: blocks };
}

export class AnthropicProvider implements AiProvider {
  private readonly client: Anthropic;
  readonly model: string;
  private readonly maxTokens: number;

  constructor(opts: AnthropicProviderOptions = {}) {
    this.client = opts.client ?? (opts.apiKey ? new Anthropic({ apiKey: opts.apiKey }) : new Anthropic());
    this.model = opts.model ?? DEFAULT_COACH_MODEL;
    this.maxTokens = opts.maxTokens ?? 4096;
  }

  private buildParams(req: CompletionRequest): Anthropic.MessageCreateParamsNonStreaming {
    const model = req.model ?? this.model;
    const params: Anthropic.MessageCreateParamsNonStreaming = {
      model,
      max_tokens: req.maxTokens ?? this.maxTokens,
      system: req.system,
      messages: req.messages.map(toMessageParam),
    };
    if (req.temperature !== undefined && supportsSampling(model)) params.temperature = req.temperature;
    if (req.effort && supportsEffort(model)) params.output_config = { effort: req.effort };
    return params;
  }

  private static usageOf(msg: Anthropic.Message): Usage {
    return { input_tokens: msg.usage.input_tokens, output_tokens: msg.usage.output_tokens, model: msg.model };
  }

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const msg = await this.client.messages.create(this.buildParams(req));
    if (msg.stop_reason === "refusal") throw new AiRefusalError(msg.stop_details?.category ?? null);
    const text = msg.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
    return { text, usage: AnthropicProvider.usageOf(msg), stopReason: msg.stop_reason };
  }

  async completeJson<T>(req: CompletionRequest, schema: z.ZodType<T>): Promise<JsonCompletionResult<T>> {
    const params = this.buildParams(req);
    const msg = await this.client.messages.parse({
      ...params,
      output_config: { ...(params.output_config ?? {}), format: zodOutputFormat(schema) },
    });
    if (msg.stop_reason === "refusal") throw new AiRefusalError(msg.stop_details?.category ?? null);
    if (msg.stop_reason === "max_tokens") throw new AiOutputError("Die strukturierte Antwort wurde durch max_tokens abgeschnitten.");
    if (msg.parsed_output == null) throw new AiOutputError("Die Antwort des Modells entsprach nicht dem erwarteten Schema.");
    return { data: msg.parsed_output as T, usage: AnthropicProvider.usageOf(msg) };
  }
}
