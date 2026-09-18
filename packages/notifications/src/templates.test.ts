import { describe, expect, it } from "vitest";
import { render, resolveLocale } from "./templates";
import { LOCALES, NOTIFICATION_TYPES, type NotificationType, type TemplateParams } from "./types";

describe("render", () => {
  it("liefert die deutschen Beispieltexte", () => {
    expect(render("lesson_reminder_24h", { time: "10:30" }, "de").body).toBe("Morgen um 10:30 Uhr hast du eine Fahrstunde.");
    expect(render("lesson_reminder_2h", { time: "10:30" }, "de").body).toBe("Deine Fahrstunde beginnt in 2 Stunden.");
    expect(render("earlier_slot_available", {}, "de").body).toBe("Eine frühere Fahrstunde ist verfügbar.");
    expect(render("learn_reminder", {}, "de").body).toBe("Du hast heute noch nicht gelernt.");
    expect(render("exam_countdown", { days: 5, kind: "theory" }, "de").body).toBe("Deine Theorieprüfung ist in 5 Tagen.");
    expect(render("vehicle_inspection_due", { licensePlate: "B-FS 1234", days: 30 }, "de").body).toBe("HU in 30 Tagen fällig.");
  });

  it("ergänzt optionale Angaben", () => {
    expect(render("lesson_reminder_24h", { time: "10:30", instructorName: "Anna", meetingPoint: "Fahrschule" }, "de").body).toBe("Morgen um 10:30 Uhr hast du eine Fahrstunde. Fahrlehrer: Anna. Treffpunkt: Fahrschule.");
    expect(render("exam_countdown", { days: 1, kind: "practical" }, "de").body).toBe("Deine praktische Prüfung ist morgen.");
    expect(render("vehicle_service_due", { licensePlate: "B-FS 1", days: 7, dueDate: "25.09.2026" }, "de").body).toBe("Wartung in 7 Tagen fällig (25.09.2026).");
  });

  it("übersetzt in en, tr und ar", () => {
    expect(render("lesson_reminder_24h", { time: "10:30" }, "en").body).toBe("You have a driving lesson tomorrow at 10:30.");
    expect(render("learn_reminder", {}, "en").body).toBe("You have not studied yet today.");
    expect(render("lesson_reminder_24h", { time: "10:30" }, "tr").body).toBe("Yarın saat 10:30'de direksiyon dersin var.");
    expect(render("exam_countdown", { days: 5, kind: "theory" }, "tr").body).toBe("Teori sınavın 5 gün sonra.");
    expect(render("lesson_reminder_2h", { time: "10:30" }, "ar").body).toBe("يبدأ درس القيادة بعد ساعتين.");
    expect(render("exam_countdown", { days: 5, kind: "theory" }, "ar").body).toBe("اختبار النظري بعد 5 أيام.");
  });

  const samples: { [T in NotificationType]: TemplateParams<T> } = {
    lesson_reminder_24h: { time: "10:30" },
    lesson_reminder_2h: { time: "10:30" },
    earlier_slot_available: { date: "19.09.2026", time: "09:00" },
    learn_reminder: {},
    exam_countdown: { days: 3, kind: "practical" },
    invoice_due: { invoiceNumber: "RE-2026-00042", amount: "120,00 €", dueDate: "02.10.2026" },
    message_received: { senderName: "Anna" },
    waitlist_offer: { date: "19.09.2026", time: "09:00" },
    document_missing: { documentName: "Sehtest" },
    lesson_cancelled: { date: "19.09.2026", time: "09:00" },
    theory_class_reminder: { title: "G1", time: "18:00" },
    vehicle_inspection_due: { licensePlate: "B-FS 1", days: 14 },
    vehicle_service_due: { licensePlate: "B-FS 1", days: 14 },
  };

  it("hat für jeden Typ in jeder Sprache Titel und Text ohne Platzhalterreste", () => {
    for (const type of NOTIFICATION_TYPES) {
      for (const locale of LOCALES) {
        const text = render(type, samples[type] as never, locale);
        expect(text.title.length, `${type}/${locale} title`).toBeGreaterThan(0);
        expect(text.body.length, `${type}/${locale} body`).toBeGreaterThan(0);
        expect(text.body).not.toMatch(/undefined|null|\$\{/);
        expect(text.title).not.toMatch(/undefined|null|\$\{/);
      }
    }
  });

  it("fällt bei unbekannter Sprache auf Deutsch zurück", () => {
    expect(resolveLocale("en-US")).toBe("en");
    expect(resolveLocale("tr_TR")).toBe("tr");
    expect(resolveLocale("fr")).toBe("de");
    expect(resolveLocale(null)).toBe("de");
    expect(render("learn_reminder", {}, "fr-FR").body).toBe("Du hast heute noch nicht gelernt.");
  });
});
