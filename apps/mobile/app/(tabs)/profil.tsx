import { useCallback, useEffect, useState } from "react";
import { Alert, Platform, Switch, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session";
import { useProfile } from "@/lib/profile";
import { useTheme, fmtDate } from "@/lib/theme";
import { clearLocalData } from "@/lib/db";
import { Button, Card, Loading, Pill, Screen, Txt } from "@/components/ui";
import { AppearanceSettings } from "@/components/appearance-settings";

const DOC: Record<string, string> = { missing: "fehlt", uploaded: "in Prüfung", verified: "geprüft", rejected: "abgelehnt", expired: "abgelaufen" };
const TYPES: Array<[string, string]> = [["lesson_reminder_24h", "Fahrstunde morgen"], ["lesson_reminder_2h", "Fahrstunde in 2 Stunden"], ["earlier_slot_available", "Frühere Fahrstunde"], ["learn_reminder", "Lernerinnerung"], ["exam_countdown", "Prüfungs-Countdown"], ["invoice_due", "Rechnung fällig"], ["message_received", "Nachrichten"]];

export default function Profile() {
  const t = useTheme();
  const { claims, signOut } = useSession();
  const { profile, refresh, lastRefresh } = useProfile();
  const [docs, setDocs] = useState<Array<{ id: string; title: string; status: string; kind: string; requirement_code: string | null; rejection_reason: string | null }>>([]);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [schoolCode, setSchoolCode] = useState("");
  const [joinMsg, setJoinMsg] = useState<string | null>(null);
  const [selfStudy, setSelfStudy] = useState(false);
  const load = useCallback(async () => {
    if (!profile || !claims) return;
    const [{ data: d }, { data: p }] = await Promise.all([supabase.from("documents").select("id, title, status, kind, requirement_code, rejection_reason").eq("student_id", profile.studentId).order("status"), supabase.from("notification_preferences").select("notification_type, push").eq("user_id", claims.userId)]);
    setDocs(d ?? []); setPrefs(Object.fromEntries((p ?? []).map((x) => [x.notification_type, x.push])));
  }, [profile, claims]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!claims?.tenantId) return;
    void supabase.from("driving_schools").select("settings").eq("id", claims.tenantId).maybeSingle().then(({ data }) => setSelfStudy(((data?.settings as Record<string, unknown> | null)?.["self_study"]) === true));
  }, [claims?.tenantId]);
  /** Selbstlernende verbinden ihr Konto mit einer Fahrschule (Anmelde-Code = Kürzel des Anmeldelinks); der Lernstand wird übernommen. */
  async function joinSchool() {
    const slug = schoolCode.trim().toLowerCase();
    if (!/^[a-z0-9-]{3,40}$/.test(slug)) { setJoinMsg("Bitte den Fahrschul-Code eingeben (Kleinbuchstaben, Ziffern, Bindestrich)."); return; }
    setBusy(true); setJoinMsg(null);
    const { error } = await supabase.rpc("join_school_from_self_study", { p_tenant_slug: slug, p_payload: {} as never });
    if (error) { setBusy(false); setJoinMsg(error.message.includes("nicht gefunden") ? "Fahrschule nicht gefunden. Frag deine Fahrschule nach ihrem Anmelde-Code." : "Verbindung nicht möglich. Bitte später erneut versuchen."); return; }
    await supabase.auth.refreshSession();
    await clearLocalData();
    await refresh();
    setBusy(false); setSchoolCode("");
    Alert.alert("Verbunden", "Dein Konto gehört jetzt zu deiner Fahrschule. Dein Lernstand wurde übernommen.");
  }
  async function upload(doc: { id: string; kind: string }) {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (res.canceled || !res.assets[0] || !profile) return;
    setBusy(true);
    const asset = res.assets[0];
    const path = `${profile.tenantId}/${profile.studentId}/${doc.kind}-${Date.now()}.jpg`;
    const blob = await (await fetch(asset.uri)).arrayBuffer();
    const { error } = await supabase.storage.from("documents").upload(path, blob, { contentType: asset.mimeType ?? "image/jpeg" });
    if (!error) await supabase.from("documents").update({ storage_path: path, mime_type: asset.mimeType ?? "image/jpeg", size_bytes: asset.fileSize ?? null, status: "uploaded", uploaded_by: claims!.userId }).eq("id", doc.id);
    setBusy(false);
    Alert.alert(error ? "Upload fehlgeschlagen" : "Hochgeladen", error ? error.message : "Die Fahrschule prüft dein Dokument.");
    void load();
  }
  async function togglePush(type: string, value: boolean) {
    setPrefs((p) => ({ ...p, [type]: value }));
    await supabase.from("notification_preferences").upsert({ user_id: claims!.userId, notification_type: type, push: value, email: false, in_app: true }, { onConflict: "user_id,notification_type" });
    if (value) await registerPush();
  }
  async function registerPush() {
    if (!Device.isDevice) return;
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await supabase.from("push_tokens").upsert({ user_id: claims!.userId, provider: "expo", token, device_name: Device.modelName ?? Platform.OS, locale: profile?.locale ?? "de", last_seen_at: new Date().toISOString() }, { onConflict: "provider,token" });
  }
  if (!profile) return <Screen title="Profil"><Loading /></Screen>;
  return (
    <Screen title={profile.firstName}>
      <Card title="Ausbildung"><Txt>Klasse {profile.licenseCode} · {profile.transmission === "automatic" ? "Automatik" : "Schaltung"}</Txt><Txt muted size={13}>Theorieprüfung: {profile.theoryExamStatus} · Praktische Prüfung: {profile.practicalExamStatus}</Txt></Card>
      <Card title="Dokumenten-Checkliste">
        {docs.map((d) => <View key={d.id} style={{ paddingVertical: 6, gap: 4 }}><View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}><Txt>{d.status === "verified" ? "☑" : "☐"} {d.title}</Txt><Pill color={d.status === "verified" ? t.colors.status.success.surface : d.status === "rejected" ? t.colors.status.danger.surface : undefined}>{DOC[d.status] ?? d.status}</Pill></View>{d.rejection_reason && <Txt size={12} color={t.colors.status.danger.text}>{d.rejection_reason}</Txt>}{["missing", "rejected"].includes(d.status) && ["id_copy", "passport_photo", "eye_test", "first_aid", "guardian_consent"].includes(d.requirement_code ?? "") && <Button label="Foto hochladen" variant="secondary" onPress={() => void upload(d)} loading={busy} />}</View>)}
      </Card>
      <AppearanceSettings />
      <Card title="Push-Benachrichtigungen">{TYPES.map(([type, label]) => <View key={type} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 44 }}><Txt>{label}</Txt><Switch accessibilityLabel={label} value={prefs[type] ?? true} onValueChange={(v) => void togglePush(type, v)} /></View>)}</Card>
      {selfStudy && (
        <Card title="Mit Fahrschule verbinden">
          <Txt muted size={13}>Du lernst bisher ohne Fahrschule. Mit dem Anmelde-Code deiner Fahrschule übernimmst du deinen Lernstand dorthin und bekommst Fahrstunden, Termine und Dokumente in der App.</Txt>
          <TextInput accessibilityLabel="Fahrschul-Code" value={schoolCode} onChangeText={setSchoolCode} autoCapitalize="none" autoCorrect={false} placeholder="z. B. fahrschule-nord" placeholderTextColor={t.colors.text.muted} style={{ minHeight: 48, borderWidth: 1, borderColor: t.colors.border.default, borderRadius: 12, paddingHorizontal: 12, color: t.colors.text.primary, backgroundColor: t.colors.bg.surface }} />
          {joinMsg && <Txt size={13} color={t.colors.status.danger.text}>{joinMsg}</Txt>}
          <Button label="Verbinden" variant="secondary" onPress={() => void joinSchool()} loading={busy} disabled={schoolCode.trim().length < 3} />
        </Card>
      )}
      <Card title="Offline-Daten"><Txt muted size={13}>Zuletzt aktualisiert: {lastRefresh ? fmtDate(lastRefresh) : "noch nie"}</Txt><Button label="Lerninhalte aktualisieren" variant="secondary" onPress={() => void refresh()} /></Card>
      <Button label="Abmelden" variant="ghost" onPress={() => { Alert.alert("Abmelden?", "Nicht synchronisierte Antworten gehen verloren.", [{ text: "Abbrechen", style: "cancel" }, { text: "Abmelden", style: "destructive", onPress: async () => { await clearLocalData(); await signOut(); } }]); }} />
    </Screen>
  );
}
