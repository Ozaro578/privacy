import Link from "next/link";
import { startLearningSession } from "@/lib/actions/learning";
import { SessionRunner } from "@/components/learn/session-runner";
import { Alert, btn } from "@/components/ui";
import type { LearningMode } from "@fahrpilot/learning-engine";

export const metadata = { title: "Lernsession" };

export default async function SessionPage({ searchParams }: { searchParams: Promise<{ mode?: string; topic?: string; limit?: string; challenge?: string }> }) {
  const p = await searchParams;
  const mode = (p.mode ?? "review") as LearningMode;
  const limit = Math.min(50, Math.max(5, Number(p.limit ?? 10) || 10));
  const started = await startLearningSession({ mode, limit, challenge: p.challenge === "1", ...(p.topic ? { topicId: p.topic } : {}) }).then((session) => ({ session, message: null as string | null })).catch((e: unknown) => ({ session: null, message: e instanceof Error ? e.message : "Session konnte nicht gestartet werden." }));
  if (!started.session) {
    return (
      <div className="space-y-4">
        <Alert tone="info">{started.message}</Alert>
        <Link href="/lernen" className={btn.secondary}>Zurück</Link>
      </div>
    );
  }
  return <SessionRunner key={started.session.sessionId} session={started.session} />;
}
