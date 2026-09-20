import { Redirect } from "expo-router";
import { useSession } from "@/lib/session";
import { Loading, Screen, Txt, Button } from "@/components/ui";

export default function Index() {
  const { session, claims, loading, signOut } = useSession();
  if (loading) return <Screen><Loading /></Screen>;
  if (!session) return <Redirect href="/login" />;
  // Konto ohne Mandant (z. B. nach E-Mail-Bestätigung der Selbstlern-Registrierung): Lernkonto einrichten
  if (!claims?.tenantId) return <Redirect href="/registrieren" />;
  if (claims?.role !== "student") return <Screen title="Nur für Fahrschüler"><Txt>Diese App ist für Fahrschüler. Fahrlehrer und Büro nutzen die Web-App deiner Fahrschule.</Txt><Button label="Abmelden" variant="secondary" onPress={() => void signOut()} /></Screen>;
  return <Redirect href="/(tabs)/heute" />;
}
