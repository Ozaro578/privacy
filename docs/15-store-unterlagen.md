# Store-Unterlagen (App Store und Google Play)

Stand: 20. September 2026. Arbeitstitel "FahrPilot"; sobald der endgültige Name feststeht, alle Vorkommen ersetzen (`app.json`, Web-Titel, Nutzungsbedingungen, dieses Dokument). Alle Aussagen unten sind nur mit dem Funktionsumfang belegt, der im Repo umgesetzt ist; nichts versprechen, was die Lizenzlage (amtlicher Katalog) noch nicht hergibt.

## Kurzbeschreibung (Untertitel, maximal 30 Zeichen Apple)

Theorie lernen mit Plan

## Werbetext (Promotional Text Apple, bis 170 Zeichen)

Lernen, das sich anpasst: fünf Stufen, Vorfahrt-Trainer, alle Verkehrszeichen, Prüfungsreife als Zahl. Für Fahrschüler mit und ohne Fahrschule.

## Beschreibung (bis 4.000 Zeichen)

FahrPilot bereitet dich auf die theoretische Führerscheinprüfung Klasse B vor und passt sich dabei an dich an. Statt Fragebögen stur zu wiederholen, lernst du in fünf Stufen von leicht bis Prüfungsniveau, wiederholst genau das, was du noch nicht sicher kannst, und siehst jederzeit, wie prüfungsreif du bist.

Was dich erwartet:

- Über 1.100 Übungsfragen in 19 Themen, davon 400 zu allen Verkehrszeichen der StVO, mit Erklärung, Merksatz und Rechtsgrundlage zu jeder Frage.
- Stufen-Modus: Die App schaltet hoch, sobald du eine Stufe beherrschst, und mischt fällige Wiederholungen dazu.
- Vorfahrt-Trainer: Über 30 Kreuzungssituationen in Draufsicht. Tippe die Fahrzeuge in der richtigen Reihenfolge an.
- Verkehrszeichen-Trainer und Katalog mit allen 400 Zeichen aus Gefahr-, Vorschrift-, Richtzeichen, Verkehrseinrichtungen und Zusatzzeichen.
- Prüfungssimulation nach den Regeln der echten Prüfung: 30 Fragen, Fehlerpunkte, Zeit, Auswertung mit Fehleranalyse.
- Prüfungsreife von 0 bis 100 mit den Faktoren, die dahinterstehen, und einem Lernplan bis zu deinem Prüfungstermin.
- Tages-Challenge, Serie, Abzeichen und eine freiwillige Wochen-Bestenliste mit deiner Fahrschule.
- Vorlesen jeder Frage, sechs Farbwelten, Dunkelmodus, größere Schrift, weniger Bewegung.
- Offline lernen: Fragen und Bilder sind auf dem Gerät, dein Fortschritt wird später abgeglichen.

Mit Fahrschule: Wenn deine Fahrschule FahrPilot nutzt, siehst du zusätzlich Fahrstunden, Termine, Dokumente, Rechnungen und Nachrichten deiner Fahrschule. Dein Fahrlehrer sieht deinen Lernstand und kann dir gezielt Themen empfehlen. Ohne Fahrschule lernst du im Selbstlern-Modus und kannst dich später jederzeit mit dem Code deiner Fahrschule verbinden; dein Lernstand bleibt erhalten.

Wichtig: Die Übungsfragen sind eigene Inhalte und kein amtlicher Prüfungsinhalt. Rechtsstand der Inhalte: September 2026, fachlich geprüft von einer Fahrlehrerin. Inhalte, die noch in Prüfung sind, sind in der App gekennzeichnet.

## Stichwörter (Apple, bis 100 Zeichen, mit Komma)

Führerschein,Theorie,Fahrschule,Klasse B,Prüfung,Verkehrszeichen,Vorfahrt,lernen,Fahrschüler,Theorieprüfung

## Kategorie

Apple: Bildung (sekundär: Navigation ist falsch, nichts Sekundäres nötig). Google Play: Bildung. Altersfreigabe: 4+ (Apple) bzw. USK 0 / PEGI 3 über den Fragebogen (keine Gewalt, keine Käufe im Spiel außer dem Kauf der App selbst, keine nutzergenerierten öffentlichen Inhalte).

## Preis und Monetarisierung

Kauf-App (einmalig, geplant 3,99 Euro) für den Selbstlern-Modus. Fahrschüler von Partner-Fahrschulen bekommen die App über ihre Fahrschule (Vertrag Fahrschule und Plattform). Bei einem späteren Wechsel zu Abo oder In-App-Kauf müssen StoreKit und Google Play Billing eingebaut werden; heute enthält die App keine In-App-Käufe.

## Datenschutz-Angaben Apple ("App Privacy", Nutrition Labels)

