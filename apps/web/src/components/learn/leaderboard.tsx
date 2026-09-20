import { Card } from "@/components/ui";
import { setLeaderboardOptIn } from "@/lib/actions/learning";

export interface LeaderboardRow { rank: number; alias: string; xp: number; is_me: boolean }

/** Wochen-Bestenliste der Fahrschule (freiwillig, nur Vorname plus Initial). */
export function Leaderboard({ rows, optedIn }: { rows: LeaderboardRow[]; optedIn: boolean }) {
  return (
    <Card title="Bestenliste der Woche" action={<span className="text-xs text-ink-500">XP der letzten 7 Tage</span>}>
      {!optedIn ? (
        <form action={setLeaderboardOptIn.bind(null, true)} className="space-y-2 text-sm">
          <p className="text-ink-700">Freiwillig: Zeige deinen Vornamen mit Initial und deine Wochen-XP den anderen Lernenden deiner Fahrschule. Du kannst jederzeit aussteigen.</p>
          <button type="submit" className="min-h-10 rounded-full border border-brand-500 bg-brand-50 px-4 text-sm font-medium text-brand-700">Mitmachen</button>
        </form>
      ) : rows.length === 0 ? <p className="text-sm text-ink-500">Noch keine XP in dieser Woche. Leg los!</p> : (
        <ol className="divide-y divide-ink-100 text-sm">
          {rows.map((r) => (
            <li key={r.rank} className={`flex items-center justify-between py-2 ${r.is_me ? "font-semibold text-brand-700" : ""}`}>
              <span><span className="mr-2 inline-block w-6 text-center tabular-nums">{r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : r.rank}</span>{r.alias}{r.is_me ? " (du)" : ""}</span>
              <span className="tabular-nums">{r.xp} XP</span>
            </li>
          ))}
        </ol>
      )}
      {optedIn && <form action={setLeaderboardOptIn.bind(null, false)} className="mt-2"><button type="submit" className="text-xs text-ink-500 underline">Nicht mehr anzeigen</button></form>}
    </Card>
  );
}
