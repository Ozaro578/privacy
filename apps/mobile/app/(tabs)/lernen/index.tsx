import { useCallback, useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useProfile } from "@/lib/profile";
import { useTheme } from "@/lib/theme";
import { loadQuestions, loadTopics } from "@/lib/content";
import { stateStore } from "@/lib/sync";
import { localOverview, type LocalOverview } from "@/offline/local-learning";
import type { LocalTopic } from "@/offline/types";
import { Button, Card, Loading, ProgressBar, Screen, Txt } from "@/components/ui";

const MODES: Array<{ mode: string; title: string; text: string; key?: keyof Pick<LocalOverview, "due" | "wrong" | "bookmarked" | "unseen" | "hard"> }> = [
  { mode: "review", title: "Wiederholung", text: "Fällige Fragen", key: "due" }, { mode: "weakness", title: "Schwachstellen", text: "Schwächste Themen" },
  { mode: "wrong", title: "Falsch beantwortet", text: "Zuletzt falsch", key: "wrong" }, { mode: "hard", title: "Schwierige Fragen", text: "Hohe Schwierigkeit", key: "hard" },
  { mode: "ladder", title: "Stufen-Modus", text: "Von leicht nach schwer" }, { mode: "signs", title: "Zeichen-Trainer", text: "Verkehrszeichen erkennen" }, { mode: "unseen", title: "Noch nie beantwortet", text: "Neue Fragen", key: "unseen" }, { mode: "bookmarked", title: "Markierte Fragen", text: "Deine Merkliste", key: "bookmarked" }, { mode: "random", title: "Zufallsfragen", text: "Bunt gemischt" },
];

export default function Learn() {
  const t = useTheme();
  const router = useRouter();
  const { profile, online } = useProfile();
  const [ov, setOv] = useState<LocalOverview | null>(null);
  const [topics, setTopics] = useState<LocalTopic[]>([]);
  const load = useCallback(async () => { const [pool, states, ts] = await Promise.all([loadQuestions(), stateStore.loadAll(), loadTopics()]); setOv(localOverview(pool, states)); setTopics(ts); }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useEffect(() => { void load(); }, [load]);
  if (!ov) return <Screen title="Lernen"><Loading /></Screen>;
  const start = (mode: string, topic?: string) => router.push({ pathname: "/(tabs)/lernen/session", params: { mode, topic: topic ?? "", limit: "15" } });
  return (
    <Screen title="Lernen">
      <Txt muted>{ov.answered} von {ov.total} Fragen bearbeitet · Mastery {Math.round(ov.overallMastery * 100)} %{!online ? " · Offline" : ""}</Txt>
      <Button label="Prüfungssimulation" onPress={() => router.push("/(tabs)/lernen/pruefung")} disabled={!online} />
      {!online && <Txt muted size={12}>Die Prüfungssimulation braucht eine Internetverbindung, Lernen geht offline.</Txt>}
      <Txt muted size={12}>Übungsfragen sind eigene Formulierungen der Plattform und kein amtlicher Prüfungsinhalt.</Txt>
      <View style={{ gap: 8 }}>
        {MODES.map((m) => (
          <Pressable key={m.mode} accessibilityRole="button" onPress={() => start(m.mode)} style={{ backgroundColor: t.colors.bg.surface, borderRadius: 16, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 56 }}>
            <View><Txt bold>{m.title}</Txt><Txt muted size={13}>{m.text}</Txt></View>
            {m.key && <Txt bold size={13}>{ov[m.key]}</Txt>}
          </Pressable>
        ))}
      </View>
      <Card title="Nach Themen">
        {topics.map((tp) => { const tm = ov.topics.find((x) => x.topic_id === tp.id); return (
          <Pressable key={tp.id} accessibilityRole="button" onPress={() => start("topic", tp.id)} style={{ paddingVertical: 8 }}>
            <ProgressBar value={(tm?.mastery ?? 0) * 100} label={tp.name} color={tm?.weak ? t.colors.status.warning.fill : t.colors.status.success.fill} />
          </Pressable>
        ); })}
      </Card>
      <Txt muted size={12}>{profile ? `Klasse ${profile.licenseCode}` : ""}</Txt>
    </Screen>
  );
}
