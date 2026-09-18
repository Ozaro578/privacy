import { resolvePreference } from "./preferences";
import { emailFromNotification, type EmailSender, type PushMessage, type PushSender, type PushSendResult } from "./senders/types";
import type { Channel, NotificationPreference, OutgoingNotification, PreferenceOverrides, PushToken } from "./types";

export interface Senders {
  push?: readonly PushSender[];
  email?: EmailSender;
}

export interface DispatchRecipient {
  email?: string | null;
}

export interface DispatchResult {
  /** Tatsächlich genutzte Kanäle (in_app bedeutet: der Aufrufer speichert die Zeile in notifications). */
  channels: Channel[];
  push: PushSendResult | null;
  email: { accepted: boolean; error?: string } | null;
  /** Tokens, die aus push_tokens gelöscht werden sollten. */
  invalidTokens: string[];
  skipped: { channel: Channel; reason: string }[];
}

/**
 * Entscheidet anhand der Präferenz, über welche Kanäle eine Benachrichtigung geht, und versendet sie.
 * Push wird je Anbieter gebündelt; für Anbieter ohne Sender werden die Tokens übersprungen.
 */
export async function dispatch(
  notification: OutgoingNotification,
  prefs: PreferenceOverrides | NotificationPreference | undefined,
  tokens: readonly PushToken[],
  senders: Senders,
  recipient: DispatchRecipient = {},
): Promise<DispatchResult> {
  const pref: NotificationPreference = prefs && "push" in prefs && typeof prefs.push === "boolean" ? (prefs as NotificationPreference) : resolvePreference(notification.type, prefs as PreferenceOverrides | undefined);
  const result: DispatchResult = { channels: [], push: null, email: null, invalidTokens: [], skipped: [] };
  if (pref.in_app) result.channels.push("in_app");

  if (pref.push) {
    if (tokens.length === 0) result.skipped.push({ channel: "push", reason: "Keine Push-Tokens" });
    else {
      const byProvider = new Map<string, PushMessage[]>();
      for (const t of tokens) {
        const list = byProvider.get(t.provider) ?? [];
        const msg: PushMessage = { token: t.token, title: notification.title, body: notification.body, collapseKey: notification.type };
        if (notification.data) msg.data = { ...notification.data, notification_type: notification.type, ...(notification.id ? { notification_id: notification.id } : {}) };
        list.push(msg);
        byProvider.set(t.provider, list);
      }
      const combined: PushSendResult = { delivered: 0, failures: [], invalidTokens: [] };
      let attempted = false;
      for (const [provider, messages] of byProvider) {
        const sender = senders.push?.find((s) => s.provider === provider);
        if (!sender) {
          result.skipped.push({ channel: "push", reason: `Kein Sender für Anbieter ${provider}` });
          continue;
        }
        attempted = true;
        const r = await sender.send(messages);
        combined.delivered += r.delivered;
        combined.failures.push(...r.failures);
        combined.invalidTokens.push(...r.invalidTokens);
      }
      if (attempted) {
        result.push = combined;
        result.invalidTokens = combined.invalidTokens;
        if (combined.delivered > 0) result.channels.push("push");
      }
    }
  } else result.skipped.push({ channel: "push", reason: "Per Präferenz deaktiviert" });

  if (pref.email) {
    if (!senders.email) result.skipped.push({ channel: "email", reason: "Kein E-Mail-Sender konfiguriert" });
    else if (!recipient.email) result.skipped.push({ channel: "email", reason: "Keine E-Mail-Adresse" });
    else {
      const r = await senders.email.send(emailFromNotification(notification, recipient.email));
      result.email = r.error ? { accepted: r.accepted, error: r.error } : { accepted: r.accepted };
      if (r.accepted) result.channels.push("email");
    }
  } else result.skipped.push({ channel: "email", reason: "Per Präferenz deaktiviert" });

  return result;
}
