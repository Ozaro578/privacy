// Übungsfragen zum Thema "befoerderung" (eigene Formulierungen, kein amtlicher Prüfungsinhalt).
import type { Question } from "../types.js";
import { q, t, f } from "./_helpers.js";

export const befoerderung: readonly Question[] = [
  q({
    code: "own-befoerderung-001", topic: "befoerderung", points: 3, difficulty: 0.2, tags: ["kindersitz", "kinder", "gurt"],
    text: "Bis zu welchem Alter und welcher Körpergröße müssen Kinder im Auto in einer Rückhalteeinrichtung (Kindersitz) gesichert werden?",
    answers: [t("Kinder unter 12 Jahren, die kleiner als 150 cm sind"), f("Alle Kinder unter 14 Jahren unabhängig von der Größe", "Maßgeblich sind Alter und Größe zusammen."), f("Nur Kinder unter 6 Jahren", "Die Pflicht gilt deutlich länger.")],
    explanation: "Kinder bis zum vollendeten 12. Lebensjahr, die kleiner als 150 cm sind, müssen in einem geeigneten und zugelassenen Kindersitz mitfahren. Der Fahrer ist dafür verantwortlich.",
    legalReference: "§ 21 Abs. 1a StVO",
  }),
  q({
    code: "own-befoerderung-002", topic: "befoerderung", points: 3, difficulty: 0.3, tags: ["ladung", "ueberstand", "kennzeichnung"],
    text: "Ihre Ladung ragt mehr als einen Meter über die Rückstrahler des Fahrzeugs hinaus. Wie ist sie zu kennzeichnen?",
    answers: [t("Mit einer hellroten Fahne oder einem hellroten Schild von mindestens 30 mal 30 cm; bei Dunkelheit zusätzlich mit roter Leuchte und rotem Rückstrahler"), f("Gar nicht, solange die Ladung gesichert ist", "Ab einem Meter Überstand ist die Kennzeichnung Pflicht."), f("Mit einem weißen Tuch beliebiger Größe", "Vorgeschrieben ist hellrot und eine Mindestgröße.")],
    explanation: "Ragt Ladung mehr als einen Meter über die Rückstrahler hinaus, muss das Ende mit einer hellroten Fahne oder einem hellroten Schild von mindestens 30 mal 30 cm kenntlich gemacht werden. Bei Dunkelheit kommen rote Leuchte und roter Rückstrahler hinzu.",
    legalReference: "§ 22 Abs. 4 StVO",
  }),
  q({
    code: "own-befoerderung-003", topic: "befoerderung", points: 2, difficulty: 0.4, tags: ["ladung", "ueberstand"],
    text: "Wie weit darf Ladung nach hinten über das Fahrzeug hinausragen?",
    answers: [t("Bis zu 1,5 Meter; bei Fahrten bis 100 km bis zu 3 Meter"), f("Unbegrenzt, wenn sie gekennzeichnet ist", "Es gibt feste Höchstmaße."), f("Höchstens 50 cm", "Erlaubt ist mehr, sofern die Kennzeichnung erfolgt.")],
    explanation: "Ladung darf nach hinten bis 1,5 Meter über das Fahrzeug hinausragen, bei Fahrten bis 100 Kilometer bis zu 3 Meter. Ab einem Meter Überstand ist sie zu kennzeichnen.",
    legalReference: "§ 22 Abs. 4 StVO",
  }),
  q({
    code: "own-befoerderung-004", topic: "befoerderung", points: 3, difficulty: 0.4, tags: ["anhaenger", "klasse_b"],
    text: "Welche Anhänger dürfen Sie mit der Klasse B ziehen?",
    answers: [t("Anhänger bis 750 kg zulässiger Gesamtmasse immer"), t("Schwerere Anhänger, wenn die zulässige Gesamtmasse der Kombination 3.500 kg nicht übersteigt"), f("Jeden Anhänger bis 3.500 kg zulässiger Gesamtmasse", "Dafür ist die Klasse BE erforderlich.")],
    explanation: "Mit Klasse B sind Anhänger bis 750 kg immer erlaubt. Schwerere Anhänger nur, wenn Zugfahrzeug und Anhänger zusammen höchstens 3.500 kg zulässige Gesamtmasse haben; für mehr braucht man B96 oder BE.",
    legalReference: "§ 6 FeV",
  }),
  q({
    code: "own-befoerderung-005", topic: "befoerderung", points: 3, difficulty: 0.3, tags: ["ladungssicherung", "ladung"],
    text: "Wie muss Ladung im Fahrzeug gesichert sein?",
    answers: [t("So, dass sie auch bei Vollbremsung oder Ausweichmanöver nicht verrutschen, umfallen oder herabfallen kann"), f("Nur so, dass sie beim normalen Fahren nicht klappert", "Ladung muss auch bei Vollbremsung und Ausweichmanöver sicher bleiben."), f("Schwere Gegenstände gehören auf die Hutablage, damit sie sichtbar bleiben", "Lose Gegenstände auf der Hutablage werden bei einer Bremsung zu Geschossen.")],
    explanation: "Ladung ist so zu verstauen und zu sichern, dass sie selbst bei Vollbremsung oder plötzlicher Ausweichbewegung nicht verrutschen kann. Zurrgurte, Antirutschmatten und Trennnetze helfen dabei.",
    legalReference: "§ 22 Abs. 1 StVO",
  }),
  q({
    code: "own-befoerderung-006", topic: "befoerderung", points: 2, difficulty: 0.2, tags: ["gurt", "gurtpflicht"],
    text: "Was gilt zur Gurtpflicht im Pkw?",
    answers: [t("Alle Insassen müssen sich anschnallen, auch auf den Rücksitzen"), t("Der Fahrer ist dafür verantwortlich, dass Kinder vorschriftsmäßig gesichert sind"), f("Auf dem Rücksitz besteht keine Gurtpflicht", "Die Gurtpflicht gilt auf allen Sitzplätzen mit Gurten.")],
    explanation: "Alle Insassen müssen während der Fahrt angeschnallt sein. Erwachsene sind selbst verantwortlich, für Kinder trägt der Fahrer die Verantwortung.",
    legalReference: "§ 21a StVO; § 21 Abs. 1a StVO",
  }),
  q({
    code: "own-befoerderung-007", topic: "befoerderung", points: 3, difficulty: 0.3, tags: ["kindersitz", "airbag"],
    text: "Sie wollen eine rückwärtsgerichtete Babyschale auf dem Beifahrersitz befestigen. Was müssen Sie beachten?",
    answers: [t("Der Beifahrer-Frontairbag muss deaktiviert sein"), f("Nichts, der Airbag schützt das Kind zusätzlich", "Ein auslösender Airbag kann für ein Kind in einer rückwärtsgerichteten Schale tödlich sein."), f("Rückwärtsgerichtete Sitze sind auf dem Beifahrersitz generell verboten", "Sie sind erlaubt, wenn der Airbag abgeschaltet ist.")],
    explanation: "Rückwärtsgerichtete Kindersitze dürfen auf dem Beifahrersitz nur benutzt werden, wenn der Frontairbag deaktiviert ist. Andernfalls droht bei Auslösung schwere Verletzungsgefahr.",
    legalReference: "§ 35a StVZO; § 21 StVO",
  }),
  q({
    code: "own-befoerderung-008", topic: "befoerderung", points: 2, difficulty: 0.4, tags: ["ladung", "abmessungen"],
    text: "Welche Höhe und Breite dürfen Fahrzeug und Ladung zusammen höchstens haben?",
    answers: [t("Höchstens 4 Meter hoch und 2,55 Meter breit"), f("Höchstens 3 Meter hoch und 2 Meter breit", "Die erlaubten Maße sind größer."), f("Es gibt keine Begrenzung, wenn die Ladung gekennzeichnet ist", "Es gelten feste Höchstmaße.")],
    explanation: "Fahrzeug und Ladung dürfen zusammen höchstens 4 Meter hoch und 2,55 Meter breit sein. Bei größeren Abmessungen ist eine Ausnahmegenehmigung nötig.",
    legalReference: "§ 22 Abs. 2 StVO",
  }),
  q({
    code: "own-befoerderung-009", topic: "befoerderung", points: 2, difficulty: 0.2, tags: ["tiere", "ladung"],
    text: "Sie nehmen Ihren Hund im Auto mit. Was ist richtig?",
    answers: [t("Der Hund muss gesichert werden, etwa mit Gurtsystem, Transportbox oder Trenngitter"), f("Der Hund darf frei auf der Rückbank liegen", "Ungesicherte Tiere werden bei einer Bremsung zur Gefahr für alle Insassen."), f("Der Hund darf auf dem Schoß des Beifahrers sitzen", "Das gefährdet Beifahrer und Tier bei Airbagauslösung.")],
    explanation: "Tiere gelten rechtlich als Ladung und müssen so gesichert werden, dass sie weder den Fahrer ablenken noch bei einer Bremsung durch das Fahrzeug geschleudert werden.",
    legalReference: "§ 22 Abs. 1 StVO; § 23 Abs. 1 StVO",
  }),
  q({
    code: "own-befoerderung-010", topic: "befoerderung", points: 2, difficulty: 0.4, tags: ["anhaenger", "abreissseil"],
    text: "Wozu dient das Abreißseil an einem Anhänger mit Auflaufbremse?",
    answers: [t("Es betätigt die Bremse des Anhängers, wenn sich der Anhänger vom Zugfahrzeug löst"), f("Es hält den Anhänger zusätzlich an der Kupplung fest", "Das Seil ist kein zweiter Halt, sondern löst die Bremse aus."), f("Es verbindet die Elektrik von Anhänger und Zugfahrzeug", "Dafür gibt es den Stecker der Anhängerkupplung.")],
    explanation: "Das Abreißseil wird am Zugfahrzeug eingehängt. Löst sich der Anhänger, zieht das Seil die Feststellbremse des Anhängers und bremst ihn ab.",
    legalReference: "§ 41 StVZO",
  }),
];
