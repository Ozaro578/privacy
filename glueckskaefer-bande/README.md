# 🐞 Glückskäfer Bande – Website

Statische Website (HTML/CSS/JS, kein Build-Schritt) für die Kindertagespflege
**Glückskäfer Bande** in Ostfildern-Kemnat.

## Seiten

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite: Willkommen, Werte, Räume-Teaser, Zitat, Platz-Anfrage |
| `ueber-mich.html` | Yasemin: Qualifikation, Mutter von drei Kindern, familiäre Betreuung |
| `betreuung.html` | Kleine Gruppe, Bewegung & Entdecken, individuell, Elternzusammenarbeit |
| `raeume.html` | Bildergalerie der Bereiche + Beschreibung |
| `tagesablauf.html` | Tagesablauf als Zeitstrahl, Eingewöhnung (Anker `#eingewoehnung`) |
| `kontakt.html` | Betreuungszeiten, Kontaktdaten, Anfrageformular |
| `impressum.html`, `datenschutz.html` | Rechtliche Vorlagen (vor Veröffentlichung ausfüllen) |
| `404.html`, `sitemap.xml`, `robots.txt` | Technik/SEO |

Alle Seiten teilen `assets/style.css` (Farbwelt Creme · Salbei · Terracotta),
`assets/main.js` (mobile Navigation, sanftes Einblenden) und das Logo
`assets/logo.svg` / `assets/favicon.svg`. Vorschaubild für WhatsApp/Social:
`assets/og-image.png`.

## Vor dem Livegang ausfüllen

Suche nach `[` in den HTML-Dateien – alles in eckigen Klammern ist ein Platzhalter:

- **Betreuungszeiten** (`kontakt.html`, roter Kasten)
- **Nachname, Straße, Telefonnummer** (Footer aller Seiten, `kontakt.html`, `impressum.html`, `datenschutz.html`)
- **Qualifikation / Pflegeerlaubnis** (`ueber-mich.html`, `kontakt.html`, `impressum.html`)
- **Alter der Kinder** (`kontakt.html`)
- **Hosting-Anbieter** (`datenschutz.html`)
- E-Mail-Adresse `hallo@glueckskaefer-bande.de` an die echte Adresse anpassen
  (kommt in allen Seiten vor, einfach „Suchen & Ersetzen“)

Die Platzhalter sind auch in `BRIEFING.md` als Checkliste aufgeführt.

## Fotos einfügen

Die Bilder in `assets/img/*.svg` sind Platzhalter. Echte Fotos (JPG, Querformat 4:3,
ca. 1600 × 1200 px, am besten unter 300 KB) mit gleichem Namen ablegen und in den
HTML-Dateien die Endung `.svg` durch `.jpg` ersetzen:

| Datei | Motiv |
|---|---|
| `eingang` | Eingang / Außenbereich der Tagespflege |
| `kuschelecke` | Kuschelecke |
| `buecher` | Bücherbereich |
| `basteln` | Bastelbereich |
| `spielen` | Spielbereich |
| `garten` | Garten / draußen |
| `essen` | Essbereich |
| `bewegung` | Bewegungsbereich |
| `yasemin` | Porträt von Yasemin (Hochformat 3:4) |

Fotos von Kindern nur mit schriftlicher Einwilligung der Eltern veröffentlichen.

## Lokal ansehen

Einfach `index.html` im Browser öffnen oder:

```bash
cd glueckskaefer-bande && python3 -m http.server 8080
```

## Veröffentlichen

Der Ordner kann 1:1 auf jeden Webspace (IONOS, Strato, all-inkl …) hochgeladen
oder kostenlos über GitHub Pages / Netlify bereitgestellt werden. Die Domain
in `sitemap.xml`, `robots.txt` und den `<link rel="canonical">`-Tags ist auf
`www.glueckskaefer-bande.de` eingestellt – bei einer anderen Domain anpassen.

## Seiten neu generieren (optional)

Header, Footer und Navigation aller Seiten kommen aus `build.py`. Nach einer
Änderung dort einmal `python3 build.py` in diesem Ordner ausführen. Die Domain
für Canonical-Links, Sitemap und Vorschaubild steht oben in `build.py`
(`DOMAIN`) – aktuell die GitHub-Pages-Adresse, später die eigene Domain.
