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
