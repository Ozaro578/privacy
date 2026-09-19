# FahrPilot: Entwicklungsplan

Stand: September 2026. Dieser Plan gliedert die Umsetzung in die 17 Phasen der Spezifikation, ordnet sie sieben Meilensteinen zu, schätzt Aufwand und Team, benennt den kritischen Pfad und die Risiken und listet die Punkte, die vor dem Produktivbetrieb zwingend zu klären sind. Grundlage sind 00-spezifikationsanalyse.md, 01-informationsarchitektur.md, 02-user-flows.md, 03-datenmodell.md und 04-architektur.md sowie das getestete Schema in supabase/migrations.

Statuslegende: erledigt, offen. Aufwand in Personenwochen (PW) als Spanne. Teststufen: Unit (Packages), SQL (supabase/test gegen Postgres), Integration (Server Actions und Edge Functions gegen Staging), E2E (Playwright, Detox oder Maestro), manuell (Fachprüfung, Accessibility).

## 1. Phasen

Aktueller Stand je Phase: siehe `09-umsetzungsstand.md`.

### Phase 1: Requirements und Informationsarchitektur (erledigt)

- Ziel: Vollständiges Verständnis der 53 Spezifikationsabschnitte, Modulzuordnung, Lücken, Verifikationsbedarf, Navigation und Screens je Rolle.
- Arbeitspakete: Spezifikationsanalyse (00), Informationsarchitektur (01) mit Screens, Zuständen, Benachrichtigungs-Taxonomie, Mehrsprachigkeit und Accessibility.
- Definition of Done: Dokumente liegen vor, jede Funktion ist einer Ausbaustufe und einem Modul zugeordnet, offene Entscheidungen sind dem Kunden benannt.
- Testumfang: Review durch Kunden und Fachseite.
- Abhängigkeiten: keine.
- Status: erledigt.

### Phase 2: User Flows (erledigt)

- Ziel: 21 Kernflüsse mit Schritten, Systemreaktionen, Fehlerfällen und Diagrammen.
- Arbeitspakete: Anmeldung, Login und Tenant-Wahl, Heute-Modus, Lernen, Simulation, KI-Coach, Buchung, Storno, Warteliste, Dokumentation, Kompetenzprofil, Theorieunterricht mit QR, Prüfungsplanung, Mock-Prüfung, Rechnung und Zahlung, Dokumente, Chat, Offline-Sync, DSGVO, Content-Freigabe, Regelversion-Update.
- Definition of Done: Jeder Flow nennt Tabellen und Packages, Fehlerfälle sind beschrieben.
- Testumfang: Review; Flows dienen später als Vorlage für E2E-Tests.
- Abhängigkeiten: Phase 1.
- Status: erledigt.

### Phase 3: Datenbankmodell (erledigt)

- Ziel: Verbindliches Schema mit Tenancy, Rollen, Regel-Engine, Inhalten, Lernen, Ausbildung und Terminen, Finanzen, Dokumenten, Kommunikation, DSGVO, RLS, Seed und RPC.
- Arbeitspakete: Migrationen 0001 bis 0010, Testshim für lokale Auth, SQL-Integrationstests (Tenant-Isolation, Rollen, Überschneidungen, Buchung, Storno, Check-in, Rechnungen, Regel-Engine, Audit), Dokumentation in 03-datenmodell.md.
- Definition of Done: reset-local.sh spielt alle Migrationen fehlerfrei ein; 01_rls_and_rpc_test.sql endet mit „ALLE TESTS BESTANDEN"; jede Tabelle hat RLS.
- Testumfang: SQL-Tests (neun Blöcke) vorhanden.
- Abhängigkeiten: Phase 1.
- Status: erledigt.

### Phase 4: Design System (erledigt)

- Ziel: packages/ui mit Design-Tokens und Kernkomponenten für Web, Tokens für Mobile, hell und dunkel, RTL-fähig, WCAG 2.1 AA.
- Arbeitspakete: Tokens (Farbe, Typografie, Abstände, Radien, Bewegung); Tailwind-v4-Theme aus Tokens; Komponenten Button, Eingaben, Formularfehler, Tabelle mit Pagination, Kalenderraster, Ampel mit Text und Symbol, Skeletons, Dialog, Toast, Badge, Sterne-Bewertung; Storybook oder gleichwertige Dokumentation; Accessibility-Prüfung je Komponente; Mobile-Token-Export.
- Definition of Done: Alle Komponenten der Screen-Liste (01, Abschnitt 3) sind abgedeckt; axe ohne Verstöße; Kontrast geprüft; Fokusreihenfolge dokumentiert.
- Testumfang: Unit (Rendering, Tastaturbedienung), visuelle Regression, axe in CI.
- Abhängigkeiten: Phase 1.
- Status: erledigt.

