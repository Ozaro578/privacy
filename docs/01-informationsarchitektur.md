# FahrPilot: Informationsarchitektur

Stand: September 2026. Dieses Dokument beschreibt Navigationsstruktur, Screens, Zustände, Benachrichtigungen, Mehrsprachigkeit und Accessibility-Prinzipien je Rolle. Es basiert auf der Spezifikationsanalyse (00-spezifikationsanalyse.md) und den verbindlichen Architekturentscheidungen (Monorepo, Supabase mit RLS, rules-engine, learning-engine).

## 1. Grundprinzipien

1. Eine Oberfläche je Kontext: Schüler und Fahrlehrer unterwegs nutzen apps/mobile (Expo). Büro, Admin, Owner und Plattform-Admin nutzen apps/web (Next.js App Router). Fahrlehrer erhalten zusätzlich eine Web-Ansicht mit identischer Navigation für die Arbeit am Schreibtisch; Schüler erhalten das Schüler-Web mit reduziertem Umfang (Lernen, Termine, Finanzen, Profil).
2. Rollen bestimmen Navigation, nicht nur Sichtbarkeit: Die Navigation wird serverseitig aus der Rolle im JWT abgeleitet. Ein Screen ohne Berechtigung existiert für die Rolle nicht (kein ausgegrauter Eintrag).
3. Jede Datenanzeige nennt ihre Quelle in Form von Tabellen, damit RLS-Regeln, Tests und Berechtigungen direkt ableitbar sind.
4. Rechtsstand ist sichtbar: Jeder Screen, der Regelwerte oder Inhalte aus dem CMS zeigt, blendet die Regelversion mit Gültigkeitsdatum ein.
5. Keine Platzhalter: Leere Zustände sind gestaltete Screens mit einer eindeutigen nächsten Aktion.

## 2. Navigationsstruktur je Rolle

### 2.1 Schüler (mobil, Tab-Navigation)

| Tab | Inhalt | Untergeordnete Screens |
|---|---|---|
| Heute | Priorisierte Aufgaben des Tages (Heute-Modus), nächster Termin, Prüfungsreife, Lernziel | Aufgabendetail, Terminvorschau |
| Lernen | Theorie-Lernbereich, Prüfungssimulation, Statistiken, Lernanalytics | Themenliste, Frageansicht, Simulation, Ergebnisanalyse, Statistiken, Schwachstellen, Markierte, Falsche, Nie beantwortete, Lernmodi-Auswahl, Prüfer-Fragen-Trainer (A2) |
| Fahren | Fahrstunden, Terminbuchung, Ausbildungsstand, Kompetenzprofil, Prüfungsplanung, Mock-Prüfung (A2) | Kalender, Buchung, Termindetail, Stornierung, Warteliste (A2), Ausbildungsstand, Kompetenzprofil, Prüfungsstatus |
| Finanzen | Rechnungen, Zahlungen, Kostenprognose (A2) | Rechnungsliste, Rechnungsdetail, Zahlung, SEPA-Mandat (A2), Kostenprognose (A2) |
| Profil | Stammdaten, Dokumente, Einstellungen, Datenschutz, Nachrichten | Dokumenten-Checkliste, Upload, Benachrichtigungseinstellungen, Sprache, Datenexport, Löschung, Einwilligungen, Chat, Gamification-Übersicht (A2) |

Nachrichten sind über ein Icon in der Kopfzeile jedes Tabs erreichbar (Badge mit ungelesenen Nachrichten), zusätzlich im Profil.

### 2.2 Fahrlehrer (mobil und Web, Tab-Navigation)

| Tab | Inhalt | Untergeordnete Screens |
|---|---|---|
| Heute | Tagesplan, nächste Stunde mit Schülerkurzprofil, offene Dokumentationen, Theorie-Schwächen des nächsten Schülers | Stundendetail, Schnell-Dokumentation |
| Schüler | Zugewiesene Schüler mit Ausbildungsstand und Prüfungsreife | Schülerdetail, Kompetenzprofil, Verlauf, Dokumente (nur Status), Prüfungsstatus |
| Kalender | Wochen- und Tagesansicht, Verfügbarkeit, Urlaub, Pausen | Verfügbarkeit bearbeiten, Termin anlegen, Termindetail, Stornierung |
| Dokumentation | Liste offener und abgeschlossener Dokumentationen, Sprachnotizen (A2), Mock-Prüfungen (A2) | Dokumentationsformular, Sprachnotiz-Bestätigung, Mock-Prüfungsprotokoll |
| Nachrichten | Chats mit Schülern, Hinweise vom Büro | Chatverlauf |

### 2.3 Büro und Admin (Web, Seitennavigation)

