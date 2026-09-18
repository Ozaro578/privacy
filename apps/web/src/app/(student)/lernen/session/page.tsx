import Link from "next/link";
import { startLearningSession } from "@/lib/actions/learning";
import { SessionRunner } from "@/components/learn/session-runner";
import { Alert, btn } from "@/components/ui";
import type { LearningMode } from "@fahrpilot/learning-engine";

export const metadata = { title: "Lernsession" };

export default async function SessionPage({ searchParams }: { searchParams: Promise<{ mode?: string; topic?: string; limit?: string }> }) {
  const p = await searchParams;
  const mode = (p.mode ?? "review") as LearningMode;
  const limit = Math.min(50, Math.max(5, Number(p.limit ?? 10) || 10));
  try {
    const session = await startLearningSession({ mode, limit, ...(p.topic ? { topicId: p.topic } : {}) });
    return <SessionRunner key={session.sessionId} session={session} />;
  } catch (e) {
    return (
      <div className="space-y-4">
        <Alert tone="info">{e instanceof Error ? e.message : "Session konnte nicht gestartet werden."}</Alert>
        <Link href="/lernen" className={btn.secondary}>Zurück</Link>
      </div>
    );
  }
}