### Phase 5: Auth und Multi-Tenancy (erledigt)

- Ziel: Login, Einladung, Mitgliedschaften, Custom Access Token Hook, Tenant-Wechsel, MFA für Mitarbeiter, typisierte Clients.
- Arbeitspakete: Monorepo-Gerüst (pnpm, Turborepo, Lint, Typecheck); packages/db mit Typgenerierung und Clients (browser, server, service); Access Token Hook (tenant_id, tenant_role, platform_admin, active_tenant_id); Edge Function tenant-switch; Einladungsfluss für Fahrlehrer und Büro (tenant_memberships status invited bis active); Passwort-Reset, Magic Link; MFA-Erzwingung in apps/web für office, admin, owner; Navigationsgerüst je Rolle in apps/web und apps/mobile; Migrations-Lint (RLS auf jeder Tabelle mit tenant_id).
- Definition of Done: Zwei Test-Tenants sind gegenseitig unsichtbar (SQL-Test 1 und E2E); Nutzer mit zwei Mitgliedschaften wechselt den Tenant und sieht nur dessen Daten; Service-Role-Key ist im Client-Bundle nicht enthalten (Build-Prüfung).
- Testumfang: SQL (vorhanden), Integration (Hook), E2E (Login, Tenant-Wechsel, MFA).
- Abhängigkeiten: Phase 3, Phase 4 (Basiskomponenten).
- Status: erledigt.

### Phase 6: Student App (erledigt)

- Ziel: Schüler-App (Expo) und Schüler-Web mit Heute, Lernen, Fahren, Finanzen, Profil im MVP-Umfang, zunächst mit Online-Daten.
- Arbeitspakete: expo-router-Struktur; Heute-Screen mit Aufgabenliste (zunächst regelbasiert, später learning-engine); Themenliste und Frageansicht (theory_questions, question_versions, question_answers, published, valid); Lernmodi Falsche, Markierte, Schwierige, Nie beantwortete, Zufall; Versuche schreiben (student_question_attempts mit client_attempt_id); Statistiken; Fahren-Übersicht mit Terminen und Ausbildungsstand (special_drive_progress, rules-engine); Terminbuchung über book_lesson mit Konfliktanzeige; Storno über cancel_lesson mit Regelanzeige; Prüfungsstatus; Finanzen (invoices, payments) mit PDF; Profil, Dokumenten-Checkliste mit Upload in Storage; Datenschutz (consents, data_requests); Einstellungen; Push-Registrierung (push_tokens).
- Definition of Done: Alle MVP-Screens der Schülerliste (01, Abschnitt 3.1) mit den vier Zuständen leer, laden, Fehler, offline-Hinweis; kein Screen ohne Funktion; Buchung erzeugt lesson_bookings.
- Testumfang: Unit (Hooks, Formatierung), Integration (RPC-Aufrufe gegen Staging), E2E mobil (Lernen, Buchen, Storno, Upload).
- Abhängigkeiten: Phase 4, Phase 5, Content für Klasse B (eigene Übungsfragen im CMS, Phase 11).
- Status: erledigt.

### Phase 7: Learning Engine (erledigt)

- Ziel: packages/learning-engine mit Spaced Repetition (SM-2-Variante), Mastery, Prüfungsreife, Fehleranalyse, Heute-Priorisierung, Kostenprognose; Anbindung an student_question_state, student_topic_mastery, readiness_snapshots, daily_goals.
- Arbeitspakete: SM-2-Variante mit Sicherheit (confidence 1 bis 3) und Antwortzeit als Qualitätssignal; Mastery je Frage und Thema mit Coverage; Prüfungsreife 0 bis 100 mit Faktoren (Coverage, Mastery, Simulationsergebnisse, Fehlertrend, Sonderfahrten, Skills) und engine_version; Ampelstufen mit Disclaimer; Fehleranalyse nach Themen und Fragetypen; Heute-Modus (fällige Wiederholungen, Tagesziel, Vorbereitung auf nächste Fahrstunde über topics.practical_skill_code); Kostenprognose aus price_items, Ausbildungsstand und rule_versions; Edge Function readiness-recompute mit Cron; Gamification-Grundlage (xp_events, student_streaks, badges-Kriterien).
- Definition of Done: Deterministische Tests mit Fixtures für jeden Algorithmus; identische Ergebnisse Client und Server; readiness_snapshots enthalten nachvollziehbare Faktoren; Heute-Screen nutzt die Engine.
- Testumfang: Unit (Property-Tests für Intervalle und Grenzen), Integration (Cron-Lauf gegen Staging).
- Abhängigkeiten: Phase 3, Phase 6 (Datenfluss).
- Status: erledigt.

