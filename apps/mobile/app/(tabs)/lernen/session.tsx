import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Crypto from "expo-crypto";
import type { LearningMode } from "@fahrpilot/learning-engine";
import { useTheme } from "@/lib/theme";
import { loadQuestions, loadTopics } from "@/lib/content";
import { queueAttempt, queueSession, stateStore, syncService } from "@/lib/sync";
import { supabase } from "@/lib/supabase";
import { applyLocalReview, engineStates, evaluateAnswer, selectLocalQuestions } from "@/offline/local-learning";
import type { LocalQuestion, LocalQuestionState, LocalTopic } from "@/offline/types";
import { Button, Card, Loading, Screen, Txt } from "@/components/ui";

export default function Session() {
  const t = useTheme();
  const router = useRouter();
  const p = useLocalSearchParams<{ mode?: string; topic?: string; limit?: string }>();
  const mode = (p.mode ?? "review") as LearningMode;
  const [questions, setQuestions] = useState<LocalQuestion[] | null>(null);
  const [topics, setTopics] = useState<LocalTopic[]>([]);
  const [states, setStates] = useState<Map<string, LocalQuestionState>>(new Map());
  const [i, setI] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [numeric, setNumeric] = useState("");
  const [confidence, setConfidence] = useState<1 | 2 | 3 | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; state: LocalQuestionState } | null>(null);
  const [done, setDone] = useState<{ correct: number; wrong: number } | null>(null);
  const sessionId = useMemo(() => Crypto.randomUUID(), []);
  const startedAt = useRef(Date.now());
  const stats = useRef({ correct: 0, wrong: 0 });

  useEffect(() => {
    (async () => {
      const [pool, st, ts] = await Promise.all([loadQuestions(), stateStore.loadAll(), loadTopics()]);
      const limit = Math.min(50, Math.max(5, Number(p.limit ?? 10) || 10));
      const sel = selectLocalQuestions(pool, st, { mode, limit, ...(p.topic ? { topicId: p.topic } : {}) });
      setQuestions(sel); setStates(st); setTopics(ts);
      await queueSession({ client_session_id: sessionId, mode, topic_id: p.topic || null, ended: false });
    })();
  }, [mode, p.limit, p.topic, sessionId]);
  useEffect(() => { startedAt.current = Date.now(); }, [i]);

  if (!questions) return <Screen><Loading /></Screen>;
  if (questions.length === 0) return <Screen title="Keine Fragen"><Txt>Für diesen Modus gibt es aktuell keine Fragen.</Txt><Button label="Zurück" variant="secondary" onPress={() => router.back()} /></Screen>;
  const q = questions[i]!;
  const topicName = topics.find((x) => x.id === q.topic_id)?.name ?? "";
  const canSubmit = q.numeric_answer !== null ? numeric.trim() !== "" : selected.length > 0;

  async function check() {
    const num = q.numeric_answer !== null ? Number(numeric.replace(",", ".")) : null;
    const correct = evaluateAnswer(q, selected, num);
    const prev = states.get(q.id);
    const next = applyLocalReview(q.id, prev, { correct, confidence, responseMs: Date.now() - startedAt.current, points: q.points });
    const map = new Map(states); map.set(q.id, next); setStates(map);
    await stateStore.saveMany([next]);
    await queueAttempt({ client_attempt_id: Crypto.randomUUID(), client_session_id: sessionId, question_id: q.id, selected, numeric_answer: num, confidence, response_ms: Date.now() - startedAt.current, answered_at: new Date().toISOString() });
    stats.current[correct ? "correct" : "wrong"]++;
    setFeedback({ correct, state: next });
  }
  async function next() {
    if (i + 1 >= questions!.length) {
      await queueSession({ client_session_id: sessionId, mode, topic_id: p.topic || null, ended: true });
      void syncService.flush();
      setDone({ ...stats.current });
      return;
    }
    setI(i + 1); setSelected([]); setNumeric(""); setConfidence(null); setFeedback(null);
  }
  async function bookmark() {
    const prev = states.get(q.id);
    const next: LocalQuestionState = prev ? { ...prev, bookmarked: !prev.bookmarked } : { ...applyLocalReview(q.id, undefined, { correct: false, confidence: null, responseMs: null, points: q.points }), attempts: 0, correct: 0, mastery: 0, bookmarked: true };
    const map = new Map(states); map.set(q.id, next); setStates(map); await stateStore.saveMany([next]);
    await supabase.rpc("set_question_bookmark", { p_question_id: q.id, p_bookmarked: next.bookmarked }).then(() => undefined, () => undefined);
  }
  if (done) {
    const pct = Math.round((done.correct / questions.length) * 100);
    return <Screen title="Session abgeschlossen"><Card><Txt bold size={36}>{pct} %</Txt><Txt muted>{done.correct} richtig, {done.wrong} falsch. Ergebnisse werden mit dem Server abgeglichen.</Txt></Card><Button label="Noch eine Runde" onPress={() => router.replace({ pathname: "/(tabs)/lernen/session", params: { mode, topic: p.topic ?? "", limit: String(questions.length) } })} /><Button label="Zur Übersicht" variant="secondary" onPress={() => router.replace("/(tabs)/lernen")} /></Screen>;
  }
  const fb = feedback;
  return (
    <Screen>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Txt muted>Frage {i + 1} von {questions.length}</Txt><Txt muted>{topicName} · {q.points} Punkte</Txt></View>
      <Card>
        {q.source === "own" && <Txt muted size={12}>Übungsfrage (kein amtlicher Prüfungsinhalt)</Txt>}
        <Txt bold size={18}>{q.text}</Txt>
        {q.numeric_answer !== null ? (
          <View><TextInput accessibilityLabel="Antwort als Zahl" value={numeric} onChangeText={setNumeric} keyboardType="decimal-pad" editable={!fb} style={{ minHeight: 48, borderWidth: 1, borderColor: t.colors.border.default, borderRadius: 12, paddingHorizontal: 12, color: t.colors.text.primary, width: 160 }} />{fb && <Txt color={fb.correct ? t.colors.status.success.text : t.colors.status.danger.text}>{fb.correct ? "Richtig" : `Falsch. Richtige Antwort: ${q.numeric_answer}`}</Txt>}</View>
        ) : q.answers.map((a) => {
          const isSel = selected.includes(a.position);
          const bg = fb ? (a.is_correct ? t.colors.status.success.surface : isSel ? t.colors.status.danger.surface : t.colors.bg.surface) : isSel ? t.colors.accent.surface : t.colors.bg.surface;
          const border = fb ? (a.is_correct ? t.colors.status.success.fill : isSel ? t.colors.status.danger.fill : t.colors.border.subtle) : isSel ? t.colors.action.primary : t.colors.border.default;
          return (
            <Pressable key={a.position} accessibilityRole="checkbox" accessibilityState={{ checked: isSel }} disabled={!!fb} onPress={() => setSelected((s) => (s.includes(a.position) ? s.filter((x) => x !== a.position) : [...s, a.position]))} style={{ minHeight: 52, borderWidth: 2, borderColor: border, backgroundColor: bg, borderRadius: 12, padding: 12, gap: 4 }}>
              <Txt>{isSel ? "☑ " : "☐ "}{a.text}</Txt>
              {fb && a.explanation && <Txt muted size={13}>{a.explanation}</Txt>}
            </Pressable>
          );
        })}
        {!fb && <View style={{ flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" }}><Txt muted size={13}>Wie sicher bist du?</Txt>{([1, 2, 3] as const).map((c) => <Pressable key={c} accessibilityRole="button" onPress={() => setConfidence(c)} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: confidence === c ? t.colors.action.primary : t.colors.border.default, backgroundColor: confidence === c ? t.colors.accent.surface : "transparent" }}><Txt size={13}>{c === 1 ? "Unsicher" : c === 2 ? "Mittel" : "Sicher"}</Txt></Pressable>)}</View>}
      </Card>
      {fb && (
        <Card style={{ backgroundColor: fb.correct ? t.colors.status.success.surface : t.colors.status.danger.surface }}>
          <Txt bold>{fb.correct ? "Richtig!" : "Leider falsch."}</Txt>
          {q.explanation && <Txt>{q.explanation}</Txt>}
          {q.mnemonic && <Txt muted>Merksatz: {q.mnemonic}</Txt>}
          <Txt muted size={12}>{q.legal_reference ? `${q.legal_reference} · ` : ""}Nächste Wiederholung: {new Date(fb.state.due_at).toLocaleDateString("de-DE")}</Txt>
          <Button label={states.get(q.id)?.bookmarked ? "Markierung entfernen" : "Merken"} variant="ghost" onPress={() => void bookmark()} />
        </Card>
      )}
      {!fb ? <Button label="Antwort prüfen" onPress={() => void check()} disabled={!canSubmit} /> : <Button label={i + 1 >= questions.length ? "Abschließen" : "Weiter"} onPress={() => void next()} />}
    </Screen>
  );
}
