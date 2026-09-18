import { createVerify, generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { dispatch } from "./dispatch";
import { EXPO_PUSH_URL, ExpoPushSender } from "./senders/expo";
import { FakeEmailSender, FakePushSender } from "./senders/fake";
import { FcmSender, buildServiceAccountJwt } from "./senders/fcm";
import { SmtpEmailSender } from "./senders/smtp";
import { chunk, type FetchLike, type PushMessage } from "./senders/types";

type Call = { url: string; init: Parameters<FetchLike>[1] };

function mockFetch(handler: (call: Call, index: number) => { status?: number; body: unknown }): { fetch: FetchLike; calls: Call[] } {
  const calls: Call[] = [];
  const fetch: FetchLike = async (url, init) => {
    const call = { url, init };
    calls.push(call);
    const res = handler(call, calls.length - 1);
    const status = res.status ?? 200;
    return { ok: status >= 200 && status < 300, status, json: async () => res.body, text: async () => (typeof res.body === "string" ? res.body : JSON.stringify(res.body)) };
  };
  return { fetch, calls };
}

describe("ExpoPushSender", () => {
  it("sendet in Blöcken zu 100 und meldet DeviceNotRegistered als ungültiges Token", async () => {
    const messages: PushMessage[] = Array.from({ length: 250 }, (_, i) => ({ token: `ExponentPushToken[${i}]`, title: "T", body: "B", data: { i } }));
    const { fetch, calls } = mockFetch((call) => {
      const batch = JSON.parse(call.init?.body ?? "[]") as { to: string }[];
      return { body: { data: batch.map((m) => (m.to === "ExponentPushToken[7]" ? { status: "error", message: "not registered", details: { error: "DeviceNotRegistered" } } : m.to === "ExponentPushToken[150]" ? { status: "error", message: "too big", details: { error: "MessageTooBig" } } : { status: "ok", id: "x" })) } };
    });
    const sender = new ExpoPushSender({ fetch, accessToken: "secret" });
    const result = await sender.send(messages);
    expect(calls).toHaveLength(3);
    expect(calls.map((c) => (JSON.parse(c.init?.body ?? "[]") as unknown[]).length)).toEqual([100, 100, 50]);
    expect(calls[0]?.url).toBe(EXPO_PUSH_URL);
    expect(calls[0]?.init?.headers?.authorization).toBe("Bearer secret");
    expect(result.delivered).toBe(248);
    expect(result.failures).toHaveLength(2);
    expect(result.invalidTokens).toEqual(["ExponentPushToken[7]"]);
    expect(result.failures.find((f) => f.token === "ExponentPushToken[150]")?.unregistered).toBe(false);
  });

  it("behandelt HTTP-Fehler und Netzwerkfehler je Block", async () => {
    const { fetch } = mockFetch(() => ({ status: 429, body: "rate limited" }));
    const result = await new ExpoPushSender({ fetch }).send([{ token: "a", title: "T", body: "B" }]);
    expect(result.delivered).toBe(0);
    expect(result.failures[0]?.error).toContain("HTTP 429");
    const failing: FetchLike = async () => { throw new Error("offline"); };
    const r2 = await new ExpoPushSender({ fetch: failing }).send([{ token: "a", title: "T", body: "B" }]);
    expect(r2.failures[0]?.error).toBe("offline");
    expect(chunk([], 100)).toEqual([]);
  });
});

describe("FcmSender", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const account = { project_id: "fahrpilot-test", client_email: "svc@fahrpilot-test.iam.gserviceaccount.com", private_key: privateKey.export({ type: "pkcs8", format: "pem" }).toString() };

  it("erzeugt ein gültig signiertes Service-Account-JWT", () => {
    const jwt = buildServiceAccountJwt(account, new Date("2026-09-18T10:00:00.000Z"));
    const [header, claims, signature] = jwt.split(".");
    expect(JSON.parse(Buffer.from(header ?? "", "base64url").toString())).toEqual({ alg: "RS256", typ: "JWT" });
    const payload = JSON.parse(Buffer.from(claims ?? "", "base64url").toString()) as Record<string, unknown>;
    expect(payload).toMatchObject({ iss: account.client_email, aud: "https://oauth2.googleapis.com/token", iat: 1789725600, exp: 1789729200 });
    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${header}.${claims}`);
    expect(verifier.verify(publicKey, Buffer.from(signature ?? "", "base64url"))).toBe(true);
  });

  it("holt ein Zugriffstoken, sendet Nachrichten und erkennt abgemeldete Tokens", async () => {
    const { fetch, calls } = mockFetch((call) => {
      if (call.url.includes("oauth2")) return { body: { access_token: "ya29.test", expires_in: 3600 } };
      const body = JSON.parse(call.init?.body ?? "{}") as { message: { token: string } };
      if (body.message.token === "gone") return { status: 404, body: { error: { status: "NOT_FOUND", details: [{ errorCode: "UNREGISTERED" }] } } };
      return { body: { name: "projects/fahrpilot-test/messages/1" } };
    });
    const sender = new FcmSender({ serviceAccount: account, fetch, now: () => new Date("2026-09-18T10:00:00.000Z") });
    const result = await sender.send([{ token: "ok", title: "T", body: "B", data: { lesson_id: "l1", n: 2 } }, { token: "gone", title: "T", body: "B" }]);
    expect(result.delivered).toBe(1);
    expect(result.invalidTokens).toEqual(["gone"]);
    expect(calls[0]?.url).toBe("https://oauth2.googleapis.com/token");
    expect(calls[1]?.url).toBe("https://fcm.googleapis.com/v1/projects/fahrpilot-test/messages:send");
    expect(calls[1]?.init?.headers?.authorization).toBe("Bearer ya29.test");
    expect(JSON.parse(calls[1]?.init?.body ?? "{}")).toMatchObject({ message: { token: "ok", notification: { title: "T", body: "B" }, data: { lesson_id: "l1", n: "2" } } });
    await sender.send([{ token: "ok", title: "T", body: "B" }]);
    expect(calls.filter((c) => c.url.includes("oauth2"))).toHaveLength(1);
  });

  it("verlangt einen vollständigen Service-Account", () => {
    expect(() => new FcmSender({ serviceAccount: { project_id: "", client_email: "", private_key: "" } })).toThrow();
  });
});

describe("SmtpEmailSender", () => {
  it("sendet über den injizierten Transport", async () => {
    const sent: unknown[] = [];
    const sender = new SmtpEmailSender({ host: "localhost", port: 25, from: "Fahrschule <noreply@example.org>" }, { sendMail: async (o) => { sent.push(o); return { messageId: "<1@example.org>" }; } });
    const result = await sender.send({ to: "max@example.org", subject: "Rechnung fällig", text: "Text" });
    expect(result).toEqual({ accepted: true, messageId: "<1@example.org>" });
    expect(sent[0]).toEqual({ from: "Fahrschule <noreply@example.org>", to: "max@example.org", subject: "Rechnung fällig", text: "Text" });
    const failing = new SmtpEmailSender({ host: "localhost", port: 25, from: "x@example.org" }, { sendMail: async () => { throw new Error("Verbindung abgelehnt"); } });
    expect(await failing.send({ to: "a@example.org", subject: "s", text: "t" })).toEqual({ accepted: false, error: "Verbindung abgelehnt" });
  });
});

describe("dispatch", () => {
  const notification = { id: "n1", user_id: "u1", type: "invoice_due" as const, title: "Rechnung fällig", body: "Text", data: { invoice_id: "inv_1" } };
  const tokens = [{ provider: "expo" as const, token: "ExponentPushToken[1]" }, { provider: "expo" as const, token: "ExponentPushToken[2]" }, { provider: "fcm" as const, token: "fcm-1" }];

  it("wählt Kanäle nach Präferenz und meldet ungültige Tokens", async () => {
    const push = new FakePushSender("expo");
    push.unregisteredTokens.add("ExponentPushToken[2]");
    const email = new FakeEmailSender();
    const result = await dispatch(notification, undefined, tokens, { push: [push], email }, { email: "max@example.org" });
    expect(result.channels).toEqual(["in_app", "push", "email"]);
    expect(result.push?.delivered).toBe(1);
    expect(result.invalidTokens).toEqual(["ExponentPushToken[2]"]);
    expect(result.skipped).toEqual([{ channel: "push", reason: "Kein Sender für Anbieter fcm" }]);
    expect(push.sent[0]?.data).toEqual({ invoice_id: "inv_1", notification_type: "invoice_due", notification_id: "n1" });
    expect(email.sent[0]).toEqual({ to: "max@example.org", subject: "Rechnung fällig", text: "Text" });
  });

  it("überspringt deaktivierte Kanäle und fehlende Adressen", async () => {
    const push = new FakePushSender("expo");
    const email = new FakeEmailSender();
    const result = await dispatch(notification, { invoice_due: { push: false } }, tokens, { push: [push], email }, {});
    expect(result.channels).toEqual(["in_app"]);
    expect(result.push).toBeNull();
    expect(push.sent).toHaveLength(0);
    expect(result.skipped).toEqual([{ channel: "push", reason: "Per Präferenz deaktiviert" }, { channel: "email", reason: "Keine E-Mail-Adresse" }]);
  });

  it("akzeptiert eine bereits aufgelöste Präferenz und meldet E-Mail-Fehler", async () => {
    const email = new FakeEmailSender();
    email.failNext = true;
    const result = await dispatch(notification, { push: false, email: true, in_app: false, quiet_hours: null }, [], { email }, { email: "max@example.org" });
    expect(result.channels).toEqual([]);
    expect(result.email).toEqual({ accepted: false, error: "Simulierter Fehler" });
  });
});
