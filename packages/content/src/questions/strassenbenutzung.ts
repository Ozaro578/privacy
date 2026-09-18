// Übungsfragen zum Thema "strassenbenutzung" (eigene Formulierungen, kein amtlicher Prüfungsinhalt).
import type { Question } from "../types.js";
import { q, t, f } from "./_helpers.js";

export const strassenbenutzung: readonly Question[] = [
  q({
    code: "own-strassenbenutzung-001", topic: "strassenbenutzung", points: 4, difficulty: 0.3, tags: ["rettungsgasse", "autobahn", "stau"],
    text: "Wo ist die Rettungsgasse auf einer Autobahn mit drei Fahrstreifen je Richtung zu bilden?",
    answers: [t("Zwischen dem linken und dem unmittelbar rechts daneben liegenden Fahrstreifen"), f("Zwischen dem mittleren und dem rechten Fahrstreifen", "Die Gasse liegt weiter links."), f("Erst, wenn ein Einsatzfahrzeug zu sehen ist", "Die Gasse ist zu bilden, sobald der Verkehr stockt.")],
    explanation: "Bei stockendem Verkehr weichen die Fahrzeuge auf dem linken Fahrstreifen nach links aus, alle anderen nach rechts. So entsteht die Gasse zwischen dem ganz linken und dem rechts daneben liegenden Fahrstreifen.",
    mnemonic: "Rechte-Hand-Regel: Daumen links, alle anderen Finger rechts.",
    legalReference: "§ 11 Abs. 2 StVO",
  }),
  q({
    code: "own-strassenbenutzung-002", topic: "strassenbenutzung", points: 3, difficulty: 0.3, tags: ["rettungsgasse", "stau"],
    text: "Wann muss die Rettungsgasse gebildet werden?",
    answers: [t("Sobald Fahrzeuge mit Schrittgeschwindigkeit fahren oder stehen"), f("Erst wenn Blaulicht oder Martinshorn wahrnehmbar sind", "Dann ist es oft zu spät, weil sich die Fahrzeuge nicht mehr bewegen können."), f("Nur wenn die Polizei dazu auffordert", "Die Pflicht besteht ohne Aufforderung.")],
    explanation: "Die Rettungsgasse ist auf Autobahnen und Außerortsstraßen mit mindestens zwei Fahrstreifen je Richtung zu bilden, sobald der Verkehr stockt, also spätestens bei Schrittgeschwindigkeit.",
    legalReference: "§ 11 Abs. 2 StVO",
  }),
  q({
    code: "own-strassenbenutzung-003", topic: "strassenbenutzung", points: 3, difficulty: 0.3, tags: ["autobahn", "einfaedeln", "beschleunigungsstreifen"],
    text: "Sie fahren auf die Autobahn auf. Wie verhalten Sie sich richtig?",
    answers: [t("Auf dem Beschleunigungsstreifen zügig beschleunigen und in eine ausreichende Lücke einfädeln"), f("Am Ende des Beschleunigungsstreifens anhalten und auf eine Lücke warten", "Anhalten ist gefährlich, weil nachfolgende Fahrzeuge damit nicht rechnen."), f("Einfach einscheren, weil der Auffahrende Vorrang hat", "Der Verkehr auf der durchgehenden Fahrbahn hat Vorfahrt.")],
    explanation: "Wer auf die Autobahn auffährt, hat keine Vorfahrt. Der Beschleunigungsstreifen dient dazu, die Geschwindigkeit an den fließenden Verkehr anzupassen und sicher einzufädeln.",
    legalReference: "§ 18 Abs. 3 StVO",
  }),
  q({
    code: "own-strassenbenutzung-004", topic: "strassenbenutzung", points: 2, difficulty: 0.3, tags: ["autobahn", "kraftfahrstrasse"],
    text: "Welche Fahrzeuge dürfen Autobahnen und Kraftfahrstraßen benutzen?",
    answers: [t("Nur Kraftfahrzeuge, deren bauartbedingte Höchstgeschwindigkeit mehr als 60 km/h beträgt"), f("Alle Kraftfahrzeuge", "Langsame Fahrzeuge sind ausgeschlossen."), f("Auch Mofas und Fahrräder, wenn sie den Seitenstreifen benutzen", "Sie dürfen Autobahnen nicht benutzen.")],
    explanation: "Autobahnen und Kraftfahrstraßen dürfen nur mit Kraftfahrzeugen benutzt werden, deren bauartbedingte Höchstgeschwindigkeit über 60 km/h liegt.",
    legalReference: "§ 18 Abs. 1 StVO",
  }),
  q({
    code: "own-strassenbenutzung-005", topic: "strassenbenutzung", points: 3, difficulty: 0.2, tags: ["autobahn", "wenden", "standstreifen"],
    text: "Was ist auf der Autobahn verboten?",
    answers: [t("Wenden"), t("Rückwärtsfahren"), t("Halten auf dem Seitenstreifen ohne Notfall"), f("Überholen", "Überholen ist auf der Autobahn grundsätzlich erlaubt.")],
    explanation: "Auf Autobahnen sind Wenden, Rückwärtsfahren und Halten verboten. Der Seitenstreifen darf nur in Notfällen oder bei Freigabe durch Verkehrszeichen benutzt werden.",
    legalReference: "§ 18 Abs. 7 und 8 StVO",
  }),
  q({
    code: "own-strassenbenutzung-006", topic: "strassenbenutzung", points: 2, difficulty: 0.3, tags: ["autobahn", "richtgeschwindigkeit"],
    text: "Was bedeutet die Richtgeschwindigkeit von 130 km/h auf Autobahnen?",
    answers: [t("Eine Empfehlung; wer schneller fährt, kann bei einem Unfall mithaften, auch ohne Verstoß gegen ein Tempolimit"), f("Eine verbindliche Höchstgeschwindigkeit", "Ohne Beschilderung gibt es auf Autobahnen für Pkw keine allgemeine Höchstgeschwindigkeit."), f("Sie gilt nur für Lkw", "Für Lkw gelten eigene, niedrigere Grenzen.")],
    explanation: "Die Richtgeschwindigkeit empfiehlt, auf Autobahnen nicht schneller als 130 km/h zu fahren. Wer deutlich schneller fährt, trägt bei einem Unfall eine erhöhte Betriebsgefahr und kann mithaften.",
    legalReference: "Autobahn-Richtgeschwindigkeits-Verordnung",
  }),
  q({
    code: "own-strassenbenutzung-007", topic: "strassenbenutzung", points: 3, difficulty: 0.3, tags: ["reissverschluss", "fahrstreifenwechsel"],
    text: "Ein Fahrstreifen endet. Wie funktioniert das Reißverschlussverfahren richtig?",
    answers: [t("Erst unmittelbar vor der Verengung einordnen; die Fahrzeuge wechseln sich dabei ab"), f("Möglichst frühzeitig auf den durchgehenden Fahrstreifen wechseln", "Frühes Einordnen verschenkt Fahrbahnfläche und verlängert den Stau."), f("Fahrzeuge auf dem durchgehenden Fahrstreifen müssen niemanden einfädeln lassen", "Sie müssen das abwechselnde Einordnen ermöglichen.")],
    explanation: "Beim Reißverschlussverfahren nutzen beide Fahrstreifen bis zur Verengung, dann fädeln die Fahrzeuge abwechselnd ein. Die Fahrzeuge auf dem durchgehenden Streifen müssen das ermöglichen.",
    legalReference: "§ 7 Abs. 4 StVO",
  }),
  q({
    code: "own-strassenbenutzung-008", topic: "strassenbenutzung", points: 3, difficulty: 0.5, tags: ["autobahn", "rechts_ueberholen", "stau"],
    text: "Auf der Autobahn hat sich auf dem linken Fahrstreifen eine langsam fahrende Fahrzeugschlange gebildet. Dürfen Sie auf dem rechten Fahrstreifen schneller fahren?",
    answers: [t("Ja, aber nur mit geringfügig höherer Geschwindigkeit als die Schlange"), f("Ja, mit beliebiger Geschwindigkeit", "Das Rechtsüberholen ist nur mit geringer Geschwindigkeitsdifferenz erlaubt."), f("Nein, niemals", "Bei einer Schlange auf dem linken Fahrstreifen ist es in engen Grenzen erlaubt.")],
    explanation: "Grundsätzlich wird links überholt. Steht oder fährt auf dem linken Fahrstreifen eine Fahrzeugschlange, darf rechts nur mit geringfügig höherer Geschwindigkeit vorbeigefahren werden.",
    legalReference: "§ 7 Abs. 2a StVO",
  }),
  q({
    code: "own-strassenbenutzung-009", topic: "strassenbenutzung", points: 4, difficulty: 0.2, tags: ["autobahn", "ausfahrt", "hohes_risiko"],
    text: "Sie haben Ihre Autobahnausfahrt verpasst. Was tun Sie?",
    answers: [t("Bis zur nächsten Ausfahrt weiterfahren"), f("Auf dem Seitenstreifen vorsichtig zurücksetzen", "Rückwärtsfahren ist auf der Autobahn verboten und lebensgefährlich."), f("Auf dem Verzögerungsstreifen anhalten und warten", "Halten ist dort verboten.")],
    explanation: "Eine verpasste Ausfahrt kostet nur Zeit. Rückwärtsfahren oder Wenden auf der Autobahn ist verboten und zählt zu den gefährlichsten Fahrfehlern überhaupt.",
    legalReference: "§ 18 Abs. 7 StVO",
  }),
  q({
    code: "own-strassenbenutzung-010", topic: "strassenbenutzung", points: 3, difficulty: 0.4, tags: ["gehweg", "radverkehr", "kinder"],
    text: "Welche Regeln gelten für Kinder, die mit dem Fahrrad unterwegs sind?",
    answers: [t("Kinder bis zum vollendeten achten Lebensjahr müssen den Gehweg benutzen"), t("Kinder bis zum vollendeten zehnten Lebensjahr dürfen den Gehweg benutzen"), f("Erwachsene dürfen ein Kind bis acht Jahre auf dem Gehweg nicht begleiten", "Eine geeignete Aufsichtsperson ab 16 Jahren darf das Kind auf dem Gehweg begleiten.")],
    explanation: "Kinder unter acht Jahren müssen mit dem Rad auf dem Gehweg fahren, Kinder unter zehn dürfen es. Eine Aufsichtsperson ab 16 Jahren darf ein Kind bis acht Jahre auf dem Gehweg begleiten.",
    legalReference: "§ 2 Abs. 5 StVO",
  }),
  q({
    code: "own-strassenbenutzung-011", topic: "strassenbenutzung", points: 3, difficulty: 0.3, tags: ["standstreifen", "autobahn"],
    text: "Wann dürfen Sie den Seitenstreifen der Autobahn zum Fahren benutzen?",
    answers: [t("Nur wenn er durch Verkehrszeichen zum Befahren freigegeben ist"), f("Immer, wenn auf den Fahrstreifen Stau ist", "Der Seitenstreifen ist kein Fahrstreifen."), f("Wenn Sie die nächste Ausfahrt erreichen wollen", "Auch dann bleibt das Befahren verboten.")],
    explanation: "Der Seitenstreifen ist für Notfälle und Pannenfahrzeuge da. Nur wenn Verkehrszeichen ihn ausdrücklich freigeben, darf er als Fahrstreifen genutzt werden.",
    legalReference: "§ 2 Abs. 1 StVO; Zeichen 223.1",
  }),
];
