import { useEffect, useState } from "react";
import { Pressable } from "react-native";
import * as Speech from "expo-speech";
import { useTheme } from "@/lib/theme";
import { Txt } from "./ui";

/** Liest den Text mit der Sprachausgabe des Geräts vor. */
export function ReadAloud({ text, lang = "de-DE" }: { text: string; lang?: string }) {
  const t = useTheme();
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => () => { void Speech.stop(); }, []);
  const toggle = async () => {
    if (speaking) { await Speech.stop(); setSpeaking(false); return; }
    setSpeaking(true);
    Speech.speak(text, { language: lang, rate: 0.95, onDone: () => setSpeaking(false), onStopped: () => setSpeaking(false), onError: () => setSpeaking(false) });
  };
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={speaking ? "Vorlesen stoppen" : "Frage vorlesen"} accessibilityState={{ selected: speaking }} onPress={() => void toggle()} style={{ alignSelf: "flex-start", minHeight: 36, paddingHorizontal: 12, justifyContent: "center", borderRadius: 999, borderWidth: 1, borderColor: t.colors.border.default, backgroundColor: t.colors.bg.surface }}>
      <Txt size={12} muted>{speaking ? "■ Stopp" : "🔊 Vorlesen"}</Txt>
    </Pressable>
  );
}
