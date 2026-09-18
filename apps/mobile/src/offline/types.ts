import type { LearningMode, QuestionState } from "@fahrpilot/learning-engine";

/** Lokal gespiegelte Frage mit aktueller Version und Antworten (Tabelle questions in expo-sqlite). */
export interface LocalQuestion {
  id: string;
  topic_id: string;
  material_kind: "basic" | "class_specific";
  points: number;
  difficulty: number;
  question_kind: string;
  source: string;
  license_codes: string[];
  tags: string[];
  version_id: string;
  locale: string;
  text: string;
  media_path: string | null;
  explanation: string | null;
  mnemonic: string | null;
  legal_reference: string | null;
  legal_basis_date: string | null;
  numeric_answer: number | null;
  numeric_tolerance: number | null;
  answers: LocalAnswer[];
  updated_at: string;
}

export interface LocalAnswer {
  position: number;
  text: string;
  is_correct: boolean;
  explanation: string | null;
}

export interface LocalTopic {
  id: string;
  code: string;
  name: string;
  material_kind: string;
  practical_skill_code: string | null;
  sort_order: number;
}

/** Lokaler Fragezustand. dirty = lokal berechnet, noch nicht vom Server bestätigt. */
export interface LocalQuestionState extends QuestionState {
  question_id: string;
  bookmarked: boolean;
  row_version: number;
  dirty: boolean;
}

/** Zustand, wie ihn POST /api/sync zurückgibt (Server ist die Wahrheit). */
export interface ServerQuestionState extends QuestionState {
  question_id: string;
  bookmarked: boolean;
  row_version: number;
}

export type QueueOperation = "upsert_session" | "insert_attempts";
export type QueueStatus = "pending" | "sent" | "done" | "conflict" | "failed";

export interface QueuedSession {
  client_session_id: string;
  mode: LearningMode;
  topic_id: string | null;
  ended: boolean;
}

export interface QueuedAttempt {
  client_attempt_id: string;
  client_session_id: string;
  question_id: string;
  selected: number[];
  numeric_answer: number | null;
  confidence: 1 | 2 | 3 | null;
  response_ms: number | null;
  answered_at: string;
}

export interface QueueItem {
  id: number;
  operation: QueueOperation;
  table: string;
  payload: QueuedSession | QueuedAttempt;
  idempotency_key: string;
  created_at: string;
  attempts: number;
  last_error: string | null;
  status: QueueStatus;
}

export interface SyncRequestBody {
  sessions: QueuedSession[];
  attempts: QueuedAttempt[];
  states_since: string | null;
}

export interface SyncResponse {
  results: Array<{ client_attempt_id: string; ok: boolean; correct?: boolean; error?: string }>;
  states: ServerQuestionState[];
  streak: { current_days: number; longest_days: number; total_xp: number; level: number; last_active_date: string | null } | null;
  daily_goal: { answered: number; target_questions: number; achieved: boolean } | null;
  server_time: string;
}
