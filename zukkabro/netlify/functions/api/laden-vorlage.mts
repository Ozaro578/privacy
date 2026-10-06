// Laden in Heilbronn: Standard-Einstellungen und Start-Karte (Matcha & Açaí Bowls).
// Gilt, solange im Admin-Bereich unter "Laden" nichts anderes gespeichert ist.
export interface LadenZeit { tag: string; offen: boolean; von: string; bis: string }
export interface LadenEinstellungen {
  name: string; strasse: string; plz: string; ort: string; hinweis: string; aktiv: boolean; zeiten: LadenZeit[];
}
export interface KarteEintrag {
  id: string; name: string; art: "matcha" | "bowl" | "extra" | "sonstiges"; preis: number | null;
  beschreibung: string; allergene: string[]; mwst: number; aktiv: boolean;
}
export const LADEN_STANDARD: LadenEinstellungen = {
  "name": "ZUKKABRO Laden",
  "strasse": "Klingenberger Straße 100",
  "plz": "74080",
  "ort": "Heilbronn",
  "hinweis": "Matcha & Açaí Bowls gibt es bei uns am Wochenende. Die genauen Öffnungszeiten geben wir zur Eröffnung bekannt.",
  "aktiv": true,
  "zeiten": [
    { "tag": "Mo", "offen": false, "von": "", "bis": "" },
    { "tag": "Di", "offen": false, "von": "", "bis": "" },
    { "tag": "Mi", "offen": false, "von": "", "bis": "" },
    { "tag": "Do", "offen": false, "von": "", "bis": "" },
    { "tag": "Fr", "offen": false, "von": "", "bis": "" },
    { "tag": "Sa", "offen": false, "von": "", "bis": "" },
    { "tag": "So", "offen": false, "von": "", "bis": "" }
  ]
};
export const KARTE_VORLAGE: KarteEintrag[] = [
  { "id": "matcha-latte", "name": "Matcha Latte", "art": "matcha", "preis": 590, "beschreibung": "Zeremonieller Matcha mit Milch oder Haferdrink, heiß oder auf Eis.", "allergene": ["Milch"], "mwst": 19, "aktiv": true },
  { "id": "iced-matcha", "name": "Iced Matcha", "art": "matcha", "preis": 620, "beschreibung": "Matcha auf Eis mit Haferdrink und Vanille.", "allergene": ["Gluten"], "mwst": 19, "aktiv": true },
  { "id": "strawberry-matcha", "name": "Strawberry Matcha", "art": "matcha", "preis": 690, "beschreibung": "Erdbeerpüree, Milch, Matcha-Schicht, auf Eis.", "allergene": ["Milch"], "mwst": 19, "aktiv": true },
  { "id": "matcha-lemonade", "name": "Matcha Lemonade", "art": "matcha", "preis": 550, "beschreibung": "Matcha mit Zitrone und Sprudel, ohne Milch.", "allergene": [], "mwst": 19, "aktiv": true },
  { "id": "acai-bowl-classic", "name": "Açaí Bowl Classic", "art": "bowl", "preis": 1090, "beschreibung": "Açaí, Banane, Beeren, Granola, Kokos.", "allergene": ["Gluten", "Schalenfrüchte"], "mwst": 7, "aktiv": true },
  { "id": "acai-bowl-choco", "name": "Açaí Bowl Choco", "art": "bowl", "preis": 1190, "beschreibung": "Açaí, Erdnussbutter, Kakao-Nibs, Banane, Granola.", "allergene": ["Gluten", "Erdnüsse", "Schalenfrüchte"], "mwst": 7, "aktiv": true },
  { "id": "acai-bowl-mango", "name": "Açaí Bowl Tropical", "art": "bowl", "preis": 1290, "beschreibung": "Açaí, Mango, Ananas, Kokosflocken, Chia.", "allergene": [], "mwst": 7, "aktiv": true },
  { "id": "topping-extra", "name": "Extra Topping", "art": "extra", "preis": 150, "beschreibung": "Granola, Beeren, Kokos, Erdnussbutter, Kakao-Nibs oder Honig.", "allergene": ["Gluten", "Erdnüsse", "Schalenfrüchte"], "mwst": 7, "aktiv": true },
  { "id": "hafer-statt-milch", "name": "Haferdrink statt Milch", "art": "extra", "preis": 70, "beschreibung": "Für alle Matcha-Drinks.", "allergene": ["Gluten"], "mwst": 19, "aktiv": true }
];
