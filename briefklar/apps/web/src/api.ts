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

/**
 * POST /api/explain – multipart. Relative URL: im Dev proxyt Vite, in Prod liefert die API die App aus.
 */
export async function explain(files: File[], language: LanguageCode, signal?: AbortSignal): Promise<ExplainResult> {
  const form = new FormData();
  form.append("language", language);
  for (const f of files) form.append("images", f, f.name);

  let res: Response;
  try {
    res = await fetch("/api/explain", { method: "POST", body: form, signal, credentials: "same-origin" });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw new ExplainError("cancelled", t("cancelled"));
    throw new ExplainError("network", t("network_error"));
  }

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    const parsed = ApiError.safeParse(json);
    if (parsed.success) throw new ExplainError(parsed.data.error.code, parsed.data.error.message, res.status);
    if (res.status === 429) throw new ExplainError("rate_limited", t("network_error"), res.status);
    throw new ExplainError("internal_error", t("invalid_response"), res.status);
  }

  const parsed = ExplainResult.safeParse(json);
  if (!parsed.success) {
    console.warn("ExplainResult validation failed", parsed.error.issues);
    throw new ExplainError("invalid_response", t("invalid_response"), res.status);
  }
  return parsed.data;
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
