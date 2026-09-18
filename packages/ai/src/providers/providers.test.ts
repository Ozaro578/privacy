import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { createAiServices } from "../config";
import { AiRefusalError, AnthropicProvider, DEFAULT_COACH_MODEL, DEFAULT_FAST_MODEL, supportsEffort, supportsSampling } from "./anthropic";
import { FakeProvider, FakeTranscriptionProvider } from "./fake";
import { WhisperHttpTranscriptionProvider } from "./whisper";

describe("FakeProvider", () => {
  it("gibt skriptierte Antworten aus, validiert JSON gegen das Schema und protokolliert Nutzung", async () => {
    const p = new FakeProvider(["Hallo", { a: 1 }]);
    const t = await p.complete({ system: "s", messages: [{ role: "user", content: "hi" }] });
    expect(t.text).toBe("Hallo");
    expect(t.usage).toEqual({ input_tokens: expect.any(Number), output_tokens: 2, model: "fake-model" });
    const j = await p.completeJson({ system: "s", messages: [{ role: "user", content: "hi" }], model: "custom" }, z.object({ a: z.number() }));
    expect(j.data).toEqual({ a: 1 });
    expect(j.usage.model).toBe("custom");
    await expect(p.complete({ system: "s", messages: [] })).rejects.toThrow("keine skriptierte Antwort");
    await expect(new FakeProvider([{ a: "x" }]).completeJson({ system: "", messages: [] }, z.object({ a: z.number() }))).rejects.toThrow();
  });

  it("FakeTranscriptionProvider liefert Transkripte der Reihe nach", async () => {
    const t = new FakeTranscriptionProvider(["Heute Einparken geübt."]);
    const res = await t.transcribe({ bytes: new Uint8Array([1, 2]), mimeType: "audio/webm", locale: "de" });
    expect(res.text).toBe("Heute Einparken geübt.");
    expect(t.calls).toHaveLength(1);
  });
});

describe("WhisperHttpTranscriptionProvider", () => {
  it("sendet multipart/form-data mit Bearer-Key an den konfigurierten Endpoint", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fakeFetch: typeof fetch = async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(JSON.stringify({ text: "  Schulterblick fehlte.  " }), { status: 200, headers: { "content-type": "application/json" } });
    };
    const stt = new WhisperHttpTranscriptionProvider({ endpoint: "https://stt.example/v1/audio/transcriptions", apiKey: "k-test", fetch: fakeFetch });
    const res = await stt.transcribe({ bytes: new Uint8Array([1, 2, 3]), mimeType: "audio/webm;codecs=opus", locale: "de-DE" });
    expect(res.text).toBe("Schulterblick fehlte.");
    const call = calls[0]!;
    expect(call.url).toBe("https://stt.example/v1/audio/transcriptions");
    expect((call.init.headers as Record<string, string>).Authorization).toBe("Bearer k-test");
    const form = call.init.body as FormData;
    expect(form.get("model")).toBe("whisper-1");
    expect(form.get("language")).toBe("de");
    expect((form.get("file") as File).name).toBe("note.webm");
  });

  it("wirft bei HTTP-Fehlern und fehlender Konfiguration", async () => {
    const failing: typeof fetch = async () => new Response("nope", { status: 500 });
    const stt = new WhisperHttpTranscriptionProvider({ endpoint: "https://stt.example", apiKey: "k", fetch: failing });
    await expect(stt.transcribe({ bytes: new Uint8Array(), mimeType: "audio/wav", locale: "de" })).rejects.toThrow("HTTP 500");
    expect(() => new WhisperHttpTranscriptionProvider({ endpoint: "", apiKey: "k" })).toThrow("STT_ENDPOINT");
    expect(() => new WhisperHttpTranscriptionProvider({ endpoint: "https://x", apiKey: "" })).toThrow("STT_API_KEY");
  });
});

type CreateParams = Anthropic.MessageCreateParamsNonStreaming;

function stubClient(handler: (p: CreateParams) => Partial<Anthropic.Message>) {
  const captured: CreateParams[] = [];
  const build = (p: CreateParams) => {
    captured.push(p);
    return {
      id: "msg_1",
      type: "message",
      role: "assistant",
      model: p.model,
      content: [{ type: "text", text: "ok", citations: null }],
      stop_reason: "end_turn",
      stop_sequence: null,
      stop_details: null,
      usage: { input_tokens: 11, output_tokens: 7, cache_creation_input_tokens: null, cache_read_input_tokens: null, server_tool_use: null, service_tier: null },
      ...handler(p),
    };
  };
  const client = {
    messages: {
      create: async (p: CreateParams) => build(p),
      parse: async (p: CreateParams) => ({ ...build(p), parsed_output: { ok: true } }),
    },
  } as unknown as Anthropic;
  return { client, captured };
}

