# MM Trockenbau – Website

Statische Website (HTML/CSS/JS, kein Build-Schritt). Gleicher Aufbau wie `mm-montageservice/` und torpro-zugangstechnik.de.

## Vor dem Livegang – Pflicht
1. **Firmendaten** stehen in `assets/js/config.js` (Inhaber, Anschrift, Telefon, Steuernummer, Kleinunternehmer – wie MM Montageservice, vom Inhaber bestätigt) und erscheinen automatisch auf allen Seiten, im Impressum und in der Datenschutzerklärung. E-Mail info@mm-trockenbau.de muss beim Provider existieren.
2. **Logo** als `assets/img/logo.png` (mit Subline) und `assets/img/logo-trans.png` (freigestellt, für den Header) ablegen. Solange die Dateien fehlen, zeigt die Seite eine automatisch erzeugte SVG-Wortmarke im gleichen Farbschema.
3. **Favicon** als `assets/img/favicon.png` (128×128) ablegen.
4. **Fotos**: eigene Baustellenfotos als `assets/img/referenzen/ref-01.jpg` … (Querformat, mind. 1600 px). Ohne Fotos zeigt die Startseite einen dunklen Verlauf mit Logo.
5. **Referenzliste** `jobs` in `config.js` durch echte Projekte ersetzen (Ort + Leistung, keine Kundennamen).

## Kundenstimmen
Liste `reviews` in `config.js` – nur echte Bewertungen mit Einverständnis des Kunden. Solange leer, bleibt der Abschnitt ausgeblendet. Erfundene Bewertungen sind nach § 5a UWG wettbewerbswidrig und abmahnfähig.

## Seiten
`index.html`, `leistungen.html`, `referenzen.html`, `ueber-uns.html`, `kontakt.html`, `anfrage.html` (Projekt-Anfrage mit Leistungen, Fläche, Q-Stufe), `impressum.html`, `datenschutz.html`.

## Formulare
Öffnen standardmäßig das E-Mail-Programm (mailto). Für Versand ohne E-Mail-Programm einen Webhook (z. B. Formspree) in `requestWebhook` eintragen.
