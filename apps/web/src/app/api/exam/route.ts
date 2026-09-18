import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createExamSimulation, submitExamSimulation } from "@/lib/actions/exam";
import { getSession } from "@/lib/auth/session";
import { getBearerAuthFromRequest } from "@/lib/auth/bearer";

/**
 * Prüfungssimulation für die Mobile-App. Simulationen laufen vollständig serverseitig
 * (Regelversion einfrieren, Fragen ziehen, Bewertung, Analyse, Prüfungsreife).
 * POST { action: "start" }  -> Simulation-ID, Zeitlimit und Fragen
 * POST { action: "submit", simulationId, answers } -> bewertet nach dem eingefrorenen Regel-Snapshot
 * Auth: Authorization: Bearer <access_token> (oder Session-Cookie des Schüler-Webs).
 */
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start") }),
  z.object({
    action: z.literal("submit"),
    simulationId: z.string().uuid(),
    answers: z.array(z.object({ questionId: z.string().uuid(), selected: z.array(z.number().int()).default([]), numericAnswer: z.number().nullable().default(null), unsure: z.boolean().default(false), responseMs: z.number().int().nullable().default(null) })).max(200),
  }),
]);

export async function POST(request: NextRequest) {
  const bearer = await getBearerAuthFromRequest();
  const session = bearer ? bearer.session : await getSession();
  if (!session || session.role !== "student") return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten", issues: parsed.error.issues }, { status: 400 });
  try {
    if (parsed.data.action === "start") {
      const sim = await createExamSimulation();
      return NextResponse.json(sim);
    }
    const result = await submitExamSimulation({ simulationId: parsed.data.simulationId, answers: parsed.data.answers });
    return NextResponse.json({ id: result.id, submitted: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Fehler" }, { status: 400 });
  }
}
