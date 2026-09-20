// Erzeugt die Bildmedien der Übungsfragen als SVG: Verkehrszeichen nach StVO-Anlagen (amtliche Werke,
// § 5 UrhG, daher gemeinfrei; hier als eigene Vektorzeichnung nachgebaut) sowie Situationsgrafiken
// (Draufsicht) und Schemazeichnungen. Aufruf: node scripts/gen-media.mjs  → media/signs, media/scenes, media/manifest.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "media");

import * as K from "./lib/sign-kit.mjs";
const { RED, BLUE, YELLOW, GREEN, BLACK, WHITE, FONT, P, svgOpen, esc, pict, triangleUp, triangleDown, circleRed, circleBlue, rectBlue, rectWhite, text, haltverbot, zusatz } = K;

const manifest = [];
function emit(kind, id, alt, svg, meta = {}) {
  const dir = path.join(OUT, kind === "sign" ? "signs" : "scenes");
  fs.mkdirSync(dir, { recursive: true });
  const file = `${kind === "sign" ? "signs" : "scenes"}/${id}.svg`;
  fs.writeFileSync(path.join(OUT, file), svg.trim() + "\n");
  manifest.push({ id, file, kind, alt, credit: kind === "sign" ? "Verkehrszeichen nach StVO (amtliches Werk, § 5 UrhG); Vektorzeichnung FahrPilot" : "Grafik FahrPilot (eigene Darstellung, schematisch)", ...meta });
}

