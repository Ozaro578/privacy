# Titan's Vault: Ascension — Game Sheet

**Studio:** HNX Studios · **Typ:** Video‑Slot, 5×4 (5×5 bei Ascension), 1024 / 3125 Wege · **Plattform:** HTML5, mobil zuerst · **Sprachen:** DE (EN geplant)

| Kennzahl | Wert |
|---|---|
| RTP (theoretisch, 2 Mio. simulierte Runden, Seed 12345) | **95,67 %** |
| davon Grundspiel / Freispiele / Vault Rush | 40,9 % / 31,3 % / 23,5 % |
| Volatilität | hoch |
| Trefferquote | 60,1 % |
| Freispiele | 1 zu 131, Ø 40,9× Einsatz |
| Vault Rush | 1 zu 400, Ø 94× Einsatz |
| Max‑Gewinn | 5.000× Einsatz (Deckel), beobachtet 2.506× |
| Standardabweichung je Runde | 8,45× |
| Einsätze Standard | 0,20 – 100,00 |
| Einsätze DE‑Modus | 0,10 – 1,00 |

Vollständige Verteilung: `tools/sim-2M-seed12345.json`. Reproduzierbar mit `node tools/simulate.js 2000000 12345`.

## Features

1. **Kaskaden mit Titan‑Multiplikator** x1 · x2 · x3 · x5 (Freispiele: bis x15).
2. **Drei Schlüssel** (nur Walzen 1, 3, 5): Bronze = Mystery‑Verwandlung, Silber = Wild‑Walze, Gold = Ascension auf 5 Reihen. Jeder Schlüssel wird selbst zum Wild.
3. **Freispiele mit Wahl** nach 3+ Tresoren: Sturm (28 Spins, x2–x6), Krieger (18 Spins, x3–x12), Titan (5 Spins, x3–x15, dauerhaft 5 Reihen). Retrigger +5.
4. **Vault Rush** (Hold & Win) bei 6+ Münzen: 3 Respins, Münzwerte 1×–50×, Bonuspreise Mini 20× / Minor 50× / Major 100×, Sammler‑Münze, voller Tresor 2.500×. Feste Preise, kein progressiver Jackpot.
5. **Risikoleiter** rot/schwarz, echte 50/50, max. 5 Stufen. Im DE‑Modus deaktiviert.

## Deutschland‑Modus (GlüStV 2021, § 22a)

- Höchsteinsatz 1,00 € je Spiel, 5 Sekunden Mindestdauer, kein Autoplay, kein Turbo.
- Kein Jackpot, keine progressiven Preise.
- RTP und Wahrscheinlichkeit des Höchstgewinns im Spiel sichtbar (Menü → Regeln).
- Sitzungsuhr in der Kopfzeile.

## Was für die Zertifizierung noch fehlt

- Server‑seitige Ausführung der Engine mit zertifiziertem RNG (die Demo nutzt `crypto.getRandomValues` im Browser).
- Wallet‑/Session‑API des Aggregators (Einsatz, Gewinn, Storno, Spielverlauf, Reality‑Check).
- Mehrsprachigkeit und Währungen.
- Finale Grafiken und Sound‑Design.
