import { useEffect, useState } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEventListener } from "expo";
import { API_URL, supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme";
import { Txt } from "./ui";

type Source = { uri: string; headers?: Record<string, string> };

/** Löst den Medienpfad einer Frage auf: öffentliche Web-Dateien direkt, Bucket-Objekte über /api/media mit Bearer-Token. */
async function resolve(path: string): Promise<Source> {
  if (path.startsWith("https://")) return { uri: path };
  if (path.startsWith("/")) return { uri: `${API_URL}${path}` };
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return { uri: `${API_URL}/api/media?path=${encodeURIComponent(path)}`, ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}) };
}

/** Art des Mediums: explizit oder aus der Dateiendung (lizenzierte Videofragen als mp4/webm). */
export function questionMediaKind(path: string, kind?: string | null): "image" | "video" {
  if (kind === "video" || kind === "image") return kind;
  return /\.(mp4|webm)(\?|$)/i.test(path) ? "video" : "image";
}

/** Videofragen: Antworten erscheinen wie in der Prüfung erst nach dem ersten vollständigen Abspielen. */
export function videoGateOpen(path: string | null | undefined, kind: string | null | undefined, seen: boolean): boolean {
  return !path || questionMediaKind(path, kind) !== "video" || seen;
}
export const VIDEO_GATE_HINT = "Sieh dir das Video an. Die Antworten erscheinen nach dem Abspielen; du kannst es beliebig oft wiederholen.";

function QuestionVideo({ src, alt, onEnded }: { src: Source; alt: string; onEnded?: (() => void) | undefined }) {
  const player = useVideoPlayer(src, (p) => { p.loop = false; p.muted = false; });
  useEventListener(player, "playToEnd", () => { onEnded?.(); });
  return <VideoView player={player} nativeControls contentFit="contain" accessibilityLabel={alt} style={{ width: "100%", height: 220, borderRadius: 8, backgroundColor: "#000" }} />;
}

export function QuestionMedia({ path, alt, credit, kind, onEnded }: { path: string | null | undefined; alt: string | null | undefined; credit?: string | null | undefined; kind?: string | null | undefined; onEnded?: () => void }) {
  const t = useTheme();
  const [src, setSrc] = useState<Source | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); setSrc(null); if (path) void resolve(path).then(setSrc); }, [path]);
  if (!path) return null;
  const isVideo = questionMediaKind(path, kind);
  const label = alt ?? (isVideo === "video" ? "Video zur Frage" : "Abbildung zur Frage");
  return (
    <View style={{ gap: 4 }}>
      <View style={{ backgroundColor: t.colors.bg.muted, borderRadius: 12, padding: 10, alignItems: "center", minHeight: 120, justifyContent: "center" }}>
        {src && !failed ? (
          isVideo === "video"
            ? <QuestionVideo src={src} alt={label} onEnded={onEnded} />
            : <Image source={src} accessibilityLabel={label} accessible contentFit="contain" cachePolicy="disk" transition={150} onError={() => setFailed(true)} style={{ width: "100%", height: 220 }} />
        ) : (
          <Txt muted size={13} center>{failed ? `Bild nicht verfügbar. ${alt ?? ""}` : "Wird geladen …"}</Txt>
        )}
      </View>
      {isVideo === "video" && alt && <Txt muted size={12}>{alt}</Txt>}
      {credit && <Txt muted size={11}>{credit}</Txt>}
    </View>
  );
}
