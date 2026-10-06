// Lokaler Test der API ohne Netlify (Speicher im Arbeitsspeicher).
// Aufruf: node --experimental-transform-types netlify/functions/api/test-lokal.mts
import assert from "node:assert/strict";
import { hashPasswort } from "./sicherheit.mts";

const mem = new Map<string, string>();
(globalThis as any).__ZB_TEST_STORE = {
  async get(k: string) { const v = mem.get(k); return v === undefined ? null : JSON.parse(v); },
  async setJSON(k: string, v: unknown) { mem.set(k, JSON.stringify(v)); },
  async list(o?: { prefix?: string }) { return { blobs: [...mem.keys()].filter((k) => k.startsWith(o?.prefix || "")).map((key) => ({ key })) }; },
  async delete(k: string) { mem.delete(k); },
};
process.env.SESSION_SECRET = "x".repeat(48);
process.env.ADMIN_USERS = `chef=${hashPasswort("admin-passwort-123")}`;

const api = (await import("./api.mts")).default;
let n = 0;
async function rufe(methode: string, pfad: string, daten?: unknown, cookie = "", ohneHeader = false) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (!ohneHeader) headers["x-zb"] = "1";
  if (cookie) headers.cookie = cookie;
  const res = await api(new Request("https://test.local/api" + pfad, { method: methode, headers, body: daten ? JSON.stringify(daten) : undefined }), { ip: "1.2.3." + (n++ % 3) } as any);
  const setCookie = res.headers.get("set-cookie") || "";
  return { status: res.status, daten: await res.json(), cookie: setCookie.split(";")[0] };
}
const ok = (name: string) => console.log("  ✓ " + name);

// Admin-Login
let r = await rufe("POST", "/login", { rolle: "admin", benutzer: "chef", passwort: "falsch" });
assert.equal(r.status, 401); ok("Admin mit falschem Passwort abgelehnt");
r = await rufe("POST", "/login", { rolle: "admin", benutzer: "chef", passwort: "admin-passwort-123" }, "", true);
assert.equal(r.status, 403); ok("Anfrage ohne Schutz-Header abgelehnt");
r = await rufe("POST", "/login", { rolle: "admin", benutzer: "Chef", passwort: "admin-passwort-123" });
assert.equal(r.status, 200); const admin = r.cookie; ok("Admin-Login klappt");
r = await rufe("GET", "/admin/haendler", undefined, admin.replace(/.$/, "A"));
assert.equal(r.status, 401); ok("Gefälschtes Cookie abgelehnt");

// Händler registrieren und freischalten
const reg = { firma: "Kiosk Ali", ansprechpartner: "Ali", email: "ali@kiosk.de", telefon: "0151", strasse: "Weg 1", plz: "12345", ort: "Stadt", ustId: "DE123", passwort: "haendler-pass-99", gewerbe: true, datenschutz: true };
r = await rufe("POST", "/haendler/registrieren", { ...reg, passwort: "kurz" }); assert.equal(r.status, 400); ok("Zu kurzes Passwort abgelehnt");
r = await rufe("POST", "/haendler/registrieren", reg); assert.equal(r.status, 200); ok("Händler registriert");
r = await rufe("POST", "/haendler/registrieren", reg); assert.equal(r.status, 409); ok("Doppelte E-Mail abgelehnt");
r = await rufe("POST", "/login", { rolle: "haendler", benutzer: "ali@kiosk.de", passwort: "haendler-pass-99" });
assert.equal(r.status, 403); ok("Nicht freigeschalteter Händler kann sich nicht anmelden");
r = await rufe("GET", "/admin/haendler", undefined, admin); assert.equal(r.daten.haendler.length, 1);
assert.equal(r.daten.haendler[0].passHash, undefined); ok("Admin sieht Händler ohne Passwort-Hash");
const hid = r.daten.haendler[0].id;
r = await rufe("POST", "/admin/haendler/status", { id: hid, status: "aktiv" }, admin); assert.equal(r.status, 200); ok("Händler freigeschaltet");
r = await rufe("POST", "/login", { rolle: "haendler", benutzer: "ALI@kiosk.de", passwort: "haendler-pass-99" });
assert.equal(r.status, 200); const haendler = r.cookie; ok("Händler-Login klappt");
r = await rufe("GET", "/admin/haendler", undefined, haendler); assert.equal(r.status, 401); ok("Händler kommt nicht in den Admin-Bereich");

