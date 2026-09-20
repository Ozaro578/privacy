// Bausteine für Verkehrszeichen als SVG (Formen, Farben, Piktogramme). Wird von scripts/gen-media.mjs und scripts/signs/*.mjs genutzt.
// Koordinaten: Piktogramme in einem 100×100-Raster; Zeichenformen im 120×120-Raster (Dreieck, Kreis, Quadrat) oder eigenem viewBox.
// Farben (Verkehrsfarben nach RAL, gerundet)
export const RED = "#C1121C";
export const BLUE = "#0E4C96";
export const YELLOW = "#F7B500";
export const GREEN = "#008351";
export const BLACK = "#111111";
export const WHITE = "#FFFFFF";
export const FONT = "font-family=\"'DIN Alternate','Helvetica Neue',Arial,sans-serif\" font-weight=\"700\"";


// ---------------------------------------------------------------------------------------------
// Piktogramme (schwarz, in einem 100×100-Raster, Mittelpunkt 50/50)
// ---------------------------------------------------------------------------------------------
export const P = {
  exclamation: `<rect x="44" y="18" width="12" height="44" rx="4" fill="${BLACK}"/><circle cx="50" cy="76" r="7" fill="${BLACK}"/>`,
  cross: `<rect x="43" y="14" width="14" height="72" fill="${BLACK}"/><rect x="18" y="43" width="64" height="14" fill="${BLACK}"/>`,
  curveLeft: `<path d="M56 86 V50 Q56 32 40 32 H26" fill="none" stroke="${BLACK}" stroke-width="13" stroke-linecap="butt"/>`,
  arrowUp: `<path d="M50 12 L70 40 H58 V88 H42 V40 H30 Z" fill="${BLACK}"/>`,
  arrowUpWhite: `<path d="M50 12 L70 40 H58 V88 H42 V40 H30 Z" fill="${WHITE}"/>`,
  pedestrian: `<circle cx="50" cy="20" r="8" fill="${BLACK}"/><path d="M42 30 H58 L64 54 L58 56 L54 42 V60 L64 84 L56 88 L46 66 L38 88 L30 84 L40 60 V42 L36 56 L30 54 Z" fill="${BLACK}"/>`,
  children: `<circle cx="66" cy="18" r="7" fill="${BLACK}"/><path d="M60 27 H72 L82 44 L77 47 L70 38 L72 58 L84 78 L77 82 L64 62 L56 84 L48 80 L58 58 L58 44 L52 52 L46 48 Z" fill="${BLACK}"/><circle cx="30" cy="36" r="6" fill="${BLACK}"/><path d="M25 44 H35 L42 56 L38 59 L33 52 L34 66 L42 84 L36 86 L28 70 L22 86 L16 84 L24 66 L24 54 L20 60 L15 56 Z" fill="${BLACK}"/>`,
  bicycle: `<circle cx="28" cy="66" r="16" fill="none" stroke="${BLACK}" stroke-width="5"/><circle cx="74" cy="66" r="16" fill="none" stroke="${BLACK}" stroke-width="5"/><path d="M28 66 L44 38 H62 L74 66 M44 38 L52 66 H28 M58 30 H70 M62 38 L58 30" fill="none" stroke="${BLACK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/><path d="M38 30 H48" stroke="${BLACK}" stroke-width="5" stroke-linecap="round"/>`,
  deer: `<ellipse cx="46" cy="52" rx="24" ry="11" fill="${BLACK}"/><path d="M62 46 L72 30 L82 24 L86 30 L78 34 L74 44 L70 54 Z" fill="${BLACK}"/><path d="M76 28 L72 14 M76 28 L84 12 M74 20 L66 16 M80 18 L88 20" stroke="${BLACK}" stroke-width="3.5" stroke-linecap="round" fill="none"/><path d="M28 58 L14 78 M34 60 L26 84 M58 58 L72 80 M64 56 L80 72 M22 50 L10 42" stroke="${BLACK}" stroke-width="6" stroke-linecap="round" fill="none"/>`,
  worker: `<circle cx="44" cy="20" r="8" fill="${BLACK}"/><path d="M36 30 H52 L60 46 L70 58 L64 62 L54 50 L52 60 L62 84 L54 86 L44 66 L40 86 L32 84 L34 56 L32 44 L24 52 L19 48 Z" fill="${BLACK}"/><path d="M62 42 L84 70 L88 68 L66 40 Z" fill="${BLACK}"/><path d="M60 88 Q78 62 96 88 Z" fill="${BLACK}"/>`,
  train: `<path d="M26 30 Q26 16 50 16 Q74 16 74 30 V70 H26 Z" fill="${BLACK}"/><rect x="32" y="28" width="14" height="16" rx="2" fill="${WHITE}"/><rect x="54" y="28" width="14" height="16" rx="2" fill="${WHITE}"/><rect x="18" y="70" width="64" height="10" fill="${BLACK}"/><rect x="22" y="80" width="56" height="6" fill="${BLACK}"/><rect x="30" y="56" width="40" height="6" fill="${WHITE}"/><rect x="46" y="8" width="8" height="8" fill="${BLACK}"/>`,
  skidCar: `<path d="M30 22 Q50 12 70 22 L78 40 H22 Z" fill="${BLACK}"/><rect x="18" y="40" width="64" height="16" rx="4" fill="${BLACK}"/><rect x="36" y="24" width="28" height="12" rx="2" fill="${WHITE}"/><circle cx="30" cy="58" r="7" fill="${BLACK}"/><circle cx="70" cy="58" r="7" fill="${BLACK}"/><path d="M22 72 q8 -8 16 0 t16 0 M50 84 q8 -8 16 0 t16 0 M18 88 q8 -8 16 0 t16 0" fill="none" stroke="${BLACK}" stroke-width="5" stroke-linecap="round"/>`,
  trafficLight: `<circle cx="50" cy="26" r="11" fill="#E30613" stroke="${BLACK}" stroke-width="3"/><circle cx="50" cy="52" r="11" fill="#FFD400" stroke="${BLACK}" stroke-width="3"/><circle cx="50" cy="78" r="11" fill="#00A651" stroke="${BLACK}" stroke-width="3"/>`,
  windsock: `<rect x="20" y="14" width="6" height="76" fill="${BLACK}"/><path d="M26 22 L84 34 L84 50 L26 58 Z" fill="${BLACK}"/><path d="M46 26 L46 54 M62 30 L62 51" stroke="${WHITE}" stroke-width="5"/>`,
  carFront: `<path d="M24 62 L32 40 Q34 34 40 34 H60 Q66 34 68 40 L76 62 Z" fill="${BLACK}"/><rect x="18" y="60" width="64" height="20" rx="4" fill="${BLACK}"/><rect x="38" y="40" width="24" height="14" rx="2" fill="${WHITE}"/><rect x="22" y="80" width="12" height="6" fill="${BLACK}"/><rect x="66" y="80" width="12" height="6" fill="${BLACK}"/><circle cx="28" cy="68" r="4" fill="${WHITE}"/><circle cx="72" cy="68" r="4" fill="${WHITE}"/>`,
  carFrontRed: `<path d="M24 62 L32 40 Q34 34 40 34 H60 Q66 34 68 40 L76 62 Z" fill="${RED}"/><rect x="18" y="60" width="64" height="20" rx="4" fill="${RED}"/><rect x="38" y="40" width="24" height="14" rx="2" fill="${WHITE}"/><rect x="22" y="80" width="12" height="6" fill="${RED}"/><rect x="66" y="80" width="12" height="6" fill="${RED}"/><circle cx="28" cy="68" r="4" fill="${WHITE}"/><circle cx="72" cy="68" r="4" fill="${WHITE}"/>`,
  truckFront: `<rect x="22" y="26" width="56" height="52" rx="4" fill="${BLACK}"/><rect x="28" y="32" width="44" height="18" rx="2" fill="${WHITE}"/><rect x="18" y="62" width="64" height="14" fill="${BLACK}"/><rect x="24" y="78" width="12" height="8" fill="${BLACK}"/><rect x="64" y="78" width="12" height="8" fill="${BLACK}"/>`,
  motorbike: `<circle cx="26" cy="70" r="13" fill="none" stroke="${BLACK}" stroke-width="6"/><circle cx="74" cy="70" r="13" fill="none" stroke="${BLACK}" stroke-width="6"/><path d="M26 70 L40 48 H64 L74 70 M40 48 L32 34 H22 M64 48 L70 36" fill="none" stroke="${BLACK}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/><circle cx="52" cy="26" r="7" fill="${BLACK}"/>`,
  house: `<path d="M50 16 L84 44 H74 V84 H26 V44 H16 Z" fill="${WHITE}"/><rect x="36" y="56" width="10" height="12" fill="${BLUE}"/><rect x="54" y="56" width="10" height="12" fill="${BLUE}"/><rect x="44" y="70" width="12" height="14" fill="${BLUE}"/>`,
  wheelchair: `<circle cx="40" cy="22" r="8" fill="${BLACK}"/><path d="M36 32 H48 V56 H66 L76 78 L68 82 L60 64 H36 Z" fill="${BLACK}"/><path d="M32 46 A22 22 0 1 0 62 76" fill="none" stroke="${BLACK}" stroke-width="7"/>`,
  snowflake: `<g stroke="${BLACK}" stroke-width="4" stroke-linecap="round"><path d="M50 16 V84 M21 33 L79 67 M21 67 L79 33"/><path d="M50 16 L42 26 M50 16 L58 26 M50 84 L42 74 M50 84 L58 74 M21 33 L34 33 M21 33 L27 44 M79 67 L66 67 M79 67 L73 56 M21 67 L34 67 M21 67 L27 56 M79 33 L66 33 M79 33 L73 44"/></g>`,
  mountain: `<path d="M8 84 L34 36 L48 58 L60 30 L92 84 Z" fill="${BLACK}"/><path d="M34 36 L42 50 L48 40 L54 50 L60 30" fill="none" stroke="${WHITE}" stroke-width="3"/>`,
  oilCan: `<path d="M26 44 H58 L64 34 H72 L66 48 L84 52 L80 62 L64 58 V78 H26 Z" fill="${BLACK}"/><rect x="34" y="34" width="10" height="10" fill="${BLACK}"/><path d="M20 82 q6 -8 12 0 t12 0 t12 0 t12 0" fill="none" stroke="${BLACK}" stroke-width="4"/>`,
};

