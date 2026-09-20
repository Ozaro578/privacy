import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SessionProvider } from "@/lib/session";
import { AppearanceProvider, useAppearance } from "@/lib/appearance";

function Bar() {
  const { appearance } = useAppearance();
  return <StatusBar style={appearance.theme === "dark" ? "light" : appearance.theme === "light" ? "dark" : "auto"} />;
}

export default function RootLayout() {
  return (
    <AppearanceProvider>
    <SessionProvider>
      <Bar />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="checkin" options={{ headerShown: true, title: "QR-Check-in", presentation: "modal" }} />
      </Stack>
    </SessionProvider>
    </AppearanceProvider>
  );
}