// Verkehrszeichen-Katalog: id → { title, svg }
const SIGNS = {
  "101": { alt: "Zeichen 101 Gefahrstelle: rotes Dreieck mit Ausrufezeichen", svg: () => triangleUp(P.exclamation, "Zeichen 101 Gefahrstelle") },
  "102": { alt: "Zeichen 102 Kreuzung oder Einmündung mit Vorfahrt von rechts: Dreieck mit schwarzem Kreuz", svg: () => triangleUp(P.cross, "Zeichen 102 Kreuzung mit Vorfahrt von rechts") },
  "103-10": { alt: "Zeichen 103 Kurve (links): Dreieck mit abknickendem Pfeil", svg: () => triangleUp(P.curveLeft, "Zeichen 103 Kurve links") },
  "114": { alt: "Zeichen 114 Schleudergefahr bei Nässe oder Schmutz: Dreieck mit schleuderndem Auto", svg: () => triangleUp(P.skidCar, "Zeichen 114 Schleudergefahr", 56) },
  "117-10": { alt: "Zeichen 117 Seitenwind von rechts: Dreieck mit Windsack", svg: () => triangleUp(P.windsock, "Zeichen 117 Seitenwind") },
  "123": { alt: "Zeichen 123 Arbeitsstelle: Dreieck mit arbeitender Person", svg: () => triangleUp(P.worker, "Zeichen 123 Arbeitsstelle", 56) },
  "131": { alt: "Zeichen 131 Lichtzeichenanlage: Dreieck mit Ampel", svg: () => triangleUp(P.trafficLight, "Zeichen 131 Lichtzeichenanlage", 50) },
  "133-10": { alt: "Zeichen 133 Fußgänger: Dreieck mit gehender Person", svg: () => triangleUp(P.pedestrian, "Zeichen 133 Fußgänger") },
  "136-10": { alt: "Zeichen 136 Kinder: Dreieck mit zwei laufenden Kindern", svg: () => triangleUp(P.children, "Zeichen 136 Kinder", 56) },
  "138-10": { alt: "Zeichen 138 Radverkehr: Dreieck mit Fahrrad", svg: () => triangleUp(P.bicycle, "Zeichen 138 Radverkehr") },
  "142-10": { alt: "Zeichen 142 Wildwechsel: Dreieck mit springendem Reh", svg: () => triangleUp(P.deer, "Zeichen 142 Wildwechsel", 58) },
  "151": { alt: "Zeichen 151 Bahnübergang: Dreieck mit Zug", svg: () => triangleUp(P.train, "Zeichen 151 Bahnübergang", 52) },
  "201-50": { alt: "Zeichen 201 Andreaskreuz: weißes X-förmiges Kreuz mit roten Spitzen", svg: () => `${svgOpen(120, 120, "Zeichen 201 Andreaskreuz")}<g transform="rotate(45 60 60)"><rect x="8" y="49" width="104" height="22" fill="${WHITE}" stroke="${BLACK}" stroke-width="1.5"/><rect x="49" y="8" width="22" height="104" fill="${WHITE}" stroke="${BLACK}" stroke-width="1.5"/><rect x="8" y="49" width="30" height="22" fill="${RED}"/><rect x="82" y="49" width="30" height="22" fill="${RED}"/><rect x="49" y="8" width="22" height="30" fill="${RED}"/><rect x="49" y="82" width="22" height="30" fill="${RED}"/></g></svg>` },
  "205": { alt: "Zeichen 205 Vorfahrt gewähren: auf der Spitze stehendes Dreieck mit rotem Rand", svg: () => triangleDown("Zeichen 205 Vorfahrt gewähren") },
  "206": { alt: "Zeichen 206 Halt. Vorfahrt gewähren: rotes Achteck mit weißer Aufschrift STOP", svg: () => `${svgOpen(120, 120, "Zeichen 206 Stopp")}<polygon points="36,4 84,4 116,36 116,84 84,116 36,116 4,84 4,36" fill="${RED}" stroke="#9CA3AF" stroke-width="1"/><polygon points="38,9 82,9 111,38 111,82 82,111 38,111 9,82 9,38" fill="none" stroke="${WHITE}" stroke-width="3"/>${text(60, 74, 38, "STOP", WHITE, "middle", 'letter-spacing="1"')}</svg>` },
  "208": { alt: "Zeichen 208 Vorrang des Gegenverkehrs: roter Kreis mit rotem Pfeil nach oben und schwarzem Pfeil nach unten", svg: () => circleRed(`<path d="M34 86 V30 L22 30 L40 8 L58 30 H46 V86 Z" fill="${RED}"/><path d="M66 14 V70 H78 L60 92 L42 70 H54 V14 Z" fill="${BLACK}"/>`, "Zeichen 208 Vorrang des Gegenverkehrs") },
  "209-20": { alt: "Zeichen 209-20 Vorgeschriebene Fahrtrichtung rechts: blauer Kreis mit weißem Pfeil nach rechts", svg: () => circleBlue(`<g transform="rotate(90 50 50)">${P.arrowUpWhite}</g>`, "Zeichen 209 Rechts") },
  "215": { alt: "Zeichen 215 Kreisverkehr: blauer Kreis mit drei weißen Pfeilen gegen den Uhrzeigersinn", svg: () => circleBlue(`<g fill="${WHITE}">${[0, 120, 240].map((a) => `<g transform="rotate(${a} 50 50)"><path d="M50 12 A38 38 0 0 1 84 36" fill="none" stroke="${WHITE}" stroke-width="9"/><path d="M92 20 L92 46 L66 46 Z" transform="rotate(8 92 46)"/></g>`).join("")}</g>`, "Zeichen 215 Kreisverkehr", 74) },
  "220-20": { alt: "Zeichen 220 Einbahnstraße: blaues Rechteck mit weißem Pfeil und Aufschrift Einbahnstraße", svg: () => rectBlue(240, 96, `<path d="M40 48 H170 V30 L210 48 L170 66 V48" fill="${WHITE}"/>${text(120, 84, 16, "Einbahnstraße", WHITE)}`, "Zeichen 220 Einbahnstraße") },
  "222-10": { alt: "Zeichen 222 Vorgeschriebene Vorbeifahrt rechts vorbei: blauer Kreis mit schrägem weißen Pfeil nach rechts unten", svg: () => circleBlue(`<g transform="rotate(135 50 50)">${P.arrowUpWhite}</g>`, "Zeichen 222 Rechts vorbei") },
  "224": { alt: "Zeichen 224 Haltestelle: grünes H auf gelbem Kreis mit grünem Rand", svg: () => `${svgOpen(120, 120, "Zeichen 224 Haltestelle")}<circle cx="60" cy="60" r="57" fill="${GREEN}" stroke="#9CA3AF" stroke-width="1"/><circle cx="60" cy="60" r="47" fill="${YELLOW}"/><circle cx="60" cy="60" r="38" fill="${GREEN}"/>${text(60, 80, 58, "H", YELLOW)}</svg>` },
  "237": { alt: "Zeichen 237 Radweg: blauer Kreis mit weißem Fahrrad", svg: () => circleBlue(P.bicycle.replaceAll(BLACK, WHITE), "Zeichen 237 Radweg") },
  "239": { alt: "Zeichen 239 Gehweg: blauer Kreis mit weißer gehender Person und Kind", svg: () => circleBlue(P.pedestrian.replaceAll(BLACK, WHITE), "Zeichen 239 Gehweg", 70) },
  "244-1": { alt: "Zeichen 244.1 Beginn einer Fahrradstraße: weißes Rechteck mit blauem Fahrrad-Kreis und Aufschrift Fahrradstraße", svg: () => rectWhite(160, 200, `<svg x="30" y="20" width="100" height="100" viewBox="0 0 120 120"><circle cx="60" cy="60" r="57" fill="${BLUE}"/><circle cx="60" cy="60" r="53" fill="none" stroke="${WHITE}" stroke-width="3"/>${pict(P.bicycle.replaceAll(BLACK, WHITE), 22, 22, 76)}</svg>${text(80, 168, 22, "Fahrradstraße")}`, "Zeichen 244.1 Fahrradstraße") },
  "250": { alt: "Zeichen 250 Verbot für Fahrzeuge aller Art: roter Ring auf weißem Grund", svg: () => circleRed("", "Zeichen 250 Verbot für Fahrzeuge aller Art") },
  "251": { alt: "Zeichen 251 Verbot für Kraftwagen: roter Ring mit schwarzem Auto", svg: () => circleRed(P.carFront, "Zeichen 251 Verbot für Kraftwagen") },
  "254": { alt: "Zeichen 254 Verbot für Radverkehr: roter Ring mit Fahrrad", svg: () => circleRed(P.bicycle, "Zeichen 254 Verbot für Radverkehr") },
  "259": { alt: "Zeichen 259 Verbot für Fußgänger: roter Ring mit gehender Person", svg: () => circleRed(P.pedestrian, "Zeichen 259 Verbot für Fußgänger", 62) },
  "260": { alt: "Zeichen 260 Verbot für Krafträder und Kraftwagen: roter Ring mit Motorrad und Auto", svg: () => circleRed(`<g transform="translate(0 -14) scale(0.6) translate(34 0)">${P.motorbike}</g><g transform="translate(0 22) scale(0.6) translate(34 0)">${P.carFront}</g>`, "Zeichen 260 Verbot für Krafträder und Kraftwagen", 80) },
  "267": { alt: "Zeichen 267 Verbot der Einfahrt: roter Kreis mit weißem Querbalken", svg: () => `${svgOpen(120, 120, "Zeichen 267 Verbot der Einfahrt")}<circle cx="60" cy="60" r="57" fill="${RED}" stroke="#9CA3AF" stroke-width="1"/><rect x="18" y="50" width="84" height="20" rx="2" fill="${WHITE}"/></svg>` },
  "270-1": { alt: "Zeichen 270.1 Umweltzone: weißes Schild mit Aufschrift Umwelt, rotem Ring mit Auto und Aufschrift ZONE", svg: () => rectWhite(160, 210, `${text(80, 40, 26, "Umwelt")}<svg x="35" y="52" width="90" height="90" viewBox="0 0 120 120"><circle cx="60" cy="60" r="57" fill="${RED}"/><circle cx="60" cy="60" r="44" fill="${WHITE}"/>${pict(P.carFront, 26, 26, 68)}</svg>${text(80, 190, 30, "ZONE")}`, "Zeichen 270.1 Umweltzone") },
  "272": { alt: "Zeichen 272 Verbot des Wendens: roter Ring mit schwarzem U-förmigem Pfeil und rotem Schrägstrich", svg: () => circleRed(`<path d="M30 82 V44 A20 20 0 0 1 70 44 V82" fill="none" stroke="${BLACK}" stroke-width="12"/><path d="M24 78 H36 L30 92 Z M64 78 H76 L70 92 Z" fill="${BLACK}"/>`, "Zeichen 272 Wenden verboten", 68, `<rect x="16" y="55" width="88" height="9" fill="${RED}" transform="rotate(-45 60 60)"/>`) },
  "274-30": { alt: "Zeichen 274 Zulässige Höchstgeschwindigkeit 30 km/h: roter Ring mit schwarzer 30", svg: () => circleRed(text(50, 68, 50, "30"), "Zeichen 274 Höchstgeschwindigkeit 30", 100) },
  "274-50": { alt: "Zeichen 274 Zulässige Höchstgeschwindigkeit 50 km/h: roter Ring mit schwarzer 50", svg: () => circleRed(text(50, 68, 50, "50"), "Zeichen 274 Höchstgeschwindigkeit 50", 100) },
  "274-100": { alt: "Zeichen 274 Zulässige Höchstgeschwindigkeit 100 km/h: roter Ring mit schwarzer 100", svg: () => circleRed(text(50, 66, 40, "100"), "Zeichen 274 Höchstgeschwindigkeit 100", 100) },
  "274-1": { alt: "Zeichen 274.1 Beginn einer Tempo-30-Zone: weißes Schild mit rotem Ring 30 und Aufschrift ZONE", svg: () => rectWhite(160, 200, `<svg x="35" y="18" width="90" height="90" viewBox="0 0 120 120"><circle cx="60" cy="60" r="57" fill="${RED}"/><circle cx="60" cy="60" r="44" fill="${WHITE}"/>${text(60, 78, 50, "30")}</svg>${text(80, 165, 34, "ZONE")}`, "Zeichen 274.1 Tempo-30-Zone") },
  "276": { alt: "Zeichen 276 Überholverbot für Kraftfahrzeuge aller Art: roter Ring mit rotem und schwarzem Auto", svg: () => circleRed(`<g transform="translate(-22 0) scale(0.62) translate(30 30)">${P.carFrontRed}</g><g transform="translate(22 0) scale(0.62) translate(30 30)">${P.carFront}</g>`, "Zeichen 276 Überholverbot", 90) },
  "277": { alt: "Zeichen 277 Überholverbot für Kraftfahrzeuge über 3,5 t: roter Ring mit rotem Lkw und schwarzem Auto", svg: () => circleRed(`<g transform="translate(-22 0) scale(0.62) translate(30 30)">${P.truckFront.replaceAll(BLACK, RED)}</g><g transform="translate(22 0) scale(0.62) translate(30 30)">${P.carFront}</g>`, "Zeichen 277 Überholverbot für Lkw", 90) },
  "282": { alt: "Zeichen 282 Ende aller Streckenverbote: weißer Kreis mit schrägen grauen Strichen", svg: () => `${svgOpen(120, 120, "Zeichen 282 Ende aller Streckenverbote")}<circle cx="60" cy="60" r="57" fill="${WHITE}" stroke="#9CA3AF" stroke-width="1"/><g stroke="${BLACK}" stroke-width="5"><path d="M18 102 L102 18 M8 76 L76 8 M44 112 L112 44"/></g></svg>` },
  "283": { alt: "Zeichen 283 Absolutes Halteverbot: blauer Kreis mit rotem Rand und zwei roten Diagonalbalken", svg: () => haltverbot(2, "Zeichen 283 Absolutes Halteverbot") },
  "286": { alt: "Zeichen 286 Eingeschränktes Halteverbot: blauer Kreis mit rotem Rand und einem roten Diagonalbalken", svg: () => haltverbot(1, "Zeichen 286 Eingeschränktes Halteverbot") },
  "301": { alt: "Zeichen 301 Vorfahrt: Dreieck mit rotem Rand und breitem schwarzem Pfeil, den ein dünner Querstrich kreuzt", svg: () => triangleUp(`<path d="M50 4 L74 40 H60 V96 H40 V40 H26 Z" fill="${BLACK}"/><rect x="14" y="54" width="72" height="9" fill="${BLACK}"/>`, "Zeichen 301 Vorfahrt", 56) },
  "306": { alt: "Zeichen 306 Vorfahrtstraße: gelbes Quadrat auf der Spitze mit weißem Rand", svg: () => `${svgOpen(120, 120, "Zeichen 306 Vorfahrtstraße")}<rect x="18" y="18" width="84" height="84" rx="6" fill="${WHITE}" stroke="#9CA3AF" stroke-width="1" transform="rotate(45 60 60)"/><rect x="31" y="31" width="58" height="58" rx="3" fill="${YELLOW}" transform="rotate(45 60 60)"/></svg>` },
  "307": { alt: "Zeichen 307 Ende der Vorfahrtstraße: gelbes Quadrat auf der Spitze mit schwarzem Schrägbalken", svg: () => `${svgOpen(120, 120, "Zeichen 307 Ende der Vorfahrtstraße")}<rect x="18" y="18" width="84" height="84" rx="6" fill="${WHITE}" stroke="#9CA3AF" stroke-width="1" transform="rotate(45 60 60)"/><rect x="31" y="31" width="58" height="58" rx="3" fill="${YELLOW}" transform="rotate(45 60 60)"/><g transform="rotate(-45 60 60)"><rect x="4" y="44" width="112" height="32" fill="${BLACK}"/><rect x="4" y="50" width="112" height="3" fill="${WHITE}"/><rect x="4" y="58.5" width="112" height="3" fill="${WHITE}"/><rect x="4" y="67" width="112" height="3" fill="${WHITE}"/></g></svg>` },
  "308": { alt: "Zeichen 308 Vorrang vor dem Gegenverkehr: blaues Quadrat mit rotem Pfeil nach unten und weißem Pfeil nach oben", svg: () => rectBlue(120, 120, `<path d="M34 100 V44 H22 L40 16 L58 44 H46 V100 Z" fill="${WHITE}"/><path d="M66 20 V76 H78 L60 104 L42 76 H54 V20 Z" fill="${RED}"/>`, "Zeichen 308 Vorrang vor dem Gegenverkehr") },
  "310": { alt: "Zeichen 310 Ortstafel Vorderseite: gelbes Schild mit Ortsnamen", svg: () => `${svgOpen(240, 150, "Zeichen 310 Ortstafel")}<rect x="1" y="1" width="238" height="148" rx="6" fill="${YELLOW}" stroke="#9CA3AF" stroke-width="1"/><rect x="6" y="6" width="228" height="138" rx="3" fill="none" stroke="${BLACK}" stroke-width="3"/>${text(120, 82, 36, "Musterstadt")}${text(120, 120, 18, "Kreis Musterkreis")}</svg>` },
  "311": { alt: "Zeichen 311 Ortstafel Rückseite: gelbes Schild mit durchgestrichenem Ortsnamen und Hinweis auf nächsten Ort", svg: () => `${svgOpen(240, 150, "Zeichen 311 Ortstafel Rückseite")}<rect x="1" y="1" width="238" height="148" rx="6" fill="${YELLOW}" stroke="#9CA3AF" stroke-width="1"/><rect x="6" y="6" width="228" height="138" rx="3" fill="none" stroke="${BLACK}" stroke-width="3"/>${text(120, 54, 22, "Nachbardorf 8 km")}${text(120, 118, 36, "Musterstadt")}<path d="M22 130 L218 92" stroke="${RED}" stroke-width="9"/></svg>` },
  "314": { alt: "Zeichen 314 Parken: blaues Quadrat mit weißem P", svg: () => rectBlue(120, 120, text(60, 92, 86, "P", WHITE), "Zeichen 314 Parken") },
  "315-55": { alt: "Zeichen 315 Parken auf Gehwegen: blaues Schild mit P und Auto, das halb auf dem Gehweg steht", svg: () => rectBlue(120, 180, `${text(60, 78, 74, "P", WHITE)}<path d="M8 150 H60 V138 H112" stroke="${WHITE}" stroke-width="4" fill="none"/><path d="M28 132 L36 112 H82 L90 132 Z" fill="${WHITE}"/><rect x="22" y="130" width="76" height="14" rx="3" fill="${WHITE}"/><rect x="42" y="116" width="34" height="10" fill="${BLUE}"/>`, "Zeichen 315 Parken auf Gehwegen") },
  "325-1": { alt: "Zeichen 325.1 Beginn eines verkehrsberuhigten Bereichs: blaues Schild mit Haus, Auto, Erwachsenem, Kind und Ball", svg: () => rectBlue(240, 160, `<g transform="translate(150 14) scale(0.72)">${P.house}</g><g transform="translate(70 4) scale(0.62)">${P.carFront.replaceAll(BLACK, WHITE).replaceAll(`fill="${WHITE}"/><circle cx="28"`, `fill="${WHITE}"/><circle cx="28"`)}</g><g transform="translate(8 40) scale(0.9)">${P.pedestrian.replaceAll(BLACK, WHITE)}</g><g transform="translate(96 64) scale(0.55)">${P.children.replaceAll(BLACK, WHITE)}</g><circle cx="118" cy="132" r="9" fill="${WHITE}"/><path d="M150 110 Q170 118 232 148" stroke="${WHITE}" stroke-width="4" fill="none"/>`, "Zeichen 325.1 Verkehrsberuhigter Bereich") },
  "330-1": { alt: "Zeichen 330.1 Autobahn: blaues Schild mit weißer Brücke über zwei Fahrbahnen", svg: () => rectBlue(120, 120, `<path d="M20 100 L44 28 H54 L42 100 Z M100 100 L76 28 H66 L78 100 Z" fill="${WHITE}"/><path d="M12 62 Q60 38 108 62 V72 Q60 48 12 72 Z" fill="${WHITE}"/>`, "Zeichen 330.1 Autobahn") },
  "331-1": { alt: "Zeichen 331.1 Kraftfahrstraße: blaues Schild mit weißem Auto von vorn", svg: () => rectBlue(120, 120, pict(P.carFront.replaceAll(BLACK, WHITE), 14, 14, 92), "Zeichen 331.1 Kraftfahrstraße") },
  "350-10": { alt: "Zeichen 350 Fußgängerüberweg: blaues Quadrat mit weißem Dreieck, darin Person auf Zebrastreifen", svg: () => rectBlue(120, 120, `<path d="M60 12 L108 104 H12 Z" fill="${WHITE}"/><g fill="${BLACK}"><rect x="30" y="88" width="60" height="6"/><rect x="36" y="78" width="48" height="5"/><rect x="42" y="69" width="36" height="4"/></g>${pict(P.pedestrian, 32, 30, 50)}`, "Zeichen 350 Fußgängerüberweg") },
  "720": { alt: "Zeichen 720 Grünpfeilschild: schwarzes Quadrat mit grünem Pfeil nach rechts", svg: () => `${svgOpen(120, 120, "Zeichen 720 Grünpfeil")}<rect x="2" y="2" width="116" height="116" rx="10" fill="${BLACK}" stroke="#9CA3AF" stroke-width="1"/><path d="M26 50 H66 V30 L96 60 L66 90 V70 H26 Z" fill="${GREEN}" stroke="${WHITE}" stroke-width="3"/></svg>` },
  "1002-10": { alt: "Zusatzzeichen 1002-10 Verlauf der abknickenden Vorfahrtstraße nach links", svg: () => zusatz(120, 120, `<g stroke="${BLACK}" stroke-width="12" fill="none" stroke-linecap="butt"><path d="M60 104 V60 H18"/></g><g stroke="${BLACK}" stroke-width="4" fill="none"><path d="M60 60 V16 M60 60 H104"/></g>`, "Zusatzzeichen abknickende Vorfahrt") },
  "1044-10": { alt: "Zusatzzeichen 1044-10 Rollstuhlsymbol (nur Schwerbehinderte mit Parkausweis)", svg: () => zusatz(120, 120, pict(P.wheelchair, 16, 14, 88), "Zusatzzeichen Rollstuhl") },
  "156-10": { alt: "Zeichen 156 Bake dreistreifig (240 m vor dem Bahnübergang) mit Zeichen 151", svg: () => `${svgOpen(120, 240, "Bake dreistreifig")}<rect x="40" y="90" width="40" height="148" rx="3" fill="${WHITE}" stroke="${BLACK}" stroke-width="2"/><g fill="${RED}"><path d="M40 106 L80 96 V116 L40 126 Z"/><path d="M40 150 L80 140 V160 L40 170 Z"/><path d="M40 194 L80 184 V204 L40 214 Z"/></g><svg x="14" y="4" width="92" height="92" viewBox="0 0 120 120">${triangleUp(P.train, "Zeichen 151", 52).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</svg></svg>` },
  "alpine": { alt: "Alpine-Symbol: dreigipfliger Berg mit Schneeflocke (Winterreifenkennzeichnung)", svg: () => `${svgOpen(120, 120, "Alpine-Symbol")}<path d="M60 8 L112 100 H8 Z" fill="none" stroke="${BLACK}" stroke-width="5" stroke-linejoin="round"/><path d="M20 96 L44 50 L54 66 L68 40 L100 96 Z" fill="${BLACK}"/><g transform="translate(44 56) scale(0.4)">${P.snowflake.replaceAll(BLACK, WHITE)}</g></svg>` },
  "oeldruck": { alt: "Kontrollleuchte Öldruck: rote Ölkanne", svg: () => `${svgOpen(120, 120, "Kontrollleuchte Öldruck")}<rect x="2" y="2" width="116" height="116" rx="14" fill="#1F2937"/><g transform="translate(10 10)">${P.oilCan.replaceAll(BLACK, "#E30613")}</g></svg>` },
};

