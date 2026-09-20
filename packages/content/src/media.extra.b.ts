// Zusätzliche Bildzuordnungen (Fragecode → Medien-ID) für die erweiterten Übungsfragen, Teil B
// (Halten und Parken, besondere Situationen, Unfall und Panne, Umwelt, Alkohol, Fahrzeugtechnik,
// Beleuchtung, Beförderung, Fahrphysik). Wird in media.ts neben QUESTION_MEDIA und QUESTION_MEDIA_A
// ausgewertet; Fragen ohne Eintrag haben kein Bild. Zugeordnet wird nur, wenn das Zeichen in der
// Frage vorkommt oder die Szene die Situation zeigt.
export const QUESTION_MEDIA_B: Readonly<Record<string, string>> = {
  // Halten und Parken
  "own-halten_parken-011": "314_1044-10",
  "own-halten_parken-012": "201-50",
  "own-halten_parken-013": "283",
  "own-halten_parken-014": "286",
  "own-halten_parken-015": "293",
  "own-halten_parken-017": "315-55",
  "own-halten_parken-021": "306",
  "own-halten_parken-023": "314",
  "own-halten_parken-024": "220-20",
  "own-halten_parken-028": "325-1",
  "own-halten_parken-029": "290-1",
  "own-halten_parken-030": "1044-30",
  "own-halten_parken-031": "1010-66",
  "own-halten_parken-032": "298",
  "own-halten_parken-033": "229",
  "own-halten_parken-038": "224",
  "own-halten_parken-042": "283",
  // Besondere Situationen
  "own-besondere_situationen-012": "620-41",
  "own-besondere_situationen-013": "327",
  "own-besondere_situationen-014": "327",
  "own-besondere_situationen-016": "linienbus-warnblinklicht",
  "own-besondere_situationen-019": "150",
  "own-besondere_situationen-020": "bahnuebergang-rotlicht",
  "own-besondere_situationen-023": "268",
  "own-besondere_situationen-029": "264",
  "own-besondere_situationen-030": "114",
  "own-besondere_situationen-036": "rettungsgasse-drei-fahrstreifen",
  "own-besondere_situationen-040": "128",
  // Unfall und Panne
  "own-unfall_panne-028": "notrufsaeule-leitpfosten",
  "own-unfall_panne-030": "panne-warndreieck-autobahn",
  "own-unfall_panne-038": "328",
  // Umwelt
  "own-umwelt-014": "270-1",
  "own-umwelt-032": "270-2",
  "own-umwelt-039": "253",
  // Fahrzeugtechnik
  "own-fahrzeugtechnik-040": "alpine",
  // Beleuchtung
  "own-beleuchtung-032": "327",
  // Beförderung
  "own-befoerderung-023": "253",
  "own-befoerderung-024": "1010-59",
  "own-befoerderung-025": "265",
  // Fahrphysik
  "own-fahrphysik-011": "anhalteweg-schema",
  "own-fahrphysik-012": "anhalteweg-schema",
  "own-fahrphysik-013": "anhalteweg-schema",
  "own-fahrphysik-014": "anhalteweg-schema",
  "own-fahrphysik-018": "anhalteweg-schema",
  "own-fahrphysik-032": "117-10",
  "own-fahrphysik-038": "108-10",
  "own-fahrphysik-039": "anhalteweg-schema",
  "own-fahrphysik-040": "anhalteweg-schema",
};
