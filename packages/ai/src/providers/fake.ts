import type { z } from "zod/v4";
import type { AiProvider, AudioInput, CompletionRequest, CompletionResult, JsonCompletionResult, TranscriptionProvider, Usage } from "../types";

export type FakeReply = string | Record<string, unknown> | ((req: CompletionRequest) => string | Record<string, unknown>);

function estimateTokens(s: string): number {
  return Math.max(1, Math.ceil(s.length / 4));
}

function requestText(req: CompletionRequest): string {
  const parts = req.messages.map((m) => (typeof m.content === "string" ? m.content : m.content.map((p) => (p.type === "text" ? p.text : "[image]")).join("\n")));
  return `${req.system}\n${parts.join("\n")}`;
}

/** Skriptbarer Provider für Tests: Antworten werden der Reihe nach ausgegeben, Requests protokolliert. */
export class FakeProvider implements AiProvider {
  readonly requests: CompletionRequest[] = [];
  private readonly replies: FakeReply[];
  readonly model: string;

  constructor(replies: FakeReply[] = [], opts: { model?: string } = {}) {
    this.replies = [...replies];
    this.model = opts.model ?? "fake-model";
  }

  push(...replies: FakeReply[]): this {
    this.replies.push(...replies);
    return this;
  }

  private next(req: CompletionRequest): string | Record<string, unknown> {
    this.requests.push(req);
    const reply = this.replies.shift();
    if (reply === undefined) throw new Error("FakeProvider: keine skriptierte Antwort mehr vorhanden.");
    return typeof reply === "function" ? reply(req) : reply;
  }

  private usage(req: CompletionRequest, out: string): Usage {
    return { input_tokens: estimateTokens(requestText(req)), output_tokens: estimateTokens(out), model: req.model ?? this.model };
  }

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const reply = this.next(req);
    const text = typeof reply === "string" ? reply : JSON.stringify(reply);
    return { text, usage: this.usage(req, text), stopReason: "end_turn" };
  }

  async completeJson<T>(req: CompletionRequest, schema: z.ZodType<T>): Promise<JsonCompletionResult<T>> {
    const reply = this.next(req);
    const raw: unknown = typeof reply === "string" ? JSON.parse(reply) : reply;
    const data = schema.parse(raw);
    return { data, usage: this.usage(req, JSON.stringify(raw)) };
  }
}

export class FakeTranscriptionProvider implements TranscriptionProvider {
  readonly calls: AudioInput[] = [];
  private readonly texts: string[];

  constructor(texts: string[] = []) {
    this.texts = [...texts];
  }

  async transcribe(audio: AudioInput): Promise<{ text: string }> {
    this.calls.push(audio);
    const text = this.texts.shift();
    if (text === undefined) throw new Error("FakeTranscriptionProvider: kein skriptiertes Transkript mehr vorhanden.");
    return { text };
  }
}
