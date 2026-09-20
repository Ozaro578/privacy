import { ApiError, ExplainResult, type LanguageCode } from "@briefklar/shared";
import { t } from "./i18n";

export type ExplainErrorCode = ApiError["error"]["code"] | "network" | "invalid_response" | "cancelled";

export class ExplainError extends Error {
  readonly code: ExplainErrorCode;
  readonly status: number | null;
  constructor(code: ExplainErrorCode, message: string, status: number | null = null) {
    super(message);
    this.name = "ExplainError";
    this.code = code;
    this.status = status;
  }
}

const POLL_MS = 2000;
const POLL_TIMEOUT_MS = 4 * 60 * 1000;

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(id);
      reject(new DOMException("aborted", "AbortError"));
    }, { once: true });
  });
}

async function doFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, credentials: "same-origin" });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw new ExplainError("cancelled", t("cancelled"));
    throw new ExplainError("network", t("network_error"));
  }
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function throwApiError(json: unknown, status: number): never {
  const parsed = ApiError.safeParse(json);
  if (parsed.success) throw new ExplainError(parsed.data.error.code, parsed.data.error.message, status);
  if (status === 429) throw new ExplainError("rate_limited", t("network_error"), status);
  throw new ExplainError("internal_error", t("invalid_response"), status);
}

function parseResult(json: unknown, status: number): ExplainResult {
  const parsed = ExplainResult.safeParse(json);
  if (!parsed.success) {
    console.warn("ExplainResult validation failed", parsed.error.issues);
    throw new ExplainError("invalid_response", t("invalid_response"), status);
  }
  return parsed.data;
}

/**
 * POST /api/explain – multipart. Relative URL: im Dev proxyt Vite, in Prod liefert der Server die App aus.
 * Zwei Server-Varianten: Node-API antwortet direkt mit 200 + Ergebnis; Netlify antwortet mit 202,
 * dann wird /api/result/:job abgefragt, bis das Ergebnis da ist.
 */
export async function explain(files: File[], language: LanguageCode, signal?: AbortSignal): Promise<ExplainResult> {
  const job = crypto.randomUUID();
  const form = new FormData();
  form.append("language", language);
  form.append("job", job);
  for (const f of files) form.append("images", f, f.name);

  const res = await doFetch("/api/explain", { method: "POST", body: form, signal });
  if (res.status === 202) return pollResult(job, signal);
  const json = await readJson(res);
  if (!res.ok) throwApiError(json, res.status);
  return parseResult(json, res.status);
}

async function pollResult(job: string, signal?: AbortSignal): Promise<ExplainResult> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_MS, signal).catch(() => {
      throw new ExplainError("cancelled", t("cancelled"));
    });
    const res = await doFetch(`/api/result/${job}`, { method: "GET", cache: "no-store", signal });
    if (res.status === 202) continue;
    const json = (await readJson(res)) as { status?: string; result?: unknown; error?: unknown } | null;
    if (!res.ok) throwApiError(json, res.status);
    if (json?.status === "done") return parseResult(json.result, res.status);
    if (json?.status === "error") throwApiError({ error: json.error }, 500);
    throw new ExplainError("invalid_response", t("invalid_response"), res.status);
  }
  throw new ExplainError("upstream_error", t("err_upstream"), null);
}

export async function health(): Promise<boolean> {
  try {
    const res = await fetch("/api/health", { cache: "no-store" });
    if (!res.ok) return false;
    const json = (await res.json()) as { ok?: boolean };
    return json.ok === true;
  } catch {
    return false;
  }
}