// Preise und Bestellung
r = await rufe("POST", "/admin/preise", { aenderungen: { "takis-fuego": { name: "Takis Fuego", preis: 150, ve: 20, mindest: 2, mwst: 7 }, "monster-x": { name: "Monster X", preis: 120, ve: 24, mindest: 1, mwst: 19, aktiv: false } } }, admin);
assert.equal(r.status, 200); ok("Händlerpreise gespeichert");
r = await rufe("GET", "/haendler/preise", undefined, haendler);
assert.deepEqual(Object.keys(r.daten.preise), ["takis-fuego"]); ok("Händler sieht nur aktive Preise");
// Staffelpreise
r = await rufe("POST", "/admin/preise", { aenderungen: { "takis-fuego": { name: "Takis Fuego", preis: 150, ve: 20, mindest: 2, mwst: 7, staffel: [{ ab: 10, preis: 130 }, { ab: 5, preis: 140 }] } } }, admin);
assert.equal(r.status, 200); assert.deepEqual(r.daten.preise["takis-fuego"].staffel, [{ ab: 5, preis: 140 }, { ab: 10, preis: 130 }]); ok("Staffelpreise gespeichert und nach Menge sortiert");
r = await rufe("POST", "/admin/preise", { aenderungen: { "takis-fuego": { name: "Takis Fuego", preis: 150, ve: 20, mindest: 2, mwst: 7, staffel: [{ ab: 5, preis: 160 }] } } }, admin);
assert.equal(r.status, 400); ok("Staffelpreis über dem Grundpreis abgelehnt");
r = await rufe("GET", "/haendler/preise", undefined, haendler); assert.equal(r.daten.preise["takis-fuego"].staffel.length, 2); ok("Händler sieht die Staffel");
r = await rufe("POST", "/haendler/bestellungen", { positionen: [{ produktId: "takis-fuego", anzahlVE: 10 }] }, haendler);
assert.equal(r.status, 200); assert.equal(r.daten.bestellung.positionen[0].preis, 130); assert.equal(r.daten.bestellung.netto, 10 * 20 * 130); ok("Staffelpreis ab 10 VE: 1,30 € statt 1,50 € pro Stück");
r = await rufe("POST", "/haendler/bestellungen", { positionen: [{ produktId: "takis-fuego", anzahlVE: 2 }] }, haendler);
assert.equal(r.status, 200); assert.equal(r.daten.bestellung.positionen[0].preis, 150); ok("Unter der Staffel gilt der Grundpreis");
r = await rufe("POST", "/admin/preise", { aenderungen: { "takis-fuego": { name: "Takis Fuego", preis: 150, ve: 20, mindest: 2, mwst: 7 } } }, admin); assert.equal(r.status, 200);
r = await rufe("POST", "/haendler/bestellungen", { positionen: [{ produktId: "takis-fuego", anzahlVE: 1 }] }, haendler);
assert.equal(r.status, 400); ok("Mindestmenge wird geprüft");
r = await rufe("POST", "/haendler/bestellungen", { positionen: [{ produktId: "monster-x", anzahlVE: 3 }] }, haendler);
assert.equal(r.status, 400); ok("Inaktives Produkt nicht bestellbar");
r = await rufe("POST", "/haendler/bestellungen", { positionen: [{ produktId: "takis-fuego", anzahlVE: 3, preis: 1 }] }, haendler);
assert.equal(r.status, 200);
const best = r.daten.bestellung;
assert.equal(best.positionen[0].stueck, 60); assert.equal(best.netto, 9000); assert.equal(best.mwst, 630); assert.equal(best.brutto, 9630);
ok("Bestellung mit Server-Preisen berechnet (60 Stück, 90,00 € netto, 96,30 € brutto)");

// Status und Buchung
r = await rufe("POST", "/admin/bestellungen/status", { id: best.id, status: "bezahlt" }, admin); assert.equal(r.status, 200); ok("Bestellstatus geändert");
r = await rufe("POST", "/admin/bestellungen/buchen", { id: best.id }, admin); assert.equal(r.status, 200); ok("Bestellung gebucht");
r = await rufe("POST", "/admin/bestellungen/buchen", { id: best.id }, admin); assert.equal(r.status, 409); ok("Doppelte Buchung verhindert");
r = await rufe("POST", "/admin/buchungen", { typ: "einkauf", datum: "2026-09-20", produktId: "takis-fuego", name: "Takis Fuego", menge: 100, einzelpreis: 99, mwst: 7, beleg: "RE-1" }, admin);
assert.equal(r.status, 200); ok("Einkauf gebucht");
const jahr = String(new Date().getFullYear());
r = await rufe("GET", "/admin/buchungen?jahr=" + jahr, undefined, admin);
assert.equal(r.daten.buchungen.length, 1 + (jahr === "2026" ? 1 : 0)); ok("Buchungen abrufbar");
const verkauf = r.daten.buchungen.find((b: any) => b.typ === "verkauf");
assert.equal(verkauf.menge, 60); assert.equal(verkauf.betrag, 9630); ok("Verkaufsbuchung entspricht genau der Rechnungssumme (96,30 €)");
r = await rufe("POST", "/admin/buchungen/storno", { id: verkauf.id, jahr, grund: "" }, admin); assert.equal(r.status, 400); ok("Storno ohne Grund abgelehnt");
r = await rufe("POST", "/admin/buchungen/storno", { id: verkauf.id, jahr, grund: "Test" }, admin); assert.equal(r.status, 200); ok("Storno angelegt");
r = await rufe("POST", "/admin/buchungen/storno", { id: verkauf.id, jahr, grund: "Test" }, admin); assert.equal(r.status, 409); ok("Doppeltes Storno verhindert");

