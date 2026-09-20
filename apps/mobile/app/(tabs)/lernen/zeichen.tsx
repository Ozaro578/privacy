import { useMemo, useState } from "react";
import { FlatList, Pressable, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { signs, SIGN_CATEGORY_LABEL, type SignCategory, type SignEntry } from "@fahrpilot/content/signs";
import { API_URL } from "@/lib/supabase";
import { useTheme } from "@/lib/theme";
import { Button, Card, Screen, Txt } from "@/components/ui";

const ORDER: SignCategory[] = ["gefahrzeichen", "vorschriftzeichen", "richtzeichen", "verkehrseinrichtungen", "zusatzzeichen"];

/** Verkehrszeichenkatalog: Suche, Gruppenfilter, Bedeutung beim Antippen. */
export default function SignsScreen() {
  const t = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<SignCategory | "alle">("alle");
  const [open, setOpen] = useState<string | null>(null);
  const q = query.trim().toLowerCase();
  const data = useMemo(() => signs.filter((s) => (cat === "alle" || s.category === cat) && (!q || s.number.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.meaning.toLowerCase().includes(q))), [cat, q]);
  const render = ({ item: s }: { item: SignEntry }) => {
    const isOpen = open === s.id;
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={`Zeichen ${s.number} ${s.name}`} accessibilityState={{ expanded: isOpen }} onPress={() => setOpen(isOpen ? null : s.id)} style={{ backgroundColor: t.colors.bg.surface, borderRadius: 16, padding: 12, marginBottom: 8, flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
        <View style={{ width: 72, height: 72, borderRadius: 12, backgroundColor: t.colors.bg.muted, alignItems: "center", justifyContent: "center", padding: 6 }}>
          <Image source={{ uri: `${API_URL}/media/questions/${s.file}` }} accessibilityLabel={s.alt} contentFit="contain" cachePolicy="disk" style={{ width: "100%", height: "100%" }} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt muted size={12}>Zeichen {s.number} · {SIGN_CATEGORY_LABEL[s.category].split(" (")[0]}</Txt>
          <Txt bold>{s.name}</Txt>
          {isOpen && <Txt size={14}>{s.meaning}</Txt>}
        </View>
      </Pressable>
    );
  };
  return (
    <Screen title="Verkehrszeichen">
      <TextInput accessibilityLabel="Zeichen suchen" value={query} onChangeText={setQuery} placeholder="Nummer, Name oder Bedeutung" placeholderTextColor={t.colors.text.muted} style={{ minHeight: 44, borderWidth: 1, borderColor: t.colors.border.default, borderRadius: 12, paddingHorizontal: 12, color: t.colors.text.primary, backgroundColor: t.colors.bg.surface }} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {(["alle", ...ORDER] as const).map((c) => <Pressable key={c} accessibilityRole="button" accessibilityState={{ selected: cat === c }} onPress={() => setCat(c)} style={{ minHeight: 36, paddingHorizontal: 12, justifyContent: "center", borderRadius: 999, borderWidth: 1, borderColor: cat === c ? t.colors.action.primary : t.colors.border.default, backgroundColor: cat === c ? t.colors.action.secondary : t.colors.bg.surface }}><Txt size={12}>{c === "alle" ? `Alle (${signs.length})` : SIGN_CATEGORY_LABEL[c].split(" (")[0]}</Txt></Pressable>)}
      </View>
      <Button label="Zeichen-Trainer starten" onPress={() => router.push({ pathname: "/(tabs)/lernen/session", params: { mode: "signs", topic: "", limit: "15" } })} />
      {data.length === 0 ? <Card><Txt muted>Kein Zeichen gefunden.</Txt></Card> : <FlatList data={data} keyExtractor={(s) => s.id} renderItem={render} scrollEnabled={false} />}
    </Screen>
  );
}
