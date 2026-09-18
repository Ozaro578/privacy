// Übungsfragen zum Thema "gefahrenlehre" (eigene Formulierungen, kein amtlicher Prüfungsinhalt).
import type { Question } from "../types.js";
import { q, t, f } from "./_helpers.js";

export const gefahrenlehre: readonly Question[] = [
  q({
    code: "own-gefahrenlehre-001", topic: "gefahrenlehre", points: 2, difficulty: 0.2, tags: ["reaktionszeit", "anhalteweg"],
    text: "Mit welcher Reaktionszeit rechnet die Faustformel für den Reaktionsweg bei einem aufmerksamen Fahrer?",
    answers: [t("Etwa 1 Sekunde"), f("Etwa 0,1 Sekunden", "So schnell reagiert kein Mensch; allein die Wahrnehmung braucht länger."), f("Etwa 3 Sekunden", "Das wäre eine stark verlängerte Reaktionszeit, etwa bei Müdigkeit oder Ablenkung.")],
    explanation: "Die Faustformel für den Reaktionsweg geht von rund einer Sekunde Reaktionszeit aus. In dieser Zeit legt das Fahrzeug bei 50 km/h bereits etwa 15 Meter zurück.",
    mnemonic: "Eine Sekunde Schrecksekunde.",
  }),
  q({
    code: "own-gefahrenlehre-002", topic: "gefahrenlehre", points: 3, difficulty: 0.3, tags: ["reaktionszeit", "ablenkung", "muedigkeit"],
    text: "Wodurch verlängert sich die Reaktionszeit beim Fahren?",
    answers: [t("Durch Müdigkeit"), t("Durch Alkohol"), t("Durch Ablenkung mit dem Smartphone"), f("Durch eingeschaltetes Tagfahrlicht", "Das Tagfahrlicht hat keinen Einfluss auf die Reaktionszeit.")],
    explanation: "Müdigkeit, Alkohol und Ablenkung verlängern die Reaktionszeit deutlich. Damit wächst der Reaktionsweg und der gesamte Anhalteweg.",
  }),
  q({
    code: "own-gefahrenlehre-003", topic: "gefahrenlehre", points: 3, difficulty: 0.4, tags: ["ablenkung", "handy", "innerorts"],
    text: "Sie stehen mit laufendem Motor an einer roten Ampel. Dürfen Sie das Smartphone in die Hand nehmen, um eine Nachricht zu lesen?",
    answers: [t("Nein, das Aufnehmen und Halten des Geräts ist bei laufendem Motor verboten"), f("Ja, weil das Fahrzeug steht", "Das Verbot gilt auch im Stand, solange der Motor läuft."), f("Ja, wenn es weniger als zehn Sekunden dauert", "Eine zeitliche Ausnahme gibt es nicht.")],
    explanation: "Ein elektronisches Gerät darf nur benutzt werden, wenn es dafür weder aufgenommen noch gehalten wird. Nur bei stehendem Fahrzeug mit vollständig abgeschaltetem Motor ist das Halten erlaubt; ein automatisch abgeschalteter Motor der Start-Stopp-Funktion zählt dabei als abgeschaltet.",
    legalReference: "§ 23 Abs. 1a und 1b StVO",
  }),
  q({
    code: "own-gefahrenlehre-004", topic: "gefahrenlehre", points: 2, difficulty: 0.2, tags: ["anhalteweg", "reaktionsweg", "bremsweg"],
    text: "Woraus setzt sich der Anhalteweg zusammen?",
    answers: [t("Aus Reaktionsweg und Bremsweg"), f("Nur aus dem Bremsweg", "Der Weg während der Reaktionszeit kommt hinzu."), f("Aus Bremsweg und Überholweg", "Der Überholweg hat mit dem Anhalten nichts zu tun.")],
    explanation: "Der Anhalteweg ist die Summe aus dem Reaktionsweg, den das Fahrzeug während der Reaktionszeit zurücklegt, und dem eigentlichen Bremsweg.",
    mnemonic: "Anhalten = Reagieren + Bremsen.",
  }),
  q({
    code: "own-gefahrenlehre-005", topic: "gefahrenlehre", points: 3, difficulty: 0.3, tags: ["toter_winkel", "fahrstreifenwechsel", "verkehrsbeobachtung"],
    text: "Wie stellen Sie vor einem Fahrstreifenwechsel sicher, dass sich kein Fahrzeug im toten Winkel befindet?",
    answers: [t("Durch einen Schulterblick zusätzlich zum Blick in die Spiegel"), f("Nur durch einen Blick in den Innenspiegel", "Der Innenspiegel zeigt den toten Winkel nicht."), f("Durch kurzes Hupen vor dem Wechsel", "Hupen ersetzt keine Verkehrsbeobachtung.")],
    explanation: "Spiegel decken den Bereich schräg neben dem Fahrzeug nicht vollständig ab. Der Schulterblick schließt diese Lücke und gehört zu jedem Fahrstreifenwechsel und Abbiegen.",
  }),
  q({
    code: "own-gefahrenlehre-006", topic: "gefahrenlehre", points: 3, difficulty: 0.4, tags: ["fahranfaenger", "selbstueberschaetzung"],
    text: "Warum haben Fahranfänger ein deutlich erhöhtes Unfallrisiko?",
    answers: [t("Fahraufgaben binden noch viel Aufmerksamkeit, weil die Routine fehlt"), t("Das eigene Können wird häufig überschätzt"), f("Junge Menschen sehen in der Regel schlechter als ältere", "Das Sehvermögen junger Menschen ist im Durchschnitt gut; das Risiko liegt in Erfahrung und Verhalten.")],
    explanation: "Fehlende Routine und Selbstüberschätzung sind die wichtigsten Gründe für das erhöhte Risiko in den ersten Jahren. Deshalb gibt es Probezeit und die Null-Promille-Grenze für Fahranfänger.",
  }),
  q({
    code: "own-gefahrenlehre-007", topic: "gefahrenlehre", points: 3, difficulty: 0.2, tags: ["muedigkeit", "autobahn"],
    text: "Auf einer langen Autobahnfahrt gähnen Sie häufig und die Augenlider werden schwer. Was ist richtig?",
    answers: [t("Die nächste Rastanlage anfahren und eine Pause machen oder schlafen"), f("Fenster öffnen, Radio lauter stellen und weiterfahren", "Das wirkt höchstens kurz und beseitigt die Müdigkeit nicht."), f("Schneller fahren, um früher anzukommen", "Höhere Geschwindigkeit bei Müdigkeit erhöht das Risiko erheblich.")],
    explanation: "Gegen Müdigkeit hilft nur Schlaf oder eine echte Pause. Sekundenschlaf ist eine der häufigsten Ursachen schwerer Unfälle auf Autobahnen.",
  }),
  q({
    code: "own-gefahrenlehre-008", topic: "gefahrenlehre", points: 2, difficulty: 0.2, tags: ["emotionen", "risikofaktor_mensch"],
    text: "Sie setzen sich nach einem heftigen Streit wütend ans Steuer. Wie wirkt sich starke Wut auf das Fahren aus?",
    answers: [t("Die Risikobereitschaft steigt und die Aufmerksamkeit für den Verkehr sinkt"), f("Wut verbessert die Konzentration", "Starke Gefühle lenken von der Fahraufgabe ab."), f("Wut hat keinen Einfluss auf das Fahrverhalten", "Emotionen beeinflussen Wahrnehmung und Entscheidungen deutlich.")],
    explanation: "Starke Emotionen wie Wut oder Trauer verengen die Wahrnehmung und verleiten zu aggressivem Fahren. Besser erst zur Ruhe kommen und dann losfahren.",
  }),
  q({
    code: "own-gefahrenlehre-009", topic: "gefahrenlehre", points: 2, difficulty: 0.3, tags: ["reaktionsweg", "innerorts", "faustformel"], kind: "numeric", numericAnswer: 9, tolerance: 0, unit: "m",
    text: "Wie lang ist der Reaktionsweg bei 30 km/h nach der Faustformel (Geschwindigkeit geteilt durch 10, mal 3)? Angabe in Metern.",
    answers: [],
    explanation: "Reaktionsweg = (30 / 10) × 3 = 9 Meter. In einer Sekunde Reaktionszeit legt das Fahrzeug bei 30 km/h also rund 9 Meter zurück.",
    mnemonic: "Reaktionsweg: Tempo durch 10, mal 3.",
  }),
  q({
    code: "own-gefahrenlehre-010", topic: "gefahrenlehre", points: 2, difficulty: 0.2, tags: ["verkehrsbeobachtung", "blickfuehrung"],
    text: "Wie führen Sie beim Fahren den Blick richtig?",
    answers: [t("Weit voraus, mit regelmäßigem Blick in die Spiegel und zu den Seiten"), f("Ständig auf die Motorhaube und den Fahrbahnrand", "So erkennen Sie Gefahren viel zu spät."), f("Nur auf das Fahrzeug unmittelbar vor Ihnen", "Dann bleibt der weitere Verkehr unbeobachtet.")],
    explanation: "Wer weit vorausschaut, erkennt Gefahren früh und kann rechtzeitig reagieren. Regelmäßige Spiegelblicke halten das Bild vom Verkehr hinter und neben dem Fahrzeug aktuell.",
  }),
];
