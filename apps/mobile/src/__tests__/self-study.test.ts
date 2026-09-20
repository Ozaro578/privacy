import { describe, expect, it } from "vitest";
import { normalizeDate, selfStudyPayload, validateSelfStudy, type SelfStudyForm } from "../lib/self-study";

const ok: SelfStudyForm = { first_name: "Lisa", last_name: "Beispiel", email: "Lisa@Example.de", password: "geheim123", date_of_birth: "04.05.2008", transmission: "automatic", consent_privacy: true, consent_terms: true };
const now = new Date("2026-09-20T12:00:00Z");

describe("Selbstlern-Registrierung", () => {
  it("akzeptiert ein vollständiges Formular", () => {
    expect(validateSelfStudy(ok, now)).toEqual({});
  });
  it("normalisiert deutsche und ISO-Daten und lehnt unmögliche Daten ab", () => {
    expect(normalizeDate("4.5.2008")).toBe("2008-05-04");
    expect(normalizeDate("2008-05-04")).toBe("2008-05-04");
    expect(normalizeDate("31.02.2008")).toBeNull();
    expect(normalizeDate("morgen")).toBeNull();
  });
  it("meldet fehlende Einwilligungen, kurzes Passwort und zu junges Alter", () => {
    const e = validateSelfStudy({ ...ok, password: "kurz", consent_terms: false, date_of_birth: "01.01.2014" }, now);
    expect(e.password).toMatch(/8 Zeichen/);
    expect(e.consent_terms).toMatch(/Nutzungsbedingungen/);
    expect(e.date_of_birth).toMatch(/14 Jahre/);
    expect(e.first_name).toBeUndefined();
  });
  it("baut den Payload ohne Passwort, mit Klasse B und normalisierter E-Mail", () => {
    const p = selfStudyPayload(ok);
    expect(p).not.toHaveProperty("password");
    expect(p["email"]).toBe("lisa@example.de");
    expect(p["date_of_birth"]).toBe("2008-05-04");
    expect(p["license_code"]).toBe("B");
    expect(p["channel"]).toBe("app");
  });
});
