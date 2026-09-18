/** Benachrichtigungstypen, entsprechen notification_preferences.notification_type und notifications.notification_type. */
export type NotificationType =
  | "lesson_reminder_24h"
  | "lesson_reminder_2h"
  | "earlier_slot_available"
  | "learn_reminder"
  | "exam_countdown"
  | "invoice_due"
  | "message_received"
  | "waitlist_offer"
  | "document_missing"
  | "lesson_cancelled"
  | "theory_class_reminder"
  | "vehicle_inspection_due"
  | "vehicle_service_due";

export const NOTIFICATION_TYPES: readonly NotificationType[] = [
  "lesson_reminder_24h",
  "lesson_reminder_2h",
  "earlier_slot_available",
  "learn_reminder",
  "exam_countdown",
  "invoice_due",
  "message_received",
  "waitlist_offer",
  "document_missing",
  "lesson_cancelled",
  "theory_class_reminder",
  "vehicle_inspection_due",
  "vehicle_service_due",
];

export type Locale = "de" | "en" | "tr" | "ar";
export const LOCALES: readonly Locale[] = ["de", "en", "tr", "ar"];
export const DEFAULT_LOCALE: Locale = "de";

export type Channel = "push" | "email" | "in_app";

/** Ruhezeit als lokale Uhrzeit (Europe/Berlin) im Format HH:MM. Über Mitternacht hinweg erlaubt (z. B. 22:00 bis 07:00). */
export interface QuietHours {
  start: string;
  end: string;
}

/** Präferenz je Typ, entspricht einer Zeile in notification_preferences. */
export interface NotificationPreference {
  push: boolean;
  email: boolean;
  in_app: boolean;
  quiet_hours: QuietHours | null;
}

/** Teilweise Überschreibungen je Typ, wie sie aus notification_preferences eines Nutzers geladen werden. */
export type PreferenceOverrides = Partial<Record<NotificationType, Partial<NotificationPreference>>>;

/** Push-Token eines Geräts, entspricht push_tokens. */
export interface PushToken {
  provider: "expo" | "fcm" | "apns" | "webpush";
  token: string;
  locale?: string | null;
}

/** Parameter der Vorlagen je Typ. Zeiten und Daten sind bereits formatierte Zeichenketten (lokale Zeit Europe/Berlin). */
export interface TemplateParamsByType {
  lesson_reminder_24h: { time: string; date?: string; instructorName?: string; meetingPoint?: string };
  lesson_reminder_2h: { time: string; meetingPoint?: string };
  earlier_slot_available: { date?: string; time?: string };
  learn_reminder: Record<string, never>;
  exam_countdown: { days: number; kind: "theory" | "practical" };
  invoice_due: { invoiceNumber: string; amount: string; dueDate: string };
  message_received: { senderName: string; preview?: string };
  waitlist_offer: { date: string; time: string };
  document_missing: { documentName: string };
  lesson_cancelled: { date: string; time: string; reason?: string };
  theory_class_reminder: { title: string; time: string; date?: string };
  vehicle_inspection_due: { licensePlate: string; days: number; dueDate?: string };
  vehicle_service_due: { licensePlate: string; days: number; dueDate?: string };
}

export type TemplateParams<T extends NotificationType = NotificationType> = TemplateParamsByType[T];

export interface RenderedText {
  title: string;
  body: string;
}

/** Geplante Benachrichtigung, noch ohne Nutzerzuordnung und Rendering (dies geschieht beim Versand). */
export interface PlannedNotification<T extends NotificationType = NotificationType> {
  type: T;
  params: TemplateParams<T>;
  /** Versandzeitpunkt als ISO-8601 (UTC). */
  scheduled_for: string;
  /** Eindeutiger Schlüssel je Nutzer, entspricht notifications.dedupe_key (unique mit user_id). */
  dedupe_key: string;
  channels: Channel[];
  /** Zusatzdaten für notifications.data (z. B. lesson_id für Deep Links). */
  data: Record<string, string | number>;
}

/** Zu versendende Benachrichtigung, entspricht einer Zeile in notifications. */
export interface OutgoingNotification {
  id?: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}
