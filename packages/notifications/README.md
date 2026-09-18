# @fahrpilot/notifications

Serverseitiges Benachrichtigungsmodul: Typen und Standard-Präferenzen, mehrsprachige Vorlagen (de, en, tr, ar), Planung als reine Funktionen mit Ruhezeiten in der Zeitzone Europe/Berlin, Versand über Expo Push, Firebase Cloud Messaging und SMTP sowie eine Kanalentscheidung nach Präferenz. Das Paket greift nicht auf die Datenbank zu; Ergebnisse passen zu den Tabellen `notifications`, `notification_preferences` und `push_tokens`.

## Bausteine

| Modul | Inhalt |
| --- | --- |
| `types.ts` | `NotificationType` (13 Typen), `Locale`, `QuietHours`, `NotificationPreference`, `PushToken`, `PlannedNotification`, Parameter je Vorlage |
| `preferences.ts` | `DEFAULT_PREFERENCES` je Typ, `DEFAULT_QUIET_HOURS` (22:00 bis 07:00), `resolvePreference`, `overridesFromRows` für Zeilen aus `notification_preferences` |
| `templates.ts` | `render(type, params, locale)` liefert `{ title, body }`, Rückfall auf Deutsch |
| `time.ts` | Umrechnung lokaler Zeiten (Europe/Berlin) inklusive Sommerzeit, `isInQuietHours`, `shiftOutOfQuietHours`, Formatierung |
| `scheduler.ts` | `planLessonReminders`, `planExamCountdown`, `planLearnReminder`, `planVehicleReminders`, `planTheoryClassReminder` |
| `senders/` | `ExpoPushSender`, `FcmSender`, `SmtpEmailSender`, `FakePushSender`, `FakeEmailSender` |
| `dispatch.ts` | `dispatch(notification, prefs, tokens, senders, recipient)` |

## Planung

Alle Planer sind reine Funktionen und liefern `PlannedNotification` mit `scheduled_for` (ISO, UTC), `dedupe_key`, `channels`, `params` und `data`. Der Aufrufer speichert sie in `notifications` (die Kombination `user_id` und `dedupe_key` ist dort eindeutig, ein erneuter Lauf erzeugt daher keine Duplikate) und rendert Titel und Text beim Versand mit `render` in der Sprache des Nutzers.

- `planLessonReminders(lesson, prefs, now)`: 24 Stunden und 2 Stunden vor Beginn, Dedupe-Keys `lesson_reminder_24h:<lesson_id>` und `lesson_reminder_2h:<lesson_id>`. Abgesagte oder abgeschlossene Stunden werden übersprungen.
- `planExamCountdown(exam, prefs, now, days = [7, 5, 3, 1])`: um 09:00 Uhr an den Tagen vor der Prüfung, `exam_countdown:<exam_id>:<tage>`.
- `planLearnReminder(lastLearnedAt, prefs, now, quietHours)`: um 18:00 Uhr, wenn heute (lokal) noch nicht gelernt wurde, `learn_reminder:<YYYY-MM-DD>`.
- `planVehicleReminders(vehicle, now, days = [30, 14, 7])`: HU und Wartung um 08:00 Uhr, `vehicle_inspection_due:<vehicle_id>:<fällig>:<tage>`.
- `planTheoryClassReminder(theoryClass, prefs, now)`: 24 Stunden vor dem Theorieunterricht.

Ruhezeiten (je Typ aus den Präferenzen, Standard 22:00 bis 07:00) verschieben den Versand auf das Ende der Ruhezeit. Würde eine Erinnerung dadurch erst nach Beginn des Termins verschickt, entfällt sie. Zeitkritische Typen (`lesson_cancelled`, `message_received`, `waitlist_offer`) haben standardmäßig keine Ruhezeit.

## Versand

```ts
import { ExpoPushSender, SmtpEmailSender, dispatch, render } from "@fahrpilot/notifications";

const senders = {
  push: [new ExpoPushSender({ accessToken: process.env.EXPO_ACCESS_TOKEN })],
  email: new SmtpEmailSender({ host: process.env.SMTP_HOST!, port: 587, user: process.env.SMTP_USER, password: process.env.SMTP_PASSWORD, from: "Fahrschule <noreply@example.org>" }),
};
const text = render(row.notification_type, row.data.params, user.locale);
const result = await dispatch({ id: row.id, user_id: row.user_id, type: row.notification_type, ...text, data: row.data }, prefs, tokens, senders, { email: user.email });
// result.channels in notifications.channels speichern, result.invalidTokens aus push_tokens löschen
```

- `ExpoPushSender`: POST an `https://exp.host/--/api/v2/push/send` in Blöcken zu 100. Antworten mit `DeviceNotRegistered` landen in `invalidTokens`.
- `FcmSender`: HTTP v1 API mit OAuth2-Zugriffstoken aus einem Service-Account (JWT RS256 über `node:crypto`, kein zusätzliches Paket). Antworten mit `UNREGISTERED` oder HTTP 404 gelten als ungültige Tokens. Das Zugriffstoken wird bis kurz vor Ablauf wiederverwendet.
- `SmtpEmailSender`: nodemailer, Transport für Tests injizierbar.
- `fetch` ist bei beiden Push-Sendern injizierbar.

## Konfiguration

Das Paket liest keine Umgebungsvariablen. Empfohlen in der Anwendung: `EXPO_ACCESS_TOKEN` (optional), `FCM_SERVICE_ACCOUNT_JSON` (Inhalt der Service-Account-Datei), `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`.

## Tests

`pnpm test` prüft Vorlagen in allen vier Sprachen, Planung inklusive Ruhezeiten, Sommer- und Winterzeit und Dedupe-Keys, Präferenzen, Expo-Batching und FCM mit gemocktem `fetch`, SMTP mit Attrappe und die Kanalentscheidung.

## Offene Punkte

- APNs direkt und Web Push sind nicht umgesetzt; iOS läuft über Expo oder FCM.
- Push-Nachrichten enthalten Titel und Text im Klartext beim Anbieter; personenbezogene Inhalte (z. B. Nachrichtenvorschau) sollten je Einwilligung (`consents.push_notifications`) und Datenschutzbewertung beschränkt werden.
- Die arabischen Vorlagen verwenden lateinische Ziffern und sind sprachlich zu prüfen; Rechts-nach-links-Darstellung übernimmt das Endgerät.
- Wiederholungsversuche und Rate-Limits der Anbieter (Expo: 600 Nachrichten pro Sekunde) sind vom Aufrufer zu steuern.
