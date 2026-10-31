#!/usr/bin/env node
// Erzeugt zukkabro/public/app/: eine Kopie der Website OHNE den 18+-Bereich (keine Vapes, Liquids, Budz).
// Diese Kopie wird unter der App-Adresse (zukkabro.netlify.app bzw. app.zukkabro.de) ausgeliefert,
// damit die native App nie Inhalte lädt, die in den App-Stores nicht erlaubt sind (Apple-Richtlinie 2.5.19 / 1.4.3).
// Aufruf: node werkzeuge/zukkabro_app_variante.cjs   (nach jeder Änderung an public/ erneut ausführen)
const fs = require("fs"), path = require("path"), vm = require("vm");
const SRC = path.join(__dirname, "..", "zukkabro", "public"), DST = path.join(SRC, "app");
const VERBOTEN = /vape|budz|h3bta|hhc|thc|cbd|nikotin|nicotine|liquid|shisha|e-zigarette|elf ?bar|cannabis|haze|kush|amnesia/i;
const KAT_VERBOTEN = new Set(["vapes", "elfbar"]);

fs.rmSync(DST, { recursive: true, force: true });
fs.mkdirSync(path.join(DST, "assets", "css"), { recursive: true });
fs.mkdirSync(path.join(DST, "assets", "js"), { recursive: true });

const entfernt = new Set();
function datenAuswerten(datei) {
  const quelle = fs.readFileSync(path.join(SRC, "assets", "js", datei), "utf8");
  const namen = [...quelle.matchAll(/^const (\w+) =/gm)].map((m) => m[1]);
  const ctx = { window: {} }; vm.runInNewContext(quelle + `\n;__out = { ${namen.join(", ")} };`, ctx);
  const exporte = [...quelle.matchAll(/^window\.\w+ = \w+;$/gm)].map((m) => m[0]);
  return { namen, werte: ctx.__out, exporte };
}
{
  const { namen, werte, exporte } = datenAuswerten("produkte.js");
  const kat = werte.KATEGORIEN.filter((k) => !k.ab18 && !KAT_VERBOTEN.has(k.id) && !VERBOTEN.test(k.name || ""));
  const prod = werte.PRODUKTE.filter((p) => {
    const raus = p.ab18 || (p.kat || []).some((k) => KAT_VERBOTEN.has(k)) || VERBOTEN.test((p.name || "") + " " + (p.marke || "") + " " + (p.id || ""));
    if (raus) entfernt.add(p.id);
    return !raus;
  });
  const out = ["// AUTOMATISCH ERZEUGT von werkzeuge/zukkabro_app_variante.cjs – App-Variante ohne 18+-Artikel. Nicht von Hand ändern."];
  for (const n of namen) {
    const v = n === "KATEGORIEN" ? kat : n === "PRODUKTE" ? prod : werte[n];
    out.push(`const ${n} = ` + (n === "PRODUKTE" ? "[\n  " + v.map((x) => JSON.stringify(x)).join(",\n  ") + "\n]" : JSON.stringify(v, null, n === "KATEGORIEN" ? 2 : 0)) + ";");
  }
  fs.writeFileSync(path.join(DST, "assets", "js", "produkte.js"), out.concat(exporte).join("\n") + "\n");
  console.log(`produkte.js: ${prod.length} von ${werte.PRODUKTE.length} Artikeln behalten, ${entfernt.size} entfernt, Kategorien ${kat.length}/${werte.KATEGORIEN.length}`);
}
{
  const { werte, exporte } = datenAuswerten("produktinfo.js");
  const info = {}; let weg = 0;
  for (const [id, v] of Object.entries(werte.PRODUKTINFO)) {
    if (entfernt.has(id) || VERBOTEN.test(id + " " + JSON.stringify(v))) { weg++; continue; }
    info[id] = v;
  }
  fs.writeFileSync(path.join(DST, "assets", "js", "produktinfo.js"), "/* AUTOMATISCH ERZEUGT (App-Variante ohne 18+-Artikel) */\nconst PRODUKTINFO = {\n" + Object.entries(info).map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v)).join(",\n") + "\n};\n" + exporte.join("\n") + "\n");
  console.log(`produktinfo.js: ${Object.keys(info).length} Einträge, ${weg} entfernt`);
}

