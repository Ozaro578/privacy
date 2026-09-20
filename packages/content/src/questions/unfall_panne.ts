// Übungsfragen zum Thema "unfall_panne" (eigene Formulierungen, kein amtlicher Prüfungsinhalt).
import type { Question } from "../types";
import { q, t, f } from "./_helpers";

export const unfallPanne: readonly Question[] = [
  q({
    code: "own-unfall_panne-001", topic: "unfall_panne", points: 3, difficulty: 0.3, tags: ["warndreieck", "autobahn", "absichern"],
    text: "In welcher Entfernung stellen Sie das Warndreieck auf der Autobahn nach der üblichen Faustregel auf?",
    answers: [t("Etwa 150 bis 200 Meter hinter dem Fahrzeug"), f("Etwa 50 Meter hinter dem Fahrzeug", "Das reicht auf der Autobahn bei hohen Geschwindigkeiten nicht aus."), f("Etwa 400 Meter hinter dem Fahrzeug", "So weit ist nicht nötig; üblich sind 150 bis 200 Meter.")],
    explanation: "Die StVO verlangt nur, das Warndreieck in ausreichender Entfernung aufzustellen; feste Meterangaben nennt sie nicht. Als Faustregel aus der Fahrpraxis gelten auf der Autobahn etwa 150 bis 200 Meter, auf Landstraßen etwa 100 Meter, innerorts etwa 50 Meter. Vor Kurven und Kuppen entsprechend weiter.",
    legalReference: "§ 15 Abs. 1 StVO (ausreichende Entfernung); Meterangaben sind Praxisempfehlung",
  }),
  q({
    code: "own-unfall_panne-002", topic: "unfall_panne", points: 2, difficulty: 0.3, tags: ["warndreieck", "ausserorts", "absichern"],
    text: "In welcher Entfernung stellen Sie das Warndreieck auf einer Landstraße nach der üblichen Faustregel auf?",
    answers: [t("Etwa 100 Meter hinter dem Fahrzeug"), f("Etwa 20 Meter hinter dem Fahrzeug", "Das ist zu nah, um nachfolgende Fahrzeuge rechtzeitig zu warnen."), f("Etwa 300 Meter hinter dem Fahrzeug", "Auf Landstraßen sind etwa 100 Meter üblich.")],
    explanation: "Die StVO schreibt nur eine ausreichende Entfernung vor, keine feste Meterzahl. Als Faustregel aus der Fahrpraxis gelten auf Landstraßen etwa 100 Meter. Wichtig ist, dass das Dreieck vor Kurven oder Kuppen für den nachfolgenden Verkehr rechtzeitig sichtbar ist.",
    legalReference: "§ 15 Abs. 1 StVO (ausreichende Entfernung); Meterangaben sind Praxisempfehlung",
  }),
  q({
    code: "own-unfall_panne-003", topic: "unfall_panne", points: 3, difficulty: 0.2, tags: ["unfall", "absichern", "rettungskette"],
    text: "Sie kommen als Erster an eine Unfallstelle mit Verletzten. Was ist die erste Maßnahme?",
    answers: [t("Die Unfallstelle absichern: Warnblinklicht, Warnweste, Warndreieck"), f("Sofort die Verletzten aus dem Fahrzeug ziehen", "Ohne Absicherung gefährden Sie sich und andere; Verletzte nur bei akuter Gefahr bewegen."), f("Erst die Versicherung anrufen", "Die Versicherung ist später an der Reihe.")],
    explanation: "Die Rettungskette beginnt mit dem Absichern der Unfallstelle, dann folgt der Notruf, dann die Erste Hilfe. Eigenschutz geht vor.",
    mnemonic: "Absichern, Notruf, Erste Hilfe.",
    legalReference: "§ 34 StVO; § 323c StGB",
  }),
  q({
    code: "own-unfall_panne-004", topic: "unfall_panne", points: 2, difficulty: 0.2, tags: ["notruf"],
    text: "Welche Angaben gehören zu einem vollständigen Notruf unter 112?",
    answers: [t("Wo ist es passiert?"), t("Was ist passiert und wie viele Verletzte gibt es?"), t("Warten auf Rückfragen der Leitstelle"), f("Eigene Versicherungsnummer", "Diese Angabe ist für den Rettungsdienst ohne Bedeutung.")],
    explanation: "Beim Notruf zählen die W-Fragen: Wo, Was, Wie viele Verletzte, Welche Verletzungen, und Warten auf Rückfragen. Die 112 ist europaweit die Notrufnummer.",
    mnemonic: "Wo, Was, Wie viele, Welche, Warten.",
  }),
  q({
    code: "own-unfall_panne-005", topic: "unfall_panne", points: 3, difficulty: 0.4, tags: ["unfallflucht", "parken", "sachschaden"],
    text: "Beim Ausparken beschädigen Sie ein geparktes Auto. Der Halter ist nicht auffindbar. Was müssen Sie tun?",
    answers: [t("Eine angemessene Zeit warten und danach unverzüglich die Polizei oder den Halter verständigen"), f("Einen Zettel mit Ihrer Telefonnummer hinterlassen und wegfahren", "Ein Zettel allein erfüllt die Pflichten nicht und kann als Unfallflucht gewertet werden."), f("Wegfahren, weil es nur ein kleiner Schaden ist", "Auch bei kleinen Schäden ist das unerlaubtes Entfernen vom Unfallort.")],
    explanation: "Nach einem Unfall müssen Sie eine angemessene Zeit am Unfallort warten. Trifft niemand ein, sind unverzüglich der Geschädigte oder die Polizei zu informieren.",
    legalReference: "§ 142 StGB; § 34 StVO",
  }),
  q({
    code: "own-unfall_panne-006", topic: "unfall_panne", points: 2, difficulty: 0.2, tags: ["warnweste", "ausruestung"],
    text: "Was muss in einem Pkw neben Warndreieck und Verbandkasten mitgeführt werden?",
    answers: [t("Mindestens eine Warnweste"), f("Ein Feuerlöscher", "Ein Feuerlöscher ist im Pkw nicht vorgeschrieben."), f("Ein Abschleppseil", "Ein Abschleppseil ist sinnvoll, aber nicht Pflicht.")],
    explanation: "In Pkw muss eine Warnweste mitgeführt werden, zusätzlich zu Warndreieck und Verbandkasten. Bei einer Panne oder einem Unfall sollte sie vor dem Aussteigen angelegt werden.",
    legalReference: "§ 53a StVZO; § 35h StVZO",
  }),
  q({
    code: "own-unfall_panne-007", topic: "unfall_panne", points: 4, difficulty: 0.3, tags: ["panne", "autobahn", "absichern"],
    text: "Sie haben eine Panne auf der Autobahn. Wie verhalten Sie sich richtig?",
    answers: [t("Auf den Seitenstreifen fahren und das Warnblinklicht einschalten"), t("Warnweste anziehen und das Warndreieck aufstellen"), t("Sich und Mitfahrende hinter der Schutzplanke in Sicherheit bringen"), f("Im Fahrzeug bleiben und auf den Pannendienst warten", "Im Fahrzeug auf dem Seitenstreifen besteht Lebensgefahr durch auffahrende Fahrzeuge.")],
    explanation: "Bei einer Panne auf der Autobahn: Seitenstreifen, Warnblinklicht, Warnweste, Warndreieck, dann hinter die Schutzplanke. Hilfe über die Notrufsäule oder die 112 anfordern.",
    legalReference: "§ 15 StVO",
  }),
  q({
    code: "own-unfall_panne-008", topic: "unfall_panne", points: 3, difficulty: 0.3, tags: ["erste_hilfe", "seitenlage"],
    text: "Eine verunglückte Person ist bewusstlos, atmet aber normal. Was tun Sie?",
    answers: [t("Die Person in die stabile Seitenlage bringen und die Atmung weiter überwachen"), f("Die Person auf den Rücken legen und den Kopf hochlagern", "In Rückenlage kann die Zunge die Atemwege verschließen."), f("Sofort mit der Herzdruckmassage beginnen", "Die Herzdruckmassage ist nur bei fehlender normaler Atmung angezeigt.")],
    explanation: "Bewusstlose mit normaler Atmung kommen in die stabile Seitenlage, damit die Atemwege frei bleiben. Atmet die Person nicht normal, beginnt die Wiederbelebung.",
  }),
  q({
    code: "own-unfall_panne-009", topic: "unfall_panne", points: 2, difficulty: 0.2, tags: ["hilfeleistung", "recht"],
    text: "Sie fahren an einem Unfall mit Verletzten vorbei, ohne zu helfen, obwohl es Ihnen zumutbar wäre. Was gilt?",
    answers: [t("Unterlassene Hilfeleistung ist eine Straftat"), f("Es ist eine Ordnungswidrigkeit mit Verwarnungsgeld", "Unterlassene Hilfeleistung ist im Strafgesetzbuch geregelt."), f("Es hat keine rechtlichen Folgen, wenn andere helfen könnten", "Jeder ist zur zumutbaren Hilfe verpflichtet.")],
    explanation: "Wer bei Unglücksfällen nicht hilft, obwohl es erforderlich und zumutbar ist, macht sich strafbar. Absichern und Notruf sind jedem zumutbar.",
    legalReference: "§ 323c StGB",
  }),
  q({
    code: "own-unfall_panne-010", topic: "unfall_panne", points: 2, difficulty: 0.3, tags: ["notrufsaeule", "autobahn"],
    text: "Woran erkennen Sie auf der Autobahn die Richtung zur nächsten Notrufsäule?",
    answers: [t("An den schwarzen Pfeilen auf den Leitpfosten"), f("An der Farbe der Leitplanken", "Die Leitplanken geben keine Richtung an."), f("Notrufsäulen stehen immer in Fahrtrichtung rechts nach jeder Ausfahrt", "Es gibt keine solche feste Regel; die Pfeile weisen den Weg.")],
    explanation: "Die kleinen Pfeile auf den Leitpfosten zeigen die Richtung zur nächsten Notrufsäule. Alternativ kann der Notruf über die 112 abgesetzt werden.",
  }),
  q({
    code: "own-unfall_panne-011", topic: "unfall_panne", points: 3, difficulty: 0.4, tags: ["erste_hilfe", "motorrad", "helm"],
    text: "Ein verunglückter Motorradfahrer ist bewusstlos und trägt einen Helm. Was ist richtig?",
    answers: [t("Den Helm vorsichtig abnehmen, um Atmung zu prüfen und die Atemwege freizuhalten"), f("Den Helm niemals abnehmen, das darf nur der Notarzt", "Bei Bewusstlosigkeit muss der Helm ab, sonst kann die Atmung nicht gesichert werden."), f("Den Helm aufsetzen lassen und den Fahrer aufrecht setzen", "Bewusstlose werden nicht aufgesetzt.")],
    explanation: "Bei bewusstlosen Motorradfahrern wird der Helm vorsichtig abgenommen, möglichst zu zweit und mit stabilisiertem Kopf. Danach Atmung prüfen und stabile Seitenlage.",
  }),
];
