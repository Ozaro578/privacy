import Link from "next/link";
import { getStudentContext } from "@/lib/data/student";
import { loadTrainingStatus } from "@/lib/data/training";
import { Card, fmt, btn } from "@/components/ui";
import { PracticalTrainer } from "@/components/practical/trainer";

export const metadata = { title: "Praktische Prüfung" };

const STEPS = [
  { title: "Sicherheitskontrollen", text: "Vor der Fahrt fragt der Prüfer meist eine Sicherheitskontrolle ab: Beleuchtung, Reifen, Bremsen, Flüssigkeiten oder Kontrollleuchten. Übe die Antworten mit dem Trainer unten." },
  { title: "Fahrzeugtechnik", text: "Erkläre Funktion und Prüfung von ABS, ESP, Bremsleuchten, Warnblinkanlage und Reifenprofil in einfachen Worten." },
  { title: "Grundfahraufgaben", text: "Einparken (längs und quer), Umkehren, Gefahrbremsung, Anfahren am Berg je nach Vorgabe. Ruhig, kontrolliert, mit Verkehrsbeobachtung." },
  { title: "Autobahn und Landstraße", text: "Einfädeln über den Beschleunigungsstreifen, Abstand halten, Rechtsfahrgebot, Ausfahren mit rechtzeitigem Blinken." },
  { title: "Selbstständiges Fahren", text: "Ein Teil der Prüfung wird ohne Einzelanweisungen gefahren: Navigation oder Zielvorgabe. Der Prüfer bewertet Verkehrsbeobachtung, Geschwindigkeit und Entscheidungen." },
  { title: "Verhalten bei Fehlern", text: "Ein einzelner kleiner Fehler ist kein Durchfallgrund. Bleib ruhig, korrigiere sicher und fahre weiter. Gefährdungen und Vorfahrtsverletzungen sind kritisch." },
  { title: "Prüfungsablauf", text: "Ausweis und Prüfauftrag mitbringen. Die Prüfung dauert für Klasse B rund 55 Minuten inklusive Vor- und Nachbereitung, das Ergebnis gibt es direkt danach." },
];

export default async function PracticalPage() {
  const ctx = await getStudentContext();
  const [status, { data: questions }, { data: mocks }, { data: exam }] = await Promise.all([
    loadTrainingStatus(ctx),
    ctx.db.from("practical_check_questions").select("id, category, question, expected_points, explanation").eq("review_status", "published").eq("locale", "de").order("category"),
    ctx.db.from("mock_exams").select("id, started_at, overall_score, strengths, improvements, summary, status").eq("student_license_id", ctx.license.id).eq("status", "completed").order("started_at", { ascending: false }).limit(5),
    ctx.db.from("practical_exams").select("scheduled_at, status, attempt_no").eq("student_license_id", ctx.license.id).order("attempt_no", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const practicalRules = ctx.rules.examPractical?.rules;
  const ready = status.training?.all_special_drives_done && ctx.license.theory_exam_status === "passed";
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Praktische Prüfung</h1>
      <Card>
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div><dt className="text-ink-500">Status</dt><dd className="font-semibold">{{ not_ready: "Noch nicht bereit", awaiting_instructor_release: "Fahrlehrer-Freigabe ausstehend", ready: "Bereit", requested: "Angefragt", scheduled: "Terminiert", passed: "Bestanden", failed: "Nicht bestanden", cancelled: "Abgesagt" }[ctx.license.practical_exam_status]}</dd></div>
          <div><dt className="text-ink-500">Termin</dt><dd className="font-semibold">{exam?.scheduled_at ? `${fmt.date(exam.scheduled_at)} ${fmt.time(exam.scheduled_at)}` : "noch offen"}</dd></div>
          <div><dt className="text-ink-500">Dauer</dt><dd className="font-semibold">{practicalRules ? `${practicalRules.duration_minutes} Minuten` : "siehe Fahrschule"}</dd></div>
        </dl>
        <p className="mt-3 text-sm text-ink-700">Voraussetzungen: Theorieprüfung bestanden {ctx.license.theory_exam_status === "passed" ? "✓" : "✗"}, alle Sonderfahrten absolviert {status.training?.all_special_drives_done ? "✓" : "✗"}{ready ? ". Dein Fahrlehrer gibt dich frei, sobald er dich für prüfungsreif hält." : "."}</p>
        <div className="mt-3 flex flex-wrap gap-2"><Link href="/coach?thema=praxis" className={btn.primary}>Prüfungstraining mit dem Coach starten</Link></div>
      </Card>
      <Card title="Prüfer-Fragen-Trainer"><PracticalTrainer questions={(questions ?? []).map((q) => ({ id: q.id, category: q.category, question: q.question, expectedPoints: q.expected_points, explanation: q.explanation }))} /></Card>
      <Card title="So läuft die Prüfung">
        <ol className="space-y-3">{STEPS.map((s, i) => <li key={s.title} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">{i + 1}</span><div><p className="font-medium">{s.title}</p><p className="text-sm text-ink-700">{s.text}</p></div></li>)}</ol>
      </Card>
      {(mocks ?? []).length > 0 && (
        <Card title="Mock-Prüfungen">
          <ul className="divide-y divide-ink-100">{(mocks ?? []).map((m) => <li key={m.id} className="py-3"><p className="font-semibold">{fmt.date(m.started_at)} · Gesamteindruck {m.overall_score ?? "?"}/100</p><p className="text-sm">Stärken: {m.strengths.join(", ") || "keine Angabe"}</p><p className="text-sm">Verbessern: {m.improvements.join(", ") || "keine Angabe"}</p>{m.summary && <p className="mt-1 text-sm text-ink-700">{m.summary}</p>}</li>)}</ul>
        </Card>
      )}
    </div>
  );
}
