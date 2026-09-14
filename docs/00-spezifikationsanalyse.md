# FahrPilot: Spezifikationsanalyse

Stand: September 2026. Arbeitstitel der Plattform: FahrPilot. Dieses Dokument analysiert die 53 Abschnitte der Kundenspezifikation, ordnet sie Modulen und Ausbaustufen zu, benennt fehlende Anforderungen, priorisiert Verbesserungen und listet alle externen Abhängigkeiten mit Verifikationsbedarf. Werte, die nicht allgemein bekannt oder nicht aus der Spezifikation belegbar sind, werden ausdrücklich als „fachlich zu verifizieren" gekennzeichnet.

## 1. Kurzfassung des Produkts

FahrPilot ist eine mandantenfähige SaaS-Plattform für deutsche Fahrschulen. Ein Mandant (Tenant) ist eine Fahrschule mit einem oder mehreren Standorten, Mitarbeitern, Schülern, Fahrzeugen, Terminen und Finanzdaten. Die Plattform verbindet drei bisher getrennte Bereiche in einem gemeinsamen Lernprofil je Schüler:

1. Theorieausbildung (Lernbereich, Prüfungssimulation, adaptives Lernsystem, Prüfungsreife-Score).
2. Praxisausbildung (Fahrstunden, Sonderfahrten, Kompetenzprofil, Fahrlehrer-Dokumentation, Mock-Prüfung).
3. Fahrschulbetrieb (Anmeldung, Terminplanung, Theorieunterricht, Prüfungsplanung, Finanzen, Fahrzeuge, Kommunikation, Analytics).

Ein serverseitiger KI-Layer (Lerncoach, Fehleranalyse, Prüfungscoach, Fahrlehrer-KI) arbeitet ausschließlich auf Basis einer geprüften Knowledge Base mit sichtbarem Rechtsstand. Alle Prüfungs- und Ausbildungsregeln liegen in einer zentralen, versionierten Regel-Engine, sodass jedes Ergebnis auf die Regelversion zurückführbar ist, mit der es berechnet wurde.

### 1.1 Die drei Nutzergruppen

| Nutzergruppe | Primäre Oberfläche | Kernbedürfnis | Rollen im System |
|---|---|---|---|
| Fahrschüler | Expo-App (iOS/Android), Schüler-Web | Effizient lernen, Fahrstunden buchen, Kosten und Prüfungsstatus verstehen, jederzeit wissen, was heute zu tun ist | student |
| Fahrlehrer | Expo-App unterwegs, Next.js-Web im Büro | Tagesplan sehen, Fahrstunden in Sekunden dokumentieren, Schülerstand kennen, Theorie-Schwächen des Schülers im Auto erkennen | instructor |
| Fahrschul-Betrieb | Next.js-Web | Verwaltung von Schülern, Team, Fahrzeugen, Terminen, Theorieunterricht, Prüfungen, Finanzen; Inhaber zusätzlich Standorte, Rollen, Analytics, Abrechnung | office, admin, owner |

Zusätzlich existiert die plattformweite Rolle platform_admin (Anbieter der Plattform) für globale Inhalte: Fragen, Regelversionen, Wissensbasis, Tenant-Verwaltung. Diese Rolle hat keinen Zugriff auf mandantenbezogene Personendaten außerhalb des Supports mit dokumentierter Einwilligung.

### 1.2 Verbindliche Architekturentscheidungen (Kurzreferenz)

- Monorepo mit pnpm und Turborepo, TypeScript strict. apps/web (Next.js App Router), apps/mobile (Expo React Native).
- Packages: rules-engine, learning-engine, db, ai, payments, i18n, ui.
- Backend Supabase in der Region EU (Frankfurt): Postgres 16, Auth mit Custom-Access-Token-Hook (tenant_id und Rolle im JWT), Row-Level-Security auf jeder Tenant-Tabelle, Storage mit RLS, Realtime für Chat, Edge Functions für KI, Stripe-Webhooks und Push-Versand.
- Überschneidungsfreie Buchungen per Exclusion-Constraint (btree_gist) in der Datenbank, nicht nur in der Anwendungslogik.
- Audit-Logs per Datenbank-Trigger.
- Globale Inhalte (Fragen, Regeln, Wissensbasis) mit tenant_id NULL und Freigabe-Workflow.
- KI nur serverseitig, Antworten nur mit Quellen aus geprüfter Knowledge Base, sonst explizite Unsicherheitskennzeichnung.
- Offline: SQLite auf dem Gerät, Sync-Queue mit Idempotenzschlüsseln, serverseitiges Merge für append-only Lernversuche, Last-Writer-Wins mit Versionsspalte für Profildaten.

## 2. Zuordnung aller 53 Abschnitte

Legende Status: MVP = Kernumfang der ersten produktiven Version, A2 = Ausbaustufe 2, A3 = Ausbaustufe 3. Modul-Zuordnung nennt das federführende Package bzw. die App; Datenbank (packages/db) ist bei fast allen Abschnitten beteiligt und wird nur genannt, wenn sie das dominierende Modul ist.

