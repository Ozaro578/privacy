// Bildmedien der Übungsfragen: Verkehrszeichen (StVO, amtliche Werke) und Situationsgrafiken.
// Die SVG-Dateien werden mit `node scripts/gen-media.mjs` erzeugt und liegen unter media/ (manifest.json).
import { MEDIA_MANIFEST } from "./media.manifest.js";

export type MediaKind = "sign" | "scene";
export interface MediaItem {
  id: string;
  /** Pfad relativ zu packages/content/media, z. B. "signs/205.svg". */
  file: string;
  kind: MediaKind;
  alt: string;
  credit: string;
}

export const MEDIA: readonly MediaItem[] = MEDIA_MANIFEST;
const byId = new Map(MEDIA.map((m) => [m.id, m]));
export const mediaById = (id: string): MediaItem | undefined => byId.get(id);

/** Öffentlicher URL-Pfad, unter dem die Web-App die Datei ausliefert (apps/web/public/media/questions). */
export const PUBLIC_MEDIA_PREFIX = "/media/questions/";
export const mediaPublicPath = (m: MediaItem): string => `${PUBLIC_MEDIA_PREFIX}${m.file}`;

/** Zuordnung Fragecode → Medien-ID. Fragen ohne Eintrag haben kein Bild. */
export const QUESTION_MEDIA: Readonly<Record<string, string>> = {
  // Vorfahrt
  "own-vorfahrt-001": "vorfahrt-rechts-vor-links",
  "own-vorfahrt-002": "vorfahrt-t-einmuendung",
  "own-vorfahrt-003": "vorfahrt-grundstuecksausfahrt",
  "own-vorfahrt-004": "vorfahrt-linksabbiegen-gegenverkehr",
  "own-vorfahrt-005": "vorfahrt-einsatzfahrzeug",
  "own-vorfahrt-006": "vorfahrt-abknickend",
  "own-vorfahrt-007": "vorfahrt-rvl-drei",
  "own-vorfahrt-008": "vorfahrt-feldweg",
  "own-vorfahrt-010": "vorfahrt-ampel-ausgefallen",
  "own-vorfahrt-011": "vorfahrt-rechtsabbiegen-radweg",
  // Verkehrszeichen
  "own-verkehrszeichen-001": "101",
  "own-verkehrszeichen-002": "206",
  "own-verkehrszeichen-003": "205",
  "own-verkehrszeichen-004": "325-1",
  "own-verkehrszeichen-005": "286",
  "own-verkehrszeichen-006": "244-1",
  "own-verkehrszeichen-007": "274-1",
  "own-verkehrszeichen-008": "267",
  "own-verkehrszeichen-009": "103-10",
  "own-verkehrszeichen-010": "201-50",
  "own-verkehrszeichen-011": "301",
  "own-verkehrszeichen-012": "276",
  // Verkehrsregelung
  "own-verkehrsregelung-001": "ampel-gelb",
  "own-verkehrsregelung-002": "ampel-rot-gelb",
  "own-verkehrsregelung-003": "ampel-rot-gruenpfeilschild",
  "own-verkehrsregelung-004": "ampel-gruenpfeil-links",
  "own-verkehrsregelung-005": "polizist-seitlich",
  "own-verkehrsregelung-007": "dauerlichtzeichen-rotes-kreuz",
  "own-verkehrsregelung-008": "gelbes-blinklicht",
  "own-verkehrsregelung-009": "bahnuebergang-rotlicht",
  "own-verkehrsregelung-010": "ampel-gruen-fussgaenger",
  // Kreisverkehr
  "own-kreisverkehr-001": "kreisverkehr-beschildert",
  "own-kreisverkehr-002": "215",
  "own-kreisverkehr-003": "kreisverkehr-ausfahrt-zebrastreifen",
  "own-kreisverkehr-004": "215",
  "own-kreisverkehr-005": "215",
  "own-kreisverkehr-006": "kreisverkehr-ohne-zeichen",
  "own-kreisverkehr-007": "kreisverkehr-ausfahrt-zebrastreifen",
  "own-kreisverkehr-008": "kreisverkehr-richtung",
  "own-kreisverkehr-009": "215",
  // Straßenbenutzung
  "own-strassenbenutzung-001": "rettungsgasse-drei-fahrstreifen",
  "own-strassenbenutzung-002": "rettungsgasse-drei-fahrstreifen",
  "own-strassenbenutzung-003": "beschleunigungsstreifen",
  "own-strassenbenutzung-004": "330-1_331-1",
  "own-strassenbenutzung-005": "330-1",
  "own-strassenbenutzung-006": "330-1",
  "own-strassenbenutzung-007": "reissverschluss",
  "own-strassenbenutzung-008": "stau-rechts-schneller",
  // Geschwindigkeit, Gefahrenlehre, Fahrphysik
  "own-geschwindigkeit-001": "310",
  "own-geschwindigkeit-002": "311",
  "own-geschwindigkeit-004": "abstand-halber-tacho",
  "own-geschwindigkeit-005": "anhalteweg-schema",
  "own-geschwindigkeit-006": "anhalteweg-schema",
  "own-geschwindigkeit-007": "anhalteweg-schema",
  "own-geschwindigkeit-010": "abstand-halber-tacho",
  "own-geschwindigkeit-012": "anhalteweg-schema",
  "own-gefahrenlehre-001": "anhalteweg-schema",
  "own-gefahrenlehre-004": "anhalteweg-schema",
  "own-gefahrenlehre-009": "anhalteweg-schema",
  "own-fahrphysik-010": "anhalteweg-schema",
  // Andere Verkehrsteilnehmer
  "own-andere_teilnehmer-001": "ueberholabstand-radfahrer",
  "own-andere_teilnehmer-002": "zebrastreifen-fussgaenger",
  "own-andere_teilnehmer-003": "linienbus-warnblinklicht",
  "own-andere_teilnehmer-004": "224",
  "own-andere_teilnehmer-005": "136-10",
  // Fahrmanöver
  "own-fahrmanoever-003": "linksabbieger-begegnen",
  "own-fahrmanoever-005": "276",
  "own-fahrmanoever-007": "272",
  "own-fahrmanoever-009": "hindernis-gegenverkehr",
  // Halten und Parken
  "own-halten_parken-002": "halten-parken-kreuzung-5m",
  "own-halten_parken-004": "283_286",
  "own-halten_parken-005": "224",
  "own-halten_parken-008": "220-20",
  "own-halten_parken-010": "schutzstreifen-radverkehr",
  "own-halten_parken-011": "314_1044-10",
  "own-halten_parken-012": "201-50",
  // Besondere Situationen
  "own-besondere_situationen-002": "142-10",
  "own-besondere_situationen-003": "114",
  "own-besondere_situationen-004": "stauende-warnblinklicht",
  "own-besondere_situationen-005": "einsatzfahrzeug-hinten",
  "own-besondere_situationen-007": "117-10",
  "own-besondere_situationen-008": "bahnuebergang-baken",
  // Unfall und Panne
  "own-unfall_panne-001": "panne-warndreieck-autobahn",
  "own-unfall_panne-007": "panne-warndreieck-autobahn",
  "own-unfall_panne-010": "notrufsaeule-leitpfosten",
  // Umwelt, Fahrzeugtechnik
  "own-umwelt-005": "270-1",
  "own-fahrzeugtechnik-002": "alpine",
  "own-fahrzeugtechnik-004": "oeldruck",
};

export const mediaForQuestion = (code: string): MediaItem | undefined => {
  const id = QUESTION_MEDIA[code];
  return id ? byId.get(id) : undefined;
};
