# 09 Umsetzungsstand (19. September 2026)

Dieses Dokument beschreibt, was im Repository fertig umgesetzt ist, was nur mit externen Freigaben oder Zugängen weitergeht und was noch offen ist. Es ersetzt die Statuszeilen in `05-entwicklungsplan.md`.

## 1. Fertig umgesetzt (Software)

| Bereich | Stand |
|---|---|
| Datenmodell | 26 Migrationen, 72 Tabellen, RLS auf allen Tabellen, JWT-Claims über Custom Access Token Hook, Exclusion-Constraints gegen Doppelbuchung, Härtung (Schüler schreiben Lernergebnisse nur über Server). SQL-Tests mit 12 Gruppen laufen in CI. |
| Regelwerk | Versionierte Regeln (`rule_versions`) für Theorieprüfung, praktische Prüfung, Sonderfahrten, Theorieunterricht. Klasse B veröffentlicht, alle anderen Klassen als `needs_verification`. Keine gesetzlichen Werte im Code. |
| Lern-Engine | Adaptive Wiederholung (SM-2-Variante mit Sicherheit und Antwortzeit), Mastery je Frage und Thema, Prüfungsreife 0 bis 100 mit Faktoren und Bändern, Fehleranalyse, Fragenauswahl je Modus, Schwierigkeitsstufen 1 bis 5 mit Stufen-Modus, Zeichen-Trainer, Heute-Plan, Kompetenzprofil, Prognose, Gamification (XP, Level, Serie, Abzeichen, Tages-Challenge, Wochen-Bestenliste). 19 Unit-Tests. |
| Inhalte Klasse B | 772 eigene Übungsfragen in 19 Themen (davon 570 im September 2026 ergänzt, überwiegend schwer: Kombinations-, Ausnahme- und Rechenfragen, 330 mit mehreren richtigen Antworten, 57 numerisch) plus 400 automatisch erzeugte Zeichenfragen (eine je Katalogzeichen, richtig per Konstruktion), zusammen 1.172 Fragen auf fünf Schwierigkeitsstufen (Themenfragen 61/166/162/326/57, Zeichenfragen 42/21/83/109/145), 10 Fragen mit Kennzeichnung "fachliche Verifikation ausstehend", 19 Kapitel, 83 Wissenseinträge, 45 Prüferfragen, Verkehrszeichenkatalog als Vektorgrafik mit 408 Zeichen (Anlagen 1 bis 4 und 88 Zusatzzeichen), 47 Situationsgrafiken, 18 Vorfahrt-Situationen. Kennzeichnung "Übungsfrage (kein amtlicher Prüfungsinhalt)". Fachprüfung siehe `08-fachpruefung-inhalte.md`. |
| Schüler-Web | Heute-Modus mit Tages-Challenge und Lernplan bis zur Prüfung, Lernbereich mit allen Modi, Stufen-Modus, Verkehrszeichenkatalog mit Suche, Vorfahrt-Trainer (Reihenfolge antippen), Wochen-Bestenliste (freiwillig), Vorlesen, Farbwelten und Darstellung je Nutzer, Selbstlern-Modus ohne Fahrschule, Prüfungssimulation mit eingefrorener Regelversion, Warum-Knopf, KI-Lerncoach mit Quellen, Fahrstunden und Buchung, Warteliste, Kompetenzprofil, Kostenprognose mit Hinweis, Dokumente, Finanzen, Profil, Datenschutzanfragen, Theorie-Check-in per QR. |
| Fahrlehrer-Web | Tagesansicht, Schnelldokumentation, Sprachnotiz mit KI-Entwurf (Bestätigung durch Fahrlehrer), Schülerübersicht, Prüfungsfreigabe, Verfügbarkeiten. |
| Verwaltung | Support-Zugriff nur mit befristeter Freigabe, Schüler und Anmeldung, Team, Kalender, Theorieunterricht, Fahrzeuge, Finanzen (Preislisten, Rechnungen, Zahlungen, Mahnlauf, SEPA-Mandate, Stripe-Webhook), Dokumente (Prüfqueue, Vorlagen, Aufbewahrung), Einstellungen (Stammdaten, Standorte, Stornoregeln, Anmeldelink mit QR, Rollen), Analytics, Änderungsprotokoll (Audit-Log), Datenschutzanfragen mit Export und Löschung (Pseudonymisierung). |
| Plattform | Mandantenverwaltung, Inhalte-CMS mit Versionierung und Rechtsstand, Regelverwaltung. |
| Mobile-App | Expo, Selbstlern-Registrierung in der App (ohne Browser, RPC mit Einwilligungen), Offline-Spiegel in SQLite, Sync-Warteschlange, Lernen offline, Stufen-Modus, Zeichen-Trainer und Katalog, Vorfahrt-Trainer, Bestenliste, Tages-Challenge, Vorlesen, Farbwelten, Prüfung serverseitig, Fahren, Finanzen, Profil, Check-in, Bilder zu Fragen. 28 Tests. |
| Querschnitt | Benachrichtigungen (Push, E-Mail, In-App, vier Sprachen), Cron-Jobs, i18n (de, en, tr, ar), Design System, Barrierefreiheit in den Kernflüssen, CI (Typecheck, Tests, Lint, Migrationen, Build). |