| Nr. | Abschnitt | Status | Modul | Abhängigkeiten |
|---|---|---|---|---|
| 1 | Schüler-Dashboard | MVP | apps/mobile, learning-engine | 6, 7, 42, 43 |
| 2 | Theorie-Lernbereich (alle Klassen, Lernmodi) | MVP (Klasse B; weitere Klassen nach Content-Verfügbarkeit) | apps/mobile, learning-engine, db | 44, 45, 46, Fragenlizenz (siehe Abschnitt 5) |
| 3 | Prüfungssimulation mit Regel-Engine | MVP | rules-engine, learning-engine | 2, 44, 45, 46 |
| 4 | KI-Lerncoach mit Knowledge Base | A2 | packages/ai, Edge Functions | 44, 46, 36 |
| 5 | Adaptives Lernsystem (Mastery, Spaced Repetition) | MVP | learning-engine | 2, 40 |
| 6 | Prüfungsreife-Score mit Ampel | MVP | learning-engine | 3, 5 |
| 7 | Fahrstunden-System | MVP | apps/web, apps/mobile, db | 10, 13, 35 |
| 8 | Kompetenzprofil | MVP | learning-engine, db (skills, student_skill_scores) | 13, 51 |
| 9 | Sonderfahrten/Ausbildungsstand je Klasse | MVP | rules-engine | 7, 45 |
| 10 | Terminbuchung | MVP | apps/web, apps/mobile, db (Exclusion-Constraint) | 7, 33, 35 |
| 11 | Warteliste | A2 | db, Edge Functions, Push | 10, 12 |
| 12 | Push-Erinnerungen | MVP (Termine), A2 (Lernziele, Warteliste) | Edge Functions, FCM/APNs | 10, 43 |
| 13 | Fahrlehrer-App mit Schnell-Dokumentation | MVP | apps/mobile | 7, 8 |
| 14 | Sprachnotizen zu strukturierter Doku | A2 | packages/ai (Speech-to-Text), apps/mobile | 13, 36 |
| 15 | Fahrschul-Administration | MVP | apps/web | 37, 36 |
| 16 | Digitale Anmeldung | MVP | apps/web, db (students, consents) | 17, 36 |
| 17 | Dokumenten-Checkliste konfigurierbar | MVP | apps/web, Storage | 16 |
| 18 | Theorieunterricht mit QR-Check-in | MVP (Check-in), A2 (Geofence) | apps/web, apps/mobile, db (theory_classes, attendance) | 9, 45 |
| 19 | Finanzen (Rechnungen, Zahlungen, Mahnungen, PDF) | MVP (Rechnung, Zahlungsstatus, PDF), A2 (SEPA, Mahnlauf) | packages/payments, apps/web | 7, 35, GoBD-Anforderungen |
| 20 | Kostenprognose mit Disclaimer | A2 | learning-engine, apps/mobile | 19, 7, 9 |
| 21 | Prüfungsplanung mit Status-Workflow | MVP | apps/web, db (practical_exams, theory_exams) | 6, 9, 17 |
| 22 | Praktische Prüfungsvorbereitung, Prüfer-Fragen-Trainer | A2 | apps/mobile, packages/ai, CMS | 44, 46 |
| 23 | Mock-Prüfung mit Ereignismarkierung | A2 | apps/mobile, db (lesson_evaluations) | 13, 8 |
| 24 | KI-Prüfungscoach | A3 | packages/ai | 4, 22, 23 |
| 25 | Mehrsprachigkeit (de, tr, en, ar) | MVP (de), A2 (en, tr, ar inkl. RTL) | packages/i18n, packages/ui | 47 |
| 26 | Gamification | A2 | learning-engine, apps/mobile | 5, 27 |
| 27 | Lernanalytics | MVP (Basis), A2 (Vertiefung) | learning-engine, apps/mobile | 2, 3, 5 |
| 28 | KI-Fehleranalyse mit Übungsgenerierung | A2 | packages/ai, learning-engine | 4, 5, 46 |
| 29 | Warum-Button | A2 | packages/ai, CMS | 4, 44 |
| 30 | Foto-/Situationstrainer | A3 | apps/mobile, CMS, Storage | 44, 46, Bildrechte |
| 31 | Fahrlehrer-KI (Abfragen über Schüler) | A3 | packages/ai | 8, 27, 36 |
| 32 | Fahrschul-Analytics | A2 | apps/web | 7, 19, 21 |
| 33 | Fahrzeugverwaltung | MVP (Stammdaten, Klassenzuordnung), A2 (Erinnerungen HU/Wartung) | apps/web, db (vehicles) | 10, 12 |
| 34 | Kommunikation (Chat, Push, E-Mail) | MVP (Chat Schüler-Fahrlehrer), A2 (Schüler-Büro, E-Mail-Vorlagen) | Realtime, Edge Functions | 12, 36 |
| 35 | Stornierungsregeln konfigurierbar | MVP | apps/web, rules-engine (Tenant-Regeln), db | 10, 19, rechtliche Prüfung |
| 36 | Datenschutz und Sicherheit | MVP | db (RLS, Audit-Trigger), Auth-Hook, Storage-RLS | alle |
| 37 | Multi-Tenant-SaaS-Architektur | MVP | db, Auth-Hook | 36 |
| 38 | Offline-Modus mit Sync | MVP (Lernen offline), A2 (Fahrlehrer-Doku offline) | apps/mobile, learning-engine | 2, 13 |
| 39 | Tech-Stack | MVP | Monorepo insgesamt | keine |
| 40 | Datenmodell | MVP | packages/db | 37 |
| 41 | Design (eigene Design Language) | MVP | packages/ui | 47 |
| 42 | Schüler-Startseite | MVP | apps/mobile | 1, 43 |
| 43 | Heute-Modus | MVP | learning-engine, apps/mobile | 5, 6, 10, 21 |
| 44 | Admin-CMS mit Versionsfeldern | MVP | apps/web (Plattform-CMS), db | 46, 45 |
| 45 | Sichtbarer Rechtsstand und Versionierung | MVP | rules-engine, CMS, packages/ui | 44, 46 |
| 46 | Source-of-Truth-Workflow | MVP | apps/web (CMS), db (review_status) | 44 |
| 47 | Accessibility | MVP (Grundlagen), A2 (vollständige Konformität) | packages/ui, apps | 41, 25 |
| 48 | Performance | MVP | alle Apps | 38 |
| 49 | Testing | MVP | alle Packages, CI | 3, 10, 19, 36, 37, 45 |
| 50 | Zukunftsfähigkeit (CarPlay, Länder, White-Label, Partner-API, Franchise) | A3 | Architekturvorgaben jetzt, Umsetzung später | 37, 25 |
| 51 | Gemeinsames Lernprofil Theorie + Praxis + KI | MVP (Kopplung Skills zu Themen), A2 (KI-Anteil) | learning-engine, db | 8, 5, 13, 28 |
| 52 | Produktionsregeln | MVP | Projektregeln, CI-Prüfungen | alle |
| 53 | Phasenweise Arbeitsweise | MVP | Projektorganisation | alle |

### 2.1 Begründung der Stufenzuordnung

- MVP enthält alles, was eine Fahrschule benötigt, um vom ersten Tag an produktiv mit echten Schülern zu arbeiten: Anmeldung, Terminbuchung ohne Doppelbuchung, Fahrlehrer-Dokumentation, Theorie-Lernbereich mit Prüfungssimulation für Klasse B, Prüfungsplanung, Rechnungen mit Zahlungsstatus, Chat, Datenschutz-Grundfunktionen (Export, Löschung, Einwilligungen, Audit).
- Ausbaustufe 2 enthält Funktionen mit externen Abhängigkeiten oder erhöhtem Verifikationsbedarf: KI-Coach, Sprachnotizen, SEPA-Mandate, Mahnlauf, Warteliste, Gamification, weitere Sprachen, Fahrschul-Analytics.
- Ausbaustufe 3 enthält Funktionen, die ein reifes Produkt voraussetzen: KI-Prüfungscoach, Fahrlehrer-KI, Foto-Situationstrainer, CarPlay/Android Auto, White-Label, Partner-API, Franchise.

