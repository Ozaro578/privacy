// Übungsfragen zum Thema "fahrphysik" (eigene Formulierungen, kein amtlicher Prüfungsinhalt).
import type { Question } from "../types.js";
import { q, t, f } from "./_helpers.js";

export const fahrphysik: readonly Question[] = [
  q({
    code: "own-fahrphysik-001", topic: "fahrphysik", points: 3, difficulty: 0.3, tags: ["fliehkraft", "kurve"],
    text: "Sie fahren eine Kurve mit doppelter Geschwindigkeit. Wie verändert sich die Fliehkraft?",
    answers: [t("Sie wird viermal so groß"), f("Sie verdoppelt sich", "Die Fliehkraft wächst mit dem Quadrat der Geschwindigkeit."), f("Sie bleibt gleich, nur der Kurvenradius ändert sich", "Bei gleichem Radius steigt die Fliehkraft deutlich.")],
    explanation: "Die Fliehkraft in der Kurve wächst mit dem Quadrat der Geschwindigkeit. Doppeltes Tempo bedeutet vierfache Fliehkraft; deshalb vor der Kurve bremsen, nicht in der Kurve.",
  }),
  q({
    code: "own-fahrphysik-002", topic: "fahrphysik", points: 3, difficulty: 0.3, tags: ["abs", "bremsen", "gefahrenbremsung"],
    text: "Was gilt für das Antiblockiersystem (ABS)?",
    answers: [t("Das Fahrzeug bleibt bei einer Vollbremsung lenkbar"), t("Bei einer Gefahrenbremsung wird das Bremspedal voll durchgetreten und gehalten, nicht gepumpt"), f("ABS verkürzt den Bremsweg auf jedem Untergrund", "Auf losem Untergrund wie Schotter kann der Bremsweg mit ABS sogar länger sein.")],
    explanation: "ABS verhindert das Blockieren der Räder und erhält die Lenkfähigkeit. Bei der Gefahrenbremsung voll bremsen und das Pulsieren im Pedal ignorieren.",
  }),
  q({
    code: "own-fahrphysik-003", topic: "fahrphysik", points: 2, difficulty: 0.3, tags: ["esp", "assistenzsysteme", "schleudern"],
    text: "Wie wirkt das Elektronische Stabilitätsprogramm (ESP)?",
    answers: [t("Es erkennt beginnendes Schleudern und bremst einzelne Räder gezielt ab, um das Fahrzeug zu stabilisieren"), f("Es erhöht die Motorleistung in Kurven", "ESP greift bremsend und leistungsreduzierend ein."), f("Es ersetzt die Winterreifen", "ESP kann fehlende Reifenhaftung nicht ersetzen.")],
    explanation: "ESP vergleicht die gewünschte mit der tatsächlichen Fahrtrichtung und bremst bei Abweichung einzelne Räder ab. Die physikalischen Grenzen der Haftung kann es nicht verschieben.",
  }),
  q({
    code: "own-fahrphysik-004", topic: "fahrphysik", points: 3, difficulty: 0.3, tags: ["gefahrenbremsung", "bremsen", "kupplung"],
    text: "Wie führen Sie mit einem Schaltwagen eine Gefahrenbremsung durch?",
    answers: [t("Bremspedal sofort voll durchtreten und gleichzeitig die Kupplung treten"), f("Zuerst herunterschalten, dann bremsen", "Schalten kostet wertvolle Zeit."), f("Nur leicht bremsen, um ein Blockieren zu vermeiden", "Mit ABS darf und muss voll gebremst werden.")],
    explanation: "Bei der Gefahrenbremsung zählt jeder Meter: Bremse voll durchtreten, Kupplung treten, damit der Motor nicht abwürgt, und mit ABS weiter lenken.",
  }),
  q({
    code: "own-fahrphysik-005", topic: "fahrphysik", points: 2, difficulty: 0.2, tags: ["naesse", "bremsweg", "haftung"],
    text: "Wie verändert sich das Fahrverhalten auf nasser Fahrbahn?",
    answers: [t("Der Bremsweg wird länger und die Haftung in Kurven nimmt ab"), f("Der Bremsweg bleibt gleich, nur die Sicht ist schlechter", "Nässe verringert die Reibung zwischen Reifen und Fahrbahn."), f("Die Haftung wird durch den Wasserfilm besser", "Der Wasserfilm trennt Reifen und Fahrbahn.")],
    explanation: "Auf nasser Fahrbahn sinkt die Reibung zwischen Reifen und Straße. Bremsweg und Kurvenradius wachsen, deshalb Geschwindigkeit und Abstand anpassen.",
  }),
  q({
    code: "own-fahrphysik-006", topic: "fahrphysik", points: 2, difficulty: 0.3, tags: ["assistenzsysteme", "notbremsassistent"],
    text: "Was gilt für Fahrerassistenzsysteme wie Notbremsassistent oder Abstandsregeltempomat?",
    answers: [t("Sie unterstützen den Fahrer, ersetzen aber nicht seine Aufmerksamkeit und Verantwortung"), f("Mit Notbremsassistent muss der Fahrer nicht mehr selbst bremsen", "Das System kann Situationen übersehen; der Fahrer bleibt verantwortlich."), f("Der Abstandsregeltempomat erkennt alle Hindernisse zuverlässig", "Stehende Hindernisse und Querverkehr werden nicht immer erkannt.")],
    explanation: "Assistenzsysteme haben Systemgrenzen und reagieren nicht in jeder Situation. Der Fahrer muss jederzeit eingreifen können und bleibt verantwortlich.",
  }),
  q({
    code: "own-fahrphysik-007", topic: "fahrphysik", points: 2, difficulty: 0.3, tags: ["beladung", "schwerpunkt", "dachlast"],
    text: "Wie wirkt sich eine schwere Dachlast auf das Fahrverhalten aus?",
    answers: [t("Der Schwerpunkt liegt höher, das Fahrzeug neigt sich in Kurven stärker und kippt leichter"), f("Das Fahrzeug liegt durch das Gewicht besser auf der Straße", "Hoch liegende Lasten verschlechtern die Fahrstabilität."), f("Die Dachlast hat keinen Einfluss, solange die zulässige Gesamtmasse eingehalten wird", "Neben dem Gewicht zählt die Lage des Schwerpunkts.")],
    explanation: "Dachlasten heben den Schwerpunkt an und verändern das Kurven- und Bremsverhalten. Die zulässige Dachlast beachten und die Geschwindigkeit anpassen.",
  }),
  q({
    code: "own-fahrphysik-008", topic: "fahrphysik", points: 3, difficulty: 0.5, tags: ["untersteuern", "kurve"],
    text: "In einer Kurve schiebt Ihr Fahrzeug über die Vorderräder geradeaus (Untersteuern). Wie reagieren Sie?",
    answers: [t("Gas wegnehmen und den Lenkeinschlag nicht weiter vergrößern, damit die Vorderräder wieder Haftung finden"), f("Stärker einlenken und Gas geben", "Mehr Lenkwinkel und mehr Tempo verschlimmern das Untersteuern."), f("Die Feststellbremse ziehen", "Das führt zum Schleudern.")],
    explanation: "Beim Untersteuern haben die Vorderräder die Haftung verloren. Gas wegnehmen verlagert Gewicht nach vorn und verbessert die Haftung; der Lenkwinkel wird nicht vergrößert.",
  }),
  q({
    code: "own-fahrphysik-009", topic: "fahrphysik", points: 2, difficulty: 0.4, tags: ["kammscher_kreis", "haftung"],
    text: "Was besagt der Kammsche Kreis für das Fahren?",
    answers: [t("Ein Reifen kann nur eine begrenzte Gesamtkraft übertragen; wer gleichzeitig stark bremst und lenkt, teilt diese Kraft auf"), f("Reifen können Brems- und Seitenkraft unabhängig voneinander unbegrenzt übertragen", "Genau das Gegenteil ist der Fall."), f("Der Kreis beschreibt den Wendekreis des Fahrzeugs", "Er beschreibt die Kraftübertragung des Reifens.")],
    explanation: "Die Haftung eines Reifens ist begrenzt. Wird sie beim Bremsen voll genutzt, bleibt keine Reserve für das Lenken. Deshalb: vor der Kurve bremsen, in der Kurve rollen.",
  }),
  q({
    code: "own-fahrphysik-010", topic: "fahrphysik", points: 3, difficulty: 0.3, tags: ["bremsweg", "faustformel", "ausserorts"], kind: "numeric", numericAnswer: 100, tolerance: 0, unit: "m",
    text: "Wie lang ist der Bremsweg bei 100 km/h bei einer normalen Bremsung nach der Faustformel? Angabe in Metern.",
    answers: [],
    explanation: "Bremsweg = (100 / 10)² = 100 Meter. Erst bei einer Gefahrenbremsung halbiert sich dieser Wert auf etwa 50 Meter.",
  }),
];