## 2. Läuft nur mit Zugängen oder Freigaben weiter

| Punkt | Was fehlt | Wer |
|---|---|---|
| Test gegen echtes Supabase-Projekt | Projekt-URL, anon key, service_role key, Verbindungsstring; danach Custom Access Token Hook im Dashboard aktivieren | Auftraggeber |
| Stripe SEPA | Stripe-Konto, Webhook-Secret, Testzahlungen | Auftraggeber |
| KI-Funktionen | API-Schlüssel des KI-Anbieters, Auftragsverarbeitungsvertrag | Auftraggeber |
| Push und E-Mail | Expo-Push-Zugang oder FCM, SMTP-Zugang | Auftraggeber |
| Amtliche Prüfungsfragen | Lizenz (TÜV | DEKRA arge tp 21); Rechtslage, Optionen, Kontakt und Anfrage-Vorlage in `12-lizenz-pruefungsinhalte.md`; bis dahin nur eigene Übungsfragen | Auftraggeber |
| Fachliche Freigabe | Prüfung aller Inhalte und Regelwerte durch einen zugelassenen Fahrlehrer, Rechtsstand dokumentieren | Fachprüfer |
| Store-Veröffentlichung | Apple- und Google-Entwicklerkonten, EAS-Builds, Datenschutzangaben | Auftraggeber |

## 3. Noch offen (Software)

- E2E: öffentliche Seiten, Vorschau-Lernsession und Farbwelten laufen in CI (Playwright); Flüsse mit Anmeldung brauchen ein Staging-Supabase. Lasttest-Skripte (k6) liegen unter tests/load und müssen gegen Staging ausgeführt werden.
- Regelwerte für die Klassen außer B verifizieren und veröffentlichen.
- Löschlauf: Dokumente mit abgelaufener Frist werden täglich entfernt; Fristen je Kategorie aus `retention_policies` müssen fachlich bestätigt werden (review_status).
- Support-Zugriff mit Freigabe ist umgesetzt (Einstellungen, Plattform, Protokoll); externe Prüfung der Rechtekonstruktion empfohlen.
- Externer Penetrationstest, Datenschutz-Folgenabschätzung, AVV-Dokumente.
- Observability: Fehler-Hook mit optionalem Webhook umgesetzt; Alarme und Wiederherstellungstest in Staging offen. Runbooks: docs/10-runbooks.md.
- Pilotbetrieb mit einer Fahrschule inklusive Hypercare.

## 4. Grobe Restschätzung

| Block | Aufwand |
|---|---|
| Echtes Supabase-Projekt anbinden und alle Flüsse einmal durchspielen | 1 bis 2 Tage nach Erhalt der Zugänge |
| Fachliche Verifikation der Inhalte durch Fahrlehrer | 3 bis 5 Tage extern |
| Offene Softwarepunkte aus Abschnitt 3 | 2 bis 3 Wochen |
| Store-Einreichung und Pilot | 4 bis 6 Wochen Kalenderzeit |
