// Übungsfragen zum Thema "alkohol_drogen" (eigene Formulierungen, kein amtlicher Prüfungsinhalt).
import type { Question } from "../types.js";
import { q, t, f } from "./_helpers.js";

export const alkoholDrogen: readonly Question[] = [
  q({
    code: "own-alkohol_drogen-001", topic: "alkohol_drogen", points: 3, difficulty: 0.2, tags: ["alkohol", "promille", "ordnungswidrigkeit"],
    text: "Ab welcher Blutalkoholkonzentration liegt beim Führen eines Kraftfahrzeugs eine Ordnungswidrigkeit vor, auch ohne Ausfallerscheinungen?",
    answers: [t("Ab 0,5 Promille"), f("Ab 0,8 Promille", "Diese Grenze galt früher; heute liegt sie niedriger."), f("Ab 1,1 Promille", "Ab 1,1 Promille liegt bereits eine Straftat vor.")],
    explanation: "Ab 0,5 Promille handelt ordnungswidrig, wer ein Kraftfahrzeug führt, auch ohne Fahrfehler. Es drohen Bußgeld, Punkte und Fahrverbot.",
    legalReference: "§ 24a StVG",
  }),
  q({
    code: "own-alkohol_drogen-002", topic: "alkohol_drogen", points: 3, difficulty: 0.2, tags: ["alkohol", "probezeit", "fahranfaenger"],
    text: "Welche Alkoholgrenze gilt für Fahranfänger in der Probezeit und für Fahrer unter 21 Jahren?",
    answers: [t("0,0 Promille, also absolutes Alkoholverbot"), f("0,3 Promille", "Für diese Gruppe gilt ein vollständiges Verbot."), f("0,5 Promille wie für alle anderen", "Fahranfänger unterliegen einer strengeren Regel.")],
    explanation: "In der Probezeit und bis zum 21. Geburtstag gilt ein absolutes Alkoholverbot am Steuer. Verstöße kosten Bußgeld, einen Punkt und verlängern die Probezeit.",
    legalReference: "§ 24c StVG",
  }),
  q({
    code: "own-alkohol_drogen-003", topic: "alkohol_drogen", points: 3, difficulty: 0.3, tags: ["alkohol", "straftat", "fahruntuechtigkeit"],
    text: "Ab welcher Blutalkoholkonzentration gilt ein Kraftfahrer als absolut fahruntüchtig?",
    answers: [t("Ab 1,1 Promille"), f("Ab 0,5 Promille", "Ab 0,5 Promille liegt eine Ordnungswidrigkeit vor, absolute Fahruntüchtigkeit beginnt höher."), f("Ab 1,6 Promille", "Ab 1,6 Promille wird zusätzlich eine medizinisch-psychologische Untersuchung angeordnet.")],
    explanation: "Ab 1,1 Promille gilt ein Kraftfahrer unabhängig von Ausfallerscheinungen als absolut fahruntüchtig. Das ist eine Straftat mit Entzug der Fahrerlaubnis.",
    legalReference: "§ 316 StGB",
  }),
  q({
    code: "own-alkohol_drogen-004", topic: "alkohol_drogen", points: 3, difficulty: 0.4, tags: ["alkohol", "straftat", "relative_fahruntuechtigkeit"],
    text: "Ein Fahrer hat 0,4 Promille und fährt in Schlangenlinien. Wie wird das bewertet?",
    answers: [t("Als Straftat wegen relativer Fahruntüchtigkeit, da ab 0,3 Promille mit Ausfallerscheinungen"), f("Gar nicht, weil 0,5 Promille nicht erreicht sind", "Mit Ausfallerscheinungen beginnt die Strafbarkeit bereits ab 0,3 Promille."), f("Nur als Ordnungswidrigkeit", "Ausfallerscheinungen machen daraus eine Straftat.")],
    explanation: "Schon ab 0,3 Promille kann eine Straftat vorliegen, wenn alkoholbedingte Ausfallerscheinungen wie Schlangenlinien oder ein Unfall hinzukommen.",
    legalReference: "§ 316 StGB",
  }),
  q({
    code: "own-alkohol_drogen-005", topic: "alkohol_drogen", points: 2, difficulty: 0.3, tags: ["alkohol", "abbau"],
    text: "Wie schnell baut der Körper Alkohol ab?",
    answers: [t("Etwa 0,1 Promille pro Stunde; der Abbau lässt sich nicht beschleunigen"), f("Etwa 0,5 Promille pro Stunde", "Der Abbau ist deutlich langsamer."), f("Kaffee und kalte Duschen beschleunigen den Abbau deutlich", "Sie machen höchstens wacher, senken aber die Konzentration nicht.")],
    explanation: "Der Körper baut nur etwa 0,1 Promille pro Stunde ab. Kaffee, Schlaf oder Bewegung ändern daran nichts; nur Zeit hilft.",
  }),
  q({
    code: "own-alkohol_drogen-006", topic: "alkohol_drogen", points: 3, difficulty: 0.3, tags: ["alkohol", "restalkohol"],
    text: "Sie haben bis 2 Uhr nachts reichlich Alkohol getrunken und wollen um 7 Uhr zur Arbeit fahren. Was gilt?",
    answers: [t("Mit Restalkohol muss gerechnet werden; die Fahrt ist möglicherweise nicht erlaubt"), f("Nach fünf Stunden Schlaf ist der Alkohol sicher abgebaut", "Bei etwa 0,1 Promille Abbau pro Stunde können noch erhebliche Werte vorliegen."), f("Ein kräftiges Frühstück neutralisiert den Alkohol", "Essen beschleunigt den Abbau nicht.")],
    explanation: "Restalkohol ist eine häufige Ursache für Unfälle am Morgen. Wer spät und viel getrunken hat, kann am nächsten Vormittag noch über der Grenze liegen.",
  }),
  q({
    code: "own-alkohol_drogen-007", topic: "alkohol_drogen", points: 3, difficulty: 0.5, tags: ["cannabis", "thc", "drogen"],
    text: "Was gilt seit 2024 für Cannabis im Straßenverkehr?",
    answers: [t("Ab 3,5 Nanogramm THC pro Milliliter Blutserum liegt eine Ordnungswidrigkeit vor"), t("Für Fahranfänger in der Probezeit und Fahrer unter 21 Jahren gilt ein vollständiges Cannabisverbot am Steuer"), t("Wer unter Cannabiseinfluss fährt, darf keinen Alkohol getrunken haben"), f("Cannabis ist am Steuer seit der Legalisierung ohne Grenzwert erlaubt", "Es gibt einen festen Grenzwert und strenge Regeln für Fahranfänger.")],
    explanation: "Für THC gilt ein Grenzwert von 3,5 ng/ml im Blutserum. Für Fahranfänger und unter 21-Jährige gilt ein Cannabisverbot, und Mischkonsum mit Alkohol ist untersagt.",
    legalReference: "§ 24a StVG", reviewStatus: "needs_verification",
  }),
  q({
    code: "own-alkohol_drogen-008", topic: "alkohol_drogen", points: 2, difficulty: 0.2, tags: ["medikamente"],
    text: "Sie nehmen ein neues, rezeptfreies Medikament gegen Erkältung. Was sollten Sie beachten?",
    answers: [t("Beipackzettel lesen und im Zweifel Arzt oder Apotheke fragen, ob die Fahrtüchtigkeit beeinträchtigt wird"), f("Rezeptfreie Medikamente beeinträchtigen die Fahrtüchtigkeit nie", "Auch frei verkäufliche Mittel können müde machen oder die Reaktion verlangsamen."), f("Nur verschreibungspflichtige Medikamente sind relevant", "Die Verschreibungspflicht sagt nichts über die Wirkung auf das Fahren aus.")],
    explanation: "Viele Medikamente, auch rezeptfreie, wirken sich auf Aufmerksamkeit und Reaktionsvermögen aus. Wer unter Medikamenteneinfluss fahruntüchtig ist, macht sich strafbar.",
    legalReference: "§ 316 StGB; § 24a StVG",
  }),
  q({
    code: "own-alkohol_drogen-009", topic: "alkohol_drogen", points: 3, difficulty: 0.2, tags: ["alkohol", "wirkung"],
    text: "Wie wirkt sich Alkohol auf das Fahren aus?",
    answers: [t("Die Reaktionszeit verlängert sich"), t("Die Risikobereitschaft steigt"), t("Das Blickfeld verengt sich (Tunnelblick)"), f("Die Konzentration nimmt zu", "Alkohol senkt die Konzentrationsfähigkeit.")],
    explanation: "Alkohol verlängert die Reaktionszeit, engt das Sehfeld ein und lässt Gefahren kleiner erscheinen. Gleichzeitig steigt die Bereitschaft zu riskantem Verhalten.",
  }),
  q({
    code: "own-alkohol_drogen-010", topic: "alkohol_drogen", points: 2, difficulty: 0.4, tags: ["alkohol", "mpu"],
    text: "Ab welcher Blutalkoholkonzentration wird bei einer Trunkenheitsfahrt in der Regel eine medizinisch-psychologische Untersuchung (MPU) angeordnet?",
    answers: [t("Ab 1,6 Promille"), f("Ab 0,5 Promille", "Bei 0,5 Promille gibt es Bußgeld, Punkte und Fahrverbot, aber in der Regel keine MPU."), f("Ab 2,5 Promille", "Die MPU wird bereits bei niedrigeren Werten angeordnet.")],
    explanation: "Ab 1,6 Promille geht die Behörde von einem Alkoholproblem aus und ordnet vor der Neuerteilung der Fahrerlaubnis eine MPU an.",
    legalReference: "§ 13 FeV",
  }),
  q({
    code: "own-alkohol_drogen-011", topic: "alkohol_drogen", points: 2, difficulty: 0.4, tags: ["alkohol", "fahrrad"],
    text: "Ab welcher Blutalkoholkonzentration gelten Radfahrer als absolut fahruntüchtig?",
    answers: [t("Ab 1,6 Promille"), f("Ab 0,5 Promille", "Diese Grenze gilt für Kraftfahrzeuge."), f("Für Radfahrer gibt es keine Grenze", "Auch Radfahrer können sich strafbar machen und ihre Fahrerlaubnis verlieren.")],
    explanation: "Radfahrer gelten ab 1,6 Promille als absolut fahruntüchtig. Eine Trunkenheitsfahrt mit dem Rad kann zur MPU und zum Verlust der Pkw-Fahrerlaubnis führen.",
    legalReference: "§ 316 StGB",
  }),
];
