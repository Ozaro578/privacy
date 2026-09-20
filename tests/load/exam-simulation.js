import http from "k6/http";
import { check, sleep } from "k6";
import { login, authHeaders } from "./_auth.js";

export const options = { scenarios: { students: { executor: "constant-vus", vus: 50, duration: "3m" } }, thresholds: { http_req_failed: ["rate<0.01"], "http_req_duration{name:start}": ["p(95)<1500"], "http_req_duration{name:submit}": ["p(95)<2500"] } };

export function setup() { return { token: login() }; }

export default function ({ token }) {
  const start = http.post(`${__ENV.APP_URL}/api/exam`, JSON.stringify({ action: "start" }), { ...authHeaders(token), tags: { name: "start" } });
  if (!check(start, { "start 200": (r) => r.status === 200 })) return;
  const sim = start.json();
  sleep(1 + Math.random() * 2);
  const answers = sim.questions.map((q) => ({ questionId: q.id, selected: q.numeric ? [] : [1], numericAnswer: q.numeric ? 0 : null, unsure: false, responseMs: 4000 }));
  const submit = http.post(`${__ENV.APP_URL}/api/exam`, JSON.stringify({ action: "submit", simulationId: sim.id, answers }), { ...authHeaders(token), tags: { name: "submit" } });
  check(submit, { "submit 200": (r) => r.status === 200 });
  sleep(2);
}
