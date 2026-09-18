import { describe, expect, it, vi } from "vitest";
import {
  MESSAGES,
  SUPPORTED_LOCALES,
  TRANSLATION_NOTICE,
  createI18n,
  createT,
  flattenKeys,
  formatCurrency,
  formatDate,
  formatNumber,
  formatTime,
  interpolate,
  isLocale,
  isRtl,
  textDirection,
  type Messages
} from "./index";

describe("Kataloge", () => {
  const deKeys = flattenKeys(MESSAGES.de);

  it("hat mindestens 250 Schlüssel in der Quelle de", () => {
    expect(deKeys.length).toBeGreaterThanOrEqual(250);
  });

  it.each(SUPPORTED_LOCALES)("Locale %s hat exakt dieselbe Schlüsselmenge wie de", (locale) => {
    expect(flattenKeys(MESSAGES[locale])).toEqual(deKeys);
  });

  it.each(SUPPORTED_LOCALES)("Locale %s hat keine leeren Texte und keine Gedankenstriche", (locale) => {
    const t = createT(locale);
    for (const key of deKeys) {
      const value = t(key as Parameters<typeof t>[0], {});
      expect(value.trim().length, key).toBeGreaterThan(0);
      expect(value, key).not.toMatch(/[\u2013\u2014]/);
    }
  });

  it.each(SUPPORTED_LOCALES)("Locale %s verwendet dieselben Platzhalter wie de", (locale) => {
    const placeholders = (text: string) => [...text.matchAll(/\{([a-zA-Z]+)(?:,|\})/g)].map((m) => m[1]).sort();
    const source = MESSAGES.de;
    const target = MESSAGES[locale];
    const read = (messages: Messages, key: string) =>
      key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], messages) as string;
    for (const key of deKeys) {
      expect(placeholders(read(target, key)), `${locale}: ${key}`).toEqual(placeholders(read(source, key)));
    }
  });

  it("enthält die Prüfungsreife-Bänder und Pflicht-Disclaimer", () => {
    const t = createT("de");
    expect(t("dashboard.readinessBandRed")).toBe("Noch nicht prüfungsbereit");
    expect(t("dashboard.readinessBandOrange")).toBe("Auf gutem Weg");
    expect(t("dashboard.readinessBandYellowGreen")).toBe("Fast bereit");
    expect(t("dashboard.readinessBandGreen")).toBe("Sehr gute Vorbereitung");
    expect(t("dashboard.readinessDisclaimer")).toContain("keine Garantie");
    expect(t("finance.forecastDisclaimer")).toContain("Schätzung");
    expect(t("learn.photoTrainerDisclaimer")).toContain("niemals während der Fahrt");
    expect(t("common.legalStatus", { date: "01.01.2026" })).toBe("Rechtsstand: 01.01.2026");
    expect(TRANSLATION_NOTICE).toContain("exam_languages");
  });

  it("arabischer Katalog enthält arabische Schrift", () => {
    expect(MESSAGES.ar.nav.learn).toMatch(/[\u0600-\u06FF]/);
    expect(MESSAGES.ar.common.save).toMatch(/[\u0600-\u06FF]/);
  });
});

describe("Interpolation und Plural", () => {
  it("ersetzt benannte Platzhalter", () => {
    const t = createT("de");
    expect(t("dashboard.greeting", { name: "Ayşe" })).toBe("Hallo Ayşe");
    expect(t("dashboard.nextLessonAt", { date: "14.09.2026", time: "14:30" })).toBe("14.09.2026 um 14:30");
  });

  it("lässt unbekannte Platzhalter sichtbar stehen", () => {
    expect(interpolate("de", "Hallo {name}", {})).toBe("Hallo {name}");
  });

  it("wählt Pluralformen über Intl.PluralRules", () => {
    const de = createT("de");
    expect(de("learn.questions", { count: 1 })).toBe("1 Frage");
    expect(de("learn.questions", { count: 5 })).toBe("5 Fragen");
    const en = createT("en");
    expect(en("learn.questions", { count: 1 })).toBe("1 question");
    expect(en("learn.questions", { count: 0 })).toBe("0 questions");
    const tr = createT("tr");
    expect(tr("learn.questions", { count: 3 })).toContain("3");
  });

  it("unterstützt arabische Pluralkategorien zero, one, two, few, many, other", () => {
    const ar = createT("ar");
    const forms = [0, 1, 2, 3, 11, 100].map((count) => ar("learn.questions", { count }));
    expect(new Set(forms).size).toBe(6);
    expect(forms[3]).toContain("3");
  });

  it("unterstützt exakte Formen mit =n", () => {
    expect(interpolate("de", "{count, plural, =0 {Keine} one {Eine} other {# Stück}}", { count: 0 })).toBe("Keine");
    expect(interpolate("de", "{count, plural, =0 {Keine} one {Eine} other {# Stück}}", { count: 4 })).toBe("4 Stück");
  });
});