### Phase 8: Exam Engine (erledigt)

- Ziel: packages/rules-engine mit Zod-Schemas je rule_type, Regelauflösung mit base_class-Vererbung, Fragenauswahl für Simulationen, Bewertung und Ergebnisanalyse; Prüfungssimulation in der App.
- Arbeitspakete: Zod-Schemas für exam_theory, exam_practical, training_requirements, theory_lessons; Auflösung über rule_version_for und Vererbung B197/B78/B96 auf B; Fragenauswahl (Grundstoff und Zusatzstoff, Punkteverteilung, Klasse, Locale, nur published); Bewertung (Fehlerpunkte, Zwei-Fünf-Punkte-Regel, Zeitlimit falls gesetzt); Speicherung in exam_simulations mit rule_version_id und rule_snapshot, exam_results je Frage; Ergebnisanalyse (Themenfehler, Empfehlungen); Anzeige von Regelversion und Rechtsstand; Ausbildungsstand je Klasse aus special_drive_progress und attendance gegen gepinnte Regelversion; Sperre der Simulation ohne published-Regel.
- Definition of Done: Simulation Klasse B Ersterwerb bewertet identisch zu manuell gerechneten Fixtures; Klassen mit needs_verification zeigen „in fachlicher Prüfung"; Ergebnis bleibt nach Regeländerung reproduzierbar (Test aus Flow 21).
- Testumfang: Unit (Bewertung, Auswahl, Vererbung), SQL (Regelauflösung vorhanden), E2E (Simulation durchführen).
- Abhängigkeiten: Phase 3, Phase 6.
- Status: erledigt.

### Phase 9: Instructor App (erledigt)

- Ziel: Fahrlehrer-App (Expo) und Fahrlehrer-Web mit Heute, Schüler, Kalender, Dokumentation, Nachrichten.
- Arbeitspakete: Tagesplan (lessons je instructor_id); Schülerkurzprofil mit Theorie-Schwächen (student_topic_mastery); Schnell-Dokumentation (lesson_evaluations, student_skill_scores, Sonderfahrtart und Einheiten bestätigen, Sichtbarkeit); Stunde abschließen (status completed); Schülerliste und Schülerdetail (Kompetenzprofil, Verlauf, Prüfungsstatus, Dokumentenstatus ohne Inhalte); Kalender mit Verfügbarkeit (instructor_availability), Abwesenheiten (instructor_absences), Slots anlegen, Termin verschieben; Chat (conversations, messages, Realtime); Profil mit Tenant-Wechsel.
- Definition of Done: Dokumentation einer Stunde in unter 30 Sekunden (gemessen im Test); Fahrlehrer sieht keine Finanzdaten und keine Dokumentinhalte; Kompetenzprofil aktualisiert sich nach Bewertung.
- Testumfang: Integration (RLS für instructor), E2E mobil (Dokumentation, Verfügbarkeit, Chat).
- Abhängigkeiten: Phase 5, Phase 4; Phase 7 für Theorie-Schwächen.
- Status: erledigt.

### Phase 10: Scheduling (erledigt)

