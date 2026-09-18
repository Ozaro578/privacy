// Übungsfragen zum Thema "kreisverkehr" (eigene Formulierungen, kein amtlicher Prüfungsinhalt).
import type { Question } from "../types.js";
import { q, t, f } from "./_helpers.js";

export const kreisverkehr: readonly Question[] = [
  q({
    code: "own-kreisverkehr-001", topic: "kreisverkehr", points: 4, difficulty: 0.2, tags: ["vorfahrt_beschildert", "einfahren"],
    text: "Vor einem Kreisverkehr stehen die Zeichen 215 (Kreisverkehr) und 205 (Vorfahrt gewähren). Wer hat Vorfahrt?",
    answers: [t("Die Fahrzeuge im Kreisverkehr; Einfahrende müssen Vorfahrt gewähren"), f("Die einfahrenden Fahrzeuge, weil sie von rechts kommen", "Das Zeichen 205 hebt rechts vor links auf."), f("Wer schneller ist", "Geschwindigkeit begründet keine Vorfahrt.")],
    explanation: "Bei dieser üblichen Beschilderung hat der Verkehr im Kreis Vorfahrt. Wer einfahren will, muss warten, bis eine ausreichende Lücke entsteht.",
    legalReference: "§ 8 Abs. 1a StVO; Zeichen 215 und 205",
  }),
  q({
    code: "own-kreisverkehr-002", topic: "kreisverkehr", points: 3, difficulty: 0.2, tags: ["blinken", "einfahren"],
    text: "Müssen Sie beim Einfahren in einen Kreisverkehr blinken?",
    answers: [t("Nein, beim Einfahren wird nicht geblinkt"), f("Ja, nach rechts", "Ein Blinker beim Einfahren ist nicht vorgesehen und kann andere irritieren."), f("Ja, nach links, um die Kreisfahrt anzuzeigen", "Beim Einfahren ist Blinken nicht erlaubt.")],
    explanation: "Beim Einfahren in einen Kreisverkehr darf nicht geblinkt werden. Geblinkt wird nur beim Verlassen des Kreisverkehrs nach rechts.",
    mnemonic: "Rein ohne Blinken, raus mit Blinken.",
    legalReference: "§ 8 Abs. 1a StVO",
  }),
  q({
    code: "own-kreisverkehr-003", topic: "kreisverkehr", points: 3, difficulty: 0.2, tags: ["blinken", "ausfahren"],
    text: "Wie zeigen Sie das Verlassen des Kreisverkehrs an?",
    answers: [t("Rechtzeitig vor der gewünschten Ausfahrt nach rechts blinken"), f("Gar nicht, im Kreisverkehr wird nicht geblinkt", "Beim Ausfahren ist Blinken vorgeschrieben."), f("Nach links blinken, solange Sie im Kreis bleiben", "Linksblinken ist im Kreisverkehr nicht vorgesehen.")],
    explanation: "Das Ausfahren aus dem Kreisverkehr ist ein Abbiegevorgang und muss durch Blinken nach rechts angekündigt werden. So wissen Wartende, ob sie einfahren können.",
    legalReference: "§ 9 Abs. 1 StVO; § 8 Abs. 1a StVO",
  }),
  q({
    code: "own-kreisverkehr-004", topic: "kreisverkehr", points: 2, difficulty: 0.3, tags: ["mittelinsel"],
    text: "Dürfen Sie die Mittelinsel eines Kreisverkehrs überfahren?",
    answers: [t("Nein, nur mit großen Fahrzeugen, wenn es wegen der Abmessungen unvermeidbar ist"), f("Ja, wenn der Kreisverkehr leer ist", "Die Mittelinsel darf nicht abgekürzt werden."), f("Ja, mit Pkw immer, mit Lkw nie", "Es ist umgekehrt: Nur große Fahrzeuge dürfen sie im Ausnahmefall überfahren.")],
    explanation: "Die Mittelinsel darf nicht überfahren werden, es sei denn, das Fahrzeug ist so groß, dass es anders nicht durch den Kreis kommt.",
    legalReference: "§ 9a Abs. 1 StVO",
  }),
  q({
    code: "own-kreisverkehr-005", topic: "kreisverkehr", points: 2, difficulty: 0.3, tags: ["halten"],
    text: "Dürfen Sie auf der Fahrbahn im Kreisverkehr halten?",
    answers: [t("Nein, das Halten auf der Fahrbahn im Kreisverkehr ist verboten"), f("Ja, bis zu drei Minuten", "Halten ist im Kreisverkehr generell verboten."), f("Ja, wenn der Warnblinker eingeschaltet ist", "Der Warnblinker erlaubt kein Halten.")],
    explanation: "Im Kreisverkehr ist das Halten auf der Fahrbahn verboten. Ausgenommen sind nur verkehrsbedingte Gründe, etwa Warten wegen Fußgängern an einer Ausfahrt.",
    legalReference: "§ 9a Abs. 2 StVO",
  }),
  q({
    code: "own-kreisverkehr-006", topic: "kreisverkehr", points: 4, difficulty: 0.5, tags: ["rechts_vor_links", "einfahren"],
    text: "Ein Kreisverkehr ist nicht durch Verkehrszeichen geregelt. Wer hat Vorfahrt?",
    answers: [t("Die einfahrenden Fahrzeuge, weil rechts vor links gilt"), f("Die Fahrzeuge im Kreis", "Ohne Zeichen 205 an den Zufahrten gilt die Grundregel rechts vor links."), f("Wer zuerst da war", "Ankunftszeit regelt keine Vorfahrt.")],
    explanation: "Ohne Beschilderung gilt an den Zufahrten die Grundregel rechts vor links: Wer in den Kreis einfahren will, kommt für die Fahrzeuge im Kreis von rechts und hat Vorfahrt.",
    legalReference: "§ 8 Abs. 1 StVO",
  }),
  q({
    code: "own-kreisverkehr-007", topic: "kreisverkehr", points: 4, difficulty: 0.4, tags: ["ausfahren", "fussgaenger", "radverkehr"],
    text: "Sie verlassen den Kreisverkehr. An der Ausfahrt überqueren Fußgänger einen Zebrastreifen und ein Radfahrer nutzt den umlaufenden Radweg. Was gilt?",
    answers: [t("Fußgänger am Zebrastreifen und Radfahrende auf dem Radweg müssen durchgelassen werden"), f("Sie haben Vorrang, weil Sie im Kreis fahren", "Beim Ausfahren gelten die Abbiegeregeln."), f("Nur Fußgänger müssen durchgelassen werden, nicht Radfahrende", "Auch Radfahrende sind beim Abbiegen durchzulassen.")],
    explanation: "Das Verlassen des Kreisverkehrs ist ein Abbiegevorgang. Fußgänger am Zebrastreifen und Radfahrende auf dem begleitenden Radweg sind durchzulassen.",
    legalReference: "§ 9 Abs. 3 StVO; § 26 StVO",
  }),
  q({
    code: "own-kreisverkehr-008", topic: "kreisverkehr", points: 2, difficulty: 0.1, tags: ["fahrtrichtung"],
    text: "In welche Richtung wird ein Kreisverkehr befahren?",
    answers: [t("Nur rechts herum, also entgegen dem Uhrzeigersinn"), f("Links herum, also im Uhrzeigersinn", "In Deutschland wird rechts herum gefahren."), f("In beliebiger Richtung, je nach Ziel", "Die Fahrtrichtung ist fest vorgegeben.")],
    explanation: "Das Zeichen 215 schreibt die Fahrtrichtung vor: Der Kreisverkehr wird rechts herum befahren, also entgegen dem Uhrzeigersinn.",
    legalReference: "Zeichen 215 StVO",
  }),
  q({
    code: "own-kreisverkehr-009", topic: "kreisverkehr", points: 2, difficulty: 0.2, tags: ["wenden"],
    text: "Dürfen Sie einen Kreisverkehr zum Wenden benutzen?",
    answers: [t("Ja, indem Sie den Kreis ganz durchfahren und die Zufahrtsstraße wieder verlassen"), f("Nein, Wenden ist im Kreisverkehr verboten", "Das vollständige Durchfahren ist erlaubt und sicherer als Wenden auf der Straße."), f("Nur wenn der Kreisverkehr leer ist", "Es gelten die normalen Regeln, keine besondere Bedingung.")],
    explanation: "Der Kreisverkehr kann zum sicheren Richtungswechsel genutzt werden, indem man ihn vollständig durchfährt. Beim Ausfahren gelten die normalen Regeln inklusive Blinken.",
    legalReference: "§ 9a StVO",
  }),
];
