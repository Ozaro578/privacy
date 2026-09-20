import { useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, Pressable, TextInput, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { API_URL, supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { selfStudyPayload, validateSelfStudy, type SelfStudyForm } from "@/lib/self-study";
import { Button, Card, Screen, Txt } from "@/components/ui";

type Errors = Partial<Record<keyof SelfStudyForm, string>>;

/** Konto ohne Fahrschule anlegen (Selbstlernen). Später kann die Fahrschule per Code verbunden werden, der Lernstand bleibt. */
export default function RegisterScreen() {
  const t = useTheme();
  const router = useRouter();
  const { session, claims } = useSession();
  const [f, setF] = useState<SelfStudyForm>({ first_name: "", last_name: "", email: "", password: "", date_of_birth: "", transmission: "manual", consent_privacy: false, consent_terms: false });
  const [errors, setErrors] = useState<Errors>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  if (session && claims?.tenantId) return <Redirect href="/" />;
  const input = { minHeight: 48, borderWidth: 1, borderColor: t.colors.border.default, borderRadius: 12, paddingHorizontal: 12, color: t.colors.text.primary, backgroundColor: t.colors.bg.surface };
  const set = <K extends keyof SelfStudyForm>(k: K, v: SelfStudyForm[K]) => setF((p) => ({ ...p, [k]: v }));

  async function completeRegistration(): Promise<boolean> {
    const { error } = await supabase.rpc("register_self_study", { p_payload: selfStudyPayload(f) as never });
    if (error) { setMsg("Registrierung konnte nicht abgeschlossen werden. Bitte später erneut versuchen."); return false; }
    await supabase.auth.refreshSession();
    return true;
  }

  async function submit() {
    const e = validateSelfStudy(f);
    setErrors(e); setMsg(null);
    if (Object.keys(e).length > 0) return;
    setBusy(true);
    try {
      if (session) {
        // Konto existiert schon (z. B. nach E-Mail-Bestätigung), nur noch Schülerdatensatz anlegen
        if (await completeRegistration()) router.replace("/");
        return;
      }
      const { data, error } = await supabase.auth.signUp({ email: f.email.trim().toLowerCase(), password: f.password, options: { data: { first_name: f.first_name.trim(), last_name: f.last_name.trim(), locale: "de" } } });
      if (error) { setMsg(error.message.toLowerCase().includes("already") ? "Für diese E-Mail-Adresse existiert bereits ein Konto. Bitte anmelden." : "Konto konnte nicht angelegt werden. Bitte E-Mail und Passwort prüfen."); return; }
      if (!data.session) { setNeedsConfirm(true); return; }
      if (await completeRegistration()) router.replace("/");
    } finally { setBusy(false); }
  }

  const Check = ({ k, label, href }: { k: "consent_privacy" | "consent_terms"; label: string; href: string }) => (
    <View style={{ gap: 4 }}>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: f[k] }} accessibilityLabel={label} onPress={() => set(k, !f[k])} style={{ flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44 }}>
        <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: f[k] ? t.colors.action.primary : t.colors.border.default, backgroundColor: f[k] ? t.colors.action.primary : "transparent", alignItems: "center", justifyContent: "center" }}>{f[k] && <Txt size={14} color={t.colors.text.onPrimary}>✓</Txt>}</View>
        <Txt size={14}>{label}</Txt>
      </Pressable>
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(`${API_URL}${href}`)} style={{ minHeight: 32, justifyContent: "center" }}><Txt size={13} color={t.colors.text.link}>Text lesen</Txt></Pressable>
      {errors[k] && <Txt size={13} color={t.colors.status.danger.text}>{errors[k]}</Txt>}
    </View>
  );

  if (needsConfirm) {
    return (
      <Screen title="Fast geschafft">
        <Card>
          <Txt>Wir haben dir eine E-Mail an {f.email.trim()} geschickt. Bitte bestätige den Link darin und melde dich dann an. Beim ersten Anmelden richten wir dein Lernkonto ein.</Txt>
          <Button label="Zur Anmeldung" onPress={() => router.replace("/login")} />
        </Card>
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <Screen title="Konto erstellen">
        <Txt muted>Lerne für die Theorieprüfung Klasse B ohne Fahrschulbindung. Wenn du später eine Fahrschule hast, verbindest du dein Konto per Code und behältst deinen Lernstand.</Txt>
        <Card>
          <Txt bold>Vorname</Txt>
          <TextInput accessibilityLabel="Vorname" value={f.first_name} onChangeText={(v) => set("first_name", v)} autoComplete="given-name" style={input} />
          {errors.first_name && <Txt size={13} color={t.colors.status.danger.text}>{errors.first_name}</Txt>}
          <Txt bold>Nachname</Txt>
          <TextInput accessibilityLabel="Nachname" value={f.last_name} onChangeText={(v) => set("last_name", v)} autoComplete="family-name" style={input} />
          {errors.last_name && <Txt size={13} color={t.colors.status.danger.text}>{errors.last_name}</Txt>}
          <Txt bold>E-Mail-Adresse</Txt>
          <TextInput accessibilityLabel="E-Mail-Adresse" value={f.email} onChangeText={(v) => set("email", v)} autoCapitalize="none" keyboardType="email-address" autoComplete="email" style={input} editable={!session} />
          {errors.email && <Txt size={13} color={t.colors.status.danger.text}>{errors.email}</Txt>}
          {!session && (<>
            <Txt bold>Passwort (mindestens 8 Zeichen)</Txt>
            <TextInput accessibilityLabel="Passwort" value={f.password} onChangeText={(v) => set("password", v)} secureTextEntry autoComplete="new-password" style={input} />
            {errors.password && <Txt size={13} color={t.colors.status.danger.text}>{errors.password}</Txt>}
          </>)}
          <Txt bold>Geburtsdatum (TT.MM.JJJJ)</Txt>
          <TextInput accessibilityLabel="Geburtsdatum" value={f.date_of_birth} onChangeText={(v) => set("date_of_birth", v)} keyboardType="numbers-and-punctuation" placeholder="04.05.2008" placeholderTextColor={t.colors.text.muted} style={input} />
          {errors.date_of_birth && <Txt size={13} color={t.colors.status.danger.text}>{errors.date_of_birth}</Txt>}
          <Txt bold>Getriebe</Txt>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["manual", "automatic"] as const).map((tr) => { const active = f.transmission === tr; return (
              <Pressable key={tr} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => set("transmission", tr)} style={{ minHeight: 44, paddingHorizontal: 16, justifyContent: "center", borderRadius: 999, borderWidth: 1, borderColor: active ? t.colors.action.primary : t.colors.border.default, backgroundColor: active ? t.colors.action.secondary : t.colors.bg.surface }}>
                <Txt size={14} color={active ? t.colors.text.link : undefined}>{tr === "manual" ? "Schaltung" : "Automatik"}</Txt>
              </Pressable>); })}
          </View>
          <Check k="consent_privacy" label="Ich habe die Datenschutzerklärung gelesen." href="/datenschutz" />
          <Check k="consent_terms" label="Ich akzeptiere die Nutzungsbedingungen." href="/nutzungsbedingungen" />
          {msg && <Txt color={t.colors.status.danger.text}>{msg}</Txt>}
          <Button label={session ? "Lernkonto einrichten" : "Konto erstellen"} onPress={() => void submit()} loading={busy} />
        </Card>
        <Txt muted size={12} center>Übungsfragen sind eigene Inhalte und kein amtlicher Prüfungsinhalt.</Txt>
        <Button label="Zurück zur Anmeldung" variant="ghost" onPress={() => router.replace("/login")} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
