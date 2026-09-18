import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { LANGUAGES, LIMITS, type ExplainResult } from "@briefklar/shared";
import { createApp, type App } from "../src/app.js";
import { loadConfig, type Config } from "../src/config.js";

const explainLetterMock = vi.fn();

vi.mock("../src/claude.js", () => ({
  explainLetter: (...args: unknown[]) => explainLetterMock(...args),
}));

const RESULT: ExplainResult = {
  language: "de",
  is_readable: true,
  quality_hint: null,
  document_type: "Bescheid",
  sender: {
    name: "Jobcenter Musterstadt",
    type: "behoerde",
    contact: { phone: "0123 456789", email: null, website: null, address: "Musterstraße 1, 12345 Musterstadt", office_hours: "Mo–Fr 8–12 Uhr" },
  },
  reference_number: "123/456",
  letter_date: "2026-09-01",
  summary: "Das Jobcenter hat deinen Antrag bewilligt.",
  what_it_means: "Du bekommst ab Oktober Geld.",
  urgency: "nur_info",
  appointments: [],
  deadlines: [],
  actions: [{ step: 1, text: "Brief aufbewahren.", required: false }],
  money: { direction: "bekommen", amount: "563,00 €", details: "monatlich" },
  payment: null,
  can_object: null,
  glossary: [{ term_de: "Bescheid", explanation: "Eine offizielle Entscheidung." }],
  where_to_get_help: [{ name: "Sozialberatung", how: "Hilft beim Verstehen." }],
  scam_risk: "niedrig",
  warnings: [],
  confidence: "hoch",
};

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 1, 2, 3, 4]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 2, 3, 4]);
const PDF = new TextEncoder().encode("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF\n");

function testConfig(overrides: Partial<Config> = {}): Config {
  return { ...loadConfig({}), anthropicApiKey: "test-key", rateLimitPer15Min: 100, ...overrides };
}

function multipart(parts: { language?: string; files?: Array<{ bytes: Uint8Array; type: string; name?: string }> }): FormData {
  const fd = new FormData();
  if (parts.language !== undefined) fd.set("language", parts.language);
  for (const f of parts.files ?? []) {
    fd.append("images", new Blob([f.bytes], { type: f.type }), f.name ?? "scan");
  }
  return fd;
}