## 3. Fehlende Anforderungen

Die folgenden Punkte fehlen in der Spezifikation oder sind nur implizit enthalten. Jeder Punkt nennt die Auswirkung und den vorgeschlagenen Umgang.

### 3.1 Fachlich-rechtliche Lücken (Fahrschulwesen)

1. Ausbildungsnachweis nach Fahrschüler-Ausbildungsordnung (FahrschAusbO): Die Fahrschule muss die Ausbildung nachweisen (Theorie-Teilnahme, Fahrstunden, Sonderfahrten). Das Datenmodell muss den Nachweis als exportierbares, unveränderliches Dokument (PDF mit Zeitstempel) je Schüler erzeugen. Genaue Form und Pflichtinhalte: fachlich zu verifizieren.
2. Fahrstundenlänge: Fahrstunden werden in 45-Minuten-Einheiten ausgebildet und abgerechnet; Doppel- und Dreifachstunden sind üblich. lessons braucht units (Anzahl 45-Minuten-Einheiten) getrennt von der Kalenderdauer inklusive Vor- und Nachbesprechung.
3. Sonderfahrten je 45-Minuten-Einheit: Die Regel „5 Überland, 4 Autobahn, 3 Nacht" für Klasse B bezieht sich auf 45-Minuten-Einheiten. Die Anrechnung auf den Ausbildungsstand muss in Einheiten erfolgen, nicht in Terminen.
4. Ersterwerb versus Erweiterung: Bei Erweiterung einer bestehenden Fahrerlaubnis (z. B. B auf BE, A1 auf A2) gelten andere Fragenzahlen, Fehlerpunktgrenzen und Sonderfahrtenmengen. rule_versions braucht eine Dimension acquisition_type (first_acquisition, extension) sowie ggf. prior_license_class. Werte: fachlich zu verifizieren.
5. Begleitetes Fahren ab 17 (BF17): Minderjährige Schüler benötigen Einwilligung der Erziehungsberechtigten für Vertrag, Datenverarbeitung und Zahlungsabwicklung. Es fehlen die Entität guardian (Erziehungsberechtigter), Kontaktkanäle und der Einwilligungsfluss. Ebenso fehlt die Erfassung von Begleitpersonen als Information (kein Systemprozess, aber Dokumentenablage).
6. Sperrfrist nach nicht bestandener Prüfung: Nach einer nicht bestandenen Theorie- oder Praxisprüfung gilt eine Wartezeit bis zur Wiederholung. Die Prüfungsplanung muss den frühestmöglichen Wiederholungstermin berechnen. Genaue Frist: fachlich zu verifizieren, als Regel in rule_versions (rule_type exam_retry_waiting_period) abbilden.
7. Gültigkeit der bestandenen Theorieprüfung: Die bestandene Theorieprüfung ist nur befristet gültig (allgemein bekannt: zwölf Monate). Countdown und Warnung in der Prüfungsplanung nötig. Konfigurierbar als Regel, Wert fachlich zu verifizieren.
8. Gültigkeit des Prüfauftrags der Führerscheinstelle: Der Prüfauftrag ist befristet. Die Frist muss überwacht und dem Büro angezeigt werden. Wert: fachlich zu verifizieren.
9. Offizielle Prüfungssprachen: Die theoretische Prüfung ist in einer definierten Menge von Sprachen möglich. Die App-Sprachen (de, tr, en, ar) sind davon zu trennen. Die Liste der Prüfungssprachen wird in der Regel-Engine (rule_type exam_languages) mit Rechtsstand gepflegt, Werte fachlich zu verifizieren.
10. Fahrlehrer-Qualifikationen je Klasse: Fahrlehrer besitzen Fahrlehrerlaubnisse für bestimmte Klassen (z. B. BE, A, CE, DE). Die Terminbuchung muss prüfen, ob der Fahrlehrer die Klasse des Schülers ausbilden darf. instructors braucht instructor_license_classes mit Gültigkeit.
11. Fahrzeug-Klassenzuordnung: Jedes Fahrzeug ist für bestimmte Klassen als Ausbildungsfahrzeug geeignet (Schaltung/Automatik, B197-relevanz, Anhänger). vehicles braucht license_classes, transmission_type und Prüfungsfahrzeug-Eignung.
12. B197 und Automatikregelung: B197 setzt eine bestimmte Mindestanzahl Schaltstunden und eine Testfahrt mit Bescheinigung voraus. Regel und Bescheinigungsdokument fehlen. Werte: fachlich zu verifizieren.
13. Prüfvorstellungs- und Gebührenpositionen: Gebühren der Prüforganisation (TÜV/DEKRA), Gebühren der Führerscheinstelle und Vorstellungsentgelte der Fahrschule sind getrennte Rechnungspositionen. Die Preisliste der Fahrschule (Grundbetrag, Fahrstunde, Sonderfahrt, Vorstellung Theorie, Vorstellung Praxis, Lernmaterial) fehlt als konfigurierbare Entität price_list mit Versionierung.
14. Mehrere Fahrschulen je Fahrlehrer: Fahrlehrer arbeiten oft für mehrere Fahrschulen (freie Mitarbeit). Ein User muss mehreren Tenants mit unterschiedlichen Rollen zugeordnet werden können; das JWT muss eine aktive tenant_id und einen Tenant-Wechsel unterstützen.
15. Fahrschulwechsel des Schülers: Bei Wechsel muss der Ausbildungsstand (Theoriestunden, Sonderfahrten, Fahrstunden) portabel exportiert werden; die Zielfahrschule importiert ihn als „extern bescheinigt". Fehlender Prozess und fehlender Dokumenttyp.
16. Vertragswechsel und Vertragsänderungen: Wechsel der Klasse (z. B. von B auf B197), Zusatzklasse, Umstellung auf Automatik, Ruhen des Vertrags, Kündigung. student_licenses benötigt Statushistorie und Vertragsdokumente.
17. Ausfallgebühr und Stornofristen: Stornogebühren der Fahrschule müssen in AGB und Ausbildungsvertrag vereinbart sein; Stornierungsregeln sind daher tenant-spezifisch und rechtlich prüfbedürftig. Das Produkt liefert nur die konfigurierbare Regel und die Dokumentation der Anwendung, keine Rechtsvorgabe.
18. Fahrschulaufsicht und Behördenprüfung: Die Fahrschulüberwachung kann Einsicht in Aufzeichnungen verlangen. Es fehlt eine Exportfunktion für Prüfzeiträume (Ausbildungsnachweise, Theorieanwesenheit) ohne Zugriff auf Chat oder KI-Daten.
19. Zeitzonen und Sommerzeit: Alle Termine werden in UTC gespeichert und in Europe/Berlin angezeigt. Bei späterer Internationalisierung braucht jeder Standort eine Zeitzone. Spezifikation nennt Zeitzonen nicht.
20. Feiertage je Bundesland: Verfügbarkeiten, Theoriekurse und Mahnfristen hängen von Feiertagen ab, die sich je Bundesland unterscheiden. Standort braucht state (Bundesland) und einen gepflegten Feiertagskalender.

