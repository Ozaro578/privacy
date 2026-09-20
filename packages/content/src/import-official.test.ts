import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { hashFromSourceNote, planImport, questionContentHash, sourceNoteFor, validateOfficialCatalog } from "./import-official";

const sample = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "scripts", "fixtures", "official-sample.json"), "utf8")) as Record<string, unknown>;
const clone = () => JSON.parse(JSON.stringify(sample)) as { questions: Array<Record<string, unknown>> } & Record<string, unknown>;

describe("Import amtlicher Katalog: Validierung", () => {
  it("akzeptiert die Beispiel-Lieferung", () => {
    const { catalog, problems } = validateOfficialCatalog(sample);
    expect(problems).toEqual([]);
    expect(catalog?.questions).toHaveLength(3);
  });
  it("erkennt doppelte Fragenummern, fehlende richtige Antworten und Videofragen ohne Video", () => {
    const c = clone();
    c.questions[1]!["external_ref"] = "TEST-1.0.01-001";
    c.questions[0]!["answers"] = [{ text: "a", correct: false }, { text: "b", correct: false }];
    c.questions[1]!["media"] = { file: "x.png", kind: "image", alt: "Bild statt Video" };
    const { problems } = validateOfficialCatalog(c);
    expect(problems.some((p) => p.includes("doppelt"))).toBe(true);
    expect(problems.some((p) => p.includes("keine richtige Antwort"))).toBe(true);
    expect(problems.some((p) => p.includes("Videofrage ohne Video"))).toBe(true);
  });
  it("lehnt unbekannte Themen und Pfade in Dateinamen ab", () => {
    const c = clone();
    c.questions[0]!["topic"] = "unbekannt";
    c.questions[0]!["media"] = { file: "../x.png", kind: "image", alt: "Pfad" };
    const { catalog, problems } = validateOfficialCatalog(c);
    expect(catalog).toBeNull();
    expect(problems.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Import amtlicher Katalog: Änderungserkennung", () => {
  it("plant neu, geändert und unverändert und findet nicht gelieferte Fragen", () => {
    const { catalog } = validateOfficialCatalog(sample);
    const q0 = catalog!.questions[0]!;
    const existing = new Map<string, string | null>([
      [q0.external_ref, questionContentHash(q0)],
      ["TEST-1.0.02-002", "0000000000000000000000000000abcd"],
      ["TEST-ALT-999", "ffffffffffffffffffffffffffffffff"],
    ]);
    const plan = planImport(catalog!, existing);
    expect(plan.rows.find((r) => r.external_ref === q0.external_ref)?.action).toBe("unchanged");
    expect(plan.rows.find((r) => r.external_ref === "TEST-1.0.02-002")?.action).toBe("new_version");
    expect(plan.rows.find((r) => r.external_ref === "TEST-1.0.03-003")?.action).toBe("insert");
    expect(plan.missing).toEqual(["TEST-ALT-999"]);
  });
  it("ändert den Hash bei geändertem Antworttext, nicht bei gleicher Reihenfolge der Klassen", () => {
    const { catalog } = validateOfficialCatalog(sample);
    const q = catalog!.questions[0]!;
    const h1 = questionContentHash(q);
    expect(questionContentHash({ ...q, license_codes: ["B197", "B"] })).toBe(questionContentHash({ ...q, license_codes: ["B", "B197"] }));
    expect(questionContentHash({ ...q, answers: [{ ...q.answers[0]!, text: "Anders" }, q.answers[1]!] })).not.toBe(h1);
  });
  it("legt den Hash in der Quellnotiz ab und liest ihn wieder", () => {
    const note = sourceNoteFor("LIZ-1", "0123456789abcdef0123456789abcdef", "Amtlich");
    expect(hashFromSourceNote(note)).toBe("0123456789abcdef0123456789abcdef");
    expect(hashFromSourceNote("Eigene Übungsfrage")).toBeNull();
  });
});