// ---------------------------------------------------------------------------------------------
// Zeichenformen
// ---------------------------------------------------------------------------------------------
export const svgOpen = (w, h, title) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>`;
export const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
export const pict = (inner, x, y, size) => `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 100 100">${inner}</svg>`;

export function triangleUp(inner, title, pictSize = 52) {
  return `${svgOpen(120, 120, title)}<path d="M60 6 L116 108 H4 Z" fill="${RED}" stroke="#9CA3AF" stroke-width="1"/><path d="M60 26 L98 96 H22 Z" fill="${WHITE}"/>${pict(inner, 60 - pictSize / 2, 42, pictSize)}</svg>`;
}
export function triangleDown(title) {
  return `${svgOpen(120, 120, title)}<path d="M4 12 H116 L60 114 Z" fill="${RED}" stroke="#9CA3AF" stroke-width="1"/><path d="M22 24 H98 L60 94 Z" fill="${WHITE}"/></svg>`;
}
export function circleRed(inner, title, pictSize = 68, extra = "") {
  return `${svgOpen(120, 120, title)}<circle cx="60" cy="60" r="57" fill="${RED}" stroke="#9CA3AF" stroke-width="1"/><circle cx="60" cy="60" r="44" fill="${WHITE}"/>${pict(inner, 60 - pictSize / 2, 60 - pictSize / 2, pictSize)}${extra}</svg>`;
}
export function circleBlue(inner, title, pictSize = 76) {
  return `${svgOpen(120, 120, title)}<circle cx="60" cy="60" r="57" fill="${BLUE}" stroke="#9CA3AF" stroke-width="1"/><circle cx="60" cy="60" r="53" fill="none" stroke="${WHITE}" stroke-width="3"/>${pict(inner, 60 - pictSize / 2, 60 - pictSize / 2, pictSize)}</svg>`;
}
export function rectBlue(w, h, inner, title) {
  return `${svgOpen(w, h, title)}<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="6" fill="${BLUE}" stroke="#9CA3AF" stroke-width="1"/><rect x="5" y="5" width="${w - 10}" height="${h - 10}" rx="3" fill="none" stroke="${WHITE}" stroke-width="2.5"/>${inner}</svg>`;
}
export function rectWhite(w, h, inner, title) {
  return `${svgOpen(w, h, title)}<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="6" fill="${WHITE}" stroke="#9CA3AF" stroke-width="1"/><rect x="5" y="5" width="${w - 10}" height="${h - 10}" rx="3" fill="none" stroke="${BLACK}" stroke-width="2.5"/>${inner}</svg>`;
}
export const text = (x, y, size, str, fill = BLACK, anchor = "middle", extra = "") => `<text x="${x}" y="${y}" font-size="${size}" ${FONT} fill="${fill}" text-anchor="${anchor}" ${extra}>${esc(str)}</text>`;

