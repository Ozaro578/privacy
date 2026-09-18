import Link from "next/link";
import { notFound } from "next/navigation";
import { createAiServices } from "@fahrpilot/ai";
import { getInstructorContext, loadLessonForEvaluation, LESSON_KIND_LABEL, LESSON_STATUS_LABEL } from "@/lib/data/instructor";
import { Alert, Pill, fmt, parseRange } from "@/components/ui";
import { EvaluationForm } from "@/components/instructor/evaluation-form";

export const metadata = { title: "Dokumentation" };

export default async function LessonDocumentationPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const ctx = await getInstructorContext();
  const d = await loadLessonForEvaluation(ctx, lessonId);
  if (!d) notFound();
  const { start, end } = parseRange(d.lesson.period as unknown as string);
  const services = createAiServices();
  const own = ctx.isOffice || ctx.instructor?.id === d.lesson.instructor_id;
  const readOnly = !own || !d.lesson.student_id;
  return (
    <div className="space-y-5">
      <header>
        {d.lesson.student_license_id && <Link href={`/lehrer/schueler/${d.lesson.student_license_id}`} className="text-sm text-brand-700 underline">Zum Schülerprofil</Link>}
        <h1 className="text-2xl font-bold">Dokumentation{d.studentName ? `: ${d.studentName}` : ""}</h1>
        <p className="text-sm text-ink-700">{fmt.weekday(start)}, {fmt.date(start)} · {fmt.time(start)} bis {fmt.time(end)} · {LESSON_KIND_LABEL[d.lesson.kind] ?? d.lesson.kind} · {d.lesson.units} × 45 Min{d.licenseCode ? ` · Klasse ${d.licenseCode}` : ""}{d.vehicle ? ` · ${d.vehicle}` : ""} · {d.instructorName} <Pill tone={d.lesson.status === "completed" ? "success" : "neutral"}>{LESSON_STATUS_LABEL[d.lesson.status] ?? d.lesson.status}</Pill></p>
      </header>
      {!d.lesson.student_id && <Alert tone="warning">Dieser Slot hat keinen Schüler und kann nicht dokumentiert werden.</Alert>}
      {!own && <Alert tone="info">Diese Stunde gehört zu einem anderen Fahrlehrer. Die Dokumentation ist nur lesbar.</Alert>}
      {d.evaluation && <Alert tone="success">Bereits dokumentiert am {fmt.date(d.evaluation.updated_at)} {fmt.time(d.evaluation.updated_at)}{d.evaluation.ai_confirmed ? " (KI-Entwurf bestätigt)" : ""}. Änderungen ersetzen die bisherige Bewertung.</Alert>}
      <EvaluationForm lessonId={d.lesson.id} skills={d.skills} existing={d.evaluation} existingRatings={d.ratings} previousGoals={d.previousGoals} sttAvailable={!!services.transcription} aiAvailable={!!services.fast} readOnly={readOnly} />
    </div>
  );
}
