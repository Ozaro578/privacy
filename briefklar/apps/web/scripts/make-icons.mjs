// Erzeugt public/icon-192.png und public/icon-512.png ohne Abhängigkeiten
// (Rasterisierung des Icon-Motivs: blaues Quadrat mit runden Ecken, weißer Umschlag, grüner Haken).
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
const BLUE = [0x1d, 0x4e, 0xd8], WHITE = [255, 255, 255], GREEN = [0x16, 0xa3, 0x4a];

function inRoundRect(x, y, x0, y0, w, h, r) {
  if (x < x0 || y < y0 || x >= x0 + w || y >= y0 + h) return false;
  const cx = Math.min(Math.max(x, x0 + r), x0 + w - r), cy = Math.min(Math.max(y, y0 + r), y0 + h - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}
function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function render(size) {
  const s = size / 512, SS = 3; // Supersampling
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4); row[0] = 0;
    for (let x = 0; x < size; x++) {
      let acc = [0, 0, 0, 0];
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const X = (x + (sx + 0.5) / SS) / s, Y = (y + (sy + 0.5) / SS) / s;
        let col = null;
        if (inRoundRect(X, Y, 0, 0, 512, 512, 112)) {
          col = BLUE;
          if (inRoundRect(X, Y, 88, 152, 336, 224, 28)) {
            col = WHITE;
            if (distSeg(X, Y, 104, 176, 256, 292) <= 13 || distSeg(X, Y, 256, 292, 408, 176) <= 13) col = BLUE;
          }
          const dc = Math.hypot(X - 392, Y - 352);
          if (dc <= 91) col = WHITE;
          if (dc <= 73) {
            col = GREEN;
            if (distSeg(X, Y, 352, 354, 382, 384) <= 13 || distSeg(X, Y, 382, 384, 436, 322) <= 13) col = WHITE;
          }
        }
        if (col) { acc[0] += col[0]; acc[1] += col[1]; acc[2] += col[2]; acc[3] += 255; }
      }
      const n = SS * SS, a = acc[3] / n;
      const o = 1 + x * 4;
      // Nicht-premultipliziert: Farbe nur über deckende Samples mitteln
      const cov = acc[3] / 255 || 1;
      row[o] = Math.round(acc[0] / cov); row[o + 1] = Math.round(acc[1] / cov); row[o + 2] = Math.round(acc[2] / cov); row[o + 3] = Math.round(a);
    }
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
for (const size of [192, 512]) {
  writeFileSync(new URL(`../public/icon-${size}.png`, import.meta.url), render(size));
  console.log(`icon-${size}.png`);
}
