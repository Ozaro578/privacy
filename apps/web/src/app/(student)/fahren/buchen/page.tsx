import { nowIso, nowMs } from "@/lib/time";
import Link from "next/link";
import { getStudentContext } from "@/lib/data/student";
import { loadOpenSlots, LESSON_KIND_LABEL } from "@/lib/data/lessons";
import { Card, fmt, btn } from "@/components/ui";
import { BookButton } from "@/components/lessons/lesson-actions";
import { WaitlistForm } from "@/components/lessons/waitlist-form";

export const metadata = { title: "Fahrstunde buchen" };

export default async function BookingPage({ searchParams }: { searchParams: Promise<{ woche?: string; lehrer?: string; ansicht?: string }> }) {
  const p = await searchParams;
  const ctx = await getStudentContext();
  const weekOffset = Number(p.woche ?? 0) || 0;
  const view = p.ansicht === "monat" ? "monat" : p.ansicht === "tag" ? "tag" : "woche";
  const from = new Date(); from.setHours(0, 0, 0, 0); from.setDate(from.getDate() + weekOffset * (view === "monat" ? 30 : view === "tag" ? 1 : 7));
  const to = new Date(from); to.setDate(to.getDate() + (view === "monat" ? 30 : view === "tag" ? 1 : 7));
  const [slots, { data: instructors }] = await Promise.all([loadOpenSlots(ctx, { from, to, ...(p.lehrer ? { instructorId: p.lehrer } : {}) }), ctx.db.from("instructors").select("id, display_name").eq("active", true).order("display_name")]);
  const byDay = new Map<string, typeof slots>();
  for (const s of slots) { const k = s.start.slice(0, 10); byDay.set(k, [...(byDay.get(k) ?? []), s]); }
  const link = (over: Record<string, string | number>) => { const u = new URLSearchParams({ woche: String(weekOffset), ansicht: view, ...(p.lehrer ? { lehrer: p.lehrer } : {}), ...Object.fromEntries(Object.entries(over).map(([k, v]) => [k, String(v)])) }); return `/fahren/buchen?${u.toString()}`; };
  return (
    <div className="space-y-5">
      <header><Link href="/fahren" className="text-sm text-brand-700 underline">‹ Fahren</Link><h1 className="text-2xl font-bold">Fahrstunde buchen</h1><p className="text-sm text-ink-700">Nur passende Termine: {ctx.licenseInfo.code}, {ctx.license.transmission === "automatic" ? "Automatik" : "Schaltung"}, Fahrlehrer mit passender Erlaubnis und Verfügbarkeit.</p></header>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <div className="flex rounded-full bg-ink-100 p-1">{(["tag", "woche", "monat"] as const).map((v) => <Link key={v} href={link({ ansicht: v, woche: 0 })} className={`rounded-full px-3 py-1 ${view === v ? "bg-surface font-semibold shadow-sm" : ""}`}>{{ tag: "Tag", woche: "Woche", monat: "Monat" }[v]}</Link>)}</div>
        <Link href={link({ woche: weekOffset - 1 })} className={btn.ghost} aria-label="Zurück">‹</Link>
        <span className="font-medium">{fmt.date(from.toISOString())} bis {fmt.date(new Date(to.getTime() - 1).toISOString())}</span>
        <Link href={link({ woche: weekOffset + 1 })} className={btn.ghost} aria-label="Weiter">›</Link>
        <form className="ml-auto flex items-center gap-2"><input type="hidden" name="ansicht" value={view} /><label htmlFor="lehrer">Fahrlehrer</label><select id="lehrer" name="lehrer" defaultValue={p.lehrer ?? ""} className="rounded-lg border border-ink-300 px-2 py-1"><option value="">Alle</option>{(instructors ?? []).map((i) => <option key={i.id} value={i.id}>{i.display_name}</option>)}</select><button className={btn.secondary}>Filtern</button></form>
      </div>
      {slots.length === 0 ? (
        <Card><p className="text-sm text-ink-700">In diesem Zeitraum sind keine freien Fahrstunden. Trag dich auf die Warteliste ein, dann melden wir uns, sobald ein passender Termin frei wird.</p></Card>
      ) : [...byDay.entries()].map(([day, list]) => (
        <Card key={day} title={`${fmt.weekday(list[0]!.start)}, ${fmt.date(list[0]!.start)}`}>
          <ul className="divide-y divide-ink-100">{list.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div><p className="font-semibold tabular-nums">{fmt.time(s.start)} bis {fmt.time(s.end)} <span className="font-normal text-ink-700">· {s.units} × 45 Min</span></p><p className="text-sm text-ink-700">{LESSON_KIND_LABEL[s.kind] ?? s.kind} · {s.instructor}{s.vehicle ? ` · ${s.vehicle}` : ""}{s.priceCents ? ` · ${fmt.eur(s.priceCents)}` : ""}</p></div>
              <BookButton lessonId={s.id} />
            </li>
          ))}</ul>
        </Card>
      ))}
      <Card title="Warteliste"><WaitlistForm instructors={(instructors ?? []).map((i) => ({ id: i.id, name: i.display_name }))} today={nowIso().slice(0, 10)} inTwoWeeks={new Date(nowMs() + 14 * 86_400_000).toISOString().slice(0, 10)} /></Card>
    </div>
  );
}
