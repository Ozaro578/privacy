/** Verbindet Klassennamen und lässt falsy Werte weg. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
