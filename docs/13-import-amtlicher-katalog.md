# Import eines lizenzierten Fragenkatalogs

Stand: 20. September 2026. Die Pipeline ist fertig und gegen die lokale Datenbank getestet; sie wartet nur noch auf die Lieferung des Lizenzgebers (siehe `12-lizenz-pruefungsinhalte.md`).

## Ablauf in fünf Schritten

1. Lieferung des Lizenzgebers (Datenbank, XML oder JSON plus Bild- und Videodateien) mit einem kleinen Mapper in das Austauschformat `fahrpilot-official-1` bringen (Abschnitt 2). Der Mapper ist die einzige Stelle, die vom Lieferformat abhängt; er wird geschrieben, sobald das Format bekannt ist.
2. Probelauf: `pnpm --filter @fahrpilot/content import-official -- lieferung.json --dry-run` zeigt, wie viele Fragen neu, geändert, unverändert oder nicht mehr geliefert sind. Validierungsfehler (fehlende richtige Antwort, doppelte Fragenummer, Videofrage ohne Video, unbekanntes Thema) brechen ab, bevor etwas geschrieben wird.
3. Import: `DATABASE_URL=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm --filter @fahrpilot/content import-official -- lieferung.json --media-dir ./medien [--retire-missing]`. Medien landen im privaten Bucket `content` unter `official/<Lizenzkennung>/<Datei>`, die App liefert sie über `/api/media` mit signierter URL aus (Web und Mobile, Bild und Video).
4. Freischaltung je Fahrschule: Plattform-Admin hinterlegt unter `/plattform/fahrschulen` die Lizenz mit derselben Lizenzkennung. Ohne gültige Lizenz bleiben die Fragen unsichtbar (RLS, Migration 0027). Für die Kauf-App wird die Lizenz dem Selbstlern-Mandanten `selbstlerner` zugewiesen.
5. Stichtag: Fassungen mit künftigem `valid_from` (1. April, 1. Oktober) werden erst am Stichtag aktiv. Der tägliche Cron (`/api/cron/daily`) und jeder Import rufen `activate_due_question_versions()` auf; alte Fassungen enden am Vortag, laufende Lernstände bleiben an der Frage (stabile Frage-ID) erhalten.

## Austauschformat `fahrpilot-official-1`

Schema in `packages/content/src/import-official.ts` (Zod), Beispiel in `packages/content/scripts/fixtures/official-sample.json` (Testdaten, kein amtlicher Inhalt).

| Feld | Bedeutung |
|---|---|
| `license_id`, `licensor` | Lizenzkennung und Lizenzgeber; die Kennung muss mit `tenant_content_licenses.license_id` übereinstimmen |
| `valid_from`, `legal_basis_date` | Stichtag der Lieferung und Rechtsstand |
| `questions[].external_ref` | Amtliche Fragenummer, stabil über Lieferungen |
| `topic`, `material_kind`, `license_codes` | Zuordnung zu den 19 Themen der App, Grund- oder Zusatzstoff, Klassen (leer = alle) |
| `points`, `kind`, `difficulty` | Punkte laut Katalog; Art `multiple_choice`, `numeric` oder `video`; Schwierigkeit optional (Standard 0,5, wird später aus Antwortdaten kalibriert) |
| `text`, `answers[]`, `numeric_answer`, `tolerance`, `explanation`, `legal_reference` | Inhalt; Antworten mit `correct` und optionaler Begründung |
| `media` | `file` (Dateiname ohne Pfad), `kind` (`image` oder `video`), `alt` (Beschreibung für Vorlesen und Barrierefreiheit), `credit` |

## Was der Importer garantiert

- Idempotent: dieselbe Lieferung zweimal importiert ändert nichts (Inhalts-Hash in `question_versions.source_note`).
- Versioniert: geänderte Fragen bekommen eine neue Version ab `valid_from`; frühere Fassungen bleiben mit `valid_until` erhalten (Nachvollziehbarkeit, laufende Prüfungssimulationen).
- Nicht gelieferte Fragen werden nur mit `--retire-missing` zurückgezogen; eine spätere Lieferung belebt sie wieder.
- Jeder Lauf schreibt einen Eintrag in `audit_logs` (Lizenz, Stichtag, Zahlen).
- Tests: `packages/content/src/import-official.test.ts` (Validierung, Änderungserkennung), SQL-Test Gruppe 15 (Stichtags-Aktivierung und Sichtbarkeit), Gruppe 13 (Lizenzfreischaltung).

## Offen bis zur Lieferung

- Mapper vom Lieferformat des Lizenzgebers in `fahrpilot-official-1` (Kapitelstruktur des Katalogs auf die 19 Themen abbilden; Vorschlag: Zuordnungstabelle Kapitelnummer zu Thema als JSON neben dem Mapper).
- Darstellungsvorgaben des Lizenzgebers (Kennzeichnung, Nennung) im Frage-Header umsetzen, sobald der Vertrag sie nennt; der Platz dafür ist `question_versions.media_credit` und `source_note`.
- Videofragen in der Prüfungssimulation: Das Video darf laut Prüfungspraxis mehrfach angesehen werden, die Antworten erscheinen erst nach dem Abspielen. Der Runner blendet die Antworten heute sofort ein; die Sperre bis zum ersten vollständigen Abspielen wird ergänzt, sobald die Vorgabe des Lizenzgebers vorliegt.