// Sperren wirkt sofort (danach wieder freischalten für weitere Tests)
r = await rufe("POST", "/admin/haendler/status", { id: hid, status: "gesperrt" }, admin);
r = await rufe("GET", "/haendler/preise", undefined, haendler); assert.equal(r.status, 401); ok("Gesperrter Händler verliert sofort den Zugriff");

// Shop: Endkunden-Kasse
const { SORTIMENT } = await import("./sortiment.mts");
const ids = Object.keys(SORTIMENT);
const essen = ids.find((i) => !SORTIMENT[i].a && !SORTIMENT[i].x && SORTIMENT[i].k.includes("susses"))!;
const vape = ids.find((i) => SORTIMENT[i].a && !SORTIMENT[i].x)!;
const kunde = { vorname: "Max", nachname: "Muster", email: "max@test.de", telefon: "", strasse: "Weg 2", plz: "10115", ort: "Berlin" };
r = await rufe("GET", "/shop/daten"); assert.deepEqual(r.daten.preise, {}); ok("Shop ohne Preise: nichts kaufbar");
r = await rufe("POST", "/shop/bestellung", { kunde, lieferart: "versand", zahlart: "Überweisung (Vorkasse)", agb: true, datenschutz: true, positionen: [{ produktId: essen, menge: 2 }] });
assert.equal(r.status, 400); ok("Artikel ohne Shop-Preis nicht bestellbar");
r = await rufe("POST", "/admin/shoppreise", { aenderungen: { [essen]: { preis: 249, mwst: 7 }, [vape]: { preis: 999, mwst: 19 } } }, admin); assert.equal(r.status, 200);
r = await rufe("POST", "/admin/einstellungen", { versand: 590, versandfreiAb: 5000, abholung: true, abholort: "Laden", bankInhaber: "ZUKKABRO", bankIban: "DE00 1234", bankName: "Bank", paypal: "", hinweis: "Danke!" }, admin); assert.equal(r.status, 200);
ok("Shop-Preise und Einstellungen gespeichert");
r = await rufe("GET", "/shop/daten"); assert.equal(r.daten.preise[essen], 249); assert.equal(r.daten.versand.kosten, 590); ok("Öffentliche Shop-Daten liefern Preise");
const EINST = { versand: 590, versandfreiAb: 5000, abholung: true, abholort: "Laden", bankInhaber: "ZUKKABRO", bankIban: "DE00 1234", bankName: "Bank", paypal: "", hinweis: "Danke!" };
r = await rufe("POST", "/admin/einstellungen", { ...EINST, vorverkauf: true, eroeffnung: "im November 2026" }, admin); assert.equal(r.status, 200);
r = await rufe("GET", "/shop/daten"); assert.deepEqual(r.daten.preise, {}); assert.deepEqual(r.daten.angebote, []); assert.deepEqual(r.daten.zahlarten, []); assert.equal(r.daten.vorverkauf.aktiv, true); assert.equal(r.daten.vorverkauf.text, "im November 2026");
ok("Eröffnungsmodus: Preise, Angebote und Zahlarten bleiben weg");
r = await rufe("POST", "/shop/bestellung", { kunde, lieferart: "versand", zahlart: "Überweisung (Vorkasse)", agb: true, datenschutz: true, positionen: [{ produktId: essen, menge: 1 }] });
assert.equal(r.status, 409); assert.match(r.daten.fehler, /öffnet im November 2026/); ok("Eröffnungsmodus: Bestellung abgelehnt");
r = await rufe("GET", "/shop/laden"); assert.ok(r.daten.karte.length > 0); assert.ok(r.daten.karte.every((k: any) => k.preis === null)); ok("Eröffnungsmodus: Karte ohne Preise");
r = await rufe("POST", "/admin/einstellungen", { ...EINST, vorverkauf: false, eroeffnung: "" }, admin); assert.equal(r.status, 200); assert.equal(r.daten.einstellungen.eroeffnung, "im November 2026");
r = await rufe("GET", "/shop/daten"); assert.equal(r.daten.preise[essen], 249); assert.equal(r.daten.vorverkauf.aktiv, false); ok("Eröffnungsmodus aus: Preise wieder da");
// Lieferung in Heilbronn (Kurier)
r = await rufe("POST", "/admin/einstellungen", { ...EINST, kurier: true, kurierKosten: 290, kurierAb: 2500, kurierFreiAb: 5000, kurierPlz: "74080, 74072" }, admin); assert.equal(r.status, 200);
r = await rufe("GET", "/shop/daten"); assert.deepEqual(r.daten.versand.kurier, { aktiv: true, kosten: 290, ab: 2500, freiAb: 5000, plz: ["74080", "74072"] }); ok("Kurier-Daten öffentlich");
const hn = { ...kunde, strasse: "Klingenberger Straße 5", plz: "74080", ort: "Heilbronn" };
r = await rufe("POST", "/shop/bestellung", { kunde: hn, lieferart: "kurier", zahlart: "Überweisung (Vorkasse)", agb: true, datenschutz: true, positionen: [{ produktId: essen, menge: 2 }] });
assert.equal(r.status, 400); assert.match(r.daten.fehler, /erst ab einem Warenwert von 25,00/); ok("Kurier: Mindestbestellwert geprüft");
r = await rufe("POST", "/shop/bestellung", { kunde: { ...hn, plz: "70173", ort: "Stuttgart" }, lieferart: "kurier", zahlart: "Überweisung (Vorkasse)", agb: true, datenschutz: true, positionen: [{ produktId: essen, menge: 12 }] });
assert.equal(r.status, 400); assert.match(r.daten.fehler, /nur in Heilbronn/); ok("Kurier: fremde PLZ abgelehnt");
r = await rufe("POST", "/shop/bestellung", { kunde: hn, lieferart: "kurier", zahlart: "Überweisung (Vorkasse)", agb: true, datenschutz: true, positionen: [{ produktId: essen, menge: 12 }] });
assert.equal(r.status, 200); assert.equal(r.daten.versand, 290); assert.equal(r.daten.brutto, 12 * 249 + 290); ok("Kurier: 2,90 € Liefergebühr ab 25 €");
r = await rufe("POST", "/shop/bestellung", { kunde: hn, lieferart: "kurier", zahlart: "Überweisung (Vorkasse)", agb: true, datenschutz: true, positionen: [{ produktId: essen, menge: 21 }] });
assert.equal(r.status, 200); assert.equal(r.daten.versand, 0); ok("Kurier: ab 50 € kostenlos");
r = await rufe("POST", "/admin/einstellungen", { ...EINST, kurier: false }, admin); assert.equal(r.status, 200);
r = await rufe("POST", "/shop/bestellung", { kunde: hn, lieferart: "kurier", zahlart: "Überweisung (Vorkasse)", agb: true, datenschutz: true, positionen: [{ produktId: essen, menge: 12 }] });
assert.equal(r.status, 400); ok("Kurier abgeschaltet: nicht wählbar");
r = await rufe("GET", "/shop/daten"); assert.equal(JSON.stringify(r.daten).includes("150"), false); ok("Händlerpreise bleiben geheim");
const basis = { kunde, lieferart: "versand", zahlart: "Überweisung (Vorkasse)", agb: true, datenschutz: true };
r = await rufe("POST", "/shop/bestellung", { ...basis, agb: false, positionen: [{ produktId: essen, menge: 2 }] }); assert.equal(r.status, 400); ok("Ohne AGB-Häkchen keine Bestellung");
r = await rufe("POST", "/shop/bestellung", { ...basis, zahlart: "Bar bei Abholung", positionen: [{ produktId: essen, menge: 2 }] }); assert.equal(r.status, 400); ok("Barzahlung nur bei Abholung");
r = await rufe("POST", "/shop/bestellung", { ...basis, positionen: [{ produktId: essen, menge: 2, preis: 1 }] });
assert.equal(r.status, 200); assert.equal(r.daten.brutto, 2 * 249 + 590); assert.equal(r.daten.zahlungsinfo.iban, "DE00 1234");
ok("Kundenbestellung: 2 × 2,49 € + 5,90 € Versand = 10,88 € (Server-Preise)");
const kNr = r.daten.nr;
r = await rufe("POST", "/shop/bestellung", { ...basis, positionen: [{ produktId: vape, menge: 1 }] }); assert.equal(r.status, 400); ok("18+ Artikel ohne Geburtsdatum abgelehnt");
r = await rufe("POST", "/shop/bestellung", { ...basis, geburtsdatum: "2012-01-01", ab18Bestaetigt: true, positionen: [{ produktId: vape, menge: 1 }] }); assert.equal(r.status, 403); ok("Minderjährige können keine 18+ Artikel kaufen");
r = await rufe("POST", "/shop/bestellung", { ...basis, geburtsdatum: "1995-05-05", ab18Bestaetigt: true, positionen: [{ produktId: vape, menge: 3 }] });
assert.equal(r.status, 200); assert.equal(r.daten.brutto, 2997 + 590); ok("18+ Bestellung mit Geburtsdatum: 29,97 € + 5,90 € Versand (unter 50 €)");
r = await rufe("POST", "/shop/bestellung", { ...basis, positionen: [{ produktId: essen, menge: 21 }] });
assert.equal(r.daten.versand, 0); assert.equal(r.daten.brutto, 21 * 249); ok("Ab 50 € versandkostenfrei (52,29 €)");
r = await rufe("POST", "/admin/bestellungen/buchen", { id: kNr }, admin); assert.equal(r.status, 200);
r = await rufe("GET", "/admin/buchungen?jahr=" + jahr, undefined, admin);
const zuK = r.daten.buchungen.filter((x: any) => x.beleg === kNr);
assert.equal(zuK.reduce((a: number, x: any) => a + x.betrag, 0), 2 * 249 + 590); ok("Kundenbestellung gebucht inkl. Versandkosten (10,88 €)");

