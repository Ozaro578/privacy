// Übungsfragen zum Thema "besondere_situationen" (eigene Formulierungen, kein amtlicher Prüfungsinhalt).
import type { Question } from "../types";
import { q, t, f } from "./_helpers";

export const besondereSituationen: readonly Question[] = [
  q({
    code: "own-besondere_situationen-001", topic: "besondere_situationen", points: 4, difficulty: 0.4, tags: ["aquaplaning", "naesse", "hohes_risiko"],
    text: "Ihr Fahrzeug gerät bei starkem Regen ins Aquaplaning. Wie verhalten Sie sich?",
    answers: [t("Gas wegnehmen, bei Schaltgetriebe auskuppeln, Lenkrad ruhig halten und nicht stark bremsen"), f("Sofort eine Vollbremsung einleiten", "Ohne Bodenkontakt kann das Fahrzeug bei Bremsen und Lenken unkontrollierbar werden."), f("Kräftig gegenlenken, um in der Spur zu bleiben", "Bei Aquaplaning haben die Räder keinen Kontakt; ein starker Lenkeinschlag wirkt erst wieder bei Bodenkontakt und kann das Fahrzeug ausbrechen lassen.")],
    explanation: "Bei Aquaplaning schwimmen die Reifen auf einem Wasserfilm. Ruhig bleiben, Gas wegnehmen, auskuppeln und das Lenkrad geradehalten, bis die Reifen wieder greifen.",
  }),
  q({
    code: "own-besondere_situationen-002", topic: "besondere_situationen", points: 3, difficulty: 0.3, tags: ["wildwechsel", "ausserorts", "dunkelheit"],
    text: "Nachts auf der Landstraße taucht plötzlich ein Reh am Fahrbahnrand auf. Wie verhalten Sie sich?",
    answers: [t("Abblenden, hupen, kontrolliert bremsen und das Lenkrad festhalten, nicht ausweichen"), f("Fernlicht einschalten, damit das Tier flüchtet", "Fernlicht blendet das Tier, es bleibt eher stehen."), f("Stark ausweichen, um das Tier zu schonen", "Ausweichmanöver enden oft an Bäumen oder im Gegenverkehr und sind gefährlicher als der Aufprall.")],
    explanation: "Bei Wildwechsel: Abblenden, hupen, bremsen und die Spur halten. Mit weiteren Tieren rechnen, denn Wild ist selten allein unterwegs.",
    mnemonic: "Abblenden, hupen, bremsen, Spur halten.",
  }),
  q({
    code: "own-besondere_situationen-003", topic: "besondere_situationen", points: 3, difficulty: 0.3, tags: ["glaette", "bruecke", "winter"],
    text: "Bei Temperaturen um den Gefrierpunkt fahren Sie über eine Brücke. Womit müssen Sie rechnen?",
    answers: [t("Auf Brücken bildet sich Glätte früher als auf der übrigen Strecke"), f("Brücken sind wegen des Verkehrs immer eisfrei", "Brücken kühlen von allen Seiten aus und frieren zuerst zu."), f("Glätte gibt es nur bei Schneefall", "Auch bei Nässe und Frost ohne Schnee entsteht Glätte.")],
    explanation: "Brücken und schattige Waldstücke vereisen zuerst, weil ihnen die Wärme des Bodens fehlt. Dort Geschwindigkeit reduzieren und weiche Lenk- und Bremsbewegungen ausführen.",
  }),
  q({
    code: "own-besondere_situationen-004", topic: "besondere_situationen", points: 3, difficulty: 0.2, tags: ["stau", "warnblinklicht", "autobahn"],
    text: "Sie nähern sich auf der Autobahn einem Stauende. Was tun Sie?",
    answers: [t("Warnblinklicht einschalten, Geschwindigkeit deutlich verringern und den nachfolgenden Verkehr im Spiegel beobachten"), f("Auf den Seitenstreifen ausweichen und am Stau vorbeifahren", "Der Seitenstreifen ist kein Fahrstreifen."), f("Das Warnblinklicht erst am Stillstand einschalten", "Es soll den nachfolgenden Verkehr rechtzeitig warnen.")],
    explanation: "Das Warnblinklicht darf und soll eingeschaltet werden, um vor einem Stauende oder einer plötzlichen Gefahr zu warnen. So vermeiden Sie Auffahrunfälle.",
    legalReference: "§ 16 Abs. 2 StVO",
  }),
  q({
    code: "own-besondere_situationen-005", topic: "besondere_situationen", points: 4, difficulty: 0.3, tags: ["einsatzfahrzeug", "blaulicht", "innerorts"],
    text: "Hinter Ihnen nähert sich innerorts ein Einsatzfahrzeug mit Blaulicht und Einsatzhorn. Wie verhalten Sie sich?",
    answers: [t("Sofort freie Bahn schaffen, nach rechts fahren und wenn nötig anhalten"), f("Mit gleicher Geschwindigkeit weiterfahren, damit der Verkehr fließt", "Das Einsatzfahrzeug braucht freie Bahn."), f("Auf die Gegenfahrbahn ausweichen, um Platz zu machen", "Das gefährdet den Gegenverkehr; nach rechts ausweichen.")],
    explanation: "Blaulicht mit Einsatzhorn verpflichtet alle, sofort freie Bahn zu schaffen. Dabei ruhig bleiben, nach rechts fahren und keine anderen gefährden.",
    legalReference: "§ 38 Abs. 1 StVO",
  }),
  q({
    code: "own-besondere_situationen-006", topic: "besondere_situationen", points: 3, difficulty: 0.3, tags: ["tunnel", "beleuchtung", "abblendlicht"],
    text: "Was ist beim Durchfahren eines Tunnels richtig?",
    answers: [t("Abblendlicht einschalten, auch am Tag"), t("Nicht wenden und nicht rückwärtsfahren"), t("Sonnenbrille vor der Einfahrt abnehmen"), f("Nebelschlussleuchte einschalten, um besser gesehen zu werden", "Die Nebelschlussleuchte blendet und ist nur bei Nebel mit Sicht unter 50 Metern erlaubt.")],
    explanation: "In Tunneln muss auch tagsüber mit Abblendlicht gefahren werden. Wenden und Rückwärtsfahren sind verboten; ausreichender Abstand und Beachtung der Notausgänge erhöhen die Sicherheit.",
    legalReference: "§ 17 Abs. 1 StVO; Zeichen 327",
  }),
  q({
    code: "own-besondere_situationen-007", topic: "besondere_situationen", points: 2, difficulty: 0.3, tags: ["seitenwind", "ausserorts"],
    text: "Wo müssen Sie besonders mit starkem Seitenwind rechnen?",
    answers: [t("Auf Brücken, in Waldschneisen und beim Überholen von Lkw"), f("Nur auf Autobahnen", "Seitenwind tritt überall auf, besonders an exponierten Stellen."), f("Nur bei Regen", "Seitenwind ist unabhängig vom Niederschlag.")],
    explanation: "An Brücken, Waldrändern, Schneisen und beim Passieren großer Fahrzeuge kann der Wind plötzlich angreifen oder wegfallen. Lenkrad fest halten und Geschwindigkeit anpassen.",
  }),
  q({
    code: "own-besondere_situationen-008", topic: "besondere_situationen", points: 3, difficulty: 0.4, tags: ["bahnuebergang", "baken", "ausserorts", "ueberholen"],
    text: "Sie nähern sich außerorts einem Bahnübergang, vor dem Baken aufgestellt sind. Was gilt?",
    answers: [t("Zwischen den Baken und dem Bahnübergang dürfen Kraftfahrzeuge nicht überholt werden"), t("Sie dürfen sich dem Übergang nur mit mäßiger Geschwindigkeit nähern"), f("Sie sollten hupen, um den Zug zu warnen", "Hupen ist sinnlos; der Schienenverkehr hat Vorrang.")],
    explanation: "Ab der ersten Bake gilt bis zum Bahnübergang ein Überholverbot für Kraftfahrzeuge. Wer sich einem Bahnübergang nähert, muss mit mäßiger Geschwindigkeit fahren und auf Signale achten.",
    legalReference: "§ 19 Abs. 1 StVO",
  }),
  q({
    code: "own-besondere_situationen-009", topic: "besondere_situationen", points: 2, difficulty: 0.2, tags: ["blendung", "sonne"],
    text: "Die tiefstehende Sonne blendet Sie stark. Wie reagieren Sie?",
    answers: [t("Geschwindigkeit verringern, Sonnenblende nutzen und den Abstand vergrößern"), f("Weiterfahren wie bisher, die Blendung ist nur kurz", "Auch kurze Blendung kann Fußgänger und Radfahrer unsichtbar machen."), f("Fernlicht einschalten, um besser zu sehen", "Fernlicht hilft nicht gegen Blendung und blendet andere.")],
    explanation: "Bei Blendung sinkt die Sichtweite drastisch. Nur so schnell fahren, dass innerhalb der noch übersehbaren Strecke angehalten werden kann.",
    legalReference: "§ 3 Abs. 1 StVO",
  }),
  q({
    code: "own-besondere_situationen-010", topic: "besondere_situationen", points: 4, difficulty: 0.4, tags: ["reifenplatzer", "autobahn", "hohes_risiko"],
    text: "Auf der Autobahn platzt ein Reifen. Wie verhalten Sie sich?",
    answers: [t("Lenkrad mit beiden Händen festhalten, Gas wegnehmen, vorsichtig abbremsen, Warnblinklicht einschalten und auf den Seitenstreifen fahren"), f("Sofort eine Vollbremsung machen", "Eine abrupte Bremsung kann das Fahrzeug ausbrechen lassen."), f("Sofort auf den linken Fahrstreifen wechseln und anhalten", "Angehalten wird rechts auf dem Seitenstreifen.")],
    explanation: "Nach einem Reifenplatzer zieht das Fahrzeug zur Seite. Lenkrad festhalten, sanft verzögern und kontrolliert auf den Seitenstreifen fahren, dann absichern.",
  }),
];
