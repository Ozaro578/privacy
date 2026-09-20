import { mediaById, priorityScenarios } from "@fahrpilot/content";
import { PriorityTrainer } from "@/components/learn/priority-trainer";
import { nowMs } from "@/lib/time";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { DashboardData } from "@/lib/data/dashboard";
import { TodayView } from "@/components/student/today-view";
import { SessionRunner } from "@/components/learn/session-runner";
import { StudentShell } from "@/components/nav/student-shell";
import { Card, btn } from "@/components/ui";

export const metadata = { title: "Vorschau" };

/**
 * Design-Vorschau mit Beispieldaten, nur außerhalb der Produktion erreichbar (kein Login nötig).
 * Zeigt die Schüler-Oberfläche so, wie sie mit echten Daten aussieht.
 */
export default function PreviewPage() {
  if (process.env.NODE_ENV === "production" && process.env.PREVIEW_MODE !== "1") notFound();
  const in2d = new Date(nowMs() + 2 * 86_400_000 + 3 * 3_600_000).toISOString();
  const d: DashboardData = {
    now: new Date(nowMs()).toISOString(),
    overview: { topics: [], totalQuestions: 202, answeredQuestions: 131, dueCount: 14, wrongCount: 9, bookmarkedCount: 6, unseenCount: 71, hardCount: 22, overallMastery: 0.71 },
    readinessScore: 71, readinessBand: "yellow_green", readinessFactors: [], theoryPercent: 78, practicalPercent: 62,
    nextLesson: { id: "1", start: in2d, end: in2d, instructor: "Max Mustermann", kind: "overland" }, nextTheoryClass: { id: "2", start: new Date(nowMs() + 4 * 86_400_000).toISOString(), title: "Vorfahrt" },
    missingDocuments: [{ id: "d", title: "Biometrisches Passfoto" }], openInvoiceCents: 61000, unreadMessages: 1, unreadNotifications: [{ id: "n", title: "Freigabe für die Theorieprüfung", body: "Dein Fahrlehrer hat dich für die Theorieprüfung freigegeben.", created_at: new Date().toISOString() }],
    streak: { current_days: 7, longest_days: 12, total_xp: 1240, level: 4 }, todayGoal: { answered: 12, target: 20, achieved: false, challengeDone: false }, learnedToday: true,
    today: [
      { kind: "coupling", priority: 85, title: "Vorfahrt-Training für heute", subtitle: "Dein Fahrlehrer hat hier Übungsbedarf gesehen", action: { type: "learn", mode: "topic", minutes: 10 } },
      { kind: "review", priority: 77, title: "14 fällige Fragen wiederholen", action: { type: "learn", mode: "review", minutes: 7 } },
      { kind: "lesson", priority: 60, title: "Übermorgen: Fahrstunde 14:30", subtitle: "Max Mustermann", action: { type: "open", route: "/fahren" } },
      { kind: "document", priority: 55, title: "Dokument fehlt: Biometrisches Passfoto", action: { type: "open", route: "/profil/dokumente" } },
      { kind: "invoice", priority: 50, title: "Offener Betrag: 610,00 €", action: { type: "open", route: "/finanzen" } },
    ],
    training: { training: null, theory: null, profile: { skills: [], overall_percent: 74, biggest_needs: [], statement: "Aktuell größter Trainingsbedarf: Fahrstreifenwechsel und Abbiegen." }, forecast: null, practicalPercent: 62, completedPracticeUnits: 18, attendedCodes: ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8"] },
    exams: { theoryAt: new Date(nowMs() + 5 * 86_400_000).toISOString(), practicalAt: null, theoryStatus: "scheduled", practicalStatus: "not_ready" },
    weaknessStatement: "Persönliche Schwachstelle: Vorfahrt (48 % Mastery)",
  };
  const session = {
    sessionId: "00000000-0000-0000-0000-000000000000", clientSessionId: "00000000-0000-0000-0000-000000000000", mode: "review" as const, challenge: false,
    questions: [{ id: "00000000-0000-0000-0000-000000000001", topicName: "Vorfahrt", points: 5, kind: "multiple_choice", source: "own", text: "Sie nähern sich einer Kreuzung ohne Verkehrszeichen und ohne Lichtzeichen. Was gilt?", mediaPath: "/media/questions/scenes/vorfahrt-rechts-vor-links.svg", mediaAlt: "Kreuzung ohne Verkehrszeichen: Ihr blaues Auto kommt von unten, ein rotes Auto von rechts. Beide wollen geradeaus.", mediaCredit: "Grafik FahrPilot (eigene Darstellung, schematisch)", numeric: false, answers: [{ position: 1, text: "Rechts vor links" }, { position: 2, text: "Wer zuerst kommt, fährt zuerst" }, { position: 3, text: "Die breitere Straße hat Vorfahrt" }] }],
  };
  return (
    <StudentShell schoolName="Fahrschule Muster (Vorschau)" legalBasisDate="2026-09-01" current="/heute">
      <div className="mb-4 rounded-xl border border-warn-500/40 bg-warn-100 p-3 text-sm">Vorschau mit Beispieldaten. Aktionen sind hier ohne Anmeldung nicht aktiv. <Link href="/login" className="underline">Zum Login</Link></div>
      <div id="heute"><TodayView firstName="Lisa" licenseName="Klasse B (Pkw)" transmission="manual" rulesNeedVerification={false} d={d} /></div>
      <div id="session" className="mt-10 space-y-3"><h2 className="text-xl font-bold">Lernsession</h2><SessionRunner session={session} /></div>
      <div id="vorfahrt" className="mt-10 space-y-3"><h2 className="text-xl font-bold">Vorfahrt-Trainer</h2><PriorityTrainer scenarios={priorityScenarios.slice(0, 4).flatMap((sc) => { const m = mediaById(sc.media); return m ? [{ ...sc, file: m.file, alt: m.alt }] : []; })} /></div>
      <div className="mt-10"><Card title="Weitere Bereiche"><div className="flex flex-wrap gap-2"><Link href="/login" className={btn.primary}>Login</Link><Link href="/datenschutz" className={btn.secondary}>Datenschutz</Link></div></Card></div>
    </StudentShell>
  );
}
