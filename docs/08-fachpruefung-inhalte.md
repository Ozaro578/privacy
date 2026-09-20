# Fachprüfung der Lerninhalte (Klasse B)

Stand der Prüfung: 19. September 2026. Rechtsstand der Inhalte: 1. September 2026 (`legalBasisDate` "2026-09-01"). Geprüft wurde alles unter `packages/content/src/` sowie die Bildzuordnung in `packages/content/src/media.ts` und `packages/content/media/manifest.json`.

Wichtig: Diese Prüfung wurde ohne Zugriff auf gesetze-im-internet.de oder andere Online-Quellen aus Fachwissen durchgeführt. Sie ersetzt nicht die Freigabe durch einen zugelassenen Fahrlehrer (siehe Abschnitt "Offene Punkte"). Vor dem Produktivbetrieb ist diese Freigabe Pflicht.

## Prüfumfang

| Bereich | Datei(en) | Anzahl |
|---|---|---|
| Übungsfragen | `questions/*.ts` (19 Themendateien) | 202 |
| Wissenseinträge | `knowledge.de.ts` | 83 |
| Lernkapitel | `chapters.de.ts` | 19 |
| Prüferfragen (praktische Prüfung) | `practical-questions.de.ts` | 45 |
| Bildzuordnungen Frage zu Bild | `media.ts` | 90 (nach Prüfung 88) |
| Bildmedien (Alt-Texte, Zeichenbeschreibungen) | `media/manifest.json`, `scripts/gen-media.mjs` | 106 |

## Methode

1. Jede Datei wurde vollständig gelesen. Jede Aussage (Fragetext, Antworten inkl. `correct`, Erklärungen, Merksätze, Rechtsquellen, Punkte, Tags) wurde gegen den Kenntnisstand zu StVO, FeV, FZV, StVZO, StVG, BKatV, FahrschAusbO, eKFV, KCanG und Prüfungsrichtlinie geprüft.
2. Eindeutige Fehler wurden direkt in den Dateien korrigiert. Der Stil wurde beibehalten (keine Gedankenstriche in Inhalten, Prüfung durch `content.test.ts`).
3. Aussagen, die nicht sicher belegbar sind oder sich seit 2024 geändert haben könnten, tragen `reviewStatus: "needs_verification"` und sind so formuliert, dass sie nach heutigem Stand korrekt sind.
4. Zahlen, die keine gesetzliche Grundlage haben (Warndreieck-Entfernungen), werden jetzt ausdrücklich als Faustregel bzw. Praxisempfehlung bezeichnet.
5. Bei Bildmedien wurde geprüft, ob der Alt-Text im Manifest zur Frage passt und ob das Bild die Antwort verfälscht oder eine andere Situation zeigt als die Frage.
6. Gezielt wurde nach Beschreibungsfehlern bei Verkehrszeichen gesucht (Anlass: own-verkehrszeichen-011, Zeichen 301, bereits korrigiert).
7. Abschluss: `pnpm --filter @fahrpilot/content test` (18 Tests) und `pnpm --filter @fahrpilot/content typecheck` sind grün.

## Korrekturen

### K1: own-verkehrsregelung-005 (Polizei-Handzeichen), Fragetext, Antworten, Erklärung, Bild

- Vorher: "Ein Polizeibeamter ... steht mit seitlich ausgestreckten Armen quer zu Ihrer Fahrtrichtung." Richtige Antwort: "Freie Fahrt, entsprechend Grün".
- Nachher: "Ihnen ist seine Brust zugewandt, beide Arme sind seitlich ausgestreckt, also quer zu Ihrer Fahrtrichtung." Richtige Antwort: "Halt vor der Kreuzung, entsprechend Rot". Erklärung ergänzt: Wer in Richtung der Arme fährt (Beamter von der Seite gesehen), hat freie Fahrt.
- Begründung: Die Formulierung "Arme quer zur Fahrtrichtung" ist genau der Wortlaut des Haltezeichens. Wer den Beamten mit Brust oder Rücken vor sich hat, muss halten. Die Frage verlangte das Gegenteil. Zusätzlich zeigte die zugeordnete Grafik `polizist-seitlich` den Beamten von vorn mit der Bildunterschrift "= Halt vor der Kreuzung (wie Rot)", widersprach also der bisher als richtig markierten Antwort. Der Alt-Text im Manifest war in sich widersprüchlich ("von der Seite ... das bedeutet Halt") und wurde neu gefasst. Die Grafik passt jetzt zur Frage.
- Rechtsquelle: § 36 Abs. 2 StVO.
- Folgeänderungen: Wissenseintrag `polizei-handzeichen` (Zusammenfassung und Text) und Kapitel "Lichtzeichen und Verkehrsregelung" (Kernregel Polizei) entsprechend präzisiert. Der Merksatz "Seite = Grün, Brust und Rücken = Rot, Arm hoch = Gelb" war bereits richtig und bleibt.

### K2: own-gefahrenlehre-003 (Smartphone an roter Ampel), Erklärung

- Vorher: "... ein automatisch abgeschalteter Motor der Start-Stopp-Funktion zählt dabei als abgeschaltet."
- Nachher: "... Ein von der Start-Stopp-Automatik nur vorübergehend abgeschalteter Motor gilt dabei nicht als ausgeschaltet."
- Begründung: § 23 Abs. 1b Satz 2 StVO bestimmt ausdrücklich, dass das fahrzeugseitige automatische Abschalten des Motors kein Ausschalten im Sinne der Ausnahme ist. Die bisherige Aussage war falsch und hätte Fahrschüler zu einem Verstoß (Bußgeld, Punkt) verleiten können. Die richtige Antwort der Frage selbst war bereits korrekt.
- Rechtsquelle: § 23 Abs. 1a und 1b StVO.
- Folgeänderung: Wissenseintrag `handy-am-steuer` gleichlautend korrigiert.

