/**
 * Minimales strukturiertes Logging (JSON-Zeilen auf stdout/stderr).
 * Datenschutz: Hier dürfen NUR Metadaten landen – nie Bilddaten, nie Briefinhalt.
 */
type Level = "info" | "warn" | "error";

function write(level: Level, event: string, fields: Record<string, unknown>): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...fields });
  if (level === "error") process.stderr.write(line + "\n");
  else process.stdout.write(line + "\n");
}

export const log = {
  info: (event: string, fields: Record<string, unknown> = {}) => write("info", event, fields),
  warn: (event: string, fields: Record<string, unknown> = {}) => write("warn", event, fields),
  error: (event: string, fields: Record<string, unknown> = {}) => write("error", event, fields),
};

/** Fehler auf loggbare Metadaten reduzieren (kein Stack mit Nutzdaten, keine Request-Bodies). */
export function errorMeta(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    const meta: Record<string, unknown> = { errorName: err.name, errorMessage: err.message };
    const status = (err as { status?: unknown }).status;
    if (typeof status === "number") meta.status = status;
    return meta;
  }
  return { errorMessage: String(err) };
}
