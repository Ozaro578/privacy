import "server-only";
import { NextResponse, type NextRequest } from "next/server";

/** Cron-Routen sind nur mit CRON_SECRET (Vercel Cron setzt Authorization: Bearer) oder x-cron-secret aufrufbar. */
export function authorizeCron(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET nicht konfiguriert" }, { status: 503 });
  const auth = request.headers.get("authorization") ?? "";
  const header = request.headers.get("x-cron-secret") ?? "";
  if (auth === `Bearer ${secret}` || header === secret) return null;
  return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
}
