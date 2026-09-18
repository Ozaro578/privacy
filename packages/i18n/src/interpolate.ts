import { pluralCategory } from "./format";
import type { Locale, MessageParams } from "./types";

/**
 * Kleine ICU-ähnliche Interpolation:
 *  - {name} wird durch params.name ersetzt (Zahlen und Daten werden mit String() ausgegeben).
 *  - {count, plural, one {# Frage} other {# Fragen}} wählt über Intl.PluralRules die passende Form,
 *    # wird durch die Zahl ersetzt. Kategorien: zero, one, two, few, many, other; other ist Pflicht.
 * Unbekannte Platzhalter bleiben sichtbar stehen, damit fehlende Parameter in Tests auffallen.
 */
export function interpolate(locale: Locale, message: string, params: MessageParams = {}): string {
  let out = "";
  let i = 0;
  while (i < message.length) {
    const open = message.indexOf("{", i);
    if (open === -1) {
      out += message.slice(i);
      break;
    }
    out += message.slice(i, open);
    const close = findMatchingBrace(message, open);
    if (close === -1) {
      out += message.slice(open);
      break;
    }
    out += resolvePlaceholder(locale, message.slice(open + 1, close), params);
    i = close + 1;
  }
  return out;
}

function findMatchingBrace(text: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function resolvePlaceholder(locale: Locale, body: string, params: MessageParams): string {
  const commaIndex = body.indexOf(",");
  if (commaIndex === -1) {
    const name = body.trim();
    const value = params[name];
    return value === undefined ? `{${name}}` : String(value);
  }
  const name = body.slice(0, commaIndex).trim();
  const rest = body.slice(commaIndex + 1).trim();
  if (!rest.startsWith("plural")) {
    const value = params[name];
    return value === undefined ? `{${body}}` : String(value);
  }
  const raw = params[name];
  const count = typeof raw === "number" ? raw : Number(raw);
  if (Number.isNaN(count)) return `{${name}}`;
  const forms = parsePluralForms(rest.slice("plural".length));
  const exact = forms.get(`=${count}`);
  const chosen = exact ?? forms.get(pluralCategory(locale, count)) ?? forms.get("other") ?? "";
  return interpolate(locale, chosen.replace(/#/g, String(count)), params);
}

function parsePluralForms(source: string): Map<string, string> {
  const forms = new Map<string, string>();
  let i = 0;
  while (i < source.length) {
    const open = source.indexOf("{", i);
    if (open === -1) break;
    const category = source.slice(i, open).trim().replace(/^,/, "").trim();
    const close = findMatchingBrace(source, open);
    if (close === -1) break;
    forms.set(category, source.slice(open + 1, close));
    i = close + 1;
  }
  return forms;
}