- Ziel: Terminplanung im Büro-Web über alle Fahrlehrer und Fahrzeuge, Theorieunterricht mit QR-Check-in, Warteliste, Erinnerungen.
- Arbeitspakete: Kalender Tag/Woche/Monat mit Filtern (lessons, GiST-Index); Slot-Erzeugung aus Verfügbarkeiten; Buchung durch Büro (book_lesson); Storno mit Regel (cancel_lesson); Konfliktanzeige aus Exclusion-Fehlern; Fahrzeugzuweisung mit vehicle_blocks; Theorieunterricht (theory_classes) mit Lektionscodes aus der theory_lessons-Regel, QR-Anzeige (create_checkin_token, Rotation), Anwesenheitsliste, Nachträge mit Audit; Warteliste (waitlist_entries, waitlist_offers, offer_lesson_to_waitlist, Annahme durch Schüler); Cron-Erinnerungen 24 h und 2 h; Serienplanung für Theoriekurse (Erweiterung theory_class_series).
- Definition of Done: Doppelbuchung ist in parallelen Tests unmöglich; Check-in-Flow aus Flow 12 läuft mit rotierendem Code; Wartelistenangebot läuft ab und wird erneut vergeben.
- Testumfang: SQL (Überschneidung, Buchung, Storno, Check-in vorhanden), Integration (Cron), E2E Web (Kalender, Theorieunterricht).
- Abhängigkeiten: Phase 5, Phase 9 (Verfügbarkeiten).
- Status: erledigt.

### Phase 11: Administration (erledigt)

- Ziel: Büro-, Admin- und Owner-Bereiche sowie Plattform-CMS.
- Arbeitspakete: Übersicht mit Tageskennzahlen; Schülerliste und Digitale Anmeldung (students, student_licenses, consents, Dokumenten-Checkliste aus document_requirements); Schülerakte mit Reitern; Team (tenant_memberships, instructors, Einladungen); Fahrzeuge mit Fristen; Prüfungen mit Statusworkflow (theory_exams, practical_exams, app.exam_status); Stornierungsregeln (cancellation_policies, nur admin); Einstellungen (driving_schools, locations); Owner: Standorte, Rollen, Analytics-Grundlage; Plattform-CMS: Fragen mit Versionen und Freigabe-Workflow (content_reviews, Vier-Augen-Prinzip), Regelversionen mit Vergleich, Wissensbasis, Tenants ohne Personendaten; Tenant-eigene Übungsfragen (tenant_id gesetzt); CSV-Import für Schüler, Fahrlehrer, Fahrzeuge.
- Definition of Done: Eine Fahrschule kann vollständig ohne Entwicklerhilfe eingerichtet werden; Plattform-Admin veröffentlicht eine Frage und eine Regelversion über den Workflow; office hat keinen Zugriff auf Admin-Funktionen (RLS und Navigation).
- Testumfang: Integration (RLS je Rolle), E2E Web (Anmeldung, Prüfungsworkflow, CMS-Freigabe).
- Abhängigkeiten: Phase 5, Phase 4.
- Status: erledigt.

### Phase 12: Payments und Documents (erledigt)

- Ziel: Rechnungen mit lückenlosen Nummern und PDF, Zahlungen, SEPA-Mandate, Mahnlauf, Verträge, Dokumentenprüfung, Ausbildungsnachweis.
- Arbeitspakete: packages/payments mit PaymentProvider-Interface und Stripe-Adapter (SEPA-Lastschrift, Karten); Rechnungserstellung aus Preisliste (price_lists, price_items) und abgeschlossenen Stunden (invoice_items.lesson_id); issue_invoice; PDF-Erzeugung mit versionierter Vorlage in Storage; Storno und Gutschrift (credit_note_for); Zahlungserfassung (bar, Überweisung); Edge Function payments-webhook mit Signaturprüfung und webhook_event_id; Mandate (payment_mandates); Mahnlauf per Cron (dunning_level, Benachrichtigungen); Verträge (contracts) mit Signaturverfahren-Adapter; Dokumentenprüfung im Büro (documents status verified/rejected); Ausbildungsnachweis-Export (Erweiterung training_certificates); Kostenprognose-Anbindung.
- Definition of Done: Rechnungsnummern lückenlos in parallelen Tests; ausgestellte Rechnung unveränderlich; Webhook-Replay erzeugt keine zweite Zahlung; PDF enthält alle Pflichtangaben (fachlich zu verifizieren durch Steuerberatung).
- Testumfang: SQL (Rechnung vorhanden), Unit (Adapter, PDF), Integration (Webhook mit Testevents), E2E (Rechnung bis Zahlung).
- Abhängigkeiten: Phase 11, Phase 10 (abgeschlossene Stunden).
- Status: erledigt.

### Phase 13: AI Features (erledigt)

