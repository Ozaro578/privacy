import type { LocalQuestionState, ServerQuestionState } from "./types";

/**
 * Konfliktregel: Der Server gewinnt. Einzige Ausnahme ist ein lokaler Zustand, der aus noch nicht
 * bestätigten Versuchen stammt (dirty) und jünger ist als der Serverzustand. Er bleibt bis zum
 * nächsten erfolgreichen Sync erhalten, damit sofortiges Feedback nicht zurückspringt.
 */
export function mergeState(local: LocalQuestionState | undefined, server: ServerQuestionState): LocalQuestionState {
  const fromServer: LocalQuestionState = { ...server, dirty: false };
  if (!local) return fromServer;
  if (!local.dirty) return fromServer;
  const localTs = local.last_answered_at ?? "";
  const serverTs = server.last_answered_at ?? "";
  if (serverTs >= localTs) return fromServer;
  // lokal jünger und noch unbestätigt: Merken-Flag und row_version trotzdem vom Server übernehmen
  return { ...local, bookmarked: server.bookmarked, row_version: Math.max(local.row_version, server.row_version) };
}

export interface MergeSummary {
  applied: number;
  keptLocal: number;
  merged: Map<string, LocalQuestionState>;
}

export function mergeStates(local: Map<string, LocalQuestionState>, server: ServerQuestionState[]): MergeSummary {
  const merged = new Map(local);
  let applied = 0, keptLocal = 0;
  for (const s of server) {
    const before = merged.get(s.question_id);
    const next = mergeState(before, s);
    if (before && before.dirty && next.dirty) keptLocal++; else applied++;
    merged.set(s.question_id, next);
  }
  return { applied, keptLocal, merged };
}

/** Nach vollständig bestätigtem Sync sind alle lokalen Zustände, deren Versuche verbucht wurden, nicht mehr dirty. */
export function clearDirty(states: Map<string, LocalQuestionState>, confirmedQuestionIds: Iterable<string>): number {
  let n = 0;
  for (const id of confirmedQuestionIds) {
    const s = states.get(id);
    if (s?.dirty) { states.set(id, { ...s, dirty: false }); n++; }
  }
  return n;
}