// Angebote (Aktionspreise für den Slider)
const snack = ids.find((i) => i !== essen && !SORTIMENT[i].a && !SORTIMENT[i].x && SORTIMENT[i].k.includes("snacks"))!;
r = await rufe("GET", "/admin/angebote", undefined, admin); assert.deepEqual(r.daten.angebote, []); ok("Noch keine Angebote");
r = await rufe("POST", "/admin/angebote", { angebote: [{ id: "gibt-es-nicht", preis: 100 }] }, admin); assert.equal(r.status, 400); ok("Angebot mit unbekanntem Produkt abgelehnt");
r = await rufe("POST", "/admin/angebote", { angebote: [{ id: essen, preis: 199 }, { id: essen, preis: 150 }] }, admin); assert.equal(r.status, 400); ok("Doppeltes Angebot abgelehnt");
r = await rufe("POST", "/admin/angebote", { angebote: [
  { id: essen, preis: 199, titel: "Deal der Woche" },
  { id: snack, preis: 149, bis: "2000-01-01" },
  { id: vape, preis: 899, aktiv: false },
] }, admin); assert.equal(r.status, 200); assert.equal(r.daten.angebote.length, 3); ok("Angebote gespeichert");
r = await rufe("GET", "/shop/daten");
assert.equal(r.daten.angebote.length, 1); assert.equal(r.daten.angebote[0].id, essen); assert.equal(r.daten.angebote[0].alt, 249); assert.equal(r.daten.angebote[0].titel, "Deal der Woche");
assert.equal(r.daten.preise[essen], 199); assert.equal(r.daten.preise[vape], 999); assert.equal(r.daten.preise[snack], undefined);
ok("Shop zeigt nur laufende Angebote: 1,99 € statt 2,49 €, abgelaufene und inaktive nicht");
r = await rufe("POST", "/shop/bestellung", { ...basis, positionen: [{ produktId: essen, menge: 2 }] });
assert.equal(r.status, 200); assert.equal(r.daten.brutto, 2 * 199 + 590); assert.equal(r.daten.positionen?.[0]?.mwst ?? 7, 7); ok("Kasse rechnet mit Aktionspreis (2 × 1,99 € + Versand)");
r = await rufe("POST", "/admin/angebote", { angebote: [{ id: snack, preis: 149 }] }, admin); assert.equal(r.status, 200);
r = await rufe("GET", "/shop/daten"); assert.equal(r.daten.preise[essen], 249); assert.equal(r.daten.preise[snack], 149); assert.equal(r.daten.angebote[0].alt, null);
ok("Angebot ohne regulären Preis: kaufbar zum Aktionspreis, kein Streichpreis");
r = await rufe("POST", "/admin/angebote", { angebote: [] }, admin); assert.equal(r.status, 200);

