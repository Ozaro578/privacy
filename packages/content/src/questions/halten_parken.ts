// Übungsfragen zum Thema "halten_parken" (eigene Formulierungen, kein amtlicher Prüfungsinhalt).
import type { Question } from "../types";
import { q, t, f } from "./_helpers";

export const haltenParken: readonly Question[] = [
  q({
    code: "own-halten_parken-001", topic: "halten_parken", points: 2, difficulty: 0.2, tags: ["halten", "parken"],
    text: "Wann gilt das Abstellen eines Fahrzeugs als Parken?",
    answers: [t("Wenn das Fahrzeug verlassen wird oder länger als drei Minuten hält"), f("Erst ab 15 Minuten", "Die Grenze liegt bei drei Minuten."), f("Nur wenn der Motor abgestellt wird", "Entscheidend sind Dauer und Verlassen des Fahrzeugs, nicht der Motor.")],
    explanation: "Wer sein Fahrzeug verlässt oder länger als drei Minuten hält, parkt. Halten ist eine gewollte Fahrtunterbrechung, die nicht durch die Verkehrslage oder eine Anordnung veranlasst ist.",
    legalReference: "§ 12 Abs. 2 StVO",
  }),
  q({
    code: "own-halten_parken-002", topic: "halten_parken", points: 3, difficulty: 0.2, tags: ["parken", "kreuzung", "innerorts"], kind: "numeric", numericAnswer: 5, tolerance: 0, unit: "m",
    text: "Bis zu wie viel Meter vor und hinter den Schnittpunkten der Fahrbahnkanten einer Kreuzung ist das Parken verboten? Angabe in Metern.",
    answers: [],
    explanation: "Das Parken ist bis zu fünf Meter von den Schnittpunkten der Fahrbahnkanten an Kreuzungen und Einmündungen unzulässig, damit die Sicht frei bleibt.",
    legalReference: "§ 12 Abs. 3 Nr. 1 StVO",
  }),
  q({
    code: "own-halten_parken-003", topic: "halten_parken", points: 3, difficulty: 0.4, tags: ["parken", "kreuzung", "radweg"], kind: "numeric", numericAnswer: 8, tolerance: 0, unit: "m",
    text: "Neben der Fahrbahn ist ein Radweg baulich angelegt. Bis zu wie viel Meter vor der Kreuzung ist das Parken dann verboten? Angabe in Metern.",
    answers: [],
    explanation: "Ist neben der Fahrbahn ein Radweg baulich angelegt, gilt seit 2020 ein Parkverbot bis acht Meter vor den Schnittpunkten der Fahrbahnkanten, damit Radfahrende besser gesehen werden.",
    legalReference: "§ 12 Abs. 3 Nr. 1 StVO",
  }),
  q({
    code: "own-halten_parken-004", topic: "halten_parken", points: 3, difficulty: 0.3, tags: ["halten", "halteverbot"],
    text: "Wo ist bereits das Halten verboten?",
    answers: [t("An engen und an unübersichtlichen Straßenstellen"), t("Im Bereich scharfer Kurven"), t("Auf Bahnübergängen"), f("In Tempo-30-Zonen", "Dort gelten nur die allgemeinen Halte- und Parkregeln.")],
    explanation: "Das Halten ist unter anderem an engen und unübersichtlichen Stellen, in scharfen Kurven, auf Bahnübergängen, auf Fußgängerüberwegen und bis fünf Meter davor sowie vor und in Feuerwehrzufahrten verboten.",
    legalReference: "§ 12 Abs. 1 StVO",
  }),
  q({
    code: "own-halten_parken-005", topic: "halten_parken", points: 2, difficulty: 0.3, tags: ["parken", "haltestelle"], kind: "numeric", numericAnswer: 15, tolerance: 0, unit: "m",
    text: "Bis zu wie viel Meter vor und hinter dem Haltestellenschild (Zeichen 224) ist das Parken verboten? Angabe in Metern.",
    answers: [],
    explanation: "Vor und hinter dem Haltestellenzeichen ist das Parken jeweils bis 15 Meter verboten, damit Busse und Straßenbahnen die Haltestelle anfahren können.",
    legalReference: "§ 12 Abs. 3 Nr. 4 StVO",
  }),
  q({
    code: "own-halten_parken-006", topic: "halten_parken", points: 2, difficulty: 0.3, tags: ["parkscheibe", "parken"],
    text: "Sie kommen um 10:10 Uhr an einem Parkplatz mit Parkscheibenpflicht an. Welche Zeit stellen Sie ein?",
    answers: [t("10:30 Uhr, also die auf die Ankunft folgende halbe Stunde"), f("10:00 Uhr, abgerundet", "Es wird auf die nächste halbe Stunde aufgerundet, nicht abgerundet."), f("Genau 10:10 Uhr", "Die Parkscheibe wird auf halbe Stunden eingestellt.")],
    explanation: "Der Zeiger der Parkscheibe ist auf den Strich der halben Stunde zu stellen, die dem Ankunftszeitpunkt folgt. Bei Ankunft um 10:10 Uhr also auf 10:30 Uhr.",
    legalReference: "§ 13 Abs. 2 StVO",
  }),
  q({
    code: "own-halten_parken-007", topic: "halten_parken", points: 3, difficulty: 0.3, tags: ["parken", "sichern", "gefaelle"],
    text: "Wie sichern Sie Ihr Fahrzeug beim Parken an einem Gefälle gegen Wegrollen?",
    answers: [t("Feststellbremse anziehen"), t("Gang einlegen beziehungsweise Wählhebel auf P stellen"), t("Lenkung zum Bordstein hin einschlagen"), f("Warnblinklicht einschalten", "Das Warnblinklicht sichert nicht gegen Wegrollen.")],
    explanation: "Beim Verlassen des Fahrzeugs muss es gegen Wegrollen gesichert werden: Feststellbremse, eingelegter Gang oder Stellung P, und an Gefälle oder Steigung zusätzlich eingeschlagene Lenkung.",
    legalReference: "§ 14 Abs. 2 StVO",
  }),
  q({
    code: "own-halten_parken-008", topic: "halten_parken", points: 3, difficulty: 0.4, tags: ["parken", "linke_seite", "einbahnstrasse"],
    text: "Wann dürfen Sie am linken Fahrbahnrand halten oder parken?",
    answers: [t("In Einbahnstraßen"), t("Wenn rechts Schienen liegen"), f("Immer, wenn rechts kein Platz ist", "Platzmangel rechts erlaubt kein Linksparken.")],
    explanation: "Grundsätzlich wird rechts gehalten und geparkt. Links ist es nur in Einbahnstraßen erlaubt oder wenn auf der rechten Seite Schienen liegen.",
    legalReference: "§ 12 Abs. 4 StVO",
  }),
  q({
    code: "own-halten_parken-009", topic: "halten_parken", points: 3, difficulty: 0.3, tags: ["parken", "grundstuecksausfahrt"],
    text: "Was gilt für das Parken vor Grundstücksein- und -ausfahrten?",
    answers: [t("Davor ist das Parken verboten; auf schmalen Fahrbahnen auch gegenüber"), f("Parken ist erlaubt, wenn die Ausfahrt zum eigenen Grundstück gehört", "Auch der Berechtigte darf dort nicht parken, wenn dadurch andere Ausfahrten blockiert werden; die Regel gilt allgemein."), f("Nur das Halten ist verboten", "Halten ist erlaubt, das Parken ist verboten.")],
    explanation: "Vor Grundstücksein- und -ausfahrten darf nicht geparkt werden, auf schmalen Fahrbahnen auch nicht gegenüber. Kurzes Halten bleibt erlaubt.",
    legalReference: "§ 12 Abs. 3 Nr. 3 StVO",
  }),
  q({
    code: "own-halten_parken-010", topic: "halten_parken", points: 3, difficulty: 0.4, tags: ["halten", "schutzstreifen", "radverkehr"],
    text: "Dürfen Sie auf einem Schutzstreifen für den Radverkehr (gestrichelte Linie mit Fahrradsymbol) halten?",
    answers: [t("Nein, auf Schutzstreifen ist das Halten verboten"), f("Ja, bis zu drei Minuten", "Seit 2020 ist auf Schutzstreifen jedes Halten verboten."), f("Ja, zum Be- und Entladen", "Auch dafür darf der Schutzstreifen nicht genutzt werden.")],
    explanation: "Auf Schutzstreifen für den Radverkehr ist das Halten verboten. Bei Bedarf dürfen Kraftfahrzeuge nur vorübergehend auf den Schutzstreifen ausweichen, etwa bei Gegenverkehr.",
    legalReference: "§ 12 Abs. 1 StVO; Zeichen 340",
  }),
  q({
    code: "own-halten_parken-011", topic: "halten_parken", points: 2, difficulty: 0.2, tags: ["parken", "behindertenparkplatz"],
    text: "Wer darf auf einem mit Rollstuhlsymbol gekennzeichneten Parkplatz parken?",
    answers: [t("Nur Personen mit einem gültigen, sichtbar ausgelegten blauen Parkausweis für schwerbehinderte Menschen"), f("Jeder, wenn der Platz kurz genutzt wird", "Auch kurzes Parken ist dort unzulässig."), f("Jeder mit einem Schwerbehindertenausweis, auch ohne Parkausweis", "Entscheidend ist der spezielle Parkausweis, nicht der Schwerbehindertenausweis.")],
    explanation: "Behindertenparkplätze sind ausschließlich für Inhaber des blauen EU-Parkausweises. Der Ausweis muss gut lesbar hinter der Windschutzscheibe liegen.",
    legalReference: "§ 45 Abs. 1b StVO; § 46 StVO",
  }),
  q({
    code: "own-halten_parken-012", topic: "halten_parken", points: 2, difficulty: 0.4, tags: ["parken", "bahnuebergang", "andreaskreuz", "innerorts", "ausserorts"],
    text: "In welchem Abstand vor und hinter dem Andreaskreuz ist das Parken verboten?",
    answers: [t("Innerorts bis 5 Meter, außerorts bis 50 Meter"), f("Innerorts und außerorts jeweils 10 Meter", "Die Abstände unterscheiden sich je nach Ortslage."), f("Innerorts bis 15 Meter, außerorts bis 100 Meter", "Diese Werte sind zu groß.")],
    explanation: "Vor und hinter Andreaskreuzen ist das Parken innerorts bis fünf Meter und außerorts bis 50 Meter verboten, damit das Zeichen sichtbar bleibt.",
    legalReference: "§ 12 Abs. 3 Nr. 7 StVO",
  }),
];