- Ziel: packages/ai mit Guardrails, Edge Functions für Coach, Warum-Button, Fehleranalyse, Sprachnotizen, Prüfer-Fragen-Trainer, Fahrlehrer-Abfragen.
- Arbeitspakete: Provider-Abstraktion (Anthropic-Adapter, OpenAI optional); Retrieval über knowledge_entries (Volltext, published, Locale, Klasse); Prompt-Vorlagen; Zitationsprüfung und Confidence; Kontingent je Schüler und Budget je Tenant (Erweiterung ai_usage); coach_conversations und coach_messages; Warum-Button aus question_versions.explanation mit KI-Umformulierung nur auf Basis geprüfter Erklärung; Fehleranalyse mit Übungsgenerierung aus bestehenden Fragen (keine neuen Fachaussagen); Speech-to-Text-Adapter und Strukturierung in lesson_evaluations.ai_draft mit Bestätigung; Audio-Löschung nach Bestätigung; Prüfer-Fragen-Bewertung gegen expected_points; Fahrlehrer-Abfragen als Zod-validiertes Query-Objekt über zugewiesene Schüler; Einwilligung ai_processing als Voraussetzung.
- Definition of Done: Jede Antwort trägt Quellen oder confidence uncertain; Prompt-Injection-Testfälle werden abgewehrt; Kosten je Anfrage werden protokolliert; Sprachnotiz-Entwurf wird nie ohne Bestätigung sichtbar.
- Testumfang: Unit (Retrieval-Ranking, Zitationsprüfung, Schemas), Integration (Edge Functions mit aufgezeichneten Antworten), manuelle Fachprüfung von Stichproben.
- Abhängigkeiten: Phase 7, Phase 9, Wissensbasis-Inhalte (Phase 11), DSFA-Ergebnis.
- Status: erledigt.

### Phase 14: Analytics (erledigt)

- Ziel: Lernanalytics für Schüler (vertieft), Fahrschul-Analytics für Owner, Kennzahlen im Büro.
- Arbeitspakete: Aggregationen über lessons, lesson_bookings, exam_simulations, theory_exams, practical_exams, invoices (Views oder materialisierte Views je Tenant); Auslastung je Fahrlehrer und Fahrzeug; Prüfungsquoten; Durchlaufzeit Anmeldung bis Prüfung; Stornoquote; Umsatz; Wartelistenlänge; Export CSV; Schüler-Statistiken (Lernzeit, Trefferquote, Verlauf, Schwachstellen); Diagramme mit Textzusammenfassung (Accessibility).
- Definition of Done: Kennzahlen stimmen mit SQL-Kontrollabfragen überein; keine Personendaten in Plattform-Aggregaten; Ladezeit unter Zielwert.
- Testumfang: SQL (Kontrollabfragen), Integration, E2E (Filter, Export).
- Abhängigkeiten: Phase 10, Phase 12.
- Status: erledigt (Kennzahlen im Büro und Plattform; Lasttest offen).

### Phase 15: Security und DSGVO (teilweise)

- Ziel: Umsetzung des Sicherheits- und Datenschutzkonzepts aus 04-architektur.md Abschnitt 4.
- Arbeitspakete: Storage-Policies je Pfadpräfix; Rate-Limits in Edge Functions; Secrets-Management und Rotation; Export (data-export) und Löschung (data-deletion) mit Pseudonymisierung und legal_hold; Löschläufe nach retention_policies; Einwilligungsverwaltung mit Textversionen; Audit-Log-Ansicht für Admins; Support-Zugriff mit Freigabe (Erweiterung support_access_grants); Chat-Einsicht bei Minderjährigen mit Transparenzhinweis; Threat-Model-Review; Penetrationstest durch Dritte; AVV-Dokumente; DSFA-Begleitung.
- Definition of Done: Export liefert vollständige Daten eines Schülers; Löschung pseudonymisiert Rechnungen und entfernt Lerndaten; Penetrationstest ohne offene hohe Befunde; Threat-Model-Maßnahmen nachweisbar getestet.
- Testumfang: SQL (Isolation), Integration (Export, Löschung), automatisierte Sicherheitsscans, externer Test.
- Abhängigkeiten: alle vorherigen Phasen mit Datenfluss.
- Status: teilweise (Export, Löschung mit Pseudonymisierung, Einwilligungen, Härtung umgesetzt; Pentest, DSFA, Löschläufe offen).

### Phase 16: Tests (teilweise)

