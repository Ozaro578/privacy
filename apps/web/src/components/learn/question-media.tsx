/** Bild zu einer Frage: öffentliche Dateien der Web-App direkt, Objekte aus dem Bucket "content" über eine signierte URL. */
export function questionMediaUrl(path: string): string {
  if (path.startsWith("/") || path.startsWith("https://")) return path;
  return `/api/media?path=${encodeURIComponent(path)}`;
}

export function QuestionMedia({ path, alt, credit, className = "" }: { path: string | null | undefined; alt: string | null | undefined; credit?: string | null | undefined; className?: string }) {
  if (!path) return null;
  return (
    <figure className={`my-3 ${className}`}>
      <div className="flex justify-center rounded-xl bg-ink-50 p-3">
        <img src={questionMediaUrl(path)} alt={alt ?? "Abbildung zur Frage"} className="max-h-72 w-auto max-w-full rounded-lg object-contain" loading="eager" decoding="async" />
      </div>
      {credit && <figcaption className="mt-1 text-right text-[11px] text-ink-500">{credit}</figcaption>}
    </figure>
  );
}
