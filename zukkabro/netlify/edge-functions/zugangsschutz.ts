import type { Config, Context } from "@netlify/edge-functions";

// Zugangsschutz für die gesamte Seite (HTTP Basic Auth).
// Das Passwort steht NICHT im Code, sondern in der Netlify-Umgebungsvariable SITE_PASSWORD.
// Benutzername: beliebig (z. B. "zukkabro"). Zum Abschalten die Variable löschen
// oder diese Datei entfernen.

const REALM = "ZUKKABRO - nur fuer das Team"; // nur ASCII-Zeichen erlaubt (HTTP-Header)

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-Robots-Tag": "noindex, nofollow",
};

function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  }
  return diff === 0;
}

function withHeaders(res: Response): Response {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v);
  return out;
}

export default async (req: Request, context: Context) => {
  const password = Netlify.env.get("SITE_PASSWORD");

  // Sicher scheitern: ohne gesetztes Passwort bleibt die Seite gesperrt.
  if (!password) {
    return withHeaders(new Response("Seite vorübergehend gesperrt.", { status: 503 }));
  }

  const auth = req.headers.get("authorization") ?? "";
  if (auth.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const given = decoded.slice(decoded.indexOf(":") + 1);
      if (safeEqual(given, password)) {
        return withHeaders(await context.next());
      }
    } catch {
      // ungültiger Header -> unten 401
    }
  }

  return withHeaders(
    new Response("Zugang nur für das ZUKKABRO-Team.", {
      status: 401,
      headers: {
        "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }),
  );
};

export const config: Config = {
  path: "/*",
};