- Ziel: Vollständige Testpyramide und Offline-Sync-Tests; Testdaten nur in Test und Staging.
- Arbeitspakete: Unit-Abdeckung rules-engine und learning-engine über 90 Prozent; SQL-Tests erweitert um Ersterwerb/Erweiterung, Einheitenberechnung, parallele Buchungen und Rechnungsnummern, Minderjährigen-Einwilligung; E2E-Suiten aus den 21 Flows; Offline-Sync-Tests mit Konfliktszenarien (Duplikate, row_version-Konflikt, Reihenfolge); Lasttest Kalender und Simulation; Accessibility-Prüfung manuell mit VoiceOver und TalkBack; i18n-Schlüsselprüfung; Migrations-Lint.
- Definition of Done: CI führt alle Stufen aus; Merge nur bei grünem Lauf; Testdaten sind gekennzeichnet und in Produktion ausgeschlossen.
- Testumfang: alle Stufen.
- Abhängigkeiten: Phasen 5 bis 15 (Tests werden phasenbegleitend geschrieben, Phase 16 schließt Lücken).
- Status: teilweise (Unit, SQL, Lint, Build in CI; E2E-Suiten und Lasttests offen).

### Phase 17: Production Deployment (offen)

- Ziel: Produktivbetrieb mit Pilot-Fahrschule.
- Arbeitspakete: Supabase-Produktionsprojekt in Frankfurt mit PITR; Vercel-Produktion; EAS-Produktions-Builds und Store-Einreichung; Observability (Sentry, Alarme); Backup- und Wiederherstellungstest; Runbooks (Vorfall, Rollback, Migration); Onboarding der Pilot-Fahrschule (Import, Preisliste, Stornoregel, Team); Content-Freigabe Klasse B; Hypercare-Zeitraum.
- Definition of Done: Pilotbetrieb über vier Wochen ohne kritische Vorfälle; Wiederherstellung aus Backup getestet; alle Punkte aus Abschnitt 5 geklärt.
- Testumfang: Smoke-Tests nach Deployment, Wiederherstellungstest, Monitoring.
- Abhängigkeiten: Phasen 15 und 16, Freigaben aus Abschnitt 5.
- Status: offen (wartet auf Zugänge und Freigaben, siehe 09-umsetzungsstand.md).

## 2. Meilensteine

| Meilenstein | Inhalt | Phasen | Abnahmekriterium |
|---|---|---|---|
| M1 Fundament | Monorepo, Design System, Auth, Multi-Tenancy, typisierte Clients, CI | 4, 5 | Zwei Tenants gegenseitig unsichtbar in E2E; Tenant-Wechsel funktioniert; CI grün |
| M2 Schüler-MVP | Lernen, Simulation, Dashboard (Heute), Learning Engine, Exam Engine, Buchung aus Schülersicht | 6, 7, 8 | Simulation Klasse B mit Regelversion und Rechtsstand; Prüfungsreife mit Faktoren; Buchung und Storno aus der App |
| M3 Fahrschulbetrieb | Fahrlehrer-App, Terminplanung, Theorieunterricht, Administration, CMS | 9, 10, 11 | Fahrschule arbeitet einen Tag vollständig im System: Anmeldung, Termine, Dokumentation, Check-in, Prüfungsworkflow |
| M4 Finanzen und Dokumente | Rechnungen, Zahlungen, SEPA, Mahnlauf, Verträge, Ausbildungsnachweis | 12 | Rechnung bis Zahlung inklusive Webhook; Ausbildungsnachweis exportierbar |
| M5 KI | Coach, Warum-Button, Fehleranalyse, Sprachnotizen, Prüfer-Fragen, Fahrlehrer-Abfragen | 13 | Antworten nur mit Quellen; Budget greift; DSFA berücksichtigt |
| M6 Mobile und Offline | Offline-Lernen mit Sync-Queue, Content-Bundles, Fahrlehrer-Doku offline, Analytics | 6 (Offline-Anteil), 14, 16 (Sync-Tests) | Offline-Sync ohne Datenverlust in Konfliktszenarien; App-Start unter Zielwert |
| M7 Produktion | Security, DSGVO, Tests, Deployment, Pilot | 15, 16, 17 | Pilotbetrieb abgenommen; Freigabeliste vollständig |

Reihenfolge: M1, dann M2 und M3 parallel (getrennte Teams), M4 nach M3, M5 nach M2 und M3, M6 parallel zu M4 und M5, M7 zuletzt.

