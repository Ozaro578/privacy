// E-Mail-Versand auf Netlify über Brevo (früher Sendinblue), API-Schlüssel in der Umgebungsvariable BREVO_API_KEY.
// Ohne Schlüssel wird nichts gesendet, der Shop läuft trotzdem (Bestellungen stehen immer im Admin).
// Absender und Empfänger kommen aus Admin → Shop-Einstellungen (mailVon, mailAn); der Absender muss bei Brevo bestätigt sein.

export function mailAktiv(): boolean {
  return !!process.env.BREVO_API_KEY;
}

function emailOk(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/** Eine Text-Mail senden. Wirft nie, damit eine Mail-Störung keine Bestellung kaputt macht. */
export async function mailSenden(an: string, betreff: string, text: string, von: string, antwortAn = ""): Promise<boolean> {
  const key = process.env.BREVO_API_KEY;
  if (!key || !emailOk(an) || !emailOk(von)) return false;
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { name: "ZUKKABRO", email: von },
        to: [{ email: an }],
        replyTo: { email: emailOk(antwortAn) ? antwortAn : von },
        subject: betreff,
        textContent: text,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("ZUKKABRO Mail an", an, "nicht gesendet:", res.status, (await res.text()).slice(0, 300));
    return res.ok;
  } catch (err) {
    console.error("ZUKKABRO Mail-Fehler:", (err as Error).message);
    return false;
  }
}
