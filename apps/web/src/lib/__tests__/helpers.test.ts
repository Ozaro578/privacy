import { describe, expect, it } from "vitest";
import { parseRange, bandLabel, bandColor } from "@/components/ui";

describe("parseRange", () => {
  it("zerlegt tstzrange-Text in Start und Ende", () => {
    const r = parseRange('["2026-09-14 10:00:00+00","2026-09-14 10:45:00+00")');
    expect(r.start).toBe("2026-09-14 10:00:00+00");
    expect(r.end).toBe("2026-09-14 10:45:00+00");
  });
  it("kommt mit unquoted Werten zurecht", () => {
    const r = parseRange("[2026-09-14T10:00:00+00:00,2026-09-14T10:45:00+00:00)");
    expect(r.start).toBe("2026-09-14T10:00:00+00:00");
  });
});

describe("Prüfungsreife-Bänder", () => {
  it("entsprechen der Spezifikation", () => {
    expect(bandLabel(39)).toBe("Noch nicht prüfungsbereit");
    expect(bandLabel(40)).toBe("Auf gutem Weg");
    expect(bandLabel(70)).toBe("Fast bereit");
    expect(bandLabel(85)).toBe("Sehr gute Vorbereitung");
    expect(bandColor(10)).toBe("bg-band-red");
  });
});
