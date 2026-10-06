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
  ohnePreisAusblenden: boolean; // Produkte ohne Shop-Preis im Shop verstecken
  mailAn: string; mailVon: string; // Benachrichtigungen (nur Strato)
  vorverkauf: boolean;      // Eröffnungsmodus: keine Preise, keine Angebote, keine Bestellung
  eroeffnung: string;       // z. B. "im November 2026"
  kurier: boolean;          // Lieferung in Heilbronn (eigener Kurier) anbieten
  kurierKosten: number;     // Liefergebühr brutto in Cent
  kurierAb: number;         // Mindestbestellwert in Cent
  kurierFreiAb: number;     // ab diesem Warenwert gratis, 0 = nie
  kurierPlz: string;        // erlaubte Postleitzahlen, mit Komma getrennt
}
export const STANDARD_EINSTELLUNGEN: ShopEinstellungen = {
  versand: 590, versandfreiAb: 5000, abholung: true, abholort: "Klingenberger Straße 100, 74080 Heilbronn (zu den Öffnungszeiten)",
  bankInhaber: "", bankIban: "", bankName: "", paypal: "", hinweis: "", ohnePreisAusblenden: false, mailAn: "", mailVon: "",
  vorverkauf: false, eroeffnung: "im November 2026",
  kurier: true, kurierKosten: 290, kurierAb: 2500, kurierFreiAb: 5000, kurierPlz: "74072, 74074, 74076, 74078, 74080, 74081",
};
/** Postleitzahlen aus der Einstellung als Liste */
export function kurierPlzListe(e: ShopEinstellungen): string[] {
  return e.kurierPlz.split(/[\s,;]+/).map((p) => p.trim()).filter((p) => /^\d{5}$/.test(p));
}

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
