import { useCallback, useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { trainingProgress, resolveRule, type RuleVersionRow, type SpecialDriveKind } from "@fahrpilot/rules-engine";
import { competencyProfile } from "@fahrpilot/learning-engine";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/profile";
import { useTheme, fmtDate, fmtTime, fmtEur, parseRange } from "@/lib/theme";
import { Button, Card, Loading, Pill, ProgressBar, Screen, Txt } from "@/components/ui";

const KIND: Record<string, string> = { practice: "Übungsstunde", overland: "Überlandfahrt", motorway: "Autobahnfahrt", night: "Nachtfahrt", special: "Sonderfahrt", exam_prep: "Prüfungsvorbereitung", practical_exam: "Praktische Prüfung", manual_conversion: "Schaltstunde", trailer: "Anhänger" };
interface L { id: string; start: string; end: string; kind: string; status: string; instructor: string; price: number | null }

export default function Driving() {
  const t = useTheme();
  const router = useRouter();
  const { profile, online } = useProfile();
  const [upcoming, setUpcoming] = useState<L[]>([]);
  const [open, setOpen] = useState<L[]>([]);
  const [drives, setDrives] = useState<ReturnType<typeof trainingProgress> | null>(null);
  const [skills, setSkills] = useState<ReturnType<typeof competencyProfile> | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!profile) return;
    const now = new Date().toISOString(); const in14 = new Date(Date.now() + 14 * 86_400_000).toISOString();
    const [{ data: mine }, { data: slots }, { data: prog }, { data: rules }, { data: lic }, { data: ratings }, { data: skillRows }] = await Promise.all([
      supabase.from("lessons").select("id, period, kind, status, price_cents, instructors(display_name)").eq("student_id", profile.studentId).in("status", ["booked", "confirmed"]).gte("period", `[${now},)`).order("period"),
      supabase.from("lessons").select("id, period, kind, status, price_cents, transmission, license_codes, instructors(display_name)").eq("status", "open").is("student_id", null).gte("period", `[${now},)`).lte("period", `[${in14},)`).order("period").limit(60),
      supabase.rpc("special_drive_progress", { p_student_license_id: profile.licenseId }),
      supabase.from("rule_versions").select("*").eq("rule_type", "training_requirements").in("review_status", ["published", "needs_verification"]),
      supabase.from("licenses").select("code, base_class"),
      supabase.from("student_skill_scores").select("skill_code, rating, rated_at").eq("student_license_id", profile.licenseId).order("rated_at", { ascending: false }).limit(200),
      supabase.from("skills").select("code, name_i18n").eq("active", true).order("sort_order"),
    ]);
    const map = (l: { id: string; period: unknown; kind: string; status: string; price_cents: number | null; instructors: unknown }): L => ({ id: l.id, ...parseRange(l.period as string), kind: l.kind, status: l.status, instructor: (l.instructors as { display_name: string } | null)?.display_name ?? "", price: l.price_cents });
    setUpcoming((mine ?? []).map(map));
    const codes = [profile.licenseCode, profile.baseClass].filter(Boolean) as string[];
    setOpen((slots ?? []).filter((s) => (!s.transmission || s.transmission === profile.transmission) && (!(s.license_codes as string[]).length || (s.license_codes as string[]).some((c) => codes.includes(c)))).map(map));
    const rule = resolveRule((rules ?? []) as unknown as RuleVersionRow[], { ruleType: "training_requirements", licenseCode: profile.licenseCode, acquisition: "first", licenses: lic ?? [], allowUnverified: true });
    const done: Partial<Record<SpecialDriveKind, number>> = {};
    for (const d of (prog ?? []) as Array<{ kind: SpecialDriveKind; units: number }>) done[d.kind] = d.units;
    setDrives(rule ? trainingProgress(rule.rules, done) : null);
    setSkills(competencyProfile((ratings ?? []).map((r) => ({ skill_code: r.skill_code, rating: r.rating, rated_at: r.rated_at })), (skillRows ?? []).map((s) => ({ code: s.code, name: (s.name_i18n as Record<string, string>)["de"] ?? s.code }))));
    setLoading(false);
  }, [profile]);
  useEffect(() => { void load(); }, [load]);
  async function book(id: string) {
    const { error } = await supabase.rpc("book_lesson", { p_lesson_id: id, p_student_license_id: profile!.licenseId });
    Alert.alert(error ? "Buchung nicht möglich" : "Gebucht", error ? error.message : "Deine Fahrstunde ist eingetragen.");
    void load();
  }
  function cancel(l: L) {
    const hours = (new Date(l.start).getTime() - Date.now()) / 3_600_000;
    Alert.alert("Fahrstunde stornieren?", hours < 24 ? "Weniger als 24 Stunden vor Beginn: Laut Vertrag kann eine Ausfallgebühr anfallen. Zeitpunkt und Regel werden dokumentiert." : "Die Stornierung ist kostenfrei.", [
      { text: "Abbrechen", style: "cancel" },
      { text: "Stornieren", style: "destructive", onPress: async () => { const { data, error } = await supabase.rpc("cancel_lesson", { p_lesson_id: l.id, p_reason: "App" }); const fee = (data as unknown as { fee_cents: number | null } | null)?.fee_cents; Alert.alert(error ? "Fehler" : "Storniert", error ? error.message : fee ? `Es fällt eine Ausfallgebühr von ${fmtEur(fee)} an.` : "Fahrstunde storniert."); void load(); } },
    ]);
  }
  if (loading || !profile) return <Screen title="Fahren"><Loading /></Screen>;
  return (
    <Screen title="Fahren">
      {!online && <Card style={{ backgroundColor: t.colors.status.warning.surface }}><Txt>Offline: Buchungen sind erst wieder online möglich.</Txt></Card>}
      <Card title="Nächste Fahrstunden">
        {upcoming.length === 0 ? <Txt muted>Keine Fahrstunde geplant.</Txt> : upcoming.map((l) => <View key={l.id} style={{ gap: 4, paddingVertical: 6 }}><Txt bold>{fmtDate(l.start)} · {fmtTime(l.start)} bis {fmtTime(l.end)}</Txt><Txt muted>{KIND[l.kind] ?? l.kind} · {l.instructor}</Txt><View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}><Pill color={l.status === "confirmed" ? t.colors.status.success.surface : t.colors.status.warning.surface}>{l.status === "confirmed" ? "bestätigt" : "angefragt"}</Pill><Button label="Stornieren" variant="ghost" onPress={() => cancel(l)} /></View></View>)}
      </Card>
      {drives && <Card title="Sonderfahrten">{drives.special_drives.map((d) => <ProgressBar key={d.kind} value={d.percent} label={`${{ overland: "Überland", motorway: "Autobahn", night: "Nacht" }[d.kind]}: ${d.completed_units} von ${d.required_units}`} color={d.remaining_units === 0 ? t.colors.status.success.fill : undefined} />)}</Card>}
      {skills && skills.overall_percent !== null && <Card title="Kompetenzprofil">{skills.skills.filter((s) => s.percent !== null).map((s) => <ProgressBar key={s.skill_code} value={s.percent!} label={s.name} color={s.percent! < 60 ? t.colors.status.warning.fill : t.colors.status.success.fill} />)}{skills.statement && <Txt muted>{skills.statement}</Txt>}</Card>}
      <Card title="Freie Fahrstunden (14 Tage)">
        {open.length === 0 ? <Txt muted>Keine freien Termine. Die Warteliste findest du in der Web-App.</Txt> : open.map((l) => <View key={l.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6, gap: 8 }}><View style={{ flex: 1 }}><Txt bold>{fmtDate(l.start)} · {fmtTime(l.start)}</Txt><Txt muted size={13}>{KIND[l.kind] ?? l.kind} · {l.instructor}{l.price ? ` · ${fmtEur(l.price)}` : ""}</Txt></View><Button label="Buchen" onPress={() => void book(l.id)} disabled={!online} /></View>)}
      </Card>
      <Button label="QR-Check-in Theorieunterricht" variant="secondary" onPress={() => router.push("/checkin")} />
    </Screen>
  );
}
