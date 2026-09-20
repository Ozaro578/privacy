import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { priorityScenarios, type PriorityScenario } from "@fahrpilot/content/vorfahrt-trainer";
import { mediaById } from "@fahrpilot/content";
import { API_URL } from "@/lib/supabase";
import { useTheme } from "@/lib/theme";
import { Button, Card, Screen, Txt } from "@/components/ui";

const shuffle = <T,>(items: readonly T[]): T[] => { const a = items.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; } return a; };
/** Eine Runde umfasst höchstens 12 Situationen, gemischt über alle Stufen. */
const ROUND = 12;
const draw = <T,>(items: readonly T[]): T[] => shuffle(items).slice(0, ROUND);

/** Vorfahrt-Trainer: Fahrzeuge in Fahr-Reihenfolge antippen. */
export default function PriorityTrainerScreen() {
  const t = useTheme();
  const router = useRouter();
  const [round, setRound] = useState<PriorityScenario[]>(() => draw(priorityScenarios));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);
  const [score, setScore] = useState({ ok: 0, total: 0 });
  const sc = round[i]!;
  const expected = useMemo(() => sc.order.flat(), [sc]);
  const media = mediaById(sc.media);
  const check = () => {
    const ok = picked.length === expected.length && sc.order.every((group, gi) => { const start = sc.order.slice(0, gi).reduce((n, g) => n + g.length, 0); const slice = picked.slice(start, start + group.length); return group.every((k) => slice.includes(k)); });
    setChecked(ok); setScore((s) => ({ ok: s.ok + (ok ? 1 : 0), total: s.total + 1 }));
  };
  const next = () => { setPicked([]); setChecked(null); if (i + 1 < round.length) setI(i + 1); };
  const restart = () => { setRound(draw(priorityScenarios)); setI(0); setPicked([]); setChecked(null); setScore({ ok: 0, total: 0 }); };
  const label = (k: string) => sc.vehicles.find((v) => v.key === k)?.label ?? k;
  const finished = checked !== null && i + 1 >= round.length;
  return (
    <Screen title="Vorfahrt-Trainer">
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Txt muted>Situation {i + 1} von {round.length}</Txt><Txt muted>Stufe {sc.level} · {score.ok}/{score.total}</Txt></View>
      <Card>
        <Txt muted size={12}>{sc.title}</Txt>
        <View style={{ backgroundColor: t.colors.bg.muted, borderRadius: 12, padding: 8, alignItems: "center" }}>
          {media && <Image source={{ uri: `${API_URL}/media/questions/${media.file}` }} accessibilityLabel={media.alt} contentFit="contain" cachePolicy="disk" style={{ width: "100%", height: 260 }} />}
        </View>
        <Txt bold size={17}>In welcher Reihenfolge dürfen die Fahrzeuge fahren? Tippe sie der Reihe nach an.</Txt>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {sc.vehicles.map((v) => {
            const pos = picked.indexOf(v.key); const correct = expected.indexOf(v.key);
            const border = checked !== null ? (pos === correct ? t.colors.status.success.fill : t.colors.status.danger.fill) : pos >= 0 ? t.colors.action.primary : t.colors.border.default;
            const bg = checked !== null ? (pos === correct ? t.colors.status.success.surface : t.colors.status.danger.surface) : pos >= 0 ? t.colors.action.secondary : t.colors.bg.surface;
            return (
              <Pressable key={v.key} accessibilityRole="button" accessibilityState={{ selected: pos >= 0, disabled: checked !== null }} disabled={checked !== null} onPress={() => setPicked((p) => (p.includes(v.key) ? p.filter((x) => x !== v.key) : [...p, v.key]))} style={{ minHeight: 44, paddingHorizontal: 14, justifyContent: "center", borderRadius: 999, borderWidth: 2, borderColor: border, backgroundColor: bg, flexDirection: "row", alignItems: "center", gap: 6 }}>
                {pos >= 0 && <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: t.colors.action.primary, alignItems: "center", justifyContent: "center" }}><Txt size={11} color={t.colors.text.onPrimary}>{String(pos + 1)}</Txt></View>}
                <Txt size={14}>{v.label}</Txt>
              </Pressable>
            );
          })}
        </View>
        {checked !== null && (
          <View style={{ backgroundColor: checked ? t.colors.status.success.surface : t.colors.status.danger.surface, borderRadius: 12, padding: 12, gap: 4 }} accessibilityLiveRegion="polite">
            <Txt bold>{checked ? "Richtig!" : `Nicht ganz. Richtige Reihenfolge: ${sc.order.map((g) => g.map(label).join(" und ")).join(", dann ")}`}</Txt>
            <Txt size={14}>{sc.explanation}</Txt>
            <Txt muted size={12}>Rechtsgrundlage: {sc.legalReference}</Txt>
          </View>
        )}
      </Card>
      {checked === null ? <Button label="Reihenfolge prüfen" onPress={check} disabled={picked.length !== expected.length} />
        : finished ? <><Txt center>Fertig: {score.ok} von {round.length} richtig.</Txt><Button label="Noch eine Runde" onPress={restart} /><Button label="Zur Übersicht" variant="secondary" onPress={() => router.back()} /></>
        : <Button label="Weiter" onPress={next} />}
    </Screen>
  );
}
