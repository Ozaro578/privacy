import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { recordAttempt, startLearningSession, finishLearningSession } from "@/lib/actions/learning";
import { getSession } from "@/lib/auth/session";
import { getBearerAuthFromRequest } from "@/lib/auth/bearer";
import { getStudentContext } from "@/lib/data/student";
import { loadStates } from "@/lib/data/learning";

/**
 * Offline-Sync der Mobile-App. Der Client sendet seine Warteschlange; der Server bewertet jeden Versuch selbst
 * (Spaced Repetition, XP, Serie, Abzeichen) und antwortet mit dem verbindlichen Zustand. Idempotent über client_*-Schlüssel.
 * Auth: Supabase-Session-Cookie (Schüler-Web) oder Authorization: Bearer <access_token> (Mobile-App).
 */
const Body = z.object({
  sessions: z.array(z.object({ client_session_id: z.string().uuid(), mode: z.string(), topic_id: z.string().uuid().nullable().default(null), ended: z.boolean().default(false), challenge: z.boolean().default(false) })).default([]),
  attempts: z.array(z.object({ client_attempt_id: z.string().uuid(), client_session_id: z.string().uuid(), question_id: z.string().uuid(), selected: z.array(z.number().int()).default([]), numeric_answer: z.number().nullable().default(null), confidence: z.union([z.literal(1), z.literal(2), z.literal(3)]).nullable().default(null), response_ms: z.number().int().nullable().default(null), answered_at: z.string() })).max(500).default([]),
  /** Zeitstempel des letzten bekannten Server-Zustands; Antwort enthält nur neuere Zustände */
  states_since: z.string().nullable().default(null),
});

export async function POST(request: NextRequest) {
  // Mobile-App: Authorization: Bearer <access_token>; Schüler-Web: Session-Cookie
  const bearer = await getBearerAuthFromRequest();
  const session = bearer ? bearer.session : await getSession();
  if (!session || session.role !== "student") return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten", issues: parsed.error.issues }, { status: 400 });
  const ctx = await getStudentContext();
  const sessionIds = new Map<string, string>();
  const results: Array<{ client_attempt_id: string; ok: boolean; correct?: boolean; error?: string }> = [];
  for (const s of parsed.data.sessions) {
    try {
      const started = await startLearningSession({ mode: s.mode as never, limit: 1, clientSessionId: s.client_session_id, challenge: s.challenge, ...(s.topic_id ? { topicId: s.topic_id } : {}) }).catch(async () => {
        const { data } = await ctx.db.from("learning_sessions").select("id").eq("student_id", ctx.student.id).eq("client_session_id", s.client_session_id).maybeSingle();
        return data ? { sessionId: data.id } : null;
      });
      if (started) sessionIds.set(s.client_session_id, started.sessionId);
    } catch { /* Session wird unten je Versuch nachgeschlagen */ }
  }
  const sorted = [...parsed.data.attempts].sort((a, b) => a.answered_at.localeCompare(b.answered_at));
  for (const a of sorted) {
    let sessionId = sessionIds.get(a.client_session_id);
    if (!sessionId) {
      const { data } = await ctx.db.from("learning_sessions").select("id").eq("student_id", ctx.student.id).eq("client_session_id", a.client_session_id).maybeSingle();
      if (!data) { const started = await startLearningSession({ mode: "random", limit: 1, clientSessionId: a.client_session_id }).catch(() => null); sessionId = started?.sessionId; } else sessionId = data.id;
      if (sessionId) sessionIds.set(a.client_session_id, sessionId);
    }
    if (!sessionId) { results.push({ client_attempt_id: a.client_attempt_id, ok: false, error: "Session unbekannt" }); continue; }
    try {
      const r = await recordAttempt({ sessionId, questionId: a.question_id, clientAttemptId: a.client_attempt_id, selected: a.selected, numericAnswer: a.numeric_answer, confidence: a.confidence, responseMs: a.response_ms });
      results.push({ client_attempt_id: a.client_attempt_id, ok: true, correct: r.correct });
    } catch (e) {
      results.push({ client_attempt_id: a.client_attempt_id, ok: false, error: e instanceof Error ? e.message : "Fehler" });
    }
  }
  for (const s of parsed.data.sessions.filter((x) => x.ended)) { const id = sessionIds.get(s.client_session_id); if (id) await finishLearningSession(id).catch(() => undefined); }
  const states = await loadStates(ctx.db, ctx.student.id);
  const since = parsed.data.states_since;
  const changed = [...states.entries()].filter(([, s]) => !since || (s.last_answered_at ?? "") > since).map(([question_id, s]) => ({ question_id, ...s }));
  const [{ data: streak }, { data: goal }] = await Promise.all([
    ctx.db.from("student_streaks").select("current_days, longest_days, total_xp, level, last_active_date").eq("student_id", ctx.student.id).maybeSingle(),
    ctx.db.from("daily_goals").select("answered, target_questions, achieved, challenge_done").eq("student_id", ctx.student.id).eq("goal_date", new Date().toLocaleDateString("en-CA", { timeZone: ctx.school.timezone })).maybeSingle(),
  ]);
  return NextResponse.json({ results, states: changed, streak, daily_goal: goal, server_time: new Date().toISOString() });
}