### K3: Kapitel "Verkehrszeichen", Abschnitt "Typische Fehler" (Zeichen 301)

- Vorher: "Zeichen 301 mit Zeichen 306 verwechseln: Das gelbe Quadrat im Dreieck gilt nur für die nächste Kreuzung."
- Nachher: "... Das Dreieck mit dem breiten schwarzen Pfeil (301) gilt nur für die nächste Kreuzung, das gelbe Quadrat (306) bis zum Ende der Vorfahrtstraße."
- Begründung: Zeichen 301 zeigt kein gelbes Quadrat; das ist Zeichen 306. Gleicher Beschreibungsfehler wie der bereits korrigierte in own-verkehrszeichen-011.
- Rechtsquelle: Anlage 3 zu § 42 StVO (Zeichen 301, 306).

### K4: own-unfall_panne-001 und own-unfall_panne-002 (Warndreieck-Entfernung), Text, Erklärung, Rechtsquelle

- Vorher: Fragen und Erklärungen stellten 150 bis 200 m (Autobahn) bzw. 100 m (Landstraße) als feste Werte dar, Rechtsquelle "§ 15 StVO".
- Nachher: Fragetext "nach der üblichen Faustregel"; Erklärung sagt ausdrücklich, dass die StVO nur "ausreichende Entfernung" verlangt und die Meterangaben Praxisempfehlungen sind. Rechtsquelle: "§ 15 Abs. 1 StVO (ausreichende Entfernung); Meterangaben sind Praxisempfehlung".
- Begründung: § 15 StVO nennt keine Meterzahl. Die Werte sind Ausbildungspraxis und dürfen nicht als Gesetz gelehrt werden.
- Folgeänderungen: Wissenseintrag `warndreieck-abstaende` (Zusammenfassung, Text, Rechtsquelle), Kapitel "Unfall, Panne und Erste Hilfe" (Kernregel Absichern), Prüferfrage "Wie sichern Sie eine Unfall- oder Pannenstelle ab?" (Stichpunkt Warndreieck).

### K5: own-alkohol_drogen-007 (Cannabis), Antwort, Erklärung, Rechtsquelle

- Vorher: Antwort "Wer unter Cannabiseinfluss fährt, darf keinen Alkohol getrunken haben"; Rechtsquelle "§ 24a StVG".
- Nachher: Antwort "Wer mit 3,5 ng/ml THC oder mehr fährt und zusätzlich Alkohol getrunken hat, wird wegen Mischkonsums deutlich strenger geahndet"; Erklärung mit "seit August 2024" und Beschreibung des Mischkonsum-Tatbestands; Rechtsquelle "§ 24a Abs. 1a StVG; § 24c StVG".
- Begründung: Der Mischkonsum-Tatbestand knüpft an das Erreichen des THC-Grenzwerts plus Alkohol an; die alte Formulierung suggerierte ein allgemeines Alkoholverbot bei jeglichem Cannabiskonsum. Das Cannabisverbot für Fahranfänger steht in § 24c StVG, nicht in § 24a. Die Frage bleibt auf `needs_verification` (siehe unten).
- Folgeänderungen: Wissenseintrag `cannabis-grenzwert` (Text, Rechtsquelle) und Kapitel "Alkohol, Drogen, Medikamente" (Kernregel Cannabis um Mischkonsum ergänzt).

### K6: own-recht-007 (B196), Rechtsquelle

- Vorher: "§ 6b FeV". Nachher: "§ 6 Abs. 4 FeV; Anlage 7b FeV".
- Begründung: Einen § 6b FeV gibt es nicht; die Regelung zu B196 steht in § 6 Abs. 4 FeV mit der Schulung nach Anlage 7b.
- Folgeänderung: Wissenseintrag `b196-leichtkraftrad` gleich korrigiert.

### K7: own-recht-010 (Führerschein vergessen), Erklärung

- Ergänzt: "(Verwarnungsgeld 10 Euro)". Inhaltlich richtig war die Frage bereits.
- Rechtsquelle: § 4 Abs. 2 FeV; § 75 Nr. 4 FeV; BKatV Nr. 168.

### K8: Wissenseintrag `kindersicherung`, Tippfehler

- "vollendenden" zu "vollendeten" (Rechtsbegriff "bis zum vollendeten zwölften Lebensjahr").

### K9: Bildzuordnung own-halten_parken-003 entfernt

- Vorher: Numerische Frage nach dem 8-Meter-Parkverbot bei baulichem Radweg zeigte die Grafik `halten-parken-kreuzung-5m`, deren Alt-Text und Beschriftung "5 m" nennen.
- Nachher: Kein Bild. Begründung: Das Bild verrät einen falschen Zahlenwert (5 statt 8) und verfälscht die Antwort.

### K10: Bildzuordnung own-unfall_panne-002 entfernt

- Vorher: Frage zur Landstraße zeigte die Autobahngrafik `panne-warndreieck-autobahn` mit "rund 150 m".
- Nachher: Kein Bild. Begründung: Falsche Situation (Autobahn statt Landstraße) mit abweichender Zahl.

### K11: Medien-Generator `scripts/gen-media.mjs`, Zeichenbeschreibungen (mit Neugenerierung von `manifest.json`, `media.manifest.ts` und SVG)

- `209-10` zu `209-20`: Der gezeichnete Pfeil zeigt nach rechts ("Vorgeschriebene Fahrtrichtung rechts"). Das ist Zeichen 209-20; 209-10 ist die Variante links. Datei `signs/209-10.svg` entfernt, `signs/209-20.svg` neu erzeugt. Das Zeichen ist keiner Frage zugeordnet.
- `201-50` Alt-Text: "liegendes X" zu "weißes X-förmiges Kreuz mit roten Spitzen" (die Zeichnung ist ein stehendes Andreaskreuz).
- `307` Alt-Text: "schwarzem Querbalken" zu "schwarzem Schrägbalken" (der Balken verläuft diagonal).
- `polizist-seitlich` Alt-Text neu (siehe K1).
- Die Kopien unter `apps/web/public/media/questions` wurden mit `apps/web/scripts/sync-media.mjs` aktualisiert (Verzeichnis ist nicht versioniert).

