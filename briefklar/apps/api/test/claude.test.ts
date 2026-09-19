import { describe, expect, it, vi } from "vitest";
import Anthropic from "@anthropic-ai/sdk";
import { ExplainResult } from "@briefklar/shared";
import { EXPLAIN_OUTPUT_FORMAT, explainLetter } from "../src/claude.js";
import { AppError } from "../src/errors.js";
import { loadConfig } from "../src/config.js";
import { SYSTEM_PROMPT } from "../src/prompt.js";

const RESULT = {
  language: "en",
  is_readable: true,
  quality_hint: null,
  document_type: "Notice",
  sender: { name: "Finanzamt", type: "behoerde", contact: { phone: null, email: null, website: null, address: null, office_hours: null } },
  reference_number: null,
  letter_date: null,
  summary: "Tax notice.",
  what_it_means: "You owe money.",
  urgency: "diese_woche",
  appointments: [
    { date: "2026-10-05", time: "09:30", duration_minutes: null, title: "Termin Finanzamt", location: "Zimmer 12", notes: null, mandatory: true },
  ],
  deadlines: [{ date: "2026-10-01", description: "Pay", consequence_if_missed: "Late fee" }],
  actions: [{ step: 1, text: "Pay the amount.", required: true }],
  money: { direction: "zahlen", amount: "120,00 €", details: null },
  payment: { recipient: "Finanzamt", iban: "DE02120300000000202051", bic: null, reference: "123/456", amount_eur: 120, due_date: "2026-10-01" },
  can_object: "You can file an Einspruch within one month.",
  glossary: [{ term_de: "Einspruch", explanation: "Formal objection." }],
  where_to_get_help: [],
  scam_risk: "niedrig",
  warnings: [],
  confidence: "hoch",
} satisfies ExplainResult;

function fakeResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: "msg_1",
    type: "message",
    role: "assistant",
    model: "claude-opus-5",
    content: [{ type: "text", text: JSON.stringify(RESULT) }],
    stop_reason: "end_turn",
    stop_sequence: null,
    stop_details: null,
    usage: { input_tokens: 1200, output_tokens: 600, cache_read_input_tokens: 1000, cache_creation_input_tokens: 0 },
    parsed_output: RESULT,
    ...overrides,
  };
}

function fakeClient(impl: (params: unknown) => unknown) {
  const parse = vi.fn(async (params: unknown) => impl(params));
  return { client: { messages: { parse } } as unknown as Anthropic, parse };
}

const config = { ...loadConfig({}), anthropicApiKey: "test-key", model: "claude-opus-5", effort: "high" as const };

const input = {
  language: "en" as const,
  images: [
    { mediaType: "image/jpeg" as const, base64: "AAAA" },
    { mediaType: "application/pdf" as const, base64: "BBBB" },
  ],
};

