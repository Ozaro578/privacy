// HTML-Mails im ZUKKABRO-Look (bunt wie die Website). Tabellen-Layout und Inline-Styles, damit es in
// Gmail, Outlook, Apple Mail und GMX sauber aussieht. Jede Mail hat zusätzlich eine Textfassung.
const SEITE = "https://zukkabro.de";
const F = { pink: "#ff2e98", pinkDeep: "#c0005a", gold: "#e6ab35", goldSoft: "#fff0c2", cream: "#fbf1e6", paper: "#fffaf3", choco: "#2b140a", green: "#5fc46a" };
const SCHRIFT = "'Fredoka','Segoe UI',Arial,Helvetica,sans-serif";

export function esc(s: unknown): string {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
export function euro(cent: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format((cent || 0) / 100);
}
function absaetze(text: string): string {
  return esc(text).replace(/\n/g, "<br>");
}

/** Rahmen: Kopf mit Logo, farbiger Titelbalken, Inhalt, Fuß mit Adresse und Social-Links */
export function rahmen(titel: string, untertitel: string, inhalt: string, farbe = F.pink): string {
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(titel)}</title></head>
<body style="margin:0;padding:0;background:${F.cream};">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${F.cream};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">
  <tr><td align="center" style="padding:8px 0 18px;"><a href="${SEITE}" style="text-decoration:none;"><img src="${SEITE}/assets/img/logo.png" width="220" alt="ZUKKABRO" style="display:block;width:220px;max-width:70%;height:auto;border:0;"></a></td></tr>
  <tr><td style="background:${farbe};border:4px solid ${F.choco};border-radius:22px 22px 0 0;padding:22px 26px;">
    <div style="font-family:${SCHRIFT};font-size:26px;line-height:1.15;font-weight:800;color:#ffffff;">${esc(titel)}</div>
    ${untertitel ? `<div style="font-family:${SCHRIFT};font-size:15px;line-height:1.4;color:#ffffff;opacity:.92;padding-top:6px;">${esc(untertitel)}</div>` : ""}
  </td></tr>
  <tr><td style="background:${F.paper};border:4px solid ${F.choco};border-top:0;border-radius:0 0 22px 22px;padding:24px 26px;font-family:${SCHRIFT};font-size:15px;line-height:1.55;color:${F.choco};">
    ${inhalt}
  </td></tr>
  <tr><td style="padding:22px 10px 0;font-family:${SCHRIFT};font-size:12px;line-height:1.6;color:#6b4b3a;text-align:center;">
    <strong style="color:${F.choco};">ZUKKABRO</strong> · Klingenberger Straße 100 · 74080 Heilbronn<br>
    <a href="tel:+4971315912230" style="color:${F.pinkDeep};text-decoration:none;">07131 5912230</a> · <a href="mailto:info@zukkabro.de" style="color:${F.pinkDeep};text-decoration:none;">info@zukkabro.de</a> · <a href="${SEITE}" style="color:${F.pinkDeep};text-decoration:none;">zukkabro.de</a><br>
    <a href="https://www.instagram.com/zukkabro.de/" style="color:${F.pinkDeep};text-decoration:none;">Instagram</a> · <a href="https://www.tiktok.com/@zukkabro.de" style="color:${F.pinkDeep};text-decoration:none;">TikTok</a> · <a href="https://www.facebook.com/profile.php?id=61594963992185" style="color:${F.pinkDeep};text-decoration:none;">Facebook</a><br>
    <a href="${SEITE}/rechtliches.html" style="color:#6b4b3a;">Impressum &amp; Datenschutz</a>
  </td></tr>
</table></td></tr></table></body></html>`;
}

export function knopf(text: string, url: string, farbe = F.pink): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:16px 0;"><tr><td style="background:${farbe};border:3px solid ${F.choco};border-radius:999px;"><a href="${url}" style="display:inline-block;padding:11px 22px;font-family:${SCHRIFT};font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;">${esc(text)}</a></td></tr></table>`;
}
export function kasten(inhalt: string, hintergrund = F.goldSoft): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:14px 0;"><tr><td style="background:${hintergrund};border:2px solid ${F.choco};border-radius:14px;padding:12px 16px;font-family:${SCHRIFT};font-size:14px;line-height:1.5;color:${F.choco};">${inhalt}</td></tr></table>`;
}

