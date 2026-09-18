import type { ReactNode } from "react";
import { cx } from "../cx";

export interface StatTileProps {
  label: string;
  value: ReactNode;
  /** Zusatzinfo unter dem Wert, z. B. "seit letzter Woche". */
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger";
  /** Ganze Kachel als Link. */
  href?: string;
  className?: string;
}

const TONE = {
  neutral: "text-fg",
  primary: "text-primary",
  success: "text-success-text",
  warning: "text-warning-text",
  danger: "text-danger-text"
} as const;

export function StatTile({ label, value, hint, icon, tone = "neutral", href, className }: StatTileProps) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-fg-secondary">{label}</span>
        {icon && <span className="text-fg-muted" aria-hidden="true">{icon}</span>}
      </div>
      <span className={cx("mt-2 block text-2xl font-bold tabular-nums leading-tight", TONE[tone])}>{value}</span>
      {hint && <span className="mt-1 block text-xs text-fg-muted">{hint}</span>}
    </>
  );
  const classes = cx("block rounded-lg border border-line bg-surface p-4", href && "transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus", className);
  if (href) return <a href={href} className={classes}>{body}</a>;
  return <div className={classes}>{body}</div>;
}
