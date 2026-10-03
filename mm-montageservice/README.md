# MM Montageservice – Website

Statische Website (HTML/CSS/JS, kein Build-Schritt). Gleiche Architektur wie torpro-zugangstechnik.de.

## Seiten
| Datei | Inhalt |
|---|---|
| `index.html` | Startseite: Diashow, Leistungen, Ablauf, Referenzen, Standortkarte, FAQ |
| `leistungen.html` | Sektionaltore, Haustüren, Demontage & Entsorgung, Gerüstbau, Antriebe, Reparatur, Fachhandel |
| `referenzen.html` | Fotogalerie + Liste „Zuletzt montiert" + Einsatzgebiet-Karte |
| `ueber-uns.html` | Über den Betrieb, Ablauf, Zielgruppen |
| `kontakt.html` | Kontaktdaten, Kontaktformular, Standortkarte |
| `anfrage.html` | Montage-Anfrage (Tor, Tür, Gerüst) mit Maßen und Einbausituation |
| `impressum.html`, `datenschutz.html` | Rechtliches (Daten aus der Rechnung übernommen) |

## Daten pflegen – nur `assets/js/config.js`
- **Firmendaten** (Telefon, E-Mail, Adresse, Öffnungszeiten) stehen einmal in `config.js` und werden auf allen Seiten eingesetzt.
- **Eigene Fotos**: Bilder als `assets/img/referenzen/ref-01.jpg` … ablegen (Querformat, mind. 1600 px breit). Sobald mindestens drei eigene Fotos da sind, zeigt die Diashow nur noch diese. Die KI-Symbolbilder unter `assets/img/stock/` können dann gelöscht werden.
- **Zuletzt montiert**: Liste `jobs` – Ort + Leistung, keine Kundennamen.
- **Kundenstimmen**: Liste `reviews` – nur echte Bewertungen mit Einverständnis des Kunden eintragen. Solange die Liste leer ist, bleibt der Abschnitt automatisch ausgeblendet. Erfundene Bewertungen sind nach § 5a UWG wettbewerbswidrig und abmahnfähig.
- **Formulare**: öffnen standardmäßig das E-Mail-Programm (mailto). Für echten Versand ohne E-Mail-Programm einen Webhook (z. B. Formspree) in `requestWebhook` eintragen.

## Veröffentlichen
Ordner `mm-montageservice/` z. B. bei Netlify als Site anlegen (Publish directory = dieser Ordner, kein Build-Befehl) und die Domain `mm-montageservice.de` verbinden. Die Domain zeigt derzeit per Frameset auf hexapolska.pl – das muss beim Domain-Anbieter umgestellt werden.

## Vor dem Livegang prüfen
- Steuernummer, Kleinunternehmer-Status (§ 19 UStG) und Schreibweise der Straße im Impressum
- Hosting-Anbieter in der Datenschutzerklärung (aktuell: Netlify)