// Anhalt: Kreis mit roten Balken (283/286)
export function haltverbot(bars, title) {
  const bar = (rot) => `<rect x="54" y="0" width="12" height="120" fill="${RED}" transform="rotate(${rot} 60 60)"/>`;
  return `${svgOpen(120, 120, title)}<defs><clipPath id="c"><circle cx="60" cy="60" r="57"/></clipPath></defs><circle cx="60" cy="60" r="57" fill="${BLUE}" stroke="#9CA3AF" stroke-width="1"/><g clip-path="url(#c)">${bars === 2 ? bar(45) + bar(-45) : bar(45)}</g><circle cx="60" cy="60" r="57" fill="none" stroke="${RED}" stroke-width="13"/></svg>`;
}

// Zusatzzeichen (weißes Rechteck, schwarzer Rand)
export function zusatz(w, h, inner, title) {
  return rectWhite(w, h, inner, title);
}


/** Achteck (Stoppschild-Form) */
export function octagonRed(inner, title) {
  return `${svgOpen(120, 120, title)}<polygon points="36,4 84,4 116,36 116,84 84,116 36,116 4,84 4,36" fill="${RED}" stroke="#9CA3AF" stroke-width="1"/><polygon points="38,9 82,9 111,38 111,82 82,111 38,111 9,82 9,38" fill="none" stroke="${WHITE}" stroke-width="3"/>${inner}</svg>`;
}
/** Gelbes Quadrat auf der Spitze (Vorfahrtstraße) */
export function diamondYellow(inner, title) {
  return `${svgOpen(120, 120, title)}<rect x="18" y="18" width="84" height="84" rx="6" fill="${WHITE}" stroke="#9CA3AF" stroke-width="1" transform="rotate(45 60 60)"/><rect x="31" y="31" width="58" height="58" rx="3" fill="${YELLOW}" transform="rotate(45 60 60)"/>${inner}</svg>`;
}
/** Weißer Kreis mit grauem Rand (Aufhebungszeichen 278 bis 282) */
export function circleWhite(inner, title) {
  return `${svgOpen(120, 120, title)}<circle cx="60" cy="60" r="57" fill="${WHITE}" stroke="#9CA3AF" stroke-width="1"/>${inner}</svg>`;
}
/** Schräge graue Aufhebungsstriche (Ende einer Beschränkung) */
export const endStrokes = `<g stroke="#4B5563" stroke-width="5"><path d="M18 102 L102 18 M8 76 L76 8 M44 112 L112 44"/></g>`;
/** Weißes Piktogramm aus einem schwarzen */
export const white = (inner) => inner.replaceAll(BLACK, WHITE);
/** Blaues Rechteck ohne weißen Innenrand (Richtzeichen 400er) */
export function rectBluePlain(w, h, inner, title) {
  return `${svgOpen(w, h, title)}<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="6" fill="${BLUE}" stroke="#9CA3AF" stroke-width="1"/>${inner}</svg>`;
}
/** Gelbes Rechteck (Umleitung, Ortstafel) */
export function rectYellow(w, h, inner, title) {
  return `${svgOpen(w, h, title)}<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="6" fill="${YELLOW}" stroke="#9CA3AF" stroke-width="1"/><rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="3" fill="none" stroke="${BLACK}" stroke-width="3"/>${inner}</svg>`;
}
/** Grünes Rechteck (Autobahn-Wegweisung 430 ff.) */
export function rectGreen(w, h, inner, title) {
  return `${svgOpen(w, h, title)}<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="6" fill="#0B6E4F" stroke="#9CA3AF" stroke-width="1"/>${inner}</svg>`;
}