// Vollständiger Katalog aus scripts/signs/*.mjs (Anlagen 1 bis 4 StVO und Zusatzzeichen). Katalogeinträge überschreiben gleichnamige Basiszeichen.
const CATALOG = [];
const signsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "signs");
if (fs.existsSync(signsDir)) {
  for (const f of fs.readdirSync(signsDir).filter((x) => x.endsWith(".mjs")).sort()) {
    const mod = await import(path.join(signsDir, f));
    for (const e of mod.default) {
      if (!/^[A-Za-z0-9._-]+$/.test(e.id)) throw new Error(`${f}: ungültige ID ${e.id}`);
      if (!e.number || !e.name || !e.category || !e.meaning || !e.alt || typeof e.svg !== "function") throw new Error(`${f}: Eintrag ${e.id} unvollständig`);
      CATALOG.push(e);
      SIGNS[e.id] = { alt: e.alt, svg: e.svg };
    }
  }
}
const seen = new Set();
for (const e of CATALOG) { if (seen.has(e.id)) throw new Error(`Doppelte Zeichen-ID ${e.id}`); seen.add(e.id); }
for (const [id, s] of Object.entries(SIGNS)) {
  const e = CATALOG.find((c) => c.id === id);
  emit("sign", id, s.alt, s.svg(), e ? { number: e.number, name: e.name, category: e.category, meaning: e.meaning } : {});
}

// Zeichenkombinationen (nebeneinander)
function combo(id, alt, ids, gap = 24) {
  const parts = ids.map((i) => SIGNS[i].svg());
  const dims = parts.map((p) => { const m = p.match(/viewBox="0 0 (\d+) (\d+)"/); return { w: Number(m[1]), h: Number(m[2]) }; });
  const H = Math.max(...dims.map((d) => d.h));
  const W = dims.reduce((s, d) => s + d.w, 0) + gap * (ids.length - 1);
  let x = 0;
  let inner = "";
  for (const [i, p] of parts.entries()) {
    inner += `<svg x="${x}" y="${(H - dims[i].h) / 2}" width="${dims[i].w}" height="${dims[i].h}" viewBox="0 0 ${dims[i].w} ${dims[i].h}">${p.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</svg>`;
    x += dims[i].w + gap;
  }
  const out = `${svgOpen(W, H, alt)}${inner}</svg>`;
  SIGNS[id] = { alt, svg: () => out };
  emit("sign", id, alt, out);
}
function stack(id, alt, ids, gap = 6) {
  const parts = ids.map((i) => SIGNS[i].svg());
  const dims = parts.map((p) => { const m = p.match(/viewBox="0 0 (\d+) (\d+)"/); return { w: Number(m[1]), h: Number(m[2]) }; });
  const W = Math.max(...dims.map((d) => d.w));
  const H = dims.reduce((s, d) => s + d.h, 0) + gap * (ids.length - 1);
  let y = 0;
  let inner = "";
  for (const [i, p] of parts.entries()) {
    inner += `<svg x="${(W - dims[i].w) / 2}" y="${y}" width="${dims[i].w}" height="${dims[i].h}" viewBox="0 0 ${dims[i].w} ${dims[i].h}">${p.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</svg>`;
    y += dims[i].h + gap;
  }
  const out = `${svgOpen(W, H, alt)}${inner}</svg>`;
  SIGNS[id] = { alt, svg: () => out };
  emit("sign", id, alt, out);
}
combo("330-1_331-1", "Zeichen 330.1 Autobahn und Zeichen 331.1 Kraftfahrstraße nebeneinander", ["330-1", "331-1"]);
stack("215_205", "Zeichen 215 Kreisverkehr über Zeichen 205 Vorfahrt gewähren", ["215", "205"]);
stack("306_1002-10", "Zeichen 306 Vorfahrtstraße mit Zusatzzeichen: Vorfahrtstraße knickt nach links ab", ["306", "1002-10"]);
stack("314_1044-10", "Zeichen 314 Parken mit Zusatzzeichen Rollstuhlsymbol", ["314", "1044-10"]);
combo("283_286", "Zeichen 283 absolutes Halteverbot (links) und Zeichen 286 eingeschränktes Halteverbot (rechts)", ["283", "286"]);
combo("310_311", "Zeichen 310 Ortstafel (Ortseingang) und Zeichen 311 (Ortsausgang)", ["310", "311"]);

// ---------------------------------------------------------------------------------------------
// Situationsgrafiken (Draufsicht)
// ---------------------------------------------------------------------------------------------
const ASPHALT = "#5F6B7A";
const GRASS = "#DCE7D2";
const CAR = { you: "#1D4ED8", a: "#DC2626", b: "#059669", c: "#D97706", grey: "#6B7280", bus: "#F59E0B", emergency: "#DC2626" };

function signIn(id, x, y, size) {
  const s = SIGNS[id].svg();
  const m = s.match(/viewBox="0 0 (\d+) (\d+)"/);
  const w = Number(m[1]); const h = Number(m[2]);
  const scale = size / Math.max(w, h);
  return `<svg x="${x}" y="${y}" width="${w * scale}" height="${h * scale}" viewBox="0 0 ${w} ${h}">${s.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</svg>`;
}

