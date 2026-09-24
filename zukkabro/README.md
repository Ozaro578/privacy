# ZUKKABRO – Webseite

Snacks • Drinks • Vapes • More. Nur für Erwachsene ab 18 Jahren.

Die Seite besteht nur aus HTML, CSS und JavaScript. Sie braucht keinen Server und keine Datenbank.
Sie läuft auf GitHub Pages, Netlify oder jedem normalen Webspace.

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite mit Altersabfrage, Kategorien, Produkten, Vapes 18+, Über uns und Kontakt |
| `rechtliches.html` | Vorlage für Impressum und Datenschutz. Gelb markierte Stellen ausfüllen! |
| `404.html` | Fehlerseite „Bro, hier gibt's nichts.“ |
| `assets/js/produkte.js` | **Hier tragt ihr Preise, Produkte und Kontaktdaten ein** |
| `assets/css/style.css` | Design und Farben |
| `assets/img/` | Logos und eure Grafiken |
| `assets/fonts/` | Schriften, lokal gespeichert und frei nutzbar (SIL Open Font License) |

## Preise und Produkte eintragen

Öffnet `assets/js/produkte.js`.

- `preis: null` zeigt „Preis auf Anfrage“.
- `preis: 2.5` zeigt „2,50 €“.
- Bei `SHOP` tragt ihr WhatsApp, Instagram, TikTok, E-Mail, Adresse und Öffnungszeiten ein.
  Sobald die WhatsApp-Nummer drin ist, öffnet jeder „Anfragen“-Knopf direkt einen WhatsApp-Chat mit dem Produktnamen.

## Eure Grafiken einbauen

Ladet die Bilder mit **genau diesen Dateinamen** in den Ordner `assets/img/` hoch.
Auf GitHub geht das über **Add file → Upload files**.
Fehlt ein Bild, zeigt die Seite automatisch eine nachgebaute Version im gleichen Stil.

| Dateiname | Was aus dem Brand-Sheet | Wo auf der Seite |
|---|---|---|
| `logo.png` | Hauptlogo (transparent) | Altersabfrage, Hero, Impressum |
| `logo-klein.png` | Logo-Variante / verkleinert | Header und Footer |
| `icon.png` | Icon / Favicon / App (ZB) | Über uns, Handy-Homescreen |
| `hero.jpg` | Website-Hero-Banner | Großes Banner ganz oben |
| `banner-candy.jpg` | Candy-Banner | Kategorien |
| `banner-snacks.jpg` | Snacks-Banner | Kategorien |
| `banner-drinks.jpg` | Drinks-Banner | Kategorien |
| `banner-vapes.jpg` | Vapes-Banner | Kategorien |
| `neu.jpg` | Neu eingetroffen | Aktionskacheln |
| `bestseller.jpg` | Bestseller | Aktionskacheln |
| `mystery-box.jpg` | Mystery Box | Aktionskacheln |
| `versand.jpg` | Schneller Versand | Aktionskacheln |
| `badge-18.png` | 18+ Badge | Altersabfrage, Vape-Bereich |
| `pattern.jpg` | Hintergrund / Pattern | Hintergrund von Hero und Produkten |
| `danke.jpg` | Dankeskarte | Kontakt-Bereich |
| `404.jpg` | 404-Seite | Fehlerseite |

Passende Seitenverhältnisse, damit nichts abgeschnitten wird:

- Hero: ungefähr 2,25 : 1, zum Beispiel 1800 × 800 Pixel
- Kategorie-Banner: ungefähr 1,9 : 1, zum Beispiel 1140 × 600 Pixel
- Aktionskacheln und 404: ungefähr 2,4 : 1, zum Beispiel 960 × 400 Pixel
- Icon und 18+ Badge: quadratisch, zum Beispiel 512 × 512 Pixel

Produktfotos kommen nach `assets/img/produkte/` und werden in `produkte.js` mit `bild: "assets/img/produkte/datei.jpg"` verknüpft.

Die Dateien `logo.svg`, `logo-quer.svg` und `icon.svg` sind nachgebaute Vektor-Logos.
Sie dienen als Ersatz, solange eure echten Logos fehlen. Bitte nicht löschen.

## Rechtliches vor dem Start

- Impressum und Datenschutz in `rechtliches.html` ausfüllen.
- E-Zigaretten und Liquids nur sachlich beschreiben, ohne Werbe-Slogans. Das verlangt das Tabakerzeugnisgesetz.
- Keine Abgabe an unter 18-Jährige, auch nicht bei nikotinfreien Produkten (§ 10 Jugendschutzgesetz).
- Beim Versand von 18+ Artikeln eine Altersprüfung bei der Zustellung nutzen, zum Beispiel den Alterssichtprüfungs-Service von DHL.
- Fremde Markenlogos wie Takis, Prime oder Monster in euren Bannern nur zeigen, wenn ihr diese Produkte auch wirklich verkauft.
