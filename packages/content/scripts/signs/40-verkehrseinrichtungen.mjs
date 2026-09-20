// Verkehrseinrichtungen (StVO Anlage 4, Abschnitt 1 Absperrgeräte und Leiteinrichtungen). Rot-weiße Schraffuren,
// Streifen fallen jeweils zu der Seite ab, an der vorbeizufahren ist.
import { svgOpen, text, BLACK, WHITE, RED, BLUE, YELLOW } from "../lib/sign-kit.mjs";

const CAT = "verkehrseinrichtungen";
let uid = 0;

/**
 * Rot-weiß schräg gestreiftes Rechteck. dir "left": Streifen fallen nach links ab (Vorbeifahrt links),
 * "right": nach rechts, "both": Winkel mit Spitze oben (doppelseitig, Vorbeifahrt beidseits).
 */
function striped(x, y, w, h, { dir = "left", t = 24, period = 48, slope = 1, border = 1.5 } = {}) {
  const cid = `c${++uid}`;
  const band = (x0, x1, y0L, y0R) => `<path d="M${x0} ${y0L} L${x1} ${y0R} V${y0R + t} L${x0} ${y0L + t} Z"/>`;
  let bands = "";
  const halves = dir === "both" ? [[0, w / 2, "left"], [w / 2, w, "right"]] : [[0, w, dir]];
  for (const [x0, x1, d] of halves) {
    const rise = slope * (x1 - x0);
    for (let y0 = -rise - period * 2; y0 < h + rise + period; y0 += period) {
      // "left": am linken Rand tiefer (y größer), am rechten Rand höher
      bands += d === "left" ? band(x0, x1, y0 + rise, y0) : band(x0, x1, y0, y0 + rise);
    }
  }
  return `<defs><clipPath id="${cid}"><rect x="0" y="0" width="${w}" height="${h}"/></clipPath></defs><g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" fill="${WHITE}"/><g fill="${RED}" clip-path="url(#${cid})">${bands}</g><rect width="${w}" height="${h}" fill="none" stroke="${BLACK}" stroke-width="${border}"/></g>`;
}