## needs_verification-Kennzeichnungen

| Element | Grund |
|---|---|
| own-alkohol_drogen-007 (Frage) | Cannabis-Regeln (THC-Grenzwert 3,5 ng/ml seit 22. August 2024, Cannabisverbot für Fahranfänger in § 24c StVG, Mischkonsum-Tatbestand). Der genaue Tatbestandswortlaut in § 24a Abs. 1a StVG und die Bußgeldhöhen der BKatV sollten mit aktuellem Gesetzestext abgeglichen werden. Bereits vor der Prüfung gekennzeichnet, Text präzisiert. |
| cannabis-grenzwert (Wissenseintrag) | Gleicher Grund. Bereits vor der Prüfung gekennzeichnet, Text und Rechtsquelle präzisiert. |

Keine weiteren Elemente wurden auf `needs_verification` gesetzt. Für alle übrigen Inhalte ist der Kenntnisstand ausreichend sicher; Punkte mit Restunsicherheit stehen unter "Offene Punkte" und sind dort begründet.

## Geprüft und bestätigt (je Thema)

Alle Zahlen sind Anzahl geprüfter Elemente. "Korrigiert" bedeutet: mindestens ein Feld geändert; alle anderen Elemente des Themas wurden ohne Befund bestätigt.

| Thema | Fragen | davon korrigiert | Wissen | Kapitel | Bemerkung |
|---|---|---|---|---|---|
| Gefahrenlehre | 10 | 1 (003) | 4 (1 korrigiert) | 1 | Faustformeln, Reaktionszeit, § 23 StVO |
| Recht | 12 | 2 (007, 010) | 8 (1 korrigiert) | 1 | Probezeit, Prüfungsregeln, BF17, B196, B197, Klasse B, Punkte |
| Verkehrszeichen | 12 | 0 | 6 | 1 (korrigiert) | Beschreibungen aller Zeichen in Fragen geprüft (205, 206, 244.1, 267, 274.1, 276, 283/286, 301, 325.1, Andreaskreuz) |
| Straßenbenutzung | 11 | 0 | 5 | 1 | Rettungsgasse § 11 Abs. 2, § 18, § 7 Abs. 4, Kinder auf dem Rad |
| Vorfahrt | 11 | 0 | 5 | 1 | § 8, § 9 Abs. 3, § 10, § 38; alle Bilder passend |
| Verkehrsregelung | 10 | 1 (005) | 4 (1 korrigiert) | 1 (korrigiert) | Ampel, Grünpfeil 720/721, Dauerlichtzeichen, Polizei |
| Geschwindigkeit | 12 | 0 | 4 | 1 | 50/100/80, Sicht unter 50 m, halber Tacho, Lkw 50 m, Faustformeln nachgerechnet |
| Andere Verkehrsteilnehmer | 11 | 0 | 5 | 1 | 1,5 m / 2 m, § 20, § 26, eKFV, § 9 Abs. 6 |
| Fahrmanöver | 11 | 0 | 4 | 1 | § 5, § 6, § 7 Abs. 3 und 5, § 9 |
| Kreisverkehr | 9 | 0 | 2 | 1 | § 8 Abs. 1a, § 9a |
| Halten und Parken | 12 | 0 (1 Bild entfernt) | 5 | 1 | 5/8/15 m, Andreaskreuz 5/50 m, Parkscheibe, Schutzstreifen |
| Besondere Situationen | 10 | 0 | 4 | 1 | Aquaplaning, Wild, Tunnel, § 19 |
| Unfall und Panne | 11 | 2 (001, 002; 1 Bild entfernt) | 4 (1 korrigiert) | 1 (korrigiert) | Warndreieck als Faustregel, § 142 StGB, § 323c StGB, Pflichtausrüstung |
| Umwelt | 10 | 0 | 3 | 1 | § 30 StVO, Umweltzone |
| Alkohol und Drogen | 11 | 1 (007) | 4 (1 korrigiert) | 1 (ergänzt) | 0,0 / 0,3 / 0,5 / 1,1 / 1,6, Cannabis |
| Fahrzeugtechnik | 10 | 0 | 5 | 1 | 1,6 mm, Alpine-Symbol ab 1.10.2024, HU 36/24, Schneeketten 50 km/h |
| Beleuchtung | 9 | 0 | 4 | 1 | § 17 StVO, Nebelschlussleuchte, Warnblinklicht |
| Beförderung | 10 | 0 | 3 (1 Tippfehler) | 1 | Kindersitz 12/150, Ladung 1 m / 1,5 m / 3 m, 4 m / 2,55 m, Anhänger |
| Fahrphysik | 10 | 0 | 4 | 1 | Fliehkraft, Kammscher Kreis, ABS/ESP |
| Summe | 202 | 7 Fragen | 83 (6 korrigiert) | 19 (4 geändert) | |

Prüferfragen: 45 geprüft, 1 Stichpunkt geändert (Warndreieck), 44 ohne Befund bestätigt (Beleuchtung 9, Reifen 6, Bremsen 5, Flüssigkeiten 5, Kontrollleuchten 6, Lenkung 4, Sicherheitsausrüstung 5, Allgemein 5).

Bildmedien: 106 Alt-Texte und die zugehörigen Zeichnungsdefinitionen geprüft, 4 geändert (K11). 90 Fragezuordnungen geprüft, 2 entfernt (K9, K10), 88 bestätigt.