| Bereich | Inhalt |
|---|---|
| Übersicht | Kennzahlen des Tages: Termine, offene Dokumentationen, fällige Dokumente, Prüfungen diese Woche, offene Rechnungen, Warteliste (A2) |
| Schüler | Liste, Anlage, Anmeldung, Detail mit Ausbildungsstand, Dokumenten-Checkliste, Verträge, Finanzen, Prüfungen, Kommunikation |
| Team | Fahrlehrer und Büro-Mitarbeiter, Einladungen, Qualifikationen je Klasse, Verfügbarkeiten, Zuweisungen |
| Fahrzeuge | Stammdaten, Klassenzuordnung, HU, Wartung, Reifen, Versicherung, Erinnerungen |
| Kalender | Tag/Woche/Monat über alle Fahrlehrer und Fahrzeuge, Filter, Buchung, Stornierung, Warteliste (A2) |
| Theorieunterricht | Kursplanung, Serien, QR-Check-in, Anwesenheit, Nachweise |
| Prüfungen | Theorie- und Praxisprüfungen mit Statusworkflow, Countdown, Prüfungsreife der Kandidaten |
| Finanzen | Rechnungen, Zahlungen, Mahnungen, Preisliste, Exporte |
| Dokumente | Checklisten-Konfiguration, Dokumentenstatus aller Schüler, Vorlagen, Ausbildungsnachweise |
| Inhalte | Eigene Übungsfragen des Tenants, Einwilligungstexte, E-Mail-Vorlagen, Stornierungsregeln (nur admin) |
| Einstellungen | Fahrschulprofil, Öffnungszeiten, Feiertage, Benachrichtigungen, Integrationen, Datenschutz, Lizenzen (nur admin) |

Unterschied office und admin: office hat keinen Zugriff auf Einstellungen, Stornierungsregeln, Preisliste bearbeiten, Rollen und Lizenzen. admin hat alle Rechte des Büros zuzüglich Konfiguration.

### 2.4 Owner (Web)

Owner erhält alle Bereiche von admin zuzüglich:

| Bereich | Inhalt |
|---|---|
| Standorte | Anlage und Verwaltung von Standorten, Zeitzone, Bundesland, Zuordnung von Team und Fahrzeugen |
| Rollen | Rollenvergabe je Mitglied und Standort, Tenant-Mitgliedschaften, Support-Zugriffsfreigaben |
| Analytics | Fahrschul-Analytics: Auslastung, Prüfungsquoten, Durchlaufzeiten, Umsatz, Stornoquote |
| Abrechnung | Vertrag mit der Plattform, Nutzungsdaten, Plattformrechnungen, Lizenzen für amtliche Fragen |

### 2.5 Plattform-Admin (Web, getrennte Domain oder Pfad)

| Bereich | Inhalt |
|---|---|
| CMS | Globale Fragen, Themen, Erklärungen, Medien, Prüfer-Fragen-Trainer-Inhalte, Situationstrainer-Inhalte; Freigabe-Workflow |
| Regelversionen | rule_versions je rule_type und license_class mit valid_from, valid_until, payload, review_status, Vergleich zweier Versionen |
| Wissensbasis | Knowledge-Base-Einträge für KI mit Quelle, Rechtsstand, review_status |
| Tenants | Tenant-Anlage, Status, Lizenzen, Subprozessorbestätigungen, Supportzugriffe (nur mit Freigabe des Tenants) |

Plattform-Admin sieht keine Personendaten von Schülern oder Mitarbeitern. Tenant-Übersicht zeigt aggregierte Zahlen (Anzahl Schüler, Standorte) ohne Namen.

## 3. Screen-Liste je Rolle

Spalten: Zweck, Kerninhalte, Aktionen, Datenquellen (Tabellen), Berechtigungen. Alle Tabellen tragen tenant_id außer den globalen Inhalten (theory_questions, question_versions, question_answers, rule_versions, knowledge_base) mit tenant_id NULL bei globalen Datensätzen. Stufenangaben (A2, A3) markieren Screens, die im MVP nicht sichtbar sind.

### 3.1 Schüler

