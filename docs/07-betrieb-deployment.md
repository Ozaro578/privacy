# Betrieb und Deployment

## Umgebungen
- `dev`: lokales Postgres (`pnpm db:test`) für Schema und SQL-Tests, Supabase-Entwicklungsprojekt für die laufende App.
- `staging` und `prod`: je ein Supabase-Projekt in der EU-Region (Frankfurt), je ein Vercel-Projekt für `apps/web`, EAS-Profile für `apps/mobile`.

## Umgebungsvariablen (apps/web)
| Variable | Zweck |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client- und Serverzugriff mit RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Nur Server: Registrierung, Webhooks, Cron |
| `NEXT_PUBLIC_APP_URL` | Absolute Links (Magic Link, QR-Codes) |
| `CRON_SECRET` | Schutz der Cron-Routen |
| `ANTHROPIC_API_KEY`, `AI_MODEL_COACH`, `AI_MODEL_FAST`, `STT_ENDPOINT`, `STT_API_KEY` | KI-Layer (optional, ohne Key regelbasiert) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SEPA_CREDITOR_ID` | Zahlungen (optional) |
| `EXPO_ACCESS_TOKEN` | Push über Expo (optional) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | E-Mail-Versand (optional) |

## Supabase
1. Migrationen in Reihenfolge einspielen (`supabase db push`). Alle Migrationen sind additiv und idempotent gegenüber Neuinstallation.
2. Auth: Custom Access Token Hook `public.custom_access_token_hook` aktivieren; E-Mail-Vorlagen auf Deutsch anpassen; Site URL und Redirect `NEXT_PUBLIC_APP_URL/auth/callback` eintragen; MFA für Mitarbeiterrollen empfohlen.
3. Storage: Bucket `documents` (Migration 0013) und Bucket `content` (privat) anlegen; Policies für `content`: Lesen für `authenticated`, Schreiben für Plattform-Admin.
4. Realtime für `messages` und `attendance` aktivieren (Publication `supabase_realtime`).
5. Backups: Point-in-Time-Recovery aktivieren; wöchentlicher Restore-Test in Staging.

## Cron
Vercel Cron (`apps/web/vercel.json`) ruft mit `Authorization: Bearer CRON_SECRET` auf:
- `/api/cron/reminders` alle 15 Minuten: plant Fahrstunden-, Unterrichts-, Prüfungs- und Fahrzeug-Erinnerungen (idempotent über `dedupe_key`).
- `/api/cron/dispatch` alle 5 Minuten: versendet fällige Benachrichtigungen per Push und E-Mail nach Präferenz, entfernt ungültige Tokens.
- `/api/cron/daily` täglich 04:30 UTC: Lernerinnerungen, Mahnstufen, Ablauf von Wartelisten-Angeboten, verwaiste Simulationen.

## Zahlungen
Stripe-Webhook auf `NEXT_PUBLIC_APP_URL/api/webhooks/stripe` mit Events `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`, `setup_intent.succeeded`, `mandate.updated`. Idempotenz über `payments.webhook_event_id`.

## Mobile
EAS Build mit Profilen `development`, `preview`, `production`; Env `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`; Push über Expo Push Service (FCM/APNs-Zugangsdaten in EAS hinterlegen). Deep Link `fahrpilot://` und Universal Links auf `NEXT_PUBLIC_APP_URL`.

## Überwachung

- Serverfehler werden über `apps/web/src/instrumentation.ts` strukturiert geloggt (JSON) und, wenn `ERROR_REPORT_WEBHOOK_URL` (optional `ERROR_REPORT_WEBHOOK_TOKEN`) gesetzt ist, an einen Sammler gesendet (Sentry-kompatibler Endpoint, Better Stack, eigener Webhook). Ohne Personendaten.
- Lasttests: `tests/load/README.md` (k6), nur gegen Staging.
- Runbooks für Vorfall, Rollback, Migration und Wiederherstellung: `docs/10-runbooks.md`.
Sentry (Web und Mobile), Supabase-Logs, Alarm bei Cron-Fehlern (HTTP-Status der Cron-Routen), Kostenüberwachung der KI-Aufrufe über `coach_messages.input_tokens/output_tokens`.

## Datenschutz im Betrieb
Auftragsverarbeitungsverträge mit Supabase, Vercel, Anthropic, Stripe, Expo und E-Mail-Anbieter; Datenschutz-Folgenabschätzung vor Produktivstart; Löschläufe nach `retention_policies`; Export- und Löschanfragen unter Verwaltung, Schüler, Datenanfragen.