describe("api", () => {
  let built: App;

  beforeEach(() => {
    explainLetterMock.mockReset();
    explainLetterMock.mockResolvedValue(RESULT);
    built = createApp({ config: testConfig() });
  });
  afterEach(() => built.close());

  it("GET /api/health", async () => {
    const res = await built.app.request("/api/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, model: "claude-opus-5" });
    expect(typeof body.version).toBe("string");
  });

  it("GET /api/languages", async () => {
    const res = await built.app.request("/api/languages");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(LANGUAGES);
  });

  it("POST /api/explain without images -> no_image 400", async () => {
    const res = await built.app.request("/api/explain", { method: "POST", body: multipart({ language: "de" }) });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: { code: "no_image", message: expect.any(String) } });
    expect(explainLetterMock).not.toHaveBeenCalled();
  });

  it("POST /api/explain without multipart body -> no_image 400", async () => {
    const res = await built.app.request("/api/explain", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ language: "de" }),
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("no_image");
  });

  it("POST /api/explain with too many images -> too_many_images 400", async () => {
    const files = Array.from({ length: LIMITS.MAX_IMAGES + 1 }, () => ({ bytes: PNG, type: "image/png" }));
    const res = await built.app.request("/api/explain", { method: "POST", body: multipart({ files }) });
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("too_many_images");
  });

  it("POST /api/explain with text file claiming image/png -> unsupported_media_type 415", async () => {
    const bytes = new TextEncoder().encode("Das ist kein Bild, sondern ein Textdokument.");
    const res = await built.app.request("/api/explain", {
      method: "POST",
      body: multipart({ files: [{ bytes, type: "image/png", name: "fake.png" }] }),
    });
    expect(res.status).toBe(415);
    expect((await res.json()).error.code).toBe("unsupported_media_type");
    expect(explainLetterMock).not.toHaveBeenCalled();
  });

  it("POST /api/explain with invalid language -> invalid_language 400", async () => {
    const res = await built.app.request("/api/explain", {
      method: "POST",
      body: multipart({ language: "xx", files: [{ bytes: PNG, type: "image/png" }] }),
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("invalid_language");
  });

  it("POST /api/explain with oversized image -> image_too_large 413", async () => {
    const big = new Uint8Array(LIMITS.MAX_IMAGE_BYTES + 1);
    big.set(PNG);
    const res = await built.app.request("/api/explain", {
      method: "POST",
      body: multipart({ files: [{ bytes: big, type: "image/png" }] }),
    });
    expect(res.status).toBe(413);
    expect((await res.json()).error.code).toBe("image_too_large");
  });

  it("POST /api/explain success returns the ExplainResult and passes sniffed types", async () => {
    const res = await built.app.request("/api/explain", {
      method: "POST",
      body: multipart({
        language: "tr",
        files: [
          { bytes: JPEG, type: "application/octet-stream" },
          { bytes: PDF, type: "image/png" },
        ],
      }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(RESULT);
    expect(explainLetterMock).toHaveBeenCalledTimes(1);
    const input = explainLetterMock.mock.calls[0]![0] as { language: string; images: Array<{ mediaType: string; base64: string }> };
    expect(input.language).toBe("tr");
    expect(input.images.map((i) => i.mediaType)).toEqual(["image/jpeg", "application/pdf"]);
    expect(input.images[0]!.base64).toBe(Buffer.from(JPEG).toString("base64"));
  });

  it("language defaults to de", async () => {
    await built.app.request("/api/explain", { method: "POST", body: multipart({ files: [{ bytes: PNG, type: "image/png" }] }) });
    expect(explainLetterMock.mock.calls[0]![0]).toMatchObject({ language: "de" });
  });

  it("maps AppError from explainLetter (refused -> 422)", async () => {
    const { AppError } = await import("../src/errors.js");
    explainLetterMock.mockRejectedValueOnce(new AppError("refused"));
    const res = await built.app.request("/api/explain", { method: "POST", body: multipart({ files: [{ bytes: PNG, type: "image/png" }] }) });
    expect(res.status).toBe(422);
    expect((await res.json()).error.code).toBe("refused");
  });

  it("unknown errors become internal_error 500 without leaking details", async () => {
    explainLetterMock.mockRejectedValueOnce(new Error("secret internal detail"));
    const res = await built.app.request("/api/explain", { method: "POST", body: multipart({ files: [{ bytes: PNG, type: "image/png" }] }) });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("internal_error");
    expect(body.error.message).not.toContain("secret");
  });

  it("rate limit triggers 429 rate_limited", async () => {
    built.close();
    built = createApp({ config: testConfig({ rateLimitPer15Min: 2 }) });
    const send = () => built.app.request("/api/explain", { method: "POST", body: multipart({ files: [{ bytes: PNG, type: "image/png" }] }) });
    expect((await send()).status).toBe(200);
    expect((await send()).status).toBe(200);
    const third = await send();
    expect(third.status).toBe(429);
    expect(third.headers.get("retry-after")).toMatch(/^\d+$/);
    expect((await third.json()).error.code).toBe("rate_limited");
    expect(explainLetterMock).toHaveBeenCalledTimes(2);
  });

  it("rate limit keys by X-Forwarded-For only when TRUST_PROXY is set", async () => {
    built.close();
    built = createApp({ config: testConfig({ rateLimitPer15Min: 1, trustProxy: true }) });
    const send = (ip: string) =>
      built.app.request("/api/explain", {
        method: "POST",
        headers: { "x-forwarded-for": `${ip}, 10.0.0.1` },
        body: multipart({ files: [{ bytes: PNG, type: "image/png" }] }),
      });
    expect((await send("1.1.1.1")).status).toBe(200);
    expect((await send("1.1.1.1")).status).toBe(429);
    expect((await send("2.2.2.2")).status).toBe(200);

    built.close();
    built = createApp({ config: testConfig({ rateLimitPer15Min: 1, trustProxy: false }) });
    expect((await send("3.3.3.3")).status).toBe(200);
    // Header wird ignoriert -> gleicher Schlüssel -> limitiert
    expect((await send("4.4.4.4")).status).toBe(429);
  });

  it("sets CORS and security headers", async () => {
    const res = await built.app.request("/api/health", { headers: { origin: "https://example.org" } });
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
  });
});