### 3.2 Finanz- und Steuerlücken

21. Lückenlose Rechnungsnummern (GoBD): Rechnungsnummern müssen fortlaufend und lückenlos je Nummernkreis sein; Rechnungen dürfen nach Erstellung nicht verändert werden (nur Storno und Korrekturrechnung). Es fehlt: Nummernkreis je Tenant/Standort, Sequenz in der Datenbank, Unveränderlichkeitsgarantie, Stornobeleg.
22. Aufbewahrungsfristen: Rechnungen und Buchungsbelege unterliegen einer mehrjährigen Aufbewahrungspflicht (allgemein bekannt: zehn Jahre). Das Löschkonzept muss Rechnungen von der Löschung ausnehmen und Personendaten pseudonymisieren statt löschen. Fristen fachlich zu verifizieren.
23. Umsatzsteuer: Fahrschulleistungen sind in der Regel umsatzsteuerpflichtig (allgemein bekannt: Regelsteuersatz 19 %). Steuersatz muss je Rechnungsposition konfigurierbar sein; Kleinunternehmerregelung und Steuerbefreiungsfälle sind ebenfalls abzubilden. Fachlich zu verifizieren je Tenant durch Steuerberatung.
24. E-Rechnung im B2B-Bereich: Seit 2025 gilt in Deutschland eine Pflicht zum Empfang strukturierter E-Rechnungen im B2B-Bereich mit gestaffelten Übergangsfristen für die Ausstellung. Relevant für Firmenkunden (z. B. Berufskraftfahrer-Ausbildung C/CE/D). Format (XRechnung/ZUGFeRD) und Zeitpunkte: fachlich zu verifizieren, als Adapter in packages/payments vorsehen.
25. Kassenbuch und Barzahlungen: Viele Fahrschulen nehmen Barzahlungen entgegen. payments braucht Zahlungsart cash mit Quittung und ggf. Schnittstelle zu Kassensystemen (TSE-Pflicht bei elektronischen Kassen). Fachlich zu verifizieren.
26. Ratenzahlung und Paketpreise: Grundgebühr, Fahrstundenpakete und Ratenpläne fehlen. invoices braucht Bezug auf Verträge/Pakete, payments braucht Ratenplan.
27. Gutschriften, Rückerstattungen, Teilzahlungen: Nicht spezifiziert. Zahlungsstatus muss partially_paid, refunded, credited unterstützen.
28. DATEV-Export oder Buchhaltungsschnittstelle: Fahrschulen übergeben Belege an Steuerberater. Exportformat mindestens CSV mit Kontenrahmen-Zuordnung, später DATEV-Format. Fachlich zu verifizieren.

### 3.3 Datenschutz- und Compliance-Lücken

29. Datenschutz-Folgenabschätzung (DSFA): Wegen KI-Auswertung von Lernverhalten, Sprachaufnahmen, Standortdaten (Geofence) und Minderjährigen ist eine DSFA nach Art. 35 DSGVO wahrscheinlich erforderlich. Fehlt als Projektleistung.
30. Auftragsverarbeitungsvertrag (AVV): Die Plattform ist Auftragsverarbeiter jeder Fahrschule. AVV-Vorlage mit Subprozessorenliste (Supabase, Stripe, Push-Dienste, LLM-Anbieter, Speech-to-Text, E-Mail-Versand) fehlt. Ebenso fehlt die Verpflichtung, Subprozessorwechsel anzukündigen.
31. Löschkonzept mit Fristen je Datenart: Es gibt „Löschkonzepte" als Stichwort, aber keine Fristen. Vorschlag: Lerndaten nach Vertragsende plus konfigurierbare Frist, Chat nach konfigurierbarer Frist, Audit-Logs nach gesetzlicher Frist, Rechnungen nach Aufbewahrungsfrist. Werte fachlich zu verifizieren.
32. Einwilligungsversionierung: consents braucht Versionsbezug zum Einwilligungstext, Zeitstempel, Kanal und Widerrufsdatum; Einwilligungstexte müssen im CMS versioniert werden.
33. Sprachaufnahmen der Fahrlehrer: Aufnahmen können Stimmen Dritter (Schüler) enthalten. Speicherdauer der Audiodatei (Vorschlag: nach Bestätigung der Transkription löschen) und Information des Schülers fehlen.
34. Barrierefreiheitsstärkungsgesetz (BFSG): Seit Juni 2025 gelten Barrierefreiheitsanforderungen für bestimmte Verbraucherdienstleistungen und Apps. Ob und in welchem Umfang FahrPilot betroffen ist: fachlich zu verifizieren; die Umsetzung nach WCAG 2.1 AA ist als Ziel zu setzen.
35. Minderjährigenschutz in Chat und KI: Chat zwischen erwachsenem Fahrlehrer und minderjährigem Schüler benötigt Einsehbarkeit durch das Büro (mit Hinweis an beide Parteien) und Meldeweg. Fehlt.
36. Aufbewahrung und Zugriff auf Standortdaten: Geofence-Check-in erzeugt Standortdaten. Verarbeitung nur als Ja/Nein-Ergebnis, keine Speicherung von Koordinaten. Fehlt als Vorgabe.

### 3.4 Technische und betriebliche Lücken