| Screen | Zweck | Kerninhalte | Aktionen | Datenquellen | Berechtigungen |
|---|---|---|---|---|---|
| Heute | Priorisierte Tagesaufgaben | Aufgabenliste aus learning-engine (Lernziel, Wiederholungen, Vorbereitung auf nächste Fahrstunde), nächster Termin, Prüfungsreife-Ampel, Streak (A2) | Aufgabe starten, Termin öffnen, Tagesziel anpassen | learning_sessions, student_question_attempts, lesson_bookings, exam_results, student_skill_scores, notifications | student: nur eigene Datensätze (students.user_id = auth.uid()) |
| Lernen Übersicht | Einstieg in Lernmodi | Fortschritt je Thema, Lernmodi, Klassenwahl, Rechtsstand der Inhalte | Modus wählen, Klasse wechseln (nur zugewiesene Klassen) | student_licenses, theory_questions, question_versions, student_question_attempts, rule_versions | student |
| Themenliste | Lernen nach Themen | Themen mit Mastery Score, Anzahl Fragen, Grund-/Zusatzstoff | Thema starten | theory_questions, question_versions, student_question_attempts | student; nur Fragen mit review_status published und valid_until NULL oder in Zukunft; amtliche Fragen nur mit tenant_licenses |
| Frageansicht | Einzelfrage beantworten | Fragetext, Medien, Antwortoptionen, Fehlerpunkte, Markieren, Warum-Button (A2) | Antworten, Markieren, Weiter, Erklärung anzeigen | question_versions, question_answers, student_question_attempts | student |
| Prüfungssimulation | Simulation unter Prüfungsbedingungen | Timer, Fragenzähler, Fortschritt, Abbruchhinweis, Regelversion | Starten, Antworten, Abgeben, Abbrechen | rule_versions, question_versions, exam_simulations | student |
| Ergebnisanalyse | Auswertung einer Simulation | Bestanden/nicht bestanden nach Regel, Fehlerpunkte, Grund-/Zusatzstoff getrennt, Fehlerliste, Empfehlung | Falsche Fragen üben, Simulation wiederholen | exam_simulations, exam_results, student_question_attempts, rule_versions | student |
| Statistiken | Lernanalytics | Lernzeit, Trefferquote, Verlauf, Schwachstellen, Tagesziele | Zeitraum wählen | learning_sessions, student_question_attempts | student |
| Lernmodi (Falsche, Markierte, Schwierige, Nie beantwortete, Zufall, Wiederholung, Schwachstellen) | Gezielte Übung | Gefilterte Fragenliste, Anzahl | Starten | student_question_attempts, question_versions | student |
| Prüfer-Fragen-Trainer (A2) | Vorbereitung auf technische Prüferfragen | Fragen zu Fahrzeugtechnik mit Erklärung und Medien | Üben, Markieren | knowledge_base, question_versions (Typ examiner_question) | student |
| KI-Lerncoach (A2) | Fragen an Coach | Chatverlauf, Quellenangaben, Rechtsstand, Unsicherheitskennzeichnung, Kontingent | Frage stellen, Quelle öffnen | ai_usage, knowledge_base, learning_sessions | student; nur serverseitig über Edge Function |
| Fahren Übersicht | Einstieg Praxis | Nächste Fahrstunde, Ausbildungsstand (Sonderfahrten, Einheiten), Kompetenzprofil-Kurzansicht, Prüfungsstatus | Buchen, Details öffnen | lessons, lesson_bookings, student_skill_scores, practical_exams, theory_exams, rule_versions | student |
| Terminbuchung | Fahrstunde buchen | Tag/Woche/Monat, freie Slots je Fahrlehrer, Filter (Fahrlehrer, Fahrzeugtyp, Stundentyp), Länge in Einheiten | Slot wählen, Buchen, Bestätigung | instructors, instructor_availability, vehicles, lessons, lesson_bookings | student; nur zugewiesene Fahrlehrer, nur qualifizierte für die Klasse |
| Termindetail | Details und Stornierung | Zeit, Fahrlehrer, Treffpunkt, Fahrzeug, Stornierungsregel mit Frist und Gebühr | Stornieren, Chat öffnen | lessons, lesson_bookings, cancellation_rules | student |
| Warteliste (A2) | Auf frühere Termine warten | Wunschzeitraum, Position | Eintragen, Austragen, Angebot annehmen | waitlist_entries, lesson_bookings | student |
| Ausbildungsstand | Fortschritt gegenüber Regelwerten | Pflichteinheiten je Typ (Überland, Autobahn, Nacht), Theorieunterricht Grund-/Zusatzstoff, Regelversion mit Rechtsstand | Details öffnen | lessons, attendance, theory_classes, rule_versions | student |
| Kompetenzprofil | Praxisstärken und Schwächen | Skills mit Score, Verlauf, verknüpfte Theoriethemen | Theorie-Training starten (Kopplung) | skills, student_skill_scores, lesson_evaluations | student: nur eigene Bewertungen, Kommentare des Fahrlehrers nur wenn als sichtbar markiert |
| Prüfungsstatus | Prüfungsplanung aus Schülersicht | Status (geplant, angemeldet, bestätigt, absolviert, bestanden, nicht bestanden), Countdown, Voraussetzungen, Prüfungsreife | Termin ansehen | theory_exams, practical_exams, exam_results, documents | student |
| Mock-Prüfung Ergebnis (A2) | Ergebnis einer Prüfungsfahrt-Simulation | Ereignisse mit Markierung, Bewertung, Empfehlung | Theorie-Training zu Ereignis starten | lesson_evaluations, skills | student |
| Finanzen Übersicht | Zahlungsstand | Offene Summe, Rechnungen mit Status, letzte Zahlungen | Rechnung öffnen, Bezahlen | invoices, invoice_items, payments | student |
| Rechnungsdetail | Einzelrechnung | Positionen, Steuer, Status, Mahnstatus, PDF | PDF herunterladen, Bezahlen | invoices, invoice_items, payments, documents | student |
| Zahlung / SEPA-Mandat (A2) | Zahlung auslösen | Zahlungsart, Mandatsstatus, Anbieterhinweis | Mandat erteilen, Zahlung starten | payments, payment_mandates | student; Abwicklung über packages/payments serverseitig |
| Kostenprognose (A2) | Voraussichtliche Gesamtkosten | Bisherige Kosten, Prognose nach Ausbildungsstand und Preisliste, Disclaimer | Annahmen anpassen | invoices, lessons, price_list_items, rule_versions | student |
| Profil | Stammdaten | Name, Kontakt, Klasse, Fahrschule, Standort | Kontaktdaten ändern | students, users, student_licenses | student |
| Dokumenten-Checkliste | Pflichtdokumente | Liste mit Status (fehlend, hochgeladen, geprüft, abgelehnt), Frist | Hochladen, Ersetzen | documents, document_checklist_items | student; Storage-RLS: nur eigener Pfad |
| Einstellungen | Präferenzen | Sprache, Benachrichtigungen, Tagesziel, Barrierefreiheit | Speichern | users, notification_preferences | student |
| Datenschutz | Rechte ausüben | Einwilligungen mit Textversion, Export, Löschung, AVV-Hinweis | Einwilligung widerrufen, Export anfordern, Löschung anfordern | consents, consent_texts, data_requests | student |
| Nachrichten | Chat | Konversationen mit Fahrlehrer und Büro, Lesestatus | Schreiben, Anhang (Bild), Melden | messages, conversations | student; Realtime-Kanal je Konversation, RLS auf Teilnahme |
| Gamification (A2) | XP, Level, Streaks, Badges, Wochenziele | Übersicht und Verlauf | Wochenziel setzen | gamification_state, badges | student |

