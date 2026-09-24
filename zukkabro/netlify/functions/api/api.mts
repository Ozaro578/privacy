// ZUKKABRO – Server-API für Admin-Bereich, Händlerportal und Buchhaltung.
// Alle Geldbeträge werden in Cent (ganze Zahlen) gespeichert.
import type { Config, Context } from "@netlify/functions";
import {
  abmeldeCookie, adminKonten, hashPasswort, kurzHash, leseSitzung, neueId,
  pruefePasswort, sitzungsCookie, type Sitzung,
} from "./sicherheit.mts";
import { lese, leseAlle, schreibe } from "./daten.mts";

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
interface Position { produktId: string; name: string; ve: number; anzahlVE: number; stueck: number; preis: number; mwst: number; netto: number }
interface Bestellung {
  id: string; haendlerId: string; firma: string; positionen: Position[];
  netto: number; mwst: number; brutto: number; notiz: string; status: BStatus;
  erstellt: string; verlauf: { status: BStatus; von: string; am: string }[]; gebucht?: boolean;
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
    id: neueId("ZB-"), haendlerId: h.id, firma: h.firma, positionen, netto, mwst, brutto: netto + mwst,
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
async function bestellungBuchen(req: Request, s: Sitzung) {
  const b = await body(req);
  const id = text(b.id, 40);
  const best = await lese<Bestellung>(`bestellungen/${id}`);
  if (!best) throw new Fehler(404, "Bestellung nicht gefunden.");
  if (best.gebucht) throw new Fehler(409, "Diese Bestellung ist schon gebucht.");
  if (best.status === "storniert") throw new Fehler(400, "Stornierte Bestellungen können nicht gebucht werden.");
  const tag = jetzt().slice(0, 10);
  for (const p of best.positionen) {
    // Betrag = exakte Zeilensumme der Rechnung (netto + MwSt), kein gerundeter Stückpreis × Menge
    const betrag = p.netto + Math.round((p.netto * p.mwst) / 100);
    await neueBuchung({
      typ: "verkauf", datum: tag, produktId: p.produktId, name: p.name, menge: p.stueck,
      einzelpreis: Math.round(betrag / p.stueck), betrag, mwst: p.mwst, zahlungsart: text(b.zahlungsart, 40) || "Rechnung",
      beleg: best.id, notiz: `Händler: ${best.firma}`,
    }, s.id);
  }
  best.gebucht = true;
  best.verlauf.push({ status: best.status, von: s.id + " (gebucht)", am: jetzt() });
  await schreibe(`bestellungen/${id}`, best);
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

/* =================== Router =================== */
export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const pfad = url.pathname.replace(/^\/api/, "").replace(/\/+$/, "") || "/";
  const m = req.method;
  const ip = context.ip || req.headers.get("x-nf-client-connection-ip") || "unbekannt";

  try {
    // Schutz vor fremden Formularen: schreibende Anfragen brauchen unseren Header
    if (m !== "GET" && req.headers.get("x-zb") !== "1") throw new Fehler(403, "Anfrage abgelehnt.");
    const s = leseSitzung(req);

    if (m === "POST" && pfad === "/login") return await login(req, ip);
    if (m === "POST" && pfad === "/logout") return json({ ok: true }, 200, { "Set-Cookie": abmeldeCookie() });
    if (m === "GET" && pfad === "/ich") return await ich(s);
    if (m === "POST" && pfad === "/haendler/registrieren") return await registrieren(req, ip);

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
      if (m === "GET" && pfad === "/admin/preise") return json({ preise: await preisliste() });
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
