import { AnthropicProvider, DEFAULT_COACH_MODEL, DEFAULT_FAST_MODEL } from "./providers/anthropic";
import { WhisperHttpTranscriptionProvider } from "./providers/whisper";
import type { AiProvider, TranscriptionProvider } from "./types";

export interface AiEnv {
  ANTHROPIC_API_KEY?: string | undefined;
  AI_MODEL_COACH?: string | undefined;
  AI_MODEL_FAST?: string | undefined;
  STT_ENDPOINT?: string | undefined;
  STT_API_KEY?: string | undefined;
  STT_MODEL?: string | undefined;
}

export interface AiServices {
  /** Dialogmodell (coachAnswer, explainQuestion, describeTrafficSituation); null ohne API-Key. */
  coach: AiProvider | null;
  /** Schnelles Modell für Klassifikation und Strukturierung; null ohne API-Key. */
  fast: AiProvider | null;
  /** Speech-to-Text; null ohne STT-Konfiguration. */
  transcription: TranscriptionProvider | null;
  models: { coach: string; fast: string };
}

/**
 * Baut die Provider ausschließlich aus Umgebungsvariablen. Nur serverseitig aufrufen.
 * Fehlende Keys führen nicht zu einem Fehler, sondern zu null-Providern, damit regelbasierte Pfade weiter funktionieren.
 */
export function createAiServices(env: AiEnv = process.env as AiEnv): AiServices {
  const models = { coach: env.AI_MODEL_COACH || DEFAULT_COACH_MODEL, fast: env.AI_MODEL_FAST || DEFAULT_FAST_MODEL };
  const apiKey = env.ANTHROPIC_API_KEY;
  const coach = apiKey ? new AnthropicProvider({ apiKey, model: models.coach }) : null;
  const fast = apiKey ? new AnthropicProvider({ apiKey, model: models.fast, maxTokens: 2048 }) : null;
  const transcription =
    env.STT_ENDPOINT && env.STT_API_KEY
      ? new WhisperHttpTranscriptionProvider({ endpoint: env.STT_ENDPOINT, apiKey: env.STT_API_KEY, ...(env.STT_MODEL ? { model: env.STT_MODEL } : {}) })
      : null;
  return { coach, fast, transcription, models };
}
