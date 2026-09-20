import { Pressable, Switch, View } from "react-native";
import { PALETTES, PALETTE_IDS, type Appearance } from "@fahrpilot/ui/palettes";
import { useAppearance } from "@/lib/appearance";
import { useTheme } from "@/lib/theme";
import { Card, Txt } from "./ui";

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const t = useTheme();
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={{ minHeight: 40, paddingHorizontal: 14, justifyContent: "center", borderRadius: 999, borderWidth: 1, borderColor: active ? t.colors.action.primary : t.colors.border.default, backgroundColor: active ? t.colors.action.secondary : t.colors.bg.surface }}><Txt size={14} color={active ? t.colors.text.link : undefined}>{label}</Txt></Pressable>;
}

/** Farbwelt, Hell/Dunkel, Schriftgröße, Bewegung, Ton. Wirkt sofort und wird für alle Geräte gespeichert. */
export function AppearanceSettings() {
  const t = useTheme();
  const { appearance: a, setAppearance } = useAppearance();
  const update = (patch: Partial<Appearance>) => { void setAppearance({ ...a, ...patch }); };
  return (
    <Card title="Darstellung">
      <Txt muted size={13}>Farbwelt</Txt>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {PALETTE_IDS.map((id) => { const p = PALETTES[id]; const active = a.palette === id; return (
          <Pressable key={id} accessibilityRole="button" accessibilityLabel={p.label} accessibilityState={{ selected: active }} onPress={() => update({ palette: id })} style={{ width: 96, minHeight: 64, alignItems: "center", justifyContent: "center", gap: 4, borderRadius: 12, borderWidth: 2, borderColor: active ? t.colors.action.primary : t.colors.border.default, padding: 6 }}>
            <View style={{ flexDirection: "row", gap: 4 }}><View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: p.light["500"] }} /><View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: p.accent["400"] }} /></View>
            <Txt size={12}>{p.label.split(" (")[0]}</Txt>
          </Pressable>
        ); })}
      </View>
      <Txt muted size={13}>Hell oder dunkel</Txt>
      <View style={{ flexDirection: "row", gap: 8 }}>{([["system", "Wie das Gerät"], ["light", "Hell"], ["dark", "Dunkel"]] as const).map(([v, l]) => <Chip key={v} label={l} active={a.theme === v} onPress={() => update({ theme: v })} />)}</View>
      <Txt muted size={13}>Schriftgröße</Txt>
      <View style={{ flexDirection: "row", gap: 8 }}>{([["md", "Normal"], ["lg", "Größer"], ["xl", "Sehr groß"]] as const).map(([v, l]) => <Chip key={v} label={l} active={a.fontSize === v} onPress={() => update({ fontSize: v })} />)}</View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 44 }}><Txt>Weniger Bewegung</Txt><Switch value={a.motion === "reduced"} onValueChange={(v) => update({ motion: v ? "reduced" : "system" })} /></View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 44 }}><Txt>Töne bei richtigen Antworten</Txt><Switch value={a.sound} onValueChange={(v) => update({ sound: v })} /></View>
    </Card>
  );
}