### 3.2 Fahrlehrer

| Screen | Zweck | Kerninhalte | Aktionen | Datenquellen | Berechtigungen |
|---|---|---|---|---|---|
| Heute | Tagesplan | Stunden in Reihenfolge, Schüler mit Klasse, Fahrzeug, Treffpunkt, Ausbildungsstand-Kurzform, Theorie-Schwächen (Kopplung), offene Dokumentationen | Stunde öffnen, Dokumentieren, Schüler anrufen über App (ohne Nummernanzeige, A2) | lessons, lesson_bookings, students, student_skill_scores, student_question_attempts (aggregiert), vehicles | instructor: nur Stunden mit instructor_id = eigene; Schülerdaten nur für zugewiesene Schüler |
| Schnell-Dokumentation | Stunde in Sekunden dokumentieren | Sterne je Skill (vorgeschlagene Skills nach Stundentyp), Kommentar, Sonderfahrtentyp und Einheiten bestätigen, Sichtbarkeit für Schüler | Speichern, Sprachnotiz (A2) | lesson_evaluations, skills, lessons | instructor; nur eigene Stunden; nach Abschluss nur Ergänzung, keine Löschung (Audit) |
| Sprachnotiz-Bestätigung (A2) | Transkript prüfen | Transkript, vorgeschlagene Struktur (Skills, Sterne, Kommentar), Unsicherheiten markiert | Korrigieren, Bestätigen, Verwerfen | lesson_evaluations, voice_notes | instructor; Audio wird nach Bestätigung gelöscht |
| Schülerliste | Übersicht | Zugewiesene Schüler mit Klasse, Ausbildungsstand, Prüfungsreife-Ampel, nächster Termin | Schüler öffnen, Filter | students, student_licenses, lessons, exam_results | instructor |
| Schülerdetail | Ganzheitlicher Stand | Kompetenzprofil, Fahrstundenverlauf, Sonderfahrten, Theorie-Schwächen je Thema, Prüfungsstatus, Dokumentenstatus (nur vollständig/unvollständig) | Chat öffnen, Stunde planen, Mock-Prüfung starten (A2) | student_skill_scores, lesson_evaluations, lessons, student_question_attempts (aggregiert), practical_exams, theory_exams, documents (Status) | instructor; keine Finanzdaten, keine Dokumenteninhalte |
| Kalender | Eigene Planung | Woche/Tag, Verfügbarkeit, Urlaub, Pausen, Fahrzeugbelegung | Verfügbarkeit setzen, Termin anlegen, Termin verschieben, Stornieren | instructor_availability, lessons, lesson_bookings, vehicles | instructor; Verfügbarkeiten nur eigene; Termine anlegen nur für zugewiesene Schüler |
| Termindetail | Einzelstunde | Schüler, Typ, Einheiten, Fahrzeug, Treffpunkt, Stornierungsregel | Stornieren mit Grund, Dokumentieren | lessons, lesson_bookings, cancellation_rules | instructor |
| Dokumentation Liste | Offene und erledigte Doku | Filter nach Status, Datum, Schüler | Öffnen | lesson_evaluations, lessons | instructor |
| Mock-Prüfung (A2) | Prüfungsfahrt simulieren | Timer, Ereignismarkierung (Kategorie, Zeitpunkt, Schwere), Abschlussbewertung | Ereignis markieren, Abschließen | lesson_evaluations, mock_exam_events, skills | instructor; Bedienung nur durch Fahrlehrer, niemals durch fahrenden Schüler |
| Nachrichten | Chat | Konversationen mit zugewiesenen Schülern, Hinweise vom Büro | Schreiben | messages, conversations | instructor |
| Fahrlehrer-KI (A3) | Abfragen über Schüler | Frage zu Schülerstand, Antwort mit Quellen aus Dokumentation und Lernprofil | Frage stellen | lesson_evaluations, student_skill_scores, student_question_attempts | instructor; nur zugewiesene Schüler; Verarbeitung serverseitig |
| Profil | Eigene Daten | Qualifikationen je Klasse, Tenant-Wechsel (bei mehreren Fahrschulen) | Tenant wechseln, Einstellungen | instructors, instructor_license_classes, tenant_memberships | instructor |

### 3.3 Büro und Admin

