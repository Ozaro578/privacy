// ZUKKABRO – rendert alle SVG-Druckvorlagen aus verpackung/dateien/ als PNG (300 dpi)
// und erstellt eine Übersicht verpackung/uebersicht.png.
// Aufruf: node werkzeuge/zukkabro_verpackung_png.cjs   (braucht Playwright)
const path = require("path");
const fs = require("fs");
let pw;
try { pw = require("playwright"); } catch { pw = require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright"); }

const ORDNER = path.join(__dirname, "..", "verpackung", "dateien");
const PNG = path.join(__dirname, "..", "verpackung", "png");

(async () => {
  fs.mkdirSync(PNG, { recursive: true });
  const browser = await pw.chromium.launch();
  const dateien = fs.readdirSync(ORDNER).filter((f) => f.endsWith(".svg")).sort();
  for (const f of dateien) {
    const inhalt = fs.readFileSync(path.join(ORDNER, f), "utf8");
    const m = inhalt.match(/width="(\d+)" height="(\d+)"/);
    const w = +m[1], h = +m[2];
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.setContent(`<html><body style="margin:0;background:transparent">${inhalt}</body></html>`);
    await page.screenshot({ path: path.join(PNG, f.replace(".svg", ".png")), omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
    await page.close();
    console.log("  PNG", f.replace(".svg", ".png"), `${w}×${h}`);
  }
  // Übersicht
  const karten = dateien.map((f) => `<figure><div class="bild ${/umriss|klebeband|seidenpapier|slogan-fuer-dunkel|logo-fuer-dunkel|krone/.test(f) ? "kraft" : ""}"><img src="data:image/png;base64,${fs.readFileSync(path.join(PNG, f.replace(".svg", ".png"))).toString("base64")}"></div><figcaption>${f.replace(".svg", "")}</figcaption></figure>`).join("");
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.setContent(`<html><head><style>
    body{margin:0;padding:40px;background:#2a2227;font-family:sans-serif;color:#fff}
    h1{margin:0 0 24px;font-size:36px}
    .raster{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
    figure{margin:0;background:#3a3036;border-radius:16px;padding:14px}
    .bild{height:250px;display:grid;place-items:center;background:repeating-conic-gradient(#555 0 25%,#666 0 50%) 0 0/20px 20px;border-radius:10px;overflow:hidden}
    .bild.kraft{background:#c8a27a}
    img{max-width:100%;max-height:250px}
    figcaption{margin-top:10px;font-size:15px}
  </style></head><body><h1>ZUKKABRO – Verpackung (Druckvorlagen)</h1><div class="raster">${karten}</div></body></html>`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ORDNER, "..", "uebersicht.png"), fullPage: true });
  await browser.close();
  console.log("  Übersicht: verpackung/uebersicht.png");
})();
