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

// Sperren wirkt sofort
r = await rufe("POST", "/admin/haendler/status", { id: hid, status: "gesperrt" }, admin);
r = await rufe("GET", "/haendler/preise", undefined, haendler); assert.equal(r.status, 401); ok("Gesperrter Händler verliert sofort den Zugriff");

// Bremse gegen Passwort-Raten (gleiche IP)
let letzte = 0;
for (let i = 0; i < 12; i++) {
  const res = await api(new Request("https://test.local/api/login", { method: "POST", headers: { "x-zb": "1" }, body: JSON.stringify({ rolle: "admin", benutzer: "chef", passwort: "nein" }) }), { ip: "9.9.9.9" } as any);
  letzte = res.status;
}
assert.equal(letzte, 429); ok("Zu viele Fehlversuche werden gebremst");
console.log("\nAlle Tests bestanden.");
