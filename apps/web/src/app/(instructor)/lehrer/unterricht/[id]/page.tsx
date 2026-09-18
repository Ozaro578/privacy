import Link from "next/link";
import { notFound } from "next/navigation";
import { getInstructorContext, loadTheoryClassSession } from "@/lib/data/instructor";
import { refreshCheckinTokenAction } from "@/lib/actions/instructor";
import { Card, Pill, fmt, Alert } from "@/components/ui";
import { QrPanel, AttendanceList, FinishClassButton } from "@/components/instructor/class-session";

export const metadata = { title: "Unterricht läuft" };

export default async function TheoryClassSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getInstructorContext();
  const d = await loadTheoryClassSession(ctx, id);
  if (!d) notFound();
  const active = d.cls.status === "planned" || d.cls.status === "running";
  const own = ctx.isOffice || (!!ctx.instructor && d.cls.instructor_id === ctx.instructor.id);
  const initial = active && own ? await refreshCheckinTokenAction(d.cls.id) : null;
  return (
    <div className="space-y-5">
      <header>
        <Link href="/lehrer/unterricht" className="text-sm text-brand-700 underline">Alle Unterrichte</Link>
        <h1 className="text-2xl font-bold"><span className="font-mono text-lg">{d.cls.lesson_unit_code}</span> {d.cls.title}</h1>
        <p className="text-sm text-ink-700">{fmt.weekday(d.start)}, {fmt.date(d.start)} · {fmt.time(d.start)} bis {fmt.time(d.end)} · {d.cls.is_online ? "Online" : d.location ?? "Ohne Standort"} <Pill tone={d.cls.status === "running" ? "warn" : d.cls.status === "completed" ? "success" : "neutral"}>{{ planned: "geplant", running: "läuft", completed: "beendet", cancelled: "abgesagt" }[d.cls.status] ?? d.cls.status}</Pill></p>
      </header>
      {!own && <Alert tone="info">Dieser Unterricht gehört zu einem anderen Fahrlehrer. Codes können nur vom Leitenden erzeugt werden.</Alert>}
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Check-in per QR-Code">
          <p className="mb-3 text-sm text-ink-700">Schüler scannen den Code mit der Kamera oder geben ihn unter „Theorieunterricht“ ein. Der Code wechselt alle 45 Sekunden und gilt nur im Zeitfenster des Unterrichts.</p>
          {initial && "error" in initial ? <Alert tone="error">{initial.error}</Alert> : <QrPanel classId={d.cls.id} initial={initial && !("error" in initial) ? initial : null} active={active && own} />}
        </Card>
        <Card title="Anwesenheit" action={active && own ? <FinishClassButton classId={d.cls.id} /> : undefined}>
          <AttendanceList classId={d.cls.id} initial={d.attendance} students={d.students} active={active && own} />
        </Card>
      </div>
    </div>
  );
}