## 3. Team und Aufwand

Empfohlenes Kernteam: 1 Tech Lead/Architekt, 2 Full-Stack (Next.js, Supabase), 2 Mobile (Expo), 1 Backend/SQL (Migrationen, RPC, Edge Functions), 1 Designer (Design System, Accessibility), 1 QA (E2E, SQL-Tests), 0,5 Product Owner, fachliche Beratung (Fahrschulwesen, Datenschutz, Steuer) auf Abruf.

| Phase | Aufwand (PW) | Hauptrollen |
|---|---|---|
| 1 Requirements und IA | erledigt | |
| 2 User Flows | erledigt | |
| 3 Datenbankmodell | erledigt (Pflege 1 bis 2 PW je Meilenstein) | Backend |
| 4 Design System | 6 bis 9 | Designer, Full-Stack |
| 5 Auth und Multi-Tenancy | 6 bis 9 | Backend, Full-Stack |
| 6 Student App | 14 bis 20 | Mobile, Full-Stack |
| 7 Learning Engine | 6 bis 9 | Backend, Tech Lead |
| 8 Exam Engine | 5 bis 8 | Backend, Tech Lead |
| 9 Instructor App | 8 bis 12 | Mobile |
| 10 Scheduling | 8 bis 12 | Full-Stack, Backend |
| 11 Administration | 12 bis 18 | Full-Stack |
| 12 Payments und Documents | 8 bis 12 | Backend, Full-Stack |
| 13 AI Features | 8 bis 12 | Backend, Tech Lead |
| 14 Analytics | 4 bis 6 | Full-Stack |
| 15 Security und DSGVO | 5 bis 8 | Tech Lead, Backend, extern |
| 16 Tests | 6 bis 10 | QA, alle |
| 17 Production Deployment | 4 bis 6 | Tech Lead, Backend |
| Summe offen | 100 bis 151 | |

Bei sieben Vollzeitpersonen entspricht das etwa 15 bis 22 Kalenderwochen bei idealer Parallelisierung; realistisch mit Abstimmung, Fachprüfungen und Store-Freigaben 6 bis 9 Monate bis M7.

## 4. Kritischer Pfad

1. Phase 5 (Auth, Multi-Tenancy, Clients) blockiert alle Apps.
2. Phase 4 (Design System) blockiert die Oberflächen; Basiskomponenten früh liefern, Rest parallel.
3. Phase 8 (Exam Engine) hängt an freigegebenen Regelversionen und Inhalten für Klasse B; Content-Freigabe im CMS (Phase 11) muss vor M2 nutzbar sein, notfalls als reduziertes CMS.
4. Phase 12 (Payments) hängt an Vertrag mit dem Zahlungsanbieter und steuerlicher Prüfung der Rechnungsvorlage.
5. Phase 13 (KI) hängt an DSFA, AVV mit LLM-Anbieter und Einwilligungstexten.
6. Phase 17 hängt an der Freigabeliste in Abschnitt 5; einzelne Punkte (Fragenlizenz, Regelverifikation) haben lange Vorlaufzeiten und werden ab M1 parallel betrieben.

## 5. Risiken und Gegenmaßnahmen