// Pakete
r = await rufe("GET", "/shop/daten"); assert.ok(r.daten.pakete.length >= 8); assert.equal(r.daten.pakete[0].preis, null); ok("Start-Pakete sichtbar (" + r.daten.pakete.length + "), Preis offen");
r = await rufe("POST", "/shop/bestellung", { ...basis, positionen: [{ produktId: "paket:netflix-night", menge: 1 }] }); assert.equal(r.status, 400); ok("Paket ohne Preis nicht kaufbar");
r = await rufe("GET", "/admin/pakete", undefined, admin);
const pk = r.daten.pakete.map((x: any) => x.id === "netflix-night" ? { ...x, preis: 1999 } : x);
r = await rufe("POST", "/admin/pakete", { pakete: [...pk, { id: "test", name: "", inhalt: [] }] }, admin); assert.equal(r.status, 400); ok("Paket ohne Namen abgelehnt");
r = await rufe("POST", "/admin/pakete", { pakete: pk }, admin); assert.equal(r.status, 200); ok("Paketpreis gespeichert");
r = await rufe("POST", "/shop/bestellung", { ...basis, positionen: [{ produktId: "paket:netflix-night", menge: 2 }] });
assert.equal(r.status, 200); assert.equal(r.daten.brutto, 3998 + 590); ok("2 × Netflix Night à 19,99 € + 5,90 € Versand = 45,88 €");

// Händler: Preisanfrage
r = await rufe("POST", "/admin/haendler/status", { id: hid, status: "aktiv" }, admin);
r = await rufe("POST", "/haendler/preisanfrage", { positionen: [{ produktId: essen, stueck: 500 }], notiz: "Wochenbedarf" }, haendler);
assert.equal(r.status, 200); assert.equal(r.daten.anfrage.art, "preisanfrage"); ok("Händler schickt Preisanfrage");
r = await rufe("POST", "/admin/bestellungen/buchen", { id: r.daten.anfrage.id }, admin); assert.equal(r.status, 400); ok("Preisanfrage kann nicht gebucht werden");
r = await rufe("POST", "/haendler/preisanfrage", { positionen: [{ produktId: essen, stueck: 1 }] }); assert.equal(r.status, 401); ok("Preisanfrage nur für angemeldete Händler");