37. Prüforganisations-Schnittstelle: Terminvergabe bei TÜV oder DEKRA erfolgt über deren Portale; eine offizielle API ist nicht zu unterstellen. Prüfungsplanung muss manuelles Eintragen unterstützen und eine Adapter-Schnittstelle für spätere Anbindung vorsehen. Fachlich zu verifizieren.
38. Führerscheinstellen-Kommunikation: Antragsstatus (Prüfauftrag erteilt) muss manuell erfassbar sein; keine digitale Schnittstelle zu unterstellen.
39. Konten- und Identitätslebenszyklus: Einladungsflüsse für Fahrlehrer und Büro, Passwort-Reset, Multi-Faktor-Authentifizierung für office/admin/owner, Session-Dauer, Gerätewechsel. Fehlt.
40. Support- und Impersonation-Zugriff: Plattform-Support benötigt einen dokumentierten, zeitlich begrenzten und auditierten Zugriff auf Tenant-Daten mit Einwilligung des Tenants. Fehlt.
41. Backup, Wiederherstellung, Notfallplan: RPO/RTO-Ziele fehlen. Point-in-Time-Recovery in Supabase ist aktivierbar; Zielwerte sind mit dem Kunden festzulegen.
42. Mandanten-Onboarding und Offboarding: Anlage eines Tenants, Trial, Kündigung, Datenrückgabe und Löschung nach Vertragsende fehlen.
43. Plattform-Abrechnung gegenüber Fahrschulen (SaaS-Preismodell): Preis je Schüler, je Fahrlehrer oder je Standort; Abrechnung der Fahrschule an die Plattform fehlt vollständig. Ausdrücklich zu trennen von der Abrechnung der Fahrschule an Schüler.
44. Umgang mit amtlichen Prüfungsfragen: Die Spezifikation verbietet amtliche Fragen ohne Lizenz. Es fehlt eine technische Kennzeichnung (question_source official_licensed versus own) mit Sperrlogik: Ohne aktive Lizenz des Tenants sind lizenzierte Fragen unsichtbar.
45. Bild- und Videorechte für Fragen und Situationstrainer: Jedes Medium braucht Lizenznachweis, Urheber und Nutzungsdauer im CMS.
46. Rate-Limits und Kostenkontrolle für KI: Budget je Tenant und je Schüler, Abbruch bei Überschreitung, Anzeige des Kontingents. Fehlt.
47. Push-Zustellgarantie und Fallback: Push ist nicht zuverlässig zustellbar; kritische Nachrichten (Terminabsage) brauchen E-Mail-Fallback und In-App-Inbox. Fehlt.
48. Terminserien und Theoriekurspläne: Wiederkehrende Theorieunterrichte (Wochenplan über 14 Themen) und Blockkurse (Intensivkurs) fehlen als Serienlogik.
49. Wartezeit bis Prüfung und Mindestalter: Prüfungsanmeldung ist erst ab einem bestimmten Zeitraum vor Erreichen des Mindestalters möglich. Prüfungsplanung braucht Geburtsdatum-Prüfung je Klasse. Werte: fachlich zu verifizieren, als Regel.
50. Datenimport aus Altsystemen: Fahrschulen wechseln von bestehender Software. Importformat (CSV) für Schüler, Fahrlehrer, Fahrzeuge, offene Posten fehlt.

## 4. Verbesserungsvorschläge (priorisiert)

Priorität 1 bedeutet: vor MVP-Freigabe umsetzen. Priorität 2: in Ausbaustufe 2. Priorität 3: danach.

| Prio | Vorschlag | Begründung |
|---|---|---|
| 1 | Regel-Engine um die Dimensionen acquisition_type und prior_license_class erweitern | Ohne Unterscheidung Ersterwerb/Erweiterung sind Prüfungssimulation und Ausbildungsstand für BE, A2, C1E usw. falsch. |
| 1 | Fahrstunden in 45-Minuten-Einheiten modellieren, getrennt von Kalenderdauer | Ausbildungsnachweis, Sonderfahrten und Abrechnung hängen davon ab. |
| 1 | Rechnungsunveränderlichkeit und lückenlose Nummernkreise in der Datenbank erzwingen (Sequenz, Trigger gegen UPDATE/DELETE auf finalisierten Rechnungen) | GoBD-Konformität ist Grundvoraussetzung für den Produktivbetrieb. |
| 1 | Preisliste je Tenant als versionierte Entität mit Gültigkeitszeitraum | Kostenprognose, Rechnungen und Vertragsdokumente benötigen eine belastbare Quelle. |
| 1 | Guardian-Entität und Einwilligungsfluss für Minderjährige | BF17 ist der häufigste Fall in Klasse B. |
| 1 | Multi-Tenant-Mitgliedschaft je User (tenant_memberships) statt einer festen tenant_id am User | Fahrlehrer mit mehreren Fahrschulen, Inhaber mit mehreren Tenants. |
| 1 | Lizenz-Gate für amtliche Fragen technisch erzwingen (RLS-Bedingung auf tenant_licenses) | Produktionsregel „keine amtlichen Fragen ohne Lizenz" muss unumgehbar sein. |
| 1 | Audit-Logs unveränderlich (append-only, kein UPDATE/DELETE per Rolle, separates Schema) | Beweiswert bei Streit über Stornogebühren und Ausbildungsnachweisen. |
| 1 | Testplan um Ersterwerb/Erweiterung, Einheitenberechnung, Rechnungsnummern und Minderjährigen-Einwilligung erweitern | Ergänzung zu Abschnitt 49. |
| 2 | Sync-Konflikte für Fahrlehrer-Dokumentation als append-only Ereignisse modellieren (lesson_evaluation_events) statt Last-Writer-Wins | Zwei Fahrlehrer oder Büro und Fahrlehrer bearbeiten dieselbe Stunde; Verlust von Dokumentation ist inakzeptabel. |
| 2 | In-App-Inbox als Pflichtkanal neben Push und E-Mail | Push ist nicht garantiert; Nachweis der Zustellung von Absagen. |
| 2 | Theoriekurs-Serienplanung mit 14-Themen-Rotation und Belegungsübersicht | Reduziert manuellen Aufwand des Büros deutlich. |
| 2 | Ausbildungsnachweis als PDF-Export mit Hash und Zeitstempel | Fahrschulaufsicht, Fahrschulwechsel, Streitfälle. |
| 2 | Kostenkontrolle für KI (Budget je Tenant, Kontingent je Schüler, Anzeige) | Betriebswirtschaftliche Sicherheit der Plattform. |
| 2 | E-Rechnung als Ausgabeformat (Adapter) vorbereiten | B2B-Kunden in C/CE/D-Ausbildung. |
| 2 | Chat-Einsicht durch Büro bei Minderjährigen mit Transparenzhinweis | Schutzpflicht und Haftungsrisiko. |
| 2 | Datenimport aus Altsystemen (CSV-Import-Assistent) | Wechselhürde für Fahrschulen senken. |
| 3 | Partner-API mit OAuth-Client-Credentials und Scopes von Anfang an als Schnittstellenvertrag (OpenAPI) dokumentieren, auch wenn erst in Ausbaustufe 3 freigegeben | Vermeidet späteren Umbau interner APIs. |
| 3 | White-Label über Tenant-Theming-Tokens in packages/ui vorbereiten (Farben, Logo, App-Name) | Geringer Aufwand jetzt, hoher Aufwand später. |
| 3 | Kassen- und Buchhaltungsschnittstellen (DATEV-Export, TSE) | Erst nach Bestätigung der Nachfrage. |

