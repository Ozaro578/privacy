import { cx } from "../cx";

export type ProgressTone = "primary" | "success" | "warning" | "danger" | "accent";

export interface ProgressBarProps {
  /** Aktueller Wert zwischen min und max. */
  value: number;
  min?: number;
  max?: number;
  /** Sichtbare Beschriftung; wird als aria-label verwendet, wenn kein labelledBy gesetzt ist. */
  label?: string;
  /** Text rechts neben der Beschriftung, z. B. "12 von 30". */
  valueText?: string;
  tone?: ProgressTone;
  size?: "sm" | "md";
  className?: string;
  id?: string;
}

const FILL: Record<ProgressTone, string> = {
  primary: "bg-primary",
  success: "bg-success-fill",
  warning: "bg-warning-fill",
  danger: "bg-danger-fill",
  accent: "bg-accent"
};

export function clampPercent(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

export function ProgressBar({ value, min = 0, max = 100, label, valueText, tone = "primary", size = "md", className, id }: ProgressBarProps) {
  const percent = clampPercent(value, min, max);
  return (
    <div className={cx("flex flex-col gap-1", className)}>
      {(label || valueText) && (
        <div className="flex items-baseline justify-between gap-3 text-sm">
          {label && <span className="font-medium text-fg">{label}</span>}
          {valueText && <span className="text-fg-secondary tabular-nums">{valueText}</span>}
        </div>
      )}
      <div
        id={id}
        role="progressbar"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Math.max(min, Math.min(max, value))}
        aria-valuetext={valueText}
        aria-label={label}
        className={cx("w-full overflow-hidden rounded-full bg-muted", size === "sm" ? "h-1.5" : "h-2.5")}
      >
        <div className={cx("h-full rounded-full transition-[width] duration-300 ease-standard motion-reduce:transition-none", FILL[tone])} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
