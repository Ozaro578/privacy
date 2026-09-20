import type { Instrumentation } from "next";

/**
 * Fehlerberichte des Servers (Server Components, Route Handler, Server Actions): strukturiert ins Log und
 * optional an einen Webhook (ERROR_REPORT_WEBHOOK_URL, z. B. Sentry-Store-Endpoint, Better Stack, eigener Sammler).
 * Keine Personendaten: Pfad, Methode, Router-Art, Fehlermeldung und Stack, keine Header oder Bodies.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const err = error instanceof Error ? error : new Error(String(error));
  const digest = (error as { digest?: string }).digest;
  const payload = {
    at: new Date().toISOString(),
    message: err.message,
    name: err.name,
    digest: digest ?? null,
    stack: err.stack?.split("\n").slice(0, 12).join("\n") ?? null,
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
    renderSource: context.renderSource ?? null,
    revalidateReason: context.revalidateReason ?? null,
    env: process.env["VERCEL_ENV"] ?? process.env["NODE_ENV"] ?? "unknown",
    release: process.env["VERCEL_GIT_COMMIT_SHA"]?.slice(0, 12) ?? null,
  };
  console.error(JSON.stringify({ level: "error", source: "next.onRequestError", ...payload }));
  const url = process.env["ERROR_REPORT_WEBHOOK_URL"];
  if (!url) return;
  try {
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...(process.env["ERROR_REPORT_WEBHOOK_TOKEN"] ? { Authorization: `Bearer ${process.env["ERROR_REPORT_WEBHOOK_TOKEN"]}` } : {}) }, body: JSON.stringify(payload), signal: AbortSignal.timeout(3000) });
  } catch { /* Fehlermeldung darf den Request nicht weiter stören */ }
};
