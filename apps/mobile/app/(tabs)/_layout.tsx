import { Tabs, Redirect } from "expo-router";
import { Text, type ColorValue } from "react-native";
import { useSession } from "@/lib/session";
import { ProfileProvider } from "@/lib/profile";
import { useTheme } from "@/lib/theme";

const icon = (glyph: string) => ({ color }: { color: ColorValue }) => <Text style={{ fontSize: 18, color }}>{glyph}</Text>;

export default function TabsLayout() {
  const t = useTheme();
  const { session, claims, loading } = useSession();
  if (!loading && (!session || claims?.role !== "student")) return <Redirect href="/" />;
  return (
    <ProfileProvider>
      <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: t.colors.action.primary, tabBarInactiveTintColor: t.colors.text.muted, tabBarStyle: { backgroundColor: t.colors.bg.surface, minHeight: 60 } }}>
        <Tabs.Screen name="heute" options={{ title: "Heute", tabBarIcon: icon("◎") }} />
        <Tabs.Screen name="lernen" options={{ title: "Lernen", tabBarIcon: icon("▤") }} />
        <Tabs.Screen name="fahren" options={{ title: "Fahren", tabBarIcon: icon("⌖") }} />
        <Tabs.Screen name="finanzen" options={{ title: "Finanzen", tabBarIcon: icon("€") }} />
        <Tabs.Screen name="profil" options={{ title: "Profil", tabBarIcon: icon("●") }} />
      </Tabs>
    </ProfileProvider>
  );
}
