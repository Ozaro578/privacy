import type { Locale, NotificationType, RenderedText, TemplateParams, TemplateParamsByType } from "./types";
import { DEFAULT_LOCALE, LOCALES } from "./types";

type Template<T extends NotificationType> = (p: TemplateParamsByType[T]) => RenderedText;
type TemplateSet = { [T in NotificationType]: Template<T> };

const examKindDe = (k: "theory" | "practical"): string => (k === "theory" ? "Theorieprüfung" : "praktische Prüfung");
const examKindEn = (k: "theory" | "practical"): string => (k === "theory" ? "theory test" : "practical test");
const examKindTr = (k: "theory" | "practical"): string => (k === "theory" ? "Teori sınavın" : "Direksiyon sınavın");
const examKindAr = (k: "theory" | "practical"): string => (k === "theory" ? "اختبار النظري" : "اختبار القيادة العملي");

const where = (meetingPoint: string | undefined, label: string): string => (meetingPoint ? ` ${label}: ${meetingPoint}.` : "");

const de: TemplateSet = {
  lesson_reminder_24h: (p) => ({
    title: "Fahrstunde morgen",
    body: `Morgen um ${p.time} Uhr hast du eine Fahrstunde.${p.instructorName ? ` Fahrlehrer: ${p.instructorName}.` : ""}${where(p.meetingPoint, "Treffpunkt")}`,
  }),
  lesson_reminder_2h: (p) => ({ title: "Fahrstunde in 2 Stunden", body: `Deine Fahrstunde beginnt in 2 Stunden.${where(p.meetingPoint, "Treffpunkt")}` }),
  earlier_slot_available: (p) => ({
    title: "Früherer Termin frei",
    body: `Eine frühere Fahrstunde ist verfügbar.${p.date && p.time ? ` ${p.date} um ${p.time} Uhr.` : ""}`,
  }),
  learn_reminder: () => ({ title: "Lernerinnerung", body: "Du hast heute noch nicht gelernt." }),
  exam_countdown: (p) => ({
    title: p.kind === "theory" ? "Theorieprüfung" : "Praktische Prüfung",
    body: p.days === 1 ? `Deine ${examKindDe(p.kind)} ist morgen.` : `Deine ${examKindDe(p.kind)} ist in ${p.days} Tagen.`,
  }),
  invoice_due: (p) => ({ title: "Rechnung fällig", body: `Die Rechnung ${p.invoiceNumber} über ${p.amount} ist am ${p.dueDate} fällig.` }),
  message_received: (p) => ({ title: `Neue Nachricht von ${p.senderName}`, body: p.preview ?? "Du hast eine neue Nachricht erhalten." }),
  waitlist_offer: (p) => ({ title: "Termin von der Warteliste", body: `Ein Termin am ${p.date} um ${p.time} Uhr ist frei geworden. Bitte bestätige ihn in der App.` }),
  document_missing: (p) => ({ title: "Dokument fehlt", body: `Bitte reiche noch das Dokument „${p.documentName}“ ein.` }),
  lesson_cancelled: (p) => ({ title: "Fahrstunde abgesagt", body: `Deine Fahrstunde am ${p.date} um ${p.time} Uhr wurde abgesagt.${p.reason ? ` Grund: ${p.reason}.` : ""}` }),
  theory_class_reminder: (p) => ({ title: "Theorieunterricht", body: `${p.date ? `Am ${p.date} um` : "Um"} ${p.time} Uhr findet der Theorieunterricht „${p.title}“ statt.` }),
  vehicle_inspection_due: (p) => ({ title: `HU fällig: ${p.licensePlate}`, body: `HU in ${p.days} Tagen fällig${p.dueDate ? ` (${p.dueDate})` : ""}.` }),
  vehicle_service_due: (p) => ({ title: `Wartung fällig: ${p.licensePlate}`, body: `Wartung in ${p.days} Tagen fällig${p.dueDate ? ` (${p.dueDate})` : ""}.` }),
};