/** Zeichen 222 (Vorgeschriebene Vorbeifahrt) als kleine Einblendung: blauer Kreis, weißer Pfeil schräg nach unten */
function pass222(cx, cy, r, dir) {
  const rot = dir === "left" ? 225 : 135;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${BLUE}"/><circle cx="${cx}" cy="${cy}" r="${r * 0.9}" fill="none" stroke="${WHITE}" stroke-width="${r * 0.06}"/><g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${r / 50})"><path d="M0 -36 L18 -10 H8 V36 H-8 V-10 H-18 Z" fill="${WHITE}"/></g>`;
}

const lamp = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${YELLOW}" stroke="${BLACK}" stroke-width="1.5"/>`;

// ---------------------------------------------------------------------------------------------
// Zeichnungen
// ---------------------------------------------------------------------------------------------
function absperrschranke(title) {
  return `${svgOpen(260, 120, title)}<g fill="#374151"><rect x="34" y="60" width="8" height="42"/><rect x="218" y="60" width="8" height="42"/><rect x="16" y="100" width="44" height="6" rx="2"/><rect x="200" y="100" width="44" height="6" rx="2"/></g>${striped(14, 26, 232, 36, { dir: "left", t: 22, period: 44 })}</svg>`;
}

/** Leitbake: schmal = schmale Ausführung, dir = Richtung der Vorbeifahrt */
function leitbake(dir, schmal, title) {
  const w = schmal ? 22 : 44;
  const h = 160;
  const x = 60 - w / 2;
  return `${svgOpen(120, 190, title)}<rect x="56" y="${h + 8}" width="8" height="14" fill="#374151"/><rect x="40" y="${h + 20}" width="40" height="5" rx="2" fill="#374151"/>${striped(x, 8, w, h, { dir, t: 28, period: 56 })}</svg>`;
}

/** Pfeilbake: weiße Tafel mit rotem Pfeil in Richtung der Vorbeifahrt */
function pfeilbake(dir, title) {
  const arrow = `<path d="M4 80 L26 48 V68 H40 V92 H26 V112 Z" fill="${RED}"/>`;
  const g = dir === "left" ? arrow : `<g transform="translate(44 0) scale(-1 1)">${arrow}</g>`;
  return `${svgOpen(120, 190, title)}<rect x="56" y="168" width="8" height="14" fill="#374151"/><rect x="40" y="180" width="40" height="5" rx="2" fill="#374151"/><rect x="38" y="8" width="44" height="160" fill="${WHITE}" stroke="${BLACK}" stroke-width="1.5"/><g transform="translate(38 8)">${g}</g></svg>`;
}

function leitkegel(title) {
  const cid = `c${++uid}`;
  return `${svgOpen(120, 160, title)}<defs><clipPath id="${cid}"><path d="M54 10 H66 L90 138 H30 Z"/></clipPath></defs><path d="M54 10 H66 L90 138 H30 Z" fill="${RED}"/><g fill="${WHITE}" clip-path="url(#${cid})"><rect x="0" y="44" width="120" height="22"/><rect x="0" y="90" width="120" height="22"/></g><path d="M54 10 H66 L90 138 H30 Z" fill="none" stroke="${BLACK}" stroke-width="1.5"/><rect x="18" y="136" width="84" height="14" rx="3" fill="#374151"/></svg>`;
}

/** Fahrbare Absperrtafel: gestreifte Tafel mit Zeichen 222, gelben Leuchten und Rädern; blink = mit Blinkpfeil */
function absperrtafel(blink, title) {
  const top = blink
    ? `<rect x="10" y="40" width="180" height="72" fill="${BLACK}"/>${[[160, 76], [142, 76], [124, 76], [106, 76], [88, 76], [70, 76], [52, 76], [64, 64], [76, 52], [64, 88], [76, 100]].map(([x, y]) => lamp(x, y, 5.5)).join("")}`
    : `<rect x="10" y="40" width="180" height="64" fill="${WHITE}" stroke="${BLACK}" stroke-width="1.5"/>${pass222(100, 72, 26, "left")}`;
  const stripesY = blink ? 112 : 104;
  return `${svgOpen(200, 224, title)}<g fill="#374151"><rect x="26" y="12" width="6" height="30"/><rect x="168" y="12" width="6" height="30"/></g>${lamp(29, 22, 12)}${lamp(171, 22, 12)}${top}${striped(10, stripesY, 180, 190 - stripesY, { dir: "left", t: 26, period: 52 })}<rect x="10" y="40" width="180" height="150" fill="none" stroke="${BLACK}" stroke-width="2"/><g fill="#374151"><rect x="40" y="190" width="120" height="8"/><circle cx="52" cy="208" r="12"/><circle cx="148" cy="208" r="12"/></g></svg>`;
}

/** Leitpfosten: weißer Pfosten mit schwarzem Band; links zwei runde, rechts ein rechteckiger Rückstrahler */
function leitpfosten(side, title) {
  const refl = side === "links"
    ? `<circle cx="30" cy="58" r="6" fill="${WHITE}"/><circle cx="30" cy="82" r="6" fill="${WHITE}"/>`
    : `<rect x="25" y="50" width="10" height="40" rx="1" fill="${WHITE}"/>`;
  return `${svgOpen(60, 250, title)}<path d="M18 20 L42 12 V246 H18 Z" fill="${WHITE}" stroke="${BLACK}" stroke-width="1.5"/><rect x="18" y="42" width="24" height="56" fill="${BLACK}"/>${refl}<path d="M18 20 L42 12" stroke="${BLACK}" stroke-width="1.5"/></svg>`;
}

/** Richtungstafel in Kurven: rote Tafel mit weißem Pfeil */
function richtungstafel(dir, title) {
  const arrow = `<path d="M22 60 L86 16 V42 H218 V78 H86 V104 Z" fill="${WHITE}"/>`;
  return `${svgOpen(240, 120, title)}<rect x="1" y="1" width="238" height="118" rx="4" fill="${RED}" stroke="#9CA3AF" stroke-width="1"/>${dir === "left" ? arrow : `<g transform="translate(240 0) scale(-1 1)">${arrow}</g>`}</svg>`;
}

function leitplatte(dir, title) {
  return `${svgOpen(240, 130, title)}${striped(10, 8, 220, 100, { dir, t: 30, period: 60, slope: 0.6 })}<rect x="54" y="110" width="8" height="12" fill="#374151"/><rect x="178" y="110" width="8" height="12" fill="#374151"/></svg>`;
}

function leitmal(dir, title) {
  return `${svgOpen(120, 190, title)}${striped(28, 8, 64, 170, { dir, t: 30, period: 60 })}</svg>`;
}

/** Leitschwelle (niedrig) und Leitbord (hoch): länglicher Körper in leichter Schrägansicht */
function leitkoerper(height, title) {
  const y = 96 - height;
  return `${svgOpen(260, 104, title)}<path d="M20 ${y} L34 ${y - 16} H254 L240 ${y} Z" fill="#E5E7EB" stroke="${BLACK}" stroke-width="1.2"/><path d="M240 ${y} L254 ${y - 16} V${96 - 16} L240 96 Z" fill="#9CA3AF" stroke="${BLACK}" stroke-width="1.2"/>${striped(20, y, 220, height, { dir: "left", t: 20, period: 40, slope: 1.2 })}</svg>`;
}

function parkwarntafel(dir, title) {
  return `${svgOpen(240, 130, title)}${striped(10, 8, 220, 110, { dir, t: 30, period: 60, slope: 0.7 })}</svg>`;
}

// ---------------------------------------------------------------------------------------------
// Katalog
// ---------------------------------------------------------------------------------------------
const E = (id, name, meaning, alt, svg, note) => ({ id, number: id, name, category: CAT, meaning, alt, ...(note ? { note } : {}), svg });

const BAKE_MEANING = (dir) => `Kennzeichnet ein Hindernis oder eine Absperrung (etwa an Arbeitsstellen) und weist mit den abfallenden Streifen an, ${dir === "left" ? "links" : "rechts"} an der Bake vorbeizufahren. Geschwindigkeit verringern, der Leitlinie der Baken folgen und nicht zwischen den Baken hindurchfahren.`;
const PFEIL_NOTE = "Zuordnung der VzKat-Nummern 605-40/-41 (Pfeilbake, Aufstellung links/rechts) analog zu 620-40/-41 gewählt; bitte prüfen.";
const SCHMAL_NOTE = "Suffix -11/-21 als schmale Leitbake nachgebildet; Zuordnung im VzKat bitte prüfen.";

export default [
  E("600", "Absperrschranke", "Sperrt eine Fahrbahn, einen Fahrstreifen oder eine Fläche vollständig ab; die Weiterfahrt dahinter ist verboten. Vor der Schranke anhalten oder der gekennzeichneten Umfahrung folgen.", "Zeichen 600 Absperrschranke: waagerechter Balken mit rot-weißen Schrägstreifen auf zwei Füßen", () => absperrschranke("Zeichen 600 Absperrschranke")),
  E("605-10", "Leitbake (Aufstellung rechts, Vorbeifahrt links)", BAKE_MEANING("left"), "Zeichen 605-10 Leitbake: hohe schmale Tafel mit rot-weißen Schrägstreifen, die nach links abfallen", () => leitbake("left", false, "Zeichen 605-10 Leitbake, Vorbeifahrt links")),
  E("605-11", "Schmale Leitbake (Aufstellung rechts, Vorbeifahrt links)", BAKE_MEANING("left"), "Zeichen 605-11 Schmale Leitbake: schmale Tafel mit rot-weißen Schrägstreifen, die nach links abfallen", () => leitbake("left", true, "Zeichen 605-11 Schmale Leitbake, Vorbeifahrt links"), SCHMAL_NOTE),
  E("605-20", "Leitbake (Aufstellung links, Vorbeifahrt rechts)", BAKE_MEANING("right"), "Zeichen 605-20 Leitbake: hohe schmale Tafel mit rot-weißen Schrägstreifen, die nach rechts abfallen", () => leitbake("right", false, "Zeichen 605-20 Leitbake, Vorbeifahrt rechts")),
  E("605-21", "Schmale Leitbake (Aufstellung links, Vorbeifahrt rechts)", BAKE_MEANING("right"), "Zeichen 605-21 Schmale Leitbake: schmale Tafel mit rot-weißen Schrägstreifen, die nach rechts abfallen", () => leitbake("right", true, "Zeichen 605-21 Schmale Leitbake, Vorbeifahrt rechts"), SCHMAL_NOTE),
  E("605-30", "Leitbake doppelseitig (Vorbeifahrt links und rechts)", "Kennzeichnet ein Hindernis, an dem links und rechts vorbeigefahren werden kann, etwa eine Verkehrsinsel oder eine Fahrbahnteilung. Geschwindigkeit verringern und auf der eigenen Seite an der Bake vorbeifahren.", "Zeichen 605-30 Leitbake doppelseitig: Tafel mit rot-weißen Streifen, die von der Mitte nach beiden Seiten abfallen", () => leitbake("both", false, "Zeichen 605-30 Leitbake doppelseitig"), "Doppelseitige Bake als Winkelstreifen mit Spitze oben nachgebildet; Suffix -30 bitte gegen VzKat prüfen."),
  E("605-31", "Schmale Leitbake doppelseitig", "Kennzeichnet ein Hindernis, an dem links und rechts vorbeigefahren werden kann, etwa eine Verkehrsinsel oder eine Fahrbahnteilung. Geschwindigkeit verringern und auf der eigenen Seite an der Bake vorbeifahren.", "Zeichen 605-31 Schmale Leitbake doppelseitig: schmale Tafel mit rot-weißen Streifen, die von der Mitte nach beiden Seiten abfallen", () => leitbake("both", true, "Zeichen 605-31 Schmale Leitbake doppelseitig"), "Suffix -31 als schmale doppelseitige Leitbake nachgebildet; bitte gegen VzKat prüfen."),
  E("605-40", "Pfeilbake (Aufstellung links, Vorbeifahrt rechts)", "Leitbake mit Pfeil, der die Seite anzeigt, an der vorbeizufahren ist. Dem Pfeil folgen, Geschwindigkeit verringern und den Fahrstreifen rechtzeitig wechseln.", "Zeichen 605-40 Pfeilbake: weiße Tafel mit rotem Pfeil nach rechts", () => pfeilbake("right", "Zeichen 605-40 Pfeilbake, Vorbeifahrt rechts"), PFEIL_NOTE),
  E("605-41", "Pfeilbake (Aufstellung rechts, Vorbeifahrt links)", "Leitbake mit Pfeil, der die Seite anzeigt, an der vorbeizufahren ist. Dem Pfeil folgen, Geschwindigkeit verringern und den Fahrstreifen rechtzeitig wechseln.", "Zeichen 605-41 Pfeilbake: weiße Tafel mit rotem Pfeil nach links", () => pfeilbake("left", "Zeichen 605-41 Pfeilbake, Vorbeifahrt links"), PFEIL_NOTE),
  E("610", "Leitkegel", "Kennzeichnet kurzzeitige Hindernisse und Absperrungen, etwa bei Arbeiten oder Unfällen, und leitet den Verkehr daran vorbei. Nicht zwischen den Kegeln hindurchfahren, Geschwindigkeit verringern und dem Verlauf der Kegel folgen.", "Zeichen 610 Leitkegel: roter Kegel mit zwei weißen Ringen auf dunklem Fuß", () => leitkegel("Zeichen 610 Leitkegel")),
  E("615", "Fahrbare Absperrtafel", "Sperrt bei Arbeitsstellen kürzerer Dauer einen Fahrstreifen ab; die Streifen und das Zeichen 222 zeigen an, auf welcher Seite vorbeizufahren ist. Rechtzeitig den Fahrstreifen wechseln, Geschwindigkeit verringern und auf Arbeiter achten.", "Zeichen 615 Fahrbare Absperrtafel: Anhänger mit rot-weiß gestreifter Tafel, blauem Vorbeifahrt-Pfeil und zwei gelben Leuchten", () => absperrtafel(false, "Zeichen 615 Fahrbare Absperrtafel")),
  E("616", "Fahrbare Absperrtafel mit Blinkpfeil", "Sperrt bei Arbeitsstellen kürzerer Dauer einen Fahrstreifen ab; der gelbe Blinkpfeil zeigt an, auf welche Seite der Verkehr ausweichen muss. Rechtzeitig in Pfeilrichtung den Fahrstreifen wechseln, Geschwindigkeit verringern und auf Arbeiter achten.", "Zeichen 616 Fahrbare Absperrtafel mit Blinkpfeil: Anhänger mit gelbem Leuchtpfeil auf schwarzem Grund über rot-weiß gestreifter Tafel", () => absperrtafel(true, "Zeichen 616 Fahrbare Absperrtafel mit Blinkpfeil")),
  E("620-40", "Leitpfosten (links)", "Markiert den linken Fahrbahnrand und macht den Straßenverlauf bei Dunkelheit und Nebel erkennbar; zwei runde Rückstrahler kennzeichnen die linke Seite. Leitpfosten stehen in der Regel im Abstand von 50 m und helfen beim Abschätzen des Sicherheitsabstands.", "Zeichen 620-40 Leitpfosten links: weißer Pfosten mit schwarzem Band und zwei runden weißen Rückstrahlern", () => leitpfosten("links", "Zeichen 620-40 Leitpfosten links")),
  E("620-41", "Leitpfosten (rechts)", "Markiert den rechten Fahrbahnrand und macht den Straßenverlauf bei Dunkelheit und Nebel erkennbar; ein rechteckiger Rückstrahler kennzeichnet die rechte Seite. Leitpfosten stehen in der Regel im Abstand von 50 m und helfen beim Abschätzen des Sicherheitsabstands.", "Zeichen 620-41 Leitpfosten rechts: weißer Pfosten mit schwarzem Band und einem rechteckigen weißen Rückstrahler", () => leitpfosten("rechts", "Zeichen 620-41 Leitpfosten rechts")),
  E("625-10", "Richtungstafel in Kurven (linksweisend)", "Macht den Verlauf einer scharfen oder unübersichtlichen Linkskurve deutlich. Geschwindigkeit vor der Kurve verringern, dem Pfeil folgen und in der Kurve nicht bremsen.", "Zeichen 625-10 Richtungstafel in Kurven: rote Tafel mit weißem Pfeil nach links", () => richtungstafel("left", "Zeichen 625-10 Richtungstafel in Kurven, linksweisend"), "Zuordnung -10 linksweisend, -20 rechtsweisend analog zu anderen Richtungsvarianten; bitte gegen VzKat prüfen."),
  E("625-20", "Richtungstafel in Kurven (rechtsweisend)", "Macht den Verlauf einer scharfen oder unübersichtlichen Rechtskurve deutlich. Geschwindigkeit vor der Kurve verringern, dem Pfeil folgen und in der Kurve nicht bremsen.", "Zeichen 625-20 Richtungstafel in Kurven: rote Tafel mit weißem Pfeil nach rechts", () => richtungstafel("right", "Zeichen 625-20 Richtungstafel in Kurven, rechtsweisend"), "Zuordnung -10 linksweisend, -20 rechtsweisend analog zu anderen Richtungsvarianten; bitte gegen VzKat prüfen."),
  E("626-10", "Leitplatte (Vorbeifahrt links)", "Kennzeichnet ein Hindernis oder eine Fahrbahnteilung, an der links vorbeizufahren ist, etwa die Spitze einer Verkehrsinsel. Der Streifenrichtung folgen und Geschwindigkeit verringern.", "Zeichen 626-10 Leitplatte: breite Tafel mit rot-weißen Schrägstreifen, die nach links abfallen", () => leitplatte("left", "Zeichen 626-10 Leitplatte, Vorbeifahrt links"), "Suffix -10/-20 nach Richtung der Vorbeifahrt gewählt; bitte gegen VzKat prüfen."),
  E("626-20", "Leitplatte (Vorbeifahrt rechts)", "Kennzeichnet ein Hindernis oder eine Fahrbahnteilung, an der rechts vorbeizufahren ist, etwa die Spitze einer Verkehrsinsel. Der Streifenrichtung folgen und Geschwindigkeit verringern.", "Zeichen 626-20 Leitplatte: breite Tafel mit rot-weißen Schrägstreifen, die nach rechts abfallen", () => leitplatte("right", "Zeichen 626-20 Leitplatte, Vorbeifahrt rechts"), "Suffix -10/-20 nach Richtung der Vorbeifahrt gewählt; bitte gegen VzKat prüfen."),
  E("627-10", "Leitmal (Aufstellung rechts)", "Kennzeichnet feste Hindernisse am rechten Fahrbahnrand, etwa Brückenpfeiler, Tunnelportale oder Mauern, damit sie bei Dunkelheit erkennbar sind. Ausreichenden Seitenabstand halten und die Fahrbahnbreite beachten.", "Zeichen 627-10 Leitmal: hochstehende Tafel mit rot-weißen Schrägstreifen, die zur Fahrbahn hin nach links abfallen", () => leitmal("left", "Zeichen 627-10 Leitmal, Aufstellung rechts"), "Suffix -10/-20 nach Aufstellungsseite gewählt; bitte gegen VzKat prüfen."),
  E("627-20", "Leitmal (Aufstellung links)", "Kennzeichnet feste Hindernisse am linken Fahrbahnrand, etwa Brückenpfeiler, Tunnelportale oder Mauern, damit sie bei Dunkelheit erkennbar sind. Ausreichenden Seitenabstand halten und die Fahrbahnbreite beachten.", "Zeichen 627-20 Leitmal: hochstehende Tafel mit rot-weißen Schrägstreifen, die zur Fahrbahn hin nach rechts abfallen", () => leitmal("right", "Zeichen 627-20 Leitmal, Aufstellung links"), "Suffix -10/-20 nach Aufstellungsseite gewählt; bitte gegen VzKat prüfen."),
  E("628", "Leitschwelle", "Niedrige, aufgesetzte Schwelle, die Fahrstreifen oder Verkehrsflächen voneinander trennt, etwa an Arbeitsstellen. Nicht überfahren, sondern auf dem eigenen Fahrstreifen bleiben und die Führung der Schwelle beachten.", "Zeichen 628 Leitschwelle: niedriger länglicher Körper mit rot-weißen Schrägstreifen", () => leitkoerper(22, "Zeichen 628 Leitschwelle")),
  E("629", "Leitbord", "Höherer Leitkörper, der wie ein Bordstein Fahrstreifen oder Verkehrsflächen trennt und Fahrzeuge führt. Nicht überfahren, auf dem eigenen Fahrstreifen bleiben und ausreichenden Seitenabstand halten.", "Zeichen 629 Leitbord: hoher länglicher Körper mit rot-weißen Schrägstreifen", () => leitkoerper(48, "Zeichen 629 Leitbord")),
  E("630-10", "Parkwarntafel (Streifen nach links)", "Rot-weiß gestreifte Tafel, die an ungünstig geparkten oder abgestellten Fahrzeugen und Anhängern anzubringen ist, damit sie im Dunkeln rechtzeitig erkennbar sind. Geschwindigkeit verringern und mit ausreichendem Seitenabstand links vorbeifahren.", "Zeichen 630-10 Parkwarntafel: rechteckige Tafel mit rot-weißen Schrägstreifen, die nach links abfallen", () => parkwarntafel("left", "Zeichen 630-10 Parkwarntafel"), "Suffix -10/-20 nach Streifenrichtung gewählt; bitte gegen VzKat prüfen."),
  E("630-20", "Parkwarntafel (Streifen nach rechts)", "Rot-weiß gestreifte Tafel, die an ungünstig geparkten oder abgestellten Fahrzeugen und Anhängern anzubringen ist, damit sie im Dunkeln rechtzeitig erkennbar sind. Geschwindigkeit verringern und mit ausreichendem Seitenabstand rechts vorbeifahren.", "Zeichen 630-20 Parkwarntafel: rechteckige Tafel mit rot-weißen Schrägstreifen, die nach rechts abfallen", () => parkwarntafel("right", "Zeichen 630-20 Parkwarntafel"), "Suffix -10/-20 nach Streifenrichtung gewählt; bitte gegen VzKat prüfen."),
];
