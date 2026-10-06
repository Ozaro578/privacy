// ZUKKABRO – Server-API für Admin-Bereich, Händlerportal und Buchhaltung.
// Alle Geldbeträge werden in Cent (ganze Zahlen) gespeichert.
import type { Config, Context } from "@netlify/functions";
import {
  abmeldeCookie, adminKonten, hashPasswort, kurzHash, leseSitzung, neueId,
  pruefePasswort, sitzungsCookie, type Sitzung,
} from "./sicherheit.mts";
import { lese, leseAlle, schreibe } from "./daten.mts";
import {
  STANDARD_EINSTELLUNGEN, alter, mwstAusBrutto, mwstVorschlag, produkt,
  type ShopEinstellungen, type ShopPreise,
} from "./shop.mts";
import { PAKETE_VORLAGE, type Paket } from "./pakete-vorlage.mts";
import { LADEN_STANDARD, KARTE_VORLAGE, type LadenEinstellungen, type KarteEintrag } from "./laden-vorlage.mts";
import { createHmac, timingSafeEqual } from "node:crypto";

/* =================== Typen =================== */
type HStatus = "offen" | "aktiv" | "gesperrt";
interface Haendler {
  id: string; firma: string; ansprechpartner: string; email: string; telefon: string;
  strasse: string; plz: string; ort: string; ustId: string; passHash: string;
  status: HStatus; erstellt: string; geaendert?: string; notiz?: string;
}
interface Preis { name: string; marke?: string; preis: number; ve: number; mindest: number; mwst: number; aktiv: boolean }
type Preisliste = Record<string, Preis>;
type BStatus = "neu" | "bestaetigt" | "versendet" | "bezahlt" | "abgeschlossen" | "storniert";
interface Position {
  produktId: string; name: string; ve: number; anzahlVE: number; stueck: number;
  preis: number; mwst: number; netto: number;
  brutto?: number; // nur Kundenbestellungen: exakte Zeilensumme brutto
}
type BArt = "haendler" | "kunde" | "preisanfrage";
interface Kunde { vorname: string; nachname: string; email: string; telefon: string; strasse: string; plz: string; ort: string; geburtsdatum?: string }
interface Bestellung {
  stripe?: { session: string; status: "offen" | "bezahlt"; paymentIntent?: string; bezahltAm?: string };
  id: string; art?: BArt; haendlerId: string; firma: string; positionen: Position[];
  netto: number; mwst: number; brutto: number; notiz: string; status: BStatus;
  erstellt: string; verlauf: { status: BStatus; von: string; am: string }[]; gebucht?: boolean;
  kunde?: Kunde; lieferart?: "versand" | "abholung"; zahlart?: string; versand?: number; ab18?: boolean;
}
type BTyp = "einkauf" | "verkauf" | "ausgabe" | "einnahme" | "storno";
interface Buchung {
  id: string; typ: BTyp; datum: string; produktId: string; name: string; menge: number;
  einzelpreis: number; betrag: number; mwst: number; zahlungsart: string; beleg: string; notiz: string;
  bezug?: string; erfasstVon: string; erfasstAm: string;
}

const BESTELL_STATUS: BStatus[] = ["neu", "bestaetigt", "versendet", "bezahlt", "abgeschlossen", "storniert"];
const BUCH_TYPEN: BTyp[] = ["einkauf", "verkauf", "ausgabe", "einnahme"];
const MWST_SAETZE = [0, 7, 19];

/* =================== Hilfen =================== */
class Fehler extends Error { constructor(public status: number, msg: string) { super(msg); } }

function json(daten: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(daten), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra },
  });
}
function text(v: unknown, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}
function ganz(v: unknown, min: number, max: number): number {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) throw new Fehler(400, "Ungültige Zahl");
  return n;
}
function datum(v: unknown): string {
  const s = text(v, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || isNaN(Date.parse(s))) throw new Fehler(400, "Ungültiges Datum");
  return s;
}
function jetzt(): string { return new Date().toISOString(); }
function ohnePass(h: Haendler) { const { passHash, ...rest } = h; return rest; }

async function body(req: Request): Promise<any> {
  try { return await req.json(); } catch { throw new Fehler(400, "Ungültige Anfrage"); }
}

/** Einfache Bremse gegen Passwort-Raten und Spam (pro IP und Aktion). */
async function bremse(aktion: string, ip: string, max: number, fensterMin: number) {
  const key = `limit/${kurzHash(aktion + "|" + ip)}`;
  const jetztMs = Date.now();
  const e = (await lese<{ n: number; seit: number }>(key)) || { n: 0, seit: jetztMs };
  if (jetztMs - e.seit > fensterMin * 60_000) { e.n = 0; e.seit = jetztMs; }
  e.n += 1;
  await schreibe(key, e);
  if (e.n > max) throw new Fehler(429, "Zu viele Versuche. Bitte später erneut probieren.");
}

async function protokoll(ereignis: string, von: string, details: Record<string, unknown> = {}) {
  const am = jetzt();
  await schreibe(`protokoll/${am.slice(0, 7)}/${am}-${kurzHash(am + Math.random()).slice(0, 6)}`, { am, ereignis, von, ...details });
}

function braucht(s: Sitzung | null, rolle: "admin" | "haendler"): Sitzung {
  if (!s || s.r !== rolle) throw new Fehler(401, "Bitte anmelden.");
  return s;
}

/* =================== Konten =================== */
async function login(req: Request, ip: string) {
  const b = await body(req);
  const rolle = b.rolle === "admin" ? "admin" : "haendler";
  const benutzer = text(b.benutzer, 120).toLowerCase();
  const passwort = typeof b.passwort === "string" ? b.passwort.slice(0, 200) : "";
  await bremse("login-" + rolle, ip, 10, 15);
  const falsch = new Fehler(401, "Benutzername oder Passwort falsch.");

  if (rolle === "admin") {
    const konten = adminKonten();
    const ok = pruefePasswort(passwort, konten[benutzer] || "");
    if (!ok || !konten[benutzer]) { await protokoll("admin-login-fehlgeschlagen", benutzer, { ip: kurzHash(ip) }); throw falsch; }
    await protokoll("admin-login", benutzer);
    return json({ ok: true, rolle, name: benutzer }, 200, { "Set-Cookie": sitzungsCookie({ r: "admin", id: benutzer, n: benutzer }) });
  }

  const id = await lese<string>(`haendler-email/${kurzHash(benutzer)}`);
  const h = id ? await lese<Haendler>(`haendler/${id}`) : null;
  const ok = pruefePasswort(passwort, h?.passHash || "");
  if (!h || !ok) throw falsch;
  if (h.status === "offen") throw new Fehler(403, "Dein Händlerkonto wird noch geprüft. Wir melden uns bei dir.");
  if (h.status === "gesperrt") throw new Fehler(403, "Dieses Händlerkonto ist gesperrt.");
  await protokoll("haendler-login", h.id);
  return json({ ok: true, rolle, name: h.firma }, 200, { "Set-Cookie": sitzungsCookie({ r: "haendler", id: h.id, n: h.firma }) });
}

