import type { MaterialKind, TopicCode, TopicMeta } from "./types";

/** Fahrerlaubnisklassen, für die der Zusatzstoff dieses Pakets gilt. */
export const CLASS_B_CODES: readonly string[] = ["B", "B197", "B78"];

const basic = (code: TopicCode, nameDe: string, sortOrder: number): TopicMeta => ({ code, nameDe, materialKind: "basic", minQuestions: 8, sortOrder });
const classSpecific = (code: TopicCode, nameDe: string, sortOrder: number): TopicMeta => ({ code, nameDe, materialKind: "class_specific", minQuestions: 6, sortOrder });

export const TOPICS: readonly TopicMeta[] = [
  basic("gefahrenlehre", "Gefahrenlehre und Risikofaktor Mensch", 1),
  basic("recht", "Fahrerlaubnis und Recht", 2),
  basic("verkehrszeichen", "Verkehrszeichen", 3),
  basic("strassenbenutzung", "Straßenbenutzung und Autobahn", 4),
  basic("vorfahrt", "Vorfahrt", 5),
  basic("verkehrsregelung", "Lichtzeichen und Verkehrsregelung", 6),
  basic("geschwindigkeit", "Geschwindigkeit und Abstand", 7),
  basic("andere_teilnehmer", "Andere Verkehrsteilnehmer", 8),
  basic("fahrmanoever", "Abbiegen, Überholen, Fahrstreifenwechsel", 9),
  basic("kreisverkehr", "Kreisverkehr", 10),
  basic("halten_parken", "Halten und Parken", 11),
  basic("besondere_situationen", "Besondere Verkehrssituationen", 12),
  basic("unfall_panne", "Unfall, Panne und Erste Hilfe", 13),
  basic("umwelt", "Umweltschonendes Fahren", 14),
  basic("alkohol_drogen", "Alkohol, Drogen, Medikamente", 15),
  classSpecific("fahrzeugtechnik", "Fahrzeugtechnik und Sicherheitskontrollen", 20),
  classSpecific("beleuchtung", "Beleuchtung", 21),
  classSpecific("befoerderung", "Personen- und Güterbeförderung, Anhänger", 22),
  classSpecific("fahrphysik", "Fahrphysik und Assistenzsysteme", 23),
];

export const TOPIC_BY_CODE: Readonly<Record<TopicCode, TopicMeta>> = Object.fromEntries(TOPICS.map((t) => [t.code, t])) as Record<TopicCode, TopicMeta>;

export function materialKindOf(topic: TopicCode): MaterialKind {
  return TOPIC_BY_CODE[topic].materialKind;
}

/** Standard-Klassenliste je Stoffart: Grundstoff gilt für alle Klassen, Zusatzstoff für Klasse B. */
export function defaultLicenseCodes(kind: MaterialKind): string[] {
  return kind === "class_specific" ? [...CLASS_B_CODES] : [];
}
