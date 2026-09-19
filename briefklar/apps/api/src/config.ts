import { z } from "zod";

const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;
export type Effort = (typeof EFFORTS)[number];

const boolFromEnv = z
  .string()
  .optional()
  .transform((v) => v !== undefined && ["1", "true", "yes", "on"].includes(v.trim().toLowerCase()));

const EnvSchema = z.object({
  /** Wird vom SDK selbst gelesen; hier nur geprüft, damit die Fehlermeldung klar ist. */
  ANTHROPIC_API_KEY: z.string().trim().min(1).optional(),
  PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  ANTHROPIC_MODEL: z.string().trim().min(1).default("claude-opus-5"),
  ANTHROPIC_EFFORT: z.enum(EFFORTS).default("medium"),
  RATE_LIMIT_PER_15MIN: z.coerce.number().int().min(0).default(20),
  CORS_ORIGIN: z.string().trim().default(""),
  STATIC_DIR: z.string().trim().min(1).optional(),
  TRUST_PROXY: boolFromEnv,
});

export interface Config {
  anthropicApiKey: string | undefined;
  port: number;
  model: string;
  effort: Effort;
  rateLimitPer15Min: number;
  corsOrigin: string;
  staticDir: string | undefined;
  trustProxy: boolean;
}

/** Liest die Konfiguration aus Umgebungsvariablen (Standard: process.env). */
export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  // Leere Strings wie "" behandeln wie "nicht gesetzt"
  const cleaned: Record<string, string | undefined> = {};
  for (const key of Object.keys(EnvSchema.shape)) {
    const v = env[key];
    cleaned[key] = v === undefined || v.trim() === "" ? undefined : v;
  }
  const parsed = EnvSchema.safeParse(cleaned);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Ungültige Konfiguration: ${details}`);
  }
  const e = parsed.data;
  return {
    anthropicApiKey: e.ANTHROPIC_API_KEY,
    port: e.PORT,
    model: e.ANTHROPIC_MODEL,
    effort: e.ANTHROPIC_EFFORT,
    rateLimitPer15Min: e.RATE_LIMIT_PER_15MIN,
    corsOrigin: e.CORS_ORIGIN,
    staticDir: e.STATIC_DIR,
    trustProxy: e.TRUST_PROXY,
  };
}
