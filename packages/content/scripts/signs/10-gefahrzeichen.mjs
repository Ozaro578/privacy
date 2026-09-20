// Gefahrzeichen (StVO Anlage 1, Abschnitt 1 Gefahrzeichen und Abschnitt 2 Bahnübergänge) einschließlich der
// Varianten des Verkehrszeichenkatalogs (VzKat). Piktogramme im 100×100-Raster, schwarz auf weißem Dreieck.
import { P, triangleUp, svgOpen, text, BLACK, WHITE, RED } from "../lib/sign-kit.mjs";

const CAT = "gefahrzeichen";
/** Piktogramm horizontal spiegeln (Aufstellung links / Richtung rechts) */
const mirror = (inner) => `<g transform="translate(100 0) scale(-1 1)">${inner}</g>`;
const stroke = (d, w = 8, cap = "round") => `<path d="${d}" fill="none" stroke="${BLACK}" stroke-width="${w}" stroke-linecap="${cap}" stroke-linejoin="round"/>`;
const fill = (d) => `<path d="${d}" fill="${BLACK}"/>`;

// ---------------------------------------------------------------------------------------------
// Piktogramme (Blickrichtung der Figuren nach links = Aufstellung rechts, Suffix -10)
// ---------------------------------------------------------------------------------------------
const PICT = {
  // 103 Kurve links: dicker Strich von unten, oben nach links abknickend
  curveLeft: stroke("M58 92 V52 Q58 34 40 34 H24", 13, "butt"),
  // 105 Doppelkurve zunächst links: S-förmiger Strich
  doubleCurveLeft: stroke("M56 94 V78 Q56 66 44 66 H40 Q32 66 32 58 V50 Q32 40 42 40 H64", 12, "butt"),
  // 108 Gefälle: schwarzer Keil links, Prozentzahl rechts oben
  slopeDown: (pct) => `${fill("M12 92 V50 L90 92 Z")}${text(66, 62, 19, `${pct} %`)}`,
  // 110 Steigung: Keil rechts, Prozentzahl links oben
  slopeUp: (pct) => `${fill("M88 92 V50 L10 92 Z")}${text(34, 62, 19, `${pct} %`)}`,
  // 112 Unebene Fahrbahn: zwei Bodenwellen
  bumps: stroke("M6 80 H18 C24 80 26 58 36 58 C46 58 46 80 54 80 C62 80 62 58 72 58 C82 58 84 80 90 80 H94", 7, "butt"),
  // 113 Schnee- oder Eisglätte: Schneeflocke über schleuderndem Auto
  snow: `<g transform="translate(29 4) scale(0.42)">${P.snowflake}</g><g transform="translate(20 40) scale(0.6)">${P.skidCar}</g>`,
  // 114 Schleudergefahr: Auto mit Schleuderspuren (leicht schräg)
  skid: `<g transform="rotate(-12 50 50)">${P.skidCar}</g>`,
  // 101-15 Steinschlag: Hang rechts, herabfallende Steine
  rocks: `${fill("M95 100 V38 L86 44 L89 58 L80 70 L85 86 L80 100 Z")}${fill("M60 50 L69 46 L73 55 L64 59 Z")}${fill("M46 66 L56 62 L58 72 L48 75 Z")}${fill("M30 82 L40 78 L42 88 L32 90 Z")}${fill("M62 84 L72 80 L74 90 L64 92 Z")}${fill("M10 96 H78 V100 H10 Z")}`,
  // 101-51 Splitt, Schotter: Auto von hinten, aufgewirbelte Steinchen
  gravel: `<g transform="translate(15 22) scale(0.7)">${P.carFront}</g>${[[18, 64], [24, 54], [12, 76], [82, 66], [76, 56], [88, 78], [22, 88], [78, 88]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="${BLACK}"/>`).join("")}`,
  // 117 Seitenwind von rechts: Windsack weht nach links (Mast rechts)
  windFromRight: mirror(P.windsock),
  // 120 Verengte Fahrbahn: beide Ränder rücken zusammen
  narrowBoth: `${fill("M22 92 V64 L38 46 V20 H46 V50 L30 68 V92 Z")}${fill("M78 92 V64 L62 46 V20 H54 V50 L70 68 V92 Z")}`,
  // 121 Einseitig verengte Fahrbahn (rechts): linker Rand gerade, rechter rückt ein
  narrowRight: `${fill("M26 92 V20 H34 V92 Z")}${fill("M78 92 V64 L62 46 V20 H54 V50 L70 68 V92 Z")}`,
  // 123 Arbeitsstelle: Person mit Schaufel und Erdhaufen
  worker: `<circle cx="38" cy="16" r="8" fill="${BLACK}"/>${fill("M31 27 H47 L54 44 L48 60 L52 86 H43 L40 64 L34 60 L30 86 H21 L26 56 L24 40 Z")}${stroke("M46 42 L74 66", 6, "butt")}${fill("M68 60 L84 76 L78 82 L62 66 Z")}${fill("M56 92 Q76 62 96 92 Z")}`,
  // 124 Stau: drei Autos hintereinander
  jam: `<g transform="translate(29 8) scale(0.42)">${P.carFront}</g><g transform="translate(8 44) scale(0.5)">${P.carFront}</g><g transform="translate(43 44) scale(0.5)">${P.carFront}</g>`,
  // 125 Gegenverkehr: Pfeil abwärts links, Pfeil aufwärts rechts
  oncoming: `${fill("M33 16 H43 V62 H55 L38 90 L21 62 H33 Z")}${fill("M67 90 H57 V44 H45 L62 16 L79 44 H67 Z")}`,
  // 101-52 Bewegliche Brücke: rechte Fahrbahn, links hochgeklappter Brückenteil
  drawbridge: `${fill("M50 80 H94 V88 H50 Z")}${fill("M6 80 H22 V88 H6 Z")}${fill("M20 86 L16 80 L48 40 L54 46 Z")}${stroke("M28 94 q5 -5 10 0 t10 0 t10 0", 4)}`,
  // 101-53 Ufer: Kaimauer, Auto kippt zum Wasser, Wellen
  shore: `${stroke("M4 62 H44 V94", 7, "butt")}<g transform="rotate(28 44 52)">${fill("M18 58 H70 L66 46 H56 L48 38 H32 L26 46 H18 Z")}<circle cx="30" cy="60" r="5" fill="${BLACK}"/><circle cx="58" cy="60" r="5" fill="${BLACK}"/></g>${stroke("M50 90 q6 -6 12 0 t12 0 t12 0", 4)}`,
  // 101-54 Unzureichendes Lichtraumprofil: Brückenträger, darunter zu hoher Lkw
  lowClearance: `${fill("M16 34 H84 V42 H16 Z")}${fill("M16 42 H24 V92 H16 Z")}${fill("M76 42 H84 V92 H76 Z")}<g transform="translate(20 22) scale(0.6)">${P.truckFront}</g>`,
  // 131 Lichtzeichenanlage: Ampel mit drei Leuchten
  lights: P.trafficLight,
  // 133 Fußgänger: gehende Person nach links
  pedestrian: `<circle cx="42" cy="13" r="8" fill="${BLACK}"/>${fill("M35 23 H53 L52 55 H39 Z")}${stroke("M51 26 L62 46 M38 26 L27 44 M43 54 L27 86 M50 54 L61 86", 8)}`,
  // 101-11 Fußgängerüberweg: Person auf Zebrastreifen
  crosswalk: `<g transform="translate(15 0) scale(0.7)"><circle cx="42" cy="13" r="8" fill="${BLACK}"/>${fill("M35 23 H53 L52 55 H39 Z")}${stroke("M51 26 L62 46 M38 26 L27 44 M43 54 L27 86 M50 54 L61 86", 8)}</g><g fill="${BLACK}"><rect x="30" y="70" width="40" height="6"/><rect x="22" y="80" width="56" height="6"/><rect x="12" y="90" width="76" height="6"/></g>`,
  // 136 Kinder: zwei laufende Kinder nach links
  children: `<circle cx="34" cy="26" r="6.5" fill="${BLACK}"/>${fill("M28 34 H40 L38 56 H30 Z")}${stroke("M39 36 L48 46 M29 36 L19 42 M31 55 L18 80 M37 55 L46 78", 6.5)}<circle cx="68" cy="13" r="7.5" fill="${BLACK}"/>${fill("M61 22 H75 L73 52 H63 Z")}${stroke("M74 26 L86 40 M62 26 L50 30 M64 51 L50 84 M71 51 L84 80", 7.5)}`,
  // 138 Radverkehr: Fahrrad nach links
  bicycle: `<circle cx="26" cy="68" r="15" fill="none" stroke="${BLACK}" stroke-width="5"/><circle cx="74" cy="68" r="15" fill="none" stroke="${BLACK}" stroke-width="5"/>${stroke("M26 68 L36 40 L62 40 L74 68 M36 40 L50 70 L62 40 M50 70 L74 68 M30 36 H42 M58 37 H70", 5)}<circle cx="50" cy="70" r="4" fill="${BLACK}"/>`,
  // 142 Wildwechsel: springendes Wild nach links
  deer: mirror(P.deer),
  // 101-12 Viehtrieb: Rind nach links
  cow: `${fill("M26 44 H72 Q82 44 82 54 V66 H76 V88 H69 V66 H60 V88 H53 V66 H39 V88 H32 V66 H26 Z")}${fill("M26 44 L16 38 L10 44 L12 58 L20 64 L28 62 Z")}${stroke("M14 38 L8 30 M18 36 L16 27", 3.5)}${stroke("M82 52 L90 68", 3.5)}`,
  // 101-13 Reiter: Pferd mit Reiter nach links
  rider: `${fill("M26 52 H72 Q82 52 84 62 L86 76 H80 L77 63 H72 L74 88 H67 L63 64 H45 L41 88 H34 L38 64 H30 L26 78 H19 L22 62 Z")}${fill("M28 54 L20 34 L10 30 L8 38 L14 42 L18 44 L22 60 Z")}${fill("M44 52 L46 24 H57 L60 52 Z")}<circle cx="52" cy="15" r="6.5" fill="${BLACK}"/>${stroke("M46 50 L44 70 M48 30 L28 40", 5)}`,
  // 101-14 Amphibienwanderung: Frosch nach links
  frog: `<ellipse cx="52" cy="62" rx="20" ry="11" fill="${BLACK}"/>${fill("M36 58 L22 50 Q14 52 16 60 L28 70 L38 68 Z")}<circle cx="24" cy="48" r="4.5" fill="${BLACK}"/>${fill("M66 56 L86 42 L92 48 L78 62 L88 76 L82 82 L64 68 Z")}${fill("M42 70 L26 84 L32 88 L48 76 Z")}`,
  // 101-10 Flugbetrieb: Flugzeug (Draufsicht) nach links
  plane: `${fill("M8 53 L18 46 H80 Q90 46 90 53 Q90 60 80 60 H18 Z")}${fill("M40 47 H52 L60 12 H50 Z")}${fill("M40 59 H52 L60 94 H50 Z")}${fill("M72 47 H82 L88 32 H80 Z")}${fill("M72 59 H82 L88 74 H80 Z")}`,
  // 150 Bahnübergang mit Schranken (bis 2009): Zaun/Schranke
  gate: `${fill("M10 44 H90 V50 H10 Z")}${fill("M10 66 H90 V72 H10 Z")}${[16, 36, 56, 76].map((x) => fill(`M${x} 32 L${x + 4} 26 L${x + 8} 32 V90 H${x} Z`)).join("")}`,
  // 151 Bahnübergang: Dampflokomotive nach links
  train: `${fill("M14 62 H88 V70 H14 Z")}<rect x="16" y="42" width="46" height="22" rx="4" fill="${BLACK}"/>${fill("M20 26 H34 V30 H32 V44 H22 V30 H20 Z")}${fill("M56 28 H80 V64 H56 Z")}<rect x="62" y="34" width="10" height="10" fill="${WHITE}"/><circle cx="26" cy="78" r="8" fill="${BLACK}"/><circle cx="46" cy="78" r="8" fill="${BLACK}"/><circle cx="66" cy="78" r="8" fill="${BLACK}"/><circle cx="84" cy="80" r="6" fill="${BLACK}"/>${fill("M14 70 L6 88 H18 Z")}`,
};

const tri = (inner, title, size) => triangleUp(inner, title, size);

// ---------------------------------------------------------------------------------------------
// Bahnübergangsbaken (rot-weiß schräg gestreift, Streifen fallen zur Fahrbahn hin ab)
// ---------------------------------------------------------------------------------------------
/** Bake mit n Streifen; side "rechts": Streifen fallen nach links ab, "links": nach rechts. withSign: Zeichen 151 oben. distance: Entfernungsangabe unten. */
function bake(n, side, withSign, distance, title) {
  const W = 120;
  const H = withSign ? 240 : 170;
  const bw = 40;
  const bh = 150;
  const bx = 40;
  const by = withSign ? 86 : 10;
  const rise = 14;
  const t = 18;
  const centers = n === 3 ? [25, 75, 125] : n === 2 ? [50, 100] : [75];
  let stripes = "";
  for (const c of centers) {
    const hi = c - t / 2;
    // Höhere Kante auf der Seite, die von der Fahrbahn abgewandt ist
    stripes += side === "rechts"
      ? `<path d="M${bx} ${hi + rise} L${bx + bw} ${hi} V${hi + t} L${bx} ${hi + t + rise} Z"/>`
      : `<path d="M${bx} ${hi} L${bx + bw} ${hi + rise} V${hi + t + rise} L${bx} ${hi + t} Z"/>`;
  }
  const plate = distance ? `<rect x="36" y="${by + bh + 2}" width="48" height="16" fill="${WHITE}" stroke="${BLACK}" stroke-width="1.2"/>${text(60, by + bh + 14, 11, distance)}` : "";
  const sign = withSign ? `<svg x="14" y="2" width="92" height="92" viewBox="0 0 120 120">${PICT_SIGN_151.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</svg>` : "";
  return `${svgOpen(W, H, title)}<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="2" fill="${WHITE}" stroke="${BLACK}" stroke-width="1.5"/><g fill="${RED}">${stripes}</g><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="2" fill="none" stroke="${BLACK}" stroke-width="1.5"/>${plate}${sign}</svg>`;
}
const PICT_SIGN_151 = tri(PICT.train, "Zeichen 151 Bahnübergang", 54);

const bakeName = (n) => (n === 3 ? "dreistreifig" : n === 2 ? "zweistreifig" : "einstreifig");
const bakeDist = (n) => (n === 3 ? 240 : n === 2 ? 160 : 80);
function bakeEntries(number, n, withSign) {
  const nm = withSign ? `Bahnübergang mit ${bakeName(n)}er Bake` : `${bakeName(n).replace(/^./, (c) => c.toUpperCase())}e Bake`;
  const stripesText = `${n === 3 ? "drei" : n === 2 ? "zwei" : "ein"} rote${n === 1 ? "r" : ""} Schrägstreifen`;
  const base = withSign
    ? `Kündigt einen Bahnübergang an: Die dreistreifige Bake mit Zeichen 151 steht in der Regel 240 m vor dem Bahnübergang. Geschwindigkeit verringern, aufmerksam fahren und ab hier nicht mehr überholen (Überholverbot zwischen Bake und Bahnübergang außerorts).`
    : `Bake vor einem Bahnübergang, steht in der Regel ${bakeDist(n)} m davor. Weiter bremsbereit bleiben, auf Schienenverkehr achten und nicht überholen.`;
  const out = [];
  for (const [suffix, side, dist] of [["10", "rechts", null], ["11", "rechts", `${Math.round(bakeDist(n) * 0.75)} m`], ["20", "links", null], ["21", "links", `${Math.round(bakeDist(n) * 0.75)} m`]]) {
    const id = `${number}-${suffix}`;
    const variant = `Aufstellung ${side}${dist ? ", mit Entfernungsangabe" : ""}`;
    out.push({
      id,
      number: id,
      name: `${nm} (${variant})`,
      category: CAT,
      meaning: dist ? `${base} Die Entfernungsangabe nennt den tatsächlichen Abstand, wenn die Bake nicht im Regelabstand steht.` : base,
      alt: `Zeichen ${id} ${nm}: weiße Bake mit ${stripesText}, die zur Fahrbahn hin abfallen${withSign ? ", oben das Dreieck Zeichen 151 mit Lokomotive" : ""}${dist ? `, darunter Entfernungsangabe ${dist}` : ""}, Aufstellung ${side}`,
      note: dist ? `Variante -${suffix} als Bake mit Entfernungsangabe nachgebildet (Beispielwert ${dist}); Zuordnung des VzKat-Suffixes bitte prüfen.` : (number === "157" || number === "162" ? "Nummernzuordnung 157 dreistreifig / 159 zweistreifig / 162 einstreifig nach StVO 2009 ff.; bitte gegen VzKat prüfen." : undefined),
      svg: () => bake(n, side, withSign, dist, `Zeichen ${id} ${nm}, Aufstellung ${side}`),
    });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Katalog
// ---------------------------------------------------------------------------------------------
const e = (id, number, name, meaning, alt, inner, size = 52, note) => ({
  id, number, name, category: CAT, meaning, alt, ...(note ? { note } : {}), svg: () => tri(inner, `Zeichen ${number} ${name}`, size),
});

const SIDE = (id, name, meaning, altPict, inner, size, note) => [
  e(`${id}-10`, `${id}-10`, `${name} (Aufstellung rechts)`, meaning, `Zeichen ${id}-10 ${name}: rotes Dreieck, ${altPict} nach links`, inner, size, note),
  e(`${id}-20`, `${id}-20`, `${name} (Aufstellung links)`, meaning, `Zeichen ${id}-20 ${name}: rotes Dreieck, ${altPict} nach rechts`, mirror(inner), size, note),
];

const OLD = (num, newId) => `Bis 2009 in der StVO als Zeichen ${num} geführt; heute Zeichen ${newId}. Alte Schilder sind noch anzutreffen.`;

export default [
  e("101", "101", "Gefahrstelle", "Warnt vor einer Gefahrstelle, die kein anderes Gefahrzeichen bezeichnet; ein Zusatzzeichen nennt die Art der Gefahr. Geschwindigkeit anpassen, bremsbereit sein und die Situation beobachten.", "Zeichen 101 Gefahrstelle: rotes Dreieck mit schwarzem Ausrufezeichen", P.exclamation),
  e("102", "102", "Kreuzung oder Einmündung mit Vorfahrt von rechts", "Kündigt eine Kreuzung oder Einmündung an, an der die Regel rechts vor links gilt. Geschwindigkeit verringern, nach rechts beobachten und Fahrzeugen von rechts Vorfahrt gewähren.", "Zeichen 102 Kreuzung oder Einmündung mit Vorfahrt von rechts: rotes Dreieck mit schwarzem Kreuz", P.cross),
  e("103-10", "103-10", "Kurve (links)", "Warnt vor einer Linkskurve, die schwer einsehbar oder enger als erwartet ist. Vor der Kurve Geschwindigkeit verringern, in der Kurve nicht bremsen und den rechten Fahrbahnrand einhalten.", "Zeichen 103-10 Kurve links: rotes Dreieck mit dickem schwarzem Strich, der nach links abknickt", PICT.curveLeft),
  e("103-20", "103-20", "Kurve (rechts)", "Warnt vor einer Rechtskurve, die schwer einsehbar oder enger als erwartet ist. Vor der Kurve Geschwindigkeit verringern, in der Kurve nicht bremsen und den rechten Fahrbahnrand einhalten.", "Zeichen 103-20 Kurve rechts: rotes Dreieck mit dickem schwarzem Strich, der nach rechts abknickt", mirror(PICT.curveLeft)),
  e("105-10", "105-10", "Doppelkurve (zunächst links)", "Warnt vor zwei aufeinanderfolgenden Kurven, die erste nach links. Geschwindigkeit vor der ersten Kurve verringern und für beide Kurven beibehalten, rechts halten und nicht überholen.", "Zeichen 105-10 Doppelkurve zunächst links: rotes Dreieck mit S-förmig geschwungenem schwarzem Strich, der zuerst nach links führt", PICT.doubleCurveLeft),
  e("105-20", "105-20", "Doppelkurve (zunächst rechts)", "Warnt vor zwei aufeinanderfolgenden Kurven, die erste nach rechts. Geschwindigkeit vor der ersten Kurve verringern und für beide Kurven beibehalten, rechts halten und nicht überholen.", "Zeichen 105-20 Doppelkurve zunächst rechts: rotes Dreieck mit S-förmig geschwungenem schwarzem Strich, der zuerst nach rechts führt", mirror(PICT.doubleCurveLeft)),
  e("108-10", "108-10", "Gefälle 10 %", "Warnt vor einem starken Gefälle von 10 Prozent. Rechtzeitig zurückschalten und die Motorbremswirkung nutzen, nicht dauerhaft bremsen, damit die Bremsen nicht überhitzen; längeren Abstand halten.", "Zeichen 108-10 Gefälle 10 %: rotes Dreieck mit schwarzem, nach rechts abfallendem Keil und Aufschrift 10 %", PICT.slopeDown(10), 56),
  e("110-12", "110-12", "Steigung 12 %", "Warnt vor einer starken Steigung von 12 Prozent. Rechtzeitig in einen kleineren Gang schalten, mit langsamen Fahrzeugen rechnen und nicht überholen, wenn die Strecke unübersichtlich ist.", "Zeichen 110-12 Steigung 12 %: rotes Dreieck mit schwarzem, nach rechts ansteigendem Keil und Aufschrift 12 %", PICT.slopeUp(12), 56),
  e("112", "112", "Unebene Fahrbahn", "Warnt vor Bodenwellen, Schlaglöchern oder Fahrbahnschäden. Geschwindigkeit deutlich verringern, Lenkrad festhalten und mit Ausbrechen des Fahrzeugs rechnen.", "Zeichen 112 Unebene Fahrbahn: rotes Dreieck mit schwarzer Linie mit zwei Bodenwellen", PICT.bumps),
  e("113", "113", "Schnee- oder Eisglätte", "Warnt vor einer Stelle, an der besonders häufig Schnee- oder Eisglätte auftritt (etwa Brücken, schattige Waldstücke). Bei winterlicher Witterung langsam fahren, abrupte Lenk- und Bremsvorgänge vermeiden und mehr Abstand halten.", "Zeichen 113 Schnee- oder Eisglätte: rotes Dreieck mit Schneeflocke über einem schleudernden Auto", PICT.snow, 56),
  e("114", "114", "Schleudergefahr bei Nässe oder Schmutz", "Warnt vor Schleudergefahr, weil die Fahrbahn bei Nässe oder Verschmutzung besonders glatt wird. Geschwindigkeit verringern, gleichmäßig fahren und nicht ruckartig lenken oder bremsen.", "Zeichen 114 Schleudergefahr bei Nässe oder Schmutz: rotes Dreieck mit schleuderndem Auto und Schleuderspuren", PICT.skid, 56),
  e("115", "115", "Steinschlag", "Warnt vor Steinschlag und auf der Fahrbahn liegenden Steinen. Langsam und aufmerksam fahren, nicht anhalten und mit Hindernissen auf der Fahrbahn rechnen.", "Zeichen 115 Steinschlag: rotes Dreieck mit Felshang rechts und herabfallenden Steinen", PICT.rocks, 56, OLD("115", "101-15")),
  e("116", "116", "Splitt, Schotter", "Warnt vor losem Splitt oder Schotter auf der Fahrbahn. Geschwindigkeit verringern, Abstand zum Vordermann vergrößern (Steinschlag an der Windschutzscheibe) und ruhig lenken, da die Haftung geringer ist.", "Zeichen 116 Splitt, Schotter: rotes Dreieck mit Auto von hinten und aufgewirbelten Steinchen", PICT.gravel, 56, OLD("116", "101-51")),
  e("117-10", "117-10", "Seitenwind (von rechts)", "Warnt vor starkem Seitenwind von rechts, etwa auf Brücken oder an Waldrändern. Lenkrad fest halten, Geschwindigkeit verringern und mit plötzlichem Versetzen des Fahrzeugs rechnen, besonders beim Überholen von Lkw.", "Zeichen 117-10 Seitenwind von rechts: rotes Dreieck mit Windsack, der nach links weht", PICT.windFromRight, 52, "Windsack nach Windrichtung gezeichnet (Wind von rechts: Sack weht nach links); Richtung der VzKat-Grafik bitte prüfen."),
  e("117-20", "117-20", "Seitenwind (von links)", "Warnt vor starkem Seitenwind von links, etwa auf Brücken oder an Waldrändern. Lenkrad fest halten, Geschwindigkeit verringern und mit plötzlichem Versetzen des Fahrzeugs rechnen, besonders beim Überholen von Lkw.", "Zeichen 117-20 Seitenwind von links: rotes Dreieck mit Windsack, der nach rechts weht", P.windsock, 52, "Windsack nach Windrichtung gezeichnet (Wind von links: Sack weht nach rechts); Richtung der VzKat-Grafik bitte prüfen."),
  e("120", "120", "Verengte Fahrbahn", "Warnt vor einer Verengung der Fahrbahn von beiden Seiten. Geschwindigkeit verringern, sich rechtzeitig einordnen und dem Gegenverkehr Platz lassen; wer die Engstelle zuerst erreicht, darf durchfahren.", "Zeichen 120 Verengte Fahrbahn: rotes Dreieck mit zwei schwarzen Rändern, die nach oben zusammenlaufen", PICT.narrowBoth),
  e("121-10", "121-10", "Einseitig (rechts) verengte Fahrbahn", "Warnt vor einer Verengung der Fahrbahn auf der rechten Seite. Rechtzeitig nach links einordnen, Geschwindigkeit verringern und dem Verkehr auf der durchgehenden Spur den Vorrang lassen.", "Zeichen 121-10 Einseitig rechts verengte Fahrbahn: rotes Dreieck, linker Rand gerade, rechter Rand rückt nach innen", PICT.narrowRight),
  e("121-20", "121-20", "Einseitig (links) verengte Fahrbahn", "Warnt vor einer Verengung der Fahrbahn auf der linken Seite. Rechtzeitig nach rechts einordnen, Geschwindigkeit verringern und dem Verkehr auf der durchgehenden Spur den Vorrang lassen.", "Zeichen 121-20 Einseitig links verengte Fahrbahn: rotes Dreieck, rechter Rand gerade, linker Rand rückt nach innen", mirror(PICT.narrowRight)),
  e("123", "123", "Arbeitsstelle", "Warnt vor einer Baustelle mit Arbeitern, Baufahrzeugen, Fahrbahnverengungen und schlechtem Fahrbahnzustand. Geschwindigkeit deutlich verringern, den Anweisungen und der gelben Beschilderung folgen und besonders auf Arbeiter achten.", "Zeichen 123 Arbeitsstelle: rotes Dreieck mit Person, die mit einer Schaufel einen Erdhaufen abträgt", PICT.worker, 56),
  e("124", "124", "Stau", "Warnt vor einem Stau oder stockendem Verkehr. Geschwindigkeit verringern, Abstand vergrößern, bremsbereit bleiben und bei stehendem Verkehr Warnblinklicht einschalten; auf Autobahnen eine Rettungsgasse bilden.", "Zeichen 124 Stau: rotes Dreieck mit drei hintereinander stehenden Autos", PICT.jam, 56),
  e("125", "125", "Gegenverkehr", "Warnt davor, dass nach einer Einbahnstraße, Richtungsfahrbahn oder Baustelle wieder Gegenverkehr auf derselben Fahrbahn zu erwarten ist. Rechts fahren, nicht überholen und Sichtfahrgebot beachten.", "Zeichen 125 Gegenverkehr: rotes Dreieck mit schwarzem Pfeil abwärts links und Pfeil aufwärts rechts", PICT.oncoming),
  e("128", "128", "Bewegliche Brücke", "Warnt vor einer Klapp- oder Drehbrücke, die für die Schifffahrt geöffnet werden kann. Bremsbereit fahren und bei Lichtzeichen oder Schranke anhalten.", "Zeichen 128 Bewegliche Brücke: rotes Dreieck mit hochgeklapptem Brückenteil über Wasser", PICT.drawbridge, 56, OLD("128", "101-52")),
  e("129", "129", "Ufer", "Warnt davor, dass die Straße unmittelbar an einem Ufer oder einer Kaimauer entlangführt oder endet. Langsam fahren und ausreichend Abstand zum Fahrbahnrand halten.", "Zeichen 129 Ufer: rotes Dreieck mit Kaimauer, über die ein Auto ins Wasser kippt", PICT.shore, 56, OLD("129", "101-53")),
  e("131", "131", "Lichtzeichenanlage", "Kündigt eine Ampel an, die aus der Entfernung schlecht zu erkennen ist oder an unerwarteter Stelle steht. Geschwindigkeit verringern und bremsbereit sein, da die Ampel jederzeit auf Rot umspringen kann.", "Zeichen 131 Lichtzeichenanlage: rotes Dreieck mit Ampel (rot, gelb, grün)", PICT.lights, 50),
  ...SIDE("133", "Fußgänger", "Warnt vor Fußgängern, die häufig die Fahrbahn betreten oder am Fahrbahnrand gehen. Geschwindigkeit verringern, bremsbereit sein und beim Vorbeifahren ausreichenden Seitenabstand halten.", "gehende Person", PICT.pedestrian, 52),
  ...SIDE("136", "Kinder", "Warnt vor Kindern, die plötzlich auf die Fahrbahn laufen können, etwa in der Nähe von Schulen, Kindergärten oder Spielplätzen. Geschwindigkeit deutlich verringern und jederzeit bremsbereit sein.", "zwei laufende Kinder", PICT.children, 56),
  ...SIDE("138", "Radverkehr", "Warnt vor kreuzendem oder einbiegendem Radverkehr, etwa am Ende eines Radwegs. Geschwindigkeit verringern, beim Abbiegen auf Radfahrende achten und mit unerwartetem Verhalten rechnen.", "Fahrrad", PICT.bicycle, 52),
  ...SIDE("142", "Wildwechsel", "Warnt vor einer Strecke, auf der häufig Wild die Fahrbahn quert, besonders in der Dämmerung und nachts. Geschwindigkeit verringern, Fahrbahnränder beobachten und bei Wild abblenden, hupen und bremsen, nicht ausweichen.", "springendes Wild", PICT.deer, 58),
  e("144", "144", "Flugbetrieb", "Warnt vor tief fliegenden Flugzeugen in der Nähe eines Flugplatzes. Nicht erschrecken lassen, Geschwindigkeit halten und die Aufmerksamkeit bei der Fahrbahn behalten.", "Zeichen 144 Flugbetrieb: rotes Dreieck mit Flugzeug", PICT.plane, 56, OLD("144", "101-10")),
  e("150", "150", "Bahnübergang mit Schranken oder Halbschranken", "Kündigt einen beschrankten Bahnübergang an. Geschwindigkeit verringern, auf Lichtzeichen und Schranken achten und bei rotem Licht oder sich senkender Schranke anhalten.", "Zeichen 150 Bahnübergang mit Schranken: rotes Dreieck mit schwarzem Zaun", PICT.gate, 56, "Bis 2009 in der StVO; heute nur noch Zeichen 151 für alle Bahnübergänge. Alte Schilder sind noch anzutreffen."),
  e("151", "151", "Bahnübergang", "Kündigt einen Bahnübergang an, der mit oder ohne Schranken gesichert sein kann. Geschwindigkeit verringern, auf Schienenfahrzeuge achten und nicht überholen; Schienenfahrzeuge haben Vorrang.", "Zeichen 151 Bahnübergang: rotes Dreieck mit Dampflokomotive", PICT.train, 54),
  ...bakeEntries("156", 3, true),
  ...bakeEntries("157", 3, false),
  ...bakeEntries("159", 2, false),
  ...bakeEntries("162", 1, false),
  // Gefahrstelle-Varianten des VzKat (Zeichen 101 mit Sinnbild)
  e("101-10", "101-10", "Flugbetrieb (Aufstellung rechts)", "Warnt vor tief fliegenden Flugzeugen in der Nähe eines Flugplatzes. Nicht erschrecken lassen, Geschwindigkeit halten und die Aufmerksamkeit bei der Fahrbahn behalten.", "Zeichen 101-10 Flugbetrieb: rotes Dreieck mit Flugzeug nach links", PICT.plane, 56),
  e("101-20", "101-20", "Flugbetrieb (Aufstellung links)", "Warnt vor tief fliegenden Flugzeugen in der Nähe eines Flugplatzes. Nicht erschrecken lassen, Geschwindigkeit halten und die Aufmerksamkeit bei der Fahrbahn behalten.", "Zeichen 101-20 Flugbetrieb: rotes Dreieck mit Flugzeug nach rechts", mirror(PICT.plane), 56),
  e("101-11", "101-11", "Fußgängerüberweg (Aufstellung rechts)", "Kündigt einen Zebrastreifen an, der schlecht erkennbar ist. Mit mäßiger Geschwindigkeit heranfahren, Fußgängern, die den Überweg erkennbar benutzen wollen, das Überqueren ermöglichen und am Überweg nicht überholen.", "Zeichen 101-11 Fußgängerüberweg: rotes Dreieck mit Person auf Zebrastreifen nach links", PICT.crosswalk, 56),
  e("101-21", "101-21", "Fußgängerüberweg (Aufstellung links)", "Kündigt einen Zebrastreifen an, der schlecht erkennbar ist. Mit mäßiger Geschwindigkeit heranfahren, Fußgängern, die den Überweg erkennbar benutzen wollen, das Überqueren ermöglichen und am Überweg nicht überholen.", "Zeichen 101-21 Fußgängerüberweg: rotes Dreieck mit Person auf Zebrastreifen nach rechts", mirror(PICT.crosswalk), 56),
  e("101-12", "101-12", "Viehtrieb (Aufstellung rechts)", "Warnt vor Vieh, das über die Straße getrieben wird oder frei weidet. Geschwindigkeit verringern, bremsbereit sein und beim Passieren der Tiere langsam und ohne Hupen vorbeifahren.", "Zeichen 101-12 Viehtrieb: rotes Dreieck mit Rind nach links", PICT.cow, 56),
  e("101-22", "101-22", "Viehtrieb (Aufstellung links)", "Warnt vor Vieh, das über die Straße getrieben wird oder frei weidet. Geschwindigkeit verringern, bremsbereit sein und beim Passieren der Tiere langsam und ohne Hupen vorbeifahren.", "Zeichen 101-22 Viehtrieb: rotes Dreieck mit Rind nach rechts", mirror(PICT.cow), 56),
  e("101-13", "101-13", "Reiter (Aufstellung rechts)", "Warnt vor Reitern, die die Straße queren oder benutzen. Geschwindigkeit verringern, großen Seitenabstand halten und nicht hupen, da Pferde scheuen können.", "Zeichen 101-13 Reiter: rotes Dreieck mit Pferd und Reiter nach links", PICT.rider, 58),
  e("101-23", "101-23", "Reiter (Aufstellung links)", "Warnt vor Reitern, die die Straße queren oder benutzen. Geschwindigkeit verringern, großen Seitenabstand halten und nicht hupen, da Pferde scheuen können.", "Zeichen 101-23 Reiter: rotes Dreieck mit Pferd und Reiter nach rechts", mirror(PICT.rider), 58),
  e("101-14", "101-14", "Amphibienwanderung (Aufstellung rechts)", "Warnt vor Kröten und anderen Amphibien, die die Straße queren, besonders in feuchten Frühjahrsnächten. Langsam fahren, damit die Tiere nicht durch Reifen oder Fahrtwind getötet werden, und auf Helfer am Straßenrand achten.", "Zeichen 101-14 Amphibienwanderung: rotes Dreieck mit Frosch nach links", PICT.frog, 56),
  e("101-24", "101-24", "Amphibienwanderung (Aufstellung links)", "Warnt vor Kröten und anderen Amphibien, die die Straße queren, besonders in feuchten Frühjahrsnächten. Langsam fahren, damit die Tiere nicht durch Reifen oder Fahrtwind getötet werden, und auf Helfer am Straßenrand achten.", "Zeichen 101-24 Amphibienwanderung: rotes Dreieck mit Frosch nach rechts", mirror(PICT.frog), 56),
  e("101-15", "101-15", "Steinschlag (Aufstellung rechts)", "Warnt vor Steinschlag und auf der Fahrbahn liegenden Steinen. Langsam und aufmerksam fahren, nicht anhalten und mit Hindernissen auf der Fahrbahn rechnen.", "Zeichen 101-15 Steinschlag: rotes Dreieck mit Felshang rechts und herabfallenden Steinen", PICT.rocks, 56),
  e("101-25", "101-25", "Steinschlag (Aufstellung links)", "Warnt vor Steinschlag und auf der Fahrbahn liegenden Steinen. Langsam und aufmerksam fahren, nicht anhalten und mit Hindernissen auf der Fahrbahn rechnen.", "Zeichen 101-25 Steinschlag: rotes Dreieck mit Felshang links und herabfallenden Steinen", mirror(PICT.rocks), 56),
  e("101-51", "101-51", "Splitt, Schotter", "Warnt vor losem Splitt oder Schotter auf der Fahrbahn. Geschwindigkeit verringern, Abstand zum Vordermann vergrößern (Steinschlag an der Windschutzscheibe) und ruhig lenken, da die Haftung geringer ist.", "Zeichen 101-51 Splitt, Schotter: rotes Dreieck mit Auto von hinten und aufgewirbelten Steinchen", PICT.gravel, 56),
  e("101-52", "101-52", "Bewegliche Brücke", "Warnt vor einer Klapp- oder Drehbrücke, die für die Schifffahrt geöffnet werden kann. Bremsbereit fahren und bei Lichtzeichen oder Schranke anhalten.", "Zeichen 101-52 Bewegliche Brücke: rotes Dreieck mit hochgeklapptem Brückenteil über Wasser", PICT.drawbridge, 56),
  e("101-53", "101-53", "Ufer", "Warnt davor, dass die Straße unmittelbar an einem Ufer oder einer Kaimauer entlangführt oder endet. Langsam fahren und ausreichend Abstand zum Fahrbahnrand halten.", "Zeichen 101-53 Ufer: rotes Dreieck mit Kaimauer, über die ein Auto ins Wasser kippt", PICT.shore, 56),
  e("101-54", "101-54", "Unzureichendes Lichtraumprofil", "Warnt vor einer Stelle, an der die Durchfahrtshöhe oder -breite eingeschränkt ist, etwa unter einer Brücke. Fahrzeughöhe und Ladung beachten, langsam fahren und im Zweifel nicht durchfahren.", "Zeichen 101-54 Unzureichendes Lichtraumprofil: rotes Dreieck mit Brückenträger, unter dem ein Lkw nicht hindurchpasst", PICT.lowClearance, 56),
];
