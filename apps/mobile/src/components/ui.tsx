import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useFontScale, useTheme } from "@/lib/theme";

export function Screen({ children, title, scroll = true }: { children: ReactNode; title?: string; scroll?: boolean }) {
  const t = useTheme();
  const body = <View style={{ padding: 16, gap: 12 }}>{title && <Text style={{ fontSize: 26, fontWeight: "700", color: t.colors.text.primary }}>{title}</Text>}{children}</View>;
  return <View style={{ flex: 1, backgroundColor: t.colors.bg.canvas }}>{scroll ? <ScrollView contentInsetAdjustmentBehavior="automatic">{body}</ScrollView> : body}</View>;
}
export function Card({ children, title, style }: { children: ReactNode; title?: string; style?: ViewStyle }) {
  const t = useTheme();
  return <View style={[{ backgroundColor: t.colors.bg.surface, borderRadius: 16, padding: 16, gap: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: t.colors.border.subtle }, style]}>{title && <Text style={{ fontSize: 16, fontWeight: "600", color: t.colors.text.primary }}>{title}</Text>}{children}</View>;
}
export function Txt({ children, muted, bold, size = 15, color, center }: { children: ReactNode; muted?: boolean; bold?: boolean; size?: number; color?: string | undefined; center?: boolean }) {
  const t = useTheme();
  const scale = useFontScale();
  return <Text style={{ fontSize: size * scale, fontWeight: bold ? "600" : "400", color: color ?? (muted ? t.colors.text.secondary : t.colors.text.primary), textAlign: center ? "center" : "left" }}>{children}</Text>;
}
export function Button({ label, onPress, variant = "primary", disabled, loading }: { label: string; onPress: () => void; variant?: "primary" | "secondary" | "ghost" | "danger"; disabled?: boolean; loading?: boolean }) {
  const t = useTheme();
  const bg = variant === "primary" ? t.colors.action.primary : variant === "danger" ? t.colors.action.danger : variant === "secondary" ? t.colors.bg.surface : "transparent";
  const fg = variant === "primary" || variant === "danger" ? t.colors.text.onPrimary : t.colors.text.link;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled || loading} onPress={onPress} style={({ pressed }) => ({ minHeight: 48, paddingHorizontal: 20, borderRadius: 999, backgroundColor: bg, alignItems: "center", justifyContent: "center", opacity: disabled ? 0.5 : pressed ? 0.85 : 1, borderWidth: variant === "secondary" ? 1 : 0, borderColor: t.colors.border.default })}>
      {loading ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontWeight: "600", fontSize: 16 }}>{label}</Text>}
    </Pressable>
  );
}
export function ProgressBar({ value, label, color }: { value: number; label?: string; color?: string | undefined }) {
  const t = useTheme();
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: v }} accessibilityLabel={label}>
      {label && <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}><Txt muted size={13}>{label}</Txt><Txt bold size={13}>{v} %</Txt></View>}
      <View style={{ height: 10, borderRadius: 5, backgroundColor: t.colors.bg.muted, overflow: "hidden" }}><View style={{ width: `${v}%`, height: "100%", backgroundColor: color ?? t.colors.action.primary }} /></View>
    </View>
  );
}
export function Pill({ children, color }: { children: ReactNode; color?: string | undefined }) {
  const t = useTheme();
  return <View style={{ alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: color ?? t.colors.bg.muted }}><Text style={{ fontSize: 12, fontWeight: "600", color: t.colors.text.primary }}>{children}</Text></View>;
}
export function Loading({ text = "Lade …" }: { text?: string }) {
  const t = useTheme();
  return <View style={{ padding: 32, alignItems: "center", gap: 8 }}><ActivityIndicator color={t.colors.action.primary} /><Txt muted>{text}</Txt></View>;
}
