/**
 * Einfacher In-Memory-Rate-Limiter (Sliding Window) pro Schlüssel (z.B. IP).
 * Reicht für eine einzelne Instanz; bei mehreren Instanzen bräuchte man Redis o.ä.
 */
export interface RateLimiter {
  /** true = Anfrage erlaubt (und gezählt), false = Limit erreicht */
  hit(key: string, now?: number): { allowed: boolean; retryAfterSec: number };
  stop(): void;
}

export function createRateLimiter(opts: { limit: number; windowMs: number }): RateLimiter {
  const { limit, windowMs } = opts;
  const buckets = new Map<string, number[]>();

  // Alte Einträge regelmäßig entsorgen, damit die Map nicht wächst.
  const timer = setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, stamps] of buckets) {
      const kept = stamps.filter((t) => t > cutoff);
      if (kept.length === 0) buckets.delete(key);
      else buckets.set(key, kept);
    }
  }, windowMs);
  timer.unref?.();

  return {
    hit(key, now = Date.now()) {
      if (limit <= 0) return { allowed: false, retryAfterSec: Math.ceil(windowMs / 1000) };
      const cutoff = now - windowMs;
      const stamps = (buckets.get(key) ?? []).filter((t) => t > cutoff);
      if (stamps.length >= limit) {
        const oldest = stamps[0] ?? now;
        buckets.set(key, stamps);
        return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) };
      }
      stamps.push(now);
      buckets.set(key, stamps);
      return { allowed: true, retryAfterSec: 0 };
    },
    stop() {
      clearInterval(timer);
      buckets.clear();
    },
  };
}
