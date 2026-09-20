import http from "k6/http";
import { check } from "k6";

/** Meldet einen Testschüler per Passwort an und liefert das Access-Token (Supabase Auth REST). */
export function login() {
  const res = http.post(`${__ENV.SUPABASE_URL}/auth/v1/token?grant_type=password`, JSON.stringify({ email: __ENV.LOAD_EMAIL, password: __ENV.LOAD_PASSWORD }), { headers: { apikey: __ENV.SUPABASE_ANON_KEY, "Content-Type": "application/json" } });
  check(res, { "login ok": (r) => r.status === 200 });
  return res.json("access_token");
}
export const authHeaders = (token) => ({ headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