Ausdrücklich bestätigt wurden unter anderem: Prüfungsregeln Klasse B Ersterwerb (30 Fragen, max. 10 Fehlerpunkte, zwei 5-Punkte-Fragen falsch = nicht bestanden), Theorie 12 Monate gültig, Sonderfahrten 5/4/3, Probezeit 2 Jahre plus 2 Jahre Verlängerung, Punktesystem 4-5 Ermahnung / 6-7 Verwarnung / 8 Entzug, BF17 (30 Jahre, 5 Jahre Klasse B, max. 1 Punkt), B197 (10 Schaltstunden, 15 Minuten Testfahrt), Rettungsgasse, Überholabstand 1,5 m / 2 m, Lkw-Rechtsabbiegen Schrittgeschwindigkeit, Gurt- und Kindersitzpflicht, Nebelschlussleuchte und 50 km/h bei Sicht unter 50 m, HU-Fristen, Profiltiefe, Winterreifen mit Alpine-Symbol, Ladungsüberstand, Parkabstände, Andreaskreuz-Abstände, Baken 240/160/80 m, Parkscheibe, Grünpfeil-Regeln, alle Faustformeln (nachgerechnet, inkl. der numerischen Antworten 9, 25, 30, 50, 100, 130 m), Promillegrenzen inkl. Radfahrer 1,6 und MPU ab 1,6.

## Offene Punkte für die Verifikation durch einen zugelassenen Fahrlehrer (Pflicht vor Produktivbetrieb)

1. Cannabis (own-alkohol_drogen-007, cannabis-grenzwert, Kapitel Alkohol): Wortlaut von § 24a Abs. 1a und § 24c StVG sowie Bußgeldsätze der BKatV mit aktuellem Stand abgleichen. Einzige verbleibenden `needs_verification`-Elemente.
2. Reform der Fahrschüler-Ausbildungsordnung: Zum Zeitpunkt der Prüfung ist nicht sicher, ob die geplante Neufassung der FahrschAusbO (Optimierung der Fahrausbildung) bis zum 1. September 2026 in Kraft getreten ist und ob sie die Sonderfahrten 5/4/3 oder die Theoriestunden 12 plus 2 ändert. Betroffen: own-recht-008, Wissenseintrag `sonderfahrten`, Kapitel Recht.
3. Sperrfrist von zwei Wochen nach nicht bestandener Prüfung (own-recht-004, `theoriepruefung-klasse-b`, Kapitel Recht): Regel ist gefestigte Prüfungspraxis; die genaue Fundstelle (Anlage 7 FeV bzw. Prüfungsrichtlinie) sollte bestätigt werden.
4. § 7 Abs. 2a StVO (own-strassenbenutzung-008, `rechts-schneller-innerorts`): Die Frage nennt "geringfügig höhere Geschwindigkeit". Der heutige Wortlaut nennt zusätzlich konkrete Grenzen (Differenz von höchstens 20 km/h). Inhaltlich ist die Frage nicht falsch; der Fahrlehrer sollte entscheiden, ob die 20 km/h ergänzt werden.
5. Elektrokleinstfahrzeuge (own-andere_teilnehmer-006, `e-scooter-regeln`): Die eKFV wurde 2025 novelliert (unter anderem Blinkerpflicht für neue Fahrzeuge, Gehwegparken). Die geprüften Kernaussagen (ab 14 Jahren, 20 km/h, Radweg oder Fahrbahn, keine Helmpflicht, keine Mitfahrer) sind nach Kenntnisstand unverändert, sollten aber gegen die aktuelle Fassung geprüft werden.
6. Zulassungsbescheinigung Teil I (own-fahrzeugtechnik-009): Rechtsquelle "§ 11 FZV" bezieht sich auf die FZV in der Fassung ab 2023; Paragraf und Absatz sollten mit dem aktuellen Text abgeglichen werden. Außerdem prüfen, ob digitale Nachweise (i-Kfz) in der Fahrausbildung erwähnt werden sollen.
7. Klasse B (own-recht-009, `klasse-b-umfang`): Die vierte EU-Führerscheinrichtlinie ist beschlossen, aber nach Kenntnisstand bis September 2026 nicht in deutsches Recht umgesetzt. Sollte die Umsetzung erfolgt sein, sind Massegrenzen (z. B. 4.250 kg für alternative Antriebe) und Regeln zum digitalen Führerschein (own-recht-010: "Foto ersetzt das Dokument nicht") zu prüfen.
8. Bild own-besondere_situationen-003 (Glätte auf Brücken) zeigt Zeichen 114 (Schleudergefahr bei Nässe oder Schmutz). Nicht falsch, aber Zeichen 113 (Schnee- oder Eisglätte) wäre treffender. Empfehlung: Zeichen 113 in `gen-media.mjs` ergänzen und zuordnen.
9. Alle Rechtsquellenangaben (Paragraf, Absatz, Nummer) wurden auf Plausibilität geprüft, nicht Zeichen für Zeichen gegen den Gesetzestext. Eine Stichprobe von mindestens 20 Angaben durch den Fahrlehrer wird empfohlen.
10. Bußgeld- und Punkteangaben (z. B. Verwarnungsgeld 10 Euro, 250 Euro bei Alkoholverbot in der Probezeit) sind gegen die aktuelle BKatV zu prüfen, da Bußgeldkataloge häufiger geändert werden als die StVO.

## Testergebnis

- `pnpm --filter @fahrpilot/content test`: 18 Tests bestanden (inkl. Gedankenstrich-Prüfung, Wortzahl der Kapitel 250 bis 500, Satzzahl der Wissenseinträge, Medien-Existenz und Titel).
- `pnpm --filter @fahrpilot/content typecheck`: ohne Fehler.
- Nicht committet.

## Nachprüfung Fragen Gruppe A (September 2026)