/** Auto in Draufsicht; (x,y) Mittelpunkt, heading in Grad (0 = nach oben/Norden, 90 = nach rechts/Osten). */
function car(x, y, heading, color, label = "", opts = {}) {
  const L = opts.length ?? 56; const W = opts.width ?? 28;
  const blink = opts.blink ? `<circle cx="${opts.blink === "L" ? -W / 2 + 3 : W / 2 - 3}" cy="${-L / 2 + 5}" r="4" fill="#FACC15" stroke="#B45309" stroke-width="1"/><circle cx="${opts.blink === "L" ? -W / 2 + 3 : W / 2 - 3}" cy="${L / 2 - 5}" r="4" fill="#FACC15" stroke="#B45309" stroke-width="1"/>` : "";
  const warn = opts.warn ? [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => `<circle cx="${(sx * (W / 2 - 3))}" cy="${sy * (L / 2 - 5)}" r="4" fill="#FACC15" stroke="#B45309" stroke-width="1"/>`).join("") : "";
  const blue = opts.bluelight ? `<rect x="-10" y="-4" width="20" height="8" rx="3" fill="#2563EB" stroke="${WHITE}" stroke-width="1.5"/>` : "";
  const lbl = label ? `<text x="0" y="${L / 2 - 14}" font-size="13" ${FONT} fill="${WHITE}" text-anchor="middle" transform="rotate(${-heading})" dominant-baseline="middle">${esc(label)}</text>` : "";
  return `<g transform="translate(${x} ${y}) rotate(${heading})"><rect x="${-W / 2}" y="${-L / 2}" width="${W}" height="${L}" rx="7" fill="${color}" stroke="#111827" stroke-width="1.5"/><rect x="${-W / 2 + 4}" y="${-L / 2 + 12}" width="${W - 8}" height="9" rx="2" fill="#BFDBFE" opacity="0.9"/><rect x="${-W / 2 + 4}" y="${L / 2 - 14}" width="${W - 8}" height="6" rx="2" fill="#BFDBFE" opacity="0.7"/>${blink}${warn}${blue}${lbl}</g>`;
}
function bike(x, y, heading, color = "#7C3AED") {
  return `<g transform="translate(${x} ${y}) rotate(${heading})"><rect x="-3" y="-16" width="6" height="32" rx="3" fill="${color}"/><rect x="-9" y="-3" width="18" height="4" rx="2" fill="${color}"/><circle cx="0" cy="-2" r="5" fill="#FDE68A" stroke="#92400E" stroke-width="1"/></g>`;
}
function person(x, y, color = "#374151") { return `<g transform="translate(${x} ${y})"><circle cx="0" cy="0" r="6" fill="${color}"/><rect x="-9" y="-3" width="18" height="6" rx="3" fill="${color}" opacity="0.7"/></g>`; }
/** Pfeil für die beabsichtigte Fahrtrichtung */
function arrow(d, color = WHITE, width = 4) {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#ah-${color === WHITE ? "w" : "c"})"/>`;
}
const DEFS = `<defs><marker id="ah-w" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L8 4 L0 8 Z" fill="${WHITE}"/></marker><marker id="ah-c" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L8 4 L0 8 Z" fill="#FACC15"/></marker></defs>`;

/** Kreuzung 600×600: Straßen N/E/S/W (Auswahl), Mittellinie gestrichelt. */
function crossroad(arms = "NESW", { roadW = 120, size = 600, center = 300 } = {}) {
  const half = roadW / 2;
  let g = `<rect width="${size}" height="${size}" fill="${GRASS}"/>`;
  const has = (a) => arms.includes(a);
  if (has("N")) g += `<rect x="${center - half}" y="0" width="${roadW}" height="${center}" fill="${ASPHALT}"/>`;
  if (has("S")) g += `<rect x="${center - half}" y="${center}" width="${roadW}" height="${size - center}" fill="${ASPHALT}"/>`;
  if (has("W")) g += `<rect x="0" y="${center - half}" width="${center}" height="${roadW}" fill="${ASPHALT}"/>`;
  if (has("E")) g += `<rect x="${center}" y="${center - half}" width="${size - center}" height="${roadW}" fill="${ASPHALT}"/>`;
  // Mittellinien (bis zur Kreuzung)
  const dash = `stroke="${WHITE}" stroke-width="3" stroke-dasharray="18 14"`;
  if (has("N")) g += `<line x1="${center}" y1="0" x2="${center}" y2="${center - half}" ${dash}/>`;
  if (has("S")) g += `<line x1="${center}" y1="${center + half}" x2="${center}" y2="${size}" ${dash}/>`;
  if (has("W")) g += `<line x1="0" y1="${center}" x2="${center - half}" y2="${center}" ${dash}/>`;
  if (has("E")) g += `<line x1="${center + half}" y1="${center}" x2="${size}" y2="${center}" ${dash}/>`;
  // Fahrbahnränder
  const edge = `stroke="${WHITE}" stroke-width="3"`;
  const corners = [];
  if (has("N") && has("W")) corners.push(`M${center - half} 0 V${center - half} H0`); else if (has("N")) corners.push(`M${center - half} 0 V${center - half}`); else if (has("W")) corners.push(`M0 ${center - half} H${center - half}`);
  if (has("N") && has("E")) corners.push(`M${center + half} 0 V${center - half} H${size}`); else if (has("N")) corners.push(`M${center + half} 0 V${center - half}`); else if (has("E")) corners.push(`M${size} ${center - half} H${center + half}`);
  if (has("S") && has("W")) corners.push(`M${center - half} ${size} V${center + half} H0`); else if (has("S")) corners.push(`M${center - half} ${size} V${center + half}`); else if (has("W")) corners.push(`M0 ${center + half} H${center - half}`);
  if (has("S") && has("E")) corners.push(`M${center + half} ${size} V${center + half} H${size}`); else if (has("S")) corners.push(`M${center + half} ${size} V${center + half}`); else if (has("E")) corners.push(`M${size} ${center + half} H${center + half}`);
  // Bei T-Einmündung durchgehende Kante auf der fehlenden Seite
  if (!has("N") && has("W") && has("E")) corners.push(`M0 ${center - half} H${size}`);
  if (!has("S") && has("W") && has("E")) corners.push(`M0 ${center + half} H${size}`);
  if (!has("W") && has("N") && has("S")) corners.push(`M${center - half} 0 V${size}`);
  if (!has("E") && has("N") && has("S")) corners.push(`M${center + half} 0 V${size}`);
  g += `<path d="${corners.join(" ")}" fill="none" ${edge}/>`;
  return g;
}
const scene = (id, alt, w, h, inner) => emit("scene", id, alt, `${svgOpen(w, h, alt)}${DEFS}${inner}</svg>`);
const caption = (x, y, str, size = 15, fill = "#111827", anchor = "start") => text(x, y, size, str, fill, anchor);
const legend = (items, x = 14, y = 574) => items.map((it, i) => `<rect x="${x + i * 150}" y="${y - 12}" width="16" height="16" rx="4" fill="${it[0]}" stroke="#111827"/>${caption(x + i * 150 + 22, y + 1, it[1], 14)}`).join("");

// Vorfahrt 001: Kreuzung ohne Zeichen, Sie von Süden, Pkw von rechts (Osten)
scene("vorfahrt-rechts-vor-links", "Kreuzung ohne Verkehrszeichen: Ihr blaues Auto kommt von unten, ein rotes Auto von rechts. Beide wollen geradeaus.", 600, 600,
  crossroad("NESW") + car(330, 470, 0, CAR.you, "Sie") + arrow("M330 430 V330") + car(470, 270, -90, CAR.a, "A") + arrow("M430 270 H330") + legend([[CAR.you, "Sie"], [CAR.a, "Pkw von rechts"]]));
// Vorfahrt 002: T-Einmündung, Sie auf durchgehender Straße (W→E), Pkw von rechts (Süden)
scene("vorfahrt-t-einmuendung", "T-Einmündung ohne Verkehrszeichen: Ihr blaues Auto fährt auf der durchgehenden Straße nach rechts, ein rotes Auto kommt von unten aus der einmündenden Straße.", 600, 600,
  crossroad("WES") + car(130, 330, 90, CAR.you, "Sie") + arrow("M170 330 H280") + car(330, 470, 0, CAR.a, "A") + arrow("M330 430 V360") + legend([[CAR.you, "Sie (durchgehende Straße)"], [CAR.a, "Pkw von rechts"]]));
// Vorfahrt 003: Grundstücksausfahrt
scene("vorfahrt-grundstuecksausfahrt", "Ihr blaues Auto fährt aus einer Grundstücksausfahrt auf die Straße; auf der Straße kommt von links ein grünes Auto.", 600, 600,
  `<rect width="600" height="600" fill="${GRASS}"/><rect x="0" y="180" width="600" height="120" fill="${ASPHALT}"/><line x1="0" y1="240" x2="600" y2="240" stroke="${WHITE}" stroke-width="3" stroke-dasharray="18 14"/><path d="M0 180 H600 M0 300 H270 M330 300 H600" stroke="${WHITE}" stroke-width="3" fill="none"/><rect x="270" y="300" width="60" height="220" fill="#9CA3AF"/><rect x="200" y="330" width="60" height="190" rx="4" fill="#CBD5E1" stroke="#64748B"/><rect x="340" y="330" width="60" height="190" rx="4" fill="#CBD5E1" stroke="#64748B"/>${caption(300, 560, "Grundstück", 14, "#374151", "middle")}<path d="M270 300 V520 M330 300 V520" stroke="#6B7280" stroke-width="2"/>` +
  car(300, 400, 0, CAR.you, "Sie") + arrow("M300 360 V270") + car(90, 270, 90, CAR.b, "B") + arrow("M130 270 H230") + legend([[CAR.you, "Sie (aus Ausfahrt)"], [CAR.b, "Pkw auf der Straße"]]));
// Vorfahrt 004: Linksabbiegen mit Gegenverkehr
scene("vorfahrt-linksabbiegen-gegenverkehr", "Kreuzung: Ihr blaues Auto kommt von unten und will nach links abbiegen, ein rotes Auto kommt von oben entgegen und fährt geradeaus.", 600, 600,
  crossroad("NESW") + car(330, 470, 0, CAR.you, "Sie") + arrow("M330 430 V320 Q330 300 310 300 H230") + car(270, 130, 180, CAR.a, "A") + arrow("M270 170 V300") + legend([[CAR.you, "Sie (links abbiegen)"], [CAR.a, "Gegenverkehr geradeaus"]]));
// Vorfahrt 005: Vorfahrtstraße, Einsatzfahrzeug von links
scene("vorfahrt-einsatzfahrzeug", "Ihr blaues Auto fährt auf einer Vorfahrtstraße nach oben; von links nähert sich ein Einsatzfahrzeug mit Blaulicht.", 600, 600,
  crossroad("NESW") + signIn("306", 378, 400, 44) + car(330, 470, 0, CAR.you, "Sie") + arrow("M330 430 V330") + car(120, 330, 90, CAR.emergency, "", { bluelight: true }) + arrow("M160 330 H290") + caption(60, 300, "Einsatzfahrzeug mit Blaulicht und Horn", 14) + legend([[CAR.you, "Sie (Vorfahrtstraße)"], [CAR.emergency, "Einsatzfahrzeug"]]));
