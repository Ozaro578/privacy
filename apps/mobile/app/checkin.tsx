import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme";
import { Button, Card, Screen, Txt } from "@/components/ui";

async function fingerprint(): Promise<string> {
  let v = await SecureStore.getItemAsync("device_fp");
  if (!v) { v = Crypto.randomUUID(); await SecureStore.setItemAsync("device_fp", v); }
  return v;
}

export default function Checkin() {
  const t = useTheme();
  const router = useRouter();
  const p = useLocalSearchParams<{ code?: string }>();
  const [perm, requestPerm] = useCameraPermissions();
  const [code, setCode] = useState(p.code ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(token: string) {
    if (busy || token.length < 8) return;
    setBusy(true);
    const { error } = await supabase.rpc("checkin_theory_class", { p_token: token, p_device_fingerprint: await fingerprint() });
    setMsg(error ? error.message : "Anwesenheit registriert.");
    setBusy(false);
  }
  useEffect(() => { if (p.code) void submit(p.code); }, [p.code]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Screen title="Theorieunterricht">
      <Txt muted>Scanne den QR-Code deines Fahrlehrers. Der Code wechselt regelmäßig und gilt nur während des Unterrichts.</Txt>
      {perm?.granted ? (
        <View style={{ height: 280, borderRadius: 16, overflow: "hidden" }}><CameraView style={{ flex: 1 }} barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={({ data }) => { const m = data.match(/code=([A-Za-z0-9]+)/); const tok = m?.[1] ?? data; if (tok !== code) { setCode(tok); void submit(tok); } }} /></View>
      ) : <Button label="Kamera erlauben" variant="secondary" onPress={() => void requestPerm()} />}
      <Card>
        <Txt bold>Oder Code eingeben</Txt>
        <TextInput accessibilityLabel="Check-in-Code" value={code} onChangeText={setCode} autoCapitalize="none" style={{ minHeight: 48, borderWidth: 1, borderColor: t.colors.border.default, borderRadius: 12, paddingHorizontal: 12, color: t.colors.text.primary }} />
        <Button label="Einchecken" onPress={() => void submit(code)} loading={busy} disabled={code.length < 8} />
        {msg && <Txt color={msg.includes("registriert") ? t.colors.status.success.text : t.colors.status.danger.text}>{msg}</Txt>}
      </Card>
      <Button label="Schließen" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
