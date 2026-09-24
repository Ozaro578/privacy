# ZUKKABRO – Verpackung bei Packhelp gestalten

Anbieter: **Packhelp** (packhelp.de). Alles kommt aus einer Hand: Versandbox mit Außen- und Innendruck,
bedrucktes Papierklebeband, Seidenpapier, Sticker und Etiketten. Du gestaltest alles im Online-Editor.

## Die Dateien

Im Ordner `png/` liegen alle Motive in 300 dpi (druckfertig). In `dateien/` liegen dieselben Motive als SVG (Vektor).
Nimm im Editor die **PNG-Dateien**. Wenn der Editor Vektor annimmt, geht auch SVG.

| Datei | Wofür |
|---|---|
| `01-deckel-aussen-schwarz.png` | Deckel außen, schwarze Box |
| `01b-deckel-aussen-weiss.png` | Deckel außen, weiße Box |
| `02-seite-lang-schwarz.png` | Vorder- und Rückseite (lange Seiten) |
| `03-seite-kurz-schwarz.png` | Linke und rechte Seite (kurze Seiten) |
| `04-deckel-innen-pink.png` | Deckel innen („Deine Cravings. Unser Job.“) |
| `05-boden-innen-pink.png` | Boden innen (Kronen-Muster) |
| `06-klebeband-schwarz-auf-kraft.png` | Papierklebeband, Druck schwarz |
| `06b-klebeband-pink-auf-weiss.png` | Klebeband, Druck pink |
| `07-seidenpapier-pink.png` / `07b-…-schwarz.png` | Seidenpapier-Muster (einfarbig) |
| `08-sticker-rund-8cm.png` | Runder Sticker „Danke, Bro!“ |
| `09-danke-karte-a6.png` | Danke-Karte fürs Paket (A6) |
| `10-etikett-10x15.png` | Versandetikett mit Platz für das Adresslabel |
| `20…25` | Einzelteile ohne Hintergrund (Logo, Slogan, Kronen) zum freien Platzieren |

Die fertigen Flächen sind für eine Box von **30 × 22 × 10 cm** gemacht.
Wählst du eine andere Größe, nimm die Einzelteile `20` bis `25` und setz sie im Editor selbst zusammen.

## So geht's im Editor

1. Auf packhelp.de **„Individuelle Versandschachtel“** öffnen.
2. **Material** wählen: für den schwarzen Look „weiß beschichtet“ oder „weiß“ nehmen und die Fläche schwarz bedrucken.
   Für den Kraft-Look „braun/Kraftpapier“ nehmen, das spart Geld (nur einfarbig schwarz drucken, Datei `25-krone-umriss-schwarz` und `21-logo-fuer-hell`).
3. **Größe** wählen, zum Beispiel ca. 30 × 22 × 10 cm für 6 bis 8 Snacks.
4. **Innendruck** aktivieren.
5. Im Editor jede Seite anklicken und die passende PNG hochladen (siehe Tabelle). Bild auf „ganze Fläche füllen“ stellen.
6. Hintergrundfarbe: außen Schwarz `#141014`, innen Pink `#ff2e98`.
7. **Vorschau in 3D** prüfen, dann erst **ein Muster oder die kleinste Menge** bestellen.
8. Danach **Papierklebeband**, **Seidenpapier** und **Sticker** genauso im Editor anlegen.

## Wichtig

- **Keine Vapes auf der Box:** Auf den Dateien steht bewusst „SNACKS • DRINKS • CANDY • MORE“ statt „VAPES“,
  und es ist keine E-Zigarette abgebildet. Werbung für E-Zigaretten ist in Deutschland stark eingeschränkt.
  Lasst das vor dem Druck kurz prüfen, falls ihr es anders wollt.
- **Farben:** Bildschirmfarben (RGB) sehen im Druck (CMYK) etwas anders aus, vor allem das knallige Pink.
  Deshalb zuerst ein Muster bestellen.
- **Symbole** wie „Oben“, „Zerbrechlich“ und „Recycling“ bietet der Editor meist selbst an.

## Neu erzeugen

```
python3 werkzeuge/zukkabro_verpackung.py
node werkzeuge/zukkabro_verpackung_png.cjs
```