Geprüft wurden die neuen Übungsfragen own-gefahrenlehre-011 bis 040, own-recht-013 bis 042, own-strassenbenutzung-012 bis 041, own-vorfahrt-012 bis 041, own-verkehrsregelung-011 bis 040, own-geschwindigkeit-013 bis 042, own-andere_teilnehmer-012 bis 041, own-fahrmanoever-012 bis 041, own-kreisverkehr-010 bis 039 und own-verkehrszeichen-013 bis 042 sowie die Bildzuordnungen in `src/media.extra.a.ts`. Alle numerischen Fragen wurden nachgerechnet. Keine Frage wurde entfernt.

| Thema | geprüft | korrigiert | needs_verification | entfernt |
|---|---|---|---|---|
| Gefahrenlehre | 30 | 1 | 1 | 0 |
| Recht | 30 | 4 | 3 | 0 |
| Straßenbenutzung | 30 | 2 (nur Rechtsquelle) | 0 | 0 |
| Vorfahrt | 30 | 2 | 0 | 0 |
| Verkehrsregelung | 30 | 3 (nur Rechtsquelle) | 0 | 0 |
| Geschwindigkeit | 30 | 1 | 0 | 0 |
| Andere Verkehrsteilnehmer | 30 | 1 (nur Rechtsquelle) | 1 | 0 |
| Fahrmanöver | 30 | 1 | 0 | 0 |
| Kreisverkehr | 30 | 0 | 0 | 0 |
| Verkehrszeichen | 30 | 4 | 0 | 0 |
| Bildzuordnungen (QUESTION_MEDIA_A) | 125 | 5 entfernt, 3 Fragen an das Bild angepasst | | |

### Korrekturen

- own-gefahrenlehre-037: Erklärung präzisiert. Das schnellere Fahrzeug (70 km/h) hat nach 40 m bereits 19 m seines 49 m langen Bremswegs zurückgelegt und trifft mit über 50 km/h auf; zuvor stand "erst begonnen abzubremsen".
- own-recht-021: Bei BF17 ohne Begleitperson wird die Fahrerlaubnis widerrufen (§ 48a Abs. 3 FeV), nicht nur die Prüfungsbescheinigung. Antwort und Erklärung angepasst.
- own-recht-026: Das Fahrverbot dauert nur bei Ordnungswidrigkeiten einen bis drei Monate (§ 25 StVG); als Nebenstrafe nach § 44 StGB bis zu sechs Monate. Antwort und Erklärung angepasst; "gilt für alle Kraftfahrzeuge" zu "in der Regel für Kraftfahrzeuge jeder Art" abgeschwächt, weil eine Beschränkung auf bestimmte Fahrzeugarten möglich ist.
- own-recht-040: Die vertiefte Hauptuntersuchung wird bereits ab mehr als zwei Monaten Fristüberschreitung fällig (Anlage VIII StVZO), nicht erst ab acht Monaten. Erklärung korrigiert; der Punkt ab acht Monaten bleibt richtig.
- own-strassenbenutzung-015 und 038: Rechtsquelle um § 7a Abs. 3 StVO ergänzt (schnelleres Fahren auf dem Einfädelungsstreifen).
- own-vorfahrt-020: Fragetext an das Bild angepasst (Ampel dunkel oder gelb blinkend statt nur gelb blinkend); die Aussage zum gelben Blinklicht bleibt.
- own-vorfahrt-033: Die Antwort sprach von "entgegenkommenden" Fahrzeugen, gemeint sind Fahrzeuge, die von links auf der abknickenden Vorfahrtstraße kommen und ihr nach rechts folgen. Antwort und Erklärung eindeutig formuliert (Fahrzeug von links, das nach links verlässt, muss rechts vor links beachten).
- own-verkehrsregelung-028, 029, 034: Nummern innerhalb von § 37 Abs. 2 StVO entfernt (nicht sicher zutreffend), bei 029 § 51 BOStrab ergänzt.
- own-geschwindigkeit-022: "fast unverminderte Geschwindigkeit" durch den nachgerechneten Wert "etwa 40 km/h" ersetzt (nach 25 m sind 15 m Reaktionsweg und 10 m von 25 m Bremsweg zurückgelegt).
- own-andere_teilnehmer-020: Rechtsquelle um § 20 Abs. 2 StVO (Überholverbot bei Annäherung mit Warnblinklicht) ergänzt.
- own-fahrmanoever-017: Vor Bahnübergängen dürfen Kraftfahrzeuge vom Gefahrzeichen an nicht überholen (§ 19 Abs. 1 StVO); die Einschränkung auf "mehrspurige" Fahrzeuge war falsch.
- own-verkehrszeichen-016: Zahlenwert an das Bild angepasst (Zeichen 262 zeigt 5,5 t); die Aussage zur tatsächlichen Masse bleibt.
- own-verkehrszeichen-017: Beispiel an das Bild angepasst (Zeichen 265 zeigt 3,8 m; Transporter 2,9 m, mit Ladung 3,9 m).
- own-verkehrszeichen-033: Bezeichnung des Zeichens auf 101-51 (Splitt, Schotter) korrigiert, passend zum Bild und zur heutigen StVO.
- own-verkehrszeichen-034: Fachlicher Fehler. Bei einer rechts verengten Fahrbahn muss, wer nach links ausweicht, nach § 6 StVO den Gegenverkehr durchfahren lassen; die Frage hatte diese Aussage als falsch markiert. Antworten und Erklärung neu gefasst.
- Bildzuordnungen entfernt, weil das Bild eine andere Situation zeigt: own-fahrmanoever-021 (Bild zeigt Sie als Linksabbieger, Frage betrifft Vorbeifahren an einem Linksabbieger), own-fahrmanoever-025 (Bild zeigt Radweg, Frage betrifft Straßenbahn), own-fahrmanoever-029 (Bild zeigt Hindernis auf Ihrer Seite, Frage beschreibt Hindernis auf der Gegenseite), own-fahrmanoever-035 (Bild zeigt Abbiegen voreinander, Frage betrifft hintereinander), own-kreisverkehr-019 (Bild zeigt Zebrastreifen, Frage sagt ausdrücklich ohne Zebrastreifen). Alle übrigen 120 Zuordnungen bestätigt; Vorfahrt und Verkehrszeichen haben weiterhin durchgehend Bilder.

