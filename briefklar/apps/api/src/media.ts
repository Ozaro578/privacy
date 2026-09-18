import { LIMITS } from "@briefklar/shared";

export type AllowedMediaType = (typeof LIMITS.ALLOWED_MEDIA_TYPES)[number];

/**
 * Erkennt den Medientyp anhand der Magic Bytes – der vom Client gemeldete
 * Content-Type wird bewusst ignoriert.
 */
export function sniffMediaType(bytes: Uint8Array): AllowedMediaType | null {
  if (bytes.length < 12) return null;
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  // WebP: "RIFF" .... "WEBP"
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return "image/webp";
  // PDF: "%PDF"
  if (ascii(bytes, 0, 4) === "%PDF") return "application/pdf";
  return null;
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  let s = "";
  for (let i = start; i < end; i++) s += String.fromCharCode(bytes[i] ?? 0);
  return s;
}
