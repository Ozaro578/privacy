import nodemailer from "nodemailer";
import type { EmailMessage, EmailSender, EmailSendResult } from "./types";

export interface SmtpConfig {
  host: string;
  port: number;
  secure?: boolean;
  user?: string;
  password?: string;
  /** Absender, z. B. "Fahrschule Muster <noreply@example.org>". */
  from: string;
}

/** Minimaler Ausschnitt des nodemailer-Transports, damit Tests eine Attrappe injizieren können. */
export interface MailTransportLike {
  sendMail(options: { from: string; to: string; subject: string; text: string; html?: string }): Promise<{ messageId?: string; rejected?: unknown[] }>;
}

export class SmtpEmailSender implements EmailSender {
  private readonly transport: MailTransportLike;

  constructor(
    private readonly config: SmtpConfig,
    transport?: MailTransportLike,
  ) {
    if (!config.from) throw new Error("SmtpEmailSender: Absender fehlt");
    this.transport =
      transport ??
      nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure ?? config.port === 465,
        ...(config.user ? { auth: { user: config.user, pass: config.password ?? "" } } : {}),
      });
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    try {
      const info = await this.transport.sendMail({ from: this.config.from, to: message.to, subject: message.subject, text: message.text, ...(message.html ? { html: message.html } : {}) });
      if (info.rejected && info.rejected.length > 0) return { accepted: false, error: "Empfänger abgelehnt" };
      return info.messageId ? { accepted: true, messageId: info.messageId } : { accepted: true };
    } catch (err) {
      return { accepted: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
}
