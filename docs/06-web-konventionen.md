# Web-App Konventionen (apps/web)

Diese Regeln gelten für alle Bereiche der Next.js-App (Schüler, Fahrlehrer, Büro/Admin, Plattform).

## Stack und Struktur
- Next.js 16 App Router, React 19, TypeScript strict (exactOptionalPropertyTypes, noUncheckedIndexedAccess), Tailwind v4.
- `src/proxy.ts` erneuert die Supabase-Session und leitet Unangemeldete auf `/login`. Autorisierung passiert immer serverseitig in Seiten und Actions.
- Route-Gruppen: `(auth)` öffentlich, `(student)` Schüler, `(instructor)` Fahrlehrer unter `/lehrer`, `(admin)` Büro/Admin/Owner unter `/verwaltung`, `(platform)` Plattform-Admin unter `/plattform`.
- `params` und `searchParams` sind Promises (`await params`).

## Auth und Rollen
- `src/lib/auth/session.ts`: `getSession()`, `requireSession()`, `requireRole([...])`, `requireStudent()`, `requireStaff()` (instructor, office, admin, owner), `requireOffice()` (office, admin, owner), `requireAdmin()` (admin, owner), `requirePlatformAdmin()`, `homeFor()`.
- Tenant und Rolle kommen aus dem JWT (Custom Access Token Hook, Migration 0012). Jede Datenbankabfrage läuft über den Supabase-Client mit Session-Cookies, RLS filtert nach Tenant. Der Service-Role-Client (`createSupabaseAdminClient`) ist nur für Registrierung, Webhooks und Cron erlaubt.

## Datenzugriff
- `src/lib/supabase/server.ts` (`createSupabaseServerClient`) für Server Components, Actions, Route Handler; `src/lib/supabase/client.ts` für Client-Komponenten (Realtime, Storage-Upload).
- Typen aus `@fahrpilot/db` (`Tables<"lessons">`, `Database`). Nach Schemaänderung `node packages/db/scripts/gen-types.mjs` ausführen (lokale DB muss laufen).
- Verschachtelte Selects (`instructors(display_name)`) sind typisiert; bei Bedarf `as unknown as {...}` casten.
- `tstzrange` kommt als Text: `parseRange(period)` aus `@/components/ui` liefert `{ start, end }`. Einfügen als `[startIso,endIso)`.
- Datenlade-Funktionen liegen in `src/lib/data/*.ts` (`import "server-only"`), Mutationen in `src/lib/actions/*.ts` (`"use server"`, Zod-Validierung, `revalidatePath`).
- Integritätskritische Abläufe laufen über RPC: `book_lesson`, `cancel_lesson`, `create_checkin_token`, `checkin_theory_class`, `issue_invoice`, `special_drive_progress`, `offer_lesson_to_waitlist`, `switch_active_tenant`.

## Domänenlogik
- Regeln: `@fahrpilot/rules-engine` (`resolveRule`, `composeExam`, `scoreExam`, `trainingProgress`, `theoryLessonsProgress`). Werte nie im Code hinterlegen; `ctx.rules` in `getStudentContext()` bzw. `resolveRulesFor(db, code, acquisition)`.
- Lernen: `@fahrpilot/learning-engine` (SRS, Mastery, Readiness, Fehleranalyse, Heute-Modus, Kompetenzprofil, Prognose, Gamification).
- KI: `@fahrpilot/ai` nur serverseitig (`createAiServices()` liest Env; Provider können `null` sein, dann regelbasiert). Wissensbasis: `SupabaseKnowledgeRepository` in `src/lib/ai/knowledge.ts`.
- Zahlungen: `@fahrpilot/payments`, Benachrichtigungen: `@fahrpilot/notifications`.

## UI
- Primitive in `src/components/ui/index.tsx`: `Card`, `ProgressBar`, `ReadinessGauge`, `StatTile`, `Alert`, `EmptyState`, `Pill`, `btn` (Klassen primary/secondary/ghost/danger), `fmt` (date, time, weekday, eur), `parseRange`. Design-Tokens aus `@fahrpilot/ui/theme.css` sind eingebunden; Komponenten aus `@fahrpilot/ui` dürfen verwendet werden.
- Farben: `brand-*`, `accent-*`, `success-*`, `warn-*`, `danger-*`, `ink-*`, `paper`, Bandfarben `band-red|orange|yellowgreen|green`. Radius `rounded-card`, Schatten `shadow-card`.
- Formulare: Label oben, Fehler unten, Touch-Ziele mindestens 44 px (`min-h-11`), sichtbare Fokusringe, `aria-live` für Statusmeldungen.
- Texte auf Deutsch, keine Gedankenstriche (—/–), keine Platzhalter, keine Buttons ohne Funktion.
- Client-Komponenten nur wo nötig (`"use client"`), Aktionen über `useTransition` mit Rückmeldung.

## Qualität
- `pnpm --filter @fahrpilot/web typecheck` muss grün sein; `pnpm --filter @fahrpilot/web build` vor Abgabe.
- Reine Logik in Packages testen (Vitest). SQL-Tests: `pnpm db:test`.
