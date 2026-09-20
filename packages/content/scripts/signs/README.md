# Verkehrszeichenkatalog (Module)

Jede Datei `scripts/signs/<gruppe>.mjs` exportiert als `default` ein Array von Einträgen:

```js
import { P, triangleUp, circleRed, circleBlue, rectBlue, rectWhite, text, pict, white, BLACK, WHITE, RED, BLUE } from "../lib/sign-kit.mjs";
export default [
  {
    id: "101",                 // Dateiname ohne .svg: Zeichennummer, Varianten mit Bindestrich ("274-50", "1000-10"), Punkt als Bindestrich ("274-1" für 274.1)
    number: "101",             // amtliche Nummer wie im Verkehrszeichenkatalog ("274.1", "1000-10")
    name: "Gefahrstelle",      // amtlicher Name laut StVO-Anlage
    category: "gefahrzeichen", // gefahrzeichen | vorschriftzeichen | richtzeichen | verkehrseinrichtungen | zusatzzeichen
    meaning: "Warnt vor einer Gefahrstelle, die durch kein anderes Gefahrzeichen bezeichnet wird. Ein Zusatzzeichen nennt die Art der Gefahr.", // Bedeutung und Ge- oder Verbot in ein bis drei Sätzen, prüfungsrelevant und korrekt
    alt: "Zeichen 101 Gefahrstelle: rotes Dreieck mit schwarzem Ausrufezeichen", // Bildbeschreibung (Form, Farben, Piktogramm)
    note: "…",                 // optional: Hinweis für die fachliche Prüfung, wenn etwas unsicher ist
    svg: () => triangleUp(P.exclamation, "Zeichen 101 Gefahrstelle"),
  },
];
```

Regeln:
- Formen und Farben aus `../lib/sign-kit.mjs` verwenden; neue Piktogramme lokal im Modul als SVG-Strings im 100×100-Raster definieren (schwarz, mit `white()` für blaue Zeichen).
- Text nur über `text()` (Schrift wird vom Betrachter gerendert), Zahlen und STOP zentriert.
- Jede Zeichennummer der StVO-Anlage der Gruppe muss vorkommen; Varianten (links/rechts, Zahlen) als eigene Einträge mit Suffix.
- Keine Erfindungen: Wenn die genaue Gestaltung unsicher ist, so nah wie möglich zeichnen und `note` setzen.
- Prüfen: `node scripts/gen-media.mjs` muss fehlerfrei laufen; Sichtprüfung über ein Kontaktblatt (Playwright, Chromium unter /opt/pw-browsers/chromium-1194/chrome-linux/chrome).