| Screen | Zweck | Kerninhalte | Aktionen | Datenquellen | Berechtigungen |
|---|---|---|---|---|---|
| Übersicht | Tagesstatus | Termine heute, offene Dokumentationen, fehlende Dokumente, Prüfungen diese Woche, überfällige Rechnungen, Fahrzeugfristen | Zu Bereichen springen | lessons, lesson_evaluations, documents, practical_exams, theory_exams, invoices, vehicles | office, admin, owner |
| Schülerliste | Verwaltung | Suche, Filter (Klasse, Standort, Fahrlehrer, Status), Ausbildungsstand, Zahlungsstatus | Anlegen, Öffnen, Export (CSV) | students, student_licenses, invoices | office, admin, owner |
| Digitale Anmeldung | Neuen Schüler aufnehmen | Formular (Stammdaten, Klasse, Ersterwerb/Erweiterung, Vorbesitz, Guardian bei Minderjährigen), Einwilligungen mit Textversion, Dokumenten-Checkliste initial | Anmeldung abschließen, Einladung senden | students, users, student_licenses, guardians, consents, consent_texts, documents | office, admin, owner |
| Schülerdetail | Akte | Reiter: Übersicht, Ausbildungsstand, Fahrstunden, Theorieunterricht, Dokumente, Verträge, Finanzen, Prüfungen, Kommunikation, Datenschutz | Bearbeiten, Fahrlehrer zuweisen, Vertrag ändern, Ausbildungsnachweis exportieren | students, student_licenses, lessons, attendance, documents, invoices, practical_exams, theory_exams, consents, training_certificates | office, admin, owner; Datenschutz-Reiter (Löschung, Export) nur admin, owner |
| Team | Mitarbeiter | Liste mit Rolle, Standort, Qualifikationen, Verfügbarkeit | Einladen, Rolle setzen (nur admin/owner), Qualifikation pflegen | users, tenant_memberships, instructors, instructor_license_classes | office nur lesen; admin, owner bearbeiten |
| Fahrzeuge | Fuhrpark | Kennzeichen, Klassen, Getriebe, HU-Frist, Wartung, Reifen, Versicherung, Erinnerungen | Anlegen, Bearbeiten, Frist setzen | vehicles, vehicle_reminders | office, admin, owner |
| Kalender | Gesamtplanung | Tag/Woche/Monat über Fahrlehrer und Fahrzeuge, Filter, Konflikte, Warteliste (A2) | Termin anlegen, verschieben, stornieren, Fahrzeug zuweisen | lessons, lesson_bookings, instructor_availability, vehicles, waitlist_entries | office, admin, owner |
| Theorieunterricht | Kursplanung | Serien, Themen, Raum, Fahrlehrer, QR-Check-in-Anzeige, Anwesenheit, Nachträge mit Begründung | Serie anlegen, Check-in starten, Anwesenheit korrigieren | theory_classes, theory_class_series, attendance, checkin_codes | office, admin, owner; Korrektur mit Audit-Grund |
| Prüfungen | Statusworkflow | Liste Theorie und Praxis, Status, Countdown, Voraussetzungen (Dokumente, Pflichtstunden, Theorieprüfung gültig), Fristen (fachlich zu verifizieren) | Anmelden, Status setzen, Ergebnis eintragen | theory_exams, practical_exams, exam_results, documents, lessons, attendance, rule_versions | office, admin, owner |
| Finanzen Rechnungen | Rechnungswesen | Rechnungen mit Nummernkreis, Status, Mahnstufe, Positionen, PDF | Rechnung erstellen, finalisieren, stornieren (Gegenbeleg), Mahnung senden (A2) | invoices, invoice_items, invoice_number_sequences, payments, documents | office, admin, owner; Finalisierte Rechnung nicht bearbeitbar |
| Finanzen Zahlungen | Zahlungseingänge | Zahlungen (Bar, Überweisung, SEPA, Karte), Zuordnung zu Rechnungen, Rückerstattungen | Zahlung erfassen, zuordnen | payments, invoices | office, admin, owner |
| Preisliste | Preise | Positionen mit Gültigkeit, Steuersatz | Neue Version anlegen | price_lists, price_list_items | admin, owner |
| Dokumente | Checklisten und Status | Checklistenvorlagen je Klasse, Dokumentenstatus aller Schüler, Prüfung hochgeladener Dokumente | Prüfen, Ablehnen mit Grund, Vorlage bearbeiten | document_checklist_templates, documents | office prüft; admin, owner konfigurieren |
| Inhalte | Tenant-eigene Inhalte | Eigene Übungsfragen (question_source own), E-Mail-Vorlagen, Einwilligungstexte | Erstellen, Freigeben (admin) | theory_questions (tenant_id gesetzt), question_versions, email_templates, consent_texts | office erstellt Entwürfe; admin, owner geben frei |
| Stornierungsregeln | Konfiguration | Fristen, Gebührenlogik, Ausnahmen, Dokumentation der Anwendung, Hinweis auf AGB-Prüfung | Regel bearbeiten mit Gültigkeit | cancellation_rules | admin, owner |
| Einstellungen | Fahrschulprofil | Name, Adresse, Öffnungszeiten, Feiertage, Benachrichtigungen, Integrationen (Zahlungsanbieter), Lizenzen | Bearbeiten | driving_schools, locations, holidays, tenant_settings, tenant_licenses | admin, owner |

### 3.4 Owner (zusätzlich)

