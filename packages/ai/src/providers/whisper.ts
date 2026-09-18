import type { AudioInput, TranscriptionProvider } from "../types";

export interface WhisperHttpOptions {
  /** Vollständige URL des Transkriptions-Endpunkts, z. B. https://api.openai.com/v1/audio/transcriptions */
  endpoint: string;
  apiKey: string;
  /** Modellname des Anbieters (Standard: whisper-1). */
  model?: string;
  /** Eigene fetch-Implementierung (Tests, Proxies). */
  fetch?: typeof fetch;
  timeoutMs?: number;
}

const EXTENSIONS: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/m4a": "m4a",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/flac": "flac",
};

/**
 * Speech-to-Text über eine OpenAI-Whisper-kompatible HTTP-API (multipart/form-data, Feld "file").
 * Endpoint und Key kommen ausschließlich aus der Konfiguration (STT_ENDPOINT, STT_API_KEY).
 */
export class WhisperHttpTranscriptionProvider implements TranscriptionProvider {
  private readonly opts: Required<Omit<WhisperHttpOptions, "fetch">> & { fetch: typeof fetch };

  constructor(opts: WhisperHttpOptions) {
    if (!opts.endpoint) throw new Error("STT_ENDPOINT fehlt.");
    if (!opts.apiKey) throw new Error("STT_API_KEY fehlt.");
    this.opts = {
      endpoint: opts.endpoint,
      apiKey: opts.apiKey,
      model: opts.model ?? "whisper-1",
      fetch: opts.fetch ?? globalThis.fetch,
      timeoutMs: opts.timeoutMs ?? 60_000,
    };
  }

  async transcribe(audio: AudioInput): Promise<{ text: string }> {
    const ext = EXTENSIONS[audio.mimeType.split(";")[0]?.trim() ?? ""] ?? "bin";
    const form = new FormData();
    const bytes = new Uint8Array(audio.bytes);
    form.append("file", new Blob([bytes], { type: audio.mimeType }), `note.${ext}`);
    form.append("model", this.opts.model);
    form.append("language", audio.locale.slice(0, 2));
    form.append("response_format", "json");

    const res = await this.opts.fetch(this.opts.endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.opts.apiKey}` },
      body: form,
      signal: AbortSignal.timeout(this.opts.timeoutMs),
    });
    if (!res.ok) throw new Error(`Transkription fehlgeschlagen (HTTP ${res.status}).`);
    const json = (await res.json()) as { text?: unknown };
    if (typeof json.text !== "string") throw new Error("Transkription lieferte kein Textfeld.");
    return { text: json.text.trim() };
  }
}
