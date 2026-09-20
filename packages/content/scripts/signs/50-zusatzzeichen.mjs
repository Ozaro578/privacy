// Zusatzzeichen (Verkehrszeichenkatalog, Nummern 1000 ff.): weißes Rechteck mit schwarzem Rand, schwarze Schrift und Sinnbilder.
// Piktogramme lokal im 100×100-Raster; Zeichenform zusatz() aus ../lib/sign-kit.mjs.
import { P, pict, text, zusatz, BLACK, WHITE, RED, BLUE, YELLOW, GREEN } from "../lib/sign-kit.mjs";

const cat = "zusatzzeichen";

// Schrift so verkleinern, dass sie in maxW passt (0,6 em je Zeichen)
const fit = (str, maxW, size) => Math.min(size, Math.floor(maxW / (0.6 * str.length)));
const T = (x, y, size, str, maxW = 0) => text(x, y, maxW ? fit(str, maxW, size) : size, str, BLACK, "middle");

// ---------------------------------------------------------------------------------------------
// Zeichenformen: Regelformat 420×231 mm (hier 200×110), quadratisch (120×120), hochkant (110×200)
// ---------------------------------------------------------------------------------------------
const land = (inner, title) => zusatz(200, 110, inner, title);
const square = (inner, title) => zusatz(120, 120, inner, title);
const tall = (inner, title) => zusatz(110, 200, inner, title);

/** Textzeilen zentriert im Regelformat (eine bis drei Zeilen) */
function lines(strs, cx = 100, maxW = 176) {
  if (strs.length === 1) return T(cx, 70, 34, strs[0], maxW);
  if (strs.length === 2) return `${T(cx, 48, 28, strs[0], maxW)}${T(cx, 88, 28, strs[1], maxW)}`;
  return `${T(cx, 38, 22, strs[0], maxW)}${T(cx, 68, 22, strs[1], maxW)}${T(cx, 98, 22, strs[2], maxW)}`;
}
/** Sinnbild links, Text rechts ("… frei") */
const pictText = (inner, strs, size = 88) => `${pict(inner, 10, (110 - size) / 2, size)}${lines(strs, 148, 92)}`;
/** Sinnbild allein, zentriert */
const pictOnly = (inner, size = 96) => pict(inner, 100 - size / 2, (110 - size) / 2, size);

// Pfeile
const arrowLeft = `<path d="M18 55 L58 22 V44 H182 V66 H58 V88 Z" fill="${BLACK}"/>`;
const arrowRight = `<path d="M182 55 L142 22 V44 H18 V66 H142 V88 Z" fill="${BLACK}"/>`;
const arrowBoth = `<path d="M14 55 L52 24 V44 H148 V24 L186 55 L148 86 V66 H52 V86 Z" fill="${BLACK}"/>`;
const arrowUpDown = `<path d="M55 12 L86 50 H66 V150 H86 L55 188 L24 150 H44 V50 H24 Z" fill="${BLACK}"/>`;
/** Kleiner Pfeil (100er-Raster), Spitze in Richtung dir, Mittelpunkt 50/50 */
const smallArrow = (dir) => `<g transform="rotate(${{ up: 0, right: 90, down: 180, left: -90 }[dir]} 50 50)"><path d="M50 10 L74 40 H60 V90 H40 V40 H26 Z" fill="${BLACK}"/></g>`;