function bereinigen(name, t) {
  if (name === "index.html") {
    t = t.replace(/\s*<a href="\/vapes\.html" class="banner banner--vapes reveal">[\s\S]*?<\/a>/, "");
    t = t.replace(/\s*<li class="nur-web">[^\n]*Vapes nur ab 18[^\n]*<\/li>/g, "");
    t = t.replace(/<i><\/i><span class="nur-web">Vapes &amp; Budz 18\+<\/span>/g, "");
    t = t.replace(/<span class="nur-web">, Vapes<\/span>/g, "");
    t = t.replace(/\s*<li>🪪 Bei 18\+ Artikeln Ausweis mitbringen<\/li>/g, "");
    t = t.replace(/ Nur für Erwachsene ab 18 Jahren\./g, "");
  }
  if (name === "laden.html") t = t.replace(/\s*<a class="laden-extra laden-extra--18 reveal" href="\/vapes\.html">[\s\S]*?<\/a>/, "");
  if (name === "rechtliches.html") {
    t = t.replace(/E-Zigaretten, Liquids, nikotinhaltige Produkte und Tabakwaren geben wir ausschließlich/g, "Als „18+“ gekennzeichnete Waren geben wir ausschließlich");
    t = t.replace(/E-Zigaretten sind Elektrogeräte und mit dem Symbol/g, "Elektrogeräte sind mit dem Symbol");
    t = t.replace(/E-Zigaretten, Liquids, nikotinhaltige Produkte, Tabakwaren und sonstige im Shop als „18\+“ gekennzeichnete Waren/g, "Im Shop als „18+“ gekennzeichnete Waren");
    t = t.replace(/Einweg-E-Zigaretten und wiederaufladbare Vapes enthalten Lithium-Batterien\./g, "Manche Artikel (z. B. Spielzeug mit Licht) enthalten Batterien.");
  }
  if (name === "layout.js") {
    t = t.replace(/, zum Beispiel E-Zigaretten und Liquids\./g, ".");
    t = t.replace(/^\s*'<p class="footer__jugend">[^\n]*\n/m, "");
    t = t.replace(/^\s*\{ id: "vapes",[^\n]*\n/m, "");
    t = t.replace(/^\s*'<a href="\/vapes\.html" class="topbar__ab18">[^\n]*\n/m, "");
    t = t.replace(/Sorry, Bro! Vapes und Co\. gibt es nur für Erwachsene ab 18\./g, "Sorry, Bro! Dieser Bereich ist nur für Erwachsene ab 18.");
  }
  t = t.replace(/Snacks, Drinks, Vapes &amp; More/g, "Snacks, Drinks &amp; More").replace(/Snacks, Drinks, Vapes & More/g, "Snacks, Drinks & More");
  t = t.replace(/Candy, Drinks, Vapes und mehr/g, "Candy, Drinks und mehr").replace(/Getränke, Vapes und mehr/g, "Getränke und mehr");
  t = t.replace(/\/assets\/img\/logo\.png/g, "/assets/img/logo-app.png").replace(/\/assets\/img\/logo\.svg/g, "/assets/img/logo-app.png").replace(/\/assets\/img\/logo-quer\.svg/g, "/assets/img/logo-app.png");
  t = t.replace(/\/vapes\.html/g, "/sortiment.html");
  t = t.replace(/"vapes"/g, '"x18a"').replace(/"elfbar"/g, '"x18b"').replace(/'vapes'/g, "'x18a'");
  t = t.replace(/Vapes &amp; Budz 18\+/g, "18+").replace(/Vapes & Budz 18\+/g, "18+").replace(/Vapes & Budz/g, "18+");
  t = t.replace(/Vapes?/g, "18+").replace(/vapes?/g, "nacht");
  t = t.replace(/Budz/g, "").replace(/budz/g, "");
  t = t.replace(/nikotinhaltige /gi, "").replace(/Nikotin/g, "").replace(/nikotin/g, "");
  t = t.replace(/E-Zigaretten?/g, "Elektrogeräte").replace(/Liquids?/g, "Zubehör").replace(/Tabakwaren/g, "Genussmittel").replace(/elfbar/gi, "x18b");
  return t;
}
const TEXT = /\.(html|js|css|webmanifest|json|txt|xml)$/;
function kopiere(rel) {
  const q = path.join(SRC, rel), z = path.join(DST, rel);
  fs.mkdirSync(path.dirname(z), { recursive: true });
  if (TEXT.test(rel)) fs.writeFileSync(z, bereinigen(path.basename(rel), fs.readFileSync(q, "utf8")));
  else fs.copyFileSync(q, z);
}
for (const f of fs.readdirSync(SRC)) {
  if (fs.statSync(path.join(SRC, f)).isDirectory() || f === "vapes.html") continue;
  kopiere(f);
}
for (const f of fs.readdirSync(path.join(SRC, "assets", "css"))) kopiere(path.join("assets", "css", f));
for (const f of fs.readdirSync(path.join(SRC, "assets", "js"))) { if (["produkte.js", "produktinfo.js", "admin.js", "haendler.js"].includes(f)) continue; kopiere(path.join("assets", "js", f)); }

let treffer = 0;
function pruefe(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { pruefe(p); continue; }
    if (!TEXT.test(f)) continue;
    const m = fs.readFileSync(p, "utf8").match(/vape|budz|h3bta|hhc|cannabis|nikotin|nicotine|elfbar|elf bar|e-zigarette/gi);
    if (m) { treffer += m.length; console.log("REST:", path.relative(DST, p), [...new Set(m.map((x) => x.toLowerCase()))].join(",")); }
  }
}
pruefe(DST);
console.log(treffer ? `WARNUNG: ${treffer} verbliebene Treffer` : "Prüfung: keine 18+-Begriffe mehr in public/app");
