import type { Locale } from "./types";

/** Transparenter Hinweis, wenn keine geprüfte Quelle vorliegt (Pflichttext bei confidence = uncertain). */
export const UNCERTAIN_NOTICE: Record<Locale, string> = {
  de: "Dazu liegt keine geprüfte Quelle vor. Bitte mit deinem Fahrlehrer klären.",
  en: "There is no verified source for this. Please check with your driving instructor.",
  tr: "Bunun için doğrulanmış bir kaynak yok. Lütfen sürücü eğitmeninle netleştir.",
  ar: "لا يوجد مصدر موثّق لهذا الموضوع. يرجى توضيح ذلك مع مدرّب القيادة.",
};

/** Fester Hinweis für den Foto-Trainer. */
export const PHOTO_SAFETY_NOTICE = "Lernhilfe. Nicht während der Fahrt verwenden.";

export function uncertainNotice(locale: Locale): string {
  return UNCERTAIN_NOTICE[locale] ?? UNCERTAIN_NOTICE.de;
}

/**
 * Kapselt Nutzereingaben und Wissensquellen als abgegrenzten Datenblock.
 * Schließende Tags im Inhalt werden entschärft, damit der Block nicht vorzeitig beendet werden kann.
 */
export function dataBlock(name: string, content: string, attrs: Record<string, string> = {}): string {
  const safeName = name.replace(/[^a-z0-9_]/gi, "_");
  const attrText = Object.entries(attrs)
    .map(([k, v]) => ` ${k.replace(/[^a-z0-9_]/gi, "_")}="${v.replace(/["<>]/g, "_")}"`)
    .join("");
  const safeContent = content.replace(/<\/?\s*(data|system|instruction)\b[^>]*>/gi, (m) => m.replace("<", "&lt;"));
  return `<data name="${safeName}"${attrText}>\n${safeContent}\n</data>`;
}

const UNIT_PATTERN = /(?<![a-z0-9§])\d+(?:[.,]\d+)?\s*(?:km\/h|kmh|m\/s|km|cm|mm|m|‰|%|promille|prozent|meter|sekunden|sek|s|minuten|min|stunden|tonnen|t|kg|bar|jahre|monate|euro|€|punkte?)(?![a-z0-9])/gi;
const TEMPO_PATTERN = /\btempo\s*\d+\b/gi;
const PARAGRAPH_PATTERN = /§+\s*\d+[a-z]?(?:\s*(?:abs\.?|absatz)\s*\d+)?(?:\s*(?:stvo|stvzo|fev|fzv|bkatv|stgb|pflvg))?/gi;
const LAW_PATTERN = /\b(?:stvo|stvzo|fev|fzv|bkatv|stgb|pflvg|paragraph\s*\d+|artikel\s*\d+|art\.\s*\d+)\b/gi;

export function normalizeFact(f: string): string {
  return f.toLowerCase().replace(/\s+/g, "").replace(/,/g, ".").replace(/§+/g, "§");
}

/** Findet konkrete Zahlenwerte mit Einheit und Gesetzesangaben (§, Gesetzeskürzel) im Text. */
export function findConcreteFacts(text: string): string[] {
  const found: string[] = [];
  for (const re of [UNIT_PATTERN, TEMPO_PATTERN, PARAGRAPH_PATTERN, LAW_PATTERN]) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) found.push(m[0].trim());
  }
  return [...new Set(found)];
}

export function findLegalReferences(text: string): string[] {
  const found: string[] = [];
  for (const re of [PARAGRAPH_PATTERN, LAW_PATTERN]) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) found.push(m[0].trim());
  }
  return [...new Set(found)];
}

export function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?؟])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
}

/** Entfernt alle Sätze mit konkreten Zahlenwerten oder Gesetzesangaben (Umformulierung durch Auslassung). */
export function stripConcreteFacts(text: string): { text: string; removed: string[] } {
  const removed: string[] = [];
  const kept = splitSentences(text).filter((s) => {
    const facts = findConcreteFacts(s);
    if (facts.length) { removed.push(...facts); return false; }
    return true;
  });
  return { text: kept.join(" "), removed: [...new Set(removed)] };
}

/**
 * Fakten, die in `text` vorkommen, aber in keinem der erlaubten Texte belegt sind.
 * Damit wird geprüft, dass das Modell Quellen umformuliert, aber nicht ergänzt.
 */
export function unsupportedFacts(text: string, allowedTexts: string[]): string[] {
  const allowed = new Set(allowedTexts.flatMap((t) => findConcreteFacts(t)).map(normalizeFact));
  const allowedRaw = allowedTexts.map(normalizeFact).join("\n");
  return findConcreteFacts(text).filter((f) => {
    const n = normalizeFact(f);
    if (allowed.has(n)) return false;
    // Teilstrings zulassen (z. B. "§ 8" ist durch "§ 8 Abs. 1 StVO" gedeckt)
    if (allowedRaw.includes(n)) return false;
    // Paragrafenangaben: Nummer und Gesetzeskürzel dürfen getrennt belegt sein ("§ 3 StVO" durch "§ 3 Abs. 3 StVO").
    const para = n.match(/^§(\d+(?:[a-z](?![a-z]))?)(?:abs\.?\d+|absatz\d+)?([a-z]+)?$/);
    if (para) {
      // Nummer muss exakt vorkommen: "§3" darf weder durch "§30" noch durch "§3a" gedeckt sein.
      const numberOk = new RegExp(`§${para[1]}(?![0-9]|[a-z](?![a-z]))`).test(allowedRaw);
      const lawOk = !para[2] || allowedRaw.includes(para[2]);
      return !(numberOk && lawOk);
    }
    return true;
  });
}

/** Erzwingt die Regeln für confidence = uncertain: Hinweis enthalten, keine konkreten Fakten. */
export function enforceUncertainAnswer(text: string, locale: Locale): { text: string; removed: string[] } {
  const notice = uncertainNotice(locale);
  const stripped = stripConcreteFacts(text.replace(notice, "").trim());
  const body = stripped.text.trim();
  return { text: body ? `${notice} ${body}` : notice, removed: stripped.removed };
}

/** Entfernt Sätze, deren konkrete Fakten in keinem erlaubten Text belegt sind. */
export function stripUnsupportedFacts(text: string, allowedTexts: string[]): { text: string; removed: string[] } {
  const removed: string[] = [];
  const kept = splitSentences(text).filter((s) => {
    const bad = unsupportedFacts(s, allowedTexts);
    if (bad.length) { removed.push(...bad); return false; }
    return true;
  });
  return { text: kept.join(" "), removed: [...new Set(removed)] };
}

/** Entfernt Sätze mit Gesetzesangaben (für Ausgaben ohne Quellenbezug, z. B. Bildbeschreibung). */
export function stripLegalReferences(text: string): { text: string; removed: string[] } {
  const removed: string[] = [];
  const kept = splitSentences(text).filter((s) => {
    const refs = findLegalReferences(s);
    if (refs.length) { removed.push(...refs); return false; }
    return true;
  });
  return { text: kept.join(" "), removed: [...new Set(removed)] };
}
