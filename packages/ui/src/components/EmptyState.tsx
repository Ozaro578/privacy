import type { ReactNode } from "react";
import { cx } from "../cx";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Eindeutige nächste Aktion; leere Zustände ohne Aktion sind laut IA nicht vorgesehen. */
  action: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, secondaryAction, className }: EmptyStateProps) {
  return (
    <div className={cx("flex flex-col items-center gap-3 rounded-lg border border-dashed border-line bg-surface px-6 py-10 text-center", className)}>
      {icon && <div className="text-fg-muted" aria-hidden="true">{icon}</div>}
      <h2 className="text-lg font-semibold text-fg">{title}</h2>
      {description && <p className="max-w-prose text-sm text-fg-secondary">{description}</p>}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        {action}
        {secondaryAction}
      </div>
    </div>
  );
}
