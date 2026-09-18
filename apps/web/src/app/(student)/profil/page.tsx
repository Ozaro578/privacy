import Link from "next/link";
import { getStudentContext } from "@/lib/data/student";
import { Card, Pill, fmt } from "@/components/ui";
import { logoutAction } from "@/lib/actions/auth";
import { DocumentUpload } from "@/components/profile/document-upload";
import { NotificationSettings, PrivacyActions, LocaleSelect } from "@/components/profile/settings";

export const metadata = { title: "Profil" };

const DOC_STATUS: Record<string, { label: string; tone: "neutral" | "brand" | "success" | "warn" | "danger" }> = { missing: { label: "fehlt", tone: "warn" }, uploaded: { label: "in Prüfung", tone: "brand" }, verified: { label: "geprüft", tone: "success" }, rejected: { label: "abgelehnt", tone: "danger" }, expired: { label: "abgelaufen", tone: "danger" } };
const EXAM_STATUS: Record<string, string> = { not_ready: "nicht bereit", awaiting_instructor_release: "Fahrlehrer-Freigabe ausstehend", ready: "bereit", requested: "angefragt", scheduled: "terminiert", passed: "bestanden", failed: "nicht bestanden", cancelled: "abgesagt" };

export default async function ProfilePage() {
  const ctx = await getStudentContext();
  const [{ data: docs }, { data: prefs }, { data: streak }, { data: contract }, { data: instructor }] = await Promise.all([
    ctx.db.from("documents").select("id, title, kind, status, requirement_code, rejection_reason, verified_at, expires_at").eq("student_id", ctx.student.id).order("status"),
    ctx.db.from("notification_preferences").select("notification_type, push, email, in_app").eq("user_id", ctx.userId),
    ctx.db.from("student_streaks").select("*").eq("student_id", ctx.student.id).maybeSingle(),
    ctx.db.from("contracts").select("contract_number, status, signed_at, document_path").eq("student_id", ctx.student.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ctx.license.primary_instructor_id ? ctx.db.from("instructors").select("display_name").eq("id", ctx.license.primary_instructor_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const done = (docs ?? []).filter((d) => d.status === "verified").length;
  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div><h1 className="text-2xl font-bold">{ctx.student.first_name} {ctx.student.last_name}</h1><p className="text-sm text-ink-700">{ctx.school.name} · {ctx.licenseInfo.name}{instructor?.display_name ? ` · Fahrlehrer: ${instructor.display_name}` : ""}</p></div>
        <Link href="/profil/nachrichten" className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700">Nachrichten</Link>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Ausbildungsstatus">
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt>Theorieprüfung</dt><dd><Pill tone={ctx.license.theory_exam_status === "passed" ? "success" : "neutral"}>{EXAM_STATUS[ctx.license.theory_exam_status]}</Pill></dd></div>
            <div className="flex justify-between"><dt>Praktische Prüfung</dt><dd><Pill tone={ctx.license.practical_exam_status === "passed" ? "success" : "neutral"}>{EXAM_STATUS[ctx.license.practical_exam_status]}</Pill></dd></div>
            <div className="flex justify-between"><dt>Ausbildung seit</dt><dd>{fmt.date(ctx.license.started_at)}</dd></div>
            <div className="flex justify-between"><dt>Vertrag</dt><dd>{contract ? `${contract.contract_number ?? ""} ${contract.status}` : "noch nicht hinterlegt"}</dd></div>
            <div className="flex justify-between"><dt>Level</dt><dd>{streak?.level ?? 1} · {streak?.total_xp ?? 0} XP · längste Serie {streak?.longest_days ?? 0} Tage</dd></div>
          </dl>
        </Card>
        <Card title="Dokumenten-Checkliste" action={<span className="text-sm">{done}/{(docs ?? []).length}</span>}>
          <ul className="divide-y divide-ink-100">{(docs ?? []).map((d) => { const s = DOC_STATUS[d.status] ?? { label: d.status, tone: "neutral" as const }; return (
            <li key={d.id} className="py-2">
              <div className="flex items-center justify-between gap-2"><span>{d.status === "verified" ? "☑" : "☐"} {d.title}</span><Pill tone={s.tone}>{s.label}</Pill></div>
              {d.rejection_reason && <p className="text-xs text-danger-500">{d.rejection_reason}</p>}
              {["missing", "rejected"].includes(d.status) && ["id_copy", "passport_photo", "eye_test", "first_aid", "guardian_consent"].includes(d.requirement_code ?? "") && <div className="mt-1"><DocumentUpload documentId={d.id} tenantId={ctx.tenantId} studentId={ctx.student.id} kind={d.kind} /></div>}
            </li>
          ); })}</ul>
        </Card>
      </div>
      <Card title="Benachrichtigungen"><NotificationSettings prefs={prefs ?? []} /></Card>
      <Card title="Einstellungen">
        <div className="space-y-3"><LocaleSelect current={ctx.student.preferred_locale} /><p className="text-xs text-ink-500">Übersetzte Lerninhalte sind Lernhilfen. Welche Sprachen in der amtlichen Prüfung zugelassen sind, entscheidet die Prüforganisation.</p></div>
      </Card>
      <Card title="Datenschutz">
        <p className="mb-2 text-sm text-ink-700">Du kannst jederzeit eine Kopie deiner Daten anfordern oder die Löschung beantragen. <Link href="/datenschutz" className="text-brand-700 underline">Datenschutzerklärung</Link></p>
        <PrivacyActions />
      </Card>
      <form action={logoutAction}><button className="text-sm text-ink-500 underline">Abmelden</button></form>
    </div>
  );
}