## 5. Externe Abhängigkeiten und Verifikationsbedarf

| Feature | Abhängigkeit | Art | Risiko | Umgang im Produkt |
|---|---|---|---|---|
| Theorie-Lernbereich, Prüfungssimulation | Amtlicher Fragenkatalog (TÜV/DEKRA arge tp 21) | Lizenz | Hoch: ohne Lizenz keine amtlichen Fragen; Lizenzkosten und Bedingungen unklar | question_source-Kennzeichnung, Lizenz-Gate per RLS, eigene Übungsfragen strikt getrennt, Feature-Flag official_questions je Tenant |
| Prüfungssimulation, Ausbildungsstand | Regelwerte je Klasse (Fragenanzahl, Fehlerpunkte, Sonderfahrten, Pflichtstunden) | Offizielle Daten | Mittel: Klasse B allgemein bekannt, andere Klassen und Erweiterungen unsicher | rule_versions mit review_status; nicht freigegebene Klassen werden in der App als „in Prüfung" angezeigt und sind nicht auswählbar |
| Prüfungsplanung | Sperrfristen, Gültigkeit Theorieprüfung, Prüfauftragsfrist, Mindestalter | Offizielle Daten | Mittel | Regeltypen in rule_versions, fachlich zu verifizieren, Anzeige mit Rechtsstand |
| Mehrsprachigkeit | Offizielle Prüfungssprachen | Offizielle Daten | Mittel: Verwechslung mit App-Sprachen | Eigener Regeltyp exam_languages, klarer Hinweis in der App |
| Finanzen | Stripe (SEPA-Lastschrift, Karten) | Drittanbieter | Mittel: Gebühren, Mandatsverwaltung, Rückbuchungen | packages/payments mit Provider-Interface, Stripe-Adapter, spätere deutsche Anbieter als weitere Adapter |
| Finanzen | GoBD, Aufbewahrungsfristen, Umsatzsteuer, E-Rechnung | Rechtliche Prüfung | Hoch | Steuersatz und Nummernkreise konfigurierbar, Unveränderlichkeit technisch erzwungen, Steuerberatung des Tenants einbinden |
| Stornierungsregeln | AGB und Ausbildungsvertrag des Tenants | Rechtliche Prüfung | Hoch: unwirksame Stornogebühren | Regel konfigurierbar je Tenant, Dokumentation jeder Anwendung, kein voreingestellter Gebührenwert |
| Digitale Anmeldung, Vertragsabschluss | Elektronische Signatur (eIDAS: einfach, fortgeschritten, qualifiziert) | Rechtliche Prüfung, ggf. Drittanbieter | Mittel: Formanforderungen an Ausbildungsverträge | MVP: Anmeldung mit Einwilligung und Bestätigung per E-Mail-Link; Vertragssignatur über Adapter, Anbieter fachlich zu verifizieren |
| Einwilligungen | DSGVO Art. 6, 7, 8 (Minderjährige), 9 | Rechtliche Prüfung | Hoch | Einwilligungstexte versioniert im CMS, Einwilligungen mit Textversion gespeichert, Datenschutzberatung |
| Push-Erinnerungen | FCM (Android), APNs (iOS) | Drittanbieter | Niedrig bis mittel: Zustellung nicht garantiert | Edge Function mit Zustellstatus, E-Mail-Fallback, In-App-Inbox |
| E-Mail-Versand | E-Mail-Provider (transaktional) | Drittanbieter | Niedrig | Adapter in Edge Function, Provider mit EU-Verarbeitung, DKIM/SPF je Tenant-Domain optional |
| Sprachnotizen | Speech-to-Text-Anbieter | Drittanbieter, Datenschutz | Mittel: Audio mit Stimmen Dritter, Verarbeitung außerhalb EU möglich | Adapter in packages/ai, EU-Region verpflichtend, Audio nach Bestätigung löschen, Feature-Flag |
| KI-Coach, Fehleranalyse, Fahrlehrer-KI | LLM-Anbieter | Drittanbieter, Datenschutz | Hoch: Halluzinationen, Datenabfluss, Kosten | Provider-Abstraktion, nur serverseitig, Antworten nur mit Quellen aus Knowledge Base, Unsicherheitskennzeichnung, Budget je Tenant, keine Personendaten im Prompt ohne Notwendigkeit |
| PDF-Erzeugung (Rechnungen, Nachweise) | PDF-Bibliothek serverseitig | Drittanbieter (Bibliothek) | Niedrig | Edge Function oder Node-Runtime, Vorlagen versioniert |
| Theorieunterricht Geofence | Standortdienste des Geräts | Datenschutz | Mittel | Optional je Tenant, nur Ja/Nein-Ergebnis speichern, Einwilligung |
| Prüfungsplanung | TÜV/DEKRA-Terminvergabe | Externe API (nicht zu unterstellen) | Mittel | Manuelle Erfassung, Adapter-Schnittstelle vorbereitet, fachlich zu verifizieren |
| Fahrzeugverwaltung | HU-Fristen, Versicherungsdaten | Manuelle Daten | Niedrig | Erinnerungen konfigurierbar, keine externe Abfrage |
| Ausbildungsnachweis | FahrschAusbO, Vorgaben der Fahrschulaufsicht | Rechtliche Prüfung | Hoch | Export als PDF, Pflichtfelder fachlich zu verifizieren |
| Accessibility | BFSG, WCAG 2.1 AA | Rechtliche Prüfung | Mittel | Ziel WCAG 2.1 AA, Prüfung durch Fachstelle |
| Hosting | Supabase EU (Frankfurt), Subprozessoren | Drittanbieter, AVV | Mittel | AVV mit Supabase, Subprozessorliste im eigenen AVV, Region fest konfiguriert |
| Bildmaterial für Situationstrainer | Bildrechte, Lizenzen | Lizenz | Mittel | Lizenznachweis je Medium im CMS Pflichtfeld |
| Kartenmaterial (Standort, Treffpunkte) | Kartenanbieter | Drittanbieter | Niedrig | Nur Adressen im MVP, Karten später über Adapter |