const en: TemplateSet = {
  lesson_reminder_24h: (p) => ({
    title: "Driving lesson tomorrow",
    body: `You have a driving lesson tomorrow at ${p.time}.${p.instructorName ? ` Instructor: ${p.instructorName}.` : ""}${where(p.meetingPoint, "Meeting point")}`,
  }),
  lesson_reminder_2h: (p) => ({ title: "Driving lesson in 2 hours", body: `Your driving lesson starts in 2 hours.${where(p.meetingPoint, "Meeting point")}` }),
  earlier_slot_available: (p) => ({ title: "Earlier slot available", body: `An earlier driving lesson is available.${p.date && p.time ? ` ${p.date} at ${p.time}.` : ""}` }),
  learn_reminder: () => ({ title: "Study reminder", body: "You have not studied yet today." }),
  exam_countdown: (p) => ({
    title: p.kind === "theory" ? "Theory test" : "Practical test",
    body: p.days === 1 ? `Your ${examKindEn(p.kind)} is tomorrow.` : `Your ${examKindEn(p.kind)} is in ${p.days} days.`,
  }),
  invoice_due: (p) => ({ title: "Invoice due", body: `Invoice ${p.invoiceNumber} for ${p.amount} is due on ${p.dueDate}.` }),
  message_received: (p) => ({ title: `New message from ${p.senderName}`, body: p.preview ?? "You have received a new message." }),
  waitlist_offer: (p) => ({ title: "Slot from the waiting list", body: `A slot on ${p.date} at ${p.time} has become available. Please confirm it in the app.` }),
  document_missing: (p) => ({ title: "Document missing", body: `Please submit the document "${p.documentName}".` }),
  lesson_cancelled: (p) => ({ title: "Driving lesson cancelled", body: `Your driving lesson on ${p.date} at ${p.time} has been cancelled.${p.reason ? ` Reason: ${p.reason}.` : ""}` }),
  theory_class_reminder: (p) => ({ title: "Theory class", body: `The theory class "${p.title}" takes place ${p.date ? `on ${p.date} ` : ""}at ${p.time}.` }),
  vehicle_inspection_due: (p) => ({ title: `Inspection due: ${p.licensePlate}`, body: `Vehicle inspection (HU) due in ${p.days} days${p.dueDate ? ` (${p.dueDate})` : ""}.` }),
  vehicle_service_due: (p) => ({ title: `Service due: ${p.licensePlate}`, body: `Service due in ${p.days} days${p.dueDate ? ` (${p.dueDate})` : ""}.` }),
};

const tr: TemplateSet = {
  lesson_reminder_24h: (p) => ({
    title: "Yarın direksiyon dersin var",
    body: `Yarın saat ${p.time}'de direksiyon dersin var.${p.instructorName ? ` Eğitmen: ${p.instructorName}.` : ""}${where(p.meetingPoint, "Buluşma noktası")}`,
  }),
  lesson_reminder_2h: (p) => ({ title: "2 saat sonra direksiyon dersi", body: `Direksiyon dersin 2 saat sonra başlıyor.${where(p.meetingPoint, "Buluşma noktası")}` }),
  earlier_slot_available: (p) => ({ title: "Daha erken bir saat boşaldı", body: `Daha erken bir direksiyon dersi mevcut.${p.date && p.time ? ` ${p.date}, saat ${p.time}.` : ""}` }),
  learn_reminder: () => ({ title: "Çalışma hatırlatması", body: "Bugün henüz çalışmadın." }),
  exam_countdown: (p) => ({
    title: p.kind === "theory" ? "Teori sınavı" : "Direksiyon sınavı",
    body: p.days === 1 ? `${examKindTr(p.kind)} yarın.` : `${examKindTr(p.kind)} ${p.days} gün sonra.`,
  }),
  invoice_due: (p) => ({ title: "Fatura vadesi", body: `${p.amount} tutarındaki ${p.invoiceNumber} numaralı faturanın son ödeme tarihi ${p.dueDate}.` }),
  message_received: (p) => ({ title: `${p.senderName} yeni mesaj gönderdi`, body: p.preview ?? "Yeni bir mesaj aldın." }),
  waitlist_offer: (p) => ({ title: "Bekleme listesinden randevu", body: `${p.date}, saat ${p.time} için bir randevu boşaldı. Lütfen uygulamada onayla.` }),
  document_missing: (p) => ({ title: "Belge eksik", body: `Lütfen "${p.documentName}" belgesini teslim et.` }),
  lesson_cancelled: (p) => ({ title: "Direksiyon dersi iptal edildi", body: `${p.date}, saat ${p.time} için olan direksiyon dersin iptal edildi.${p.reason ? ` Sebep: ${p.reason}.` : ""}` }),
  theory_class_reminder: (p) => ({ title: "Teori dersi", body: `"${p.title}" teori dersi ${p.date ? `${p.date}, ` : ""}saat ${p.time}'de yapılacak.` }),
  vehicle_inspection_due: (p) => ({ title: `Muayene zamanı: ${p.licensePlate}`, body: `Araç muayenesi (HU) ${p.days} gün içinde${p.dueDate ? ` (${p.dueDate})` : ""}.` }),
  vehicle_service_due: (p) => ({ title: `Bakım zamanı: ${p.licensePlate}`, body: `Bakım ${p.days} gün içinde${p.dueDate ? ` (${p.dueDate})` : ""}.` }),
};

