import { useCallback, useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { planToday, type TodayItem } from "@fahrpilot/learning-engine";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/profile";
import { useTheme, readinessColor, bandLabel, fmtDate, fmtTime, parseRange } from "@/lib/theme";
import { loadQuestions } from "@/lib/content";
import { loadTopics } from "@/lib/db";
import { stateStore, kvStore } from "@/lib/sync";
import { KV_STREAK, KV_DAILY_GOAL } from "@/offline/sync";
import { localOverview } from "@/offline/local-learning";
import { Card, Loading, ProgressBar, Screen, Txt, Button } from "@/components/ui";

interface Data { challengeDone: boolean; readiness: number | null; theory: number; practical: number | null; nextLesson: { start: string; instructor: string } | null; nextClass: { start: string; title: string } | null; missingDocs: string[]; openCents: number; today: TodayItem[]; streak: number; due: number; theoryExamAt: string | null }

export default function Today() {
  const t = useTheme();
  const router = useRouter();
  const { profile, loading, online, error } = useProfile();
  const [d, setD] = useState<Data | null>(null);
  const load = useCallback(async () => {
    if (!profile) return;
    const now = new Date().toISOString();
    const [{ data: snap }, { data: lesson }, { data: cls }, { data: docs }, { data: inv }, { data: exam }, pool, states, streakRaw, goalRaw] = await Promise.all([
      supabase.from("readiness_snapshots").select("overall_score, theory_score, practical_score").eq("student_license_id", profile.licenseId).order("computed_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("lessons").select("period, instructors(display_name)").eq("student_id", profile.studentId).in("status", ["booked", "confirmed"]).gte("period", `[${now},)`).order("period").limit(1).maybeSingle(),
      supabase.from("theory_classes").select("period, title, attendance!inner(student_id)").eq("attendance.student_id", profile.studentId).gte("period", `[${now},)`).order("period").limit(1).maybeSingle(),
      supabase.from("documents").select("title").eq("student_id", profile.studentId).in("status", ["missing", "rejected"]),
      supabase.from("invoices").select("gross_cents, paid_cents").eq("student_id", profile.studentId).in("status", ["issued", "partially_paid", "overdue"]),
      supabase.from("theory_exams").select("scheduled_at").eq("student_license_id", profile.licenseId).eq("status", "scheduled").maybeSingle(),
      loadQuestions(), stateStore.loadAll(), kvStore.get(KV_STREAK), kvStore.get(KV_DAILY_GOAL),
    ]);
    const topicNames = new Map((await loadTopics()).map((x) => [x.id, x.name] as const));
    const ov = localOverview(pool, states);
    const streak = streakRaw ? (JSON.parse(streakRaw) as { current_days: number }).current_days : 0;
    const goal = goalRaw ? (JSON.parse(goalRaw) as { answered: number; achieved: boolean; challenge_done?: boolean }) : null;
    const nl = lesson ? { start: parseRange(lesson.period as unknown as string).start, instructor: (lesson.instructors as unknown as { display_name: string } | null)?.display_name ?? "" } : null;
    const nc = cls ? { start: parseRange(cls.period as unknown as string).start, title: cls.title } : null;
    const weakestT = [...ov.topics].filter((x) => x.question_count > 0).sort((a, b) => a.mastery - b.mastery)[0];
    const weakest = weakestT && weakestT.mastery < 0.7 ? weakestT.topic_id : null;
    const today = planToday({ now: new Date(), dueQuestions: ov.due, weakestTopic: weakest ? { id: weakest, name: topicNames.get(weakest) ?? "Thema" } : null, instructorFlaggedSkills: [], nextLesson: nl ? { starts_at: nl.start, instructor_name: nl.instructor } : null, nextTheoryClass: nc ? { starts_at: nc.start, title: nc.title } : null, missingDocuments: (docs ?? []).map((x) => x.title), theoryExamAt: exam?.scheduled_at ?? null, practicalExamAt: null, openInvoiceCents: (inv ?? []).reduce((s, i) => s + Math.max(0, i.gross_cents - i.paid_cents), 0), dailyGoalDone: goal?.achieved ?? false, learnedToday: (goal?.answered ?? 0) > 0, streakDays: streak, readinessScore: snap?.overall_score ?? null });
    setD({ challengeDone: goal?.challenge_done === true, readiness: snap?.overall_score ?? null, theory: snap?.theory_score ?? Math.round(ov.overallMastery * 100), practical: snap?.practical_score ?? null, nextLesson: nl, nextClass: nc, missingDocs: (docs ?? []).map((x) => x.title), openCents: (inv ?? []).reduce((s, i) => s + Math.max(0, i.gross_cents - i.paid_cents), 0), today, streak, due: ov.due, theoryExamAt: exam?.scheduled_at ?? null });
  }, [profile]);
  useEffect(() => { void load(); }, [load]);
  if (loading || (!d && !error)) return <Screen><Loading /></Screen>;
  if (!profile) return <Screen title="Kein Ausbildungsprofil"><Txt>{error ?? "Deine Fahrschule hat dich noch nicht freigeschaltet."}</Txt></Screen>;
  const go = (item: TodayItem) => {
    const a = item.action;
    if (!a) return;
    if (a.type === "learn") router.push(a.mode === "exam" ? "/(tabs)/lernen/pruefung" : { pathname: "/(tabs)/lernen/session", params: { mode: a.mode ?? "review", topic: a.topic_id ?? "", limit: String(Math.max(5, (a.minutes ?? 5) * 2)) } });
    else if (a.route?.startsWith("/fahren")) router.push("/(tabs)/fahren"); else if (a.route?.startsWith("/finanzen")) router.push("/(tabs)/finanzen"); else if (a.route?.startsWith("/theorie")) router.push("/checkin"); else router.push("/(tabs)/profil");
  };
  return (
    <Screen title={`Hallo, ${profile.firstName} 👋`}>
      {!online && <Card style={{ backgroundColor: t.colors.status.warning.surface }}><Txt>Offline. Deine Antworten werden synchronisiert, sobald du wieder online bist.</Txt></Card>}
      <Card>
        <Txt muted size={12}>TAGES-CHALLENGE</Txt>
        <Txt bold>{d!.challengeDone ? "Heute geschafft. Stark!" : "10 Fragen deiner Stufe, mindestens 8 richtig"}</Txt>
        <Txt muted size={13}>{d!.challengeDone ? "Morgen wartet die nächste Challenge." : "Bringt 20 Bonus-XP und hält deine Serie am Leben."}</Txt>
        {!d!.challengeDone && <Button label="Challenge starten" onPress={() => router.push({ pathname: "/(tabs)/lernen/session", params: { mode: "ladder", topic: "", limit: "10", challenge: "1" } })} />}
      </Card>
      <Card>
        <Txt muted size={12}>PRÜFUNGSREIFE</Txt>
        <Txt bold size={40} color={readinessColor(t, d!.readiness)}>{d!.readiness === null ? "?" : `${d!.readiness} %`}</Txt>
        <Txt color={readinessColor(t, d!.readiness)}>{bandLabel(d!.readiness)}</Txt>
        <ProgressBar value={d!.theory} label="Theorie" />
        <ProgressBar value={d!.practical ?? 0} label="Praxis" color={t.colors.status.success.fill} />
        <Txt muted size={12}>Keine Garantie für das Bestehen, sondern eine Einschätzung aus deinem Lernverhalten.</Txt>
      </Card>
      {d!.today[0] && <Card style={{ backgroundColor: t.colors.accent.surface }}><Txt muted size={12}>HEUTE EMPFOHLEN</Txt><Txt bold size={18}>{d!.today[0].title}</Txt><Button label="Training starten" onPress={() => go(d!.today[0]!)} /></Card>}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Card style={{ flex: 1 }}><Txt muted size={12}>NÄCHSTE FAHRSTUNDE</Txt>{d!.nextLesson ? <><Txt bold>{fmtDate(d!.nextLesson.start)}</Txt><Txt>{fmtTime(d!.nextLesson.start)} · {d!.nextLesson.instructor}</Txt></> : <Txt>Keine geplant</Txt>}</Card>
        <Card style={{ flex: 1 }}><Txt muted size={12}>SERIE</Txt><Txt bold size={22}>🔥 {d!.streak} Tage</Txt><Txt muted size={12}>{d!.due} Fragen fällig</Txt></Card>
      </View>
      <Card title="Heute">
        {d!.today.length === 0 ? <Txt muted>Nichts offen. Wiederhole ein paar Fragen, um deine Serie zu halten.</Txt> : d!.today.map((it, i) => (
          <Pressable key={i} accessibilityRole="button" onPress={() => go(it)} style={{ paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderColor: t.colors.border.subtle }}><Txt bold>{i + 1}. {it.title}</Txt>{it.subtitle && <Txt muted size={13}>{it.subtitle}</Txt>}</Pressable>
        ))}
      </Card>
      {d!.missingDocs.length > 0 && <Link href="/(tabs)/profil" asChild><Pressable><Card><Txt>Dokumente fehlen: {d!.missingDocs.join(", ")}</Txt></Card></Pressable></Link>}
    </Screen>
  );
}
