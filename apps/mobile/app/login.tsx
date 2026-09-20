import { useState } from "react";
import { KeyboardAvoidingView, Platform, TextInput } from "react-native";
import { Redirect } from "expo-router";
import * as Linking from "expo-linking";
import { API_URL, supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Button, Card, Screen, Txt } from "@/components/ui";

export default function Login() {
  const t = useTheme();
  const { session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (session) return <Redirect href="/" />;
  const input = { minHeight: 48, borderWidth: 1, borderColor: t.colors.border.default, borderRadius: 12, paddingHorizontal: 12, color: t.colors.text.primary, backgroundColor: t.colors.bg.surface };
  async function login() {
    setBusy(true); setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setMsg("Anmeldung fehlgeschlagen. Bitte Zugangsdaten prüfen.");
  }
  async function magic() {
    setBusy(true); setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: Linking.createURL("/auth/callback") } });
    setBusy(false);
    setMsg(error ? "Der Anmeldelink konnte nicht gesendet werden." : "Anmeldelink per E-Mail gesendet.");
  }
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <Screen title="FahrPilot">
        <Txt muted>Lernen, Fahren, Prüfung. Alles in einer App.</Txt>
        <Card>
          <Txt bold>E-Mail-Adresse</Txt>
          <TextInput accessibilityLabel="E-Mail-Adresse" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" style={input} />
          <Txt bold>Passwort</Txt>
          <TextInput accessibilityLabel="Passwort" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" style={input} />
          {msg && <Txt color={t.colors.status.info.text}>{msg}</Txt>}
          <Button label="Anmelden" onPress={() => void login()} loading={busy} disabled={!email || password.length < 8} />
          <Button label="Anmeldelink per E-Mail" variant="ghost" onPress={() => void magic()} disabled={!email || busy} />
        </Card>
        <Txt muted size={12} center>Neu hier? Deine Fahrschule schickt dir einen Anmeldelink.</Txt>
        <Button label="Ohne Fahrschule lernen: Konto erstellen" variant="ghost" onPress={() => void Linking.openURL(`${API_URL}/registrieren`)} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
