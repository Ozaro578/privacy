# Briefing & Übergabe – Glückskäfer Bande

## 1. Analyse der Vorlage

**Positionierung:** Kleine, familiäre Kindertagespflege zu Hause in
Ostfildern-Kemnat. Kernbotschaft: *„Kinder dürfen bei mir Kinder sein.“*
Tonalität: warm, persönlich, Du-Ansprache, bedürfnisorientiert.

**Inhaltliche Bausteine der Vorlage und ihre Zuordnung auf der Website:**

| Baustein der Vorlage | Seite |
|---|---|
| Willkommen, Claim „Klein. Familiär. Liebevoll.“ | Start (Hero) |
| Über mich (Yasemin, Mutter von drei Kindern) | Über mich |
| Meine Betreuung, Bewegung & Entdecken, Individuell | Betreuung |
| Zusammenarbeit mit den Eltern | Betreuung |
| Unsere Räumlichkeiten + Bildbereiche | Räume (Galerie) |
| Ein Tag bei der Glückskäfer Bande | Ein Tag bei uns (Zeitstrahl) |
| Eingewöhnung | Ein Tag bei uns (`#eingewoehnung`) |
| Meine Werte (8 Werte) | Start (Werte-Raster) |
| Familiär | Über mich |
| Betreuungszeiten, Freie Plätze, Kontakt | Kontakt |
| Zitat „Kinder sind wie kleine Sonnen…“ | Start + Kontakt |

**Design-Vorgaben (laut Wunsch):** nicht „Kita-bunt“, sondern Wohnzimmer-Wärme,
hochwertig, modern. Umgesetzt mit:

- Farben: Creme `#F8F4EC`, Salbeigrün `#8FA68C` / `#5F7A5E`, Terracotta `#C97B5B` / `#F0D5C7`
- Schriften: *Fraunces* (Überschriften, warm-serifig) + *Nunito* (Fließtext)
- Logo: Glückskäfer in Terracotta auf Salbei-Blatt (SVG, skalierbar, auch als Favicon)
- Durchgängig gleicher Header, Footer, Kartenstil und Abstände auf allen Seiten
- Emojis der Vorlage nur sparsam als Icon-Akzente in dezenten Kreisen

## 2. Domain-Empfehlung (Stand 7. Oktober 2026)

Geprüft über die offizielle DENIC-Abfrage (RDAP) bzw. die Registries für .com/.net/.eu.
Kontrolldomains (ostfildern.de, kemnat.de, glueckskaefer.de) wurden korrekt als vergeben erkannt.

| Domain | Status | Bewertung |
|---|---|---|
| **glueckskaefer-bande.de** | ✅ frei | **Empfehlung Nr. 1** – Name 1:1, gut lesbar, .de ist für Eltern Standard |
| glueckskaeferbande.de | ✅ frei | Zusätzlich sichern (Tippvariante ohne Bindestrich, Weiterleitung) |
| glückskäfer-bande.de | ✅ frei | Umlaut-Domain, optional sichern; als Hauptdomain ungeeignet (E-Mail-Probleme) |
| glueckskaefer-bande-kemnat.de | ✅ frei | Lokaler SEO-Bonus, aber lang |
| kindertagespflege-glueckskaefer.de | ✅ frei | Beschreibend, gut für Google, weniger markig |
| glueckskaefer-ostfildern.de | ✅ frei | Kurz + Ort, Alternative |
| tagesmutter-kemnat.de / kindertagespflege-kemnat.de | ✅ frei | Reine Suchbegriffs-Domains, nur als Zusatz |
| glueckskaefer-bande.com / .net / .eu | ✅ frei | Nicht nötig für ein lokales Angebot |
| glueckskaefer.de | ❌ vergeben | – |

**Empfehlung:** `glueckskaefer-bande.de` registrieren, `glueckskaeferbande.de`
als Weiterleitung dazu nehmen. Dazu eine E-Mail-Adresse wie
`hallo@glueckskaefer-bande.de`. Kosten bei deutschen Anbietern (IONOS, Strato,
netcup, all-inkl) ca. 5–15 € pro Jahr und Domain.

**Hinweis zum Namen:** „Glückskäfer“ ist auch eine Holzspielzeug-Marke (Nic).
Für eine Kindertagespflege mit dem Zusatz „Bande“ in einem anderen Bereich ist
das unkritisch, aber die Spielzeugmarke sollte nicht im Logo imitiert werden.
Eine andere Kindertagespflege mit dem Namen „Glückskäfer Bande“ wurde nicht gefunden.

