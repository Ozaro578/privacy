/** Bild oder Video zu einer Frage: öffentliche Dateien der Web-App direkt, Objekte aus dem Bucket "content" über eine signierte URL. */
export function questionMediaUrl(path: string): string {
  if (path.startsWith("/") || path.startsWith("https://")) return path;
  return `/api/media?path=${encodeURIComponent(path)}`;
}

export type QuestionMediaKind = "image" | "video";

/** Art des Mediums: explizit übergeben oder aus der Dateiendung abgeleitet (lizenzierte Videofragen liegen als mp4/webm vor). */
export function questionMediaKind(path: string, kind?: string | null): QuestionMediaKind {
  if (kind === "video" || kind === "image") return kind;
  return /\.(mp4|webm)(\?|$)/i.test(path) ? "video" : "image";
}

/** Videofragen: Antworten erscheinen wie in der Prüfung erst nach dem ersten vollständigen Abspielen. */
export function videoGateOpen(path: string | null | undefined, kind: string | null | undefined, seen: boolean): boolean {
  return !path || questionMediaKind(path, kind) !== "video" || seen;
}

export const VIDEO_GATE_HINT = "Sieh dir das Video an. Die Antworten erscheinen nach dem Abspielen; du kannst es beliebig oft wiederholen.";

export function QuestionMedia({ path, alt, credit, kind, onEnded, className = "" }: { path: string | null | undefined; alt: string | null | undefined; credit?: string | null | undefined; kind?: string | null | undefined; onEnded?: () => void; className?: string }) {
  if (!path) return null;
  const isVideo = questionMediaKind(path, kind) === "video";
  return (
    <figure className={`my-3 ${className}`}>
      <div className="flex justify-center rounded-xl bg-ink-50 p-3">
        {isVideo ? (
          // Videofrage: Ablauf ohne Ton, Bedienelemente sichtbar, kein automatischer Start (Prüfungsablauf wird vom Runner gesteuert)
          <video src={questionMediaUrl(path)} controls playsInline preload="metadata" onEnded={onEnded} aria-label={alt ?? "Video zur Frage"} className="max-h-80 w-auto max-w-full rounded-lg bg-black">
            <p>{alt ?? "Video zur Frage"}</p>
          </video>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- SVG-Vektorgrafiken und signierte URLs; next/image würde hier nichts optimieren
          <img src={questionMediaUrl(path)} alt={alt ?? "Abbildung zur Frage"} className="max-h-72 w-auto max-w-full rounded-lg object-contain" loading="eager" decoding="async" />
        )}
      </div>
      {(credit || isVideo) && <figcaption className="mt-1 flex justify-between gap-2 text-[11px] text-ink-500"><span>{isVideo ? alt : ""}</span><span>{credit}</span></figcaption>}
    </figure>
  );
}