### needs_verification

- own-gefahrenlehre-016: Bußgeldhöhe 100 Euro für die Handynutzung gegen die aktuelle BKatV prüfen.
- own-recht-021: Wortlaut von § 48a Abs. 3 FeV (Widerruf, Absehen vom Widerruf) und die Bußgeldregelung der BKatV prüfen.
- own-recht-034 und own-recht-035: Theoriestunden 12 plus 2 und Sonderfahrten 5/4/3 hängen von der geplanten Neufassung der FahrschAusbO ab (siehe offener Punkt 2 oben).
- own-andere_teilnehmer-017: Kernaussagen zur eKFV (Alkoholgrenzen, Versicherungsplakette, Mitnahmeverbot, Mindestalter 14) gegen die 2025 novellierte Fassung prüfen (siehe offener Punkt 5 oben).

Ausdrücklich bestätigt wurden unter anderem: alle Faustformeln (40, 56, 60, 64, 36, 80, 18, 9, 65 m; 130 m bei 100 km/h), Klasse B mit Anhänger (3.500 kg, B96 4.250 kg, BE), Probezeit-Stufensystem, Punktesystem und Tilgungsfristen 2,5/5/10 Jahre, Fahreignungsseminar (1 Punkt, alle 5 Jahre, bis 5 Punkte), Sehtest 0,7 und zwei Jahre, Erste Hilfe 9 Einheiten, Prüfung 30 Fragen und Fehlerpunktregel, Rettungsgasse, § 7 Abs. 3c StVO (mittlerer Fahrstreifen), Kraftfahrstraße und Zeichen 223.1 bis 223.3, Baken 300/200/100 m und 240/160/80 m, Leitpfosten 50 m, Ampelrangfolge, qualifizierter Rotlichtverstoß ab 1 s, Grünpfeil 720/721, Fahrverbotsschwellen 31/41 km/h und A-Verstoß ab 21 km/h, Nässe als Wasserfilm, Schneeketten 50 km/h, Nebelschlussleuchte 50 m/50 km/h, Überholabstand 1,5 m und 2 m, Zeichen 277.1, E-Scooter 20 km/h, S-Pedelec, Bus mit Warnblinklicht (§ 20), Kreisverkehrregeln (§ 8 Abs. 1a, § 9a), Zeichen 253, 262 bis 265, Zonenzeichen, Parkscheibe (halbe Stunde nach Ankunft), werktags inkl. Samstag, Zeichen 306 außerorts Parkverbot, Zeichen 357-50, 201-52, 211/214/222, 251, 282, 385.

Testergebnis: `pnpm test` und `pnpm typecheck` im Paket content nach den Änderungen grün (siehe Abschlussbericht). Nicht committet.

## Nachprüfung Fragen Gruppe B, Teil 2 (September 2026)

Geprüft wurden own-befoerderung-011 bis 040 und own-fahrphysik-011 bis 040 (Rechtsstand September 2026) sowie die zugehörigen Bildzuordnungen in media.extra.b.ts. Alle Faustformel-Aufgaben wurden nachgerechnet.

| Thema | geprüft | korrigiert | needs_verification | entfernt |
|---|---|---|---|---|
| befoerderung 011 bis 040 | 30 | 1 | 1 (bereits vorhanden, own-befoerderung-033) | 0 |
| fahrphysik 011 bis 040 | 30 | 1 | 0 | 0 |
| Bildzuordnungen Beförderung und Fahrphysik | 12 | 0 | 0 | 1 |

### Korrekturen

- own-befoerderung-030: Die Befreiung von der Gurtpflicht aus gesundheitlichen Gründen ist eine Ausnahmegenehmigung der Straßenverkehrsbehörde nach § 46 Abs. 1 Nr. 5b StVO, die auf einer ärztlichen Bescheinigung beruht; die ärztliche Bescheinigung allein befreit nicht. Antwort und Erklärung entsprechend präzisiert, Bescheinigung ist mitzuführen.
- own-fahrphysik-022: Formulierung zur Profiltiefe präzisiert (Wasserverdrängung nimmt unter etwa 3 mm spürbar ab, nicht "ab 3 mm").

### needs_verification

- own-befoerderung-033 (Ausnahme § 21 Abs. 1a Satz 2 Nr. 2 StVO für ein drittes Kind ab drei Jahren auf dem Rücksitz) trug die Markierung bereits; der Inhalt entspricht dem Gesetzeswortlaut, Markierung belassen. Keine neuen Fälle.

### Bildzuordnungen

- Entfernt: own-befoerderung-025 (Bild Zeichen 265 zeigt 3,8 m, die Frage nennt 2,5 m und einen Pkw mit Dachbox von 2,6 m; keine Bildpflicht in diesem Thema).
- Bestätigt: own-befoerderung-023 (253), own-befoerderung-024 (1010-59), own-fahrphysik-011, 012, 013, 014, 018, 039, 040 (anhalteweg-schema), own-fahrphysik-032 (117-10), own-fahrphysik-038 (108-10).
- Die übrigen 36 Zuordnungen der Themen Halten und Parken, besondere Situationen, Unfall und Panne, Umwelt, Fahrzeugtechnik und Beleuchtung gehören zu Teil 1 und wurden hier nicht verändert.

### Ausdrücklich bestätigt