// ---------------------------------------------------------------------------------------------
// Piktogramme (schwarz auf weiß, 100×100)
// ---------------------------------------------------------------------------------------------
const busFront = `<path d="M22 22 Q22 12 32 12 H68 Q78 12 78 22 V80 H22 Z" fill="${BLACK}"/><rect x="27" y="18" width="46" height="26" rx="3" fill="${WHITE}"/><rect x="15" y="28" width="7" height="10" rx="1" fill="${BLACK}"/><rect x="78" y="28" width="7" height="10" rx="1" fill="${BLACK}"/><rect x="36" y="48" width="28" height="7" rx="1" fill="${WHITE}"/><circle cx="31" cy="68" r="4.5" fill="${WHITE}"/><circle cx="69" cy="68" r="4.5" fill="${WHITE}"/><rect x="26" y="80" width="12" height="8" fill="${BLACK}"/><rect x="62" y="80" width="12" height="8" fill="${BLACK}"/>`;
const carSide = `<path d="M8 64 L12 50 L28 46 L40 34 H68 L82 48 L92 52 L94 64 Z" fill="${BLACK}"/><rect x="6" y="62" width="90" height="14" rx="4" fill="${BLACK}"/><path d="M30 48 L42 39 H52 V48 Z M57 39 H66 L77 48 H57 Z" fill="${WHITE}"/><circle cx="26" cy="76" r="9" fill="${BLACK}"/><circle cx="76" cy="76" r="9" fill="${BLACK}"/><circle cx="26" cy="76" r="3.5" fill="${WHITE}"/><circle cx="76" cy="76" r="3.5" fill="${WHITE}"/>`;
const trailerBox = (x = 60) => `<rect x="${x}" y="42" width="34" height="24" rx="3" fill="${BLACK}"/><rect x="${x - 12}" y="60" width="14" height="5" fill="${BLACK}"/><circle cx="${x + 17}" cy="72" r="7" fill="${BLACK}"/><circle cx="${x + 17}" cy="72" r="2.5" fill="${WHITE}"/>`;
const carTrailer = `<g transform="translate(-4 22) scale(0.62)">${carSide}</g>${trailerBox(64)}`;
const truckSide = `<path d="M6 66 V42 L14 32 H32 V66 Z" fill="${BLACK}"/><path d="M13 38 H27 V48 H10 Z" fill="${WHITE}"/><rect x="34" y="24" width="60" height="42" rx="3" fill="${BLACK}"/><rect x="6" y="64" width="88" height="10" fill="${BLACK}"/><circle cx="20" cy="76" r="8" fill="${BLACK}"/><circle cx="58" cy="76" r="8" fill="${BLACK}"/><circle cx="78" cy="76" r="8" fill="${BLACK}"/><circle cx="20" cy="76" r="3" fill="${WHITE}"/><circle cx="58" cy="76" r="3" fill="${WHITE}"/><circle cx="78" cy="76" r="3" fill="${WHITE}"/>`;
const truckTrailer = `<g transform="translate(0 20) scale(0.6)">${truckSide}</g><rect x="56" y="56" width="6" height="4" fill="${BLACK}"/><rect x="62" y="34" width="34" height="30" rx="2" fill="${BLACK}"/><circle cx="71" cy="70" r="6" fill="${BLACK}"/><circle cx="87" cy="70" r="6" fill="${BLACK}"/><circle cx="71" cy="70" r="2" fill="${WHITE}"/><circle cx="87" cy="70" r="2" fill="${WHITE}"/>`;
const tractor = `<circle cx="68" cy="64" r="20" fill="${BLACK}"/><circle cx="68" cy="64" r="7" fill="${WHITE}"/><circle cx="24" cy="74" r="11" fill="${BLACK}"/><circle cx="24" cy="74" r="4" fill="${WHITE}"/><rect x="12" y="46" width="40" height="16" rx="3" fill="${BLACK}"/><rect x="24" y="28" width="4" height="18" fill="${BLACK}"/><path d="M48 26 H70 V50 H48 Z" fill="${BLACK}"/><path d="M52 30 H66 V44 H52 Z" fill="${WHITE}"/><rect x="30" y="60" width="50" height="6" fill="${BLACK}"/>`;
const horse = `<ellipse cx="54" cy="58" rx="24" ry="11" fill="${BLACK}"/><path d="M40 50 L30 30 L22 26 L8 34 L12 44 L22 46 L32 66 L44 66 Z" fill="${BLACK}"/><path d="M26 28 L23 19 M31 29 L33 20" stroke="${BLACK}" stroke-width="3" stroke-linecap="round"/><path d="M36 66 L28 88 M42 66 L46 88 M64 66 L60 88 M70 66 L78 88" stroke="${BLACK}" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M76 52 Q90 56 88 74" stroke="${BLACK}" stroke-width="4" stroke-linecap="round" fill="none"/>`;
const rider = `${horse}<circle cx="55" cy="13" r="6.5" fill="${BLACK}"/><path d="M49 21 H61 L64 44 L58 48 L56 52 H48 L46 46 L42 44 Z" fill="${BLACK}"/><path d="M48 50 L45 72 L52 74 L57 52 Z" fill="${BLACK}"/><path d="M59 27 L40 40 L22 40" stroke="${BLACK}" stroke-width="3.5" stroke-linecap="round" fill="none"/>`;
const cow = `<path d="M24 42 H74 Q84 42 84 52 V66 H24 Z" fill="${BLACK}"/><path d="M26 46 L12 40 L4 48 L8 60 L24 62 Z" fill="${BLACK}"/><path d="M12 40 L6 30 M19 41 L22 30" stroke="${BLACK}" stroke-width="3" stroke-linecap="round"/><path d="M32 66 V88 M42 66 V88 M64 66 V88 M76 66 V88" stroke="${BLACK}" stroke-width="6" stroke-linecap="round"/><path d="M84 46 Q94 52 90 68" stroke="${BLACK}" stroke-width="3" stroke-linecap="round" fill="none"/><ellipse cx="58" cy="70" rx="7" ry="5" fill="${BLACK}"/>`;
const escooter = `<rect x="18" y="66" width="50" height="7" rx="2" fill="${BLACK}"/><circle cx="16" cy="76" r="9" fill="${BLACK}"/><circle cx="16" cy="76" r="3" fill="${WHITE}"/><circle cx="74" cy="76" r="9" fill="${BLACK}"/><circle cx="74" cy="76" r="3" fill="${WHITE}"/><path d="M22 66 L36 20" stroke="${BLACK}" stroke-width="6" stroke-linecap="round"/><path d="M26 20 H46" stroke="${BLACK}" stroke-width="5" stroke-linecap="round"/>`;
const moped = `<circle cx="22" cy="70" r="12" fill="none" stroke="${BLACK}" stroke-width="5"/><circle cx="76" cy="70" r="12" fill="none" stroke="${BLACK}" stroke-width="5"/><path d="M22 70 L38 44 H58 L76 70 M38 44 L34 32 H24 M58 44 L61 36 H74 M46 44 L40 70" fill="none" stroke="${BLACK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/><rect x="42" y="52" width="16" height="12" rx="2" fill="${BLACK}"/><rect x="52" y="35" width="14" height="6" rx="2" fill="${BLACK}"/>`;
const tram = `<path d="M22 30 Q22 16 36 16 H64 Q78 16 78 30 V72 H22 Z" fill="${BLACK}"/><rect x="28" y="24" width="18" height="16" rx="2" fill="${WHITE}"/><rect x="54" y="24" width="18" height="16" rx="2" fill="${WHITE}"/><rect x="30" y="48" width="40" height="6" fill="${WHITE}"/><rect x="16" y="72" width="68" height="8" fill="${BLACK}"/><rect x="24" y="80" width="52" height="6" fill="${BLACK}"/><path d="M50 16 V6 L36 2 M50 6 L64 2" stroke="${BLACK}" stroke-width="3" fill="none"/><rect x="10" y="88" width="80" height="4" fill="${BLACK}"/>`;
/** Stecker (Elektrofahrzeuge) */
const plug = (x = 66, y = 8, s = 30) => `<g transform="translate(${x} ${y}) scale(${s / 100})"><rect x="20" y="30" width="60" height="40" rx="8" fill="${BLACK}"/><rect x="32" y="8" width="10" height="24" fill="${BLACK}"/><rect x="58" y="8" width="10" height="24" fill="${BLACK}"/><path d="M50 70 V96" stroke="${BLACK}" stroke-width="10"/></g>`;
const ecar = `<g transform="translate(-6 8) scale(0.9)">${P.carFront}</g>${plug(70, 4, 32)}`;
const ebike = `<g transform="translate(0 6) scale(0.92)">${P.bicycle}</g><path d="M66 6 L54 28 H64 L58 46 L72 22 H62 Z" fill="${BLACK}"/>`;
const carsharing = `<g transform="translate(0 16) scale(0.86)">${P.carFront}</g><g fill="${BLACK}"><circle cx="30" cy="12" r="6"/><path d="M20 30 Q20 20 30 20 Q40 20 40 30 V34 H20 Z"/><circle cx="50" cy="12" r="6"/><path d="M40 30 Q40 20 50 20 Q60 20 60 30 V34 H40 Z"/><circle cx="70" cy="12" r="6"/><path d="M60 30 Q60 20 70 20 Q80 20 80 30 V34 H60 Z"/></g>`;
/** Parkscheibe (blau mit weißem Zifferblatt) */
const parkDisc = `<rect x="12" y="10" width="76" height="80" rx="6" fill="${BLUE}"/><text x="50" y="30" font-size="12" font-family="'DIN Alternate','Helvetica Neue',Arial,sans-serif" font-weight="700" fill="${WHITE}" text-anchor="middle">Ankunftszeit</text><circle cx="50" cy="60" r="24" fill="${WHITE}"/><path d="M50 60 V42 M50 60 L62 66" stroke="${BLUE}" stroke-width="4" stroke-linecap="round"/><g stroke="${BLUE}" stroke-width="2">${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => `<path d="M50 38 V42" transform="rotate(${a} 50 60)"/>`).join("")}</g>`;
/** Umweltplakette (Feinstaubplakette) mit Zahl */
const plakette = (x, y, r, fill, num, textFill = BLACK) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${BLACK}" stroke-width="1.5"/>${text(x, y + r * 0.42, r * 1.2, num, textFill)}`;
const plakettenFrei = (which) => {
  const all = [["rot", RED, "2", WHITE], ["gelb", YELLOW, "3", BLACK], ["gruen", GREEN, "4", WHITE]].filter(([k]) => which.includes(k));
  const discs = all.map(([, fill, num, tf], i) => plakette(100 + (i - (all.length - 1) / 2) * 50, 40, 20, fill, num, tf)).join("");
  return `${discs}${T(100, 98, 28, "frei")}`;
};

