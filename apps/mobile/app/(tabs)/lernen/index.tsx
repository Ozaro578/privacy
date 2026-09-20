import { useCallback, useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useProfile } from "@/lib/profile";
import { useTheme } from "@/lib/theme";
import { loadQuestions, loadTopics } from "@/lib/content";
import { stateStore } from "@/lib/sync";
import { supabase } from "@/lib/supabase";
import { LEVEL_LABEL, currentLevel, levelProgress } from "@fahrpilot/learning-engine";
import { engineStates, toMeta } from "@/offline/local-learning";
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
  const [level, setLevel] = useState<{ level: number; mastered: number; total: number } | null>(null);
  const [board, setBoard] = useState<Array<{ rank: number; alias: string; xp: number; is_me: boolean }>>([]);
  const load = useCallback(async () => {
    const [pool, states, ts] = await Promise.all([loadQuestions(), stateStore.loadAll(), loadTopics()]);
    setOv(localOverview(pool, states)); setTopics(ts);
    const progress = levelProgress(pool.map(toMeta), engineStates(states));
    const lv = currentLevel(progress); const row = progress.find((p) => p.level === lv);
    setLevel({ level: lv, mastered: row?.mastered ?? 0, total: row?.total ?? 0 });
    if (online) { const { data } = await supabase.rpc("tenant_leaderboard", { p_days: 7, p_limit: 5 }); setBoard(((data ?? []) as unknown) as Array<{ rank: number; alias: string; xp: number; is_me: boolean }>); }
  }, [online]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useEffect(() => { void load(); }, [load]);
  if (!ov) return <Screen title="Lernen"><Loading /></Screen>;
  const openSigns = () => router.push("/(tabs)/lernen/zeichen");
  const start = (mode: string, topic?: string) => router.push({ pathname: "/(tabs)/lernen/session", params: { mode, topic: topic ?? "", limit: "15" } });
  return (
    <Screen title="Lernen">
      <Txt muted>{ov.answered} von {ov.total} Fragen bearbeitet · Mastery {Math.round(ov.overallMastery * 100)} %{!online ? " · Offline" : ""}</Txt>
      {level && <Card title={`Stufe ${level.level}: ${LEVEL_LABEL[level.level as 1 | 2 | 3 | 4 | 5]}`}><Txt muted size={13}>{level.mastered} von {level.total} Fragen dieser Stufe gemeistert. Von leicht nach schwer, die Stufe steigt automatisch.</Txt><Button label={`Stufe ${level.level} lernen`} onPress={() => start("ladder")} /></Card>}
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
      <Button label="Vorfahrt-Trainer: Wer fährt zuerst?" variant="secondary" onPress={() => router.push("/(tabs)/lernen/vorfahrt")} />
      <Button label="Alle Verkehrszeichen mit Bedeutung" variant="secondary" onPress={openSigns} />
      {board.length > 0 && <Card title="Bestenliste der Woche">{board.map((r) => <View key={r.rank} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}><Txt bold={r.is_me}>{r.rank}. {r.alias}{r.is_me ? " (du)" : ""}</Txt><Txt bold={r.is_me}>{r.xp} XP</Txt></View>)}<Txt muted size={11}>Freiwillig, Teilnahme im Web-Profil unter Lernen einstellbar.</Txt></Card>}
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
