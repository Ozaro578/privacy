import http from "k6/http";
import { check } from "k6";
import { login, authHeaders } from "./_auth.js";

// 200 Geräte synchronisieren gleichzeitig je 30 Antworten; erneutes Senden derselben Warteschlange darf keine Duplikate erzeugen.
export const options = { scenarios: { burst: { executor: "per-vu-iterations", vus: 200, iterations: 2 } }, thresholds: { http_req_failed: ["rate<0.01"], http_req_duration: ["p(95)<3000"] } };

export function setup() {
  const token = login();
  const pool = http.get(`${__ENV.SUPABASE_URL}/rest/v1/theory_questions?select=id&status=eq.published&limit=30`, { headers: { apikey: __ENV.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } }).json();
  return { token, ids: pool.map((q) => q.id) };
}

const uuid = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === "x" ? r : (r & 0x3) | 0x8).toString(16); });

export default function ({ token, ids }) {
  if (!__ENV.__queue) __ENV.__queue = "1";
  const sessionId = `00000000-0000-4000-8000-${String(__VU).padStart(12, "0")}`;
  const attempts = ids.map((id, i) => ({ client_attempt_id: `${sessionId.slice(0, 24)}${String(i).padStart(12, "0")}`, client_session_id: sessionId, question_id: id, selected_positions: [1], numeric_answer: null, confidence: 2, response_ms: 3000, answered_at: new Date(Date.now() - (30 - i) * 1000).toISOString() }));
  const res = http.post(`${__ENV.APP_URL}/api/sync`, JSON.stringify({ sessions: [{ client_session_id: sessionId, mode: "random", topic_id: null, ended: true }], attempts }), authHeaders(token));
  check(res, { "sync 200": (r) => r.status === 200, "alle Versuche bestätigt": (r) => r.status === 200 && r.json("results").length === attempts.length });
}