export interface MailPosition { stueck: number; name: string; brutto: number }
export interface MailBestellung { id: string; positionen: MailPosition[]; brutto: number; versand?: number; lieferart?: string; zahlart?: string; ab18?: boolean; kunde: { vorname: string; nachname: string; email: string; telefon?: string; strasse: string; plz: string; ort: string } }

/** Positionstabelle mit Summen */
export function positionenTabelle(b: MailBestellung): string {
  const zeilen = b.positionen.map((p, i) => `<tr><td style="padding:9px 6px;border-top:1px solid #e9dccd;font-family:${SCHRIFT};font-size:14px;color:${F.choco};${i === 0 ? "border-top:0;" : ""}"><strong>${p.stueck} ×</strong> ${esc(p.name)}</td><td align="right" style="padding:9px 6px;border-top:1px solid #e9dccd;font-family:${SCHRIFT};font-size:14px;color:${F.choco};white-space:nowrap;${i === 0 ? "border-top:0;" : ""}">${euro(p.brutto)}</td></tr>`).join("");
  const versandZeile = b.versand ? `<tr><td style="padding:9px 6px;border-top:2px solid ${F.choco};font-family:${SCHRIFT};font-size:14px;color:${F.choco};">${b.lieferart === "kurier" ? "Lieferung Heilbronn" : "Versand"}</td><td align="right" style="padding:9px 6px;border-top:2px solid ${F.choco};font-family:${SCHRIFT};font-size:14px;color:${F.choco};">${euro(b.versand)}</td></tr>` : "";
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:10px 0;background:#ffffff;border:2px solid ${F.choco};border-radius:14px;">
  <tr><td style="padding:6px 10px 0;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${zeilen}${versandZeile}
  <tr><td style="padding:12px 6px;border-top:${b.versand ? "1px solid #e9dccd" : "2px solid " + F.choco};font-family:${SCHRIFT};font-size:17px;font-weight:800;color:${F.choco};">Gesamt</td><td align="right" style="padding:12px 6px;border-top:${b.versand ? "1px solid #e9dccd" : "2px solid " + F.choco};font-family:${SCHRIFT};font-size:20px;font-weight:800;color:${F.pink};white-space:nowrap;">${euro(b.brutto)}</td></tr>
  </table><div style="padding:0 6px 8px;font-family:${SCHRIFT};font-size:12px;color:#6b4b3a;">inkl. MwSt.</div></td></tr></table>`;
}

function lieferBlock(b: MailBestellung, abholort: string): string {
  const k = b.kunde;
  if (b.lieferart === "abholung") return `<strong>📍 Abholung</strong><br>${esc(abholort || "ZUKKABRO, Klingenberger Straße 100, 74080 Heilbronn")}<br>Wir sagen dir per E-Mail Bescheid, sobald deine Bestellung abholbereit ist.`;
  return `<strong>${b.lieferart === "kurier" ? "🛵 Lieferung per Kurier in Heilbronn" : "🚚 Versand an"}</strong><br>${esc(k.vorname)} ${esc(k.nachname)}<br>${esc(k.strasse)}<br>${esc(k.plz)} ${esc(k.ort)}`;
}

/** Auftragsbestätigung an den Kunden */
export function auftragsbestaetigung(b: MailBestellung, info: Record<string, unknown>, hinweis: string): string {
  const art = String(info.art || "");
  let zahlung: string;
  if (art === "ueberweisung") zahlung = `<strong>💳 Überweisung (Vorkasse)</strong><br>Bitte überweise <strong>${euro(b.brutto)}</strong> an:<br>${esc(info.inhaber || "ZUKKABRO")}<br>IBAN: <strong>${esc(info.iban || "(folgt per E-Mail)")}</strong>${info.bank ? "<br>Bank: " + esc(info.bank) : ""}<br>Verwendungszweck: <strong>${esc(b.id)}</strong><br><span style="font-size:13px;color:#6b4b3a;">Sobald das Geld da ist, geht deine Bestellung raus.</span>`;
  else if (art === "paypal") zahlung = `<strong>💙 PayPal</strong><br>Bitte zahle <strong>${euro(b.brutto)}</strong> an <strong>${esc(info.ziel)}</strong><br>Verwendungszweck: <strong>${esc(b.id)}</strong>`;
  else if (art === "stripe") zahlung = `<strong>✅ Online bezahlt</strong><br>Deine Zahlung läuft über Stripe, die Zahlungsbestätigung bekommst du separat.`;
  else zahlung = `<strong>💵 Bar bei Abholung</strong><br>Du zahlst <strong>${euro(b.brutto)}</strong> bei der Abholung${info.abholort ? " (" + esc(info.abholort) + ")" : ""}.`;
  const inhalt = `
    <p style="margin:0 0 6px;font-size:17px;">Hey ${esc(b.kunde.vorname)}, 👋</p>
    <p style="margin:0 0 14px;">danke für deine Bestellung bei ZUKKABRO! Hier ist deine Auftragsbestätigung. Deine Bestellnummer: <strong style="color:${F.pinkDeep};">${esc(b.id)}</strong></p>
    ${positionenTabelle(b)}
    ${kasten(lieferBlock(b, String(info.abholort || "")))}
    ${kasten(zahlung, "#ffffff")}
    ${b.ab18 ? kasten("🔞 <strong>Artikel ab 18 dabei.</strong> Bitte halte bei der Übergabe deinen Ausweis bereit.", "#ffe3ef") : ""}
    ${hinweis ? `<p style="margin:14px 0 0;">${absaetze(hinweis)}</p>` : ""}
    ${knopf("Weiter stöbern auf zukkabro.de", `${SEITE}/sortiment.html`)}
    <p style="margin:12px 0 0;">Fragen? Antworte einfach auf diese Mail oder ruf an: <a href="tel:+4971315912230" style="color:${F.pinkDeep};font-weight:700;text-decoration:none;">07131 5912230</a>.</p>
    <p style="margin:14px 0 0;font-weight:800;">Bis bald,<br>dein ZUKKABRO-Team 👑</p>`;
  return rahmen("Deine Bestellung ist da! 🎉", `Auftragsbestätigung ${b.id}`, inhalt, F.pink);
}

const DIENSTE: Record<string, { name: string; link: (nr: string) => string }> = {
  dhl: { name: "DHL", link: (n) => "https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=" + encodeURIComponent(n) },
  hermes: { name: "Hermes", link: (n) => "https://www.myhermes.de/empfangen/sendungsverfolgung/sendungsinformation/#" + encodeURIComponent(n) },
  dpd: { name: "DPD", link: (n) => "https://tracking.dpd.de/parcelstatus?query=" + encodeURIComponent(n) },
  gls: { name: "GLS", link: (n) => "https://gls-group.eu/DE/de/paketverfolgung?match=" + encodeURIComponent(n) },
  ups: { name: "UPS", link: (n) => "https://www.ups.com/track?loc=de_DE&tracknum=" + encodeURIComponent(n) },
  post: { name: "Deutsche Post", link: (n) => "https://www.deutschepost.de/de/s/sendungsverfolgung.html?piececode=" + encodeURIComponent(n) },
};
export function versanddienst(id: string) { return DIENSTE[id] || null; }

/** Versandbestätigung: Ware ist raus */
export function versandbestaetigung(b: MailBestellung, dienst: string, nummer: string): { html: string; text: string; betreff: string } {
  const d = DIENSTE[dienst];
  const kurier = b.lieferart === "kurier";
  const trackHtml = nummer ? `<strong>${esc(d ? d.name : dienst || "Paketdienst")}</strong> · Sendungsnummer <strong>${esc(nummer)}</strong>${d ? knopf("📦 Sendung verfolgen", d.link(nummer), F.gold) : ""}` : (kurier ? "Unser Kurier ist unterwegs zu dir in Heilbronn." : `Dein Paket ist unterwegs${d ? " mit " + esc(d.name) : ""}.`);
  const inhalt = `
    <p style="margin:0 0 6px;font-size:17px;">Hey ${esc(b.kunde.vorname)}, 🚀</p>
    <p style="margin:0 0 14px;">deine Bestellung <strong style="color:${F.pinkDeep};">${esc(b.id)}</strong> hat unser Lager verlassen und ist auf dem Weg zu dir!</p>
    ${kasten(trackHtml)}
    ${kasten(lieferBlock(b, ""), "#ffffff")}
    ${positionenTabelle(b)}
    ${b.ab18 ? kasten("🔞 <strong>Artikel ab 18 dabei.</strong> Bitte halte bei der Übergabe deinen Ausweis bereit.", "#ffe3ef") : ""}
    <p style="margin:12px 0 0;">Wir wünschen dir viel Spaß beim Snacken! Wenn etwas nicht passt, antworte einfach auf diese Mail.</p>
    <p style="margin:14px 0 0;font-weight:800;">Dein ZUKKABRO-Team 👑</p>`;
  const text = `Hey ${b.kunde.vorname},\n\ndeine Bestellung ${b.id} ist unterwegs!\n${nummer ? `${d ? d.name : dienst}: Sendungsnummer ${nummer}${d ? "\nVerfolgen: " + d.link(nummer) : ""}\n` : ""}\n${b.positionen.map((p) => `${p.stueck} × ${p.name}`).join("\n")}\n\nViel Spaß beim Snacken!\ndein ZUKKABRO-Team\n${SEITE}`;
  return { html: rahmen(kurier ? "Dein Kurier ist unterwegs! 🛵" : "Deine Ware ist raus! 📦", `Versandbestätigung ${b.id}`, inhalt, F.green), text, betreff: `${kurier ? "Dein Kurier ist unterwegs" : "Deine Bestellung ist unterwegs"}: ${b.id}` };
}

/** Abholbereit: Bestellung liegt im Laden */
export function abholbereit(b: MailBestellung, abholort: string): { html: string; text: string; betreff: string } {
  const inhalt = `
    <p style="margin:0 0 6px;font-size:17px;">Hey ${esc(b.kunde.vorname)}, 🛍️</p>
    <p style="margin:0 0 14px;">deine Bestellung <strong style="color:${F.pinkDeep};">${esc(b.id)}</strong> liegt für dich bereit!</p>
    ${kasten(`<strong>📍 Abholen bei</strong><br>${esc(abholort || "ZUKKABRO, Klingenberger Straße 100, 74080 Heilbronn")}<br>Einfach Bestellnummer nennen oder diese Mail zeigen.`)}
    ${positionenTabelle(b)}
    ${b.ab18 ? kasten("🔞 <strong>Artikel ab 18 dabei.</strong> Bitte Ausweis mitbringen.", "#ffe3ef") : ""}
    <p style="margin:14px 0 0;font-weight:800;">Bis gleich,<br>dein ZUKKABRO-Team 👑</p>`;
  const text = `Hey ${b.kunde.vorname},\n\ndeine Bestellung ${b.id} liegt zur Abholung bereit: ${abholort || "ZUKKABRO, Klingenberger Straße 100, 74080 Heilbronn"}.\nBestellnummer nennen oder diese Mail zeigen.\n\ndein ZUKKABRO-Team\n${SEITE}`;
  return { html: rahmen("Abholbereit! 🛍️", `Bestellung ${b.id}`, inhalt, F.gold), text, betreff: `Abholbereit: Bestellung ${b.id}` };
}