const ar: TemplateSet = {
  lesson_reminder_24h: (p) => ({
    title: "درس قيادة غدًا",
    body: `لديك درس قيادة غدًا في الساعة ${p.time}.${p.instructorName ? ` المدرب: ${p.instructorName}.` : ""}${where(p.meetingPoint, "نقطة اللقاء")}`,
  }),
  lesson_reminder_2h: (p) => ({ title: "درس قيادة بعد ساعتين", body: `يبدأ درس القيادة بعد ساعتين.${where(p.meetingPoint, "نقطة اللقاء")}` }),
  earlier_slot_available: (p) => ({ title: "موعد أبكر متاح", body: `يتوفر درس قيادة في موعد أبكر.${p.date && p.time ? ` ${p.date} في الساعة ${p.time}.` : ""}` }),
  learn_reminder: () => ({ title: "تذكير بالتعلم", body: "لم تتعلم اليوم بعد." }),
  exam_countdown: (p) => ({
    title: p.kind === "theory" ? "الاختبار النظري" : "الاختبار العملي",
    body: p.days === 1 ? `${examKindAr(p.kind)} غدًا.` : `${examKindAr(p.kind)} بعد ${p.days} أيام.`,
  }),
  invoice_due: (p) => ({ title: "فاتورة مستحقة", body: `الفاتورة ${p.invoiceNumber} بمبلغ ${p.amount} مستحقة بتاريخ ${p.dueDate}.` }),
  message_received: (p) => ({ title: `رسالة جديدة من ${p.senderName}`, body: p.preview ?? "لقد تلقيت رسالة جديدة." }),
  waitlist_offer: (p) => ({ title: "موعد من قائمة الانتظار", body: `أصبح هناك موعد متاح بتاريخ ${p.date} في الساعة ${p.time}. يرجى تأكيده في التطبيق.` }),
  document_missing: (p) => ({ title: "مستند ناقص", body: `يرجى تقديم المستند "${p.documentName}".` }),
  lesson_cancelled: (p) => ({ title: "تم إلغاء درس القيادة", body: `تم إلغاء درس القيادة بتاريخ ${p.date} في الساعة ${p.time}.${p.reason ? ` السبب: ${p.reason}.` : ""}` }),
  theory_class_reminder: (p) => ({ title: "درس نظري", body: `يُعقد الدرس النظري "${p.title}" ${p.date ? `بتاريخ ${p.date} ` : ""}في الساعة ${p.time}.` }),
  vehicle_inspection_due: (p) => ({ title: `فحص المركبة مستحق: ${p.licensePlate}`, body: `الفحص الفني (HU) مستحق خلال ${p.days} يومًا${p.dueDate ? ` (${p.dueDate})` : ""}.` }),
  vehicle_service_due: (p) => ({ title: `صيانة مستحقة: ${p.licensePlate}`, body: `الصيانة مستحقة خلال ${p.days} يومًا${p.dueDate ? ` (${p.dueDate})` : ""}.` }),
};

const TEMPLATES: Record<Locale, TemplateSet> = { de, en, tr, ar };

/** Sprache aus einem BCP-47-Tag oder Null ermitteln, Rückfall auf Deutsch. */
export function resolveLocale(tag: string | null | undefined): Locale {
  const base = (tag ?? "").toLowerCase().split(/[-_]/)[0];
  return (LOCALES as readonly string[]).includes(base ?? "") ? (base as Locale) : DEFAULT_LOCALE;
}

/** Rendert Titel und Text einer Benachrichtigung in der gewünschten Sprache. */
export function render<T extends NotificationType>(type: T, params: TemplateParams<T>, locale: Locale | string | null | undefined = DEFAULT_LOCALE): RenderedText {
  const set = TEMPLATES[resolveLocale(locale)];
  const template = set[type] as Template<T>;
  return template(params);
}
