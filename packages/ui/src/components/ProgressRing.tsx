import type { ReactNode } from "react";
import { cx } from "../cx";
import { clampPercent } from "./ProgressBar";

export interface ProgressRingProps {
  value: number;
  min?: number;
  max?: number;
  /** Durchmesser in px. */
  size?: number;
  strokeWidth?: number;
  label: string;
  valueText?: string;
  /** Tailwind-Klasse für die Farbe des Fortschrittsbogens, z. B. "text-primary". */
  strokeClassName?: string;
  /** Tailwind-Klasse für die Spur. */
  trackClassName?: string;
  /** Inhalt in der Mitte des Rings (Zahl, Symbol). */
  children?: ReactNode;
  className?: string;
}

export function ProgressRing({ value, min = 0, max = 100, size = 120, strokeWidth = 10, label, valueText, strokeClassName = "text-primary", trackClassName = "text-muted", children, className }: ProgressRingProps) {
  const percent = clampPercent(value, min, max);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  return (
    <div className={cx("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="progressbar"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Math.max(min, Math.min(max, value))}
        aria-valuetext={valueText}
        aria-label={label}
        className="-rotate-90"
      >
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={trackClassName} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cx("transition-[stroke-dashoffset] duration-500 ease-standard motion-reduce:transition-none", strokeClassName)}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}