// Kontaktformular
r = await rufe("POST", "/kontakt", { name: "Lea", email: "lea@test.de", text: "Habt ihr Takis Blue Heat?", datenschutz: true, betreff: "Frage zu einem Produkt" });
assert.equal(r.status, 200); const nId = r.daten.id; ok("Kontaktnachricht angenommen");
r = await rufe("POST", "/kontakt", { name: "Bot", email: "bot@test.de", text: "spam", datenschutz: true, website: "http://x" }); assert.equal(r.status, 200); ok("Honigtopf-Nachricht still verworfen");
r = await rufe("POST", "/kontakt", { name: "", email: "lea@test.de", text: "x", datenschutz: true }); assert.equal(r.status, 400); ok("Nachricht ohne Name abgelehnt");
r = await rufe("POST", "/kontakt", { name: "Lea", email: "keine-mail", text: "x", datenschutz: true }); assert.equal(r.status, 400); ok("Nachricht mit falscher E-Mail abgelehnt");
r = await rufe("GET", "/admin/nachrichten", undefined, admin); assert.equal(r.daten.nachrichten.length, 1); assert.equal(r.daten.nachrichten[0].gelesen, false); ok("Admin sieht genau eine Nachricht (Spam nicht)");
r = await rufe("GET", "/admin/nachrichten"); assert.equal(r.status, 401); ok("Nachrichten nur für Admins");
r = await rufe("POST", "/admin/nachrichten/status", { id: nId, gelesen: true }, admin); assert.equal(r.daten.nachricht.gelesen, true); ok("Nachricht als gelesen markiert");

// Laden: Öffnungszeiten, Karte, öffentliche Daten
r = await rufe("GET", "/shop/laden"); assert.equal(r.daten.laden.ort, "Heilbronn"); assert.ok(r.daten.karte.length >= 8); ok("Laden-Daten öffentlich: Heilbronn, " + r.daten.karte.length + " Karteneinträge");
r = await rufe("POST", "/admin/laden", { zeiten: [{ tag: "So", offen: true, von: "12:00", bis: "99:00" }] }, admin); assert.equal(r.status, 400); ok("Falsche Uhrzeit abgelehnt");
r = await rufe("POST", "/admin/laden", { strasse: "Teststraße 1", plz: "74072", ort: "Heilbronn", zeiten: [{ tag: "Sa", offen: true, von: "11:00", bis: "18:00" }] }, admin);
assert.equal(r.status, 200); assert.equal(r.daten.laden.zeiten.filter((z: any) => z.offen).length, 1); ok("Öffnungszeiten gespeichert (nur Samstag offen)");
r = await rufe("GET", "/admin/laden", undefined, admin); const karteAlt = r.daten.karte;
r = await rufe("POST", "/admin/karte", { karte: [...karteAlt, { name: "Matcha Latte", art: "matcha", preis: 500 }] }, admin); assert.equal(r.status, 400); ok("Doppelter Karteneintrag abgelehnt");
r = await rufe("POST", "/admin/karte", { karte: [{ name: "Matcha Latte", art: "matcha", preis: 490, mwst: 19, allergene: ["Milch", "Quatsch"] }, { name: "Açaí Bowl", art: "bowl", preis: 890, aktiv: false }] }, admin);
assert.equal(r.status, 200); assert.deepEqual(r.daten.karte[0].allergene, ["Milch"]); assert.equal(r.daten.karte[1].mwst, 7); assert.equal(r.daten.karte[1].id, "acai-bowl"); ok("Karte gespeichert: unbekanntes Allergen verworfen, Bowl 7 %, Kennung erzeugt");
r = await rufe("GET", "/shop/laden"); assert.equal(r.daten.karte.length, 1); ok("Inaktiver Karteneintrag nicht öffentlich");