// Vorfahrt 006: abknickende Vorfahrt
scene("vorfahrt-abknickend", "Kreuzung mit abknickender Vorfahrtstraße: Die Vorfahrtstraße führt von unten nach links; Ihr blaues Auto folgt ihrem Verlauf.", 600, 600,
  crossroad("NESW") + `<path d="M330 600 V330 Q330 300 300 300 H0" fill="none" stroke="${YELLOW}" stroke-width="6" stroke-dasharray="1 0" opacity="0.6"/>` + signIn("306_1002-10", 372, 380, 80) + car(330, 470, 0, CAR.you, "Sie") + arrow("M330 430 V330 Q330 300 300 300 H200") + car(270, 120, 180, CAR.grey, "B") + car(480, 270, -90, CAR.grey, "C") + legend([[CAR.you, "Sie (folgen der Vorfahrtstraße)"], [CAR.grey, "wartepflichtig"]]));
// Vorfahrt 007: r-v-l, Fahrzeuge von rechts und links
scene("vorfahrt-rvl-drei", "Kreuzung mit rechts vor links: Ihr blaues Auto kommt von unten, ein rotes Auto von rechts, ein grünes Auto von links. Alle wollen geradeaus.", 600, 600,
  crossroad("NESW") + car(330, 470, 0, CAR.you, "Sie") + arrow("M330 430 V340") + car(470, 270, -90, CAR.a, "A") + arrow("M430 270 H340") + car(130, 330, 90, CAR.b, "B") + arrow("M170 330 H260") + legend([[CAR.you, "Sie"], [CAR.a, "von rechts"], [CAR.b, "von links"]]));
// Vorfahrt 008: Feldweg von rechts
scene("vorfahrt-feldweg", "Landstraße: Ihr blaues Auto fährt nach links, von rechts kommt ein grünes Auto aus einem unbefestigten Feldweg auf die Landstraße.", 600, 600,
  `<rect width="600" height="600" fill="${GRASS}"/><rect x="0" y="200" width="600" height="120" fill="${ASPHALT}"/><line x1="0" y1="260" x2="600" y2="260" stroke="${WHITE}" stroke-width="3" stroke-dasharray="18 14"/><path d="M0 200 H600 M0 320 H340 M420 320 H600" stroke="${WHITE}" stroke-width="3" fill="none"/><rect x="340" y="320" width="80" height="280" fill="#B08968"/><path d="M360 330 V600 M400 330 V600" stroke="#8B6B4E" stroke-width="3" stroke-dasharray="8 10"/>${caption(380, 560, "Feldweg", 14, "#3F2D1E", "middle")}` +
  car(200, 230, -90, CAR.you, "Sie") + arrow("M160 230 H60") + car(380, 430, 0, CAR.b, "B") + arrow("M380 390 V300") + legend([[CAR.you, "Sie (Landstraße)"], [CAR.b, "aus dem Feldweg"]]));
// Vorfahrt 010: Ampel dunkel
scene("vorfahrt-ampel-ausgefallen", "Kreuzung mit ausgefallener, dunkler Ampel und Zeichen 205 Vorfahrt gewähren an Ihrer Zufahrt: Ihr blaues Auto kommt von unten, ein rotes Auto von links auf der Vorfahrtstraße.", 600, 600,
  crossroad("NESW") + `<g transform="translate(376 372)"><rect x="0" y="0" width="22" height="58" rx="5" fill="#1F2937"/><circle cx="11" cy="12" r="6" fill="#4B5563"/><circle cx="11" cy="29" r="6" fill="#4B5563"/><circle cx="11" cy="46" r="6" fill="#4B5563"/></g>` + signIn("205", 372, 436, 30) + caption(410, 400, "Ampel dunkel", 13) + car(330, 490, 0, CAR.you, "Sie") + arrow("M330 450 V350") + car(130, 330, 90, CAR.a, "A") + arrow("M170 330 H280") + legend([[CAR.you, "Sie"], [CAR.a, "Pkw von links"]]));
// Vorfahrt 011: Rechtsabbiegen, Radfahrer geradeaus
scene("vorfahrt-rechtsabbiegen-radweg", "Ihr blaues Auto will nach rechts abbiegen; auf dem Radweg rechts neben Ihnen fährt ein Radfahrer geradeaus weiter.", 600, 600,
  crossroad("NESW") + `<rect x="360" y="360" width="26" height="240" fill="#B91C1C" opacity="0.55"/><rect x="360" y="0" width="26" height="240" fill="#B91C1C" opacity="0.55"/>${caption(400, 560, "Radweg", 13)}` + car(330, 470, 0, CAR.you, "Sie", { blink: "R" }) + arrow("M330 430 V350 Q330 330 350 330 H440") + bike(373, 430, 0) + arrow("M373 400 V250", "#FACC15", 3) + legend([[CAR.you, "Sie (rechts abbiegen)"], ["#7C3AED", "Radfahrer geradeaus"]]));

// Kreisverkehr
function roundabout(extra = "") {
  const r = 150; const road = 70;
  return `<rect width="600" height="600" fill="${GRASS}"/><rect x="265" y="0" width="70" height="600" fill="${ASPHALT}"/><rect x="0" y="265" width="600" height="70" fill="${ASPHALT}"/><circle cx="300" cy="300" r="${r + road / 2}" fill="${ASPHALT}"/><circle cx="300" cy="300" r="${r - road / 2}" fill="${GRASS}" stroke="${WHITE}" stroke-width="3"/><circle cx="300" cy="300" r="${r - road / 2 - 24}" fill="#A3B18A"/><g fill="none" stroke="${WHITE}" stroke-width="3"><path d="M265 0 V${300 - r - road / 2 + 10} M335 0 V${300 - r - road / 2 + 10} M265 600 V${300 + r + road / 2 - 10} M335 600 V${300 + r + road / 2 - 10} M0 265 H${300 - r - road / 2 + 10} M0 335 H${300 - r - road / 2 + 10} M600 265 H${300 + r + road / 2 - 10} M600 335 H${300 + r + road / 2 - 10}"/></g><path d="M300 ${300 - r} A${r} ${r} 0 1 0 ${300 + r} 300" fill="none" stroke="${WHITE}" stroke-width="2" stroke-dasharray="10 12"/>` +
    [0, 90, 180, 270].map((a) => `<g transform="rotate(${a} 300 300)"><path d="M300 ${300 - r - road / 2 - 4} L292 ${300 - r - road / 2 - 20} H308 Z" fill="${WHITE}" transform="rotate(-70 300 ${300 - r})"/></g>`).join("") + extra;
}
scene("kreisverkehr-beschildert", "Kreisverkehr mit Zeichen 215 und 205 an der Zufahrt: Ihr blaues Auto will von unten einfahren, ein rotes Auto fährt bereits im Kreis.", 600, 600,
  roundabout() + signIn("215_205", 345, 440, 70) + car(318, 520, 0, CAR.you, "Sie") + arrow("M318 480 V470") + car(150, 300, 180, CAR.a, "A", { length: 50, width: 26 }) + arrow("M150 330 Q170 420 250 445", "#FACC15", 3) + legend([[CAR.you, "Sie (einfahren)"], [CAR.a, "im Kreis"]]));
scene("kreisverkehr-ohne-zeichen", "Kreisverkehr ohne Verkehrszeichen: Ihr blaues Auto fährt im Kreis, ein rotes Auto will von rechts einfahren.", 600, 600,
  roundabout() + car(300, 465, 90, CAR.you, "Sie", { length: 50, width: 26 }) + arrow("M330 470 Q420 460 455 380", "#FFFFFF", 3) + car(520, 318, -90, CAR.a, "A") + arrow("M480 318 H472") + legend([[CAR.you, "Sie (im Kreis)"], [CAR.a, "will einfahren (von rechts)"]]));
scene("kreisverkehr-ausfahrt-zebrastreifen", "Kreisverkehr: Ihr blaues Auto verlässt den Kreis nach rechts; an der Ausfahrt liegt ein Zebrastreifen mit Fußgängern, ein Radfahrer nutzt den umlaufenden Radweg.", 600, 600,
  roundabout(`<g fill="${WHITE}">${[0, 1, 2, 3, 4].map((i) => `<rect x="${478 + i * 12}" y="266" width="7" height="68"/>`).join("")}</g><circle cx="300" cy="300" r="205" fill="none" stroke="#B91C1C" stroke-width="12" opacity="0.45"/>${caption(520, 250, "Zebrastreifen", 13)}`) +
  car(300, 465, 90, CAR.you, "Sie", { length: 50, width: 26, blink: "R" }) + arrow("M330 470 Q440 460 470 310", "#FFFFFF", 3) + person(505, 250) + person(520, 350) + bike(400, 490, -60) + legend([[CAR.you, "Sie (ausfahren)"], ["#7C3AED", "Radfahrer auf Radweg"], ["#374151", "Fußgänger"]]));
scene("kreisverkehr-richtung", "Kreisverkehr in Draufsicht: Die Pfeile zeigen die Fahrtrichtung im Kreis gegen den Uhrzeigersinn (rechts herum).", 600, 600,
  roundabout() + car(300, 465, 90, CAR.you, "Sie", { length: 50, width: 26 }) + arrow("M340 466 A165 165 0 0 0 466 340", "#FFFFFF", 4) + arrow("M466 260 A165 165 0 0 0 340 134", "#FFFFFF", 4) + arrow("M260 134 A165 165 0 0 0 134 260", "#FFFFFF", 4) + arrow("M134 340 A165 165 0 0 0 260 466", "#FFFFFF", 4));

