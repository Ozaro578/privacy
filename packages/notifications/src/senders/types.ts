import type { OutgoingNotification } from "../types";

export interface PushMessage {
  token: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  /** Für Gruppierung und Ersetzen auf dem Gerät. */
  collapseKey?: string;
}

export interface PushFailure {
  token: string;
  error: string;
  /** Token ist ungültig oder abgemeldet und sollte aus push_tokens entfernt werden. */
  unregistered: boolean;
}

export interface PushSendResult {
  delivered: number;
  failures: PushFailure[];
  /** Tokens, die entfernt werden sollten (z. B. DeviceNotRegistered). */
  invalidTokens: string[];
}

export interface PushSender {
  readonly provider: "expo" | "fcm" | "apns" | "webpush";
  send(messages: readonly PushMessage[]): Promise<PushSendResult>;
}

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailSendResult {
  accepted: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<EmailSendResult>;
}

export type FetchLike = (input: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown>; text(): Promise<string> }>;

/** Nachricht in Blöcke fester Größe aufteilen. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (size <= 0) throw new Error("Blockgröße muss positiv sein");
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export function emailFromNotification(n: OutgoingNotification, to: string): EmailMessage {
  return { to, subject: n.title, text: n.body };
}