Zuladung 550 kg, Klasse B mit Anhänger (1.200 kg bei 2.300 kg Zugfahrzeug, 3.400 kg Kombination, B96 bis 4.250 kg, BE), Stützlast 4 Prozent und 25 kg Deckel, Gespann 80 km/h und Tempo 100 Voraussetzungen, Zeichen 253 mit Pkw-Ausnahme, Zusatzzeichen 1010-59 und 1024-11, Ladung 2,55 m, 4 m, 1,5 m und 3 m bis 100 km, Kennzeichnung ab 1 m, seitlich ab 40 cm, nach vorn ab 2,5 m Höhe bis 50 cm, Gurtausnahmen, Personen in Wohnanhängern und auf Ladeflächen, Kindersitzregeln, Faustformeln (88, 36, 36, 72, 16, 9, 15/30 und 25/100, 80 m), Fliehkraft quadratisch, Kammscher Kreis, Haft- und Gleitreibung, Aquaplaning, ABS, ASR, ESP, Pendeln, Seitenwind, Reifendruck, Bremsassistent, Bewegungsenergie.

Testergebnis: `pnpm test` (19 Tests) und `pnpm typecheck` im Paket content grün. Nicht committet.

## Nachprüfung Fragen Gruppe B, Teil 1 (September 2026)

Geprüft wurden die neuen Fragen der Themen Halten und Parken, besondere Situationen, Unfall und Panne, Umwelt, Alkohol und Drogen, Fahrzeugtechnik und Beleuchtung (Rechtsstand September 2026). Alle numerischen Aufgaben wurden nachgerechnet.

| Thema | geprüft | korrigiert | needs_verification | entfernt |
|---|---|---|---|---|
| halten_parken 013 bis 042 | 30 | 2 | 0 | 0 |
| besondere_situationen 011 bis 040 | 30 | 3 | 1 | 0 |
| unfall_panne 012 bis 041 | 30 | 0 | 1 | 0 |
| umwelt 011 bis 040 | 30 | 1 | 0 | 0 |
| alkohol_drogen 012 bis 041 | 30 | 0 | 1 | 0 |
| fahrzeugtechnik 011 bis 040 | 30 | 0 | 0 | 0 |
| beleuchtung 010 bis 039 | 30 | 0 | 0 | 0 |

### Korrekturen

- own-halten_parken-023: Die Frage kombinierte die Parkscheibenregel mit einem Zeitfenster (werktags 8 bis 18 Uhr) und einer Ankunft um 17:20 Uhr. Nach 18 Uhr gilt keine Beschränkung mehr, sodass "bis 19:30 Uhr" nicht die einzig vertretbare Antwort war. Zeitfenster entfernt; die Frage prüft jetzt nur noch die Einstellung auf die folgende halbe Stunde (17:30 Uhr) und die Höchstparkdauer (bis 19:30 Uhr) nach § 13 Abs. 2 StVO.
- own-halten_parken-040: Erklärung präzisiert. Statt "Das gilt nicht auf Autobahnen und Kraftfahrstraßen" jetzt "Auf Autobahnen und Kraftfahrstraßen ist das Halten ohnehin verboten", damit nicht der Eindruck entsteht, dort dürfe auf der Fahrbahn gehalten werden.
- own-besondere_situationen-018: Die als richtig markierte Antwort "Rechts darf nicht vorbeigefahren werden, solange Fahrgäste ein- oder aussteigen" widersprach § 20 Abs. 2 StVO. Danach darf rechts mit Schrittgeschwindigkeit und ausreichendem Abstand vorbeigefahren werden; Fahrgäste dürfen nicht behindert werden, wenn nötig ist zu warten. Antworten und Erklärung an den Gesetzeswortlaut angepasst.
- own-besondere_situationen-019: Die Erklärung gab § 11 Abs. 1 StVO so wieder, als nenne er Bahnübergänge. Die Vorschrift betrifft Kreuzungen und Einmündungen; das Halteverbot auf Bahnübergängen folgt aus § 12 Abs. 1 Nr. 4 StVO. Erklärung und legalReference angepasst, Antworten unverändert.
- own-besondere_situationen-032: Die Antwort nannte ein "abgeschlepptes Fahrzeug" als Anwendungsfall für Blaulicht ohne Einsatzhorn. § 38 Abs. 2 StVO nennt Unfall- und Einsatzstellen sowie die Begleitung von Fahrzeugen und geschlossenen Verbänden. Formulierung auf "begleiteter Schwertransport" geändert.
- own-umwelt-013: Antwort "Unnützes Hin- und Herfahren innerhalb geschlossener Ortschaften" um den Zusatz "wenn andere dadurch belästigt werden" ergänzt (Wortlaut § 30 Abs. 1 Satz 3 StVO).

### needs_verification

- own-besondere_situationen-029: Ob bei Zeichen 264 (tatsächliche Breite) die Außenspiegel mitzählen, ist nicht abschließend geklärt; die Frage behandelt Spiegel als Teil der tatsächlichen Breite. Fachliche Bestätigung nötig.
- own-unfall_panne-014: Die Strafmilderung nach § 142 Abs. 4 StGB (Meldung innerhalb von 24 Stunden bei nicht bedeutendem Sachschaden außerhalb des fließenden Verkehrs) entspricht dem geltenden Wortlaut. Eine Reform der Unfallflucht bei reinem Sachschaden wurde politisch diskutiert; der Stand ist zu prüfen.
- own-alkohol_drogen-031: Mischkonsum Cannabis und Alkohol (§ 24a Abs. 1a StVG, höheres Bußgeld nach BKatV). Inhalt entspricht der Rechtslage seit August 2024, Bußgeldhöhe und Detailwortlaut wie bei own-alkohol_drogen-007 zu bestätigen.

### Ausdrücklich bestätigt

