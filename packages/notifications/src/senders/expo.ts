import { chunk, type FetchLike, type PushFailure, type PushMessage, type PushSender, type PushSendResult } from "./types";

export const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
export const EXPO_BATCH_SIZE = 100;

export interface ExpoPushSenderConfig {
  /** Optionales Zugriffstoken für erweiterte Sicherheit (Expo Access Token). */
  accessToken?: string;
  fetch?: FetchLike;
}

interface ExpoTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

/** Versand über den Expo Push Service in Blöcken zu 100 Nachrichten. DeviceNotRegistered wird als ungültiges Token gemeldet. */
export class ExpoPushSender implements PushSender {
  readonly provider = "expo" as const;
  private readonly fetchImpl: FetchLike;

  constructor(private readonly config: ExpoPushSenderConfig = {}) {
    this.fetchImpl = config.fetch ?? (globalThis.fetch as unknown as FetchLike);
    if (!this.fetchImpl) throw new Error("ExpoPushSender: fetch nicht verfügbar");
  }

  async send(messages: readonly PushMessage[]): Promise<PushSendResult> {
    const result: PushSendResult = { delivered: 0, failures: [], invalidTokens: [] };
    for (const batch of chunk(messages, EXPO_BATCH_SIZE)) {
      const payload = batch.map((m) => ({ to: m.token, title: m.title, body: m.body, data: m.data ?? {}, sound: "default", ...(m.collapseKey ? { collapseId: m.collapseKey } : {}) }));
      const headers: Record<string, string> = { "content-type": "application/json", accept: "application/json" };
      if (this.config.accessToken) headers.authorization = `Bearer ${this.config.accessToken}`;
      let tickets: ExpoTicket[];
      try {
        const res = await this.fetchImpl(EXPO_PUSH_URL, { method: "POST", headers, body: JSON.stringify(payload) });
        if (!res.ok) {
          const text = await res.text();
          for (const m of batch) result.failures.push({ token: m.token, error: `HTTP ${res.status}: ${text.slice(0, 200)}`, unregistered: false });
          continue;
        }
        const json = (await res.json()) as { data?: ExpoTicket[] };
        tickets = json.data ?? [];
      } catch (err) {
        for (const m of batch) result.failures.push({ token: m.token, error: err instanceof Error ? err.message : String(err), unregistered: false });
        continue;
      }
      batch.forEach((m, i) => {
        const ticket = tickets[i];
        if (ticket?.status === "ok") {
          result.delivered += 1;
          return;
        }
        const code = ticket?.details?.error ?? "UnknownError";
        const failure: PushFailure = { token: m.token, error: ticket?.message ? `${code}: ${ticket.message}` : code, unregistered: code === "DeviceNotRegistered" };
        result.failures.push(failure);
        if (failure.unregistered) result.invalidTokens.push(m.token);
      });
    }
    return result;
  }
}
