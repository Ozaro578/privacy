import type { ApiError } from "@briefklar/shared";

export type ApiErrorCode = ApiError["error"]["code"];

/** HTTP-Status je Fehlercode */
export const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  no_image: 400,
  too_many_images: 400,
  image_too_large: 413,
  unsupported_media_type: 415,
  invalid_language: 400,
  rate_limited: 429,
  upstream_error: 502,
  refused: 422,
  internal_error: 500,
};

/** Deutsche, nutzerfreundliche Standardmeldungen je Fehlercode */
export const MESSAGE_BY_CODE: Record<ApiErrorCode, string> = {
  no_image: "Bitte mindestens ein Foto oder eine PDF-Datei des Briefes hochladen.",
  too_many_images: "Zu viele Seiten. Bitte höchstens 4 Bilder pro Anfrage hochladen.",
  image_too_large: "Eine Datei ist zu groß. Bitte Bilder mit höchstens 8 MB hochladen.",
  unsupported_media_type: "Dieses Dateiformat wird nicht unterstützt. Bitte JPEG, PNG, WebP oder PDF verwenden.",
  invalid_language: "Diese Sprache wird nicht unterstützt.",
  rate_limited: "Zu viele Anfragen in kurzer Zeit. Bitte in ein paar Minuten noch einmal versuchen.",
  upstream_error: "Der Brief konnte gerade nicht ausgewertet werden. Bitte später noch einmal versuchen.",
  refused: "Dieser Brief konnte nicht ausgewertet werden. Bitte versuche es mit einer anderen Aufnahme oder wende dich an eine Beratungsstelle.",
  internal_error: "Ein unerwarteter Fehler ist aufgetreten. Bitte später noch einmal versuchen.",
};

export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  /** Technische Ursache – nur für Logs, nie an den Client */
  override readonly cause?: unknown;

  constructor(code: ApiErrorCode, message?: string, options?: { cause?: unknown; status?: number }) {
    super(message ?? MESSAGE_BY_CODE[code]);
    this.name = "AppError";
    this.code = code;
    this.status = options?.status ?? STATUS_BY_CODE[code];
    this.cause = options?.cause;
  }

  toBody(): ApiError {
    return { error: { code: this.code, message: this.message } };
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
