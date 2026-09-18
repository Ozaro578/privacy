import type { ReactNode } from "react";
import { cx } from "../cx";
import { readinessBandFor, type ReadinessBandId } from "../tokens";
import { IconArrowUp, IconCheck, IconTarget, IconWarning } from "./icons";
import { ProgressRing } from "./ProgressRing";

export type ReadinessLabels = Record<ReadinessBandId, string>;

/** Deutsche Standardtexte; die App übergibt die Texte aus @fahrpilot/i18n. */
export const DEFAULT_READINESS_LABELS: ReadinessLabels = {
  red: "Noch nicht prüfungsbereit",
  orange: "Auf gutem Weg",
  yellow_green: "Fast bereit",
  green: "Sehr gute Vorbereitung"
};

export interface ReadinessGaugeProps {
  /** Prüfungsreife 0 bis 100. */
  score: number;
  /** Übersteuert das aus dem Score berechnete Band (z. B. wenn die learning-engine es liefert). */
  band?: ReadinessBandId;
  labels?: ReadinessLabels;
  /** Überschrift, z. B. "Prüfungsreife". */
  title?: string;
  /**
   * Pflicht-Disclaimer: Die Prüfungsreife ist eine Einschätzung und keine Garantie.
   * Wird immer sichtbar unter der Anzeige ausgegeben.
   */
  disclaimer: ReactNode;
  /** aria-label für die Gesamtkomponente, z. B. "Prüfungsreife 72 von 100, Stufe: Fast bereit". */
  ariaLabel?: string;
  size?: number;
  className?: string;
}

const BAND_STROKE: Record<ReadinessBandId, string> = {
  red: "text-readiness-red-fill",
  orange: "text-readiness-orange-fill",
  yellow_green: "text-readiness-yellow-green-fill",
  green: "text-readiness-green-fill"
};

const BAND_CHIP: Record<ReadinessBandId, string> = {
  red: "bg-readiness-red-surface text-readiness-red-text",
  orange: "bg-readiness-orange-surface text-readiness-orange-text",
  yellow_green: "bg-readiness-yellow-green-surface text-readiness-yellow-green-text",
  green: "bg-readiness-green-surface text-readiness-green-text"
};

/** Jede Stufe hat ein eigenes Symbol, damit die Stufe nie nur über Farbe kommuniziert wird. */
function BandIcon({ band }: { band: ReadinessBandId }) {
  if (band === "red") return <IconWarning size={16} />;
  if (band === "orange") return <IconArrowUp size={16} />;
  if (band === "yellow_green") return <IconTarget size={16} />;
  return <IconCheck size={16} />;
}

export function ReadinessGauge({ score, band, labels = DEFAULT_READINESS_LABELS, title = "Prüfungsreife", disclaimer, ariaLabel, size = 140, className }: ReadinessGaugeProps) {
  const clamped = Math.round(Math.max(0, Math.min(100, score)));
  const resolvedBand = band ?? readinessBandFor(clamped);
  const bandLabel = labels[resolvedBand];
  const label = ariaLabel ?? `${title} ${clamped} von 100, Stufe: ${bandLabel}`;
  return (
    <div role="group" aria-label={label} className={cx("flex flex-col items-center gap-3 text-center", className)}>
      {title && <h3 className="text-base font-semibold text-fg">{title}</h3>}
      <ProgressRing value={clamped} size={size} strokeWidth={12} label={label} valueText={`${clamped} von 100`} strokeClassName={BAND_STROKE[resolvedBand]}>
        <div className="flex flex-col items-center leading-none">
          <span className="text-3xl font-bold tabular-nums text-fg" aria-hidden="true">{clamped}</span>
          <span className="mt-1 text-xs text-fg-muted" aria-hidden="true">von 100</span>
        </div>
      </ProgressRing>
      <span data-band={resolvedBand} className={cx("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium", BAND_CHIP[resolvedBand])}>
        <BandIcon band={resolvedBand} />
        {bandLabel}
      </span>
      <p className="max-w-prose text-xs leading-normal text-fg-secondary" data-testid="readiness-disclaimer">{disclaimer}</p>
    </div>
  );
}