| Screen | Zweck | Kerninhalte | Aktionen | Datenquellen | Berechtigungen |
|---|---|---|---|---|---|
| Standorte | Standortverwaltung | Liste, Adresse, Zeitzone, Bundesland, Team, Fahrzeuge | Anlegen, Zuordnen | locations, tenant_memberships, vehicles | owner |
| Rollen | Berechtigungen | Mitglieder mit Rolle je Standort, Support-Zugriffsfreigaben mit Ablauf | Rolle ändern, Supportzugriff gewähren/entziehen | tenant_memberships, support_access_grants | owner |
| Analytics | Fahrschul-Analytics | Auslastung je Fahrlehrer und Fahrzeug, Prüfungsquoten, Durchlaufzeit Anmeldung bis Prüfung, Umsatz, Stornoquote, Wartelistenlänge | Zeitraum, Standortfilter, Export | Aggregationen über lessons, exam_results, invoices, lesson_bookings | owner |
| Abrechnung | Plattformvertrag | Tarif, Nutzung, Rechnungen der Plattform, Lizenzen | Vertragsdaten ansehen, Lizenz beantragen | platform_subscriptions, platform_invoices, tenant_licenses | owner |

### 3.5 Plattform-Admin

| Screen | Zweck | Kerninhalte | Aktionen | Datenquellen | Berechtigungen |
|---|---|---|---|---|---|
| CMS Fragen | Globale Fragenverwaltung | Fragen mit Versionen, Feldern version, valid_from, valid_until, source, review_status, reviewed_by, last_updated, Medien mit Lizenz | Entwurf, zur Prüfung, Freigabe, Veröffentlichung, neue Version | theory_questions, question_versions, question_answers, media_assets | platform_admin; Freigabe nur durch anderen Reviewer als Autor |
| Regelversionen | Regel-Engine-Daten | rule_type, license_class, acquisition_type, valid_from, valid_until, payload, review_status, Vergleich mit Vorversion, betroffene Ergebnisse | Neue Version anlegen, prüfen, freigeben | rule_versions | platform_admin; freigegebene Versionen unveränderlich |
| Wissensbasis | KI-Quellen | Einträge mit Quelle, Rechtsstand, review_status, Verknüpfung zu Themen | Anlegen, prüfen, freigeben | knowledge_base | platform_admin |
| Tenants | Mandanten | Liste ohne Personendaten, Status, Lizenzen, Subprozessorbestätigungen | Tenant anlegen, Lizenz setzen, Supportzugriff nutzen (nur bei Freigabe) | driving_schools, tenant_licenses, support_access_grants | platform_admin |

## 4. Zustände für Kernscreens

Jeder Kernscreen definiert vier Zustände. Die Tabelle nennt die konkrete Gestaltung, nicht nur den Zustand.

| Screen | Leer | Laden | Fehler | Offline |
|---|---|---|---|---|
| Schüler Heute | „Für heute ist nichts geplant" mit Aktion „Lernziel festlegen" und „Fahrstunde buchen" | Skeleton der Aufgabenkarten, keine Spinner-Vollbildanzeige | Meldung mit Ursache (Netzwerk, Server) und „Erneut laden"; zuletzt bekannte Aufgaben bleiben sichtbar | Lernaufgaben aus SQLite verfügbar; Termine mit Stand des letzten Syncs und Zeitstempel; Buchen deaktiviert mit Hinweis |
| Themenliste | Bei fehlender Lizenz: Hinweis, dass nur eigene Übungsfragen verfügbar sind; ohne Inhalte für die Klasse: „Inhalte für diese Klasse sind in fachlicher Prüfung" | Skeleton der Themenkarten | Fehlermeldung mit Wiederholung | Vollständig verfügbar aus lokalem Cache; Hinweis auf Stand der Inhalte |
| Prüfungssimulation | Nicht möglich, wenn keine freigegebene Regelversion existiert: „Prüfungsregeln für diese Klasse werden geprüft" | Fragen werden lokal vorgeladen, Start erst nach vollständigem Laden | Bei Abbruch durch Fehler: Simulation wird als abgebrochen gespeichert, nicht als nicht bestanden | Offline möglich, Ergebnis in Sync-Queue mit Idempotenzschlüssel; Regelversion wird lokal mitgespeichert |
| Terminbuchung | „Keine freien Termine im gewählten Zeitraum" mit Aktion „Warteliste" (A2) oder „Fahrlehrer wechseln" | Skeleton des Kalenders | Konflikt (409) durch Exclusion-Constraint: „Termin wurde soeben vergeben", Kalender wird aktualisiert | Nicht verfügbar; Anzeige der bestehenden Termine aus Cache, Buchen deaktiviert |
| Fahrlehrer Heute | „Heute keine Stunden" mit Aktion „Verfügbarkeit prüfen" | Skeleton der Stundenliste | Fehlermeldung, Cache bleibt sichtbar | Stundenliste aus Cache; Dokumentation offline möglich (A2), sonst Hinweis |
| Schnell-Dokumentation | Nicht leer möglich; vorgeschlagene Skills immer vorhanden | Kein Ladezustand nötig, Daten liegen vor | Speichern fehlgeschlagen: Eintrag bleibt lokal, Wiederholung automatisch | Speichern in Sync-Queue (A2), MVP: Hinweis „Speichern bei Verbindung" |
| Büro Kalender | „Keine Termine" mit Aktion „Termin anlegen" | Skeleton der Zeitraster | Konflikt beim Speichern: Anzeige der kollidierenden Buchung | Web-App ohne Offline-Modus: Vollbildhinweis, keine Bearbeitung |
| Finanzen Rechnungen | „Keine Rechnungen" mit Aktion „Rechnung erstellen" | Tabellen-Skeleton | Fehlermeldung, Filter bleiben erhalten | Kein Offline-Modus (Web) |
| Chat | „Noch keine Nachrichten" mit Hinweis auf den Ansprechpartner | Verlauf lädt von unten | Senden fehlgeschlagen: Nachricht mit Status „nicht gesendet" und Wiederholen | Nachrichten lesbar aus Cache, Senden wird in Queue gestellt |
| Dokumenten-Checkliste | Alle Punkte offen: Fortschritt 0 von n | Skeleton | Upload fehlgeschlagen: Datei bleibt lokal, erneut senden | Upload nicht möglich, Status aus Cache |
| CMS Fragen | „Keine Fragen in diesem Status" | Tabellen-Skeleton | Fehlermeldung | Kein Offline-Modus |

