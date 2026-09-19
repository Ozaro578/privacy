// Übungsfragen zum Thema "verkehrsregelung" (eigene Formulierungen, kein amtlicher Prüfungsinhalt).
import type { Question } from "../types.js";
import { q, t, f } from "./_helpers.js";

export const verkehrsregelung: readonly Question[] = [
  q({
    code: "own-verkehrsregelung-001", topic: "verkehrsregelung", points: 3, difficulty: 0.3, tags: ["ampel", "gelb", "halten"],
    text: "Die Ampel schaltet auf Gelb, während Sie sich der Kreuzung nähern. Was ist richtig?",
    answers: [t("Vor der Kreuzung anhalten, wenn das noch gefahrlos möglich ist"), f("Beschleunigen, um die Kreuzung noch bei Gelb zu passieren", "Gelb bedeutet warten, nicht beschleunigen."), f("Nur bei Rot anhalten, Gelb kann ignoriert werden", "Gelb verlangt bereits das Anhalten vor der Kreuzung.")],
    explanation: "Gelb bedeutet: Vor der Kreuzung auf das nächste Zeichen warten. Nur wer so nah ist, dass ein gefahrloses Anhalten nicht mehr möglich wäre, darf noch weiterfahren.",
    legalReference: "§ 37 Abs. 2 StVO",
  }),
  q({
    code: "own-verkehrsregelung-002", topic: "verkehrsregelung", points: 2, difficulty: 0.2, tags: ["ampel", "rot_gelb"],
    text: "Was bedeutet Rot und Gelb gleichzeitig an einer Ampel?",
    answers: [t("Fahrbereit machen, aber noch nicht anfahren; es folgt Grün"), f("Sofort anfahren", "Gefahren werden darf erst bei Grün."), f("Die Ampel ist außer Betrieb", "Rot-Gelb ist eine reguläre Phase.")],
    explanation: "Rot und Gelb zusammen kündigen das Grünlicht an. Man macht sich zum Anfahren bereit, fährt aber erst bei Grün los.",
    legalReference: "§ 37 Abs. 2 StVO",
  }),
  q({
    code: "own-verkehrsregelung-003", topic: "verkehrsregelung", points: 4, difficulty: 0.4, tags: ["gruenpfeil", "rechtsabbiegen", "halten"],
    text: "An einer roten Ampel ist ein Schild mit grünem Pfeil (Grünpfeilschild, Zeichen 720) angebracht. Was gilt für das Rechtsabbiegen?",
    answers: [t("Erst an der Haltlinie anhalten, dann rechts abbiegen, wenn niemand behindert oder gefährdet wird"), f("Sie dürfen ohne Anhalten rechts abbiegen wie bei Grün", "Vor dem Abbiegen muss immer angehalten werden."), f("Der Pfeil gilt nur für Radfahrer", "Das Zeichen 720 gilt für alle Fahrzeuge; für Radfahrer gibt es ein eigenes Zeichen 721.")],
    explanation: "Das Grünpfeilschild erlaubt das Rechtsabbiegen bei Rot, aber nur nach vollständigem Anhalten an der Haltlinie und nur, wenn weder Fußgänger noch der freigegebene Verkehr behindert oder gefährdet werden.",
    legalReference: "§ 37 Abs. 2 Nr. 1 StVO",
  }),
  q({
    code: "own-verkehrsregelung-004", topic: "verkehrsregelung", points: 3, difficulty: 0.4, tags: ["gruener_pfeil", "lichtzeichen"],
    text: "Die Ampel zeigt einen grün leuchtenden Pfeil nach links. Was bedeutet das?",
    answers: [t("Sie dürfen nach links abbiegen; der kreuzende Verkehr und der Gegenverkehr haben in dieser Phase Rot"), f("Sie müssen zunächst anhalten und den Gegenverkehr durchlassen", "Das ist die Regel beim Grünpfeilschild, nicht beim leuchtenden Pfeil."), f("Sie dürfen in alle Richtungen fahren", "Der Pfeil gibt nur die angezeigte Richtung frei.")],
    explanation: "Ein grün leuchtender Pfeil gibt ausschließlich die angezeigte Richtung frei. Der Verkehr, der diese Richtung kreuzen würde, wird in dieser Phase angehalten; trotzdem bleibt aufmerksames Fahren Pflicht.",
    legalReference: "§ 37 Abs. 2 StVO",
  }),
  q({
    code: "own-verkehrsregelung-005", topic: "verkehrsregelung", points: 3, difficulty: 0.4, tags: ["polizei", "handzeichen"],
    text: "Ein Polizeibeamter regelt den Verkehr. Ihnen ist seine Brust zugewandt, beide Arme sind seitlich ausgestreckt, also quer zu Ihrer Fahrtrichtung. Was bedeutet das für Sie?",
    answers: [t("Halt vor der Kreuzung, entsprechend Rot"), f("Freie Fahrt, entsprechend Grün", "Freie Fahrt gilt für den Verkehr, der in Richtung der ausgestreckten Arme fährt, also von der Seite kommt."), f("Achtung, die Regelung wird gewechselt", "Das entspricht dem hoch erhobenen Arm.")],
    explanation: "Seitlich ausgestreckte Arme quer zu Ihrer Fahrtrichtung bedeuten Halt wie Rot: Sie sehen Brust oder Rücken des Beamten. Wer in Richtung der Arme fährt, also den Beamten von der Seite sieht, hat freie Fahrt wie Grün. Ein hoch erhobener Arm bedeutet: Achtung, die Freigabe wechselt.",
    mnemonic: "Seite = Grün, Brust und Rücken = Rot, Arm hoch = Gelb.",
    legalReference: "§ 36 StVO",
  }),
  q({
    code: "own-verkehrsregelung-006", topic: "verkehrsregelung", points: 3, difficulty: 0.3, tags: ["rangfolge", "polizei", "lichtzeichen"],
    text: "In welcher Rangfolge gelten Verkehrsregelungen an einer Kreuzung?",
    answers: [t("Zeichen von Polizeibeamten vor Lichtzeichen, Lichtzeichen vor Verkehrszeichen, Verkehrszeichen vor der Grundregel rechts vor links"), f("Verkehrszeichen vor Lichtzeichen", "Lichtzeichen gehen den Verkehrszeichen vor."), f("Rechts vor links gilt immer, auch bei Ampeln", "Die Grundregel gilt nur, wenn keine andere Regelung besteht.")],
    explanation: "Weisungen der Polizei gehen allen anderen Regelungen vor. Danach folgen Lichtzeichen, dann Verkehrszeichen und zuletzt die allgemeine Regel rechts vor links.",
    legalReference: "§ 36, § 37 und § 8 StVO",
  }),
  q({
    code: "own-verkehrsregelung-007", topic: "verkehrsregelung", points: 3, difficulty: 0.3, tags: ["dauerlichtzeichen", "fahrstreifen", "autobahn"],
    text: "Über einem Fahrstreifen leuchtet ein rotes Kreuz (Dauerlichtzeichen). Was bedeutet das?",
    answers: [t("Der Fahrstreifen darf nicht benutzt werden"), f("Der Fahrstreifen darf nur mit Vorsicht benutzt werden", "Ein rotes Kreuz sperrt den Fahrstreifen vollständig."), f("Auf dem Fahrstreifen gilt ein Überholverbot", "Das Zeichen sperrt, es regelt nicht das Überholen.")],
    explanation: "Dauerlichtzeichen über Fahrstreifen sperren (rotes Kreuz) oder geben frei (grüner Pfeil nach unten). Ein gelb blinkender Schrägpfeil kündigt an, dass der Fahrstreifen gewechselt werden muss.",
    legalReference: "§ 37 Abs. 3 StVO",
  }),
  q({
    code: "own-verkehrsregelung-008", topic: "verkehrsregelung", points: 2, difficulty: 0.2, tags: ["blinklicht", "gelb"],
    text: "Was bedeutet ein gelbes Blinklicht, zum Beispiel an einer Baustelle?",
    answers: [t("Warnung vor einer Gefahr; es besteht keine Anhaltepflicht"), f("Anhalten und warten", "Anhaltepflicht besteht nur bei Rot."), f("Vorfahrt für den Baustellenverkehr", "Das Blinklicht regelt keine Vorfahrt.")],
    explanation: "Gelbes Blinklicht warnt vor Gefahren oder weist auf Hindernisse hin. Man muss die Geschwindigkeit anpassen und aufmerksam sein, aber nicht anhalten.",
    legalReference: "§ 38 Abs. 3 StVO",
  }),
  q({
    code: "own-verkehrsregelung-009", topic: "verkehrsregelung", points: 4, difficulty: 0.3, tags: ["bahnuebergang", "rotlicht", "halten"],
    text: "Am Bahnübergang leuchtet rotes Licht, die Schranke ist noch offen. Was gilt?",
    answers: [t("Anhalten und warten, bis das Rotlicht erlischt"), f("Schnell noch vor der Schranke hinüberfahren", "Rotes Licht bedeutet Halt, auch bei offener Schranke."), f("Langsam weiterfahren, wenn kein Zug zu sehen ist", "Züge nähern sich schnell und lautlos; Rot verpflichtet zum Anhalten.")],
    explanation: "Rotes Licht oder rotes Blinklicht am Bahnübergang bedeutet Halt, unabhängig von der Stellung der Schranke. Es darf erst weitergefahren werden, wenn das Licht erloschen und die Schranke offen ist.",
    legalReference: "§ 19 Abs. 2 StVO; § 37 Abs. 2 Nr. 3 StVO",
  }),
  q({
    code: "own-verkehrsregelung-010", topic: "verkehrsregelung", points: 3, difficulty: 0.3, tags: ["ampel", "fussgaenger", "gruen"],
    text: "Die Ampel schaltet für Sie auf Grün, aber ein Fußgänger befindet sich noch auf der Fahrbahn. Wie verhalten Sie sich?",
    answers: [t("Warten und den Fußgänger die Fahrbahn räumen lassen"), f("Anfahren, weil Sie Grün haben", "Grün gibt keine Erlaubnis, Fußgänger zu gefährden."), f("Hupen, damit der Fußgänger schneller geht", "Hupen ist hier weder erlaubt noch sinnvoll.")],
    explanation: "Wer bei Grün Fußgänger noch auf der Fahrbahn antrifft, muss sie zügig, aber ungefährdet die Fahrbahn räumen lassen. Grün bedeutet Freigabe, nicht Vorrang um jeden Preis.",
    legalReference: "§ 37 Abs. 2 StVO; § 1 StVO",
  }),
];
