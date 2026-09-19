import { useColorScheme } from "react-native";
import { nativeDark, nativeLight, type NativeTheme } from "@fahrpilot/ui/native";

export function useTheme(): NativeTheme {
  const scheme = useColorScheme();
  return scheme === "dark" ? nativeDark : nativeLight;
}
export const readinessColor = (t: NativeTheme, score: number | null): string => {
  if (score === null) return t.colors.text.muted;
  if (score < 40) return t.colors.readiness.red.fill;
  if (score < 70) return t.colors.readiness.orange.fill;
  if (score < 85) return t.colors.readiness.yellow_green.fill;
  return t.colors.readiness.green.fill;
};
export const bandLabel = (score: number | null): string => score === null ? "Noch keine Daten" : score < 40 ? "Noch nicht prüfungsbereit" : score < 70 ? "Auf gutem Weg" : score < 85 ? "Fast bereit" : "Sehr gute Vorbereitung";
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("de-DE", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", year: "numeric" });
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" });
export const fmtEur = (cents: number) => (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
export function parseRange(range: string): { start: string; end: string } {
  const m = range.match(/^[\[(]"?([^,"]+)"?,"?([^)\]"]+)"?[\])]$/);
  return { start: m?.[1] ?? range, end: m?.[2] ?? range };
}
