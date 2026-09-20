// Erzeugt aus dem Verkehrszeichenkatalog (media/signs.catalog.json) Übungsfragen mit Bild: src/questions/zeichen.generated.ts.
// Richtig per Konstruktion: Die richtige Antwort ist der amtliche Name des Zeichens, die Ablenker sind Namen anderer Zeichen derselben Gruppe.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "media", "signs.catalog.json"), "utf8"));
const CAT_LABEL = { gefahrzeichen: "Gefahrzeichen", vorschriftzeichen: "Vorschriftzeichen", richtzeichen: "Richtzeichen", verkehrseinrichtungen: "Verkehrseinrichtung", zusatzzeichen: "Zusatzzeichen" };
const BASE_DIFFICULTY = { gefahrzeichen: 0.3, vorschriftzeichen: 0.35, richtzeichen: 0.45, verkehrseinrichtungen: 0.5, zusatzzeichen: 0.55 };
// Häufige Zeichen sind leichter, seltene schwerer
const COMMON = new Set(["101", "102", "103-10", "103-20", "108-10", "110-12", "112", "114", "117-10", "120", "123", "131", "133-10", "136-10", "138-10", "142-10", "151", "201-50", "205", "206", "208", "209-10", "209-20", "215", "220-20", "222-10", "224", "237", "239", "240", "241-30", "242-1", "244-1", "250", "251", "253", "254", "259", "260", "267", "270-1", "272", "274-30", "274-50", "274-1", "276", "277", "278-50", "282", "283", "286", "301", "306", "307", "308", "310", "311", "314", "325-1", "330-1", "331-1", "350-10", "720"]);

function seeded(seedStr) { let h = 2166136261; for (const c of seedStr) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; }
const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ");
const baseNumber = (n) => String(n).split("-")[0].split(".")[0];

const entries = [];
for (const sign of catalog) {
  const rnd = seeded(sign.id);
  const same = catalog.filter((s) => s.category === sign.category && baseNumber(s.number) !== baseNumber(sign.number) && s.name !== sign.name);
  // Ablenker: unterschiedliche Namen, deterministisch gemischt
  const pool = [...same].sort(() => rnd() - 0.5);
  const distractors = [];
  for (const d of pool) { if (distractors.length === 3) break; if (!distractors.some((x) => x.name === d.name)) distractors.push(d); }
  if (distractors.length < 2) continue;
  const answers = [{ text: sign.name, correct: true }, ...distractors.map((d) => ({ text: d.name, correct: false, explanation: `Das wäre Zeichen ${d.number}.` }))].sort(() => rnd() - 0.5);
  const difficulty = Math.min(0.85, (BASE_DIFFICULTY[sign.category] ?? 0.4) + (COMMON.has(sign.id) ? 0 : 0.2) + (sign.number.includes("-") ? 0.05 : 0));
  const points = sign.category === "gefahrzeichen" || sign.category === "vorschriftzeichen" ? 3 : 2;
  const code = `own-verkehrszeichen-z${sign.id.toLowerCase()}`;
  entries.push({ code, sign, answers, difficulty, points });
}

let out = `// Automatisch erzeugt von scripts/gen-sign-questions.mjs aus dem Verkehrszeichenkatalog. Nicht von Hand ändern.
// Jede Frage zeigt ein Zeichen; die richtige Antwort ist der amtliche Name, die Ablenker sind andere Zeichen derselben Gruppe.
import type { Question } from "../types.js";
import { q, t, f } from "./_helpers.js";

/** Zuordnung Fragecode → Zeichen-ID (Bild aus dem Katalog). */
export const ZEICHEN_MEDIA: Readonly<Record<string, string>> = {
${entries.map((e) => `  "${e.code}": "${e.sign.id}",`).join("\n")}
};

export const zeichenGenerated: readonly Question[] = [
`;
for (const e of entries) {
  const s = e.sign;
  out += `  q({
    code: "${e.code}", topic: "verkehrszeichen", points: ${e.points}, difficulty: ${e.difficulty.toFixed(2)}, tags: ["zeichenkatalog", "${s.category}", "zeichen_${s.id.toLowerCase()}"],
    text: "Welches Verkehrszeichen ist abgebildet? (${CAT_LABEL[s.category]}, Zeichen ${esc(s.number)})",
    answers: [${e.answers.map((a) => (a.correct ? `t("${esc(a.text)}")` : `f("${esc(a.text)}", "${esc(a.explanation)}")`)).join(", ")}],
    explanation: "Zeichen ${esc(s.number)} ${esc(s.name)}: ${esc(s.meaning)}",
    legalReference: "${s.category === "zusatzzeichen" ? "§ 39 Abs. 3 StVO" : s.category === "gefahrzeichen" ? "§ 40 StVO, Anlage 1" : s.category === "vorschriftzeichen" ? "§ 41 StVO, Anlage 2" : s.category === "richtzeichen" ? "§ 42 StVO, Anlage 3" : "§ 43 StVO, Anlage 4"}",
  }),
`;
}
out += "];\n";
fs.writeFileSync(path.join(ROOT, "src", "questions", "zeichen.generated.ts"), out);
console.log(`${entries.length} Zeichenfragen erzeugt`);
