import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../cx";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger" | "accent";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: "sm" | "md";
  icon?: ReactNode;
  children: ReactNode;
}

const TONE: Record<BadgeTone, string> = {
  neutral: "bg-muted text-fg-secondary",
  info: "bg-info-surface text-info-text",
  success: "bg-success-surface text-success-text",
  warning: "bg-warning-surface text-warning-text",
  danger: "bg-danger-surface text-danger-text",
  accent: "bg-accent-surface text-accent-strong"
};

export function Badge({ tone = "neutral", size = "md", icon, className, children, ...rest }: BadgeProps) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap", size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm", TONE[tone], className)} {...rest}>
      {icon && <span aria-hidden="true" className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
