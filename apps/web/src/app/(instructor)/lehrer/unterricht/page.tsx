import Link from "next/link";
import { getInstructorContext, loadTheoryClasses, todayKey } from "@/lib/data/instructor";
import { Card, Pill, fmt, Alert } from "@/components/ui";
import { TheoryClassForm, CancelClassButton } from "@/components/instructor/theory-class-form";

export const metadata = { title: "Unterricht" };

const STATUS: Record<string, { label: string; tone: "neutral" | "brand" | "success" | "warn" | "danger" }> = { planned: { label: "geplant", tone: "neutral" }, running: { label: "läuft", tone: "warn" }, completed: { label: "beendet", tone: "success" }, cancelled: { label: "abgesagt", tone: "danger" } };

export default async function TheoryClassesPage() {
  const ctx = await getInstructorContext();
  const d = await loadTheoryClasses(ctx);
  const nowIso = new Date().toISOString();
  const upcoming = d.classes.filter((c) => c.end >= nowIso && c.status !== "cancelled");
  const past = d.classes.filter((c) => c.end < nowIso || c.status === "cancelled");
  const row = (c: (typeof d.classes)[number]) => (
    <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div>
        <p className="font-semibold">{fmt.weekday(c.start)}, {fmt.date(c.start)} · {fmt.time(c.start)} bis {fmt.time(c.end)}</p>
        <p className="text-sm text-ink-700"><span className="font-mono text-xs">{c.code}</span> {c.title} · {c.materialKind === "basic" ? "Grundstoff" : `Zusatzstoff ${c.licenseCodes.join(", ")}`} · {c.isOnline ? "Online" : c.location ?? "Ohne Standort"}{c.capacity ? ` · ${c.registered}/${c.capacity} Plätze` : ` · ${c.registered} angemeldet`} · {c.present} anwesend{ctx.isOffice && !ctx.instructor && c.instructor ? ` · ${c.instructor}` : ""}</p>
      </div>
      <div className="flex items-center gap-3">
        <Pill tone={STATUS[c.status]?.tone ?? "neutral"}>{STATUS[c.status]?.label ?? c.status}</Pill>
        {c.status !== "cancelled" && <Link href={`/lehrer/unterricht/${c.id}`} className={c.status === "completed" ? "text-sm text-brand-700 underline" : "rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white"}>{c.status === "completed" ? "Anwesenheit" : c.status === "running" ? "Weiter" : "Unterricht starten"}</Link>}
        {c.status === "planned" && <CancelClassButton classId={c.id} />}
      </div>
    </li>
  );
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Theorieunterricht</h1><p className="text-sm text-ink-700">{upcoming.length} anstehende Termine</p></div>
        {ctx.instructor ? <TheoryClassForm basicUnits={d.basicUnits} classUnits={d.classUnits} licenses={d.licenses.filter((l) => (d.classUnits[l.code] ?? []).length > 0)} locations={d.locations} defaultDate={todayKey(ctx.school.timezone)} /> : null}
      </header>
      {!ctx.instructor && <Alert tone="info">Unterricht anlegen und starten können Fahrlehrer mit eigenem Datensatz. Als Büro sehen Sie alle Termine.</Alert>}
      <Card title="Anstehend">
        {upcoming.length === 0 ? <p className="text-sm text-ink-700">Kein Unterricht geplant.</p> : <ul className="divide-y divide-ink-100">{upcoming.map(row)}</ul>}
      </Card>
      {past.length > 0 && <Card title="Letzte 7 Tage"><ul className="divide-y divide-ink-100">{past.map(row)}</ul></Card>}
    </div>
  );
}
