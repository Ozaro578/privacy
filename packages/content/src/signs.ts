// Verkehrszeichenkatalog: alle Zeichen der StVO-Anlagen 1 bis 4 und die gebräuchlichen Zusatzzeichen als eigene Vektorzeichnungen.
import { SIGN_CATALOG } from "./signs.catalog";

export type SignCategory = "gefahrzeichen" | "vorschriftzeichen" | "richtzeichen" | "verkehrseinrichtungen" | "zusatzzeichen";
export interface SignEntry {
  id: string;
  number: string;
  name: string;
  category: SignCategory;
  meaning: string;
  alt: string;
  /** Pfad relativ zu packages/content/media */
  file: string;
  note?: string;
}

export const SIGN_CATEGORY_LABEL: Record<SignCategory, string> = {
  gefahrzeichen: "Gefahrzeichen (Anlage 1)",
  vorschriftzeichen: "Vorschriftzeichen (Anlage 2)",
  richtzeichen: "Richtzeichen (Anlage 3)",
  verkehrseinrichtungen: "Verkehrseinrichtungen (Anlage 4)",
  zusatzzeichen: "Zusatzzeichen",
};

export const signs: readonly SignEntry[] = SIGN_CATALOG;
const byId = new Map(signs.map((s) => [s.id, s]));
export const signById = (id: string): SignEntry | undefined => byId.get(id);
export const signsByCategory = (c: SignCategory): SignEntry[] => signs.filter((s) => s.category === c);
