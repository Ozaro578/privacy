// Übungsfragen zum Thema "beleuchtung" (eigene Formulierungen, kein amtlicher Prüfungsinhalt).
import type { Question } from "../types";
import { q, t, f } from "./_helpers";

export const beleuchtung: readonly Question[] = [
  q({
    code: "own-beleuchtung-001", topic: "beleuchtung", points: 3, difficulty: 0.2, tags: ["nebelschlussleuchte", "nebel", "sichtweite"],
    text: "Wann dürfen Sie die Nebelschlussleuchte einschalten?",
    answers: [t("Nur bei Nebel, wenn die Sichtweite weniger als 50 Meter beträgt"), f("Bei jedem Regen", "Bei Regen blendet die Nebelschlussleuchte nachfolgende Fahrer."), f("Immer bei Dunkelheit auf der Autobahn", "Sie ist ausschließlich bei Nebel mit geringer Sichtweite erlaubt.")],
    explanation: "Die Nebelschlussleuchte darf nur bei Nebel mit Sichtweite unter 50 Metern eingeschaltet werden. Dann gilt zugleich die Höchstgeschwindigkeit von 50 km/h.",
    mnemonic: "Nebelschlussleuchte: unter 50 Meter Sicht, höchstens 50 km/h.",
    legalReference: "§ 17 Abs. 3 StVO",
  }),
  q({
    code: "own-beleuchtung-002", topic: "beleuchtung", points: 3, difficulty: 0.3, tags: ["tagfahrlicht", "abblendlicht", "regen"],
    text: "Bei starkem Regen am Tag ist das Tagfahrlicht eingeschaltet. Ist das ausreichend?",
    answers: [t("Nein, bei Sichtbehinderung muss Abblendlicht eingeschaltet werden, weil beim Tagfahrlicht die Rückleuchten meist aus bleiben"), f("Ja, Tagfahrlicht reicht bei jeder Witterung am Tag", "Bei Regen, Nebel oder Schnee ist Abblendlicht vorgeschrieben."), f("Nein, es muss Fernlicht eingeschaltet werden", "Fernlicht würde bei Regen blenden.")],
    explanation: "Tagfahrlicht macht nur nach vorn sichtbar. Wenn Regen, Nebel oder Schneefall die Sicht behindern, ist auch am Tag Abblendlicht Pflicht, damit auch die Rückleuchten leuchten.",
    legalReference: "§ 17 Abs. 3 StVO",
  }),
  q({
    code: "own-beleuchtung-003", topic: "beleuchtung", points: 3, difficulty: 0.3, tags: ["fernlicht", "blenden", "dunkelheit"],
    text: "Wann müssen Sie das Fernlicht abblenden?",
    answers: [t("Bei Gegenverkehr"), t("Wenn Sie dicht hinter einem anderen Fahrzeug fahren"), t("Innerorts auf ausreichend beleuchteten Straßen"), f("Bei Nebel, weil Fernlicht die Sicht verbessert", "Fernlicht wird vom Nebel reflektiert und verschlechtert die Sicht.")],
    explanation: "Fernlicht darf niemanden blenden. Es ist abzublenden bei Gegenverkehr, beim Auffahren auf andere und auf innerorts ausreichend beleuchteten Straßen.",
    legalReference: "§ 17 Abs. 2 StVO",
  }),
  q({
    code: "own-beleuchtung-004", topic: "beleuchtung", points: 2, difficulty: 0.3, tags: ["lichthupe", "ueberholen", "ausserorts"],
    text: "Wozu dürfen Sie die Lichthupe benutzen?",
    answers: [t("Außerorts zum Ankündigen des Überholens und zum Warnen vor Gefahren"), f("Um Vorfahrt zu erzwingen", "Die Lichthupe gibt kein Vorrecht."), f("Um andere auf Blitzer hinzuweisen", "Das ist keine zulässige Verwendung.")],
    explanation: "Die Lichthupe darf als Warnzeichen benutzt werden, außerorts auch um das Überholen anzukündigen. Sie darf niemanden blenden oder nötigen.",
    legalReference: "§ 16 Abs. 1 StVO; § 5 Abs. 5 StVO",
  }),
  q({
    code: "own-beleuchtung-005", topic: "beleuchtung", points: 3, difficulty: 0.3, tags: ["warnblinklicht"],
    text: "Wann dürfen Sie das Warnblinklicht einschalten?",
    answers: [t("Wenn Sie sich einem Stauende nähern und andere warnen wollen"), t("Wenn Ihr Fahrzeug liegen geblieben ist"), t("Beim Abschleppen, und zwar an beiden Fahrzeugen"), f("Beim Halten in zweiter Reihe zum Ausladen", "Das Warnblinklicht macht verbotenes Halten nicht erlaubt.")],
    explanation: "Das Warnblinklicht ist für Gefahrensituationen vorgesehen: Stauende, liegen gebliebenes Fahrzeug, Abschleppen. Zum Absichern von Parkverstößen ist es nicht erlaubt.",
    legalReference: "§ 15 StVO; § 16 Abs. 2 StVO",
  }),
  q({
    code: "own-beleuchtung-006", topic: "beleuchtung", points: 2, difficulty: 0.4, tags: ["parken", "standlicht", "ausserorts", "dunkelheit"],
    text: "Muss ein geparktes Fahrzeug bei Dunkelheit beleuchtet werden?",
    answers: [t("Außerorts ja, mit Standlicht oder Parkleuchten"), t("Innerorts nicht, wenn die Straßenbeleuchtung das Fahrzeug auf ausreichende Entfernung erkennbar macht"), f("Nie, ein geparktes Fahrzeug braucht keine Beleuchtung", "Außerorts und auf unbeleuchteten Straßen ist die Beleuchtung Pflicht.")],
    explanation: "Haltende und parkende Fahrzeuge müssen bei Dunkelheit beleuchtet sein, außer innerorts, wo die Straßenbeleuchtung sie ausreichend sichtbar macht oder ein beleuchteter Parkplatz genutzt wird.",
    legalReference: "§ 17 Abs. 4 StVO",
  }),
  q({
    code: "own-beleuchtung-007", topic: "beleuchtung", points: 2, difficulty: 0.3, tags: ["nebelscheinwerfer", "nebel"],
    text: "Wann dürfen Nebelscheinwerfer eingeschaltet werden?",
    answers: [t("Bei erheblicher Sichtbehinderung durch Nebel, Schneefall oder Regen"), f("Immer bei Dunkelheit zusätzlich zum Abblendlicht", "Ohne Sichtbehinderung blenden sie unnötig."), f("Nur zusammen mit dem Fernlicht", "Nebelscheinwerfer werden mit Abblendlicht oder Standlicht kombiniert.")],
    explanation: "Nebelscheinwerfer dürfen nur bei erheblicher Sichtbehinderung durch Nebel, Schneefall oder Regen benutzt werden, anders als die Nebelschlussleuchte auch bei Sichtweiten über 50 Metern.",
    legalReference: "§ 17 Abs. 3 StVO",
  }),
  q({
    code: "own-beleuchtung-008", topic: "beleuchtung", points: 2, difficulty: 0.2, tags: ["standlicht", "abblendlicht", "dunkelheit"],
    text: "Dürfen Sie bei Dunkelheit nur mit Standlicht fahren?",
    answers: [t("Nein, während der Fahrt ist mindestens Abblendlicht erforderlich"), f("Ja, innerorts auf beleuchteten Straßen", "Auch innerorts muss mit Abblendlicht gefahren werden."), f("Ja, wenn die Geschwindigkeit unter 30 km/h liegt", "Die Geschwindigkeit ändert nichts an der Pflicht.")],
    explanation: "Standlicht dient nur zum Kenntlichmachen eines stehenden Fahrzeugs. Wer bei Dunkelheit fährt, muss mindestens Abblendlicht einschalten.",
    legalReference: "§ 17 Abs. 1 StVO",
  }),
  q({
    code: "own-beleuchtung-009", topic: "beleuchtung", points: 2, difficulty: 0.3, tags: ["leuchtweitenregulierung", "beladung"],
    text: "Sie haben den Kofferraum schwer beladen. Was ist bei der Beleuchtung zu beachten?",
    answers: [t("Die Leuchtweite anpassen, damit die Scheinwerfer den Gegenverkehr nicht blenden"), f("Nichts, die Beladung hat keinen Einfluss auf die Scheinwerfer", "Das Heck senkt sich, die Scheinwerfer leuchten höher."), f("Das Fernlicht dauerhaft einschalten, um die Absenkung auszugleichen", "Fernlicht würde erst recht blenden.")],
    explanation: "Bei schwerer Beladung senkt sich das Heck und die Scheinwerfer leuchten nach oben. Mit der Leuchtweitenregulierung wird der Lichtkegel wieder abgesenkt.",
    legalReference: "§ 50 StVZO",
  }),
];
