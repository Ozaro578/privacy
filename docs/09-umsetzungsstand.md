# 09 Umsetzungsstand (19. September 2026)

Dieses Dokument beschreibt, was im Repository fertig umgesetzt ist, was nur mit externen Freigaben oder Zugängen weitergeht und was noch offen ist. Es ersetzt die Statuszeilen in `05-entwicklungsplan.md`.

## 1. Fertig umgesetzt (Software)

| Bereich | Stand |
|---|---|
| Datenmodell | 21 Migrationen, 71 Tabellen, RLS auf allen Tabellen, JWT-Claims über Custom Access Token Hook, Exclusion-Constraints gegen Doppelbuchung, Härtung (Schüler schreiben Lernergebnisse nur über Server). SQL-Tests mit 11 Gruppen laufen in CI. |
| Regelwerk | Versionierte Regeln (`rule_versions`) für Theorieprüfung, praktische Prüfung, Sonderfahrten, Theorieunterricht. Klasse B veröffentlicht, alle anderen Klassen als `needs_verification`. Keine gesetzlichen Werte im Code. |
| Lern-Engine | Adaptive Wiederholung (SM-2-Variante mit Sicherheit und Antwortzeit), Mastery je Frage und Thema, Prüfungsreife 0 bis 100 mit Faktoren und Bändern, Fehleranalyse, Fragenauswahl je Modus, Heute-Plan, Kompetenzprofil, Prognose, Gamification. 16 Unit-Tests. |
| Inhalte Klasse B | 202 eigene Übungsfragen, 19 Kapitel, 83 Wissenseinträge, 45 Prüferfragen, 106 Bildmedien (65 Verkehrszeichen, 41 Situationsgrafiken), 90 Fragen mit Bild. Kennzeichnung "Übungsfrage (kein amtlicher Prüfungsinhalt)". Fachprüfung siehe `08-fachpruefung-inhalte.md`. |
| Schüler-Web | Heute-Modus, Lernbereich mit allen Modi, Prüfungssimulation mit eingefrorener Regelversion, Warum-Knopf, KI-Lerncoach mit Quellen, Fahrstunden und Buchung, Warteliste, Kompetenzprofil, Kostenprognose mit Hinweis, Dokumente, Finanzen, Profil, Datenschutzanfragen, Theorie-Check-in per QR. |
| Fahrlehrer-Web | Tagesansicht, Schnelldokumentation, Sprachnotiz mit KI-Entwurf (Bestätigung durch Fahrlehrer), Schülerübersicht, Prüfungsfreigabe, Verfügbarkeiten. |
| Verwaltung | Schüler und Anmeldung, Team, Kalender, Theorieunterricht, Fahrzeuge, Finanzen (Preislisten, Rechnungen, Zahlungen, Mahnlauf, SEPA-Mandate, Stripe-Webhook), Dokumente (Prüfqueue, Vorlagen, Aufbewahrung), Einstellungen (Stammdaten, Standorte, Stornoregeln, Anmeldelink mit QR, Rollen), Analytics, Datenschutzanfragen mit Export und Löschung (Pseudonymisierung). |
| Plattform | Mandantenverwaltung, Inhalte-CMS mit Versionierung und Rechtsstand, Regelverwaltung. |
| Mobile-App | Expo, Offline-Spiegel in SQLite, Sync-Warteschlange, Lernen offline, Prüfung serverseitig, Fahren, Finanzen, Profil, Check-in, Bilder zu Fragen. 24 Tests. |
| Querschnitt | Benachrichtigungen (Push, E-Mail, In-App, vier Sprachen), Cron-Jobs, i18n (de, en, tr, ar), Design System, Barrierefreiheit in den Kernflüssen, CI (Typecheck, Tests, Lint, Migrationen, Build). |

## 2. Läuft nur mit Zugängen oder Freigaben weiter

| Punkt | Was fehlt | Wer |
|---|---|---|
| Test gegen echtes Supabase-Projekt | Projekt-URL, anon key, service_role key, Verbindungsstring; danach Custom Access Token Hook im Dashboard aktivieren | Auftraggeber |
| Stripe SEPA | Stripe-Konto, Webhook-Secret, Testzahlungen | Auftraggeber |
| KI-Funktionen | API-Schlüssel des KI-Anbieters, Auftragsverarbeitungsvertrag | Auftraggeber |
| Push und E-Mail | Expo-Push-Zugang oder FCM, SMTP-Zugang | Auftraggeber |
| Amtliche Prüfungsfragen | Lizenz (TÜV | DEKRA arge tp 21); bis dahin nur eigene Übungsfragen | Auftraggeber |
| Fachliche Freigabe | Prüfung aller Inhalte und Regelwerte durch einen zugelassenen Fahrlehrer, Rechtsstand dokumentieren | Fachprüfer |
| Store-Veröffentlichung | Apple- und Google-Entwicklerkonten, EAS-Builds, Datenschutzangaben | Auftraggeber |

## 3. Noch offen (Software)

- Lasttests für Kalender und Simulation, E2E-Suiten über alle 21 Flows (aktuell Unit, SQL und einzelne E2E).
- Regelwerte für die Klassen außer B verifizieren und veröffentlichen.
- Automatischer Löschlauf nach `retention_policies` (heute manuell über Datenschutzanfragen).
- Audit-Log-Ansicht für Admins, Support-Zugriff mit Freigabe.
- Externer Penetrationstest, Datenschutz-Folgenabschätzung, AVV-Dokumente.
- Observability (Sentry, Alarme), Backup- und Wiederherstellungstest, Runbooks.
- Pilotbetrieb mit einer Fahrschule inklusive Hypercare.

## 4. Grobe Restschätzung

| Block | Aufwand |
|---|---|
| Echtes Supabase-Projekt anbinden und alle Flüsse einmal durchspielen | 1 bis 2 Tage nach Erhalt der Zugänge |
| Fachliche Verifikation der Inhalte durch Fahrlehrer | 3 bis 5 Tage extern |
| Offene Softwarepunkte aus Abschnitt 3 | 2 bis 3 Wochen |
| Store-Einreichung und Pilot | 4 bis 6 Wochen Kalenderzeit |
