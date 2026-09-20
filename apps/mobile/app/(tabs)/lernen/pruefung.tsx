import { useEffect, useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme";
import { Button, Card, Loading, Screen, Txt } from "@/components/ui";
import { QuestionMedia, VIDEO_GATE_HINT, videoGateOpen } from "@/components/question-media";

interface ExamQ { id: string; position: number; points: number; text: string; mediaPath: string | null; mediaAlt: string | null; mediaCredit: string | null; numeric: boolean; answers: Array<{ position: number; text: string }> }
interface Started { id: string; timeLimitSeconds: number | null; maxErrorPoints: number; questionsTotal: number; questions: ExamQ[] }
interface Result { passed: boolean | null; error_points: number | null; correct_count: number | null; wrong_count: number | null; unsure_count: number | null; duration_seconds: number | null; fail_reasons: string[]; analysis: { statements?: string[]; recommendation?: { text: string } | null } | null }

export default function Exam() {
  const t = useTheme();
  const router = useRouter();
  const [exam, setExam] = useState<Started | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { selected: number[]; numeric: string; unsure: boolean; ms: number }>>({});
  const [videoSeen, setVideoSeen] = useState<Record<string, true>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const entered = useRef(Date.now());
  useEffect(() => { entered.current = Date.now(); }, [i]);

  async function start() {
    setBusy(true); setError(null);
    try { setExam(await apiFetch<Started>("/api/exam", { method: "POST", body: JSON.stringify({ action: "start" }) })); } catch (e) { setError(e instanceof Error ? e.message : "Start fehlgeschlagen"); }
    setBusy(false);
  }
  async function submit() {
    if (!exam) return;
    setBusy(true);
    try {
      const body = { action: "submit", simulationId: exam.id, answers: exam.questions.map((q) => { const a = answers[q.id]; return { questionId: q.id, selected: a?.selected ?? [], numericAnswer: q.numeric && a?.numeric ? Number(a.numeric.replace(",", ".")) : null, unsure: a?.unsure ?? false, responseMs: a?.ms ?? null }; }) };
      await apiFetch("/api/exam", { method: "POST", body: JSON.stringify(body) });
      const { data } = await supabase.from("exam_simulations").select("passed, error_points, correct_count, wrong_count, unsure_count, duration_seconds, fail_reasons, analysis").eq("id", exam.id).single();
      setResult(data as unknown as Result);
    } catch (e) { setError(e instanceof Error ? e.message : "Abgabe fehlgeschlagen"); }
    setBusy(false);
  }
  if (result) {
    return (
      <Screen title={result.passed ? "Bestanden" : "Nicht bestanden"}>
        <Card><Txt>Fehlerpunkte: <Txt bold>{result.error_points}</Txt></Txt><Txt>Richtig: {result.correct_count} · Falsch: {result.wrong_count} · Unsicher: {result.unsure_count}</Txt><Txt>Bearbeitungszeit: {Math.floor((result.duration_seconds ?? 0) / 60)}:{String((result.duration_seconds ?? 0) % 60).padStart(2, "0")}</Txt>{result.fail_reasons.map((r) => <Txt key={r} color={t.colors.status.danger.text}>{r}</Txt>)}</Card>
        {result.analysis?.statements?.length ? <Card title="Analyse">{result.analysis.statements.map((s, k) => <Txt key={k}>{s}</Txt>)}{result.analysis.recommendation && <Txt bold>{result.analysis.recommendation.text}</Txt>}</Card> : null}
        <Button label="Neue Simulation" onPress={() => { setResult(null); setExam(null); setAnswers({}); setI(0); }} />
        <Button label="Zurück zum Lernen" variant="secondary" onPress={() => router.replace("/(tabs)/lernen")} />
      </Screen>
    );
  }
  if (!exam) {
    return (
      <Screen title="Prüfungssimulation">
        <Card><Txt>Die Simulation läuft nach der gültigen Prüfungsregel deiner Klasse: Fragenzahl, Fehlerpunkte und Durchfallregeln werden serverseitig eingefroren und ausgewertet.</Txt>{error && <Txt color={t.colors.status.danger.text}>{error}</Txt>}<Button label="Simulation starten" onPress={() => void start()} loading={busy} /></Card>
      </Screen>
    );
  }
  const q = exam.questions[i]!;
  const a = answers[q.id] ?? { selected: [], numeric: "", unsure: false, ms: 0 };
  const upd = (patch: Partial<typeof a>) => { setAnswers((s) => ({ ...s, [q.id]: { ...a, ...patch, ms: a.ms + (Date.now() - entered.current) } })); entered.current = Date.now(); };
  const answered = exam.questions.filter((x) => { const an = answers[x.id]; return an && (x.numeric ? an.numeric !== "" : an.selected.length > 0); }).length;
  return (
    <Screen>
      <Txt muted>Frage {i + 1} / {exam.questions.length} · {answered} beantwortet · max. {exam.maxErrorPoints} Fehlerpunkte</Txt>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>{exam.questions.map((x, k) => { const an = answers[x.id]; const d = an && (x.numeric ? an.numeric !== "" : an.selected.length > 0); return <Pressable key={x.id} accessibilityLabel={`Frage ${k + 1}`} onPress={() => setI(k)} style={{ width: 30, height: 30, borderRadius: 6, alignItems: "center", justifyContent: "center", backgroundColor: an?.unsure ? t.colors.status.warning.surface : d ? t.colors.status.success.surface : t.colors.bg.muted, borderWidth: k === i ? 2 : 0, borderColor: t.colors.action.primary }}><Txt size={11}>{k + 1}</Txt></Pressable>; })}</View>
      <Card>
        <Txt muted size={12}>{q.points} Punkte</Txt>
        <QuestionMedia path={q.mediaPath} alt={q.mediaAlt} credit={q.mediaCredit} onEnded={() => setVideoSeen((s) => ({ ...s, [q.id]: true }))} />
        <Txt bold size={18}>{q.text}</Txt>
        {!videoGateOpen(q.mediaPath, null, videoSeen[q.id] === true) ? <Txt muted size={14}>{VIDEO_GATE_HINT}</Txt>
          : q.numeric ? <TextInput accessibilityLabel="Antwort als Zahl" value={a.numeric} onChangeText={(v) => upd({ numeric: v })} keyboardType="decimal-pad" style={{ minHeight: 48, borderWidth: 1, borderColor: t.colors.border.default, borderRadius: 12, paddingHorizontal: 12, width: 160, color: t.colors.text.primary }} />
          : q.answers.map((ans) => { const sel = a.selected.includes(ans.position); return <Pressable key={ans.position} accessibilityRole="checkbox" accessibilityState={{ checked: sel }} onPress={() => upd({ selected: sel ? a.selected.filter((x) => x !== ans.position) : [...a.selected, ans.position] })} style={{ minHeight: 52, borderWidth: 2, borderRadius: 12, padding: 12, borderColor: sel ? t.colors.action.primary : t.colors.border.default, backgroundColor: sel ? t.colors.accent.surface : t.colors.bg.surface }}><Txt>{sel ? "☑ " : "☐ "}{ans.text}</Txt></Pressable>; })}
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: a.unsure }} onPress={() => upd({ unsure: !a.unsure })} style={{ minHeight: 44, justifyContent: "center" }}><Txt muted>{a.unsure ? "☑" : "☐"} Unsicher, später prüfen</Txt></Pressable>
      </Card>
      {error && <Txt color={t.colors.status.danger.text}>{error}</Txt>}
      <View style={{ flexDirection: "row", gap: 8, justifyContent: "space-between" }}>
        <Button label="Zurück" variant="secondary" onPress={() => setI(Math.max(0, i - 1))} disabled={i === 0} />
        {i < exam.questions.length - 1 ? <Button label="Weiter" onPress={() => setI(i + 1)} /> : null}
        {!confirm ? <Button label="Abgeben" variant="danger" onPress={() => setConfirm(true)} /> : <Button label={`Wirklich abgeben (${exam.questions.length - answered} offen)`} variant="danger" onPress={() => void submit()} loading={busy} />}
      </View>
    </Screen>
  );
}
