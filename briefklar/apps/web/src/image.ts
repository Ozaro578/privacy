import { LIMITS } from "@briefklar/shared";
import { t } from "./i18n";

export interface Page {
  id: string;
  /** Fertige Datei für den Upload (ggf. verkleinert) */
  file: File;
  name: string;
  bytes: number;
  isPdf: boolean;
  /** Object-URL für das Thumbnail (null bei PDF) */
  thumbUrl: string | null;
}

export class PageError extends Error {}

const MAX_EDGE = 2000;
const JPEG_QUALITY = 0.85;

let counter = 0;

function isAllowed(type: string): boolean {
  return (LIMITS.ALLOWED_MEDIA_TYPES as readonly string[]).includes(type);
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    } catch {
      /* Fallback unten */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("decode failed"));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Bild auf max. 2000px (längste Kante) verkleinern, JPEG 0.85. PDFs unverändert. */
export async function preparePage(file: File): Promise<Page> {
  const id = `p${Date.now().toString(36)}${(counter++).toString(36)}`;
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);

  if (isPdf) {
    if (file.size > LIMITS.MAX_IMAGE_BYTES) {
      throw new PageError(t("file_too_large", { name: file.name, max: `${LIMITS.MAX_IMAGE_BYTES / (1024 * 1024)} MB` }));
    }
    return { id, file, name: file.name, bytes: file.size, isPdf: true, thumbUrl: null };
  }

  if (!file.type.startsWith("image/") && !isAllowed(file.type)) {
    throw new PageError(t("unsupported_type", { name: file.name }));
  }

  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await decode(file);
  } catch {
    // Nicht dekodierbar -> nicht hochladen (Original könnte EXIF/GPS enthalten).
    throw new PageError(t("image_failed", { name: file.name }));
  }

  const sw = source.width;
  const sh = source.height;
  const scale = Math.min(1, MAX_EDGE / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * scale));
  const hgt = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = hgt;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new PageError(t("image_failed", { name: file.name }));
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, hgt);
  ctx.drawImage(source, 0, 0, w, hgt);
  if ("close" in source) source.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
  canvas.width = canvas.height = 0;
  if (!blob) throw new PageError(t("image_failed", { name: file.name }));

  // Immer neu kodieren: entfernt EXIF-Metadaten (GPS, Gerät) zuverlässig.
  const out = new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  if (out.size > LIMITS.MAX_IMAGE_BYTES) {
    throw new PageError(t("file_too_large", { name: file.name, max: `${LIMITS.MAX_IMAGE_BYTES / (1024 * 1024)} MB` }));
  }
  return { id, file: out, name: out.name, bytes: out.size, isPdf: false, thumbUrl: URL.createObjectURL(out) };
}

export function revokePage(page: Page): void {
  if (page.thumbUrl) URL.revokeObjectURL(page.thumbUrl);
}