// Autobahn-Szenen (Fahrtrichtung nach oben)
function motorway(lanes, { x0 = 90, laneW = 90, standstreifen = true } = {}) {
  const w = lanes * laneW;
  let g = `<rect width="600" height="600" fill="${GRASS}"/>`;
  if (standstreifen) g += `<rect x="${x0 + w}" y="0" width="60" height="600" fill="#7B8794"/><line x1="${x0 + w}" y1="0" x2="${x0 + w}" y2="600" stroke="${WHITE}" stroke-width="4"/>`;
  g += `<rect x="${x0}" y="0" width="${w}" height="600" fill="${ASPHALT}"/><line x1="${x0}" y1="0" x2="${x0}" y2="600" stroke="${WHITE}" stroke-width="4"/>`;
  for (let i = 1; i < lanes; i++) g += `<line x1="${x0 + i * laneW}" y1="0" x2="${x0 + i * laneW}" y2="600" stroke="${WHITE}" stroke-width="3" stroke-dasharray="22 18"/>`;
  g += `<rect x="${x0 - 30}" y="0" width="30" height="600" fill="#9CA3AF"/>`;
  return g;
}
scene("rettungsgasse-drei-fahrstreifen", "Autobahn mit drei Fahrstreifen bei stockendem Verkehr: Die Fahrzeuge auf dem linken Fahrstreifen weichen nach links aus, alle anderen nach rechts; die Rettungsgasse verläuft zwischen dem linken und dem mittleren Fahrstreifen.", 600, 600,
  motorway(3) + `<rect x="160" y="0" width="50" height="600" fill="#FEF3C7" opacity="0.55"/>` +
  [80, 200, 320, 440, 560].map((y) => car(118, y, 0, CAR.grey, "", { length: 52, width: 26 }) + car(246, y + 40, 0, CAR.grey, "", { length: 52, width: 26 }) + car(336, y + 10, 0, CAR.grey, "", { length: 52, width: 26 })).join("") +
  car(185, 520, 0, CAR.emergency, "", { length: 60, width: 28, bluelight: true }) + arrow("M185 480 V60", "#FACC15", 3) + caption(300, 30, "Fahrtrichtung ↑", 14, "#FFFFFF", "middle") + caption(20, 30, "links", 13) + caption(400, 30, "Standstreifen", 12, "#111827") );
scene("beschleunigungsstreifen", "Autobahnauffahrt: Ihr blaues Auto beschleunigt auf dem Beschleunigungsstreifen rechts und fädelt in eine Lücke auf dem rechten Fahrstreifen ein; auf der Autobahn fahren graue Fahrzeuge.", 600, 600,
  motorway(2, { standstreifen: false }) + `<path d="M270 600 H360 L360 330 Q360 250 270 200 Z" fill="${ASPHALT}"/><line x1="270" y1="600" x2="270" y2="200" stroke="${WHITE}" stroke-width="3" stroke-dasharray="14 14"/><path d="M360 600 V330 Q360 250 270 200" fill="none" stroke="${WHITE}" stroke-width="4"/>` +
  car(135, 150, 0, CAR.grey, "", { length: 52, width: 26 }) + car(225, 90, 0, CAR.grey, "", { length: 52, width: 26 }) + car(225, 420, 0, CAR.grey, "", { length: 52, width: 26 }) + car(315, 520, 0, CAR.you, "Sie") + arrow("M315 480 V380 Q315 300 225 260") + caption(380, 480, "Beschleunigungs-", 13) + caption(380, 498, "streifen", 13) + legend([[CAR.you, "Sie (auffahren)"], [CAR.grey, "Verkehr auf der Autobahn"]]));
scene("reissverschluss", "Ein Fahrstreifen endet: Die Fahrzeuge des endenden rechten Fahrstreifens fädeln erst unmittelbar an der Engstelle abwechselnd (Reißverschluss) in den linken Fahrstreifen ein.", 600, 600,
  motorway(2, { standstreifen: false }) + `<path d="M270 0 H360 V220 Q360 300 270 320 Z" fill="${GRASS}"/><path d="M360 220 Q360 300 270 320" fill="none" stroke="${WHITE}" stroke-width="4"/><rect x="330" y="120" width="60" height="90" fill="${GRASS}"/>` +
  car(225, 540, 0, CAR.grey, "1", { length: 52, width: 26 }) + car(225, 440, 0, CAR.grey, "3", { length: 52, width: 26 }) + car(225, 340, 0, CAR.grey, "5", { length: 52, width: 26 }) + car(315, 490, 0, CAR.you, "2", { length: 52, width: 26 }) + car(315, 390, 0, CAR.grey, "4", { length: 52, width: 26 }) + arrow("M315 350 Q315 300 250 270") + arrow("M225 300 V120") + caption(390, 100, "Fahrstreifen endet", 13) + caption(20, 30, "Reihenfolge 1 – 2 – 3 – 4 – 5", 14));
scene("stau-rechts-schneller", "Autobahn: Auf dem linken Fahrstreifen steht eine langsame Fahrzeugschlange, Ihr blaues Auto fährt auf dem rechten Fahrstreifen.", 600, 600,
  motorway(2) + [60, 150, 240, 330, 420, 510].map((y) => car(135, y, 0, CAR.grey, "", { length: 52, width: 26 })).join("") + car(225, 480, 0, CAR.you, "Sie") + arrow("M225 440 V300") + caption(20, 30, "Schlange links: sehr langsam", 14) + legend([[CAR.you, "Sie (rechts)"], [CAR.grey, "Fahrzeugschlange"]]));
scene("stauende-warnblinklicht", "Autobahn: Vor Ihrem blauen Auto steht ein Stauende; die vorderen Fahrzeuge haben das Warnblinklicht eingeschaltet.", 600, 600,
  motorway(3) + [60, 130, 200].map((y) => car(135, y, 0, CAR.grey, "", { length: 52, width: 26 }) + car(225, y + 30, 0, CAR.grey, "", { length: 52, width: 26 }) + car(315, y + 10, 0, CAR.grey, "", { length: 52, width: 26 })).join("") + car(225, 290, 0, CAR.grey, "", { length: 52, width: 26, warn: true }) + car(315, 270, 0, CAR.grey, "", { length: 52, width: 26, warn: true }) + car(225, 520, 0, CAR.you, "Sie") + arrow("M225 480 V340") + caption(20, 30, "Stauende voraus", 14) + legend([[CAR.you, "Sie"], ["#FACC15", "Warnblinklicht"]]));
scene("panne-warndreieck-autobahn", "Panne auf der Autobahn: Das Fahrzeug steht auf dem Standstreifen, das Warndreieck ist rund 150 m dahinter aufgestellt, die Insassen warten hinter der Leitplanke.", 600, 600,
  motorway(2) + car(300, 120, 0, CAR.you, "", { warn: true }) + `<path d="M300 480 L288 502 H312 Z" fill="${RED}" stroke="${WHITE}" stroke-width="2"/><path d="M300 486 L293 498 H307 Z" fill="${WHITE}"/>` + `<path d="M330 140 V470" stroke="#111827" stroke-width="2" stroke-dasharray="6 6"/><path d="M322 140 H338 M322 470 H338" stroke="#111827" stroke-width="2"/>` + caption(345, 310, "ca. 150 m", 15) + caption(345, 330, "(Landstraße: ca. 100 m)", 12) + person(360, 100) + person(378, 100) + caption(20, 30, "Warndreieck aufstellen", 14));
scene("notrufsaeule-leitpfosten", "Leitpfosten am Straßenrand mit schwarzem Pfeil: Der Pfeil zeigt die Richtung zur nächsten Notrufsäule.", 600, 400,
  `<rect width="600" height="400" fill="${GRASS}"/><rect x="0" y="120" width="600" height="140" fill="${ASPHALT}"/><line x1="0" y1="260" x2="600" y2="260" stroke="${WHITE}" stroke-width="4"/><g transform="translate(240 270)"><rect x="0" y="0" width="34" height="110" rx="3" fill="${WHITE}" stroke="#374151"/><rect x="0" y="0" width="34" height="14" fill="#111827"/><rect x="6" y="36" width="22" height="8" fill="#FFFFFF" stroke="#374151"/><path d="M4 70 H24 V62 L32 74 L24 86 V78 H4 Z" fill="#111827"/></g>${caption(290, 330, "Pfeil → Richtung zur nächsten Notrufsäule", 15)}<g transform="translate(500 60)"><rect x="0" y="0" width="36" height="70" rx="4" fill="#F59E0B" stroke="#92400E"/>${text(18, 42, 18, "SOS", "#111827")}</g>${caption(470, 150, "Notrufsäule", 13)}`);

// Fahrmanöver / andere Teilnehmer
scene("linksabbieger-begegnen", "Kreuzung: Ihr blaues Auto von unten und ein rotes Auto von oben wollen beide links abbiegen; sie biegen voreinander ab.", 600, 600,
  crossroad("NESW") + car(330, 470, 0, CAR.you, "Sie") + arrow("M330 430 V330 Q330 310 310 310 H220") + car(270, 130, 180, CAR.a, "A") + arrow("M270 170 V270 Q270 290 290 290 H380") + legend([[CAR.you, "Sie (links)"], [CAR.a, "Gegenverkehr (links)"]]));
scene("hindernis-gegenverkehr", "Auf Ihrer Fahrbahnseite parkt ein graues Auto; Ihr blaues Auto müsste auf die Gegenfahrbahn ausweichen, dort kommt ein rotes Auto entgegen.", 600, 600,
  `<rect width="600" height="600" fill="${GRASS}"/><rect x="180" y="0" width="240" height="600" fill="${ASPHALT}"/><line x1="300" y1="0" x2="300" y2="600" stroke="${WHITE}" stroke-width="3" stroke-dasharray="18 14"/><path d="M180 0 V600 M420 0 V600" stroke="${WHITE}" stroke-width="3"/>` + car(392, 250, 0, CAR.grey, "P", { length: 56, width: 28 }) + car(360, 500, 0, CAR.you, "Sie") + arrow("M360 460 V380 Q360 340 310 320 V180 Q310 150 360 140") + car(240, 100, 180, CAR.a, "A") + arrow("M240 140 V300") + legend([[CAR.you, "Sie"], [CAR.grey, "parkendes Fahrzeug"], [CAR.a, "Gegenverkehr"]]));
scene("ueberholabstand-radfahrer", "Ihr blaues Auto überholt einen Radfahrer mit seitlichem Abstand: innerorts mindestens 1,5 m, außerorts mindestens 2 m.", 600, 400,
  `<rect width="600" height="400" fill="${GRASS}"/><rect x="0" y="80" width="600" height="240" fill="${ASPHALT}"/><line x1="0" y1="200" x2="600" y2="200" stroke="${WHITE}" stroke-width="3" stroke-dasharray="18 14"/><path d="M0 80 H600 M0 320 H600" stroke="${WHITE}" stroke-width="3"/>` + bike(200, 290, 90) + car(200, 170, 90, CAR.you, "Sie") + arrow("M240 170 H420") + `<path d="M260 190 V282" stroke="#FACC15" stroke-width="3"/><path d="M252 190 H268 M252 282 H268" stroke="#FACC15" stroke-width="3"/>` + caption(275, 245, "≥ 1,5 m innerorts / ≥ 2 m außerorts", 15, "#FFFFFF"));
