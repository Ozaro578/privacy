// Übungsfragen zum Thema "andere_teilnehmer" (eigene Formulierungen, kein amtlicher Prüfungsinhalt).
import type { Question } from "../types.js";
import { q, t, f } from "./_helpers.js";

export const andereTeilnehmer: readonly Question[] = [
  q({
    code: "own-andere_teilnehmer-001", topic: "andere_teilnehmer", points: 3, difficulty: 0.2, tags: ["radverkehr", "ueberholen", "innerorts", "ausserorts"],
    text: "Welchen seitlichen Mindestabstand müssen Sie beim Überholen von Radfahrenden einhalten?",
    answers: [t("Innerorts 1,5 Meter und außerorts 2 Meter"), f("Innerorts 1 Meter und außerorts 1,5 Meter", "Die vorgeschriebenen Abstände sind größer."), f("Es gibt keinen festen Mindestabstand", "Seit 2020 sind feste Mindestabstände vorgeschrieben.")],
    explanation: "Beim Überholen von Radfahrenden, zu Fuß Gehenden und Elektrokleinstfahrzeugen gilt ein seitlicher Mindestabstand von 1,5 Metern innerorts und 2 Metern außerorts.",
    legalReference: "§ 5 Abs. 4 StVO",
  }),
  q({
    code: "own-andere_teilnehmer-002", topic: "andere_teilnehmer", points: 4, difficulty: 0.3, tags: ["fussgaengerueberweg", "zebrastreifen", "halten"],
    text: "Ein Fußgänger steht am Zebrastreifen und will erkennbar die Straße überqueren. Was gilt?",
    answers: [t("Sie müssen dem Fußgänger das Überqueren ermöglichen, notfalls anhalten"), t("Am Fußgängerüberweg dürfen Sie nicht überholen"), f("Sie dürfen hupen, damit der Fußgänger wartet", "Fußgänger haben am Zebrastreifen Vorrang.")],
    explanation: "Am Fußgängerüberweg haben Fußgänger, die ihn erkennbar benutzen wollen, Vorrang. Fahrzeuge dürfen sich nur mit mäßiger Geschwindigkeit nähern und müssen nötigenfalls warten; Überholen ist dort verboten.",
    legalReference: "§ 26 StVO",
  }),
  q({
    code: "own-andere_teilnehmer-003", topic: "andere_teilnehmer", points: 3, difficulty: 0.3, tags: ["linienbus", "warnblinklicht", "haltestelle"],
    text: "Ein Linienbus steht mit eingeschaltetem Warnblinklicht an einer Haltestelle. Was gilt?",
    answers: [t("Sie dürfen nur mit Schrittgeschwindigkeit und mit ausreichendem Abstand vorbeifahren"), t("Das gilt auch für den Gegenverkehr"), f("Sie dürfen normal weiterfahren, das Warnblinklicht betrifft nur den nachfolgenden Verkehr", "Das Warnblinklicht verpflichtet beide Richtungen zur Schrittgeschwindigkeit.")],
    explanation: "Steht ein Bus mit Warnblinklicht an der Haltestelle, darf nur mit Schrittgeschwindigkeit und so vorbeigefahren werden, dass Fahrgäste nicht gefährdet werden. Nähert sich der Bus mit Warnblinklicht der Haltestelle, darf er nicht überholt werden.",
    legalReference: "§ 20 Abs. 4 StVO",
  }),
  q({
    code: "own-andere_teilnehmer-004", topic: "andere_teilnehmer", points: 3, difficulty: 0.3, tags: ["linienbus", "haltestelle", "innerorts"],
    text: "Ein Linienbus blinkt links und will innerorts von der Haltestelle abfahren. Wie verhalten Sie sich?",
    answers: [t("Dem Bus das Abfahren ermöglichen, notfalls warten"), f("Zügig vorbeifahren, weil Sie Vorrang haben", "Innerorts müssen Linienbusse beim Abfahren von Haltestellen durchgelassen werden."), f("Hupen, damit der Bus wartet", "Der Bus darf abfahren; Hupen ist hier unzulässig.")],
    explanation: "Innerhalb geschlossener Ortschaften ist Linienbussen und Schulbussen das Abfahren von gekennzeichneten Haltestellen zu ermöglichen. Wenn nötig, muss man warten.",
    legalReference: "§ 20 Abs. 5 StVO",
  }),
  q({
    code: "own-andere_teilnehmer-005", topic: "andere_teilnehmer", points: 3, difficulty: 0.2, tags: ["kinder", "innerorts", "bremsbereitschaft"],
    text: "Am Fahrbahnrand spielen Kinder mit einem Ball. Wie verhalten Sie sich?",
    answers: [t("Geschwindigkeit deutlich verringern, bremsbereit sein und mit plötzlichem Betreten der Fahrbahn rechnen"), f("Hupen und mit unveränderter Geschwindigkeit weiterfahren", "Kinder reagieren auf Hupen oft unvorhersehbar."), f("Auf die Gegenfahrbahn ausweichen und normal weiterfahren", "Das schafft neue Gefahren und löst das Problem nicht.")],
    explanation: "Kinder handeln spontan und können Geschwindigkeiten schlecht einschätzen. Gegenüber Kindern, Hilfsbedürftigen und älteren Menschen ist besondere Rücksicht durch geringere Geschwindigkeit und Bremsbereitschaft Pflicht.",
    legalReference: "§ 3 Abs. 2a StVO",
  }),
  q({
    code: "own-andere_teilnehmer-006", topic: "andere_teilnehmer", points: 2, difficulty: 0.3, tags: ["e_scooter", "elektrokleinstfahrzeuge"],
    text: "Welche Regeln gelten für E-Scooter (Elektrokleinstfahrzeuge)?",
    answers: [t("Sie dürfen ab 14 Jahren gefahren werden"), t("Die bauartbedingte Höchstgeschwindigkeit beträgt 20 km/h"), t("Sie müssen Radwege benutzen, wenn vorhanden, sonst die Fahrbahn"), f("Es besteht Helmpflicht", "Ein Helm ist empfohlen, aber nicht vorgeschrieben.")],
    explanation: "E-Scooter dürfen ab 14 Jahren gefahren werden, sind auf 20 km/h begrenzt und gehören auf Radwege oder die Fahrbahn, nicht auf den Gehweg. Eine Helmpflicht besteht nicht, Mitfahrer sind verboten.",
    legalReference: "Elektrokleinstfahrzeuge-Verordnung (eKFV)",
  }),
  q({
    code: "own-andere_teilnehmer-007", topic: "andere_teilnehmer", points: 2, difficulty: 0.4, tags: ["lkw", "rechtsabbiegen", "innerorts", "radverkehr"],
    text: "Ein Lkw über 3,5 t biegt innerorts rechts ab, Radverkehr ist zu erwarten. Wie schnell darf er dabei höchstens fahren?",
    answers: [t("Schrittgeschwindigkeit"), f("30 km/h", "Die vorgeschriebene Geschwindigkeit ist deutlich niedriger."), f("50 km/h", "Innerorts gilt beim Rechtsabbiegen mit Lkw eine besondere Grenze.")],
    explanation: "Kraftfahrzeuge über 3,5 t dürfen innerorts beim Rechtsabbiegen nur Schrittgeschwindigkeit fahren, wenn mit Rad- oder Fußverkehr zu rechnen ist. Als Radfahrer oder Pkw-Fahrer sollte man den toten Winkel neben Lkw meiden.",
    legalReference: "§ 9 Abs. 6 StVO",
  }),
  q({
    code: "own-andere_teilnehmer-008", topic: "andere_teilnehmer", points: 4, difficulty: 0.4, tags: ["strassenbahn", "haltestelle", "fahrgaeste"],
    text: "An einer Straßenbahnhaltestelle ohne Verkehrsinsel steigen Fahrgäste ein und aus. Wie fahren Sie rechts an der Straßenbahn vorbei?",
    answers: [t("Nur mit Schrittgeschwindigkeit und mit so großem Abstand, dass Fahrgäste nicht gefährdet werden; wenn nötig, warten"), t("Fahrgäste dürfen weder behindert noch gefährdet werden"), f("Links an der Straßenbahn vorbei, weil rechts die Fahrgäste stehen", "Straßenbahnen werden grundsätzlich rechts überholt.")],
    explanation: "An Haltestellen ohne Verkehrsinsel darf rechts an Schienenfahrzeugen nur mit Schrittgeschwindigkeit und ausreichendem Abstand vorbeigefahren werden. Wenn Fahrgäste ein- oder aussteigen, ist zu warten.",
    legalReference: "§ 20 Abs. 2 und 3 StVO",
  }),
  q({
    code: "own-andere_teilnehmer-009", topic: "andere_teilnehmer", points: 2, difficulty: 0.2, tags: ["aeltere_menschen", "menschen_mit_behinderung"],
    text: "Eine Person mit weißem Stock möchte die Straße überqueren. Wie verhalten Sie sich?",
    answers: [t("Anhalten und der Person ausreichend Zeit zum Überqueren geben"), f("Vorbeifahren, wenn die Person noch nicht auf der Fahrbahn ist", "Blinde und sehbehinderte Menschen können den Verkehr nicht einschätzen; sie brauchen besondere Rücksicht."), f("Kurz hupen, um auf sich aufmerksam zu machen", "Hupen erschreckt und hilft der Person nicht.")],
    explanation: "Ein weißer Stock oder eine gelbe Armbinde mit schwarzen Punkten kennzeichnet blinde oder sehbehinderte Menschen. Ihnen gegenüber ist besondere Rücksicht Pflicht, auch durch Anhalten.",
    legalReference: "§ 3 Abs. 2a StVO",
  }),
  q({
    code: "own-andere_teilnehmer-010", topic: "andere_teilnehmer", points: 2, difficulty: 0.3, tags: ["radverkehr", "nebeneinander"],
    text: "Dürfen Radfahrende nebeneinander fahren?",
    answers: [t("Ja, wenn dadurch der übrige Verkehr nicht behindert wird"), f("Nein, niemals außerhalb von Fahrradstraßen", "Seit 2020 ist das Nebeneinanderfahren grundsätzlich erlaubt, solange niemand behindert wird."), f("Nur auf Radwegen", "Auch auf der Fahrbahn ist es unter der genannten Bedingung erlaubt.")],
    explanation: "Radfahrende dürfen nebeneinander fahren, wenn sie den übrigen Verkehr dadurch nicht behindern. Autofahrer müssen beim Überholen auch dann den vollen Seitenabstand einhalten.",
    legalReference: "§ 2 Abs. 4 StVO",
  }),
  q({
    code: "own-andere_teilnehmer-011", topic: "andere_teilnehmer", points: 2, difficulty: 0.3, tags: ["motorrad", "wahrnehmung"],
    text: "Warum werden Motorräder im Verkehr häufig übersehen oder falsch eingeschätzt?",
    answers: [t("Ihre schmale Silhouette lässt Entfernung und Geschwindigkeit schwer abschätzen"), f("Weil sie immer langsamer fahren als Pkw", "Motorräder beschleunigen oft schneller als Pkw."), f("Weil sie kein Licht führen müssen", "Motorräder fahren mit eingeschaltetem Licht.")],
    explanation: "Motorräder sind schmal, können sich in der Wahrnehmung mit dem Hintergrund vermischen und beschleunigen schnell. Beim Abbiegen und Fahrstreifenwechsel besonders auf sie achten.",
  }),
];
