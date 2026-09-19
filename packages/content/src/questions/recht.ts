// Übungsfragen zum Thema "recht" (eigene Formulierungen, kein amtlicher Prüfungsinhalt).
import type { Question } from "../types.js";
import { q, t, f } from "./_helpers.js";

export const recht: readonly Question[] = [
  q({
    code: "own-recht-001", topic: "recht", points: 2, difficulty: 0.1, tags: ["probezeit"],
    text: "Wie lange dauert die Probezeit nach dem erstmaligen Erwerb der Fahrerlaubnis?",
    answers: [t("2 Jahre"), f("1 Jahr", "Die Probezeit ist länger."), f("3 Jahre", "Regulär sind es zwei Jahre; eine Verlängerung gibt es nur nach bestimmten Verstößen.")],
    explanation: "Die Probezeit beträgt zwei Jahre. Bei einem schwerwiegenden Verstoß wird ein Aufbauseminar angeordnet und die Probezeit um zwei Jahre verlängert.",
    legalReference: "§ 2a StVG",
  }),
  q({
    code: "own-recht-002", topic: "recht", points: 3, difficulty: 0.4, tags: ["probezeit", "aufbauseminar"],
    text: "Welche Folgen hat ein schwerwiegender Verstoß (A-Verstoß) während der Probezeit?",
    answers: [t("Die Teilnahme an einem Aufbauseminar wird angeordnet"), t("Die Probezeit verlängert sich um zwei Jahre"), f("Die Fahrerlaubnis erlischt automatisch", "Ein Entzug erfolgt nicht automatisch; zunächst folgen Aufbauseminar und Verlängerung.")],
    explanation: "Ein schwerwiegender Verstoß in der Probezeit führt zur Anordnung eines Aufbauseminars und zur Verlängerung der Probezeit auf insgesamt vier Jahre.",
    legalReference: "§ 2a StVG",
  }),
  q({
    code: "own-recht-003", topic: "recht", points: 2, difficulty: 0.3, tags: ["theoriepruefung", "pruefung"],
    text: "Sie haben die theoretische Prüfung bestanden. Innerhalb welcher Frist müssen Sie die praktische Prüfung bestehen, damit die Theorieprüfung gültig bleibt?",
    answers: [t("Innerhalb von 12 Monaten"), f("Innerhalb von 6 Monaten", "Die Frist ist länger."), f("Es gibt keine Frist", "Die Theorieprüfung verliert nach Ablauf der Frist ihre Gültigkeit.")],
    explanation: "Die bestandene theoretische Prüfung ist zwölf Monate gültig. Wird die praktische Prüfung nicht innerhalb dieser Frist bestanden, muss die Theorie erneut abgelegt werden.",
    legalReference: "§ 18 FeV",
  }),
  q({
    code: "own-recht-004", topic: "recht", points: 2, difficulty: 0.3, tags: ["pruefung", "sperrfrist"],
    text: "Sie haben die praktische Prüfung nicht bestanden. Wann dürfen Sie frühestens erneut zur Prüfung antreten?",
    answers: [t("Frühestens nach zwei Wochen"), f("Bereits am nächsten Tag", "Nach dem Nichtbestehen gilt eine Wartefrist."), f("Frühestens nach drei Monaten", "Die Wartefrist ist deutlich kürzer.")],
    explanation: "Nach einer nicht bestandenen Prüfung gilt eine Sperrfrist von zwei Wochen. Die Zeit sollte für gezielte Nachschulung genutzt werden.",
    legalReference: "§ 18 FeV",
  }),
  q({
    code: "own-recht-005", topic: "recht", points: 3, difficulty: 0.4, tags: ["bf17", "begleitperson"],
    text: "Welche Voraussetzungen muss eine Begleitperson beim Begleiteten Fahren ab 17 (BF17) erfüllen?",
    answers: [t("Mindestens 30 Jahre alt"), t("Seit mindestens fünf Jahren im Besitz der Fahrerlaubnis Klasse B"), t("Höchstens ein Punkt im Fahreignungsregister"), f("Mindestens 21 Jahre alt", "Das Mindestalter der Begleitperson liegt höher.")],
    explanation: "Eine Begleitperson muss mindestens 30 Jahre alt sein, seit mindestens fünf Jahren die Klasse B besitzen und darf zum Zeitpunkt der Eintragung höchstens einen Punkt im Fahreignungsregister haben.",
    legalReference: "§ 48a FeV",
  }),
  q({
    code: "own-recht-006", topic: "recht", points: 3, difficulty: 0.5, tags: ["b197", "automatik", "schaltung"],
    text: "Was gilt für die Ausbildung mit der Schlüsselzahl B197 (Automatikprüfung ohne Automatikbeschränkung)?",
    answers: [t("Mindestens zehn Fahrstunden müssen auf einem Fahrzeug mit Schaltgetriebe absolviert werden"), t("Eine mindestens 15-minütige Testfahrt auf einem Schaltwagen wird von der Fahrschule bescheinigt"), f("Die praktische Prüfung muss auf einem Schaltwagen abgelegt werden", "Die Prüfung findet auf einem Automatikfahrzeug statt; die Schaltkompetenz wird vorher in der Fahrschule nachgewiesen.")],
    explanation: "Bei B197 wird die praktische Prüfung auf einem Automatikfahrzeug abgelegt. Voraussetzung sind mindestens zehn Fahrstunden auf einem Schaltwagen und eine bescheinigte Testfahrt von mindestens 15 Minuten; der Führerschein enthält dann keine Automatikbeschränkung.",
    legalReference: "Anlage 7 FeV, § 17 FeV",
  }),
  q({
    code: "own-recht-007", topic: "recht", points: 3, difficulty: 0.5, tags: ["b196", "kraftrad"],
    text: "Was trifft auf die Schlüsselzahl B196 zu?",
    answers: [t("Sie erlaubt das Führen von Krafträdern der Klasse A1 (bis 125 cm³ und 11 kW) mit einer Fahrerlaubnis der Klasse B"), t("Voraussetzung sind ein Mindestalter von 25 Jahren, mindestens fünf Jahre Klasse B und eine Fahrschulschulung ohne Prüfung"), f("Sie gilt auch im EU-Ausland", "B196 ist eine nationale Regelung und gilt nur in Deutschland.")],
    explanation: "Mit B196 dürfen Inhaber der Klasse B nach einer Schulung Leichtkrafträder bis 125 cm³ und 11 kW fahren. Es gibt keine Prüfung, dafür Mindestalter 25, fünf Jahre Klasse B und die Beschränkung auf Deutschland.",
    legalReference: "§ 6 Abs. 4 FeV; Anlage 7b FeV",
  }),
  q({
    code: "own-recht-008", topic: "recht", points: 2, difficulty: 0.3, tags: ["sonderfahrten", "ausbildung"],
    text: "Wie viele Sonderfahrten sind in der Ausbildung für Klasse B mindestens vorgeschrieben?",
    answers: [t("5 Überlandfahrten, 4 Autobahnfahrten und 3 Fahrten bei Dunkelheit"), f("3 Überlandfahrten, 3 Autobahnfahrten und 3 Nachtfahrten", "Die vorgeschriebenen Zahlen sind höher."), f("12 Autobahnfahrten", "Die Sonderfahrten verteilen sich auf drei Arten.")],
    explanation: "Die Fahrschüler-Ausbildungsordnung schreibt für Klasse B mindestens fünf Überlandfahrten, vier Autobahnfahrten und drei Fahrten bei Dunkelheit zu je 45 Minuten vor.",
    mnemonic: "5-4-3: Überland, Autobahn, Nacht.",
    legalReference: "§ 5 FahrschAusbO",
  }),
  q({
    code: "own-recht-009", topic: "recht", points: 3, difficulty: 0.4, tags: ["klasse_b", "fahrerlaubnisklassen"],
    text: "Welche Fahrzeuge dürfen Sie mit der Fahrerlaubnis der Klasse B führen?",
    answers: [t("Kraftfahrzeuge mit einer zulässigen Gesamtmasse bis 3.500 kg"), t("Fahrzeuge mit höchstens acht Sitzplätzen außer dem Fahrersitz"), t("Solche Fahrzeuge mit einem Anhänger bis 750 kg zulässiger Gesamtmasse"), f("Kraftomnibusse mit mehr als acht Fahrgastplätzen", "Dafür ist eine Busklasse erforderlich.")],
    explanation: "Klasse B umfasst Kraftfahrzeuge bis 3.500 kg zulässiger Gesamtmasse mit höchstens acht Sitzplätzen außer dem Fahrersitz. Ein Anhänger bis 750 kg darf immer mitgeführt werden, ein schwererer, wenn die Kombination 3.500 kg nicht überschreitet.",
    legalReference: "§ 6 FeV",
  }),
  q({
    code: "own-recht-010", topic: "recht", points: 2, difficulty: 0.2, tags: ["fuehrerschein", "mitfuehrpflicht"],
    text: "Sie haben Ihren Führerschein zu Hause vergessen und fahren trotzdem. Was gilt?",
    answers: [t("Das ist eine Ordnungswidrigkeit, denn der Führerschein muss beim Fahren mitgeführt werden"), f("Die Fahrerlaubnis erlischt dadurch", "Die Fahrerlaubnis bleibt bestehen; nur der Nachweis fehlt."), f("Ein Foto des Führerscheins auf dem Handy genügt", "Ein Foto ersetzt das Dokument nicht.")],
    explanation: "Der Führerschein ist beim Führen eines Kraftfahrzeugs mitzuführen und auf Verlangen vorzuzeigen. Wer ihn nicht dabeihat, handelt ordnungswidrig (Verwarnungsgeld 10 Euro), verliert aber nicht die Fahrerlaubnis.",
    legalReference: "§ 4 Abs. 2 FeV",
  }),
  q({
    code: "own-recht-011", topic: "recht", points: 2, difficulty: 0.3, tags: ["theoriepruefung", "fehlerpunkte"],
    text: "Wie viele Fehlerpunkte dürfen Sie in der theoretischen Prüfung für Klasse B (Ersterwerb) höchstens haben?",
    answers: [t("10 Fehlerpunkte, wobei nicht zwei Fragen mit je fünf Punkten falsch beantwortet sein dürfen"), f("5 Fehlerpunkte", "Die Grenze liegt höher."), f("15 Fehlerpunkte", "Die Grenze liegt niedriger.")],
    explanation: "Beim Ersterwerb der Klasse B werden 30 Fragen gestellt. Bestanden ist die Prüfung mit höchstens zehn Fehlerpunkten, sofern nicht zwei Fragen mit fünf Punkten falsch beantwortet wurden.",
    legalReference: "Anlage 7 FeV",
  }),
  q({
    code: "own-recht-012", topic: "recht", points: 2, difficulty: 0.3, tags: ["punktesystem", "fahreignungsregister"],
    text: "Ab wie vielen Punkten im Fahreignungsregister wird die Fahrerlaubnis entzogen?",
    answers: [t("Ab 8 Punkten"), f("Ab 18 Punkten", "Das war die Grenze im früheren Punktesystem; heute gilt eine niedrigere."), f("Ab 5 Punkten", "Bei sechs Punkten gibt es eine Verwarnung, der Entzug folgt erst später.")],
    explanation: "Im Fahreignungs-Bewertungssystem wird die Fahrerlaubnis bei acht Punkten entzogen. Vorher gibt es bei vier bis fünf Punkten eine Ermahnung und bei sechs bis sieben Punkten eine Verwarnung.",
    legalReference: "§ 4 StVG",
  }),
];
