// Übungsfragen zum Thema "fahrmanoever" (eigene Formulierungen, kein amtlicher Prüfungsinhalt).
import type { Question } from "../types";
import { q, t, f } from "./_helpers";

export const fahrmanoever: readonly Question[] = [
  q({
    code: "own-fahrmanoever-001", topic: "fahrmanoever", points: 3, difficulty: 0.2, tags: ["rechtsabbiegen", "blinken", "schulterblick"],
    text: "Wie bereiten Sie das Rechtsabbiegen richtig vor?",
    answers: [t("Rechtzeitig blinken, möglichst weit rechts einordnen, Geschwindigkeit verringern und vor dem Abbiegen den Schulterblick nach rechts machen"), f("Erst abbiegen und dann blinken", "Der Blinker muss vorher gesetzt werden."), f("Zur Fahrbahnmitte hin einordnen, um eine weite Kurve fahren zu können", "Rechtsabbieger ordnen sich möglichst weit rechts ein.")],
    explanation: "Rechtsabbiegen bedeutet: Spiegel, blinken, rechts einordnen, langsam fahren, Schulterblick. So werden Radfahrende und zu Fuß Gehende im toten Winkel erkannt.",
    legalReference: "§ 9 Abs. 1 StVO",
  }),
  q({
    code: "own-fahrmanoever-002", topic: "fahrmanoever", points: 3, difficulty: 0.3, tags: ["linksabbiegen", "einordnen", "einbahnstrasse"],
    text: "Was gilt beim Linksabbiegen?",
    answers: [t("Bis zur Fahrbahnmitte einordnen, bei Fahrbahnen für eine Richtung möglichst weit links"), t("Der Gegenverkehr muss durchfahren gelassen werden"), f("Immer möglichst weit rechts einordnen", "Das gilt für Rechtsabbieger.")],
    explanation: "Linksabbieger ordnen sich zur Mitte hin ein, in Einbahnstraßen ganz links. Vor dem Abbiegen ist der Gegenverkehr durchzulassen, und der Schulterblick nach links ist Pflicht.",
    legalReference: "§ 9 Abs. 1 und 3 StVO",
  }),
  q({
    code: "own-fahrmanoever-003", topic: "fahrmanoever", points: 3, difficulty: 0.5, tags: ["linksabbiegen", "gegenverkehr", "kreuzung"],
    text: "Sie und ein entgegenkommendes Fahrzeug wollen beide an derselben Kreuzung links abbiegen. Wie biegen Sie ab?",
    answers: [t("Voreinander, sofern Markierungen oder die Verkehrsführung nichts anderes verlangen"), f("Grundsätzlich hintereinander", "Die Regel ist voreinander; nur bei entsprechender Verkehrsführung wird hintereinander abgebogen."), f("Wer zuerst blinkt, biegt zuerst ab", "Die Reihenfolge des Blinkens spielt keine Rolle.")],
    explanation: "Entgegenkommende Linksabbieger biegen voreinander ab, es sei denn, Markierungen oder die Verkehrslage sehen ein Abbiegen hintereinander vor.",
    legalReference: "§ 9 Abs. 4 StVO",
  }),
  q({
    code: "own-fahrmanoever-004", topic: "fahrmanoever", points: 3, difficulty: 0.3, tags: ["ueberholen", "gegenverkehr"],
    text: "Unter welchen Voraussetzungen dürfen Sie überholen?",
    answers: [t("Wenn Gegenverkehr während des gesamten Überholvorgangs ausgeschlossen ist"), t("Wenn Sie mit wesentlich höherer Geschwindigkeit als der Überholte fahren können"), t("Wenn niemand behindert oder gefährdet wird"), f("Innerorts nur nach vorherigem Hupen", "Hupen ist innerorts zum Ankündigen des Überholens nicht erlaubt.")],
    explanation: "Überholt werden darf nur, wenn die Übersicht reicht, Gegenverkehr ausgeschlossen ist, eine deutlich höhere Geschwindigkeit möglich ist und niemand gefährdet wird. Der Überholvorgang muss zügig abgeschlossen werden.",
    legalReference: "§ 5 Abs. 2 StVO",
  }),
  q({
    code: "own-fahrmanoever-005", topic: "fahrmanoever", points: 3, difficulty: 0.3, tags: ["ueberholverbot", "ueberholen", "fussgaengerueberweg"],
    text: "Wo ist das Überholen verboten?",
    answers: [t("An unübersichtlichen Stellen wie Kuppen und Kurven"), t("An Fußgängerüberwegen"), t("Wo es durch Zeichen 276 oder eine durchgezogene Linie ausgeschlossen ist"), f("Grundsätzlich auf Autobahnen", "Auf Autobahnen ist Überholen erlaubt.")],
    explanation: "Überholverbote gelten bei unklarer Verkehrslage, an unübersichtlichen Stellen, an Fußgängerüberwegen, an Bahnübergängen und überall dort, wo Zeichen oder Markierungen es verbieten.",
    legalReference: "§ 5 Abs. 3 StVO; § 26 Abs. 3 StVO",
  }),
  q({
    code: "own-fahrmanoever-006", topic: "fahrmanoever", points: 3, difficulty: 0.2, tags: ["fahrstreifenwechsel", "blinken", "schulterblick"],
    text: "Wie führen Sie einen Fahrstreifenwechsel richtig durch?",
    answers: [t("Innen- und Außenspiegel prüfen, rechtzeitig blinken, Schulterblick machen und nur wechseln, wenn niemand gefährdet wird"), f("Blinken genügt, der nachfolgende Verkehr muss dann Platz machen", "Blinken gibt kein Vorrecht; die Gefährdung anderer muss ausgeschlossen sein."), f("Erst wechseln und dann blinken", "Der Blinker gehört vor den Wechsel.")],
    explanation: "Beim Fahrstreifenwechsel muss jede Gefährdung anderer ausgeschlossen sein. Reihenfolge: Spiegel, Blinker, Schulterblick, dann wechseln.",
    legalReference: "§ 7 Abs. 5 StVO",
  }),
  q({
    code: "own-fahrmanoever-007", topic: "fahrmanoever", points: 3, difficulty: 0.4, tags: ["wenden", "autobahn", "einbahnstrasse"],
    text: "Wo ist das Wenden verboten?",
    answers: [t("Auf Autobahnen"), t("Auf Kraftfahrstraßen"), t("In Einbahnstraßen"), f("In Sackgassen", "In Sackgassen muss man in der Regel wenden; verboten ist es dort nicht.")],
    explanation: "Wenden ist auf Autobahnen und Kraftfahrstraßen verboten. In Einbahnstraßen ist es ebenfalls unzulässig, weil man anschließend gegen die Fahrtrichtung fahren würde.",
    legalReference: "§ 18 Abs. 7 StVO; § 9 Abs. 5 StVO",
  }),
  q({
    code: "own-fahrmanoever-008", topic: "fahrmanoever", points: 2, difficulty: 0.2, tags: ["rueckwaertsfahren", "einweiser"],
    text: "Was ist beim Rückwärtsfahren zu beachten?",
    answers: [t("Nur langsam fahren, Gefährdung anderer ausschließen und sich nötigenfalls einweisen lassen"), f("Rückwärtsfahren ist auf allen Straßen ohne Einschränkung erlaubt", "Auf Autobahnen und Kraftfahrstraßen ist es verboten, und immer muss eine Gefährdung ausgeschlossen sein."), f("Andere Verkehrsteilnehmer müssen dem rückwärtsfahrenden Fahrzeug Platz machen", "Wer rückwärtsfährt, hat keinen Vorrang.")],
    explanation: "Beim Rückwärtsfahren ist die Sicht eingeschränkt. Deshalb nur mit Schrittgeschwindigkeit fahren, notfalls einweisen lassen und jede Gefährdung ausschließen.",
    legalReference: "§ 9 Abs. 5 StVO",
  }),
  q({
    code: "own-fahrmanoever-009", topic: "fahrmanoever", points: 4, difficulty: 0.4, tags: ["hindernis", "gegenverkehr", "vorbeifahren"],
    text: "Auf Ihrer Fahrbahnseite steht ein parkendes Fahrzeug, das Sie nur über die Gegenfahrbahn umfahren können. Gegenverkehr nähert sich. Wer muss warten?",
    answers: [t("Sie, denn wer an einem Hindernis auf seiner Seite vorbeifahren will, muss den Gegenverkehr durchfahren lassen"), f("Der Gegenverkehr, weil Sie zuerst da waren", "Das Hindernis befindet sich auf Ihrer Seite, also müssen Sie warten."), f("Wer schneller ist", "Geschwindigkeit begründet keinen Vorrang.")],
    explanation: "Wer an einem Hindernis auf seiner Fahrbahnseite vorbeifahren will, muss entgegenkommende Fahrzeuge durchfahren lassen und gegebenenfalls warten.",
    legalReference: "§ 6 StVO",
  }),
  q({
    code: "own-fahrmanoever-010", topic: "fahrmanoever", points: 3, difficulty: 0.5, tags: ["rechts_ueberholen", "innerorts", "fahrstreifen"],
    text: "Sie fahren innerorts auf einer Straße mit zwei markierten Fahrstreifen je Richtung. Dürfen Sie mit dem Pkw rechts schneller fahren als die Fahrzeuge links?",
    answers: [t("Ja, innerorts dürfen Kraftfahrzeuge bis 3,5 t bei mehreren Fahrstreifen für eine Richtung rechts schneller fahren als links"), f("Nein, rechts überholen ist immer verboten", "Innerorts gilt bei mehreren Fahrstreifen eine Ausnahme."), f("Nur wenn links ein Lkw fährt", "Die Ausnahme ist nicht auf bestimmte Fahrzeuge links beschränkt.")],
    explanation: "Innerhalb geschlossener Ortschaften dürfen Kraftfahrzeuge bis 3,5 t auf Fahrbahnen mit mehreren markierten Fahrstreifen für eine Richtung den Fahrstreifen frei wählen und rechts schneller fahren als links.",
    legalReference: "§ 7 Abs. 3 StVO",
  }),
  q({
    code: "own-fahrmanoever-011", topic: "fahrmanoever", points: 3, difficulty: 0.4, tags: ["strassenbahn", "ueberholen"],
    text: "Auf welcher Seite überholen Sie eine Straßenbahn?",
    answers: [t("Grundsätzlich rechts; links nur, wenn die Schienen so weit rechts liegen, dass rechts kein Platz ist, oder in Einbahnstraßen"), f("Grundsätzlich links wie bei allen Fahrzeugen", "Straßenbahnen bilden eine Ausnahme von der Linksüberholregel."), f("Straßenbahnen dürfen nie überholt werden", "Sie dürfen überholt werden, wenn es sicher ist.")],
    explanation: "Schienenfahrzeuge werden rechts überholt. Liegen die Schienen zu weit rechts oder handelt es sich um eine Einbahnstraße, darf links überholt werden.",
    legalReference: "§ 5 Abs. 7 StVO",
  }),
];
