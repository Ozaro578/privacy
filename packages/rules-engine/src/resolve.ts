import { type AcquisitionKind, type RuleType, type RuleVersionRow, parsePayload, payloadSchemaFor } from "./schemas";
import type { z } from "zod";

export interface LicenseInfo {
  code: string;
  base_class: string | null;
}

/** Klassenvarianten (B197, B78, B96) erben Prüfungs- und Unterrichtsregeln der Basisklasse, wenn keine eigene Regel existiert. */
export function candidateLicenseCodes(code: string, licenses: LicenseInfo[]): string[] {
  const chain: string[] = [];
  let current: string | null = code;
  let guard = 0;
  while (current && guard++ < 5) {
    chain.push(current);
    const info = licenses.find((l) => l.code === current);
    current = info?.base_class ?? null;
  }
  return chain;
}

export interface ResolvedRule<T extends RuleType> {
  version: RuleVersionRow;
  rules: z.infer<(typeof payloadSchemaFor)[T]>;
  /** true, wenn die Werte noch nicht fachlich freigegeben sind und in der Oberfläche gekennzeichnet werden müssen */
  needsVerification: boolean;
}

export interface ResolveOptions {
  ruleType: RuleType;
  licenseCode: string;
  acquisition: Exclude<AcquisitionKind, "any">;
  on?: Date;
  licenses?: LicenseInfo[];
  /** Standard false: nur veröffentlichte Versionen. true: unverifizierte Versionen als Fallback erlauben. */
  allowUnverified?: boolean;
}

function isValidOn(v: RuleVersionRow, on: Date): boolean {
  const day = on.toISOString().slice(0, 10);
  return v.valid_from <= day && (v.valid_until === null || v.valid_until >= day);
}

/**
 * Wählt die passende Regelversion deterministisch: exakte Klasse vor Basisklasse, passende Erwerbsart vor "any",
 * veröffentlicht vor unverifiziert, höchste Version zuerst. Spiegelt app.rule_version_for in der Datenbank.
 */
export function resolveRule<T extends RuleType>(versions: RuleVersionRow[], opts: ResolveOptions & { ruleType: T }): ResolvedRule<T> | null {
  const on = opts.on ?? new Date();
  const codes = candidateLicenseCodes(opts.licenseCode, opts.licenses ?? []);
  const allowed = opts.allowUnverified ? ["published", "needs_verification"] : ["published"];
  const candidates = versions.filter(
    (v) => v.rule_type === opts.ruleType && v.license_code !== null && codes.includes(v.license_code)
      && (v.acquisition_kind === opts.acquisition || v.acquisition_kind === "any") && allowed.includes(v.review_status) && isValidOn(v, on),
  );
  candidates.sort((a, b) => {
    const ca = codes.indexOf(a.license_code!), cb = codes.indexOf(b.license_code!);
    if (ca !== cb) return ca - cb;
    const pa = a.review_status === "published" ? 0 : 1, pb = b.review_status === "published" ? 0 : 1;
    if (pa !== pb) return pa - pb;
    const aa = a.acquisition_kind === opts.acquisition ? 0 : 1, ab = b.acquisition_kind === opts.acquisition ? 0 : 1;
    if (aa !== ab) return aa - ab;
    return b.version - a.version;
  });
  const best = candidates[0];
  if (!best) return null;
  return { version: best, rules: parsePayload(opts.ruleType, best.payload), needsVerification: best.review_status !== "published" };
}