describe("Fallback", () => {
  it("fällt bei fehlendem Schlüssel auf de zurück und meldet dies", () => {
    const onMissingKey = vi.fn();
    const partial = JSON.parse(JSON.stringify(MESSAGES.en)) as Messages;
    delete (partial.common as Record<string, unknown>)["save"];
    const t = createT("en", { catalogs: { en: partial }, onMissingKey });
    expect(t("common.save")).toBe("Speichern");
    expect(onMissingKey).toHaveBeenCalledWith("en", "common.save");
    expect(t("common.cancel")).toBe("Cancel");
    expect(onMissingKey).toHaveBeenCalledTimes(1);
  });

  it("warnt in Entwicklung über console.warn", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const partial = JSON.parse(JSON.stringify(MESSAGES.tr)) as Messages;
    delete (partial.nav as Record<string, unknown>)["today"];
    const t = createT("tr", { catalogs: { tr: partial } });
    expect(t("nav.today")).toBe("Heute");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain("nav.today");
    warn.mockRestore();
  });
});

describe("Richtung und Locale", () => {
  it("erkennt RTL nur für ar", () => {
    expect(isRtl("ar")).toBe(true);
    expect(isRtl("de")).toBe(false);
    expect(isRtl("en")).toBe(false);
    expect(isRtl("tr")).toBe(false);
    expect(textDirection("ar")).toBe("rtl");
    expect(textDirection("de")).toBe("ltr");
  });

  it("validiert Locale-Strings", () => {
    expect(isLocale("de")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(42)).toBe(false);
  });
});

describe("Formatierung in Europe/Berlin", () => {
  const instant = new Date("2026-09-14T12:30:00Z");

  it("formatiert Datum je Locale", () => {
    expect(formatDate("de", instant)).toBe("14.09.2026");
    expect(formatDate("en", instant)).toBe("14/09/2026");
    expect(formatDate("tr", instant)).toBe("14.09.2026");
    expect(formatDate("ar", instant)).toMatch(/14.*09.*2026/);
  });

  it("formatiert Uhrzeit in Sommerzeit als 14:30", () => {
    expect(formatTime("de", instant)).toBe("14:30");
    expect(formatTime("en", instant)).toBe("14:30");
  });

  it("formatiert Uhrzeit in Winterzeit als 13:30", () => {
    expect(formatTime("de", new Date("2026-01-14T12:30:00Z"))).toBe("13:30");
  });

  it("formatiert Währung in EUR", () => {
    expect(formatCurrency("de", 1234.5).replace(/\u00a0/g, " ")).toBe("1.234,50 €");
    expect(formatCurrency("en", 1234.5)).toBe("€1,234.50");
  });

  it("formatiert Zahlen", () => {
    expect(formatNumber("de", 1234567.891)).toBe("1.234.567,891");
    expect(formatNumber("ar", 12)).toBe("12");
  });

  it("bündelt alles in createI18n", () => {
    const i18n = createI18n("ar");
    expect(i18n.dir).toBe("rtl");
    expect(i18n.formatCents(1999)).toContain("19");
    expect(i18n.t("nav.today")).toBe(MESSAGES.ar.nav.today);
  });
});
