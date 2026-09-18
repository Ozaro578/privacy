// Übungsfragen zum Thema "vorfahrt" (eigene Formulierungen, kein amtlicher Prüfungsinhalt).
import type { Question } from "../types.js";
import { q, t, f } from "./_helpers.js";

export const vorfahrt: readonly Question[] = [
  q({
    code: "own-vorfahrt-001", topic: "vorfahrt", points: 5, difficulty: 0.2, tags: ["rechts_vor_links", "kreuzung"],
    text: "Sie erreichen eine Kreuzung ohne Verkehrszeichen und ohne Ampel. Wer hat Vorfahrt?",
    answers: [t("Wer von rechts kommt"), f("Wer schneller fährt", "Die Geschwindigkeit spielt für die Vorfahrt keine Rolle."), f("Wer auf der breiteren Straße fährt", "Die Straßenbreite ist ohne Bedeutung, solange keine Zeichen aufgestellt sind.")],
    explanation: "An Kreuzungen und Einmündungen ohne Regelung durch Zeichen gilt rechts vor links. Wer von rechts kommt, hat Vorfahrt.",
    mnemonic: "Rechts vor links, wenn keiner winkt und kein Schild blinkt.",
    legalReference: "§ 8 Abs. 1 StVO",
  }),
  q({
    code: "own-vorfahrt-002", topic: "vorfahrt", points: 5, difficulty: 0.4, tags: ["rechts_vor_links", "einmuendung"],
    text: "Sie fahren auf der durchgehenden Straße an einer T-Einmündung ohne Verkehrszeichen. Von rechts kommt aus der einmündenden Straße ein Pkw. Wer muss warten?",
    answers: [t("Sie, denn auch an einer T-Einmündung gilt rechts vor links"), f("Der Pkw, weil die durchgehende Straße Vorrang hat", "Ohne Beschilderung gibt es keinen Vorrang der durchgehenden Straße."), f("Wer zuerst an der Einmündung war", "Ankunftszeit regelt keine Vorfahrt.")],
    explanation: "Ohne Verkehrszeichen gilt auch an T-Einmündungen rechts vor links. Die durchgehende Straße hat keinen automatischen Vorrang.",
    legalReference: "§ 8 Abs. 1 StVO",
  }),
  q({
    code: "own-vorfahrt-003", topic: "vorfahrt", points: 4, difficulty: 0.3, tags: ["grundstuecksausfahrt", "einfahren"],
    text: "Sie fahren aus einer Grundstücksausfahrt auf die Straße. Ein Fahrzeug kommt von links. Wer hat Vorfahrt?",
    answers: [t("Das Fahrzeug auf der Straße; wer aus einem Grundstück ausfährt, muss alle anderen durchfahren lassen"), f("Sie, weil Sie von rechts kommen", "Rechts vor links gilt nicht beim Einfahren aus Grundstücken."), f("Wer zuerst blinkt", "Blinken begründet keine Vorfahrt.")],
    explanation: "Wer aus einem Grundstück, einem verkehrsberuhigten Bereich, einer Fußgängerzone oder über einen abgesenkten Bordstein einfährt, muss sich so verhalten, dass jede Gefährdung ausgeschlossen ist, und alle anderen durchfahren lassen.",
    legalReference: "§ 10 StVO",
  }),
  q({
    code: "own-vorfahrt-004", topic: "vorfahrt", points: 5, difficulty: 0.3, tags: ["linksabbiegen", "gegenverkehr"],
    text: "Sie wollen an einer Kreuzung links abbiegen. Ein entgegenkommendes Fahrzeug fährt geradeaus. Wie verhalten Sie sich?",
    answers: [t("Warten und den Gegenverkehr durchfahren lassen"), f("Zügig abbiegen, weil Sie zuerst an der Kreuzung waren", "Wer links abbiegt, muss entgegenkommende Fahrzeuge durchfahren lassen."), f("Hupen, damit der Gegenverkehr wartet", "Hupen begründet keinen Vorrang.")],
    explanation: "Linksabbieger müssen entgegenkommende Fahrzeuge, die geradeaus fahren oder rechts abbiegen, durchfahren lassen. Das gilt unabhängig davon, wer zuerst an der Kreuzung war.",
    legalReference: "§ 9 Abs. 3 StVO",
  }),
  q({
    code: "own-vorfahrt-005", topic: "vorfahrt", points: 4, difficulty: 0.3, tags: ["einsatzfahrzeug", "blaulicht", "vorfahrt_beschildert"],
    text: "Sie fahren auf einer Vorfahrtstraße. Von links nähert sich ein Einsatzfahrzeug mit blauem Blinklicht und Einsatzhorn. Was gilt?",
    answers: [t("Sie müssen sofort freie Bahn schaffen, obwohl Sie auf der Vorfahrtstraße fahren"), f("Sie haben Vorfahrt und fahren weiter", "Blaulicht mit Einsatzhorn geht der Vorfahrtregelung vor."), f("Das Einsatzfahrzeug muss an der Kreuzung warten", "Alle anderen müssen dem Einsatzfahrzeug freie Bahn schaffen.")],
    explanation: "Blaues Blinklicht zusammen mit dem Einsatzhorn bedeutet: Alle übrigen Verkehrsteilnehmer haben sofort freie Bahn zu schaffen. Das gilt auch auf Vorfahrtstraßen und bei Grün an einer Ampel.",
    legalReference: "§ 38 Abs. 1 StVO",
  }),
  q({
    code: "own-vorfahrt-006", topic: "vorfahrt", points: 3, difficulty: 0.4, tags: ["abknickende_vorfahrt", "blinken", "vorfahrt_beschildert"],
    text: "Sie folgen dem Verlauf einer abknickenden Vorfahrtstraße. Müssen Sie blinken?",
    answers: [t("Ja, denn das Folgen der abknickenden Vorfahrtstraße ist ein Abbiegevorgang"), f("Nein, weil Sie auf der Vorfahrtstraße bleiben", "Auch auf der bevorrechtigten Straße ändert sich die Fahrtrichtung, daher ist zu blinken."), f("Nur wenn andere Fahrzeuge in der Nähe sind", "Die Blinkpflicht gilt immer.")],
    explanation: "Wer der abknickenden Vorfahrtstraße folgt, ändert die Fahrtrichtung und muss dies rechtzeitig und deutlich mit dem Fahrtrichtungsanzeiger ankündigen. Die Vorfahrt bleibt dabei erhalten.",
    legalReference: "§ 9 Abs. 1 StVO; Zeichen 306 mit Zusatzzeichen",
  }),
  q({
    code: "own-vorfahrt-007", topic: "vorfahrt", points: 5, difficulty: 0.5, tags: ["rechts_vor_links", "kreuzung"],
    text: "An einer Kreuzung mit rechts vor links kommen gleichzeitig ein Fahrzeug von rechts und ein Fahrzeug von links. Sie wollen geradeaus fahren. Was gilt?",
    answers: [t("Sie müssen das Fahrzeug von rechts durchfahren lassen; das Fahrzeug von links muss Sie durchfahren lassen"), f("Sie dürfen als Erster fahren, weil Sie geradeaus fahren", "Die Fahrtrichtung geradeaus begründet keine Vorfahrt."), f("Beide Fahrzeuge müssen Ihnen Vorfahrt gewähren", "Nur das Fahrzeug von links muss warten.")],
    explanation: "Bei rechts vor links hat jeder gegenüber dem Fahrzeug von links Vorfahrt und muss dem Fahrzeug von rechts Vorfahrt gewähren. Deshalb fährt zuerst das Fahrzeug von rechts, dann Sie, dann das Fahrzeug von links.",
    legalReference: "§ 8 Abs. 1 StVO",
  }),
  q({
    code: "own-vorfahrt-008", topic: "vorfahrt", points: 4, difficulty: 0.4, tags: ["feldweg", "ausserorts", "rechts_vor_links"],
    text: "Ein Fahrzeug kommt von rechts aus einem Feldweg auf die Landstraße. Wer hat Vorfahrt?",
    answers: [t("Sie auf der Landstraße; wer aus einem Feld- oder Waldweg kommt, hat keine Vorfahrt"), f("Das Fahrzeug aus dem Feldweg, weil es von rechts kommt", "Rechts vor links gilt nicht für Feld- und Waldwege."), f("Wer schneller ist", "Geschwindigkeit begründet keine Vorfahrt.")],
    explanation: "Wer aus einem Feld- oder Waldweg auf eine andere Straße einfährt, hat keine Vorfahrt, auch wenn er von rechts kommt. Die Regel rechts vor links gilt hier nicht.",
    legalReference: "§ 8 Abs. 1 Nr. 2 StVO",
  }),
  q({
    code: "own-vorfahrt-009", topic: "vorfahrt", points: 3, difficulty: 0.4, tags: ["verzicht", "verstaendigung"],
    text: "Ein vorfahrtberechtigter Fahrer bleibt stehen und winkt Sie deutlich durch. Was gilt?",
    answers: [t("Sie dürfen fahren, wenn die Verständigung eindeutig ist und niemand gefährdet wird"), f("Sie müssen fahren, weil der andere verzichtet hat", "Ein Verzicht verpflichtet Sie nicht; Sie bleiben verantwortlich für die sichere Weiterfahrt."), f("Ein Verzicht auf die Vorfahrt ist nicht möglich", "Verzicht ist möglich, aber nur bei eindeutiger Verständigung.")],
    explanation: "Auf die Vorfahrt kann verzichtet werden. Wer den Verzicht annimmt, darf nur bei eindeutiger Verständigung und ohne Gefährdung anderer fahren; die Verantwortung bleibt bei ihm.",
    legalReference: "§ 8 StVO; § 1 StVO",
  }),
  q({
    code: "own-vorfahrt-010", topic: "vorfahrt", points: 4, difficulty: 0.4, tags: ["ampel_ausgefallen", "vorfahrt_beschildert", "rechts_vor_links"],
    text: "Die Ampel an einer Kreuzung ist ausgefallen und bleibt dunkel. Wie ist die Vorfahrt geregelt?",
    answers: [t("Es gelten die aufgestellten Verkehrszeichen; gibt es keine, gilt rechts vor links"), f("Immer rechts vor links, unabhängig von Verkehrszeichen", "Vorhandene Verkehrszeichen gehen der Grundregel vor."), f("Wer zuerst an der Kreuzung ist, darf fahren", "Ankunftszeit regelt keine Vorfahrt.")],
    explanation: "Fällt eine Ampel aus, gelten die Verkehrszeichen an der Kreuzung. Sind keine vorhanden, greift die Grundregel rechts vor links.",
    legalReference: "§ 37 Abs. 1 StVO; § 8 StVO",
  }),
  q({
    code: "own-vorfahrt-011", topic: "vorfahrt", points: 5, difficulty: 0.4, tags: ["rechtsabbiegen", "radverkehr", "radweg"],
    text: "Sie wollen rechts abbiegen. Auf dem Radweg neben Ihnen fährt ein Radfahrer geradeaus weiter. Wie verhalten Sie sich?",
    answers: [t("Den Radfahrer durchfahren lassen, notfalls anhalten"), f("Zügig vor dem Radfahrer abbiegen", "Das ist die klassische Ursache schwerer Abbiegeunfälle."), f("Hupen, damit der Radfahrer wartet", "Der Radfahrer hat Vorrang.")],
    explanation: "Beim Abbiegen müssen Radfahrende, die auf oder neben der Fahrbahn in gleicher Richtung fahren, durchfahren gelassen werden. Vor dem Abbiegen ist der Schulterblick zwingend.",
    legalReference: "§ 9 Abs. 3 StVO",
  }),
];