scene("zebrastreifen-fussgaenger", "Fußgängerüberweg (Zebrastreifen) mit Zeichen 350: Eine Person steht am Rand und will die Straße überqueren, Ihr blaues Auto nähert sich.", 600, 600,
  `<rect width="600" height="600" fill="${GRASS}"/><rect x="180" y="0" width="240" height="600" fill="${ASPHALT}"/><line x1="300" y1="0" x2="300" y2="220" stroke="${WHITE}" stroke-width="3" stroke-dasharray="18 14"/><line x1="300" y1="380" x2="300" y2="600" stroke="${WHITE}" stroke-width="3" stroke-dasharray="18 14"/><path d="M180 0 V600 M420 0 V600" stroke="${WHITE}" stroke-width="3"/><g fill="${WHITE}">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${190 + i * 28}" y="260" width="16" height="80"/>`).join("")}</g>` + signIn("350-10", 430, 200, 46) + person(445, 300) + `<path d="M430 300 H400" stroke="#374151" stroke-width="3" marker-end="url(#ah-c)"/>` + car(360, 500, 0, CAR.you, "Sie") + arrow("M360 460 V400") + legend([[CAR.you, "Sie"], ["#374151", "Fußgänger will queren"]]));
scene("linienbus-warnblinklicht", "Ein Linienbus steht mit eingeschaltetem Warnblinklicht an einer Haltestelle (Zeichen 224); Ihr blaues Auto nähert sich von hinten, Gegenverkehr kommt entgegen.", 600, 600,
  `<rect width="600" height="600" fill="${GRASS}"/><rect x="180" y="0" width="240" height="600" fill="${ASPHALT}"/><line x1="300" y1="0" x2="300" y2="600" stroke="${WHITE}" stroke-width="3" stroke-dasharray="18 14"/><path d="M180 0 V600 M420 0 V600" stroke="${WHITE}" stroke-width="3"/>` + signIn("224", 440, 170, 40) + car(385, 230, 0, CAR.bus, "BUS", { length: 120, width: 34, warn: true }) + person(450, 260) + person(465, 280) + car(360, 500, 0, CAR.you, "Sie") + arrow("M360 460 V330") + car(240, 90, 180, CAR.grey, "", { length: 52, width: 26 }) + legend([[CAR.you, "Sie"], [CAR.bus, "Bus mit Warnblinklicht"], [CAR.grey, "Gegenverkehr"]]));
scene("einsatzfahrzeug-hinten", "Innerorts: Hinter Ihrem blauen Auto nähert sich ein Einsatzfahrzeug mit Blaulicht und Horn; Sie machen Platz und weichen nach rechts aus.", 600, 600,
  `<rect width="600" height="600" fill="${GRASS}"/><rect x="180" y="0" width="240" height="600" fill="${ASPHALT}"/><line x1="300" y1="0" x2="300" y2="600" stroke="${WHITE}" stroke-width="3" stroke-dasharray="18 14"/><path d="M180 0 V600 M420 0 V600" stroke="${WHITE}" stroke-width="3"/>` + car(360, 300, 0, CAR.you, "Sie", { blink: "R" }) + arrow("M360 260 V180 Q360 150 395 140 V60") + car(360, 520, 0, CAR.emergency, "", { bluelight: true, length: 60 }) + arrow("M360 480 V380", "#FACC15", 3) + car(240, 120, 180, CAR.grey, "", { length: 52, width: 26 }) + legend([[CAR.you, "Sie (Platz machen)"], [CAR.emergency, "Einsatzfahrzeug"]]));
scene("halten-parken-kreuzung-5m", "Kreuzung mit markierten 5 m Abstand vor und hinter den Schnittpunkten der Fahrbahnkanten; in diesem Bereich ist Parken verboten.", 600, 600,
  crossroad("NESW") + `<g fill="${RED}" opacity="0.35"><rect x="360" y="360" width="18" height="70"/><rect x="222" y="360" width="18" height="70"/><rect x="360" y="170" width="18" height="70"/><rect x="222" y="170" width="18" height="70"/><rect x="360" y="360" width="70" height="18"/><rect x="360" y="222" width="70" height="18"/><rect x="170" y="360" width="70" height="18"/><rect x="170" y="222" width="70" height="18"/></g><path d="M395 360 V430" stroke="#111827" stroke-width="2"/><path d="M388 360 H402 M388 430 H402" stroke="#111827" stroke-width="2"/>${caption(405, 400, "5 m", 16)}${caption(405, 420, "(8 m bei Radweg)", 12)}` + car(392, 500, 0, CAR.grey, "P") + caption(20, 30, "Schnittpunkt der Fahrbahnkanten", 13));
scene("schutzstreifen-radverkehr", "Straße mit Schutzstreifen für den Radverkehr (gestrichelte Linie mit Fahrradsymbol) am rechten Fahrbahnrand.", 600, 400,
  `<rect width="600" height="400" fill="${GRASS}"/><rect x="0" y="60" width="600" height="280" fill="${ASPHALT}"/><line x1="0" y1="200" x2="600" y2="200" stroke="${WHITE}" stroke-width="3" stroke-dasharray="18 14"/><path d="M0 60 H600 M0 340 H600" stroke="${WHITE}" stroke-width="3"/><line x1="0" y1="290" x2="600" y2="290" stroke="${WHITE}" stroke-width="4" stroke-dasharray="14 14"/>${pict(P.bicycle.replaceAll(BLACK, WHITE), 60, 292, 44)}${pict(P.bicycle.replaceAll(BLACK, WHITE), 400, 292, 44)}` + bike(240, 315, 90) + car(200, 245, 90, CAR.you, "Sie") + caption(20, 380, "Schutzstreifen: gestrichelt, mit Fahrradsymbol", 14));

// Lichtzeichen / Verkehrsregelung
function ampel(x, y, state, { scale = 1, arrow: arr = null } = {}) {
  const on = (c, s) => (state.includes(s) ? c : "#374151");
  const lamp = (cy, color, key, glyph = "") => `<circle cx="34" cy="${cy}" r="24" fill="${on(color, key)}" stroke="#111827" stroke-width="2"/>${glyph}`;
  const arrowGlyph = arr ? `<path d="M22 154 H38 V142 L58 160 L38 178 V166 H22 Z" fill="#111827" transform="${arr === "L" ? "rotate(180 34 160)" : ""}"/>` : "";
  return `<g transform="translate(${x} ${y}) scale(${scale})"><rect x="0" y="0" width="68" height="196" rx="10" fill="#1F2937"/>${lamp(38, "#E30613", "r")}${lamp(98, "#FFD400", "y")}${lamp(158, "#00A651", "g", arrowGlyph)}</g>`;
}
function ampelScene(id, alt, state, note, extra = "", arr = null) {
  scene(id, alt, 600, 400, `<rect width="600" height="400" fill="#F3F4F6"/>${ampel(120, 40, state, { scale: 1.5, arrow: arr })}${caption(260, 110, note[0], 21)}${note.slice(1).map((n, i) => caption(260, 150 + i * 28, n, 14, "#374151")).join("")}${extra}`);
}
ampelScene("ampel-gelb", "Ampel zeigt Gelb (nur die mittlere Leuchte an).", "y", ["Gelb", "„Vor der Kreuzung auf das nächste Zeichen warten“", "Anhalten, wenn es gefahrlos möglich ist."]);
ampelScene("ampel-rot-gelb", "Ampel zeigt Rot und Gelb gleichzeitig.", "ry", ["Rot und Gelb", "Ankündigung von Grün", "Anfahren erst bei Grün."]);
ampelScene("ampel-gruenpfeil-links", "Ampel zeigt einen grün leuchtenden Pfeil nach links.", "g", ["Grüner Pfeil nach links", "Nur Linksabbiegen ist freigegeben,", "der Gegenverkehr ist durch Rot gesperrt."], "", "L");
ampelScene("ampel-rot-gruenpfeilschild", "Rote Ampel mit Grünpfeilschild (Zeichen 720) rechts neben dem roten Licht.", "r", ["Rot mit Grünpfeilschild", "Rechts abbiegen erst nach Anhalten,", "wenn niemand behindert oder gefährdet wird."], signIn("720", 470, 60, 90));
ampelScene("ampel-gruen-fussgaenger", "Ampel zeigt Grün, aber ein Fußgänger befindet sich noch auf der Fahrbahn.", "g", ["Grün, Fußgänger noch auf der Fahrbahn", "Grün heißt: Fahren erlaubt, aber", "Fußgänger dürfen die Fahrbahn zu Ende überqueren."], `<g transform="translate(470 250)">${person(0, 0)}</g><rect x="400" y="290" width="160" height="50" fill="${ASPHALT}"/><g fill="${WHITE}">${[0, 1, 2, 3, 4].map((i) => `<rect x="${410 + i * 30}" y="295" width="14" height="40"/>`).join("")}</g>`);
scene("polizist-seitlich", "Ein Polizeibeamter steht Ihnen mit der Brust zugewandt und hat beide Arme seitlich ausgestreckt, also quer zu Ihrer Fahrtrichtung: Das bedeutet Halt vor der Kreuzung (wie Rot). Wer in Richtung der Arme fährt, hat freie Fahrt.", 600, 400,
  `<rect width="600" height="400" fill="#F3F4F6"/><g transform="translate(300 60)"><circle cx="0" cy="0" r="22" fill="#F5D0A9" stroke="#111827" stroke-width="2"/><path d="M-26 -8 Q0 -30 26 -8 L26 -2 H-26 Z" fill="#1E3A8A"/><rect x="-34" y="26" width="68" height="110" rx="14" fill="#1E3A8A"/><rect x="-150" y="40" width="116" height="22" rx="11" fill="#1E3A8A"/><rect x="34" y="40" width="116" height="22" rx="11" fill="#1E3A8A"/><rect x="-150" y="36" width="24" height="30" rx="6" fill="${WHITE}" stroke="#111827"/><rect x="126" y="36" width="24" height="30" rx="6" fill="${WHITE}" stroke="#111827"/><rect x="-30" y="136" width="24" height="90" rx="8" fill="#111827"/><rect x="6" y="136" width="24" height="90" rx="8" fill="#111827"/></g>${caption(300, 320, "Arme seitlich ausgestreckt, quer zu Ihrer Fahrtrichtung", 17, "#111827", "middle")}${caption(300, 350, "= Halt vor der Kreuzung (wie Rot)", 20, RED, "middle")}${caption(300, 380, "Von vorn oder hinten gesehen: Halt. Von der Seite (in Armrichtung): frei.", 13, "#374151", "middle")}`);
scene("dauerlichtzeichen-rotes-kreuz", "Über den Fahrstreifen einer Autobahn hängen Dauerlichtzeichen: rotes Kreuz über dem linken Fahrstreifen, grüne Pfeile über den anderen.", 600, 400,
  `<rect width="600" height="400" fill="#F3F4F6"/><rect x="60" y="200" width="480" height="200" fill="${ASPHALT}"/><g stroke="${WHITE}" stroke-width="3" stroke-dasharray="18 14"><path d="M220 200 V400 M380 200 V400"/></g><rect x="40" y="70" width="520" height="14" fill="#374151"/>${[[140, "x"], [300, "v"], [460, "v"]].map(([x, k]) => `<rect x="${x - 40}" y="84" width="80" height="80" rx="8" fill="#111827"/>${k === "x" ? `<path d="M${x - 22} 102 L${x + 22} 146 M${x + 22} 102 L${x - 22} 146" stroke="#E30613" stroke-width="10" stroke-linecap="round"/>` : `<path d="M${x} 100 V148 M${x - 18} 130 L${x} 150 L${x + 18} 130" fill="none" stroke="#00A651" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`}`).join("")}${caption(140, 190, "gesperrt", 14, "#111827", "middle")}${caption(300, 190, "frei", 14, "#111827", "middle")}${caption(460, 190, "frei", 14, "#111827", "middle")}`);
scene("gelbes-blinklicht", "Gelbes Blinklicht an einer Baustelle mit Zeichen 123: Es warnt vor einer Gefahrstelle.", 600, 400,
  `<rect width="600" height="400" fill="#F3F4F6"/><rect x="0" y="260" width="600" height="140" fill="${ASPHALT}"/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${60 + i * 90}" y="250" width="50" height="60" rx="4" fill="${WHITE}" stroke="#374151"/><path d="M${60 + i * 90} 270 L${110 + i * 90} 250 V270 L${60 + i * 90} 290 Z M${60 + i * 90} 300 L${110 + i * 90} 280 V300 L${60 + i * 90} 310 Z" fill="${RED}"/>${i % 2 === 0 ? `<circle cx="${85 + i * 90}" cy="236" r="12" fill="#FACC15" stroke="#B45309" stroke-width="2"/><circle cx="${85 + i * 90}" cy="236" r="20" fill="none" stroke="#FACC15" stroke-width="2" opacity="0.5"/>` : ""}`).join("")}${signIn("123", 440, 40, 130)}${caption(60, 90, "Gelbes Blinklicht = Warnung vor einer Gefahrstelle", 18)}${caption(60, 120, "Kein Halt- oder Vorfahrtsgebot, aber besondere Vorsicht.", 14, "#374151")}`);
