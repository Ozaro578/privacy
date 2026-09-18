import type { ExplainResult } from "@briefklar/shared";

/** Beispiel-Ergebnis für ?demo=1 (Screenshots, Design-Checks) – ruft keine API auf. */
export const DEMO_RESULT: ExplainResult = {
  language: "de",
  is_readable: true,
  quality_hint: null,
  document_type: "Bescheid vom Jobcenter",
  sender: {
    name: "Jobcenter Berlin Mitte",
    type: "behoerde",
    contact: {
      phone: "030 5555 70 1234",
      email: "jobcenter-berlin-mitte@jobcenter-ge.de",
      website: "https://www.jobcenter.digital",
      address: "Sickingenstraße 70, 10553 Berlin",
      office_hours: "Mo–Fr 8:00–12:30 Uhr, Do zusätzlich 14:00–18:00 Uhr",
    },
  },
  reference_number: "962D-45-1234567-8",
  letter_date: "2026-09-10",
  summary:
    "Das Jobcenter hat dein Bürgergeld für Oktober bis Dezember neu berechnet. Du bekommst jetzt weniger Geld, weil du im August mehr verdient hast.",
  what_it_means:
    "Dein Bürgergeld wird ab Oktober um 128,40 € im Monat gekürzt. Grund ist dein Einkommen aus dem Minijob im August. Das Jobcenter sagt außerdem, dass du für September 128,40 € zu viel bekommen hast. Dieses Geld musst du zurückzahlen. Wenn du glaubst, dass die Berechnung falsch ist, kannst du innerhalb von einem Monat Widerspruch einlegen. Du hast außerdem einen Termin bei deiner Sachbearbeiterin.",
  urgency: "diese_woche",
  appointments: [
    {
      date: "2026-09-24",
      time: "09:30",
      duration_minutes: 30,
      title: "Termin Jobcenter – Gespräch Sachbearbeiterin",
      location: "Jobcenter Berlin Mitte, Sickingenstraße 70, Raum 2.14",
      notes: "Mitbringen: Lohnabrechnung August, Personalausweis, diesen Brief.",
      mandatory: true,
    },
  ],
  deadlines: [
    {
      date: "2026-10-13",
      description: "Widerspruch einlegen, wenn du mit dem Bescheid nicht einverstanden bist",
      consequence_if_missed: "Der Bescheid wird gültig und du kannst dich nicht mehr wehren.",
    },
    {
      date: "2026-10-31",
      description: "128,40 € zurückzahlen",
      consequence_if_missed: "Es können Mahngebühren dazukommen oder das Geld wird vom Bürgergeld abgezogen.",
    },
  ],
  actions: [
    { step: 1, text: "Prüfe die Berechnung auf Seite 2: Stimmt dein Einkommen für August?", required: true },
    { step: 2, text: "Gehe am 24. September um 9:30 Uhr zum Termin. Nimm die Lohnabrechnung mit.", required: true },
    { step: 3, text: "Wenn etwas falsch ist: Widerspruch bis 13. Oktober schreiben (ein kurzer Brief reicht).", required: false },
    { step: 4, text: "Wenn alles stimmt: 128,40 € bis 31. Oktober überweisen.", required: true },
  ],
  money: {
    direction: "zahlen",
    amount: "128,40 €",
    details: "Rückzahlung für September an das Jobcenter, bis 31. Oktober 2026.",
  },
  payment: {
    recipient: "Jobcenter Berlin Mitte",
    iban: "DE02120300000000202051",
    bic: "BYLADEM1001",
    reference: "962D-45-1234567-8 Erstattung 09/2026",
    amount_eur: 128.4,
    due_date: "2026-10-31",
  },
  can_object:
    "Ja. Du kannst innerhalb von einem Monat Widerspruch einlegen. Schreibe einen kurzen Brief mit dem Aktenzeichen und dem Satz „Ich lege Widerspruch ein“. Das kostet nichts.",
  glossary: [
    { term_de: "Bescheid", explanation: "Ein offizieller Brief mit einer Entscheidung der Behörde." },
    { term_de: "Anrechnung von Einkommen", explanation: "Geld, das du verdienst, wird vom Bürgergeld abgezogen." },
    { term_de: "Erstattung", explanation: "Geld, das du zurückzahlen musst, weil du zu viel bekommen hast." },
    { term_de: "Widerspruch", explanation: "Damit sagst du der Behörde: Ich bin nicht einverstanden. Bitte prüft das noch einmal." },
  ],
  where_to_get_help: [
    { name: "Sozialberatung (Caritas, Diakonie, AWO)", how: "Hilft kostenlos beim Prüfen des Bescheids und beim Schreiben des Widerspruchs." },
    { name: "Migrationsberatung für Erwachsene (MBE)", how: "Berät in vielen Sprachen zu Briefen vom Jobcenter." },
  ],
  scam_risk: "niedrig",
  warnings: [],
  confidence: "hoch",
};