## 3. Checkliste vor Veröffentlichung

- [ ] Betreuungszeiten in `kontakt.html` eintragen
- [ ] Nachname, Adresse, Telefon in Footer/Kontakt/Impressum/Datenschutz
- [ ] Echte E-Mail-Adresse einsetzen (Suchen & Ersetzen `hallo@glueckskaefer-bande.de`)
- [ ] Qualifikation / Pflegeerlaubnis (Landratsamt Esslingen) prüfen und ergänzen
- [ ] Alter der betreuten Kinder (z. B. „ab 1 Jahr“)
- [ ] 9 Fotos einfügen (siehe README)
- [ ] Hosting-Anbieter in `datenschutz.html` eintragen
- [ ] Optional: Google Fonts lokal einbinden (dann Abschnitt 4 der Datenschutzerklärung entfernen)
- [ ] Impressum/Datenschutz einmal von einer fachkundigen Stelle gegenlesen lassen
- [ ] Domain registrieren und in `sitemap.xml`, `robots.txt`, Canonical-Links prüfen
- [ ] Google Unternehmensprofil (Maps) anlegen – wichtigster Kanal für lokale Suchanfragen
- [ ] Beim Tageselternverein Kreis Esslingen / Stadt Ostfildern als Tagespflegeperson listen lassen

## 4. Logo

Das gemalte Glückskäfer-Logo (roter Käfer auf Blatt, goldener Ring, Schriftzug)
wird verwendet, sobald es als `assets/logo.png` im Ordner liegt (quadratisch,
ca. 1200 × 1200 px, möglichst mit transparentem oder cremefarbenem Hintergrund).
Danach einmal `python3 build.py` ausführen: Header, Hero-Bereich, Favicon und
das Vorschaubild für WhatsApp/Social Media nutzen dann automatisch das PNG.
Bis dahin wird das einfache SVG-Logo gezeigt.

## 5. Domain & Hosting über IONOS

**Schritt 1 – Domain registrieren (IONOS):**
`glueckskaefer-bande.de` (Empfehlung) und als Tippvariante `glueckskaeferbande.de`.
Bei IONOS unter „Domains“ → Domain-Check → beide in den Warenkorb.
Dazu eine E-Mail-Adresse `hallo@glueckskaefer-bande.de` einrichten (bei IONOS-Domains
ist ein E-Mail-Postfach meist enthalten).

**Schritt 2 – Website veröffentlichen.** Zwei Wege, beide funktionieren mit IONOS:

*Variante A – IONOS Webspace (einfachste Pflege, kostet ca. 1–5 €/Monat):*
1. Bei IONOS ein Hosting-Paket (z. B. „Webhosting Starter“) zur Domain buchen.
2. Im IONOS-Kundencenter den „Datei-Manager“ (WebspaceExplorer) öffnen oder per SFTP verbinden.
3. Den kompletten Inhalt des Ordners `glueckskaefer-bande/` in das Webroot-Verzeichnis hochladen
   (`index.html` muss direkt im Hauptverzeichnis der Domain liegen).
4. In `build.py` die Zeile `DOMAIN = …` auf `https://www.glueckskaefer-bande.de` ändern,
   `python3 build.py` ausführen und die Seiten erneut hochladen.
5. SSL-Zertifikat im IONOS-Kundencenter aktivieren (bei IONOS kostenlos enthalten).

*Variante B – nur Domain bei IONOS, Hosting kostenlos über GitHub Pages:*
1. Die Website in ein eigenes GitHub-Repository `glueckskaefer-bande` legen
   (die Dateien müssen im Hauptverzeichnis liegen, nicht in einem Unterordner).
2. In den Repository-Einstellungen → Pages → „Custom domain“: `www.glueckskaefer-bande.de`
   eintragen und „Enforce HTTPS“ aktivieren.
3. Bei IONOS unter Domains → DNS folgende Einträge setzen:
   - `A`-Einträge für `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` für `www`: `ozaro578.github.io`
4. Nach bis zu 24 Stunden ist die Seite unter der Domain erreichbar.

**Empfehlung:** Variante A, wenn Yasemin die Seite später selbst pflegen soll
(Fotos per Datei-Manager tauschen). Variante B, wenn ihr Bruder die Seite über GitHub
pflegt und keine Hosting-Kosten anfallen sollen.

**Vorschau jetzt schon:** https://ozaro578.github.io/privacy/glueckskaefer-bande/
