/** Kaufmännische Rundung (halb aufwärts) eines nicht negativen Bruchs num/den auf eine ganze Zahl. Rein ganzzahlig, daher ohne Gleitkommafehler. */
export function roundHalfUpDiv(num: number, den: number): number {
  if (!Number.isInteger(num) || !Number.isInteger(den) || den <= 0) throw new Error("roundHalfUpDiv erwartet ganze Zahlen und einen positiven Nenner");
  const sign = num < 0 ? -1 : 1;
  const abs = Math.abs(num);
  return sign * Math.floor((2 * abs + den) / (2 * den));
}

/** Betrag in Cent als deutschen Geldbetrag formatieren, z. B. 120000 -> "1.200,00 €". */
export function formatCents(cents: number, currency = "EUR"): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const symbol = currency === "EUR" ? "€" : currency;
  return `${sign}${grouped},${frac} ${symbol}`;
}

/** Prozentsatz mit bis zu zwei Nachkommastellen deutsch formatieren, z. B. 19 -> "19 %", 7.5 -> "7,5 %". */
export function formatVatRate(rate: number): string {
  const text = Number.isInteger(rate) ? String(rate) : rate.toFixed(2).replace(/0+$/, "").replace(".", ",");
  return `${text} %`;
}

/** ISO-Datum (YYYY-MM-DD) in deutsche Schreibweise (TT.MM.JJJJ) umwandeln. */
export function formatDateDe(isoDate: string): string {
  const [y, m, d] = isoDate.slice(0, 10).split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}.${m}.${y}`;
}
