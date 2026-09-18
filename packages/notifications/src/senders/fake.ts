import type { EmailMessage, EmailSender, EmailSendResult, PushMessage, PushSender, PushSendResult } from "./types";

/** Push-Attrappe für Tests: speichert Nachrichten, meldet konfigurierte Tokens als abgemeldet. */
export class FakePushSender implements PushSender {
  readonly sent: PushMessage[] = [];
  readonly unregisteredTokens = new Set<string>();

  constructor(readonly provider: "expo" | "fcm" | "apns" | "webpush" = "expo") {}

  async send(messages: readonly PushMessage[]): Promise<PushSendResult> {
    const result: PushSendResult = { delivered: 0, failures: [], invalidTokens: [] };
    for (const m of messages) {
      if (this.unregisteredTokens.has(m.token)) {
        result.failures.push({ token: m.token, error: "DeviceNotRegistered", unregistered: true });
        result.invalidTokens.push(m.token);
        continue;
      }
      this.sent.push(m);
      result.delivered += 1;
    }
    return result;
  }
}

/** E-Mail-Attrappe für Tests. */
export class FakeEmailSender implements EmailSender {
  readonly sent: EmailMessage[] = [];
  failNext = false;

  async send(message: EmailMessage): Promise<EmailSendResult> {
    if (this.failNext) {
      this.failNext = false;
      return { accepted: false, error: "Simulierter Fehler" };
    }
    this.sent.push(message);
    return { accepted: true, messageId: `fake-${this.sent.length}` };
  }
}
