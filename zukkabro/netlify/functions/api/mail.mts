// E-Mail-Versand auf Netlify. Zwei Wege, der erste passende gewinnt:
//  1. SMTP über das eigene Strato-Postfach (SMTP_PASSWORT gesetzt): Login info@zukkabro.de bei smtp.strato.de:465.
//     Strato signiert die Mails selbst (DKIM), es sind keine DNS-Änderungen nötig.
//  2. Brevo (BREVO_API_KEY gesetzt): Absender muss bei Brevo bestätigt sein.
// Ohne beides wird nichts gesendet, der Shop läuft trotzdem (Bestellungen stehen immer im Admin).
// Absender und Empfänger kommen aus Admin → Shop-Einstellungen (mailVon, mailAn).
import { connect as tlsConnect, type TLSSocket } from "node:tls";
import { connect as netConnect, type Socket } from "node:net";

export function mailAktiv(): boolean {
  return !!(process.env.SMTP_PASSWORT || process.env.BREVO_API_KEY);
}

function emailOk(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/** Eine Text-Mail senden. Wirft nie, damit eine Mail-Störung keine Bestellung kaputt macht. */
export async function mailSenden(an: string, betreff: string, text: string, von: string, antwortAn = ""): Promise<boolean> {
  if (!emailOk(an) || !emailOk(von)) return false;
  const antwort = emailOk(antwortAn) ? antwortAn : von;
  try {
    if (process.env.SMTP_PASSWORT) return await perSmtp(an, betreff, text, von, antwort);
    if (process.env.BREVO_API_KEY) return await perBrevo(an, betreff, text, von, antwort);
    return false;
  } catch (err) {
    console.error("ZUKKABRO Mail-Fehler:", (err as Error).message);
    return false;
  }
}

async function perBrevo(an: string, betreff: string, text: string, von: string, antwort: string): Promise<boolean> {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": process.env.BREVO_API_KEY!, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: "ZUKKABRO", email: von },
      to: [{ email: an }],
      replyTo: { email: antwort },
      subject: betreff,
      textContent: text,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) console.error("ZUKKABRO Mail an", an, "nicht gesendet:", res.status, (await res.text()).slice(0, 300));
  return res.ok;
}

/* =================== Kleiner SMTP-Client (AUTH PLAIN/LOGIN, implizites TLS auf 465) =================== */

function b64(s: string): string { return Buffer.from(s, "utf8").toString("base64"); }
function kopfWort(s: string): string { return /^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`; }
function adresseOk(s: string): boolean { return emailOk(s) && !/[\r\n<>]/.test(s); }

/** Nachricht als RFC-5322-Text bauen (Body base64, damit Umlaute und lange Zeilen sicher ankommen) */
export function smtpNachricht(an: string, betreff: string, text: string, von: string, antwort: string): string {
  const body = b64(text.replace(/\r?\n/g, "\r\n")).replace(/(.{76})/g, "$1\r\n");
  const id = `${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 10)}@${von.split("@")[1]}`;
  return [
    `From: ${kopfWort("ZUKKABRO")} <${von}>`,
    `To: <${an}>`,
    `Reply-To: <${antwort}>`,
    `Subject: ${kopfWort(betreff)}`,
    `Date: ${new Date().toUTCString().replace("GMT", "+0000")}`,
    `Message-ID: <${id}>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    body,
  ].join("\r\n");
}

async function perSmtp(an: string, betreff: string, text: string, von: string, antwort: string): Promise<boolean> {
  const host = process.env.SMTP_HOST || "smtp.strato.de";
  const port = Number(process.env.SMTP_PORT || 465);
  const benutzer = process.env.SMTP_BENUTZER || von;
  const passwort = process.env.SMTP_PASSWORT!;
  if (!adresseOk(an) || !adresseOk(von)) return false;
  const fehler = await smtpSenden({ host, port, tls: port === 465 && !process.env.SMTP_OHNE_TLS, benutzer, passwort, von, an, daten: smtpNachricht(an, betreff, text, von, antwort) });
  if (fehler) console.error("ZUKKABRO Mail an", an, "nicht gesendet:", fehler);
  return !fehler;
}

interface SmtpAuftrag { host: string; port: number; tls: boolean; benutzer: string; passwort: string; von: string; an: string; daten: string; }

/** Liefert "" bei Erfolg, sonst die Fehlermeldung. */
export function smtpSenden(a: SmtpAuftrag): Promise<string> {
  return new Promise((resolve) => {
    let puffer = "";
    let fertig = false;
    const warteschlange: Array<(antwort: string) => void> = [];
    const ende = (fehler: string) => { if (fertig) return; fertig = true; clearTimeout(uhr); try { sock.destroy(); } catch { /* egal */ } resolve(fehler); };
    const uhr = setTimeout(() => ende("SMTP-Zeitüberschreitung"), 15000);
    const sock: Socket | TLSSocket = a.tls
      ? tlsConnect({ host: a.host, port: a.port, servername: a.host })
      : netConnect({ host: a.host, port: a.port });
    sock.setEncoding("utf8");
    sock.on("error", (e) => ende("SMTP-Verbindung: " + e.message));
    sock.on("close", () => ende("SMTP-Verbindung geschlossen"));
    sock.on("data", (teil: string) => {
      puffer += teil;
      // Antworten sind komplett, wenn die letzte Zeile "NNN " (Leerzeichen nach dem Code) hat
      let m: RegExpMatchArray | null;
      while ((m = puffer.match(/^(?:\d{3}-[^\r\n]*\r\n)*\d{3} [^\r\n]*\r\n/))) {
        puffer = puffer.slice(m[0].length);
        const naechster = warteschlange.shift();
        if (naechster) naechster(m[0]);
      }
    });
    const frage = (befehl: string | null): Promise<string> => new Promise((ok) => {
      warteschlange.push(ok);
      if (befehl !== null) sock.write(befehl + "\r\n");
    });
    const erwarte = (antwort: string, codes: string[], schritt: string) => {
      if (!codes.includes(antwort.slice(0, 3))) throw new Error(`${schritt}: ${antwort.trim().slice(0, 200)}`);
    };
    (async () => {
      try {
        erwarte(await frage(null), ["220"], "Begrüßung");
        const ehlo = await frage("EHLO zukkabro.de");
        erwarte(ehlo, ["250"], "EHLO");
        if (/AUTH[ =][^\r\n]*PLAIN/i.test(ehlo)) {
          erwarte(await frage("AUTH PLAIN " + b64(`\0${a.benutzer}\0${a.passwort}`)), ["235"], "Anmeldung");
        } else {
          erwarte(await frage("AUTH LOGIN"), ["334"], "Anmeldung");
          erwarte(await frage(b64(a.benutzer)), ["334"], "Anmeldung");
          erwarte(await frage(b64(a.passwort)), ["235"], "Anmeldung");
        }
        erwarte(await frage(`MAIL FROM:<${a.von}>`), ["250"], "Absender");
        erwarte(await frage(`RCPT TO:<${a.an}>`), ["250", "251"], "Empfänger");
        erwarte(await frage("DATA"), ["354"], "DATA");
        const inhalt = a.daten.replace(/\r\n\./g, "\r\n..");
        erwarte(await frage(inhalt + "\r\n."), ["250"], "Übertragung");
        try { sock.write("QUIT\r\n"); } catch { /* egal */ }
        ende("");
      } catch (e) {
        ende((e as Error).message);
      }
    })();
  });
}