## 6. Nicht-Ziele und bewusste Abgrenzungen

Die folgenden Punkte gehören ausdrücklich nicht zum Produktumfang oder sind für alle drei Ausbaustufen ausgeschlossen, sofern der Kunde nichts anderes entscheidet.

1. Keine Rechtsberatung: FahrPilot stellt Regeln mit Rechtsstand dar, ersetzt aber weder die Prüfung durch Fahrschule noch Behörde. Alle Regelwerte tragen Rechtsstand und Quelle; die Verantwortung für die Freigabe liegt beim fachlichen Reviewer.
2. Keine Garantie für Prüfungserfolg: Der Prüfungsreife-Score ist eine Einschätzung, kein Versprechen. Der Disclaimer ist Pflichtbestandteil jeder Score-Anzeige.
3. Keine Nutzung amtlicher Prüfungsfragen ohne nachgewiesene Lizenz. Es werden keine Fragen „nachempfunden", die den Anschein amtlicher Fragen erwecken.
4. Keine Fahrsituations-Funktionen während der Fahrt: Foto-/Situationstrainer und Lernfunktionen sind reine Lernhilfen. CarPlay/Android Auto erhält nur sichere Funktionen (z. B. nächster Termin, Navigation zum Treffpunkt), keine Lerninhalte.
5. Kein Ersatz für die Prüforganisation: Keine Simulation, die als offizielle Prüfung dargestellt wird; die Prüfungssimulation heißt in der App durchgehend „Simulation".
6. Keine eigene Zahlungsabwicklung: Zahlungen laufen ausschließlich über lizenzierte Zahlungsanbieter; FahrPilot verwahrt keine Zahlungsmitteldaten.
7. Keine Buchhaltung: FahrPilot erstellt Rechnungen und verfolgt Zahlungsstatus, führt aber keine Finanzbuchhaltung. Export an Steuerberater ist geplant, Buchhaltung selbst nicht.
8. Keine Fahrzeugtelematik: Kein Auslesen von Fahrzeugdaten, keine Fahrtenschreiber-Integration.
9. Keine automatische Bewertung von Fahrverhalten durch KI: Die Fahrlehrer-Dokumentation ist die einzige Quelle für Praxisbewertungen; KI schlägt nur Strukturierung vor und der Fahrlehrer bestätigt.
10. Keine Demo-, Fake- oder Platzhalterdaten in der Produktionsumgebung: Leere Zustände werden gestaltet, nicht mit Beispieldaten gefüllt. Testdaten existieren nur in Test- und Staging-Umgebungen mit eigener Kennzeichnung.
11. Keine Funktionen ohne vollständige Umsetzung: Jeder sichtbare Button hat eine Funktion. Funktionen in Ausbaustufe 2 oder 3 sind in der Produktionsversion nicht sichtbar, nicht ausgegraut.
12. Keine Verarbeitung außerhalb der EU: Alle Subprozessoren müssen Daten in der EU verarbeiten. Anbieter ohne diese Zusicherung werden nicht angebunden, auch nicht optional.
13. Kein Marketing-Tracking in Schüler- und Fahrlehrer-Apps: Nur technisch notwendige Telemetrie (Absturzberichte, Performance) mit Einwilligung; keine Werbe-SDKs.
14. Keine Öffnung des Chats für Schüler untereinander: Kommunikation ist auf Schüler-Fahrlehrer und Schüler-Büro beschränkt.
15. Keine Franchise-, White-Label- und Partner-API-Funktionen vor Ausbaustufe 3, jedoch Architekturvorbereitung durch Tenant-Theming-Tokens, Mitgliedschaftsmodell und OpenAPI-Vertrag.

## 7. Ergänzungen zum Datenmodell (Abschnitt 40)

Die 32 Entitäten der Spezifikation bleiben erhalten. Aus den fehlenden Anforderungen ergeben sich folgende Ergänzungen, die vor der ersten Migration festgelegt werden sollten.

| Neue oder geänderte Entität | Zweck | Begründung (Abschnitt 3) |
|---|---|---|
| tenant_memberships (user_id, tenant_id, role, status, location_ids) | Ein User in mehreren Tenants mit unterschiedlichen Rollen; Quelle für den Auth-Hook | Punkt 14 |
| guardians, student_guardians | Erziehungsberechtigte mit Kontaktkanal und Einwilligungsbezug | Punkt 5 |
| instructor_license_classes | Fahrlehrerlaubnis je Klasse mit Gültigkeit | Punkt 10 |
| vehicles.license_classes, vehicles.transmission_type, vehicles.exam_eligible | Fahrzeugeignung je Klasse und für Prüfungen | Punkt 11 |
| lessons.units, lessons.lesson_type (standard, ueberland, autobahn, nacht, pruefungsvorbereitung, pruefung) | 45-Minuten-Einheiten und Sonderfahrtentyp | Punkte 2, 3 |
| student_licenses.acquisition_type, student_licenses.prior_license_class, student_licenses.status_history | Ersterwerb versus Erweiterung, Vertragsstatus | Punkte 4, 16 |
| price_lists, price_list_items (valid_from, valid_until) | Versionierte Preisliste je Tenant und Standort | Punkt 13 |
| invoice_number_sequences | Lückenlose Nummernkreise je Tenant, Standort und Jahr | Punkt 21 |
| invoices.finalized_at, invoices.canceled_by_invoice_id | Unveränderlichkeit und Storno über Gegenbeleg | Punkt 21 |
| payment_plans, payment_plan_installments | Ratenzahlung | Punkt 26 |
| consent_texts (version, valid_from, locale, body) | Versionierte Einwilligungstexte, consents referenziert consent_text_id | Punkt 32 |
| tenant_licenses (license_type official_questions, valid_from, valid_until) | Lizenz-Gate für amtliche Fragen | Punkt 44 |
| theory_questions.question_source (official_licensed, own) | Strikte Trennung | Punkt 44 |
| media_assets (license, author, valid_until) | Bild- und Videorechte | Punkt 45 |
| ai_usage (tenant_id, student_id, tokens, cost, feature) | Kostenkontrolle | Punkt 46 |
| notification_inbox | In-App-Inbox mit Zustellstatus | Punkt 47 |
| theory_class_series | Serienplanung der Theoriekurse | Punkt 48 |
| training_certificates (external_import, hash, issued_at) | Ausbildungsnachweis, Fahrschulwechsel | Punkte 1, 15 |
| holidays (state, date, name) | Feiertage je Bundesland | Punkt 20 |
| locations.timezone, locations.state | Zeitzone und Bundesland | Punkte 19, 20 |
| support_access_grants | Zeitlich begrenzter, auditierter Supportzugriff | Punkt 40 |