Grundlage: `datenschutz`-Seite der Web-App und die tatsächlich verarbeiteten Daten. Tracking im Sinne von Apple (Weitergabe an Dritte für Werbung) findet nicht statt; kein Werbe-SDK, kein Analytics-SDK von Dritten in der App.

| Datenkategorie | Erhoben | Mit dem Nutzer verknüpft | Zweck |
|---|---|---|---|
| Kontaktdaten (Name, E-Mail) | Ja | Ja | App-Funktionalität (Konto), Kommunikation mit der Fahrschule |
| Geburtsdatum | Ja | Ja | App-Funktionalität (Mindestalter, Ausbildungsklasse, BF17) |
| Nutzerinhalte (Fotos von Dokumenten, Nachrichten an die Fahrschule) | Ja, nur mit Fahrschule | Ja | App-Funktionalität |
| Nutzungsdaten (beantwortete Fragen, Antwortzeiten, Lernfortschritt) | Ja | Ja | App-Funktionalität (adaptives Lernen), Analyse nur innerhalb der App |
| Finanzdaten (Rechnungen, Zahlungsstatus) | Ja, nur mit Fahrschule | Ja | App-Funktionalität; Zahlungsdaten liegen beim Zahlungsanbieter |
| Kennungen (Geräte-Push-Token) | Ja, nur bei aktivierten Benachrichtigungen | Ja | App-Funktionalität (Erinnerungen) |
| Diagnose (Fehlerberichte) | Ja, ohne Namen | Nein | App-Funktionalität (Fehlerbehebung) |
| Standort, Gesundheit, Browserverlauf, Kontakte, Suchverlauf | Nein | | |

Berechtigungen und ihre Begründungen stehen in `app.json` (Kamera für QR-Check-in und Dokumentfotos, Fotos für Dokument-Upload, Benachrichtigungen). Es gibt keinen Zugriff auf Standort oder Kontakte.

## Google Play "Datensicherheit"

Gleiche Angaben wie oben. Zusätzlich: Daten werden verschlüsselt übertragen (TLS), Nutzer können die Löschung des Kontos in der App beantragen (Profil, Datenschutzanfragen), Daten werden nach Ende der Ausbildung gemäß Aufbewahrungsregeln gelöscht. Kein Verkauf von Daten, keine Weitergabe an Dritte außer Auftragsverarbeitern (Hosting in der EU, Push-Dienst, Zahlungsanbieter, KI-Anbieter ohne Namen und Kontaktdaten).

## Screenshots (je Gerät 6 Stück, Reihenfolge)

1. Heute-Ansicht mit Prüfungsreife und Tages-Challenge.
2. Lernsession mit Situationsgrafik und Erklärung nach der Antwort.
3. Vorfahrt-Trainer (Reihenfolge antippen).
4. Verkehrszeichen-Katalog mit Suche.
5. Prüfungssimulation mit Auswertung.
6. Farbwelten und Dunkelmodus.

Geräte: iPhone 6,7 Zoll und 6,5 Zoll, iPad 12,9 Zoll (Apple verlangt iPad-Screenshots nur, wenn iPad unterstützt wird; `supportsTablet` in `app.json` prüfen), Android Telefon und 7-Zoll-Tablet. Die Screenshots werden aus TestFlight- bzw. Preview-Builds aufgenommen; keine Montagen mit Funktionen, die es nicht gibt.

## Pflichtangaben und Links

- Datenschutzerklärung: `<Web-Domain>/datenschutz` (Betreiberangaben und Datenschutzbeauftragter vor Einreichung eintragen).
- Nutzungsbedingungen: `<Web-Domain>/nutzungsbedingungen` (anwaltlich prüfen lassen).
- Support-URL und Support-E-Mail: festlegen; Apple prüft, ob die Adresse erreichbar ist.
- Impressum (§ 5 DDG) auf der Web-Domain: Route `/impressum` liest die Betreiberangaben aus Umgebungsvariablen (`NEXT_PUBLIC_OPERATOR_*`, siehe `.env.example`) und zeigt bis dahin einen Hinweis.
- Demo-Konto für die App-Prüfung durch Apple und Google: Ein Testkonto im Selbstlern-Mandanten anlegen und in den Review-Notizen angeben, damit die Prüfer die Lernfunktionen sehen können.

## Was vor der Einreichung noch offen ist

- Endgültiger Name und Bundle-Identifier (siehe `14-testflight.md`).
- App-Icon liegt vor (`apps/mobile/assets/icon.png`, Straße mit Mittelstreifen in der Farbwelt Klar; Quelle `icon.svg`), ebenso Adaptive Icon und Splash. Bei Namenswechsel eventuell neu gestalten. Feature-Grafik für Google Play (1024 mal 500) fehlt noch.
- Betreiberangaben in Datenschutzerklärung, Nutzungsbedingungen, Impressum.
- Entscheidung, ob Fahrschul-Funktionen (Termine, Rechnungen) in der Store-Beschreibung beworben werden, solange noch keine Fahrschule live ist.
