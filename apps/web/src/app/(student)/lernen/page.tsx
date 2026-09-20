import Link from "next/link";
import { getStudentContext } from "@/lib/data/student";
import { buildLearningOverview, loadQuestionPool, loadStates, loadTopics } from "@/lib/data/learning";
import { Card, ProgressBar, btn } from "@/components/ui";
import { LEVEL_LABEL, currentLevel, levelProgress } from "@fahrpilot/learning-engine";
import { toMeta } from "@/lib/data/learning";
import { Leaderboard, type LeaderboardRow } from "@/components/learn/leaderboard";

export const metadata = { title: "Lernen" };

const MODES: Array<{ mode: string; title: string; text: string; countKey?: "dueCount" | "wrongCount" | "bookmarkedCount" | "unseenCount" | "hardCount" }> = [
  { mode: "review", title: "Wiederholung", text: "Fällige Fragen nach Spaced Repetition", countKey: "dueCount" },
  { mode: "weakness", title: "Schwachstellen", text: "Fragen aus deinen schwächsten Themen" },
  { mode: "wrong", title: "Falsch beantwortet", text: "Zuletzt falsch beantwortete Fragen", countKey: "wrongCount" },
  { mode: "hard", title: "Schwierige Fragen", text: "Hohe Schwierigkeit oder mehrfach falsch", countKey: "hardCount" },
  { mode: "unseen", title: "Noch nie beantwortet", text: "Neue Fragen entdecken", countKey: "unseenCount" },
  { mode: "bookmarked", title: "Markierte Fragen", text: "Deine Merkliste", countKey: "bookmarkedCount" },
  { mode: "random", title: "Zufallsfragen", text: "Bunt gemischt durch alle Themen" },
  { mode: "signs", title: "Zeichen-Trainer", text: "Verkehrszeichen erkennen und ihre Bedeutung kennen" },
];

export default async function LearnPage() {
  const ctx = await getStudentContext();
  const locale = ctx.student.preferred_locale;
  const [pool, states, topics, { data: board }, { data: me }] = await Promise.all([loadQuestionPool(ctx.db, ctx.license.license_code, ctx.licenseInfo.base_class, locale), loadStates(ctx.db, ctx.student.id), loadTopics(ctx.db, locale), ctx.db.rpc("tenant_leaderboard", { p_days: 7, p_limit: 10 }), ctx.db.from("students").select("leaderboard_opt_in").eq("id", ctx.student.id).single()]);
  const ov = buildLearningOverview(pool, states, topics);
  const levels = levelProgress(pool.map((q) => toMeta(q)), states);
  const level = currentLevel(levels);
  const basic = ov.topics.filter((t) => t.material_kind === "basic");
  const specific = ov.topics.filter((t) => t.material_kind === "class_specific");
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Lernen</h1>
          <p className="text-sm text-ink-700">{ov.answeredQuestions} von {ov.totalQuestions} Fragen bearbeitet · Mastery {Math.round(ov.overallMastery * 100)} %</p>
        </div>
        <Link href="/lernen/pruefung" className={btn.primary}>Prüfungssimulation</Link>
      </header>
      <p className="text-xs text-ink-500">Übungsfragen sind eigene Formulierungen der Plattform und kein amtlicher Prüfungsinhalt. Der amtliche Fragenkatalog wird nach Lizenzierung ergänzt.</p>

      <section aria-labelledby="ladder" className="rounded-card border border-brand-100 bg-surface p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="ladder" className="text-base font-semibold">Stufe {level}: {LEVEL_LABEL[level]}</h2>
            <p className="text-sm text-ink-700">Von leicht nach schwer. Jede Stufe gilt als geschafft, wenn du sie fast vollständig beherrschst; dann geht es eine Stufe höher.</p>
          </div>
          <Link href={`/lernen/session?mode=ladder&limit=15`} className={btn.primary}>Stufe {level} lernen</Link>
        </div>
        <ol className="mt-3 grid grid-cols-5 gap-2" aria-label="Stufen">
          {levels.map((l) => (
            <li key={l.level} className={`rounded-xl p-2 text-center text-xs ${l.cleared ? "bg-success-100" : l.level === level ? "bg-brand-50 ring-2 ring-brand-500" : "bg-ink-100"}`}>
              <span className="block text-lg font-bold tabular-nums">{l.level}</span>
              <span className="block">{LEVEL_LABEL[l.level]}</span>
              <span className="block text-ink-500 tabular-nums">{l.mastered}/{l.total}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="modes">
        <h2 id="modes" className="mb-2 text-base font-semibold">Lernmodi</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODES.map((m) => {
            const count = m.countKey ? ov[m.countKey] : null;
            return (
              <Link key={m.mode} href={`/lernen/session?mode=${m.mode}&limit=15`} className="rounded-card bg-surface p-4 shadow-card hover:-translate-y-px">
                <div className="flex items-center justify-between"><p className="font-semibold">{m.title}</p>{count !== null && <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium tabular-nums">{count}</span>}</div>
                <p className="mt-1 text-sm text-ink-700">{m.text}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {!ctx.selfStudy && <Leaderboard rows={(board ?? []) as unknown as LeaderboardRow[]} optedIn={me?.leaderboard_opt_in ?? false} />}

      <section aria-labelledby="topics">
        <h2 id="topics" className="mb-2 text-base font-semibold">Nach Themen lernen</h2>
        <Card title="Grundstoff">
          <ul className="divide-y divide-ink-100">
            {basic.map((t) => (
              <li key={t.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/lernen/thema/${t.id}`} className="font-medium hover:underline">{t.name}</Link>
                  <span className="text-xs text-ink-500">{Math.round(t.coverage * 100)} % gesehen · {t.question_count} Fragen</span>
                </div>
                <div className="mt-2"><ProgressBar value={t.mastery * 100} tone={t.weak ? "warn" : "success"} /></div>
              </li>
            ))}
          </ul>
        </Card>
        <Card title={`Zusatzstoff ${ctx.licenseInfo.code}`} className="mt-3">
          <ul className="divide-y divide-ink-100">
            {specific.map((t) => (
              <li key={t.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/lernen/thema/${t.id}`} className="font-medium hover:underline">{t.name}</Link>
                  <span className="text-xs text-ink-500">{Math.round(t.coverage * 100)} % gesehen · {t.question_count} Fragen</span>
                </div>
                <div className="mt-2"><ProgressBar value={t.mastery * 100} tone={t.weak ? "warn" : "success"} /></div>
              </li>
            ))}
          </ul>
        </Card>
      </section>
      <div className="flex flex-wrap gap-4 text-sm"><Link href="/lernen/zeichen" className="text-brand-700 underline">Alle Verkehrszeichen mit Bedeutung</Link><Link href="/lernen/statistik" className="text-brand-700 underline">Lernstatistik und Verlauf</Link></div>
    </div>
  );
}