// ---------------------------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------------------------
const Z = (id, name, meaning, alt, svg, note) => ({ id, number: id, name, category: cat, meaning, alt, ...(note ? { note } : {}), svg });
const ttl = (id, name) => `Zusatzzeichen ${id} ${name}`;
/** Reiner Textzusatz */
const txt = (id, name, strs, meaning, note) => Z(id, name, meaning, `Zusatzzeichen ${id}: weißes Rechteck mit schwarzem Rand und der Aufschrift ${strs.join(" ")}`, () => land(lines(strs), ttl(id, name)), note);
/** Sinnbild mit "frei" */
const frei = (id, name, inner, altPict, meaning, note, size = 88) => Z(id, name, meaning, `Zusatzzeichen ${id} ${name}: weißes Rechteck mit ${altPict} und der Aufschrift frei`, () => land(pictText(inner, ["frei"], size), ttl(id, name)), note);
/** Sinnbild allein (Verkehrsart, 1010er) */
const sinnbild = (id, name, inner, altPict, meaning, note, size = 96) => Z(id, name, meaning, `Zusatzzeichen ${id} ${name}: weißes Rechteck mit ${altPict}`, () => land(pictOnly(inner, size), ttl(id, name)), note);

/** Verlauf der Vorfahrtstraße (1002): thick = Vorfahrtstraße, thin = untergeordnete Straßen; Pfade im 120er-Raster */
const vorfahrtVerlauf = (thick, thin) => `<path d="${thick}" stroke="${BLACK}" stroke-width="13" fill="none" stroke-linecap="butt"/><path d="${thin}" stroke="${BLACK}" stroke-width="4" fill="none"/>`;
const VERLAUF = "Zeigt unter Zeichen 306 oder 301 den Verlauf der abknickenden Vorfahrtstraße und unter Zeichen 205 oder 206, wie die Vorfahrtstraße verläuft: Die breite Linie ist die Vorfahrtstraße, die schmalen Linien sind die untergeordneten Straßen. Wer der abknickenden Vorfahrtstraße folgt, muss blinken; wer sie geradeaus verlässt, darf nicht blinken und muss dem Verkehr auf der Vorfahrtstraße (auch dem Gegenverkehr, der ihr folgend abbiegt) Vorrang geben.";
const NUM_NOTE = "Nummer der Variante nach Verkehrszeichenkatalog bitte prüfen.";
const SINNBILD_NOTE = "Zuordnung von Nummer und Sinnbild (1010er-Reihe) nach Verkehrszeichenkatalog bitte prüfen.";
const FREI = (wer) => `Nimmt ${wer} von dem Verbot oder der Beschränkung des Zeichens aus, unter dem das Zusatzzeichen steht. Für alle anderen gilt das Hauptzeichen unverändert.`;

