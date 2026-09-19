// Kopiert die Bildmedien der Übungsfragen aus @fahrpilot/content nach public/media/questions
// (wird vor dev und build ausgeführt; das Zielverzeichnis ist nicht versioniert).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, "../../../packages/content/media");
const dst = path.resolve(here, "../public/media/questions");
if (!fs.existsSync(src)) { console.error(`Medienquelle fehlt: ${src}`); process.exit(1); }
fs.rmSync(dst, { recursive: true, force: true });
fs.mkdirSync(dst, { recursive: true });
let n = 0;
for (const sub of ["signs", "scenes"]) {
  const d = path.join(src, sub);
  if (!fs.existsSync(d)) continue;
  fs.mkdirSync(path.join(dst, sub), { recursive: true });
  for (const f of fs.readdirSync(d)) if (f.endsWith(".svg")) { fs.copyFileSync(path.join(d, f), path.join(dst, sub, f)); n++; }
}
console.log(`${n} Fragemedien nach public/media/questions kopiert`);