scene("bahnuebergang-rotlicht", "Bahnübergang: Andreaskreuz mit rotem Blinklicht, die Halbschranke ist noch geöffnet; Ihr blaues Auto muss vor dem Andreaskreuz halten.", 600, 600,
  `<rect width="600" height="600" fill="${GRASS}"/><rect x="180" y="0" width="240" height="600" fill="${ASPHALT}"/><rect x="0" y="250" width="600" height="80" fill="#9CA3AF"/><g stroke="#4B5563" stroke-width="6"><path d="M0 270 H600 M0 310 H600"/></g>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => `<rect x="${i * 52}" y="262" width="20" height="56" fill="#78350F"/>`).join("")}<line x1="300" y1="0" x2="300" y2="600" stroke="${WHITE}" stroke-width="3" stroke-dasharray="18 14"/><path d="M180 0 V600 M420 0 V600" stroke="${WHITE}" stroke-width="3"/><line x1="180" y1="370" x2="300" y2="370" stroke="${WHITE}" stroke-width="8"/>` + signIn("201-50", 428, 350, 60) + `<circle cx="458" cy="425" r="12" fill="#E30613" stroke="#111827" stroke-width="2"/><circle cx="458" cy="425" r="20" fill="none" stroke="#E30613" stroke-width="2" opacity="0.5"/><g transform="translate(430 340)"><rect x="0" y="-4" width="8" height="8" fill="#374151"/><rect x="0" y="-90" width="8" height="86" fill="${WHITE}" stroke="${RED}" stroke-width="2" stroke-dasharray="12 12"/></g>${caption(470, 400, "Rotlicht", 13)}${caption(470, 340, "Schranke offen", 13)}` + car(360, 470, 0, CAR.you, "Sie") + arrow("M360 430 V385") + caption(20, 30, "Halt vor dem Andreaskreuz", 14));
scene("bahnuebergang-baken", "Außerorts: Vor einem Bahnübergang stehen rechts die Baken mit drei, zwei und einem Streifen (240 m, 160 m, 80 m); am Übergang das Andreaskreuz.", 600, 600,
  `<rect width="600" height="600" fill="${GRASS}"/><rect x="180" y="0" width="240" height="600" fill="${ASPHALT}"/><rect x="0" y="70" width="600" height="60" fill="#9CA3AF"/><g stroke="#4B5563" stroke-width="5"><path d="M0 85 H600 M0 115 H600"/></g><line x1="300" y1="130" x2="300" y2="600" stroke="${WHITE}" stroke-width="4"/><path d="M180 0 V600 M420 0 V600" stroke="${WHITE}" stroke-width="3"/>` +
  [[520, 3, "240 m"], [380, 2, "160 m"], [240, 1, "80 m"]].map(([y, n, l]) => `<rect x="432" y="${y - 30}" width="14" height="60" fill="${WHITE}" stroke="#374151"/>${Array.from({ length: n }, (_, i) => `<path d="M432 ${y - 24 + i * 18} L446 ${y - 30 + i * 18} V${y - 20 + i * 18} L432 ${y - 14 + i * 18} Z" fill="${RED}"/>`).join("")}${caption(455, y + 5, l, 13)}`).join("") + signIn("201-50", 428, 132, 44) + car(360, 540, 0, CAR.you, "Sie") + caption(20, 30, "Ab der ersten Bake: Überholverbot", 14) + `<path d="M300 560 V140" stroke="${RED}" stroke-width="2" stroke-dasharray="6 6" opacity="0.6"/>`);

// Schemazeichnungen
scene("anhalteweg-schema", "Schema Anhalteweg: Der Anhalteweg besteht aus dem Reaktionsweg (Fahrzeug fährt noch ungebremst weiter) und dem Bremsweg.", 600, 300,
  `<rect width="600" height="300" fill="#F3F4F6"/><rect x="0" y="120" width="600" height="90" fill="${ASPHALT}"/><path d="M0 120 H600 M0 210 H600" stroke="${WHITE}" stroke-width="3"/>` + car(70, 165, 90, CAR.you) + `<rect x="100" y="230" width="180" height="14" rx="4" fill="#FACC15"/><rect x="280" y="230" width="260" height="14" rx="4" fill="${RED}"/>${caption(190, 270, "Reaktionsweg", 14, "#111827", "middle")}${caption(190, 288, "(km/h ÷ 10) × 3", 12, "#374151", "middle")}${caption(410, 270, "Bremsweg", 14, "#111827", "middle")}${caption(410, 288, "(km/h ÷ 10)²  ·  Gefahrenbremsung: ÷ 2", 12, "#374151", "middle")}<path d="M100 60 H540" stroke="#111827" stroke-width="2" marker-end="url(#ah-c)"/><path d="M100 52 V68" stroke="#111827" stroke-width="2"/>${caption(320, 48, "Anhalteweg = Reaktionsweg + Bremsweg", 16, "#111827", "middle")}<circle cx="100" cy="165" r="0"/>${caption(70, 105, "Gefahr erkannt", 12, "#374151", "middle")}<path d="M540 130 V200" stroke="${WHITE}" stroke-width="4"/>${caption(540, 105, "Stillstand", 12, "#374151", "middle")}`);
scene("abstand-halber-tacho", "Schema Sicherheitsabstand: Bei 100 km/h beträgt der Abstand nach der Regel halber Tacho mindestens 50 m; außerorts hilft die Zwei-Sekunden-Regel.", 600, 300,
  `<rect width="600" height="300" fill="#F3F4F6"/><rect x="0" y="120" width="600" height="90" fill="${ASPHALT}"/><path d="M0 120 H600 M0 210 H600" stroke="${WHITE}" stroke-width="3"/>` + car(90, 165, 90, CAR.you, "Sie") + car(500, 165, 90, CAR.grey) + `<path d="M130 240 H460" stroke="#111827" stroke-width="2"/><path d="M130 232 V248 M460 232 V248" stroke="#111827" stroke-width="2"/>${caption(295, 270, "halber Tacho: 100 km/h → mindestens 50 m", 15, "#111827", "middle")}${caption(295, 290, "Zwei-Sekunden-Regel: Fixpunkt, dann „einundzwanzig, zweiundzwanzig“", 12, "#374151", "middle")}${caption(295, 60, "Sicherheitsabstand", 18, "#111827", "middle")}`);

fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
fs.writeFileSync(path.join(ROOT, "src", "signs.catalog.ts"), `// Automatisch erzeugt von scripts/gen-media.mjs. Nicht von Hand ändern.\nimport type { SignEntry } from "./signs.js";\n\nexport const SIGN_CATALOG: readonly SignEntry[] = ${JSON.stringify(CATALOG.map((e) => ({ id: e.id, number: e.number, name: e.name, category: e.category, meaning: e.meaning, alt: e.alt, file: `signs/${e.id}.svg`, ...(e.note ? { note: e.note } : {}) })), null, 2)};\n`);
fs.writeFileSync(path.join(ROOT, "src", "media.manifest.ts"), `// Automatisch erzeugt von scripts/gen-media.mjs. Nicht von Hand ändern.\nimport type { MediaItem } from "./media.js";\n\nexport const MEDIA_MANIFEST: readonly MediaItem[] = ${JSON.stringify(manifest, null, 2)};\n`);
console.log(`${CATALOG.length} Katalogzeichen, ${manifest.length} Medien erzeugt (${manifest.filter((m) => m.kind === "sign").length} Zeichen, ${manifest.filter((m) => m.kind === "scene").length} Grafiken)`);