async function registrieren(req: Request, ip: string) {
  await bremse("registrieren", ip, 5, 60);
  const b = await body(req);
  const email = text(b.email, 120).toLowerCase();
  const passwort = typeof b.passwort === "string" ? b.passwort : "";
  const h: Haendler = {
    id: neueId("H-"), firma: text(b.firma, 120), ansprechpartner: text(b.ansprechpartner, 120), email,
    telefon: text(b.telefon, 40), strasse: text(b.strasse, 120), plz: text(b.plz, 10), ort: text(b.ort, 80),
    ustId: text(b.ustId, 30), passHash: "", status: "offen", erstellt: jetzt(),
  };
  if (!h.firma || !h.ansprechpartner || !h.strasse || !h.plz || !h.ort) throw new Fehler(400, "Bitte alle Pflichtfelder ausfüllen.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Fehler(400, "Bitte eine gültige E-Mail-Adresse angeben.");
  if (passwort.length < 10 || passwort.length > 200) throw new Fehler(400, "Das Passwort braucht mindestens 10 Zeichen.");
  if (b.gewerbe !== true || b.datenschutz !== true) throw new Fehler(400, "Bitte die Bestätigungen ankreuzen.");
  const indexKey = `haendler-email/${kurzHash(email)}`;
  if (await lese<string>(indexKey)) throw new Fehler(409, "Für diese E-Mail gibt es schon ein Konto.");
  h.passHash = hashPasswort(passwort);
  await schreibe(`haendler/${h.id}`, h);
  await schreibe(indexKey, h.id);
  await protokoll("haendler-registriert", h.id, { firma: h.firma });
  return json({ ok: true, meldung: "Danke! Wir prüfen deine Angaben und schalten dein Konto frei." });
}

async function ich(s: Sitzung | null) {
  if (!s) return json({ angemeldet: false });
  if (s.r === "haendler") {
    const h = await lese<Haendler>(`haendler/${s.id}`);
    if (!h || h.status !== "aktiv") return json({ angemeldet: false }, 200, { "Set-Cookie": abmeldeCookie() });
    return json({ angemeldet: true, rolle: "haendler", name: h.firma, haendler: ohnePass(h) });
  }
  return json({ angemeldet: true, rolle: s.r, name: s.n });
}

async function aktiverHaendler(s: Sitzung | null): Promise<Haendler> {
  const sitz = braucht(s, "haendler");
  const h = await lese<Haendler>(`haendler/${sitz.id}`);
  if (!h || h.status !== "aktiv") throw new Fehler(401, "Bitte erneut anmelden.");
  return h;
}

/* =================== Preise =================== */
async function preisliste(): Promise<Preisliste> {
  return (await lese<Preisliste>("preise/haendler")) || {};
}

async function preiseSpeichern(req: Request, s: Sitzung) {
  const b = await body(req);
  const aenderungen = b.aenderungen && typeof b.aenderungen === "object" ? b.aenderungen : {};
  const liste = await preisliste();
  let n = 0;
  for (const [id, wert] of Object.entries<any>(aenderungen)) {
    const pid = text(id, 200);
    if (!pid || n++ > 2000) continue;
    if (wert === null) { delete liste[pid]; continue; }
    const mwst = ganz(wert.mwst, 0, 19);
    if (!MWST_SAETZE.includes(mwst)) throw new Fehler(400, "MwSt-Satz muss 0, 7 oder 19 sein.");
    liste[pid] = {
      name: text(wert.name, 200) || pid, marke: text(wert.marke, 80),
      preis: ganz(wert.preis, 0, 10_000_000), ve: ganz(wert.ve, 1, 10_000), mindest: ganz(wert.mindest, 1, 10_000),
      mwst, aktiv: wert.aktiv !== false,
    };
  }
  await schreibe("preise/haendler", liste);
  await protokoll("preise-geaendert", s.id, { anzahl: Object.keys(aenderungen).length });
  return json({ ok: true, preise: liste });
}

/* =================== Bestellungen =================== */
async function bestellen(req: Request, h: Haendler) {
  const b = await body(req);
  const liste = await preisliste();
  const roh = Array.isArray(b.positionen) ? b.positionen.slice(0, 300) : [];
  const positionen: Position[] = [];
  for (const p of roh) {
    const pid = text(p?.produktId, 200);
    const preis = liste[pid];
    if (!preis || !preis.aktiv) throw new Fehler(400, `Produkt nicht bestellbar: ${pid}`);
    const anzahlVE = ganz(p.anzahlVE, 1, 10_000);
    if (anzahlVE < preis.mindest) throw new Fehler(400, `${preis.name}: Mindestens ${preis.mindest} VE.`);
    const stueck = anzahlVE * preis.ve;
    positionen.push({ produktId: pid, name: preis.name, ve: preis.ve, anzahlVE, stueck, preis: preis.preis, mwst: preis.mwst, netto: stueck * preis.preis });
  }
  if (!positionen.length) throw new Fehler(400, "Der Warenkorb ist leer.");
  const netto = positionen.reduce((a, p) => a + p.netto, 0);
  const mwst = positionen.reduce((a, p) => a + Math.round((p.netto * p.mwst) / 100), 0);
  const best: Bestellung = {
    id: neueId("ZB-"), art: "haendler", haendlerId: h.id, firma: h.firma, positionen, netto, mwst, brutto: netto + mwst,
    notiz: text(b.notiz, 1000), status: "neu", erstellt: jetzt(), verlauf: [{ status: "neu", von: h.id, am: jetzt() }],
  };
  await schreibe(`bestellungen/${best.id}`, best);
  await protokoll("bestellung-neu", h.id, { bestellung: best.id, brutto: best.brutto });
  return json({ ok: true, bestellung: best });
}

async function bestellStatus(req: Request, s: Sitzung) {
  const b = await body(req);
  const id = text(b.id, 40);
  const status = b.status as BStatus;
  if (!BESTELL_STATUS.includes(status)) throw new Fehler(400, "Unbekannter Status.");
  const best = await lese<Bestellung>(`bestellungen/${id}`);
  if (!best) throw new Fehler(404, "Bestellung nicht gefunden.");
  best.status = status;
  best.verlauf.push({ status, von: s.id, am: jetzt() });
  await schreibe(`bestellungen/${id}`, best);
  return json({ ok: true, bestellung: best });
}

/** Bestellung als Verkäufe in die Buchhaltung übernehmen (einmalig). */
/** Verkauf einer Bestellung ins Journal buchen (Admin-Klick oder automatisch nach Online-Zahlung) */
async function bucheBestellung(best: Bestellung, zahlung: string, von: string) {
  const tag = jetzt().slice(0, 10);
  const wer = best.art === "kunde" ? `Kunde: ${best.firma}` : `Händler: ${best.firma}`;
  for (const p of best.positionen) {
    // Betrag = exakte Zeilensumme der Rechnung, kein gerundeter Stückpreis × Menge
    const betrag = typeof p.brutto === "number" ? p.brutto : p.netto + Math.round((p.netto * p.mwst) / 100);
    await neueBuchung({
      typ: "verkauf", datum: tag, produktId: p.produktId, name: p.name, menge: p.stueck,
      einzelpreis: Math.round(betrag / p.stueck), betrag, mwst: p.mwst, zahlungsart: zahlung,
      beleg: best.id, notiz: wer,
    }, von);
  }
  if (best.versand) {
    await neueBuchung({
      typ: "einnahme", datum: tag, produktId: "", name: "Versandkosten", menge: 1, einzelpreis: best.versand,
      betrag: best.versand, mwst: 19, zahlungsart: zahlung, beleg: best.id, notiz: wer,
    }, von);
  }
  best.gebucht = true;
  best.verlauf.push({ status: best.status, von: von + " (gebucht)", am: jetzt() });
  await schreibe(`bestellungen/${best.id}`, best);
}
async function bestellungBuchen(req: Request, s: Sitzung) {
  const b = await body(req);
  const id = text(b.id, 40);
  const best = await lese<Bestellung>(`bestellungen/${id}`);
  if (!best) throw new Fehler(404, "Bestellung nicht gefunden.");
  if (best.gebucht) throw new Fehler(409, "Diese Bestellung ist schon gebucht.");
  if (best.status === "storniert") throw new Fehler(400, "Stornierte Bestellungen können nicht gebucht werden.");
  if (best.art === "preisanfrage") throw new Fehler(400, "Preisanfragen sind keine Verkäufe und werden nicht gebucht.");
  const zahlung = text(b.zahlungsart, 40) || best.zahlart || "Rechnung";
  await bucheBestellung(best, zahlung, s.id);
  return json({ ok: true, bestellung: best });
}

/* =================== Buchhaltung =================== */
async function neueBuchung(d: Omit<Buchung, "id" | "erfasstVon" | "erfasstAm">, von: string): Promise<Buchung> {
  const buchung: Buchung = { ...d, id: neueId("BU-"), erfasstVon: von, erfasstAm: jetzt() };
  await schreibe(`buchungen/${buchung.datum.slice(0, 4)}/${buchung.erfasstAm}-${buchung.id}`, buchung);
  return buchung;
}

async function buchungAnlegen(req: Request, s: Sitzung) {
  const b = await body(req);
  const typ = b.typ as BTyp;
  if (!BUCH_TYPEN.includes(typ)) throw new Fehler(400, "Unbekannte Buchungsart.");
  const mwst = ganz(b.mwst, 0, 19);
  if (!MWST_SAETZE.includes(mwst)) throw new Fehler(400, "MwSt-Satz muss 0, 7 oder 19 sein.");
  const menge = ganz(b.menge ?? 1, 1, 1_000_000);
  const einzelpreis = ganz(b.einzelpreis, 0, 100_000_000);
  const name = text(b.name, 200);
  if (!name) throw new Fehler(400, "Bitte eine Bezeichnung angeben.");
  const buchung = await neueBuchung({
    typ, datum: datum(b.datum), produktId: text(b.produktId, 200), name, menge, einzelpreis,
    betrag: menge * einzelpreis, mwst, zahlungsart: text(b.zahlungsart, 40), beleg: text(b.beleg, 80), notiz: text(b.notiz, 500),
  }, s.id);
  return json({ ok: true, buchung });
}

async function buchungStorno(req: Request, s: Sitzung) {
  const b = await body(req);
  const id = text(b.id, 40);
  const jahr = text(b.jahr, 4);
  const grund = text(b.grund, 300);
  if (!grund) throw new Fehler(400, "Bitte einen Grund für das Storno angeben.");
  const alle = await leseAlle<Buchung>(`buchungen/${jahr}/`);
  const orig = alle.find((x) => x.id === id);
  if (!orig || orig.typ === "storno") throw new Fehler(404, "Buchung nicht gefunden.");
  if (alle.some((x) => x.typ === "storno" && x.bezug === id)) throw new Fehler(409, "Diese Buchung ist schon storniert.");
  const storno = await neueBuchung({
    typ: "storno", datum: jetzt().slice(0, 10), produktId: orig.produktId, name: orig.name, menge: orig.menge,
    einzelpreis: orig.einzelpreis, betrag: orig.betrag, mwst: orig.mwst, zahlungsart: orig.zahlungsart,
    beleg: orig.beleg, notiz: grund, bezug: id,
  }, s.id);
  return json({ ok: true, buchung: storno });
}

/* =================== Shop (Endkunden) =================== */
async function shopPreise(): Promise<ShopPreise> {
  return (await lese<ShopPreise>("preise/shop")) || {};
}
async function einstellungen(): Promise<ShopEinstellungen> {
  return { ...STANDARD_EINSTELLUNGEN, ...((await lese<Partial<ShopEinstellungen>>("einstellungen/shop")) || {}) };
}

/* ---------- Pakete (Themenboxen) ---------- */
const FARBEN = ["pink", "gold", "blue", "orange", "violet", "green", "gruen", "dark", "rot"];
async function pakete(): Promise<Paket[]> {
  return (await lese<Paket[]>("pakete/alle")) || PAKETE_VORLAGE;
}
/** Paket ist kaufbar, wenn es aktiv ist, einen Preis hat und alle Inhalte lieferbar sind */
function paketStatus(pk: Paket) {
  const inhalte = pk.inhalt.map((i) => produkt(i.id)).filter(Boolean) as { n: string; a?: 1; x?: 1 }[];
  const vollstaendig = inhalte.length === pk.inhalt.length && inhalte.length > 0;
  return { ab18: inhalte.some((p) => p.a), lieferbar: vollstaendig && !inhalte.some((p) => p.x) };
}
async function paketeSpeichern(req: Request, s: Sitzung) {
  const b = await body(req);
  const roh = Array.isArray(b.pakete) ? b.pakete.slice(0, 60) : [];
  const ids = new Set<string>();
  const liste: Paket[] = roh.map((r: any) => {
    const id = text(r.id, 60).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (!id || ids.has(id)) throw new Fehler(400, "Jedes Paket braucht eine eigene Kennung.");
    ids.add(id);
    const name = text(r.name, 80);
    if (!name) throw new Fehler(400, "Jedes Paket braucht einen Namen.");
    const inhalt = (Array.isArray(r.inhalt) ? r.inhalt : []).slice(0, 40).map((i: any) => {
      const pid = text(i.id, 200);
      if (!produkt(pid)) throw new Fehler(400, `${name}: Produkt ${pid} gibt es nicht im Sortiment.`);
      return { id: pid, menge: ganz(i.menge, 1, 99) };
    });
    if (!inhalt.length) throw new Fehler(400, `${name}: Bitte mindestens ein Produkt hinzufügen.`);
    const mwst = ganz(r.mwst, 0, 19);
    if (!MWST_SAETZE.includes(mwst)) throw new Fehler(400, "MwSt-Satz muss 0, 7 oder 19 sein.");
    return {
      id, name, untertitel: text(r.untertitel, 160), emoji: text(r.emoji, 16) || "🎁",
      farbe: FARBEN.includes(r.farbe) ? r.farbe : "pink", inhalt,
      preis: r.preis === null || r.preis === "" || r.preis === undefined ? null : ganz(r.preis, 1, 10_000_000),
      mwst, aktiv: r.aktiv !== false,
    };
  });
  await schreibe("pakete/alle", liste);
  await protokoll("pakete-geaendert", s.id, { anzahl: liste.length });
  return json({ ok: true, pakete: liste });
}

/* =================== Stripe (Online-Zahlung, Geld geht direkt auf euer Stripe-Konto) =================== */
function stripeAktiv(): boolean { return !!process.env.STRIPE_SECRET_KEY; }
/** Verschachtelte Objekte in Stripes Formular-Schreibweise: line_items[0][price_data][currency]=eur */
function formKodieren(obj: Record<string, unknown>, praefix = "", out: string[] = []): string[] {
  for (const [k, v] of Object.entries(obj)) {
    const key = praefix ? `${praefix}[${k}]` : k;
    if (v === undefined || v === null) continue;
    if (typeof v === "object") formKodieren(v as Record<string, unknown>, key, out);
    else out.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(v)));
  }
  return out;
}
async function stripeAnfrage(pfad: string, daten: Record<string, unknown>): Promise<any> {
  const res = await fetch("https://api.stripe.com/v1" + pfad, {
    method: "POST",
    headers: { Authorization: "Basic " + btoa(process.env.STRIPE_SECRET_KEY + ":"), "Content-Type": "application/x-www-form-urlencoded" },
    body: formKodieren(daten).join("&"),
  });
  const j: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Stripe-Fehler:", j?.error?.message || res.status);
    throw new Fehler(502, "Die Online-Zahlung ist gerade nicht erreichbar. Bitte eine andere Zahlungsart wählen.");
  }
  return j;
}
/** Stripe-Checkout-Sitzung für eine Bestellung anlegen; Beträge kommen aus der Bestellung, nie vom Browser */
async function stripeSitzung(best: Bestellung, email: string, origin: string): Promise<{ id: string; url: string }> {
  const line_items: Record<string, unknown>[] = best.positionen.map((p) => ({
    quantity: p.stueck,
    price_data: { currency: "eur", unit_amount: Math.round((p.brutto || 0) / p.stueck), product_data: { name: p.name.slice(0, 120) } },
  }));
  if (best.versand) line_items.push({ quantity: 1, price_data: { currency: "eur", unit_amount: best.versand, product_data: { name: "Versand" } } });
  return await stripeAnfrage("/checkout/sessions", {
    mode: "payment", locale: "de", customer_email: email, client_reference_id: best.id,
    success_url: `${origin}/warenkorb.html?bezahlt=${best.id}&s={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/warenkorb.html?abgebrochen=${best.id}`,
    line_items, metadata: { bestellung: best.id },
    payment_intent_data: { description: `ZUKKABRO Bestellung ${best.id}`, metadata: { bestellung: best.id } },
  });
}
/** Stripe meldet die Zahlung: Bestellung auf "bezahlt" setzen und automatisch buchen */
async function stripeWebhook(req: Request) {
  const geheim = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!geheim) throw new Fehler(404, "Nicht gefunden.");
  const payload = await req.text();
  const teile: Record<string, string> = {};
  (req.headers.get("stripe-signature") || "").split(",").forEach((p) => { const i = p.indexOf("="); if (i > 0) teile[p.slice(0, i).trim()] = p.slice(i + 1).trim(); });
  const erwartet = createHmac("sha256", geheim).update(`${teile.t}.${payload}`).digest("hex");
  const ok = !!teile.t && !!teile.v1 && erwartet.length === teile.v1.length && timingSafeEqual(Buffer.from(erwartet), Buffer.from(teile.v1))
    && Math.abs(Date.now() / 1000 - Number(teile.t)) < 600;
  if (!ok) throw new Fehler(400, "Ungültige Signatur.");
  const ev = JSON.parse(payload);
  if (ev?.type === "checkout.session.completed") {
    const sitzung = ev.data?.object || {};
    const id = text(sitzung.metadata?.bestellung || sitzung.client_reference_id, 40);
    const bezahlt = sitzung.payment_status === "paid" || sitzung.payment_status === "no_payment_required";
    if (bezahlt && /^ZK-\d{8}-[0-9A-F]{8}$/.test(id)) {
      const best = await lese<Bestellung>(`bestellungen/${id}`);
      if (best && best.stripe?.status !== "bezahlt") {
        best.stripe = { session: String(sitzung.id || ""), status: "bezahlt", paymentIntent: String(sitzung.payment_intent || ""), bezahltAm: jetzt() };
        best.status = "bezahlt";
        best.verlauf.push({ status: "bezahlt", von: "Stripe", am: jetzt() });
        await schreibe(`bestellungen/${id}`, best);
        if (!best.gebucht) await bucheBestellung(best, "Stripe", "stripe");
        await protokoll("stripe-bezahlt", id, { betrag: sitzung.amount_total });
      }
    }
  }
  return json({ ok: true });
}
/** Danke-Seite nach Stripe: Status der Bestellung (nur mit passender Sitzungs-Kennung) */
async function stripeBestellStatus(url: URL) {
  const nr = text(url.searchParams.get("nr"), 40), sitzung = text(url.searchParams.get("s"), 120);
  if (!/^ZK-\d{8}-[0-9A-F]{8}$/.test(nr)) throw new Fehler(404, "Bestellung nicht gefunden.");
  const best = await lese<Bestellung>(`bestellungen/${nr}`);
  if (!best || !best.stripe || !sitzung || best.stripe.session !== sitzung) throw new Fehler(404, "Bestellung nicht gefunden.");
  return json({ nr, status: best.status, bezahlt: best.stripe.status === "bezahlt", brutto: best.brutto, lieferart: best.lieferart });
}

