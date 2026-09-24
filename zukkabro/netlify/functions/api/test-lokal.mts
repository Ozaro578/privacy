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

// Bremse gegen Passwort-Raten (gleiche IP)
let letzte = 0;
for (let i = 0; i < 12; i++) {
  const res = await api(new Request("https://test.local/api/login", { method: "POST", headers: { "x-zb": "1" }, body: JSON.stringify({ rolle: "admin", benutzer: "chef", passwort: "nein" }) }), { ip: "9.9.9.9" } as any);
  letzte = res.status;
}
assert.equal(letzte, 429); ok("Zu viele Fehlversuche werden gebremst");
console.log("\nAlle Tests bestanden.");
