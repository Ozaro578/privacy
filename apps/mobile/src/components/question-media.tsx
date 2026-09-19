import { useEffect, useState } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { API_URL, supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme";
import { Txt } from "./ui";

/** Löst den Medienpfad einer Frage auf: öffentliche Web-Dateien direkt, Bucket-Objekte über /api/media mit Bearer-Token. */
async function resolve(path: string): Promise<{ uri: string; headers?: Record<string, string> }> {
  if (path.startsWith("https://")) return { uri: path };
  if (path.startsWith("/")) return { uri: `${API_URL}${path}` };
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return { uri: `${API_URL}/api/media?path=${encodeURIComponent(path)}`, ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}) };
}

export function QuestionMedia({ path, alt, credit }: { path: string | null | undefined; alt: string | null | undefined; credit?: string | null | undefined }) {
  const t = useTheme();
  const [src, setSrc] = useState<{ uri: string; headers?: Record<string, string> } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); setSrc(null); if (path) void resolve(path).then(setSrc); }, [path]);
  if (!path) return null;
  return (
    <View style={{ gap: 4 }}>
      <View style={{ backgroundColor: t.colors.bg.muted, borderRadius: 12, padding: 10, alignItems: "center", minHeight: 120, justifyContent: "center" }}>
        {src && !failed ? (
          <Image source={src} accessibilityLabel={alt ?? "Abbildung zur Frage"} accessible contentFit="contain" cachePolicy="disk" transition={150} onError={() => setFailed(true)} style={{ width: "100%", height: 220 }} />
        ) : (
          <Txt muted size={13} center>{failed ? `Bild nicht verfügbar. ${alt ?? ""}` : "Bild wird geladen …"}</Txt>
        )}
      </View>
      {credit && <Txt muted size={11}>{credit}</Txt>}
    </View>
  );
}