// Tageskasse (offene Ladenkasse)
r = await rufe("GET", "/admin/kasse?tag=2026-06-01", undefined, admin); assert.equal(r.daten.tag.anfang, 0); assert.equal(r.daten.summe.umsatz, 0); ok("Leerer Kassentag");
r = await rufe("POST", "/admin/kasse/anfang", { tag: "2026-06-01", anfang: 5000 }, admin); assert.equal(r.daten.tag.anfang, 5000);
r = await rufe("POST", "/admin/kasse/verkauf", { tag: "2026-06-01", id: "matcha-latte", name: "Matcha Latte", menge: 2, preis: 490, mwst: 19, zahlungsart: "Bar" }, admin); assert.equal(r.status, 200);
r = await rufe("POST", "/admin/kasse/verkauf", { tag: "2026-06-01", id: "acai-bowl", name: "Açaí Bowl", menge: 1, preis: 890, mwst: 7, zahlungsart: "Karte" }, admin);
r = await rufe("POST", "/admin/kasse/verkauf", { tag: "2026-06-01", id: "x", name: "Fehlbon", menge: 1, preis: 100, mwst: 19 }, admin);
r = await rufe("POST", "/admin/kasse/storno", { tag: "2026-06-01", art: "verkauf", nr: 3 }, admin); assert.equal(r.daten.summe.umsatz, 980 + 890); ok("Verkäufe erfasst, Fehlbon storniert: Umsatz 18,70 €");
r = await rufe("POST", "/admin/kasse/ausgabe", { tag: "2026-06-01", text: "Milch gekauft", betrag: 350 }, admin); assert.equal(r.daten.summe.soll, 5000 + 980 - 350); ok("Ausgabe erfasst, Soll-Bargeld 56,30 €");
r = await rufe("POST", "/admin/kasse/abschluss", { tag: "2026-06-01", gezaehlt: 5600, notiz: "Test" }, admin); assert.equal(r.status, 200); assert.equal(r.daten.tag.abschluss.differenz, -30); ok("Tagesabschluss: Differenz −0,30 €");
r = await rufe("POST", "/admin/kasse/verkauf", { tag: "2026-06-01", name: "Nachzügler", preis: 100 }, admin); assert.equal(r.status, 409); ok("Abgeschlossener Tag ist gesperrt");
r = await rufe("GET", "/admin/buchungen?jahr=2026", undefined, admin);
const kb = r.daten.buchungen.filter((x: any) => x.beleg === "KASSE-2026-06-01");
assert.equal(kb.length, 3); assert.equal(kb.filter((x: any) => x.typ === "verkauf").reduce((a: number, x: any) => a + x.betrag, 0), 1870); ok("Abschluss hat 2 Verkäufe und 1 Ausgabe gebucht");
r = await rufe("GET", "/admin/kasse?tag=2026-06-02", undefined, admin); assert.equal(r.daten.tag.anfang, 5600); ok("Nächster Tag startet mit dem gezählten Bestand");
r = await rufe("GET", "/admin/kasse/berichte?monat=2026-06", undefined, admin); assert.equal(r.daten.tage.length, 1); ok("Monatsbericht listet den Tag");
r = await rufe("GET", "/admin/kasse?tag=2026-06-01"); assert.equal(r.status, 401); ok("Kasse nur für Admins");

// Stripe (Online-Zahlung) mit nachgebautem Stripe
r = await rufe("GET", "/shop/daten"); assert.ok(!r.daten.zahlarten.includes("Online bezahlen")); ok("Ohne Stripe-Schlüssel keine Online-Zahlung");
process.env.STRIPE_SECRET_KEY = "sk_test_x"; process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
const echtFetch = globalThis.fetch; let stripeBody = "";
globalThis.fetch = (async (url: any, init: any) => {
  if (String(url).startsWith("https://api.stripe.com/")) { stripeBody = init.body; return new Response(JSON.stringify({ id: "cs_test_123", url: "https://checkout.stripe.com/c/pay/cs_test_123" }), { status: 200 }); }
  return echtFetch(url, init);
}) as any;
r = await rufe("GET", "/shop/daten"); assert.ok(r.daten.zahlarten.includes("Online bezahlen")); ok("Mit Stripe-Schlüssel wird 'Online bezahlen' angeboten");
r = await rufe("POST", "/shop/bestellung", { ...basis, zahlart: "Online bezahlen", positionen: [{ produktId: essen, menge: 2 }] });
assert.equal(r.status, 200); assert.equal(r.daten.zahlungsinfo.art, "stripe"); assert.ok(r.daten.zahlungsinfo.url.startsWith("https://checkout.stripe.com/"));
assert.ok(stripeBody.includes("unit_amount%5D=249") && stripeBody.includes("quantity%5D=2") && stripeBody.includes("unit_amount%5D=590"), stripeBody);
const stripeNr = r.daten.nr; ok("Stripe-Checkout angelegt: 2 × 2,49 € + 5,90 € Versand, Beträge vom Server");
const payload = JSON.stringify({ type: "checkout.session.completed", data: { object: { id: "cs_test_123", payment_status: "paid", payment_intent: "pi_1", amount_total: 1088, metadata: { bestellung: stripeNr } } } });
const { createHmac } = await import("node:crypto");
const ts = Math.floor(Date.now() / 1000);
const sig = `t=${ts},v1=${createHmac("sha256", "whsec_test").update(ts + "." + payload).digest("hex")}`;
const webhook = (signatur: string) => api(new Request("https://test.local/api/stripe/webhook", { method: "POST", headers: { "stripe-signature": signatur }, body: payload }), { ip: "1.1.1.1" } as any);
assert.equal((await webhook("t=1,v1=abc")).status, 400); ok("Webhook mit falscher Signatur abgelehnt");
assert.equal((await webhook(sig)).status, 200);
r = await rufe("GET", `/shop/bestellung/status?nr=${stripeNr}&s=cs_test_123`); assert.equal(r.daten.bezahlt, true); assert.equal(r.daten.status, "bezahlt"); ok("Webhook: Bestellung auf bezahlt");
r = await rufe("GET", `/shop/bestellung/status?nr=${stripeNr}&s=cs_falsch`); assert.equal(r.status, 404); ok("Status nur mit richtiger Sitzungs-Kennung");
assert.equal((await webhook(sig)).status, 200);
r = await rufe("GET", "/admin/buchungen?jahr=" + new Date().getFullYear(), undefined, admin);
assert.equal(r.daten.buchungen.filter((x: any) => x.beleg === stripeNr && x.zahlungsart === "Stripe").length, 2); ok("Stripe-Zahlung automatisch gebucht (Ware + Versand), doppelter Webhook bucht nicht doppelt");
globalThis.fetch = echtFetch; delete process.env.STRIPE_SECRET_KEY; delete process.env.STRIPE_WEBHOOK_SECRET;

