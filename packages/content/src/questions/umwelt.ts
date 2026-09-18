// Übungsfragen zum Thema "umwelt" (eigene Formulierungen, kein amtlicher Prüfungsinhalt).
import type { Question } from "../types.js";
import { q, t, f } from "./_helpers.js";

export const umwelt: readonly Question[] = [
  q({
    code: "own-umwelt-001", topic: "umwelt", points: 2, difficulty: 0.2, tags: ["kraftstoff", "schalten"],
    text: "Wie fahren Sie mit einem Schaltwagen kraftstoffsparend?",
    answers: [t("Frühzeitig hochschalten, etwa bei 2.000 Umdrehungen pro Minute, und im hohen Gang mit niedriger Drehzahl fahren"), f("Jeden Gang bis in den roten Drehzahlbereich ausfahren", "Hohe Drehzahlen erhöhen Verbrauch, Lärm und Verschleiß."), f("Möglichst lange im ersten und zweiten Gang bleiben", "Niedrige Gänge bei hoher Drehzahl verbrauchen am meisten.")],
    explanation: "Niedrige Drehzahlen in hohen Gängen sparen Kraftstoff. Moderne Motoren laufen bei etwa 2.000 Umdrehungen pro Minute effizient und ruckelfrei.",
  }),
  q({
    code: "own-umwelt-002", topic: "umwelt", points: 2, difficulty: 0.2, tags: ["motor_abstellen", "bahnuebergang", "laerm"],
    text: "Sie warten längere Zeit an einem geschlossenen Bahnübergang. Was ist richtig?",
    answers: [t("Motor abstellen, um Abgase und Lärm zu vermeiden"), f("Motor laufen lassen, damit die Batterie geladen bleibt", "Der kurze Neustart verbraucht weniger als der Leerlauf."), f("Im Leerlauf zwischendurch Gas geben", "Das erzeugt nur Lärm und Abgase.")],
    explanation: "Unnötiger Lärm und vermeidbare Abgase sind verboten. Bei längerem Warten, etwa an Bahnübergängen, wird der Motor abgestellt.",
    legalReference: "§ 30 Abs. 1 StVO",
  }),
  q({
    code: "own-umwelt-003", topic: "umwelt", points: 2, difficulty: 0.2, tags: ["reifendruck", "kraftstoff"],
    text: "Wie wirkt sich zu niedriger Reifendruck aus?",
    answers: [t("Höherer Kraftstoffverbrauch, stärkerer Reifenverschleiß und schlechteres Fahrverhalten"), f("Geringerer Verbrauch durch weichere Reifen", "Zu wenig Druck erhöht den Rollwiderstand."), f("Keine Auswirkung, solange der Reifen nicht platt ist", "Schon geringer Unterdruck erhöht Verbrauch und Verschleiß.")],
    explanation: "Zu niedriger Reifendruck erhöht den Rollwiderstand und damit den Verbrauch. Zudem verschleißen die Reifen schneller und das Fahrzeug reagiert schwammiger.",
  }),
  q({
    code: "own-umwelt-004", topic: "umwelt", points: 2, difficulty: 0.1, tags: ["luftwiderstand", "dachgepaecktraeger"],
    text: "Der Dachgepäckträger wird nicht mehr gebraucht. Was ist umweltbewusst?",
    answers: [t("Abnehmen, weil er den Luftwiderstand und damit den Verbrauch erhöht"), f("Montiert lassen, weil er nur bei Beladung Kraftstoff kostet", "Auch leer erhöht er den Luftwiderstand."), f("Montiert lassen, weil die Montage dem Dach schadet", "Regelmäßiges Abnehmen schadet nicht.")],
    explanation: "Dachträger, Boxen und Fahrradträger erhöhen den Luftwiderstand deutlich, besonders bei höheren Geschwindigkeiten. Nicht benötigte Anbauten abnehmen.",
  }),
  q({
    code: "own-umwelt-005", topic: "umwelt", points: 2, difficulty: 0.3, tags: ["umweltzone", "plakette"],
    text: "Was gilt in einer Umweltzone (Zeichen 270.1)?",
    answers: [t("Nur Fahrzeuge mit der auf dem Zusatzzeichen angegebenen Plakette dürfen einfahren"), f("Alle Fahrzeuge dürfen einfahren, wenn sie langsam fahren", "Die Einfahrt hängt von der Plakette ab."), f("Es gilt ein generelles Fahrverbot", "Fahrzeuge mit passender Plakette dürfen fahren.")],
    explanation: "In Umweltzonen dürfen nur Kraftfahrzeuge fahren, die mit der entsprechenden Feinstaubplakette gekennzeichnet sind. Welche Plakette nötig ist, zeigt das Zusatzzeichen.",
    legalReference: "§ 40 BImSchG; Zeichen 270.1 StVO",
  }),
  q({
    code: "own-umwelt-006", topic: "umwelt", points: 2, difficulty: 0.2, tags: ["warmlaufen", "laerm", "winter"],
    text: "Dürfen Sie den Motor im Winter vor der Abfahrt im Stand warmlaufen lassen?",
    answers: [t("Nein, das ist als unnötiger Lärm und vermeidbare Abgasbelästigung verboten"), f("Ja, bis die Betriebstemperatur erreicht ist", "Der Motor wird im Stand nur langsam warm und erzeugt unnötige Emissionen."), f("Ja, aber höchstens fünf Minuten", "Eine zeitliche Erlaubnis gibt es nicht.")],
    explanation: "Motoren im Stand warmlaufen zu lassen ist verboten. Besser: Scheiben freikratzen, losfahren und die ersten Kilometer mit niedriger Drehzahl fahren.",
    legalReference: "§ 30 Abs. 1 StVO",
  }),
  q({
    code: "own-umwelt-007", topic: "umwelt", points: 2, difficulty: 0.2, tags: ["vorausschauend", "schubabschaltung"],
    text: "Sie sehen von weitem, dass die Ampel auf Rot steht. Wie fahren Sie umweltschonend?",
    answers: [t("Früh vom Gas gehen und das Fahrzeug im eingelegten Gang ausrollen lassen"), f("Bis kurz vor die Ampel beschleunigen und dann stark bremsen", "Das verschwendet Energie und Bremsbeläge."), f("Auskuppeln und im Leerlauf rollen", "Im Leerlauf verbraucht der Motor Kraftstoff; im eingelegten Gang greift die Schubabschaltung.")],
    explanation: "Beim Ausrollen im eingelegten Gang schaltet die Schubabschaltung die Kraftstoffzufuhr ab. Vorausschauendes Fahren spart Kraftstoff und schont die Bremsen.",
  }),
  q({
    code: "own-umwelt-008", topic: "umwelt", points: 2, difficulty: 0.3, tags: ["klimaanlage", "kraftstoff"],
    text: "Was erhöht den Kraftstoffverbrauch?",
    answers: [t("Eingeschaltete Klimaanlage"), t("Geöffnete Fenster bei hoher Geschwindigkeit"), f("Eingeschaltetes Abblendlicht bei Tag in nennenswertem Umfang", "Der Einfluss der Beleuchtung ist sehr gering.")],
    explanation: "Klimaanlage, Heckscheibenheizung und offene Fenster bei hoher Geschwindigkeit kosten spürbar Kraftstoff. Verbraucher nur einschalten, wenn sie gebraucht werden.",
  }),
  q({
    code: "own-umwelt-009", topic: "umwelt", points: 2, difficulty: 0.2, tags: ["altoel", "entsorgung"],
    text: "Wie entsorgen Sie Altöl nach einem selbst durchgeführten Ölwechsel?",
    answers: [t("Bei der Verkaufsstelle des neuen Öls oder einer Sammelstelle abgeben"), f("Über den Hausmüll", "Altöl ist Sondermüll."), f("In kleinen Mengen in die Kanalisation", "Schon geringe Ölmengen verschmutzen große Mengen Wasser.")],
    explanation: "Altöl muss an Sammelstellen oder bei der Verkaufsstelle abgegeben werden, die es zurücknehmen muss. Ins Grundwasser oder die Kanalisation darf es nie gelangen.",
    legalReference: "Altölverordnung",
  }),
  q({
    code: "own-umwelt-010", topic: "umwelt", points: 2, difficulty: 0.2, tags: ["kurzstrecke", "kraftstoff"],
    text: "Warum sind Kurzstrecken mit dem Auto besonders umweltbelastend?",
    answers: [t("Der kalte Motor verbraucht deutlich mehr Kraftstoff und stößt mehr Schadstoffe aus, bis er Betriebstemperatur hat"), f("Weil kurze Strecken immer mit hoher Geschwindigkeit gefahren werden", "Die Geschwindigkeit ist nicht der Grund."), f("Kurzstrecken sind nicht umweltbelastend", "Gerade Kurzstrecken sind pro Kilometer besonders belastend.")],
    explanation: "Auf den ersten Kilometern arbeitet der Motor mit erhöhtem Verbrauch und der Katalysator noch nicht mit voller Wirkung. Kurze Wege besser zu Fuß oder mit dem Rad zurücklegen.",
  }),
];