/* =================== Laden in Heilbronn: Öffnungszeiten, Karte, Tageskasse =================== */
const ALLERGENE = ["Gluten", "Krebstiere", "Eier", "Fisch", "Erdnüsse", "Soja", "Milch", "Schalenfrüchte", "Sellerie", "Senf", "Sesam", "Sulfite", "Lupinen", "Weichtiere"];
const KARTE_ARTEN = ["matcha", "bowl", "extra", "sonstiges"];
const TAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
async function ladenEinstellungen(): Promise<LadenEinstellungen> {
  return { ...LADEN_STANDARD, ...((await lese<Partial<LadenEinstellungen>>("laden/einstellungen")) || {}) };
}
async function karte(): Promise<KarteEintrag[]> { return (await lese<KarteEintrag[]>("laden/karte")) || KARTE_VORLAGE; }
async function ladenDaten() {
  const [l, k] = await Promise.all([ladenEinstellungen(), karte()]);
  return json({ laden: l, karte: k.filter((x) => x.aktiv), allergene: ALLERGENE });
}
function uhrzeit(v: unknown): string {
  const t = text(v, 5);
  if (t && !/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) throw new Fehler(400, "Uhrzeit bitte als HH:MM angeben.");
  return t;
}
async function ladenSpeichern(req: Request, s: Sitzung) {
  const b = await body(req);
  const roh: any[] = Array.isArray(b.zeiten) ? b.zeiten : [];
  const zeiten = TAGE.map((tag) => {
    const z = roh.find((x) => x && x.tag === tag) || {};
    const offen = z.offen === true;
    const von = offen ? uhrzeit(z.von) : "", bis = offen ? uhrzeit(z.bis) : "";
    if (offen && (!von || !bis)) throw new Fehler(400, `Bitte Öffnungszeit für ${tag} angeben (von, bis).`);
    return { tag, offen, von, bis };
  });
  const l: LadenEinstellungen = {
    name: text(b.name, 80) || LADEN_STANDARD.name, strasse: text(b.strasse, 120), plz: text(b.plz, 10), ort: text(b.ort, 80) || "Heilbronn",
    hinweis: text(b.hinweis, 400), aktiv: b.aktiv !== false, zeiten,
  };
  await schreibe("laden/einstellungen", l);
  await protokoll("laden-geaendert", s.id);
  return json({ ok: true, laden: l });
}
function kennung(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
async function karteSpeichern(req: Request, s: Sitzung) {
  const b = await body(req);
  const roh: any[] = Array.isArray(b.karte) ? b.karte.slice(0, 80) : [];
  const ids = new Set<string>();
  const liste: KarteEintrag[] = roh.map((r) => {
    const name = text(r?.name, 80);
    if (!name) throw new Fehler(400, "Jeder Eintrag auf der Karte braucht einen Namen.");
    const id = kennung(text(r?.id, 60)) || kennung(name);
    if (!id || ids.has(id)) throw new Fehler(400, `${name} ist doppelt auf der Karte.`);
    ids.add(id);
    const art = KARTE_ARTEN.includes(r?.art) ? r.art : "sonstiges";
    const mwst = ganz(r?.mwst ?? (art === "bowl" ? 7 : 19), 0, 19);
    if (!MWST_SAETZE.includes(mwst)) throw new Fehler(400, "MwSt-Satz muss 0, 7 oder 19 sein.");
    const allergene = Array.isArray(r?.allergene) ? r.allergene.filter((a: unknown) => typeof a === "string" && ALLERGENE.includes(a)) : [];
    const preis = r?.preis === null || r?.preis === "" || r?.preis === undefined ? null : ganz(r.preis, 1, 1_000_000);
    return { id, name, art, preis, beschreibung: text(r?.beschreibung, 200), allergene, mwst, aktiv: r?.aktiv !== false };
  });
  await schreibe("laden/karte", liste);
  await protokoll("karte-geaendert", s.id, { anzahl: liste.length });
  return json({ ok: true, karte: liste });
}

/* ---------- Tageskasse: Kassenbericht pro Tag (offene Ladenkasse), Abschluss bucht ins Journal ---------- */
interface KassenVerkauf { nr: number; zeit: string; id: string; name: string; menge: number; preis: number; betrag: number; mwst: number; zahlungsart: "Bar" | "Karte"; storno: boolean }
interface KassenAusgabe { nr: number; zeit: string; text: string; betrag: number; storno: boolean }
interface KassenAbschluss { gezaehlt: number; soll: number; differenz: number; bar: number; karte: number; umsatz: number; ausgaben: number; am: string; von: string; notiz: string }
interface KassenTag { datum: string; anfang: number; verkaeufe: KassenVerkauf[]; ausgaben: KassenAusgabe[]; abschluss: KassenAbschluss | null }
function kassenTagParam(v: unknown): string { return datum(v || jetzt().slice(0, 10)); }
function kassenSumme(t: KassenTag) {
  const v = t.verkaeufe.filter((x) => !x.storno), a = t.ausgaben.filter((x) => !x.storno);
  const bar = v.filter((x) => x.zahlungsart === "Bar").reduce((sum, x) => sum + x.betrag, 0);
  const karteSumme = v.filter((x) => x.zahlungsart === "Karte").reduce((sum, x) => sum + x.betrag, 0);
  const ausgaben = a.reduce((sum, x) => sum + x.betrag, 0);
  return { bar, karte: karteSumme, umsatz: bar + karteSumme, ausgaben, soll: t.anfang + bar - ausgaben, verkaeufe: v.length };
}
async function kassenTag(tag: string): Promise<KassenTag> {
  const t = await lese<KassenTag>(`kasse/${tag}`);
  if (t) return t;
  // Anfangsbestand = gezählter Endbestand des letzten abgeschlossenen Tages
  const fruehere = (await leseAlle<KassenTag>("kasse/")).filter((x) => x.datum < tag && x.abschluss);
  const letzter = fruehere[fruehere.length - 1];
  return { datum: tag, anfang: letzter ? letzter.abschluss!.gezaehlt : 0, verkaeufe: [], ausgaben: [], abschluss: null };
}
function kassenOffen(t: KassenTag) { if (t.abschluss) throw new Fehler(409, "Dieser Tag ist schon abgeschlossen."); }
async function kasseAntwort(t: KassenTag) { return json({ tag: t, summe: kassenSumme(t) }); }
async function kasseVerkauf(req: Request) {
  const b = await body(req);
  const tag = kassenTagParam(b.tag); const t = await kassenTag(tag); kassenOffen(t);
  const name = text(b.name, 120);
  if (!name) throw new Fehler(400, "Bitte einen Artikel angeben.");
  const menge = ganz(b.menge ?? 1, 1, 999), preis = ganz(b.preis, 0, 1_000_000), mwst = ganz(b.mwst ?? 19, 0, 19);
  if (!MWST_SAETZE.includes(mwst)) throw new Fehler(400, "MwSt-Satz muss 0, 7 oder 19 sein.");
  t.verkaeufe.push({ nr: t.verkaeufe.length + 1, zeit: jetzt(), id: text(b.id, 200), name, menge, preis, betrag: menge * preis, mwst, zahlungsart: b.zahlungsart === "Karte" ? "Karte" : "Bar", storno: false });
  await schreibe(`kasse/${tag}`, t);
  return kasseAntwort(t);
}
async function kasseAusgabe(req: Request) {
  const b = await body(req);
  const tag = kassenTagParam(b.tag); const t = await kassenTag(tag); kassenOffen(t);
  const txt = text(b.text, 120);
  if (!txt) throw new Fehler(400, "Bitte angeben, wofür das Geld entnommen wurde.");
  t.ausgaben.push({ nr: t.ausgaben.length + 1, zeit: jetzt(), text: txt, betrag: ganz(b.betrag, 1, 10_000_000), storno: false });
  await schreibe(`kasse/${tag}`, t);
  return kasseAntwort(t);
}
async function kasseStorno(req: Request) {
  const b = await body(req);
  const tag = kassenTagParam(b.tag); const t = await kassenTag(tag); kassenOffen(t);
  const liste: { nr: number; storno: boolean }[] = b.art === "ausgabe" ? t.ausgaben : t.verkaeufe;
  const e = liste.find((x) => x.nr === ganz(b.nr, 1, 100_000));
  if (!e) throw new Fehler(404, "Eintrag nicht gefunden.");
  e.storno = true;
  await schreibe(`kasse/${tag}`, t);
  return kasseAntwort(t);
}
async function kasseAnfang(req: Request) {
  const b = await body(req);
  const tag = kassenTagParam(b.tag); const t = await kassenTag(tag); kassenOffen(t);
  t.anfang = ganz(b.anfang, 0, 100_000_000);
  await schreibe(`kasse/${tag}`, t);
  return kasseAntwort(t);
}
async function kasseAbschluss(req: Request, s: Sitzung) {
  const b = await body(req);
  const tag = kassenTagParam(b.tag); const t = await kassenTag(tag); kassenOffen(t);
  const gezaehlt = ganz(b.gezaehlt, 0, 100_000_000);
  const summe = kassenSumme(t);
  // Verkäufe je Artikel, Preis, MwSt und Zahlungsart zusammengefasst ins Journal
  const gruppen = new Map<string, { id: string; name: string; preis: number; mwst: number; zahlungsart: string; menge: number; betrag: number }>();
  for (const v of t.verkaeufe.filter((x) => !x.storno)) {
    const key = [v.id, v.name, v.preis, v.mwst, v.zahlungsart].join("|");
    const g = gruppen.get(key) || { id: v.id, name: v.name, preis: v.preis, mwst: v.mwst, zahlungsart: v.zahlungsart, menge: 0, betrag: 0 };
    g.menge += v.menge; g.betrag += v.betrag; gruppen.set(key, g);
  }
  for (const g of gruppen.values()) {
    await neueBuchung({ typ: "verkauf", datum: tag, produktId: g.id, name: g.name, menge: g.menge, einzelpreis: g.preis, betrag: g.betrag, mwst: g.mwst, zahlungsart: g.zahlungsart, beleg: `KASSE-${tag}`, notiz: "Tageskasse Laden" }, s.id);
  }
  for (const a of t.ausgaben.filter((x) => !x.storno)) {
    await neueBuchung({ typ: "ausgabe", datum: tag, produktId: "", name: a.text, menge: 1, einzelpreis: a.betrag, betrag: a.betrag, mwst: 0, zahlungsart: "Bar", beleg: `KASSE-${tag}`, notiz: "Kassenentnahme Laden" }, s.id);
  }
  t.abschluss = { gezaehlt, soll: summe.soll, differenz: gezaehlt - summe.soll, bar: summe.bar, karte: summe.karte, umsatz: summe.umsatz, ausgaben: summe.ausgaben, am: jetzt(), von: s.id, notiz: text(b.notiz, 500) };
  await schreibe(`kasse/${tag}`, t);
  await protokoll("kasse-abschluss", s.id, { tag, umsatz: summe.umsatz, differenz: t.abschluss.differenz });
  return kasseAntwort(t);
}
async function kasseBerichte(url: URL) {
  const monat = /^\d{4}-\d{2}$/.test(url.searchParams.get("monat") || "") ? url.searchParams.get("monat")! : jetzt().slice(0, 7);
  const tage = await leseAlle<KassenTag>(`kasse/${monat}-`);
  return json({ monat, tage: tage.map((t) => ({ datum: t.datum, anfang: t.anfang, ...kassenSumme(t), abschluss: t.abschluss })) });
}

/* ---------- Kontaktformular ---------- */
interface Nachricht { id: string; name: string; email: string; telefon: string; betreff: string; text: string; erstellt: string; gelesen: boolean }
async function kontakt(req: Request, ip: string) {
  await bremse("kontakt", ip, 5, 60);
  const b = await body(req);
  const n: Nachricht = {
    id: neueId("N-"), name: text(b.name, 100), email: text(b.email, 120).toLowerCase(), telefon: text(b.telefon, 40),
    betreff: text(b.betreff, 120), text: text(b.text, 2000), erstellt: jetzt(), gelesen: false,
  };
  if (!n.name || !n.text) throw new Fehler(400, "Bitte Name und Nachricht angeben.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(n.email)) throw new Fehler(400, "Bitte eine gültige E-Mail-Adresse angeben.");
  if (b.datenschutz !== true) throw new Fehler(400, "Bitte die Datenschutzerklärung bestätigen.");
  if (text(b.website, 10)) return json({ ok: true, id: n.id }); // Honigtopf: nur Bots füllen das versteckte Feld
  await schreibe("nachrichten/" + n.id, n);
  await protokoll("nachricht-neu", n.email, { id: n.id, betreff: n.betreff });
  return json({ ok: true, id: n.id });
}
async function nachrichtStatus(req: Request) {
  const b = await body(req);
  const id = text(b.id, 40);
  if (!/^N-\d{8}-[0-9A-F]{8}$/.test(id)) throw new Fehler(404, "Nachricht nicht gefunden.");
  const n = await lese<Nachricht>("nachrichten/" + id);
  if (!n) throw new Fehler(404, "Nachricht nicht gefunden.");
  n.gelesen = b.gelesen !== false;
  await schreibe("nachrichten/" + id, n);
  return json({ ok: true, nachricht: n });
}

/* ---------- Angebote (Slider auf der Startseite, Aktionspreise) ---------- */
interface Angebot { id: string; preis: number; titel: string; aktiv: boolean; bis: string }
async function angebote(): Promise<Angebot[]> {
  return (await lese<Angebot[]>("angebote/alle")) || [];
}
/** Nur laufende Angebote: aktiv, Produkt vorhanden und lieferbar, Enddatum nicht überschritten */
async function laufendeAngebote(): Promise<Angebot[]> {
  const heute = jetzt().slice(0, 10);
  return (await angebote()).filter((a) => a.aktiv && produkt(a.id) && !produkt(a.id)!.x && (!a.bis || a.bis >= heute));
}
/** Endkundenpreise inkl. Aktionspreise: ein laufendes Angebot ersetzt den Shop-Preis */
async function effektivePreise(): Promise<{ preise: ShopPreise; angebote: (Angebot & { alt: number | null })[] }> {
  const [shop, laufend] = await Promise.all([shopPreise(), laufendeAngebote()]);
  const preise: ShopPreise = { ...shop };
  const liste = laufend.map((a) => {
    const regulaer = shop[a.id];
    preise[a.id] = { preis: a.preis, mwst: regulaer ? regulaer.mwst : mwstVorschlag(a.id) };
    return { ...a, alt: regulaer && regulaer.preis > a.preis ? regulaer.preis : null };
  });
  return { preise, angebote: liste };
}
async function angeboteSpeichern(req: Request, s: Sitzung) {
  const b = await body(req);
  const roh = Array.isArray(b.angebote) ? b.angebote.slice(0, 12) : [];
  const ids = new Set<string>();
  const liste: Angebot[] = [];
  for (const r of roh) {
    const id = text(r?.id, 200);
    if (!produkt(id)) throw new Fehler(400, `Unbekanntes Produkt: ${id || "(leer)"}`);
    if (ids.has(id)) throw new Fehler(400, `${produkt(id)!.n} ist doppelt im Angebot.`);
    ids.add(id);
    const bis = text(r?.bis, 10);
    if (bis && !/^\d{4}-\d{2}-\d{2}$/.test(bis)) throw new Fehler(400, "Enddatum bitte als Datum angeben.");
    liste.push({ id, preis: ganz(r?.preis, 1, 10_000_000), titel: text(r?.titel, 40), aktiv: r?.aktiv !== false, bis });
  }
  await schreibe("angebote/alle", liste);
  await protokoll("angebote-geaendert", s.id, { anzahl: liste.length });
  return json({ ok: true, angebote: liste });
}

/** Öffentliche Shop-Daten: Endkundenpreise und Versandregeln (keine Händlerpreise!) */
async function shopDaten() {
  const [{ preise, angebote: laufend }, e, alle] = await Promise.all([effektivePreise(), einstellungen(), pakete()]);
  const nurPreise: Record<string, number> = {};
  for (const [id, p] of Object.entries(preise)) if (produkt(id)) nurPreise[id] = p.preis;
  return json({
    preise: nurPreise,
    angebote: laufend.map((a) => ({ id: a.id, preis: a.preis, alt: a.alt, titel: a.titel, bis: a.bis })),
    versand: { kosten: e.versand, freiAb: e.versandfreiAb, abholung: e.abholung, abholort: e.abholort },
    zahlarten: zahlarten(e),
    ohnePreisAusblenden: !!(e as any).ohnePreisAusblenden,
    pakete: alle.filter((pk) => pk.aktiv).map((pk) => ({
      id: pk.id, name: pk.name, untertitel: pk.untertitel, emoji: pk.emoji, farbe: pk.farbe,
      inhalt: pk.inhalt, preis: pk.preis, ...paketStatus(pk),
    })),
  });
}
function zahlarten(e: ShopEinstellungen): string[] {
  const z = ["Überweisung (Vorkasse)"];
  if (e.paypal) z.push("PayPal");
  if (e.abholung) z.push("Bar bei Abholung");
  if (stripeAktiv()) z.push("Online bezahlen");
  return z;
}

async function kasse(req: Request, ip: string) {
  await bremse("kasse", ip, 10, 60);
  const b = await body(req);
  const [{ preise }, e, allePakete] = await Promise.all([effektivePreise(), einstellungen(), pakete()]);
  const k = b.kunde || {};
  const kunde: Kunde = {
    vorname: text(k.vorname, 80), nachname: text(k.nachname, 80), email: text(k.email, 120).toLowerCase(),
    telefon: text(k.telefon, 40), strasse: text(k.strasse, 120), plz: text(k.plz, 10), ort: text(k.ort, 80),
  };
  const lieferart = b.lieferart === "abholung" ? "abholung" : "versand";
  if (lieferart === "abholung" && !e.abholung) throw new Fehler(400, "Abholung ist zurzeit nicht möglich.");
  if (!kunde.vorname || !kunde.nachname) throw new Fehler(400, "Bitte Vor- und Nachnamen angeben.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(kunde.email)) throw new Fehler(400, "Bitte eine gültige E-Mail-Adresse angeben.");
  if (lieferart === "versand" && (!kunde.strasse || !kunde.plz || !kunde.ort)) throw new Fehler(400, "Bitte die vollständige Lieferadresse angeben.");
  const zahlart = text(b.zahlart, 40);
  if (!zahlarten(e).includes(zahlart)) throw new Fehler(400, "Bitte eine Zahlungsart wählen.");
  if (zahlart === "Bar bei Abholung" && lieferart !== "abholung") throw new Fehler(400, "Barzahlung geht nur bei Abholung.");
  if (b.agb !== true || b.datenschutz !== true) throw new Fehler(400, "Bitte AGB, Widerrufsbelehrung und Datenschutz bestätigen.");

  const roh = Array.isArray(b.positionen) ? b.positionen.slice(0, 100) : [];
  const positionen: Position[] = [];
  let ab18 = false;
  for (const r of roh) {
    const id = text(r?.produktId, 200);
    if (id.startsWith("paket:")) {
      const pk = allePakete.find((x) => x.id === id.slice(6) && x.aktiv);
      if (!pk || pk.preis === null) throw new Fehler(400, "Ein Paket im Warenkorb ist nicht mehr erhältlich. Bitte Warenkorb prüfen.");
      const st = paketStatus(pk);
      if (!st.lieferbar) throw new Fehler(400, `Paket ${pk.name} ist gerade nicht vollständig lieferbar.`);
      const menge = ganz(r.menge, 1, 99);
      if (st.ab18) ab18 = true;
      const brutto = menge * pk.preis;
      const mw = mwstAusBrutto(brutto, pk.mwst);
      positionen.push({ produktId: id, name: `Paket: ${pk.name}`, ve: 1, anzahlVE: menge, stueck: menge, preis: Math.round((pk.preis * 100) / (100 + pk.mwst)), mwst: pk.mwst, netto: brutto - mw, brutto });
      continue;
    }
    const prod = produkt(id);
    const preis = preise[id];
    if (!prod || !preis) throw new Fehler(400, "Ein Artikel im Warenkorb ist nicht mehr erhältlich. Bitte Warenkorb prüfen.");
    if (prod.x) throw new Fehler(400, `${prod.n} ist gerade nicht lieferbar.`);
    const menge = ganz(r.menge, 1, 999);
    if (prod.a) ab18 = true;
    const brutto = menge * preis.preis;
    const mw = mwstAusBrutto(brutto, preis.mwst);
    positionen.push({ produktId: id, name: prod.n, ve: 1, anzahlVE: menge, stueck: menge, preis: Math.round((preis.preis * 100) / (100 + preis.mwst)), mwst: preis.mwst, netto: brutto - mw, brutto });
  }
  if (!positionen.length) throw new Fehler(400, "Dein Warenkorb ist leer.");
  if (ab18) {
    const gd = datum(b.geburtsdatum);
    if (alter(gd) < 18) throw new Fehler(403, "Artikel ab 18 dürfen wir nur an Volljährige verkaufen.");
    if (b.ab18Bestaetigt !== true) throw new Fehler(400, "Bitte bestätige, dass du mindestens 18 Jahre alt bist.");
    kunde.geburtsdatum = gd;
  }
  const warenwert = positionen.reduce((a, p) => a + (p.brutto || 0), 0);
  const versand = lieferart === "versand" && !(e.versandfreiAb > 0 && warenwert >= e.versandfreiAb) ? e.versand : 0;
  const mwst = positionen.reduce((a, p) => a + ((p.brutto || 0) - p.netto), 0) + mwstAusBrutto(versand, 19);
  const brutto = warenwert + versand;
  const best: Bestellung = {
    id: neueId("ZK-"), art: "kunde", haendlerId: "", firma: `${kunde.vorname} ${kunde.nachname}`, positionen,
    netto: brutto - mwst, mwst, brutto, notiz: text(b.notiz, 1000), status: "neu", erstellt: jetzt(),
    verlauf: [{ status: "neu", von: "Kunde", am: jetzt() }], kunde, lieferart, zahlart, versand, ab18,
  };
  await schreibe(`bestellungen/${best.id}`, best);
  await protokoll("kundenbestellung-neu", kunde.email, { bestellung: best.id, brutto });
  let zahlungsinfo: Record<string, unknown>;
  if (zahlart === "Online bezahlen") {
    // Stripe Checkout: Kunde zahlt auf der Stripe-Seite, Bestätigung kommt per Webhook
    const sitzung = await stripeSitzung(best, kunde.email, new URL(req.url).origin);
    best.stripe = { session: sitzung.id, status: "offen" };
    await schreibe(`bestellungen/${best.id}`, best);
    zahlungsinfo = { art: "stripe", betrag: brutto, url: sitzung.url };
  } else if (zahlart.startsWith("Überweisung")) {
    zahlungsinfo = { art: "ueberweisung", inhaber: e.bankInhaber, iban: e.bankIban, bank: e.bankName, betrag: brutto, verwendungszweck: best.id };
  } else if (zahlart === "PayPal") {
    zahlungsinfo = { art: "paypal", ziel: e.paypal, betrag: brutto, verwendungszweck: best.id };
  } else {
    zahlungsinfo = { art: "bar", betrag: brutto, abholort: e.abholort };
  }
  return json({ ok: true, nr: best.id, brutto, versand, zahlungsinfo, hinweis: e.hinweis, ab18 });
}

/** Händler fragt Preise für Artikel ohne Händlerpreis an */
async function preisanfrage(req: Request, h: Haendler) {
  const b = await body(req);
  const roh = Array.isArray(b.positionen) ? b.positionen.slice(0, 200) : [];
  const positionen: Position[] = [];
  for (const r of roh) {
    const id = text(r?.produktId, 200);
    const prod = produkt(id);
    if (!prod) continue;
    const stueck = ganz(r.stueck, 1, 1_000_000);
    positionen.push({ produktId: id, name: prod.n, ve: 1, anzahlVE: stueck, stueck, preis: 0, mwst: mwstVorschlag(id), netto: 0 });
  }
  if (!positionen.length) throw new Fehler(400, "Bitte mindestens ein Produkt mit Wunschmenge auswählen.");
  const anfrage: Bestellung = {
    id: neueId("PA-"), art: "preisanfrage", haendlerId: h.id, firma: h.firma, positionen, netto: 0, mwst: 0, brutto: 0,
    notiz: text(b.notiz, 1000), status: "neu", erstellt: jetzt(), verlauf: [{ status: "neu", von: h.id, am: jetzt() }],
  };
  await schreibe(`bestellungen/${anfrage.id}`, anfrage);
  await protokoll("preisanfrage-neu", h.id, { anfrage: anfrage.id, artikel: positionen.length });
  return json({ ok: true, anfrage });
}

async function shopPreiseSpeichern(req: Request, s: Sitzung) {
  const b = await body(req);
  const aenderungen = b.aenderungen && typeof b.aenderungen === "object" ? b.aenderungen : {};
  const liste = await shopPreise();
  let n = 0;
  for (const [id, wert] of Object.entries<any>(aenderungen)) {
    const pid = text(id, 200);
    if (!pid || n++ > 2000) continue;
    if (wert === null) { delete liste[pid]; continue; }
    const mwst = ganz(wert.mwst, 0, 19);
    if (!MWST_SAETZE.includes(mwst)) throw new Fehler(400, "MwSt-Satz muss 0, 7 oder 19 sein.");
    liste[pid] = { preis: ganz(wert.preis, 1, 10_000_000), mwst };
  }
  await schreibe("preise/shop", liste);
  await protokoll("shoppreise-geaendert", s.id, { anzahl: Object.keys(aenderungen).length });
  return json({ ok: true, shop: liste });
}

async function einstellungenSpeichern(req: Request, s: Sitzung) {
  const b = await body(req);
  const e: ShopEinstellungen & { ohnePreisAusblenden: boolean } = {
    versand: ganz(b.versand, 0, 100_000), versandfreiAb: ganz(b.versandfreiAb, 0, 10_000_000),
    abholung: b.abholung === true, abholort: text(b.abholort, 200),
    bankInhaber: text(b.bankInhaber, 100), bankIban: text(b.bankIban, 40).replace(/\s+/g, " "), bankName: text(b.bankName, 100),
    paypal: text(b.paypal, 200), hinweis: text(b.hinweis, 1000), ohnePreisAusblenden: b.ohnePreisAusblenden === true,
  };
  await schreibe("einstellungen/shop", e);
  await protokoll("einstellungen-geaendert", s.id);
  return json({ ok: true, einstellungen: e });
}

/* =================== Router =================== */
export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const pfad = url.pathname.replace(/^\/api/, "").replace(/\/+$/, "") || "/";
  const m = req.method;
  const ip = context.ip || req.headers.get("x-nf-client-connection-ip") || "unbekannt";

  try {
    // Stripe ruft den Webhook ohne unseren Header auf, die Signatur schützt ihn
    if (m === "POST" && pfad === "/stripe/webhook") return await stripeWebhook(req);
    // Schutz vor fremden Formularen: schreibende Anfragen brauchen unseren Header
    if (m !== "GET" && req.headers.get("x-zb") !== "1") throw new Fehler(403, "Anfrage abgelehnt.");
    const s = leseSitzung(req);

    if (m === "POST" && pfad === "/login") return await login(req, ip);
    if (m === "POST" && pfad === "/logout") return json({ ok: true }, 200, { "Set-Cookie": abmeldeCookie() });
    if (m === "GET" && pfad === "/ich") return await ich(s);
    if (m === "POST" && pfad === "/haendler/registrieren") return await registrieren(req, ip);
    if (m === "GET" && pfad === "/shop/daten") return await shopDaten();
    if (m === "POST" && pfad === "/kontakt") return await kontakt(req, ip);
    if (m === "GET" && pfad === "/shop/laden") return await ladenDaten();
    if (m === "GET" && pfad === "/shop/bestellung/status") return await stripeBestellStatus(url);
    if (m === "POST" && pfad === "/shop/bestellung") return await kasse(req, ip);

    /* ---- Händler ---- */
    if (pfad.startsWith("/haendler/")) {
      const h = await aktiverHaendler(s);
      if (m === "GET" && pfad === "/haendler/preise") {
        const liste = await preisliste();
        const sichtbar: Preisliste = {};
        for (const [id, p] of Object.entries(liste)) if (p.aktiv) sichtbar[id] = p;
        return json({ preise: sichtbar });
      }
      if (m === "GET" && pfad === "/haendler/bestellungen") {
        const alle = await leseAlle<Bestellung>("bestellungen/");
        return json({ bestellungen: alle.filter((b) => b.haendlerId === h.id).reverse() });
      }
      if (m === "POST" && pfad === "/haendler/bestellungen") return await bestellen(req, h);
      if (m === "POST" && pfad === "/haendler/preisanfrage") return await preisanfrage(req, h);
      throw new Fehler(404, "Nicht gefunden.");
    }

    /* ---- Admin ---- */
    if (pfad.startsWith("/admin/")) {
      const a = braucht(s, "admin");
      if (m === "GET" && pfad === "/admin/haendler") {
        const alle = await leseAlle<Haendler>("haendler/");
        return json({ haendler: alle.map(ohnePass).reverse() });
      }
      if (m === "POST" && pfad === "/admin/haendler/status") {
        const b = await body(req);
        const h = await lese<Haendler>(`haendler/${text(b.id, 40)}`);
        if (!h) throw new Fehler(404, "Händler nicht gefunden.");
        const status = b.status as HStatus;
        if (!["offen", "aktiv", "gesperrt"].includes(status)) throw new Fehler(400, "Unbekannter Status.");
        h.status = status; h.geaendert = jetzt();
        if (typeof b.notiz === "string") h.notiz = text(b.notiz, 500);
        await schreibe(`haendler/${h.id}`, h);
        await protokoll("haendler-status", a.id, { haendler: h.id, status });
        return json({ ok: true, haendler: ohnePass(h) });
      }
      if (m === "GET" && pfad === "/admin/preise") {
        const [preise, shop, e] = await Promise.all([preisliste(), shopPreise(), einstellungen()]);
        return json({ preise, shop, einstellungen: e });
      }
      if (m === "POST" && pfad === "/admin/shoppreise") return await shopPreiseSpeichern(req, a);
      if (m === "GET" && pfad === "/admin/laden") return json({ laden: await ladenEinstellungen(), karte: await karte(), allergene: ALLERGENE, arten: KARTE_ARTEN });
      if (m === "POST" && pfad === "/admin/laden") return await ladenSpeichern(req, a);
      if (m === "POST" && pfad === "/admin/karte") return await karteSpeichern(req, a);
      if (m === "GET" && pfad === "/admin/kasse") return await kasseAntwort(await kassenTag(kassenTagParam(url.searchParams.get("tag"))));
      if (m === "GET" && pfad === "/admin/kasse/berichte") return await kasseBerichte(url);
      if (m === "POST" && pfad === "/admin/kasse/verkauf") return await kasseVerkauf(req);
      if (m === "POST" && pfad === "/admin/kasse/ausgabe") return await kasseAusgabe(req);
      if (m === "POST" && pfad === "/admin/kasse/storno") return await kasseStorno(req);
      if (m === "POST" && pfad === "/admin/kasse/anfang") return await kasseAnfang(req);
      if (m === "POST" && pfad === "/admin/kasse/abschluss") return await kasseAbschluss(req, a);
      if (m === "GET" && pfad === "/admin/nachrichten") return json({ nachrichten: (await leseAlle<Nachricht>("nachrichten/")).reverse() });
      if (m === "POST" && pfad === "/admin/nachrichten/status") return await nachrichtStatus(req);
      if (m === "GET" && pfad === "/admin/angebote") return json({ angebote: await angebote() });
      if (m === "POST" && pfad === "/admin/angebote") return await angeboteSpeichern(req, a);
      if (m === "POST" && pfad === "/admin/einstellungen") return await einstellungenSpeichern(req, a);
      if (m === "GET" && pfad === "/admin/pakete") return json({ pakete: await pakete() });
      if (m === "POST" && pfad === "/admin/pakete") return await paketeSpeichern(req, a);
      if (m === "POST" && pfad === "/admin/preise") return await preiseSpeichern(req, a);
      if (m === "GET" && pfad === "/admin/bestellungen") return json({ bestellungen: (await leseAlle<Bestellung>("bestellungen/")).reverse() });
      if (m === "POST" && pfad === "/admin/bestellungen/status") return await bestellStatus(req, a);
      if (m === "POST" && pfad === "/admin/bestellungen/buchen") return await bestellungBuchen(req, a);
      if (m === "GET" && pfad === "/admin/buchungen") {
        const wunsch = url.searchParams.get("jahr") || "";
        if (wunsch === "alle") return json({ jahr: "alle", buchungen: await leseAlle<Buchung>("buchungen/") });
        const jahr = /^\d{4}$/.test(wunsch) ? wunsch : String(new Date().getFullYear());
        return json({ jahr, buchungen: await leseAlle<Buchung>(`buchungen/${jahr}/`) });
      }
      if (m === "POST" && pfad === "/admin/buchungen") return await buchungAnlegen(req, a);
      if (m === "POST" && pfad === "/admin/buchungen/storno") return await buchungStorno(req, a);
      if (m === "GET" && pfad === "/admin/protokoll") {
        const monat = /^\d{4}-\d{2}$/.test(url.searchParams.get("monat") || "") ? url.searchParams.get("monat")! : jetzt().slice(0, 7);
        return json({ protokoll: (await leseAlle<any>(`protokoll/${monat}/`)).reverse().slice(0, 500) });
      }
      throw new Fehler(404, "Nicht gefunden.");
    }

    throw new Fehler(404, "Nicht gefunden.");
  } catch (e) {
    if (e instanceof Fehler) return json({ fehler: e.message }, e.status);
    console.error(e);
    return json({ fehler: "Serverfehler. Bitte später erneut versuchen." }, 500);
  }
};

export const config: Config = {
  path: "/api/*",
};
