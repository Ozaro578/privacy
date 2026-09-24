# ZUKKABRO – Webseite, Händlerportal und Buchhaltung

Snacks • Drinks • Vapes • More. Nur für Erwachsene ab 18 Jahren.

Läuft auf Netlify (Projekt `zukkabro`). Die ganze Seite ist zurzeit per Passwort geschützt und nur für das Team erreichbar.

## Aufbau

| Ordner / Datei | Inhalt |
|---|---|
| `public/` | Die Webseite (wird veröffentlicht) |
| `public/index.html` | Startseite |
| `public/sortiment.html` | Ganzes Sortiment mit Suche und Filtern |
| `public/vapes.html` | Vapes & Zubehör (18+) |
| `public/produkt.html` | Produktseite mit Bildergalerie, Menge und Warenkorb |
| `public/pakete.html`, `public/paket.html` | Themen-Pakete (Netflix Night, Gamer Paket, …) |
| `public/warenkorb.html` | Warenkorb und Kasse |
| `public/ueber-uns.html`, `public/kontakt.html` | Über uns, Kontakt |
| `public/haendler/` | Händlerportal: Registrierung, Login, Großbestellungen |
| `public/admin/` | Admin-Bereich: Bestellungen, Händler, Händlerpreise, Buchhaltung, Bestand |
| `public/rechtliches.html` | Impressum und Datenschutz (Vorlage, gelbe Stellen ausfüllen!) |
| `public/assets/js/shop.js` | **Eure Angaben:** Kontaktdaten und Bestseller |
| `public/assets/js/produkte.js` | Sortiment, automatisch vom Großhändler erzeugt |
| `public/assets/js/layout.js` | Menü, Fußzeile, Altersabfrage für alle Seiten |
| `netlify/functions/api/` | Server: Login, Händler, Bestellungen, Buchhaltung |
| `netlify/edge-functions/zugangsschutz.ts` | Passwortschutz für die ganze Seite |

## Zugänge (Netlify-Umgebungsvariablen)

| Variable | Zweck |
|---|---|
| `SITE_PASSWORD` | Passwort für die ganze Seite (Benutzername beliebig). Löschen = Seite öffentlich. |
| `ADMIN_USERS` | Admin-Konten, Format `name=scrypt$…;name2=scrypt$…` (nur Hashes, keine Klartext-Passwörter) |
| `SESSION_SECRET` | Geheimer Schlüssel für Anmelde-Cookies. Ändern = alle werden abgemeldet. |

Neues Admin-Passwort erzeugen: Claude fragen oder mit Node die Funktion `hashPasswort` aus `netlify/functions/api/sicherheit.mts` nutzen.

## Sortiment aktualisieren

```
python3 werkzeuge/zukkabro_produkte_import.py
```

Holt Kategorien, Produkte und Bilder neu vom Großhändler, ohne Preise.
Eure Preise und Kontaktdaten in `shop.js` bleiben erhalten.
Artikel mit dem Hinweis „Rechtlich prüfen“ (CBD-Blüten, SHEESH BUDZ, Erotik) vor dem öffentlichen Start prüfen oder entfernen.

## Shop, Preise und Pakete

- **Shop-Preise** (brutto) und **Händlerpreise** (netto) im Admin-Bereich unter „Preise“ eintragen.
  Ohne Shop-Preis steht „Preis folgt“ und der Artikel ist nicht kaufbar.
- **Versand, Abholung, Bankverbindung, PayPal** unter „Shop-Einstellungen“.
- **Pakete** unter „Pakete“: Name, Untertitel, Emoji, Farbe, Inhalt, Preis. Start-Pakete sind schon angelegt.
- Kundenbestellungen erscheinen unter „Bestellungen“ (🛒 Kunde). Bezahlung per Überweisung, PayPal-Link oder bar bei Abholung.
- Bei Artikeln ab 18 fragt die Kasse das Geburtsdatum ab und lehnt Minderjährige ab. Bei Übergabe trotzdem Ausweis prüfen!

## Händlerportal

1. Händler registrieren sich unter `/haendler/`.
2. Im Admin-Bereich unter „Händler“ freischalten.
3. Unter „Händlerpreise“ Netto-Stückpreis, VE (Stück pro Karton) und Mindestmenge eintragen. Nur Produkte mit Preis sind für Händler bestellbar.
4. Bestellungen erscheinen unter „Bestellungen“. Status pflegen und mit „In Buchhaltung übernehmen“ als Verkauf buchen.
5. Für Artikel ohne Händlerpreis schicken Händler eine **Preisanfrage** mit Wunschmenge. Sie erscheint unter „Bestellungen“ (💬 Preisanfrage).

## Buchhaltung

- Verkäufe, Wareneinkäufe, Ausgaben und Einnahmen unter „Buchhaltung“ erfassen.
- Buchungen können nicht gelöscht, nur storniert werden.
- CSV-Export (Excel) für Journal und Bestand, zum Beispiel für die Steuerberatung.
- Die Auswertung ist eine interne Übersicht und ersetzt keine Buchhaltungssoftware.

## Lokal testen

```
npm install
node --experimental-transform-types netlify/functions/api/test-lokal.mts
```

## Eure Grafiken

Bilder mit genau diesen Namen nach `public/assets/img/` hochladen. Fehlt ein Bild, zeigt die Seite eine nachgebaute Version:
`logo.png`, `logo-klein.png`, `icon.png`, `hero.jpg`, `banner-candy.jpg`, `banner-snacks.jpg`, `banner-drinks.jpg`, `banner-vapes.jpg`,
`neu.jpg`, `bestseller.jpg`, `mystery-box.jpg`, `versand.jpg`, `badge-18.png`, `pattern.jpg`, `danke.jpg`, `404.jpg`.
