// Übungsfragen zum Thema "fahrzeugtechnik" (eigene Formulierungen, kein amtlicher Prüfungsinhalt).
import type { Question } from "../types.js";
import { q, t, f } from "./_helpers.js";

export const fahrzeugtechnik: readonly Question[] = [
  q({
    code: "own-fahrzeugtechnik-001", topic: "fahrzeugtechnik", points: 3, difficulty: 0.2, tags: ["reifen", "profiltiefe"], kind: "numeric", numericAnswer: 1.6, tolerance: 0, unit: "mm",
    text: "Welche Mindestprofiltiefe schreibt der Gesetzgeber für Pkw-Reifen vor? Angabe in Millimetern.",
    answers: [],
    explanation: "Die gesetzliche Mindestprofiltiefe beträgt 1,6 mm. Aus Sicherheitsgründen werden mindestens 3 mm bei Sommerreifen und 4 mm bei Winterreifen empfohlen.",
    legalReference: "§ 36 Abs. 2 StVZO",
  }),
  q({
    code: "own-fahrzeugtechnik-002", topic: "fahrzeugtechnik", points: 3, difficulty: 0.3, tags: ["winterreifen", "alpine_symbol", "winter"],
    text: "Welche Reifen erfüllen bei winterlichen Straßenverhältnissen die Winterreifenpflicht?",
    answers: [t("Nur Reifen mit dem Alpine-Symbol (Bergpiktogramm mit Schneeflocke)"), f("Auch Reifen, die nur mit M+S gekennzeichnet sind", "Seit dem 1. Oktober 2024 reicht die M+S-Kennzeichnung allein nicht mehr aus."), f("Alle Reifen mit mindestens 4 mm Profil", "Die Profiltiefe ersetzt nicht die Wintertauglichkeit.")],
    explanation: "Bei Glatteis, Schneeglätte, Schneematsch, Eis- oder Reifglätte dürfen nur Reifen mit Alpine-Symbol gefahren werden. Die Übergangsfrist für reine M+S-Reifen endete am 30. September 2024.",
    legalReference: "§ 2 Abs. 3a StVO; § 36 StVZO",
  }),
  q({
    code: "own-fahrzeugtechnik-003", topic: "fahrzeugtechnik", points: 2, difficulty: 0.2, tags: ["hauptuntersuchung", "hu"],
    text: "In welchen Abständen muss ein Pkw zur Hauptuntersuchung?",
    answers: [t("Alle zwei Jahre, bei einem Neuwagen erstmals nach drei Jahren"), f("Jedes Jahr", "Pkw müssen nur alle zwei Jahre vorgeführt werden."), f("Alle fünf Jahre", "Das Intervall ist deutlich kürzer.")],
    explanation: "Pkw müssen alle 24 Monate zur Hauptuntersuchung, Neuwagen erstmals nach 36 Monaten. Die Plakette am hinteren Kennzeichen zeigt den nächsten Termin.",
    legalReference: "§ 29 StVZO, Anlage VIII",
  }),
  q({
    code: "own-fahrzeugtechnik-004", topic: "fahrzeugtechnik", points: 3, difficulty: 0.3, tags: ["kontrollleuchte", "oeldruck"],
    text: "Während der Fahrt leuchtet die rote Öldruck-Kontrollleuchte auf. Was tun Sie?",
    answers: [t("Sofort sicher anhalten und den Motor abstellen; Ölstand prüfen und im Zweifel den Pannendienst rufen"), f("Bis zur nächsten Werkstatt weiterfahren", "Ohne Öldruck kann der Motor innerhalb kurzer Zeit schwer beschädigt werden."), f("Motor laufen lassen und Öl nachfüllen", "Der Motor muss zuerst abgestellt werden.")],
    explanation: "Die rote Öldruckleuchte bedeutet, dass der Motor nicht mehr ausreichend geschmiert wird. Weiterfahren kann zum Motorschaden führen; sofort anhalten und Motor abstellen.",
  }),
  q({
    code: "own-fahrzeugtechnik-005", topic: "fahrzeugtechnik", points: 2, difficulty: 0.2, tags: ["motoroel", "sicherheitskontrolle"],
    text: "Wie prüfen Sie den Motorölstand richtig?",
    answers: [t("Fahrzeug auf ebener Fläche, Motor betriebswarm und einige Minuten abgestellt, Peilstab abwischen, einstecken und erneut ablesen"), f("Bei laufendem Motor an einer Steigung", "Auf einer Steigung und bei laufendem Motor ist der Wert falsch."), f("Nur nach einer längeren Autobahnfahrt direkt am Peilstab ablesen", "Direkt nach dem Abstellen ist das Öl noch nicht in die Wanne zurückgelaufen.")],
    explanation: "Der Ölstand wird auf ebener Fläche bei abgestelltem, warmem Motor nach kurzer Wartezeit gemessen. Der Stand muss zwischen der Minimal- und Maximalmarkierung liegen.",
  }),
  q({
    code: "own-fahrzeugtechnik-006", topic: "fahrzeugtechnik", points: 2, difficulty: 0.2, tags: ["reifendruck", "sicherheitskontrolle"],
    text: "Wann und wo prüfen Sie den Reifendruck richtig?",
    answers: [t("Bei kalten Reifen; die richtigen Werte stehen in der Betriebsanleitung, im Tankdeckel oder im Türholm"), f("Nur bei warmen Reifen nach längerer Fahrt", "Warme Reifen zeigen einen zu hohen Druck an."), f("Immer auf 3,5 bar unabhängig vom Fahrzeug", "Der richtige Druck hängt von Fahrzeug und Beladung ab.")],
    explanation: "Der Reifendruck wird bei kalten Reifen geprüft, mindestens alle 14 Tage und vor längeren Fahrten. Bei voller Beladung gilt der höhere Wert aus der Tabelle des Herstellers.",
  }),
  q({
    code: "own-fahrzeugtechnik-007", topic: "fahrzeugtechnik", points: 2, difficulty: 0.4, tags: ["bremsfluessigkeit", "bremsen"],
    text: "Warum muss die Bremsflüssigkeit regelmäßig gewechselt werden?",
    answers: [t("Sie nimmt mit der Zeit Wasser auf, wodurch der Siedepunkt sinkt und die Bremse bei starker Beanspruchung versagen kann"), f("Weil sie sich mit dem Motoröl vermischt", "Bremsflüssigkeit und Motoröl sind getrennte Systeme."), f("Sie muss nie gewechselt werden", "Die meisten Hersteller empfehlen einen Wechsel etwa alle zwei Jahre.")],
    explanation: "Bremsflüssigkeit ist hygroskopisch und zieht Wasser an. Bei hohen Temperaturen können sich Dampfblasen bilden, dann fällt die Bremswirkung aus. Wechsel nach Herstellervorgabe, meist etwa alle zwei Jahre.",
  }),
  q({
    code: "own-fahrzeugtechnik-008", topic: "fahrzeugtechnik", points: 2, difficulty: 0.3, tags: ["schneeketten", "winter", "geschwindigkeit"],
    text: "Wie schnell dürfen Sie mit montierten Schneeketten höchstens fahren?",
    answers: [t("50 km/h"), f("80 km/h", "Mit Schneeketten gilt eine niedrigere Grenze."), f("30 km/h", "Erlaubt sind bis zu 50 km/h.")],
    explanation: "Mit Schneeketten darf höchstens 50 km/h gefahren werden, auch wenn Verkehrszeichen mehr erlauben würden.",
    legalReference: "§ 3 Abs. 4 StVO",
  }),
  q({
    code: "own-fahrzeugtechnik-009", topic: "fahrzeugtechnik", points: 2, difficulty: 0.2, tags: ["fahrzeugpapiere", "zulassung"],
    text: "Welches Dokument müssen Sie beim Fahren neben dem Führerschein mitführen?",
    answers: [t("Die Zulassungsbescheinigung Teil I (Fahrzeugschein)"), f("Die Zulassungsbescheinigung Teil II (Fahrzeugbrief)", "Teil II gehört sicher verwahrt, nicht ins Fahrzeug."), f("Den Kaufvertrag des Fahrzeugs", "Der Kaufvertrag ist keine Fahrzeugurkunde.")],
    explanation: "Die Zulassungsbescheinigung Teil I muss mitgeführt und auf Verlangen vorgezeigt werden. Teil II bleibt zu Hause, weil er das Eigentum dokumentiert.",
    legalReference: "§ 11 FZV",
  }),
  q({
    code: "own-fahrzeugtechnik-010", topic: "fahrzeugtechnik", points: 2, difficulty: 0.3, tags: ["stossdaempfer", "fahrwerk"],
    text: "Woran erkennen Sie verschlissene Stoßdämpfer und welche Folgen haben sie?",
    answers: [t("Das Fahrzeug schaukelt nach Bodenwellen nach; der Bremsweg wird länger und die Kurvenstabilität sinkt"), f("Der Motor läuft unrund", "Stoßdämpfer haben mit dem Motorlauf nichts zu tun."), f("Es gibt keine Folgen, solange die Federn intakt sind", "Ohne wirksame Dämpfung verlieren die Räder Bodenkontakt.")],
    explanation: "Defekte Stoßdämpfer lassen die Räder springen, verlängern den Bremsweg und verschlechtern das Kurvenverhalten. Nachschwingen der Karosserie ist ein typisches Anzeichen.",
  }),
];