Allgemeine Regeln: Fehlermeldungen nennen Ursache und nächsten Schritt, nie nur einen Code. Ladezustände nutzen Skeletons in Form des späteren Inhalts. Offline-Zustände zeigen immer den Zeitstempel des letzten erfolgreichen Syncs.

## 5. Benachrichtigungs-Taxonomie

Kanäle: push (FCM/APNs), inbox (In-App-Inbox mit Zustellstatus, immer aktiv), email (transaktional), realtime (nur Chat, keine eigene Einstellung). Standard beschreibt den Ausgangszustand nach Registrierung.

| Typ | Empfänger | Auslöser | Kanäle | Standard | Opt-out |
|---|---|---|---|---|---|
| lesson.reminder | Schüler, Fahrlehrer | 24 h und 2 h vor Fahrstunde (Zeiten je Tenant konfigurierbar) | push, inbox | an | erlaubt |
| lesson.booked | Schüler, Fahrlehrer | Neue Buchung | push, inbox, email | an | push erlaubt, inbox nicht |
| lesson.canceled | Schüler, Fahrlehrer, Büro | Stornierung durch eine Partei | push, inbox, email | an | nicht erlaubt (betrieblich notwendig) |
| lesson.rescheduled | Schüler, Fahrlehrer | Verschiebung | push, inbox, email | an | nicht erlaubt |
| waitlist.offer (A2) | Schüler | Freier Slot passend zur Warteliste | push, inbox | an | erlaubt, dann keine Wartelistenteilnahme |
| evaluation.published | Schüler | Fahrlehrer hat Dokumentation mit Sichtbarkeit gespeichert | push, inbox | an | erlaubt |
| theory.class_reminder | Schüler | Vor gebuchtem oder empfohlenem Theorieunterricht | push, inbox | an | erlaubt |
| theory.attendance_recorded | Schüler | Check-in erfolgreich | inbox | an | nicht abschaltbar (Nachweis) |
| learning.daily_goal | Schüler | Tagesziel offen, Uhrzeit wählbar | push | an | erlaubt |
| learning.review_due | Schüler | Spaced-Repetition-Fälligkeit | push | aus | erlaubt |
| learning.streak_risk (A2) | Schüler | Streak läuft ab | push | aus | erlaubt |
| exam.status_changed | Schüler, Büro | Status im Prüfungsworkflow geändert | push, inbox, email | an | nicht erlaubt |
| exam.countdown | Schüler | 7 Tage und 1 Tag vor Prüfung | push, inbox | an | erlaubt |
| exam.readiness_changed | Schüler, Fahrlehrer | Ampelstufe wechselt | inbox | an | erlaubt |
| invoice.created | Schüler, Guardian | Rechnung finalisiert | inbox, email | an | nicht erlaubt |
| invoice.due_soon | Schüler, Guardian | Fälligkeit in konfigurierbaren Tagen | inbox, email | an | erlaubt für push, nicht für email |
| invoice.overdue / dunning (A2) | Schüler, Guardian | Mahnstufe erreicht | inbox, email | an | nicht erlaubt |
| payment.received | Schüler | Zahlung verbucht | inbox | an | erlaubt |
| payment.failed (A2) | Schüler, Büro | Lastschrift zurückgebucht | inbox, email | an | nicht erlaubt |
| document.missing | Schüler, Guardian | Fällige Checklistenpunkte offen | push, inbox | an | erlaubt |
| document.reviewed | Schüler | Büro hat Dokument geprüft oder abgelehnt | push, inbox | an | erlaubt |
| message.received | Alle Rollen | Neue Chatnachricht | push, inbox, realtime | an | push erlaubt |
| vehicle.reminder | Büro, Admin | HU, Wartung, Reifen, Versicherung fällig | inbox, email | an | erlaubt je Typ |
| evaluation.pending | Fahrlehrer | Stunde beendet, Dokumentation offen (nach 30 Minuten) | push, inbox | an | erlaubt |
| consent.update_required | Alle Rollen | Neue Version eines Einwilligungstexts | inbox, email | an | nicht erlaubt |
| account.security | Alle Rollen | Login von neuem Gerät, Passwortänderung | email, inbox | an | nicht erlaubt |
| content.review_requested | Plattform-Admin, Tenant-Admin | Inhalt wartet auf Freigabe | inbox, email | an | erlaubt |
| rule.version_published | Tenant-Admin, Owner | Neue Regelversion veröffentlicht | inbox, email | an | nicht erlaubt |