describe("explainLetter", () => {
  it("builds the request with image + document blocks, cached system prompt, adaptive thinking and structured output", async () => {
    const { client, parse } = fakeClient(() => fakeResponse());
    const result = await explainLetter(input, { client, config });
    expect(result).toEqual(RESULT);

    expect(parse).toHaveBeenCalledTimes(1);
    const params = parse.mock.calls[0]![0] as Record<string, any>;
    expect(params.model).toBe("claude-opus-5");
    expect(params.max_tokens).toBe(16000);
    expect(params.thinking).toEqual({ type: "adaptive" });
    expect(params.system).toEqual([{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }]);
    expect(params.output_config.effort).toBe("high");
    expect(params.output_config.format).toBe(EXPLAIN_OUTPUT_FORMAT);
    expect(params.output_config.format.type).toBe("json_schema");

    expect(params.messages).toHaveLength(1);
    const content = params.messages[0].content as Array<Record<string, any>>;
    expect(content[0]).toEqual({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: "AAAA" } });
    expect(content[1]).toEqual({ type: "document", source: { type: "base64", media_type: "application/pdf", data: "BBBB" } });
    expect(content[2].type).toBe("text");
    expect(content[2].text).toContain("2 Bilder");
    expect(content[2].text).toContain("Code: en");
  });

  it("output format schema mirrors ExplainResult and parse validates with zod", () => {
    const schema = EXPLAIN_OUTPUT_FORMAT.schema as Record<string, any>;
    expect(schema.type).toBe("object");
    expect(schema.additionalProperties).toBe(false);
    expect(Object.keys(schema.properties).sort()).toEqual(Object.keys(ExplainResult.shape).sort());
    expect(schema.required.sort()).toEqual(Object.keys(ExplainResult.shape).sort());
    // Wie zodOutputFormat(): das SDK verschiebt enum/min/max in die description; zod prüft clientseitig.
    expect(schema.properties.urgency.type).toBe("string");
    expect(schema.properties.urgency.description).toContain('"diese_woche"');
    expect(schema.properties.sender.properties.contact.properties.phone.anyOf).toEqual([{ type: "string" }, { type: "null" }]);
    expect(schema.properties.payment.anyOf[0].properties.amount_eur.anyOf[0].type).toBe("number");
    expect(schema.properties.appointments.items.required).toContain("mandatory");
    expect(schema.properties.quality_hint.anyOf).toEqual([{ type: "string" }, { type: "null" }]);
    expect(schema.properties.actions.items.properties.step.type).toBe("integer");
    expect(schema.properties.sender.properties.type.description).toContain('"behoerde"');

    expect(EXPLAIN_OUTPUT_FORMAT.parse(JSON.stringify(RESULT))).toEqual(RESULT);
    expect(() => EXPLAIN_OUTPUT_FORMAT.parse(JSON.stringify({ ...RESULT, urgency: "morgen" }))).toThrow();
  });

  it("maps refusal to AppError 'refused'", async () => {
    const { client } = fakeClient(() =>
      fakeResponse({ stop_reason: "refusal", stop_details: { type: "refusal", category: "other", explanation: null }, parsed_output: null, content: [] }),
    );
    await expect(explainLetter(input, { client, config })).rejects.toMatchObject({ code: "refused", status: 422 });
  });

  it("maps missing parsed_output to 'upstream_error'", async () => {
    const { client } = fakeClient(() => fakeResponse({ parsed_output: null }));
    await expect(explainLetter(input, { client, config })).rejects.toMatchObject({ code: "upstream_error", status: 502 });
  });

  it("maps SDK errors: RateLimitError -> rate_limited, AuthenticationError/APIError -> upstream_error", async () => {
    const rl = fakeClient(() => {
      throw new Anthropic.RateLimitError(429, { type: "error", error: { type: "rate_limit_error", message: "slow down" } }, "slow down", new Headers());
    });
    await expect(explainLetter(input, { client: rl.client, config })).rejects.toMatchObject({ code: "rate_limited", status: 429 });

    const auth = fakeClient(() => {
      throw new Anthropic.AuthenticationError(401, { type: "error", error: { type: "authentication_error", message: "bad key" } }, "bad key", new Headers());
    });
    await expect(explainLetter(input, { client: auth.client, config })).rejects.toMatchObject({ code: "upstream_error", status: 502 });

    const api = fakeClient(() => {
      throw new Anthropic.InternalServerError(500, { type: "error", error: { type: "api_error", message: "boom" } }, "boom", new Headers());
    });
    await expect(explainLetter(input, { client: api.client, config })).rejects.toMatchObject({ code: "upstream_error", status: 502 });
  });

  it("fails clearly with internal_error when no API key is configured", async () => {
    const saved = process.env.ANTHROPIC_AUTH_TOKEN;
    delete process.env.ANTHROPIC_AUTH_TOKEN;
    try {
      const err = await explainLetter(input, { config: { ...config, anthropicApiKey: undefined } }).catch((e) => e);
      expect(err).toBeInstanceOf(AppError);
      expect(err.code).toBe("internal_error");
      expect(String((err as AppError).cause)).toContain("ANTHROPIC_API_KEY");
    } finally {
      if (saved !== undefined) process.env.ANTHROPIC_AUTH_TOKEN = saved;
    }
  });
});