Halten und Parken: Panne kein Halten, Zeichen 286 mit Be- und Entladen, 5 m vor Fußgängerüberweg, 10 m vor Lichtzeichen bei Verdeckung, 2,8 t Gehwegparken, Anhänger 2 Wochen, Parklückenvorrang, Halteverbote auf Ein- und Ausfädelungsstreifen, Autobahn und Feuerwehrzufahrten, Vorfahrtstraße außerorts, defekter Parkscheinautomat, Einbahnstraße links, 7,5 t und 2 t Nachtparkverbot, Taxen in zweiter Reihe, 8 m bei baulichem Radweg und Ausfahrt gegenüber, verkehrsberuhigter Bereich, Zone 290.1, Bewohnerparken, E-Kennzeichen, Sperrfläche und Zickzacklinie, Taxenstand, Radverkehrsanlagen, Bordsteinabsenkung und Schachtdeckel, § 14 StVO, Haltestelle 15 m, Parkscheibe, Seitenstreifen, platzsparend, Samstag als Werktag.
Besondere Situationen: 50 km/h unter 50 m Sicht, Leitpfosten 50 m, Tunnelbrand und Stau, Busse mit Warnblinklicht (§ 20 Abs. 3 und 4), Bahnübergang und Rotlicht, Gefälle, Winter, Zeichen 268 mit 50 km/h, Falschfahrer, nasse Bremsen, Aquaplaning, Seitenwind, gelbe Markierungen, Ölspur, Blendung, gelbes Blinklicht, Erntezeit, Kuppe, Rettungsgasse, Gewitter, Glätte, Wild, Zeichen 128.
Unfall und Panne: § 34 StVO Pflichten, Wildunfall, § 15a StVO Abschleppen, Starthilfe, Radwechsel, Überhitzung, 30 zu 2, AED, Druckverband, Schock, Rettungsgriff, Helm, Verbrennung, 112 und eCall, Warndreieck vor der Kurve, Reihenfolge auf der Autobahn, Warnweste EN ISO 20471, DIN 13164, Schuldanerkenntnis, § 201a StGB, Airbag, Hochvolt, 9 Unterrichtseinheiten Erste Hilfe, Zeichen 328, § 15 Abs. 1 StVO.
Umwelt: 7,5 t und 0 bis 22 Uhr, § 30 Abs. 1 StVO, Umweltzone und Plakette, Luftwiderstand, Start-Stopp, Reifenlabel, Kaltstart, Fahrzeugwäsche, Entsorgung mit Batteriepfand, Reifendruck, Rauchfarben, Tanken, Rekuperation, Gangwahl, Hupe, Klimaanlage, 6 l/100 km, 40 l, Zeichen 253 mit Zeitzusatz.
Alkohol und Drogen: 500 Euro, 1 Monat, 2 Punkte; 1,1 Promille Straftat mit Sperrfrist; Probezeit 0,2 Promille mit Aufbauseminar und Verlängerung; 0,25 mg/l; Atemtest freiwillig, Blutentnahme § 81a StPO; E-Tretroller und Mofa als Kraftfahrzeuge; Kokain ohne Wirkungsgrenzwert; THC 3,5 ng/ml; Arzneimittelausnahme § 24a Abs. 2 Satz 3 StVG; Restalkohol 0,4 Promille; Radfahrer 1,6 Promille mit MPU; Wiederholung 3 Monate; 0,8 Promille mit Unfall; Versicherungsregress; MPU ab 1,6; Halterverantwortung; § 24c Cannabis; Anlage 4 FeV; 8 Stunden Abbau.
Fahrzeugtechnik: 205 mm, 16 Zoll, Geschwindigkeitsindex T 190, H 210, V 240, W 270 mit Hinweisschild bei Winterreifen, HU über 8 Monate mit Punkt und 36 Monate Erstfrist, Kontrollleuchten, Zweikreisbremse, Reifendruck, einseitiger Verschleiß, § 19 StVZO, Halterpflichten, § 13 FZV, Saisonkennzeichen, Abfahrtkontrolle, Ölüberfüllung, Kühlmittel, AVAS, Servolenkung, Abgasanlage, Sitzposition, Reifenalter, Frostschutz, Verschleißanzeiger 1,6 mm, Batterie, Winterreifenpflicht mit Bußgeld und Punkt.
Beleuchtung: Nebelschlussleuchte 50 m und 50 km/h, Lichtautomatik, Fernlichtassistent, defekter Scheinwerfer, Parkleuchte innerorts, Nebelscheinwerfer nur bei erheblicher Sichtbehinderung, Abblendpflichten § 17 Abs. 2, Warnblinklicht, Lichtfarben, Lichthupe innerorts nur als Warnung, Dämmerung, Nachtsicht, Zug außerorts, Bremsleuchten, Krafträder am Tag, Fernlicht innerorts auf unbeleuchteter Straße, Blaulicht und gelbes Blinklicht, Leuchtweite, Tunnel Zeichen 327, Kontrollleuchte gelb, Ersatzlampen nicht vorgeschrieben, Sichtweite mit Abblendlicht, Rückfahrscheinwerfer.

Testergebnis: `pnpm test` und `pnpm typecheck` im Paket content grün. Nicht committet.

## Abnahme durch die Fahrlehrerin (ab 20. September 2026)

Die offenen Punkte dieser Datei (10 Fragen mit Verifikationskennzeichnung, 1 Wissenseintrag, 1 Vorfahrt-Situation, 25 korrigierte Fragen zur Bestätigung, 11 Grundsatzfragen) sind als Prüfseite aufbereitet: `pnpm --filter @fahrpilot/content abnahme` erzeugt `packages/content/review/abnahme.html`. Die Seite läuft ohne Server, jede Bewertung (Richtig so, Ändern, Unsicher) mit Kommentar wird im Browser gespeichert und lässt sich als Text kopieren. Rückmeldungen werden in die Inhalte eingearbeitet; nach Freigabe wird `reviewStatus` der betroffenen Elemente auf `published` gesetzt und der Seed erneut ausgeführt.