// ---------------------------------------------------------------------------------------------
// Katalog
// ---------------------------------------------------------------------------------------------
export default [
  // Richtungsangaben
  Z("1000-10", "Richtung der Gefahrstelle, linksweisend", "Gibt an, dass die durch das Hauptzeichen bezeichnete Gefahrstelle oder Regelung links liegt, etwa ein Bahnübergang oder eine Arbeitsstelle in der nach links abzweigenden Straße.", "Zusatzzeichen 1000-10: weißes Rechteck mit schwarzem Pfeil nach links", () => land(arrowLeft, ttl("1000-10", "linksweisend"))),
  Z("1000-20", "Richtung der Gefahrstelle, rechtsweisend", "Gibt an, dass die durch das Hauptzeichen bezeichnete Gefahrstelle oder Regelung rechts liegt, etwa ein Bahnübergang oder eine Arbeitsstelle in der nach rechts abzweigenden Straße.", "Zusatzzeichen 1000-20: weißes Rechteck mit schwarzem Pfeil nach rechts", () => land(arrowRight, ttl("1000-20", "rechtsweisend"))),
  Z("1000-30", "Beide Richtungen (Pfeile nach links und rechts)", "Zeigt an, dass die Regelung des Hauptzeichens nach beiden Seiten gilt, etwa ein Parkverbot oder eine Parkfläche, die links und rechts des Schildes weiterführt (Mitte einer Strecke).", "Zusatzzeichen 1000-30: weißes Rechteck mit schwarzem Doppelpfeil nach links und rechts", () => land(arrowBoth, ttl("1000-30", "beide Richtungen"))),
  Z("1000-31", "Beide Richtungen (Pfeile nach oben und unten)", "Zeigt an, dass die Regelung für beide Fahrtrichtungen gilt, zum Beispiel unter Zeichen 138, wenn Radverkehr aus beiden Richtungen zu erwarten ist, oder unter einem Radwegzeichen, wenn der Weg in beiden Richtungen befahren werden darf.", "Zusatzzeichen 1000-31: hochkantes weißes Rechteck mit schwarzem Doppelpfeil nach oben und unten", () => tall(arrowUpDown, ttl("1000-31", "beide Richtungen"))),
  Z("1000-32", "Radverkehr kreuzt von rechts und links", "Warnt unter Zeichen 205 oder beim Einbiegen davor, dass Radverkehr aus beiden Richtungen kreuzt, etwa auf einem Zweirichtungsradweg. Vor dem Abbiegen und Einfahren nach beiden Seiten auf Radfahrer achten und ihnen Vorrang gewähren.", "Zusatzzeichen 1000-32: weißes Rechteck mit Fahrrad zwischen einem Pfeil nach links und einem Pfeil nach rechts", () => land(`${pict(smallArrow("left"), 4, 25, 60)}${pict(P.bicycle, 58, 13, 84)}${pict(smallArrow("right"), 136, 25, 60)}`, ttl("1000-32", "Radverkehr kreuzt von rechts und links"))),
  Z("1000-33", "Radverkehr im Gegenverkehr", "Weist darauf hin, dass Radverkehr entgegen der Fahrtrichtung zu erwarten ist, etwa in einer für den Radverkehr in Gegenrichtung freigegebenen Einbahnstraße oder an deren Einmündungen. Beim Einbiegen und Ausfahren mit entgegenkommenden Radfahrern rechnen.", "Zusatzzeichen 1000-33: weißes Rechteck mit Fahrrad, daneben ein Pfeil nach oben und ein Pfeil nach unten", () => land(`${pict(P.bicycle, 20, 13, 84)}${pict(smallArrow("up"), 118, 8, 46)}${pict(smallArrow("down"), 150, 56, 46)}`, ttl("1000-33", "Radverkehr im Gegenverkehr"))),
  // Streckenlänge
  txt("1001-30", "Streckenlänge in Metern", ["auf 500 m"], "Gibt an, auf welcher Strecke (in Metern) das Hauptzeichen gilt, etwa eine Geschwindigkeitsbeschränkung oder ein Überholverbot ab dem Standort des Zeichens."),
  txt("1001-31", "Streckenlänge in Kilometern", ["auf 3 km"], "Gibt an, auf welcher Strecke (in Kilometern) das Hauptzeichen gilt, etwa eine Gefahrstelle oder ein Überholverbot ab dem Standort des Zeichens."),
  // Verlauf der Vorfahrtstraße
  Z("1002-10", "Verlauf der Vorfahrtstraße an Kreuzungen (von unten nach links)", VERLAUF, "Zusatzzeichen 1002-10: weißes Quadrat mit breiter Linie von unten nach links und schmalen Linien geradeaus und nach rechts", () => square(vorfahrtVerlauf("M60 104 V60 H18", "M60 60 V16 M60 60 H104"), ttl("1002-10", "abknickende Vorfahrt links"))),
  Z("1002-12", "Verlauf der Vorfahrtstraße an Einmündungen (von unten nach links, Nebenstraße geradeaus)", VERLAUF, "Zusatzzeichen 1002-12: weißes Quadrat mit breiter Linie von unten nach links und schmaler Linie geradeaus", () => square(vorfahrtVerlauf("M60 104 V60 H18", "M60 60 V16"), ttl("1002-12", "abknickende Vorfahrt links, Einmündung")), NUM_NOTE),
  Z("1002-13", "Verlauf der Vorfahrtstraße an Einmündungen (von unten nach links, Nebenstraße rechts)", VERLAUF, "Zusatzzeichen 1002-13: weißes Quadrat mit breiter Linie von unten nach links und schmaler Linie nach rechts", () => square(vorfahrtVerlauf("M60 104 V60 H18", "M60 60 H104"), ttl("1002-13", "abknickende Vorfahrt links, Einmündung")), NUM_NOTE),
  Z("1002-20", "Verlauf der Vorfahrtstraße an Kreuzungen (von unten nach rechts)", VERLAUF, "Zusatzzeichen 1002-20: weißes Quadrat mit breiter Linie von unten nach rechts und schmalen Linien geradeaus und nach links", () => square(vorfahrtVerlauf("M60 104 V60 H102", "M60 60 V16 M60 60 H16"), ttl("1002-20", "abknickende Vorfahrt rechts"))),
  Z("1002-22", "Verlauf der Vorfahrtstraße an Einmündungen (von unten nach rechts, Nebenstraße geradeaus)", VERLAUF, "Zusatzzeichen 1002-22: weißes Quadrat mit breiter Linie von unten nach rechts und schmaler Linie geradeaus", () => square(vorfahrtVerlauf("M60 104 V60 H102", "M60 60 V16"), ttl("1002-22", "abknickende Vorfahrt rechts, Einmündung")), NUM_NOTE),
  Z("1002-23", "Verlauf der Vorfahrtstraße an Einmündungen (von unten nach rechts, Nebenstraße links)", VERLAUF, "Zusatzzeichen 1002-23: weißes Quadrat mit breiter Linie von unten nach rechts und schmaler Linie nach links", () => square(vorfahrtVerlauf("M60 104 V60 H102", "M60 60 H16"), ttl("1002-23", "abknickende Vorfahrt rechts, Einmündung")), NUM_NOTE),
  // Entfernung
  txt("1004-30", "Entfernungsangabe in Metern", ["100 m"], "Gibt an, in welcher Entfernung (in Metern) die Gefahrstelle oder die Regelung des Hauptzeichens beginnt, zum Beispiel bei Gefahrzeichen innerorts oder bei vorzeitig angekündigten Verboten."),
  txt("1004-31", "Entfernungsangabe in Kilometern", ["2 km"], "Gibt an, in welcher Entfernung (in Kilometern) die Gefahrstelle oder die Regelung des Hauptzeichens beginnt."),
  txt("1004-32", "Stopp in ... m", ["STOP", "100 m"], "Kündigt unter Zeichen 205 an, dass in der angegebenen Entfernung das Zeichen 206 (Halt, Vorfahrt gewähren) steht: dort ist anzuhalten.", NUM_NOTE),
  // Gefahrhinweise (Text)
  txt("1006-30", "Ölspur", ["Ölspur"], "Erklärt die Gefahr unter Zeichen 101 oder 114: Auf der Fahrbahn liegt Öl, die Fahrbahn ist rutschig. Geschwindigkeit verringern, nicht stark bremsen oder lenken."),
  txt("1006-31", "Rauch", ["Rauch"], "Erklärt die Gefahr unter Zeichen 101: Rauch kann die Sicht plötzlich stark einschränken. Geschwindigkeit anpassen und bremsbereit sein."),
  txt("1006-32", "Splitt", ["Splitt"], "Erklärt die Gefahr unter Zeichen 101 oder 114: Loser Splitt auf der Fahrbahn verlängert den Bremsweg und kann aufgewirbelt werden. Langsam fahren und Abstand halten, besonders für Zweiräder.", NUM_NOTE),
  txt("1006-33", "Baustellenausfahrt", ["Baustellen-", "ausfahrt"], "Erklärt die Gefahr unter Zeichen 101: Baustellenfahrzeuge fahren aus einer Zufahrt auf die Straße. Mit langsam ausfahrenden, oft verschmutzten Fahrzeugen rechnen."),
  txt("1006-34", "Glatteis", ["Glatteis"], "Erklärt die Gefahr unter Zeichen 101 oder 114: An dieser Stelle bildet sich häufig Glatteis, etwa auf Brücken oder in Waldstücken. Vorsichtig und mit ausreichendem Abstand fahren.", NUM_NOTE),
  txt("1006-35", "Straßenschäden", ["Straßenschäden"], "Erklärt die Gefahr unter Zeichen 101: Die Fahrbahn hat Schlaglöcher oder andere Schäden. Geschwindigkeit verringern und den Lenker sicher halten.", NUM_NOTE),
  txt("1007-30", "Unfall", ["Unfall"], "Erklärt die Gefahr unter Zeichen 101: Es liegt eine Unfallstelle voraus. Geschwindigkeit verringern, bremsbereit sein und den Anweisungen von Polizei und Rettungskräften folgen.", NUM_NOTE),
  txt("1008-30", "Vorfahrt geändert", ["Vorfahrt", "geändert"], "Weist darauf hin, dass die Vorfahrtregelung an dieser Kreuzung oder Einmündung kürzlich geändert wurde. Besonders aufmerksam auf die Verkehrszeichen achten und sich nicht auf die gewohnte Regelung verlassen.", NUM_NOTE),
  txt("1008-31", "Verkehrsführung geändert", ["Verkehrsführung", "geändert"], "Weist darauf hin, dass die Verkehrsführung an dieser Stelle geändert wurde, etwa durch eine neue Einbahnstraße oder geänderte Fahrstreifen. Auf die neuen Zeichen und Markierungen achten.", NUM_NOTE),
  // Verkehrsarten (Sinnbilder)
  sinnbild("1010-51", "Fußgänger", P.pedestrian, "gehender Person", "Beschränkt das Hauptzeichen auf Fußgänger oder erklärt, dass es sich auf Fußgänger bezieht, etwa unter einem Gefahr- oder Richtzeichen.", SINNBILD_NOTE, 84),
  sinnbild("1010-52", "Radverkehr", P.bicycle, "Fahrrad", "Beschränkt das Hauptzeichen auf den Radverkehr oder erklärt, dass es sich auf Radfahrer bezieht.", SINNBILD_NOTE),
  sinnbild("1010-53", "Reiter", rider, "Reiter auf Pferd", "Beschränkt das Hauptzeichen auf Reiter oder erklärt, dass es sich auf Reiter bezieht.", SINNBILD_NOTE),
  sinnbild("1010-54", "Viehtrieb", cow, "Rind", "Beschränkt das Hauptzeichen auf Viehtrieb oder weist darauf hin, dass mit Viehtrieb zu rechnen ist.", SINNBILD_NOTE),
  sinnbild("1010-55", "Straßenbahn", tram, "Straßenbahn von vorn", "Weist darauf hin, dass das Hauptzeichen die Straßenbahn betrifft oder dass mit Straßenbahnverkehr zu rechnen ist.", SINNBILD_NOTE),
  sinnbild("1010-56", "Kraftomnibus", busFront, "Bus von vorn", "Beschränkt das Hauptzeichen auf Kraftomnibusse oder erklärt, dass es sich auf Busse bezieht.", SINNBILD_NOTE),
  sinnbild("1010-57", "Kraftfahrzeuge mit einer zulässigen Gesamtmasse über 3,5 t", P.truckFront, "Lkw von vorn", "Beschränkt das Hauptzeichen auf Kraftfahrzeuge mit einer zulässigen Gesamtmasse über 3,5 t einschließlich ihrer Anhänger und Zugmaschinen; ausgenommen sind Pkw und Kraftomnibusse.", SINNBILD_NOTE),
  sinnbild("1010-58", "Personenkraftwagen", P.carFront, "Pkw von vorn", "Beschränkt das Hauptzeichen auf Personenkraftwagen oder erklärt, dass es sich auf Pkw bezieht.", SINNBILD_NOTE),
  sinnbild("1010-59", "Personenkraftwagen mit Anhänger", carTrailer, "Pkw mit Anhänger von der Seite", "Beschränkt das Hauptzeichen auf Personenkraftwagen mit Anhänger, etwa bei einer Geschwindigkeitsbeschränkung oder einem Überholverbot für Gespanne.", SINNBILD_NOTE),
  sinnbild("1010-60", "Lastkraftwagen mit Anhänger", truckTrailer, "Lkw mit Anhänger von der Seite", "Beschränkt das Hauptzeichen auf Lastkraftwagen mit Anhänger (Lastzüge).", SINNBILD_NOTE),
  sinnbild("1010-62", "Krafträder, auch mit Beiwagen, Kleinkrafträder und Mopeds", P.motorbike, "Motorrad", "Beschränkt das Hauptzeichen auf Krafträder (auch mit Beiwagen), Kleinkrafträder und Mopeds.", SINNBILD_NOTE),
  sinnbild("1010-63", "Mofas", moped, "Mofa", "Beschränkt das Hauptzeichen auf Mofas (einspurige Fahrräder mit Hilfsmotor bis 25 km/h).", SINNBILD_NOTE),
  sinnbild("1010-66", "Elektrisch betriebene Fahrzeuge", ecar, "Pkw mit Stecker", "Beschränkt das Hauptzeichen auf elektrisch betriebene Fahrzeuge mit E-Kennzeichen (reine Elektrofahrzeuge, Brennstoffzellenfahrzeuge und bestimmte Plug-in-Hybride), etwa bei bevorrechtigten Parkflächen.", SINNBILD_NOTE),
  sinnbild("1010-68", "E-Bikes", ebike, "Fahrrad mit Blitz", "Beschränkt das Hauptzeichen auf E-Bikes (elektrisch angetriebene Zweiräder bis 25 km/h, die keine Pedelecs sind); Pedelecs bis 25 km/h gelten als Fahrräder.", SINNBILD_NOTE),
  sinnbild("1010-69", "Elektrokleinstfahrzeuge", escooter, "E-Tretroller", "Beschränkt das Hauptzeichen auf Elektrokleinstfahrzeuge (etwa E-Tretroller) im Sinne der Elektrokleinstfahrzeuge-Verordnung.", SINNBILD_NOTE),
  sinnbild("1010-70", "Carsharingfahrzeuge", carsharing, "Pkw mit drei Personen darüber", "Beschränkt das Hauptzeichen auf gekennzeichnete Carsharingfahrzeuge, etwa bei für Carsharing reservierten Parkflächen.", SINNBILD_NOTE),
  // Texte
  txt("1012-31", "Ende", ["Ende"], "Zeigt unter einem Zeichen das Ende seiner Wirkung an, etwa das Ende einer Parkfläche, eines Halteverbots oder einer Zone."),
  txt("1012-32", "Radfahrer absteigen", ["Radfahrer", "absteigen"], "Fordert Radfahrer auf, an dieser Stelle abzusteigen und das Fahrrad zu schieben, zum Beispiel an einer engen Arbeitsstelle oder auf einem Fußgängerüberweg. Schiebende Radfahrer gelten als Fußgänger."),
  txt("1012-34", "Grüne Welle bei ... km/h", ["Grüne Welle", "bei 50 km/h"], "Weist darauf hin, dass die Ampeln der Straße so geschaltet sind, dass bei gleichmäßiger Fahrt mit der angegebenen Geschwindigkeit die Grünphasen erreicht werden. Es handelt sich um eine Empfehlung, die Höchstgeschwindigkeit bleibt unberührt.", NUM_NOTE),
  // Ausnahmen (Text mit "frei")
  Z("1020-11", "Schwerbehinderte mit Parkausweis frei", `${FREI("schwerbehinderte Menschen mit außergewöhnlicher Gehbehinderung, blinde Menschen und gleichgestellte Personen mit dem angegebenen Parkausweis")} Zum Beispiel unter Zeichen 286 dürfen sie hier parken.`, "Zusatzzeichen 1020-11: weißes Rechteck mit Rollstuhlsymbol und der Aufschrift mit Parkausweis Nr. ... frei", () => land(`${pict(P.wheelchair, 2, 16, 76)}${lines(["mit", "Parkausweis", "Nr. ... frei"], 136, 124)}`, ttl("1020-11", "Schwerbehinderte mit Parkausweis frei")), NUM_NOTE),
  Z("1020-12", "Radverkehr und Anlieger frei", `${FREI("den Radverkehr und Anlieger")} Anlieger sind alle, die zu einem Grundstück an der Straße wollen oder von dort kommen, auch Besucher und Lieferanten.`, "Zusatzzeichen 1020-12: weißes Rechteck mit Fahrrad und der Aufschrift Anlieger frei", () => land(`${pict(P.bicycle, 4, 12, 86)}${lines(["Anlieger", "frei"], 142, 100)}`, ttl("1020-12", "Radverkehr und Anlieger frei")), NUM_NOTE),
  txt("1020-30", "Anlieger frei", ["Anlieger frei"], `${FREI("Anlieger")} Anlieger sind alle, die zu einem Grundstück an dieser Straße wollen oder von dort kommen: Bewohner, Besucher, Kunden, Lieferanten. Wer die Straße nur zum Durchfahren nutzt, darf nicht einfahren.`),
  txt("1020-32", "Bewohner mit Parkausweis frei", ["Bewohner mit", "Parkausweis", "Nr. ... frei"], `${FREI("Bewohner mit dem angegebenen Bewohnerparkausweis")} Zum Beispiel dürfen sie im eingeschränkten Halteverbot oder in einer Parkraumbewirtschaftungszone ohne Parkschein parken.`, NUM_NOTE),
  frei("1022-10", "Radverkehr frei", P.bicycle, "Fahrrad", `${FREI("den Radverkehr")} Zum Beispiel dürfen Radfahrer unter Zeichen 267 in Gegenrichtung in die Einbahnstraße einfahren oder unter Zeichen 239 den Gehweg befahren; dort müssen sie Schrittgeschwindigkeit fahren und Fußgängern Vorrang lassen.`),
  frei("1022-11", "Krafträder frei", P.motorbike, "Motorrad", FREI("Krafträder, auch mit Beiwagen, Kleinkrafträder und Mopeds"), NUM_NOTE),
  frei("1022-12", "Mofas frei", moped, "Mofa", FREI("Mofas"), NUM_NOTE),
  frei("1022-16", "Elektrokleinstfahrzeuge frei", escooter, "E-Tretroller", `${FREI("Elektrokleinstfahrzeuge wie E-Tretroller")} Zum Beispiel dürfen sie eine für sie sonst gesperrte Einbahnstraße in Gegenrichtung befahren oder einen Gehweg benutzen; auf Gehwegen ist dann Schrittgeschwindigkeit geboten.`, NUM_NOTE),
  frei("1024-10", "Personenkraftwagen frei", P.carFront, "Pkw von vorn", FREI("Personenkraftwagen")),
  frei("1024-11", "Personenkraftwagen mit Anhänger frei", carTrailer, "Pkw mit Anhänger", FREI("Personenkraftwagen mit Anhänger")),
  frei("1024-12", "Kraftfahrzeuge mit einer zulässigen Gesamtmasse über 3,5 t frei", P.truckFront, "Lkw von vorn", FREI("Kraftfahrzeuge mit einer zulässigen Gesamtmasse über 3,5 t einschließlich ihrer Anhänger und Zugmaschinen (Lkw)")),
  frei("1024-13", "Lastkraftwagen mit Anhänger frei", truckTrailer, "Lkw mit Anhänger", FREI("Lastkraftwagen mit Anhänger")),
  frei("1024-14", "Kraftomnibusse frei", busFront, "Bus von vorn", FREI("Kraftomnibusse")),
  frei("1024-20", "Elektrofahrzeuge frei", ecar, "Pkw mit Stecker", FREI("elektrisch betriebene Fahrzeuge mit E-Kennzeichen"), NUM_NOTE),
  txt("1026-30", "Taxi frei", ["Taxi frei"], FREI("Taxis")),
  txt("1026-32", "Linienverkehr frei", ["Linienverkehr", "frei"], FREI("Fahrzeuge des öffentlichen Linienverkehrs (Linienbusse)")),
  txt("1026-34", "Schulbus frei", ["Schulbus frei"], FREI("Schulbusse"), NUM_NOTE),
  txt("1026-35", "Lieferverkehr frei", ["Lieferverkehr", "frei"], `${FREI("den Lieferverkehr")} Lieferverkehr ist die geschäftsmäßige Beförderung von Gütern zu oder von Anliegern; das reine Abholen privater Einkäufe zählt in der Regel nicht dazu.`),
  txt("1026-36", "Land- und forstwirtschaftlicher Verkehr frei", ["Land- und forst-", "wirtschaftlicher", "Verkehr frei"], FREI("Fahrzeuge, die land- oder forstwirtschaftlichen Zwecken dienen, etwa Traktoren und Erntemaschinen auf dem Weg zu Feldern oder Wäldern")),
  txt("1026-37", "Landwirtschaftlicher Verkehr frei", ["Landwirtschaft-", "licher Verkehr", "frei"], FREI("Fahrzeuge, die landwirtschaftlichen Zwecken dienen")),
  txt("1026-38", "Forstwirtschaftlicher Verkehr frei", ["Forstwirtschaft-", "licher Verkehr", "frei"], FREI("Fahrzeuge, die forstwirtschaftlichen Zwecken dienen")),
  txt("1026-39", "Polizei frei", ["Polizei frei"], FREI("Fahrzeuge der Polizei"), NUM_NOTE),
  txt("1028-30", "Zufahrt bis ... frei", ["Zufahrt bis", "... frei"], `${FREI("die Zufahrt bis zu der angegebenen Stelle, etwa bis zu einer Baustelle oder einem Ortsteil")}`, NUM_NOTE),
  txt("1028-33", "Baustellenfahrzeuge frei", ["Baustellen-", "fahrzeuge", "frei"], FREI("Fahrzeuge, die für die Arbeiten an der Baustelle eingesetzt werden"), NUM_NOTE),
  // Umweltplaketten
  Z("1031-50", "Freistellung vom Verkehrsverbot: rote, gelbe und grüne Plakette", "Kennzeichnet unter Zeichen 270.1 (Umweltzone), dass Kraftfahrzeuge mit roter, gelber oder grüner Feinstaubplakette in die Zone einfahren dürfen. Fahrzeuge ohne Plakette dürfen nicht einfahren.", "Zusatzzeichen 1031-50: weißes Rechteck mit roter, gelber und grüner Plakette und der Aufschrift frei", () => land(plakettenFrei(["rot", "gelb", "gruen"]), ttl("1031-50", "Plaketten rot, gelb, grün frei"))),
  Z("1031-51", "Freistellung vom Verkehrsverbot: gelbe und grüne Plakette", "Kennzeichnet unter Zeichen 270.1 (Umweltzone), dass nur Kraftfahrzeuge mit gelber oder grüner Feinstaubplakette einfahren dürfen.", "Zusatzzeichen 1031-51: weißes Rechteck mit gelber und grüner Plakette und der Aufschrift frei", () => land(plakettenFrei(["gelb", "gruen"]), ttl("1031-51", "Plaketten gelb, grün frei"))),
  Z("1031-52", "Freistellung vom Verkehrsverbot: grüne Plakette", "Kennzeichnet unter Zeichen 270.1 (Umweltzone), dass nur Kraftfahrzeuge mit grüner Feinstaubplakette einfahren dürfen. Das ist heute in fast allen Umweltzonen die geltende Regelung.", "Zusatzzeichen 1031-52: weißes Rechteck mit grüner Plakette und der Aufschrift frei", () => land(plakettenFrei(["gruen"]), ttl("1031-52", "Plakette grün frei"))),
  // Zeitliche Beschränkungen
  txt("1040-30", "Zeitliche Beschränkung", ["7 - 18 h"], "Beschränkt die Regelung des Hauptzeichens auf die angegebene Tageszeit, hier von 7 bis 18 Uhr. Außerhalb dieser Zeit gilt das Zeichen nicht."),
  txt("1040-31", "Zeitliche Beschränkung (zwei Zeiträume)", ["8 - 11 h", "16 - 18 h"], "Beschränkt die Regelung des Hauptzeichens auf die angegebenen Zeiträume des Tages. Außerhalb dieser Zeiten gilt das Zeichen nicht.", NUM_NOTE),
  Z("1040-32", "Parkscheibe (Höchstparkdauer)", "Das Parken ist nur mit Parkscheibe und höchstens für die angegebene Dauer erlaubt, hier zwei Stunden. Die Parkscheibe wird auf die nächste halbe Stunde nach der Ankunft eingestellt und gut sichtbar hinter der Windschutzscheibe ausgelegt.", "Zusatzzeichen 1040-32: weißes Rechteck mit blauer Parkscheibe und der Aufschrift 2 Std.", () => land(`${pict(parkDisc, 8, 8, 94)}${T(150, 70, 34, "2 Std.", 90)}`, ttl("1040-32", "Parkscheibe 2 Stunden"))),
  Z("1040-33", "Parkscheibe mit Zeitangabe", "Das Parken ist mit Parkscheibe höchstens für die angegebene Dauer erlaubt, und zwar nur während der genannten Zeit, hier zwei Stunden zwischen 9 und 18 Uhr. Außerhalb dieser Zeit darf ohne Parkscheibe unbegrenzt geparkt werden.", "Zusatzzeichen 1040-33: weißes Rechteck mit blauer Parkscheibe und der Aufschrift 2 Std. 9 - 18 h", () => land(`${pict(parkDisc, 8, 8, 94)}${lines(["2 Std.", "9 - 18 h"], 150, 90)}`, ttl("1040-33", "Parkscheibe mit Zeitangabe")), NUM_NOTE),
  txt("1042-30", "Zeitliche Beschränkung an Wochentagen", ["Mo - Fr"], "Beschränkt die Regelung des Hauptzeichens auf die Tage Montag bis Freitag. An Samstagen, Sonntagen und Feiertagen gilt das Zeichen nicht.", NUM_NOTE),
  txt("1042-31", "Zeitliche Beschränkung an Wochentagen mit Uhrzeit", ["Mo - Fr", "16 - 18 h"], "Beschränkt die Regelung des Hauptzeichens auf die angegebenen Tage und Uhrzeiten, hier Montag bis Freitag von 16 bis 18 Uhr.", NUM_NOTE),
  txt("1042-33", "Zeitliche Beschränkung werktags", ["werktags", "7 - 18 h"], "Beschränkt die Regelung des Hauptzeichens auf Werktage zu den angegebenen Zeiten. Werktage sind Montag bis Samstag, sofern der Samstag kein gesetzlicher Feiertag ist.", NUM_NOTE),
  // Parkberechtigte
  Z("1044-10", "Schwerbehinderte mit Parkausweis", "Die Parkfläche ist Menschen mit außergewöhnlicher Gehbehinderung, blinden Menschen und gleichgestellten Personen vorbehalten, die den angegebenen (blauen) Parkausweis gut sichtbar auslegen. Alle anderen dürfen hier weder parken noch halten, um zu warten.", "Zusatzzeichen 1044-10: weißes Rechteck mit Rollstuhlsymbol und der Aufschrift mit Parkausweis Nr. ...", () => land(`${pict(P.wheelchair, 2, 16, 76)}${lines(["mit", "Parkausweis", "Nr. ..."], 136, 124)}`, ttl("1044-10", "Schwerbehinderte mit Parkausweis"))),
  txt("1044-30", "Bewohner mit Parkausweis", ["Bewohner mit", "Parkausweis", "Nr. ..."], "Die Parkfläche ist Bewohnern mit dem angegebenen Bewohnerparkausweis vorbehalten. Andere dürfen hier nicht parken, es sei denn, ein weiteres Zusatzzeichen lässt es (etwa mit Parkschein) zu.", NUM_NOTE),
  // Fahrzeugkombinationen
  Z("1049-13", "Kraftfahrzeuge über 3,5 t, Kraftomnibusse und Personenkraftwagen mit Anhänger", "Beschränkt das Hauptzeichen auf Kraftfahrzeuge mit einer zulässigen Gesamtmasse über 3,5 t, Kraftomnibusse und Personenkraftwagen mit Anhänger, zum Beispiel bei einem Überholverbot oder einer Geschwindigkeitsbeschränkung für diese Fahrzeugarten.", "Zusatzzeichen 1049-13: weißes Rechteck mit Lkw, Bus und Pkw mit Anhänger nebeneinander", () => land(`${pict(P.truckFront, 2, 14, 66)}${pict(busFront, 66, 14, 66)}${pict(carTrailer, 128, 14, 70)}`, ttl("1049-13", "Lkw, Kraftomnibus und Pkw mit Anhänger")), NUM_NOTE),
  // Parkflächen für bestimmte Nutzer
  txt("1050-30", "Taxi (Taxenstand)", ["Taxi"], "Kennzeichnet unter Zeichen 229 oder 314 einen Taxenstand oder eine Parkfläche für Taxis. Andere Fahrzeuge dürfen hier nicht parken; Halten ist nur zum Ein- und Aussteigen erlaubt, wenn kein Taxi behindert wird.", NUM_NOTE),
  Z("1050-33", "Elektrofahrzeuge während des Ladevorgangs", "Die Parkfläche ist elektrisch betriebenen Fahrzeugen vorbehalten, und zwar nur während sie an der Ladesäule laden. Andere Fahrzeuge und nicht ladende Elektrofahrzeuge dürfen hier nicht parken.", "Zusatzzeichen 1050-33: weißes Rechteck mit Pkw mit Stecker und der Aufschrift während des Ladevorgangs", () => land(`${pict(ecar, 0, 14, 80)}${lines(["während", "des Lade-", "vorgangs"], 138, 120)}`, ttl("1050-33", "Elektrofahrzeuge während des Ladevorgangs")), NUM_NOTE),
  // Sonstige Beschränkungen
  txt("1053-31", "Mit Parkschein", ["mit Parkschein"], "Das Parken ist nur mit gültigem Parkschein aus dem Parkscheinautomaten erlaubt; der Schein muss gut sichtbar ausgelegt werden. Zeitangaben auf weiteren Zusatzzeichen begrenzen die Pflicht auf bestimmte Zeiten."),
  txt("1053-33", "Gebührenpflichtig", ["gebührenpflichtig"], "Für das Parken ist eine Gebühr zu entrichten, etwa am Parkscheinautomaten oder per Handyparken."),
  txt("1053-35", "Bei Nässe", ["bei Nässe"], "Die Regelung des Hauptzeichens, meist eine Geschwindigkeitsbeschränkung, gilt nur bei Nässe. Nässe liegt vor, wenn die Fahrbahn mit einem durchgehenden Wasserfilm bedeckt ist, nicht schon bei einzelnen feuchten Stellen."),
  txt("1053-37", "Massenangabe", ["12 t"], "Beschränkt das Hauptzeichen auf Fahrzeuge über der angegebenen zulässigen Gesamtmasse, zum Beispiel unter Zeichen 253 auf Lkw über 12 t.", NUM_NOTE),
];