// News
r = await rufe("GET", "/shop/news"); assert.deepEqual(r.daten.news, []); ok("Noch keine News");
r = await rufe("POST", "/admin/news", { news: [{ titel: "", text: "x" }] }, admin); assert.equal(r.status, 400); ok("News ohne Überschrift abgelehnt");
r = await rufe("POST", "/admin/news", { news: [{ titel: "Alt", datum: "2026-01-01", link: "javascript:alert(1)" }] }, admin); assert.equal(r.status, 400); ok("Unsicherer Link abgelehnt");
r = await rufe("POST", "/admin/news", { news: [{ titel: "Alt", datum: "2026-01-01", link: "/pakete.html" }, { titel: "Neu", datum: "2026-02-01", text: "Hallo" }, { titel: "Entwurf", datum: "2026-03-01", aktiv: false }] }, admin);
assert.equal(r.status, 200); assert.ok(r.daten.news.every((n: any) => /^N-/.test(n.id))); const newsIds = r.daten.news.map((n: any) => n.id);
r = await rufe("GET", "/shop/news"); assert.equal(r.daten.news.length, 2); assert.equal(r.daten.news[0].titel, "Neu"); ok("News öffentlich: neueste zuerst, Entwurf versteckt");
r = await rufe("POST", "/admin/news", { news: [{ id: newsIds[0], titel: "Alt geändert", datum: "2026-01-01" }] }, admin); assert.equal(r.daten.news[0].id, newsIds[0]); ok("News-Kennung bleibt beim Bearbeiten erhalten");
r = await rufe("POST", "/admin/news", { news: [] }, admin);

// Digitale Stempelkarte
r = await rufe("POST", "/shop/stempel/neu", {}); assert.equal(r.status, 200); assert.match(r.daten.code, /^ZB-[A-Z2-9]{4}-[A-Z2-9]{4}$/); assert.equal(r.daten.stempel, 0); assert.equal(r.daten.ziel, 10);
const karteCode = r.daten.code; ok("Stempelkarte angelegt: " + karteCode);
r = await rufe("GET", "/shop/stempel?code=ZB-XXXX-XXXX"); assert.equal(r.status, 404); ok("Unbekannte Karte: 404");
r = await rufe("GET", "/shop/stempel?code=hallo"); assert.equal(r.status, 400); ok("Kaputter Code abgelehnt");
r = await rufe("POST", "/admin/stempel", { code: karteCode, aktion: "stempel" }); assert.equal(r.status, 401); ok("Stempeln nur für Admins");
for (let i = 0; i < 9; i++) { r = await rufe("POST", "/admin/stempel", { code: karteCode.toLowerCase(), aktion: "stempel" }, admin); assert.equal(r.status, 200); }
assert.equal(r.daten.stempel, 9); assert.equal(r.daten.guthaben, 0); ok("9 Stempel vergeben (Code auch klein geschrieben)");
r = await rufe("POST", "/admin/stempel", { code: karteCode, aktion: "stempel" }, admin); assert.equal(r.daten.stempel, 0); assert.equal(r.daten.guthaben, 1); ok("10. Stempel: Karte voll, 1 Gratis-Getränk frei");
r = await rufe("GET", "/shop/stempel?code=" + karteCode); assert.equal(r.daten.guthaben, 1); ok("Kunde sieht das Guthaben");
r = await rufe("POST", "/admin/stempel", { code: karteCode, aktion: "einloesen" }, admin); assert.equal(r.daten.guthaben, 0); assert.equal(r.daten.eingeloest, 1); ok("Gratis-Getränk eingelöst");
r = await rufe("POST", "/admin/stempel", { code: karteCode, aktion: "einloesen" }, admin); assert.equal(r.status, 400); ok("Ohne Guthaben nichts einzulösen");
r = await rufe("POST", "/admin/stempel", { code: karteCode, aktion: "stempel", anzahl: 3 }, admin); assert.equal(r.daten.stempel, 3); ok("Mehrere Stempel auf einmal (3 Bowls)");

// Bremse gegen Passwort-Raten (gleiche IP)
let letzte = 0;
for (let i = 0; i < 12; i++) {
  const res = await api(new Request("https://test.local/api/login", { method: "POST", headers: { "x-zb": "1" }, body: JSON.stringify({ rolle: "admin", benutzer: "chef", passwort: "nein" }) }), { ip: "9.9.9.9" } as any);
  letzte = res.status;
}
assert.equal(letzte, 429); ok("Zu viele Fehlversuche werden gebremst");
console.log("\nAlle Tests bestanden.");