## 8. Phasenweise Arbeitsweise (Abschnitt 53)

Die Spezifikation verlangt phasenweises Arbeiten. Vorgeschlagene Phasen mit Abnahmekriterien; jede Phase endet mit lauffähiger Software ohne Demo-Daten.

| Phase | Inhalt | Abnahmekriterium |
|---|---|---|
| 0 Fundament | Monorepo, packages/db mit Tenant-Modell, Auth-Hook, RLS, Audit-Trigger, packages/ui Design-Tokens, CI mit Tenant-Isolationstests | Zwei Test-Tenants können sich gegenseitig keine Daten lesen; Audit-Log entsteht bei jeder Änderung |
| 1 Betrieb | Fahrschul-Administration, Anmeldung, Dokumenten-Checkliste, Team, Fahrzeuge, Terminbuchung mit Exclusion-Constraint, Stornierungsregeln | Büro kann Schüler anlegen, Fahrlehrer einladen, Termine ohne Doppelbuchung planen |
| 2 Praxis | Fahrlehrer-App, Schnell-Dokumentation, Kompetenzprofil, Sonderfahrten-Ausbildungsstand über rules-engine, Chat | Fahrlehrer dokumentiert eine Stunde in unter 30 Sekunden; Ausbildungsstand Klasse B korrekt |
| 3 Theorie | Lernbereich Klasse B mit eigenen Übungsfragen, Spaced Repetition, Prüfungssimulation, Prüfungsreife-Score, Heute-Modus, Offline-Lernen, CMS mit Freigabe-Workflow | Simulation berechnet Ergebnis mit rule_version_id; Rechtsstand sichtbar; Offline-Sync ohne Datenverlust |
| 4 Prüfung und Finanzen | Prüfungsplanung mit Statusworkflow, Theorieunterricht mit QR-Check-in, Rechnungen mit Nummernkreisen und PDF, Zahlungsstatus, DSGVO-Export und Löschung | Rechnung unveränderlich, Export vollständig, Löschung pseudonymisiert Rechnungsdaten |
| 5 Ausbaustufe 2 | KI-Coach, Warum-Button, Fehleranalyse, Sprachnotizen, SEPA, Mahnlauf, Warteliste, Gamification, Sprachen en/tr/ar, Fahrschul-Analytics | Jede KI-Antwort mit Quelle oder Unsicherheitskennzeichnung; SEPA-Webhook idempotent |
| 6 Ausbaustufe 3 | KI-Prüfungscoach, Fahrlehrer-KI, Situationstrainer, CarPlay/Android Auto (sichere Funktionen), White-Label, Partner-API | Nach separater Freigabe durch den Kunden |

## 9. Risikoregister

| Risiko | Eintrittswahrscheinlichkeit | Auswirkung | Gegenmaßnahme |
|---|---|---|---|
| Keine Lizenz für amtliche Fragen erhältlich oder zu teuer | Mittel | Hoch: Theoriebereich verliert Kernnutzen | Eigene Übungsfragen als vollwertiger Modus; Lernbereich funktioniert unabhängig; Lizenz-Gate sauber trennbar |
| Regelwerte anderer Klassen falsch | Mittel | Hoch: falsche Prüfungsvorbereitung, Haftung | review_status-Gate, nur freigegebene Klassen sichtbar, Rechtsstand sichtbar, Quelle Pflichtfeld |
| Unwirksame Stornogebühren durch Fehlkonfiguration des Tenants | Mittel | Mittel | Kein Standardwert, Hinweis auf AGB-Prüfung, Dokumentation jeder Gebührenanwendung |
| KI-Halluzination in Lerninhalten | Hoch ohne Guardrails | Hoch | Nur Knowledge-Base-Antworten mit Quellen, sonst Unsicherheit; kein freies Generieren von Regelwerten |
| Datenverlust bei Offline-Sync | Niedrig bei append-only | Hoch | Idempotenzschlüssel, serverseitiges Merge, Sync-Tests mit Konfliktszenarien |
| Doppelbuchung durch Race-Condition | Niedrig durch Exclusion-Constraint | Mittel | Constraint in der Datenbank, Integrationstests mit parallelen Buchungen |
| Tenant-Isolation bricht durch fehlende RLS auf neuer Tabelle | Mittel | Sehr hoch | Migrations-Lint: jede Tabelle mit tenant_id muss RLS aktiviert haben; automatischer Test in CI |
| Push-Zustellung schlägt fehl bei Terminabsage | Mittel | Mittel | E-Mail-Fallback und In-App-Inbox, Lesebestätigung |
| Subprozessor verarbeitet außerhalb EU | Niedrig bei Auswahl | Hoch | Region fest konfiguriert, Anbieterprüfung vor Anbindung, AVV |
| GoBD-Verstoß durch veränderbare Rechnungen | Niedrig bei Trigger-Schutz | Hoch | Datenbank-Trigger gegen UPDATE/DELETE nach finalized_at, Storno nur per Gegenbeleg |
| BF17-Einwilligung fehlt | Mittel ohne Guardian-Modell | Hoch | Guardian-Entität, Pflichtprüfung in Anmeldung bei Alter unter 18 |

## 10. Offene Entscheidungen für den Kunden

1. Lizenzstrategie für den amtlichen Fragenkatalog: Lizenz durch die Plattform (zentral) oder durch jede Fahrschule (dezentral)? Beeinflusst Lizenz-Gate und Preismodell.
2. Prüfungssprachen-Liste und Regelwerte für alle Klassen außer B: Wer übernimmt die fachliche Prüfung und mit welchem Turnus?
3. Umgang mit Stornogebühren: Liefert die Plattform Mustertexte (nach Rechtsprüfung) oder ausschließlich die konfigurierbare Regel?
4. Signaturniveau für den Ausbildungsvertrag: Einfache Bestätigung, fortgeschrittene oder qualifizierte Signatur?
5. Speech-to-Text- und LLM-Anbieter: Auswahl nach EU-Verarbeitung, Kosten und Qualität; Entscheidung vor Ausbaustufe 2.
6. SaaS-Preismodell der Plattform gegenüber Fahrschulen und dessen Abrechnung.
7. Umfang der Chat-Einsicht durch das Büro bei Minderjährigen.
