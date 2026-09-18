import { createSign } from "node:crypto";
import type { FetchLike, PushMessage, PushSender, PushSendResult } from "./types";

export interface FcmServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
  token_uri?: string;
}

export interface FcmSenderConfig {
  serviceAccount: FcmServiceAccount;
  fetch?: FetchLike;
  now?: () => Date;
}

export const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
const DEFAULT_TOKEN_URI = "https://oauth2.googleapis.com/token";

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Signiertes JWT (RS256) für den OAuth2-Austausch gegen ein Zugriffstoken, ohne zusätzliche Abhängigkeiten. */
export function buildServiceAccountJwt(account: FcmServiceAccount, issuedAt: Date, scope = FCM_SCOPE): string {
  const iat = Math.floor(issuedAt.getTime() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(JSON.stringify({ iss: account.client_email, scope, aud: account.token_uri ?? DEFAULT_TOKEN_URI, iat, exp: iat + 3600 }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = base64url(signer.sign(account.private_key));
  return `${header}.${claims}.${signature}`;
}

/** Firebase Cloud Messaging (HTTP v1). Zugriffstoken wird per Service-Account-JWT geholt und bis kurz vor Ablauf wiederverwendet. */
export class FcmSender implements PushSender {
  readonly provider = "fcm" as const;
  private readonly fetchImpl: FetchLike;
  private readonly now: () => Date;
  private cached: { token: string; expiresAt: number } | null = null;

  constructor(private readonly config: FcmSenderConfig) {
    if (!config.serviceAccount.project_id || !config.serviceAccount.client_email || !config.serviceAccount.private_key) throw new Error("FcmSender: Service-Account unvollständig");
    this.fetchImpl = config.fetch ?? (globalThis.fetch as unknown as FetchLike);
    this.now = config.now ?? (() => new Date());
  }

  async accessToken(): Promise<string> {
    const nowMs = this.now().getTime();
    if (this.cached && this.cached.expiresAt - 60_000 > nowMs) return this.cached.token;
    const assertion = buildServiceAccountJwt(this.config.serviceAccount, new Date(nowMs));
    const body = new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }).toString();
    const res = await this.fetchImpl(this.config.serviceAccount.token_uri ?? DEFAULT_TOKEN_URI, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
    if (!res.ok) throw new Error(`FCM: Zugriffstoken konnte nicht geholt werden (HTTP ${res.status})`);
    const json = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) throw new Error("FCM: Antwort ohne access_token");
    this.cached = { token: json.access_token, expiresAt: nowMs + (json.expires_in ?? 3600) * 1000 };
    return json.access_token;
  }

  async send(messages: readonly PushMessage[]): Promise<PushSendResult> {
    const result: PushSendResult = { delivered: 0, failures: [], invalidTokens: [] };
    if (messages.length === 0) return result;
    let token: string;
    try {
      token = await this.accessToken();
    } catch (err) {
      for (const m of messages) result.failures.push({ token: m.token, error: err instanceof Error ? err.message : String(err), unregistered: false });
      return result;
    }
    const url = `https://fcm.googleapis.com/v1/projects/${this.config.serviceAccount.project_id}/messages:send`;
    for (const m of messages) {
      const data: Record<string, string> = {};
      for (const [k, v] of Object.entries(m.data ?? {})) data[k] = typeof v === "string" ? v : JSON.stringify(v);
      const message = { token: m.token, notification: { title: m.title, body: m.body }, data, ...(m.collapseKey ? { android: { collapse_key: m.collapseKey } } : {}) };
      try {
        const res = await this.fetchImpl(url, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ message }) });
        if (res.ok) {
          result.delivered += 1;
          continue;
        }
        const text = await res.text();
        const unregistered = res.status === 404 || /UNREGISTERED|NOT_FOUND/.test(text);
        result.failures.push({ token: m.token, error: `HTTP ${res.status}: ${text.slice(0, 200)}`, unregistered });
        if (unregistered) result.invalidTokens.push(m.token);
      } catch (err) {
        result.failures.push({ token: m.token, error: err instanceof Error ? err.message : String(err), unregistered: false });
      }
    }
    return result;
  }
}