Regeln:
1. Opt-out gilt je Typ und je Kanal; inbox ist nie abschaltbar, damit jede Benachrichtigung nachweisbar zugestellt ist.
2. Typen mit „nicht erlaubt" sind betrieblich oder rechtlich notwendige Mitteilungen; sie werden bei Registrierung erläutert und sind nicht Marketing.
3. Ruhezeiten: Push zwischen 21:00 und 07:00 Ortszeit wird gesammelt und morgens zugestellt, außer lesson.canceled und lesson.rescheduled für Termine innerhalb der nächsten 12 Stunden.
4. Guardians erhalten nur finanzielle und dokumentbezogene Typen sowie exam.status_changed, keine Lern- oder Chatnachrichten.
5. E-Mails enthalten keine Lerninhalte oder Bewertungen, nur Verweise in die App.
6. Zustellstatus (gesendet, zugestellt, gelesen) wird je Benachrichtigung in notifications gespeichert; Push-Fehler lösen bei Typen mit email-Kanal den E-Mail-Versand aus.

## 6. Mehrsprachigkeit

1. Sprachen im MVP: Deutsch. Ausbaustufe 2: Englisch, Türkisch, Arabisch. Arabisch erfordert Rechts-nach-Links-Layout; packages/ui liefert logische Layout-Eigenschaften (start/end statt left/right) von Beginn an.
2. Trennung von App-Sprache und Prüfungssprache: Die App-Sprache beeinflusst nur die Oberfläche. Lerninhalte (Fragen) sind nur in den Sprachen verfügbar, in denen sie im CMS freigegeben sind; ist ein Inhalt in der App-Sprache nicht vorhanden, wird die deutsche Fassung mit Hinweis angezeigt. Die Liste der offiziellen Prüfungssprachen stammt aus rule_versions (rule_type exam_languages, fachlich zu verifizieren) und wird in der Prüfungsplanung getrennt angezeigt. Die App weist ausdrücklich darauf hin, dass die App-Sprache nicht die Prüfungssprache ist.
3. Übersetzungsschlüssel liegen in packages/i18n mit Namensraum je Feature (today.*, learning.*, driving.*, finance.*, profile.*, office.*, cms.*). Fehlende Schlüssel schlagen im CI-Test fehl; kein Fallback auf Schlüsselnamen in Produktion.
4. Zahlen, Daten, Währung: Formatierung über Intl mit Locale de-DE als Standard; Währung ist immer EUR im deutschen Markt. Zeiten in Europe/Berlin, gespeichert in UTC.
5. Rechtsstand und Regelversionen werden nicht übersetzt, sondern in allen Sprachen mit identischer Kennung (z. B. Regelversion, valid_from) angezeigt.
6. Fahrlehrer- und Büro-Oberflächen bleiben im MVP deutsch; Schüler-Oberfläche erhält die weiteren Sprachen zuerst.
7. Sprachnotizen (A2) werden in der Sprache des Fahrlehrers transkribiert; die strukturierte Dokumentation wird in der Sprache des Tenants gespeichert.

## 7. Accessibility-Prinzipien

Ziel ist WCAG 2.1 Stufe AA für Schüler-App, Schüler-Web und Büro-Web; die Relevanz des Barrierefreiheitsstärkungsgesetzes für das Produkt ist fachlich zu verifizieren, das Ziel gilt unabhängig davon.

1. Kontrast: Text mindestens 4,5:1, große Schrift und Symbole mindestens 3:1. Die Ampel des Prüfungsreife-Scores wird nie nur über Farbe kommuniziert, sondern mit Zahl, Text („rot: noch nicht bereit") und Symbol.
2. Touch-Ziele: mindestens 44 x 44 Punkte in der Mobile-App; Sterne-Bewertung in der Schnell-Dokumentation mit ausreichendem Abstand.
3. Screenreader: Alle interaktiven Elemente mit Labels aus packages/i18n; Fragenbilder mit Alternativtext aus dem CMS (Pflichtfeld bei Freigabe); Diagramme in Statistiken mit Textzusammenfassung.
4. Tastaturbedienung im Web: Vollständige Bedienung ohne Maus, sichtbarer Fokus, logische Reihenfolge, Escape schließt Dialoge.
5. Dynamische Schriftgrößen: Unterstützung der Systemschriftgröße; Layouts brechen um, kein abgeschnittener Text.
6. Bewegung und Zeit: Animationen respektieren „Bewegung reduzieren"; Zeitlimits gelten nur in der Prüfungssimulation und sind dort fachlich vorgegeben; ein Übungsmodus ohne Zeitlimit ist immer verfügbar.
7. Sprache: Klare, kurze Sätze; Fachbegriffe werden beim ersten Auftreten erklärt (Glossar in der Wissensbasis).
8. Fehler: Formularfehler werden am Feld und in einer Zusammenfassung ausgegeben, mit Screenreader-Ansage.
9. Farbmodus: Heller und dunkler Modus mit gleichen Kontrastanforderungen, Systemeinstellung wird übernommen.
10. Testing: Automatisierte Prüfungen (axe im Web, Accessibility-Prüfung in Expo) im CI; manuelle Prüfung mit VoiceOver und TalkBack vor jedem Release der Schüler-App.
