import type { Config, Context } from "@netlify/functions";
import { JOB_ID, takeJob } from "../lib/jobs.js";

/** GET /api/result/:job – liefert das Ergebnis einmalig und löscht es danach. */
export default async (_req: Request, context: Context) => {
  const id = context.params["job"] ?? "";
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  if (!JOB_ID.test(id)) return new Response(JSON.stringify({ status: "error", error: { code: "no_image", message: "Ungültige Auftragsnummer." } }), { status: 400, headers });
  const record = await takeJob(id);
  if (!record) return new Response(JSON.stringify({ status: "processing" }), { status: 202, headers });
  return new Response(JSON.stringify(record), { status: 200, headers });
};

export const config: Config = { path: "/api/result/:job", method: "GET" };
