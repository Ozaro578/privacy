// Endkunden-Shop: Preise, Einstellungen, Bestellungen über die Kasse.
// Alle Beträge in Cent. Endkundenpreise sind BRUTTO (inkl. MwSt).
import { SORTIMENT } from "./sortiment.mts";

export interface ShopPreis { preis: number; mwst: number }
export type ShopPreise = Record<string, ShopPreis>;
export interface ShopEinstellungen {
  versand: number;          // Versandkosten brutto in Cent
  versandfreiAb: number;    // ab diesem Warenwert (brutto) versandkostenfrei, 0 = nie
  abholung: boolean;        // Abholung möglich
  abholort: string;
  bankInhaber: string; bankIban: string; bankName: string;
  paypal: string;           // z. B. PayPal.me-Link oder E-Mail
  hinweis: string;          // Text auf der Bestellbestätigung
}
export const STANDARD_EINSTELLUNGEN: ShopEinstellungen = {
  versand: 590, versandfreiAb: 5000, abholung: true, abholort: "",
  bankInhaber: "", bankIban: "", bankName: "", paypal: "", hinweis: "",
};

const LEBENSMITTEL = ["susses", "snacks", "scharfes", "pipapo"];
/** Vorschlag MwSt: Lebensmittel 7 %, Getränke/Vapes/Sonstiges 19 % (mit Steuerberater prüfen) */
export function mwstVorschlag(id: string): number {
  const k = SORTIMENT[id]?.k || [];
  if (k.some((x) => x === "getraenke" || x === "vapes" || x === "elfbar")) return 19;
  return k.some((x) => LEBENSMITTEL.includes(x)) ? 7 : 19;
}

export function produkt(id: string) {
  return SORTIMENT[id] || null;
}

/** Alter in vollen Jahren am heutigen Tag */
export function alter(geburtsdatum: string, heute = new Date()): number {
  const [j, m, t] = geburtsdatum.split("-").map((x) => parseInt(x, 10));
  let a = heute.getFullYear() - j;
  const vorGeburtstag = heute.getMonth() + 1 < m || (heute.getMonth() + 1 === m && heute.getDate() < t);
  if (vorGeburtstag) a -= 1;
  return a;
}

/** MwSt-Anteil aus einem Bruttobetrag */
export function mwstAusBrutto(brutto: number, satz: number): number {
  return Math.round((brutto * satz) / (100 + satz));
}
