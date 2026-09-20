import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";
import { login } from "./_auth.js";

// 100 Schüler versuchen gleichzeitig, dieselbe offene Fahrstunde zu buchen (RPC book_lesson über PostgREST).
export const options = { scenarios: { race: { executor: "per-vu-iterations", vus: 100, iterations: 1 } }, thresholds: { http_req_failed: ["rate<0.01"] } };
const booked = new Counter("bookings_succeeded");
const rejected = new Counter("bookings_rejected");

export function setup() { return { token: login() }; }

export default function ({ token }) {
  const res = http.post(`${__ENV.SUPABASE_URL}/rest/v1/rpc/book_lesson`, JSON.stringify({ p_lesson_id: __ENV.LESSON_ID, p_client_request_id: `${__VU}-${Date.now()}` }), { headers: { apikey: __ENV.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
  if (res.status === 200) booked.add(1); else if (res.status >= 400 && res.status < 500) rejected.add(1);
  check(res, { "kein Serverfehler": (r) => r.status < 500 });
}

export function handleSummary(data) {
  const ok = data.metrics.bookings_succeeded?.values.count ?? 0;
  return { stdout: `\nBuchungen erfolgreich: ${ok} (erwartet: 1), abgelehnt: ${data.metrics.bookings_rejected?.values.count ?? 0}\n` };
}
