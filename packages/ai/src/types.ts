import type { z } from "zod/v4";

/** Unterstützte Oberflächensprachen des Coaches. */
export type Locale = "de" | "en" | "tr" | "ar";
export const LOCALES: readonly Locale[] = ["de", "en", "tr", "ar"];

/** Antwortstil, entspricht coach_messages.style. */
export type AnswerStyle = "simple" | "detailed" | "example" | "mnemonic";

/** Sicherheitsstufe einer Antwort, entspricht coach_messages.confidence. */
export type Confidence = "verified" | "partial" | "uncertain";

/** Quellenangabe einer Antwort, entspricht coach_messages.sources (jsonb). */
export interface Source {
  knowledge_entry_id: string | null;
  question_version_id: string | null;
  title: string;
  legal_reference: string | null;
  legal_basis_date: string | null;
}

/** Nutzungsprotokoll je Aufruf, damit coach_messages.model/input_tokens/output_tokens befüllt werden können. */
export interface Usage {
  input_tokens: number;
  output_tokens: number;
  model: string;
}

export const ZERO_USAGE = (model = "none"): Usage => ({ input_tokens: 0, output_tokens: 0, model });

export function addUsage(...usages: Usage[]): Usage {
  const models = [...new Set(usages.map((u) => u.model).filter((m) => m && m !== "none"))];
  return {
    input_tokens: usages.reduce((s, u) => s + u.input_tokens, 0),
    output_tokens: usages.reduce((s, u) => s + u.output_tokens, 0),
    model: models.length ? models.join("+") : "none",
  };
}

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image"; mimeType: "image/jpeg" | "image/png" | "image/gif" | "image/webp"; base64: string };

export interface ChatMessage {
  role: "user" | "assistant";
  content: string | ContentPart[];
}

export interface CompletionRequest {
  system: string;
  messages: ChatMessage[];
  /** Überschreibt das Standardmodell des Providers. */
  model?: string;
  maxTokens?: number;
  /** Wird nur an Modelle gesendet, die Sampling-Parameter akzeptieren. */
  temperature?: number;
  /** Nur für Modelle mit Effort-Steuerung (z. B. claude-sonnet-5). */
  effort?: "low" | "medium" | "high";
}

export interface CompletionResult {
  text: string;
  usage: Usage;
  stopReason: string | null;
}

export interface JsonCompletionResult<T> {
  data: T;
  usage: Usage;
}

export interface AudioInput {
  bytes: Uint8Array;
  mimeType: string;
  locale: string;
}

export interface AiProvider {
  complete(req: CompletionRequest): Promise<CompletionResult>;
  completeJson<T>(req: CompletionRequest, schema: z.ZodType<T>): Promise<JsonCompletionResult<T>>;
  transcribe?(audio: AudioInput): Promise<{ text: string }>;
}

export interface TranscriptionProvider {
  transcribe(audio: AudioInput): Promise<{ text: string }>;
}
