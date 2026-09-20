import type { Config } from "@netlify/functions";

export default async () =>
  new Response(JSON.stringify({ ok: true, model: Netlify.env.get("ANTHROPIC_MODEL") ?? "claude-opus-5", runtime: "netlify" }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export const config: Config = { path: "/api/health" };
