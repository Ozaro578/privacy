// Übungsfragen zum Thema "geschwindigkeit" (eigene Formulierungen, kein amtlicher Prüfungsinhalt).
import type { Question } from "../types.js";
import { q, t, f } from "./_helpers.js";

export const geschwindigkeit: readonly Question[] = [
  q({
    code: "own-geschwindigkeit-001", topic: "geschwindigkeit", points: 2, difficulty: 0.1, tags: ["innerorts", "hoechstgeschwindigkeit"],
    text: "Welche Höchstgeschwindigkeit gilt innerhalb geschlossener Ortschaften für Pkw, wenn keine Verkehrszeichen etwas anderes anordnen?",
    answers: [t("50 km/h"), f("30 km/h", "Das gilt nur in ausgeschilderten Zonen oder Abschnitten."), f("60 km/h", "Die allgemeine Grenze innerorts liegt niedriger.")],
    explanation: "Innerhalb geschlossener Ortschaften gilt für alle Kraftfahrzeuge eine Höchstgeschwindigkeit von 50 km/h, sofern keine Zeichen etwas anderes anordnen.",
    legalReference: "§ 3 Abs. 3 Nr. 1 StVO",
  }),
  q({
    code: "own-geschwindigkeit-002", topic: "geschwindigkeit", points: 2, difficulty: 0.1, tags: ["ausserorts", "hoechstgeschwindigkeit"],
    text: "Welche Höchstgeschwindigkeit gilt für Pkw ohne Anhänger auf Landstraßen außerhalb geschlossener Ortschaften?",
    answers: [t("100 km/h"), f("80 km/h", "Das gilt für Pkw mit Anhänger und für Lkw."), f("130 km/h", "Das ist die Richtgeschwindigkeit auf Autobahnen.")],
    explanation: "Außerhalb geschlossener Ortschaften dürfen Pkw ohne Anhänger höchstens 100 km/h fahren, wenn keine Zeichen etwas anderes anordnen.",
    legalReference: "§ 3 Abs. 3 Nr. 2 StVO",
  }),
  q({
    code: "own-geschwindigkeit-003", topic: "geschwindigkeit", points: 3, difficulty: 0.4, tags: ["anhaenger", "ausserorts", "autobahn"],
    text: "Wie schnell dürfen Sie mit einem Pkw mit Anhänger außerorts und auf der Autobahn höchstens fahren?",
    answers: [t("80 km/h; 100 km/h nur mit entsprechender Zulassung des Gespanns (Tempo-100-Plakette)"), f("Immer 100 km/h", "Ohne besondere Zulassung gilt 80 km/h."), f("130 km/h auf der Autobahn", "Für Gespanne gilt auch auf der Autobahn eine feste Grenze.")],
    explanation: "Pkw mit Anhänger dürfen außerorts und auf Autobahnen höchstens 80 km/h fahren. 100 km/h sind nur erlaubt, wenn das Gespann dafür zugelassen ist und die Plakette am Anhänger angebracht ist.",
    legalReference: "§ 3 Abs. 3 Nr. 2 StVO; § 18 Abs. 5 StVO",
  }),
  q({
    code: "own-geschwindigkeit-004", topic: "geschwindigkeit", points: 3, difficulty: 0.2, tags: ["abstand", "halber_tacho", "autobahn"], kind: "numeric", numericAnswer: 50, tolerance: 0, unit: "m",
    text: "Sie fahren 100 km/h. Wie groß sollte der Sicherheitsabstand nach der Regel halber Tacho mindestens sein? Angabe in Metern.",
    answers: [],
    explanation: "Halber Tacho bedeutet: Bei 100 km/h mindestens 50 Meter Abstand. Das entspricht dem Abstand zweier Leitpfosten auf der Autobahn.",
    mnemonic: "Abstand halber Tacho.",
    legalReference: "§ 4 Abs. 1 StVO",
  }),
  q({
    code: "own-geschwindigkeit-005", topic: "geschwindigkeit", points: 3, difficulty: 0.3, tags: ["bremsweg", "innerorts", "faustformel"], kind: "numeric", numericAnswer: 25, tolerance: 0, unit: "m",
    text: "Wie lang ist der Bremsweg bei 50 km/h nach der Faustformel für eine normale Bremsung? Angabe in Metern.",
    answers: [],
    explanation: "Bremsweg = (50 / 10)² = 5 × 5 = 25 Meter. Bei doppelter Geschwindigkeit wird der Bremsweg viermal so lang.",
    mnemonic: "Bremsweg: Tempo durch 10, dann quadrieren.",
  }),
  q({
    code: "own-geschwindigkeit-006", topic: "geschwindigkeit", points: 3, difficulty: 0.4, tags: ["anhalteweg", "reaktionsweg", "bremsweg", "ausserorts"], kind: "numeric", numericAnswer: 130, tolerance: 0, unit: "m",
    text: "Wie lang ist der Anhalteweg bei 100 km/h nach den Faustformeln (normale Bremsung)? Angabe in Metern.",
    answers: [],
    explanation: "Reaktionsweg = (100 / 10) × 3 = 30 Meter, Bremsweg = (100 / 10)² = 100 Meter. Zusammen ergibt das einen Anhalteweg von 130 Metern.",
  }),
  q({
    code: "own-geschwindigkeit-007", topic: "geschwindigkeit", points: 3, difficulty: 0.4, tags: ["bremsweg", "gefahrenbremsung", "faustformel"], kind: "numeric", numericAnswer: 50, tolerance: 0, unit: "m",
    text: "Wie lang ist der Bremsweg bei 100 km/h bei einer Gefahrenbremsung nach der Faustformel? Angabe in Metern.",
    answers: [],
    explanation: "Bei der Gefahrenbremsung wird der normale Bremsweg halbiert: (100 / 10)² / 2 = 50 Meter. Der Reaktionsweg von 30 Metern kommt beim Anhalteweg noch hinzu.",
  }),
  q({
    code: "own-geschwindigkeit-008", topic: "geschwindigkeit", points: 3, difficulty: 0.3, tags: ["bremsweg", "fahrphysik"],
    text: "Sie verdoppeln Ihre Geschwindigkeit. Wie verändert sich der Bremsweg?",
    answers: [t("Er wird etwa viermal so lang"), f("Er wird doppelt so lang", "Der Bremsweg wächst mit dem Quadrat der Geschwindigkeit."), f("Er bleibt gleich, nur der Reaktionsweg wächst", "Beide Teile des Anhaltewegs wachsen.")],
    explanation: "Der Bremsweg wächst mit dem Quadrat der Geschwindigkeit. Doppelte Geschwindigkeit bedeutet vierfacher Bremsweg, der Reaktionsweg verdoppelt sich nur.",
  }),
  q({
    code: "own-geschwindigkeit-009", topic: "geschwindigkeit", points: 3, difficulty: 0.3, tags: ["nebel", "sichtweite", "hoechstgeschwindigkeit"],
    text: "Bei Nebel beträgt die Sichtweite weniger als 50 Meter. Wie schnell dürfen Sie höchstens fahren?",
    answers: [t("Höchstens 50 km/h, wenn nicht eine noch geringere Geschwindigkeit geboten ist"), f("Höchstens 80 km/h", "Bei so geringer Sicht ist die Grenze niedriger."), f("Die allgemeine Höchstgeschwindigkeit gilt unverändert", "Bei Sichtweiten unter 50 Metern gilt eine besondere Grenze.")],
    explanation: "Beträgt die Sichtweite durch Nebel, Schneefall oder Regen weniger als 50 Meter, darf nicht schneller als 50 km/h gefahren werden. Grundsätzlich darf man nur so schnell fahren, dass man innerhalb der übersehbaren Strecke anhalten kann.",
    legalReference: "§ 3 Abs. 1 StVO",
  }),
  q({
    code: "own-geschwindigkeit-010", topic: "geschwindigkeit", points: 2, difficulty: 0.2, tags: ["abstand", "ausserorts", "zwei_sekunden"],
    text: "Welche Faustregel hilft außerorts, den Sicherheitsabstand zum Vorausfahrenden zu prüfen?",
    answers: [t("Die Zwei-Sekunden-Regel: Mindestens zwei Sekunden Abstand zu einem festen Punkt, den das vorausfahrende Fahrzeug passiert hat"), f("Die Halbe-Sekunde-Regel", "Eine halbe Sekunde reicht nicht einmal für die Reaktionszeit."), f("Die Fünf-Sekunden-Regel für alle Geschwindigkeiten", "Fünf Sekunden sind eine Empfehlung bei schlechten Bedingungen, nicht die allgemeine Regel.")],
    explanation: "Passiert der Vorausfahrende einen festen Punkt, sollten mindestens zwei Sekunden vergehen, bis man selbst dort ankommt. Bei Nässe oder Glätte deutlich mehr.",
    legalReference: "§ 4 Abs. 1 StVO",
  }),
  q({
    code: "own-geschwindigkeit-011", topic: "geschwindigkeit", points: 2, difficulty: 0.4, tags: ["abstand", "lkw", "autobahn"],
    text: "Welchen Mindestabstand müssen Lkw über 3,5 t auf Autobahnen bei mehr als 50 km/h zum Vorausfahrenden einhalten?",
    answers: [t("50 Meter"), f("25 Meter", "Für schwere Fahrzeuge ist der vorgeschriebene Abstand größer."), f("100 Meter", "Der gesetzliche Mindestabstand ist geringer.")],
    explanation: "Lkw über 3,5 t und Kraftomnibusse müssen auf Autobahnen bei mehr als 50 km/h einen Abstand von mindestens 50 Metern halten. Das hilft auch Pkw-Fahrern, Lkw-Kolonnen richtig einzuschätzen.",
    legalReference: "§ 4 Abs. 3 StVO",
  }),
  q({
    code: "own-geschwindigkeit-012", topic: "geschwindigkeit", points: 2, difficulty: 0.2, tags: ["reaktionsweg", "ausserorts", "faustformel"], kind: "numeric", numericAnswer: 30, tolerance: 0, unit: "m",
    text: "Wie lang ist der Reaktionsweg bei 100 km/h nach der Faustformel? Angabe in Metern.",
    answers: [],
    explanation: "Reaktionsweg = (100 / 10) × 3 = 30 Meter. Diese Strecke legt das Fahrzeug zurück, bevor die Bremsung überhaupt beginnt.",
  }),
];
