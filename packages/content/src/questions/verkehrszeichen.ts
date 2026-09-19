// Übungsfragen zum Thema "verkehrszeichen" (eigene Formulierungen, kein amtlicher Prüfungsinhalt).
import type { Question } from "../types.js";
import { q, t, f } from "./_helpers.js";

export const verkehrszeichen: readonly Question[] = [
  q({
    code: "own-verkehrszeichen-001", topic: "verkehrszeichen", points: 2, difficulty: 0.1, tags: ["gefahrzeichen", "zeichenarten"],
    text: "Welche Art von Verkehrszeichen ist dreieckig mit rotem Rand und weißer Fläche?",
    answers: [t("Gefahrzeichen"), f("Vorschriftzeichen", "Vorschriftzeichen sind in der Regel rund."), f("Richtzeichen", "Richtzeichen sind meist rechteckig oder quadratisch und blau oder weiß.")],
    explanation: "Gefahrzeichen sind dreieckig mit rotem Rand und mahnen zu erhöhter Aufmerksamkeit. Vorschriftzeichen sind meist rund, Richtzeichen meist rechteckig.",
    legalReference: "§ 40 StVO, Anlage 1",
  }),
  q({
    code: "own-verkehrszeichen-002", topic: "verkehrszeichen", points: 4, difficulty: 0.2, tags: ["stoppschild", "vorfahrt_beschildert", "halten"],
    text: "Was müssen Sie am Stoppschild (Zeichen 206) tun?",
    answers: [t("Immer anhalten, und zwar an der Haltlinie oder, wenn keine vorhanden ist, dort, wo Sie die Kreuzung übersehen können"), f("Nur anhalten, wenn anderer Verkehr zu sehen ist", "Am Stoppschild besteht immer Anhaltepflicht."), f("Bei guter Sicht langsam heranrollen und weiterfahren", "Auch bei guter Übersicht muss das Fahrzeug zum Stillstand kommen.")],
    explanation: "Das Stoppschild verlangt immer ein vollständiges Anhalten, auch wenn kein Verkehr zu sehen ist. Anschließend ist Vorfahrt zu gewähren.",
    legalReference: "§ 41 StVO, Anlage 2 (Zeichen 206)",
  }),
  q({
    code: "own-verkehrszeichen-003", topic: "verkehrszeichen", points: 3, difficulty: 0.3, tags: ["vorfahrt_gewaehren", "vorfahrt_beschildert"],
    text: "Was bedeutet das Zeichen 205 (auf der Spitze stehendes Dreieck)?",
    answers: [t("Vorfahrt gewähren; anhalten müssen Sie nur, wenn es erforderlich ist"), f("Immer anhalten, auch ohne Verkehr", "Das ist die Regel am Stoppschild."), f("Sie haben Vorfahrt", "Das Zeichen bedeutet das Gegenteil.")],
    explanation: "Das Zeichen Vorfahrt gewähren verpflichtet zum Warten, wenn Fahrzeuge auf der bevorrechtigten Straße kommen. Ist die Kreuzung frei, dürfen Sie ohne Anhalten weiterfahren.",
    legalReference: "§ 41 StVO, Anlage 2 (Zeichen 205)",
  }),
  q({
    code: "own-verkehrszeichen-004", topic: "verkehrszeichen", points: 3, difficulty: 0.3, tags: ["verkehrsberuhigter_bereich", "innerorts", "parken"],
    text: "Was gilt in einem verkehrsberuhigten Bereich (Zeichen 325.1)?",
    answers: [t("Es darf nur mit Schrittgeschwindigkeit gefahren werden"), t("Kinderspiele sind überall erlaubt"), t("Parken ist nur auf gekennzeichneten Flächen erlaubt"), f("Fußgänger müssen den Gehweg benutzen", "Fußgänger dürfen die Straße in ganzer Breite benutzen.")],
    explanation: "Im verkehrsberuhigten Bereich gilt Schrittgeschwindigkeit, Fußgänger dürfen die gesamte Straße nutzen und Kinder überall spielen. Geparkt wird nur auf gekennzeichneten Flächen.",
    legalReference: "§ 42 StVO, Anlage 3 (Zeichen 325.1)",
  }),
  q({
    code: "own-verkehrszeichen-005", topic: "verkehrszeichen", points: 3, difficulty: 0.3, tags: ["halteverbot", "halten", "parken"],
    text: "Was ist im eingeschränkten Halteverbot (Zeichen 286) erlaubt?",
    answers: [t("Halten bis zu drei Minuten sowie zum Ein- oder Aussteigen und zum Be- oder Entladen"), f("Parken bis zu 30 Minuten", "Parken ist im eingeschränkten Halteverbot nicht erlaubt."), f("Gar nichts, auch kein kurzes Halten", "Das gilt im absoluten Halteverbot (Zeichen 283).")],
    explanation: "Im eingeschränkten Halteverbot darf bis zu drei Minuten gehalten werden, länger nur zum Ein- und Aussteigen oder zum Be- und Entladen. Im absoluten Halteverbot ist jedes Halten verboten.",
    legalReference: "§ 41 StVO, Anlage 2 (Zeichen 283 und 286)",
  }),
  q({
    code: "own-verkehrszeichen-006", topic: "verkehrszeichen", points: 3, difficulty: 0.4, tags: ["fahrradstrasse", "radverkehr"],
    text: "Was gilt in einer Fahrradstraße (Zeichen 244.1)?",
    answers: [t("Kraftfahrzeuge dürfen sie nur benutzen, wenn ein Zusatzzeichen das erlaubt"), t("Es gilt eine Höchstgeschwindigkeit von 30 km/h"), t("Radfahrende dürfen nebeneinander fahren"), f("Kraftfahrzeuge haben Vorrang vor dem Radverkehr", "Der Radverkehr darf weder gefährdet noch behindert werden.")],
    explanation: "In Fahrradstraßen gilt Tempo 30, Radfahrende dürfen nebeneinander fahren und anderer Verkehr ist nur mit Zusatzzeichen zugelassen. Wer dort fahren darf, muss sich dem Radverkehr anpassen.",
    legalReference: "§ 41 StVO, Anlage 2 (Zeichen 244.1)",
  }),
  q({
    code: "own-verkehrszeichen-007", topic: "verkehrszeichen", points: 2, difficulty: 0.3, tags: ["zone_30", "innerorts", "geschwindigkeit"],
    text: "Wie lange gilt die Geschwindigkeitsbeschränkung in einer Tempo-30-Zone?",
    answers: [t("Bis zum Zeichen, das das Ende der Zone anzeigt"), f("Nur bis zur nächsten Kreuzung", "Zonenregelungen gelten nicht nur bis zur nächsten Kreuzung."), f("Nur für 500 Meter ab dem Zeichen", "Es gibt keine feste Streckenlänge.")],
    explanation: "Zonenbeschränkungen gelten ab dem Zeichen für das gesamte Gebiet bis zum Aufhebungszeichen, auch über Kreuzungen hinweg.",
    legalReference: "§ 41 StVO, Anlage 2 (Zeichen 274.1)",
  }),
  q({
    code: "own-verkehrszeichen-008", topic: "verkehrszeichen", points: 3, difficulty: 0.3, tags: ["verbot_der_einfahrt", "einbahnstrasse"],
    text: "Was bedeutet das runde rote Zeichen mit weißem Querbalken (Zeichen 267)?",
    answers: [t("Verbot der Einfahrt; die Straße darf in dieser Richtung nicht befahren werden"), f("Durchfahrt für Anlieger frei", "Ohne Zusatzzeichen gilt das Verbot für alle."), f("Verbot nur für Lastkraftwagen", "Das Zeichen gilt für alle Fahrzeuge.")],
    explanation: "Das Zeichen Verbot der Einfahrt steht meist am Ende einer Einbahnstraße. Wer hier einfährt, fährt gegen die vorgeschriebene Fahrtrichtung.",
    legalReference: "§ 41 StVO, Anlage 2 (Zeichen 267)",
  }),
  q({
    code: "own-verkehrszeichen-009", topic: "verkehrszeichen", points: 2, difficulty: 0.4, tags: ["gefahrzeichen", "ausserorts"],
    text: "In welcher Entfernung vor der Gefahrstelle stehen Gefahrzeichen außerhalb geschlossener Ortschaften in der Regel?",
    answers: [t("Etwa 150 bis 250 Meter davor"), f("Unmittelbar an der Gefahrstelle", "Dann bliebe keine Zeit, sich darauf einzustellen."), f("Etwa einen Kilometer davor", "So weit im Voraus stehen sie normalerweise nicht.")],
    explanation: "Außerorts stehen Gefahrzeichen in der Regel 150 bis 250 Meter vor der Gefahrstelle, innerorts meist kurz davor. Abweichende Entfernungen werden per Zusatzzeichen angegeben.",
    legalReference: "VwV-StVO zu § 40",
  }),
  q({
    code: "own-verkehrszeichen-010", topic: "verkehrszeichen", points: 4, difficulty: 0.3, tags: ["andreaskreuz", "bahnuebergang"],
    text: "Was bedeutet das Andreaskreuz (Zeichen 201)?",
    answers: [t("Schienenfahrzeuge haben am Bahnübergang Vorrang"), f("Hier endet eine Vorfahrtstraße", "Das Andreaskreuz kennzeichnet einen Bahnübergang."), f("Hier darf im Schritttempo überholt werden", "Am Bahnübergang gilt ein Überholverbot.")],
    explanation: "Das Andreaskreuz steht unmittelbar vor dem Bahnübergang und weist auf den Vorrang des Schienenverkehrs hin. Vor dem Zeichen ist zu warten, wenn sich ein Schienenfahrzeug nähert.",
    legalReference: "§ 41 StVO, Anlage 2 (Zeichen 201); § 19 StVO",
  }),
  q({
    code: "own-verkehrszeichen-011", topic: "verkehrszeichen", points: 3, difficulty: 0.4, tags: ["vorfahrt_beschildert", "vorfahrt"],
    text: "Wofür gilt das Zeichen 301 „Vorfahrt“ (Dreieck mit rotem Rand und breitem schwarzem Pfeil)?",
    answers: [t("Nur für die nächste Kreuzung oder Einmündung"), f("Für die gesamte Straße bis zum Aufhebungszeichen", "Das ist die Wirkung der Vorfahrtstraße (Zeichen 306)."), f("Für eine Strecke von einem Kilometer", "Es gibt keine feste Streckenlänge.")],
    explanation: "Zeichen 301 gewährt Vorfahrt nur an der nächsten Kreuzung oder Einmündung. Dauerhaft bevorrechtigt ist man nur auf einer Vorfahrtstraße (Zeichen 306).",
    legalReference: "§ 42 StVO, Anlage 3 (Zeichen 301)",
  }),
  q({
    code: "own-verkehrszeichen-012", topic: "verkehrszeichen", points: 3, difficulty: 0.3, tags: ["ueberholverbot", "ueberholen"],
    text: "Was verbietet das Zeichen 276 (rotes und schwarzes Auto im roten Kreis)?",
    answers: [t("Das Überholen von mehrspurigen Kraftfahrzeugen und Krafträdern mit Beiwagen"), f("Das Überholen von Fahrrädern", "Einspurige Fahrzeuge dürfen bei ausreichendem Abstand überholt werden."), f("Das Fahren mit mehr als 60 km/h", "Das Zeichen regelt keine Geschwindigkeit.")],
    explanation: "Zeichen 276 verbietet Kraftfahrzeugen das Überholen mehrspuriger Kraftfahrzeuge und von Krafträdern mit Beiwagen. Einspurige Fahrzeuge wie Fahrräder dürfen weiterhin mit ausreichendem Abstand überholt werden.",
    legalReference: "§ 41 StVO, Anlage 2 (Zeichen 276)",
  }),
];