describe("AnthropicProvider", () => {
  it("nutzt Standardmodelle ohne Datumssuffix", () => {
    expect(DEFAULT_COACH_MODEL).toBe("claude-sonnet-5");
    expect(DEFAULT_FAST_MODEL).toBe("claude-haiku-4-5");
  });

  it("sendet temperature und effort nur an Modelle, die sie akzeptieren", async () => {
    expect(supportsSampling("claude-haiku-4-5")).toBe(true);
    expect(supportsSampling("claude-sonnet-5")).toBe(false);
    expect(supportsSampling("claude-opus-4-7")).toBe(false);
    expect(supportsEffort("claude-haiku-4-5")).toBe(false);
    expect(supportsEffort("claude-sonnet-5")).toBe(true);

    const { client, captured } = stubClient(() => ({}));
    const sonnet = new AnthropicProvider({ client, model: "claude-sonnet-5" });
    const res = await sonnet.complete({ system: "sys", messages: [{ role: "user", content: "hi" }], temperature: 0.2, effort: "low", maxTokens: 99 });
    expect(res.text).toBe("ok");
    expect(res.usage).toEqual({ input_tokens: 11, output_tokens: 7, model: "claude-sonnet-5" });
    expect(captured[0]).toMatchObject({ model: "claude-sonnet-5", max_tokens: 99, system: "sys", output_config: { effort: "low" } });
    expect(captured[0]).not.toHaveProperty("temperature");

    const haiku = new AnthropicProvider({ client, model: "claude-haiku-4-5" });
    await haiku.complete({ system: "sys", messages: [{ role: "user", content: "hi" }], temperature: 0.2, effort: "low" });
    expect(captured[1]).toMatchObject({ temperature: 0.2 });
    expect(captured[1]).not.toHaveProperty("output_config");
  });

  it("liefert strukturierte Ausgaben über output_config.format und Bilder als base64-Blöcke", async () => {
    const { client, captured } = stubClient(() => ({}));
    const p = new AnthropicProvider({ client });
    const res = await p.completeJson({ system: "s", messages: [{ role: "user", content: [{ type: "image", mimeType: "image/png", base64: "aGk=" }, { type: "text", text: "was?" }] }] }, z.object({ ok: z.boolean() }));
    expect(res.data).toEqual({ ok: true });
    const params = captured[0]!;
    expect(params.output_config?.format?.type).toBe("json_schema");
    const content = params.messages[0]!.content as Anthropic.ContentBlockParam[];
    expect(content[0]).toEqual({ type: "image", source: { type: "base64", media_type: "image/png", data: "aGk=" } });
  });

  it("wirft bei Ablehnung durch das Modell", async () => {
    const { client } = stubClient(() => ({ stop_reason: "refusal", stop_details: { type: "refusal", category: "general_harms", explanation: null } as unknown as Anthropic.RefusalStopDetails }));
    const p = new AnthropicProvider({ client });
    await expect(p.complete({ system: "s", messages: [{ role: "user", content: "x" }] })).rejects.toBeInstanceOf(AiRefusalError);
  });
});

describe("createAiServices", () => {
  it("liefert null-Provider ohne Keys und konfigurierte Provider mit Keys", () => {
    const empty = createAiServices({});
    expect(empty.coach).toBeNull();
    expect(empty.fast).toBeNull();
    expect(empty.transcription).toBeNull();
    expect(empty.models).toEqual({ coach: "claude-sonnet-5", fast: "claude-haiku-4-5" });

    const full = createAiServices({ ANTHROPIC_API_KEY: "sk-test", AI_MODEL_COACH: "claude-opus-5", STT_ENDPOINT: "https://stt", STT_API_KEY: "k" });
    expect(full.coach).toBeInstanceOf(AnthropicProvider);
    expect((full.coach as AnthropicProvider).model).toBe("claude-opus-5");
    expect((full.fast as AnthropicProvider).model).toBe("claude-haiku-4-5");
    expect(full.transcription).toBeInstanceOf(WhisperHttpTranscriptionProvider);
  });
});
