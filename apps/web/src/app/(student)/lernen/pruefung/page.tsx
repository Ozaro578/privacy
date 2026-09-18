import Link from "next/link";
import { getStudentContext } from "@/lib/data/student";
import { startExamSimulation } from "@/lib/actions/exam";
import { Card, Alert, btn, fmt, Pill } from "@/components/ui";

export const metadata = { title: "Prüfungssimulation" };

export default async function ExamStartPage() {
  const ctx = await getStudentContext();
  const rule = ctx.rules.examTheory;
  const { data: history } = await ctx.db.from("exam_simulations").select("id, submitted_at, passed, error_points, correct_count, wrong_count, duration_seconds, status").eq("student_license_id", ctx.license.id).order("started_at", { ascending: false }).limit(20);
  const open = (history ?? []).find((h) => h.status === "in_progress");
  const done = (history ?? []).filter((h) => h.status === "submitted");
  const passed = done.filter((h) => h.passed).length;
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Prüfungssimulation</h1>
      {!rule ? <Alert tone="warning">Für {ctx.licenseInfo.name} ist noch keine Prüfungsregel hinterlegt. Bitte wende dich an deine Fahrschule.</Alert> : (
        <Card title={`So läuft die Theorieprüfung ${ctx.licenseInfo.code} (${ctx.license.acquisition_kind === "extension" ? "Erweiterung" : "Ersterwerb"})`}>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            <li className="rounded-lg bg-ink-100 p-2">{rule.rules.questions_total} Fragen ({rule.rules.basic_questions} Grundstoff, {rule.rules.class_specific_questions} Zusatzstoff)</li>
            <li className="rounded-lg bg-ink-100 p-2">Höchstens {rule.rules.max_error_points} Fehlerpunkte</li>
            {rule.rules.fail_if_two_five_point_questions_wrong && <li className="rounded-lg bg-ink-100 p-2">Zwei falsche 5-Punkte-Fragen bedeuten „nicht bestanden“</li>}
            <li className="rounded-lg bg-ink-100 p-2">{rule.rules.time_limit_seconds ? `Zeitlimit ${Math.round(rule.rules.time_limit_seconds / 60)} Minuten` : "Kein festes Zeitlimit, die Zeit wird gemessen"}</li>
          </ul>
          <p className="mt-3 text-xs text-ink-500">Regelversion {rule.version.version} · Quelle: {rule.version.source} · Rechtsstand {rule.version.legal_basis_date ? new Date(rule.version.legal_basis_date).toLocaleDateString("de-DE") : "siehe Quelle"}{rule.needsVerification ? " · fachlich noch zu verifizieren" : ""}</p>
          <form action={startExamSimulation} className="mt-4 flex flex-wrap gap-2">
            {open ? <Link href={`/lernen/pruefung/${open.id}`} className={btn.primary}>Laufende Simulation fortsetzen</Link> : <button type="submit" className={btn.primary}>Simulation starten</button>}
            <Link href="/lernen" className={btn.secondary}>Zurück</Link>
          </form>
        </Card>
      )}
      <Card title="Bisherige Simulationen" action={<span className="text-sm text-ink-700">{passed} von {done.length} bestanden</span>}>
        {done.length === 0 ? <p className="text-sm text-ink-700">Noch keine Simulation abgeschlossen. Die Prüfungsreife steigt erst mit bestandenen Simulationen deutlich.</p> : (
          <ul className="divide-y divide-ink-100">
            {done.map((h) => (
              <li key={h.id} className="flex items-center justify-between py-2 text-sm">
                <Link href={`/lernen/pruefung/${h.id}`} className="hover:underline">{fmt.date(h.submitted_at)} {fmt.time(h.submitted_at)}</Link>
                <span className="flex items-center gap-2"><span className="tabular-nums text-ink-700">{h.error_points} FP · {h.correct_count}/{(h.correct_count ?? 0) + (h.wrong_count ?? 0)}</span><Pill tone={h.passed ? "success" : "danger"}>{h.passed ? "bestanden" : "nicht bestanden"}</Pill></span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
