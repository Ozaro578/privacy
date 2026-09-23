import { describe, expect, it } from "vitest";
import { safeNextPath } from "../auth/safe-redirect";

describe("safeNextPath", () => {
  it("lässt relative Pfade durch", () => {
    expect(safeNextPath("/heute")).toBe("/heute");
    expect(safeNextPath("/lernen?modus=signs")).toBe("/lernen?modus=signs");
  });
  it("blockiert fremde Ziele", () => {
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("/\\evil.example")).toBe("/");
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("heute")).toBe("/");
    expect(safeNextPath("/\u0009/evil.example")).toBe("/");
    expect(safeNextPath(null, "/login")).toBe("/login");
  });
});