| Risiko | Wahrscheinlichkeit | Auswirkung | Gegenmaßnahme |
|---|---|---|---|
| Lizenz für amtliche Fragen nicht rechtzeitig oder nicht erhältlich | mittel | hoch | Eigene Übungsfragen als vollwertiger Modus; source-Kennzeichnung und Lizenz-Gate vorbereitet; Lizenzverhandlung ab M1 |
| Regelwerte anderer Klassen bleiben unverifiziert | mittel | hoch | needs_verification-Gate bleibt aktiv; Klasse B zuerst produktiv; fachlicher Reviewer mit Turnus benannt |
| Content-Erstellung dauert länger als Entwicklung | hoch | mittel | Content-Team parallel ab M1; CMS früh nutzbar; Mindestumfang je Thema definiert |
| Offline-Sync verliert Daten | niedrig | hoch | Append-only mit Idempotenzschlüsseln; Sync-Tests mit Konfliktszenarien in Phase 16 verpflichtend |
| Doppelbuchung durch Race-Condition | niedrig | mittel | Exclusion-Constraints; parallele Buchungstests |
| Tenant-Isolation bricht durch neue Tabelle | mittel | sehr hoch | Migrations-Lint in CI; Isolationstests je Rolle; Code-Review-Checkliste |
| KI-Halluzination | hoch ohne Guardrails | hoch | Nur Knowledge-Base-Antworten mit Quellen; Confidence; Fachstichproben; keine Regelwerte aus dem Modell |
| Zahlungsanbieter-Vertrag verzögert sich | mittel | mittel | Rechnung und manuelle Zahlungserfassung unabhängig vom Anbieter; SEPA in Ausbaustufe 2 |
| Store-Freigabe verzögert | mittel | mittel | Frühe Testflight- und Play-Interntests; Datenschutzangaben vorbereitet |
| Unwirksame Stornogebühren durch Tenant-Konfiguration | mittel | mittel | Kein Standardwert; Hinweis auf AGB-Prüfung; jede Anwendung dokumentiert (fee_reason) |
| Teamwechsel bei Schlüsselrollen | mittel | mittel | Dokumentation (00 bis 05), Tests, Pairing bei Engine-Themen |
| Performance bei großen Tenants | niedrig im MVP | mittel | Indizes vorhanden; Partitionierung und Pagination vorbereitet; Lasttest in Phase 16 |

## 6. Vor Produktion zwingend zu klären

| Punkt | Verantwortung | Auswirkung ohne Klärung |
|---|---|---|
| Lizenz für den amtlichen Fragenkatalog (zentral durch Plattform oder je Fahrschule) | Kunde, Plattformbetreiber | Nur eigene Übungsfragen; Lizenz-Gate bleibt geschlossen |
| Fachliche Verifikation der Regelwerte je Klasse und Erwerbsart (exam_theory, exam_practical, training_requirements, theory_lessons) einschließlich Fristen und Mindestalter | Fachlicher Reviewer (Fahrschulwesen) | Klassen außer B bleiben auf needs_verification und sind nicht auswählbar |
| Stornogebühren und AGB je Fahrschule (rechtliche Prüfung der Klauseln, Verweis in cancellation_policies.contract_clause_reference) | Fahrschule mit Rechtsberatung | Storno ohne Gebühr oder unwirksame Gebühren |
| Signaturverfahren für Ausbildungsverträge (on_paper, simple_electronic, advanced_electronic, qualified_electronic) und Anbieter | Kunde mit Rechtsberatung | Verträge nur auf Papier oder mit einfacher Bestätigung |
| Auftragsverarbeitungsverträge mit Supabase, LLM-Anbieter, Speech-to-Text, Zahlungsanbieter, Push- und E-Mail-Provider sowie eigener AVV gegenüber Fahrschulen mit Subprozessorliste | Plattformbetreiber, Datenschutzberatung | Kein rechtmäßiger Betrieb |
| Datenschutz-Folgenabschätzung (KI, Sprachaufnahmen, Standortdaten, Minderjährige) | Plattformbetreiber, Datenschutzberatung | KI-Funktionen und Geofence bleiben deaktiviert |
| Vertrag mit dem Zahlungsanbieter (SEPA-Lastschrift, Gebühren, Rückbuchungen) | Plattformbetreiber oder Fahrschule | Nur manuelle Zahlungserfassung |
| Prüfungssprachen (Liste im Payload exam_theory.exam_languages) und Trennung von App-Sprachen | Fachlicher Reviewer | Prüfungsplanung ohne Sprachauswahl |
| Aufbewahrungsfristen je Datenkategorie außer Rechnungen (retention_policies mit needs_verification) | Datenschutz- und Steuerberatung | Löschläufe nur für Rechnungen konfiguriert |
| Pflichtinhalte des Ausbildungsnachweises und der Rechnungs-PDF | Fachlicher Reviewer, Steuerberatung | Exporte ohne Freigabe |
| Umsatzsteuerliche Einordnung je Fahrschule (Steuersatz, Kleinunternehmerregelung, E-Rechnungspflicht bei Firmenkunden) | Steuerberatung der Fahrschule | Falsche Rechnungen |
| Umfang der Chat-Einsicht durch das Büro bei minderjährigen Schülern | Kunde mit Rechtsberatung | Chat für Minderjährige eingeschränkt |
| Backup-Ziele (RPO, RTO) und Notfallplan | Kunde, Plattformbetreiber | Keine belastbare Wiederherstellungszusage |
