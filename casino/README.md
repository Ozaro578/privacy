# Titan's Vault: Ascension — HNX Studios

HTML5‑Slot‑Demo (Spielgeld, kein Echtgeld). Läuft ohne Build direkt im Browser.

```
npm start          # lokal unter http://localhost:5173
npm test           # Engine‑Tests
npm run sim        # RTP‑Simulation, 2 Mio. Runden (ca. 1 Minute)
```

## Aufbau

| Datei | Inhalt |
|---|---|
| `js/engine.js` | **Komplette Spiellogik**, ohne DOM. Seedbarer RNG, Gewinnauswertung, Kaskaden, Schlüssel, Freispiele, Vault Rush, Risikoleiter. Für eine Echtgeld‑Version wandert genau diese Datei auf den Server. |
| `js/main.js` | Oberfläche, spielt nur die Ereignisse der Engine ab. Enthält den DE‑Modus (GlüStV). |
| `js/audio.js` | Prozeduraler Sound, keine Dateien. |
| `tools/simulate.js` | RTP‑/Volatilitäts‑Simulation für das Datenblatt. |
| `tools/test.js` | Sanity‑Tests der Engine. |
| `assets/` | Optionale Grafiken: `bg.jpg`, `logo.png`, `icon.png`, `sym/<symbol>.png`. Fehlen sie, nutzt das Spiel Emoji/Text. |

Siehe `DATASHEET.md` für die Kennzahlen, die Aggregatoren und Testlabore abfragen.
