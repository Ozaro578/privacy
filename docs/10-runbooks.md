# 10 Runbooks

Kurze Handlungsanleitungen für den Betrieb. Jede Maßnahme wird im Betriebsprotokoll (Datum, Person, Grund, Ergebnis) festgehalten.

## 1. Vorfall (Störung im Betrieb)

1. Einordnen: Betrifft es alle Fahrschulen oder eine? Web, Mobile-Sync oder beides? Fehlerlogs in Vercel (Funktion `onRequestError`, JSON-Zeilen mit `source: next.onRequestError`) und Supabase (Logs, Auth, Postgres) prüfen.
2. Sofortmaßnahmen: bei Datenbanküberlast Cron-Jobs pausieren (Vercel Cron deaktivieren), bei fehlerhaftem Release Rollback (Abschnitt 2).
3. Kommunikation: Statusmeldung an betroffene Fahrschulen über die Plattform-Benachrichtigung (Typ `system_notice`), bei längerer Störung E-Mail an die Admin-Adressen der Fahrschulen.
4. Nachbereitung innerhalb von zwei Werktagen: Ursache, Zeitlinie, Maßnahme, Vorbeugung; bei Datenschutzrelevanz Prüfung der Meldepflicht (Art. 33 DSGVO, 72 Stunden).

## 2. Rollback eines Releases

1. Vercel: vorheriges Deployment auswählen und "Promote to Production" (Sekunden, keine Datenänderung).
2. Enthält das Release eine Migration, die Spalten entfernt oder umbenennt, ist ein reiner Code-Rollback nicht ausreichend. Regel: Migrationen sind additiv (neue Spalten, neue Funktionen); Entfernen erst im übernächsten Release, wenn kein Code mehr darauf zugreift.
3. Mobile-App: Ein Rollback des Servers muss mit der ältesten unterstützten App-Version kompatibel bleiben (`/api/sync` und `/api/exam` sind versioniert über die Zod-Schemata; neue Felder sind optional mit Standardwert).
4. Nach dem Rollback: Smoke-Test (Login, Heute, eine Lernsession, eine Buchung in Staging), Fehlerlogs 30 Minuten beobachten.

## 3. Migration in Produktion

1. Migration lokal gegen die Testdatenbank ausführen (`bash supabase/test/reset-local.sh`, SQL-Tests grün, Typen neu erzeugen und committen).
2. In Staging einspielen, Web-App gegen Staging bauen, E2E und ein manueller Durchlauf der betroffenen Flüsse.
3. Produktion: Wartungsfenster nur bei Sperren auf großen Tabellen (z. B. `student_question_attempts`); sonst laufender Betrieb. Migration mit `psql` als Rolle `postgres` in Reihenfolge der Nummern; jede Datei ist idempotent (`if not exists`, `create or replace`).
4. Direkt danach: Custom Access Token Hook prüfen (Token-Claims), Cron-Läufe kontrollieren, Fehlerlogs beobachten.

## 4. Wiederherstellung aus Backup

1. Supabase Point-in-Time-Recovery ist im Produktionsprojekt aktiv (Retention mindestens 7 Tage). Für eine Wiederherstellung wird ein neues Projekt aus dem gewählten Zeitpunkt erstellt, nie das laufende überschrieben.
2. Reihenfolge: Datenbank wiederherstellen, Storage-Buckets (documents, content) aus dem Storage-Backup spiegeln, Umgebungsvariablen der Web-App auf das neue Projekt umstellen, Custom Access Token Hook im neuen Projekt aktivieren, Cron-Secret neu setzen.
3. Vor der Umschaltung: Stichprobe (eine Fahrschule: Schülerzahl, letzte Rechnungsnummer, letzte Buchung) mit dem Stand vor dem Vorfall vergleichen.
4. Wiederherstellungstest: mindestens einmal je Quartal in Staging durchspielen und die Dauer protokollieren (Ziel unter 2 Stunden).

## 5. Secrets rotieren

- Service-Role-Key, Cron-Secret, Stripe-Webhook-Secret, KI-Schlüssel und SMTP-Zugang mindestens jährlich und sofort bei Verdacht rotieren.
- Reihenfolge: neuen Schlüssel anlegen, in Vercel setzen, Deployment auslösen, alten Schlüssel widerrufen, Fehlerlogs prüfen.

## 6. Datenschutzanfragen

- Export: Verwaltung, Schülerakte, "Vollständigen Datenexport (JSON) herunterladen"; Anfrage im Bereich Datenschutz auf "erledigt" setzen.
- Löschung: Anfrage auf "erledigt" setzen führt die Pseudonymisierung aus (`anonymize_student`); Rechnungen und Ausbildungsnachweise bleiben bis zum Ende der Aufbewahrungsfrist (`legal_hold_until`), danach entfernt der tägliche Lauf die Anfrage.
- Support-Zugriff der Plattform nur nach Freigabe durch die Fahrschule (Einstellungen), Sitzungen sind im Änderungsprotokoll sichtbar.

## 7. Lasttest-Protokoll

| Datum | Skript | Umgebung | Ergebnis | Maßnahme |
|---|---|---|---|---|
| noch nicht durchgeführt | tests/load/*.js | Staging | offen | vor Pilotbetrieb ausführen |
