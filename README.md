# FahrPilot

Digitale Fahrschulplattform für den deutschen Markt: Lernplattform, Fahrschulverwaltung, persönlicher Lerncoach und Begleiter vom ersten Kontakt bis zur bestandenen praktischen Prüfung. Multi-Tenant-SaaS für Fahrschüler, Fahrlehrer und Fahrschulen.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `apps/web` | Next.js 16 App: Schüler-Web, Fahrlehrer, Büro/Admin/Owner, Plattform-CMS, Cron-Routen, Webhooks |
| `apps/mobile` | Expo React Native Schüler-App mit Offline-Lernen und Sync |
| `packages/rules-engine` | Versionierte Prüfungs- und Ausbildungsregeln je Klasse, Prüfungszusammenstellung und Bewertung |
| `packages/learning-engine` | Spaced Repetition, Mastery, Prüfungsreife, Fehleranalyse, Heute-Modus, Kompetenzprofil, Gamification |
| `packages/ai` | Serverseitiger KI-Layer mit Wissensbasis-Guardrails (Warum-Button, Coach, Sprachnotizen, Prüfer-Fragen, Fahrlehrer-Abfragen) |
| `packages/payments` | Zahlungsanbieter-Abstraktion (Stripe SEPA), Rechnungslogik, Mahnwesen, PDF |
| `packages/notifications` | Erinnerungsplanung, Templates de/en/tr/ar, Push (Expo/FCM) und E-Mail |
| `packages/i18n` | Übersetzungen de, en, tr, ar |
| `packages/ui` | Design Language "Klar": Tokens, Komponenten |
| `packages/content` | Eigene Übungsfragen, Lernkapitel, Wissensbasis, Prüfer-Fragen (kein amtlicher Katalog) und Seed |
| `packages/db` | Generierte Datenbanktypen |
| `supabase/migrations` | Postgres-Schema mit Row-Level-Security, Regel-Engine, RPC-Funktionen, Seed |
| `docs/` | Spezifikationsanalyse, Informationsarchitektur, User Flows, Datenmodell, Architektur, Entwicklungsplan, Web-Konventionen |

## Voraussetzungen

Node 22, pnpm 10, PostgreSQL 16 (lokal für Schema-Tests), ein Supabase-Projekt (EU-Region) für die laufende App.

## Schnellstart

```bash
pnpm install
pnpm -r typecheck
pnpm -r test

# Lokale Datenbank für Migrations- und RLS-Tests (Postgres auf 127.0.0.1:54329)
pnpm db:test

# Übungsinhalte in die lokale Datenbank einspielen
pnpm --filter @fahrpilot/content seed

# Web-App
cp apps/web/.env.example apps/web/.env.local   # Werte eintragen
pnpm --filter @fahrpilot/web dev
```

## Supabase einrichten

1. Projekt in der EU-Region anlegen, Migrationen aus `supabase/migrations` in Reihenfolge einspielen (`supabase db push` oder SQL-Editor).
2. Authentication, Hooks: Custom Access Token Hook auf `public.custom_access_token_hook` setzen (Tenant und Rolle im JWT).
3. Storage: Bucket `documents` (privat) wird durch Migration 0013 angelegt; Bucket `content` (privat) für Fragenmedien anlegen.
4. Einen Plattform-Admin setzen: `update public.users set is_platform_admin = true where email = '...'`.
5. Erste Fahrschule unter `/plattform/fahrschulen` anlegen; Schüler registrieren sich über `/anmeldung/<slug>`.
6. Cron (Vercel `apps/web/vercel.json` oder externer Scheduler) mit `CRON_SECRET`: `/api/cron/reminders`, `/api/cron/dispatch`, `/api/cron/daily`.

## Fragemedien (Bilder)

Verkehrszeichen und Situationsgrafiken liegen als SVG in `packages/content/media` und werden von `packages/content/scripts/gen-media.mjs` erzeugt (Verkehrszeichen nach StVO-Anlagen sind amtliche Werke nach § 5 UrhG; die Situationsgrafiken sind eigene Darstellungen). Die Zuordnung Frage zu Bild steht in `packages/content/src/media.ts`. Die Web-App kopiert die Dateien vor `dev` und `build` nach `public/media/questions`; der Seed schreibt Pfad, Alt-Text und Quelle in `question_versions`.

## Rechtsstand und Freigaben

Prüfungs- und Ausbildungsregeln liegen versioniert in `rule_versions`. Nur veröffentlichte Versionen gelten; Werte mit Status `needs_verification` werden Schülern gekennzeichnet angezeigt und müssen unter `/plattform/regeln` fachlich freigegeben werden (Vier-Augen-Prinzip). Eigene Übungsfragen sind kein amtlicher Prüfungsinhalt; ein lizenzierter amtlicher Katalog kann mit `source = 'official_licensed'` integriert werden.

Offene Punkte vor Produktion stehen in `docs/05-entwicklungsplan.md` (Lizenz Fragenkatalog, Verifikation der Regelwerte je Klasse, AGB/Stornogebühren, Signaturverfahren, AVV, DSFA, Zahlungsanbieter).
