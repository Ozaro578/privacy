import type { ReactNode } from "react";
import { cx } from "../cx";
import { IconCheck, IconCross, IconInfo, IconWarning } from "./icons";

export type AlertTone = "info" | "success" | "warning" | "danger";

export interface AlertProps {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  /** Aktionen unter dem Text, z. B. "Erneut laden". */
  action?: ReactNode;
  /** Bei Angabe wird ein Schließen-Button gerendert. */
  onDismiss?: () => void;
  dismissLabel?: string;
  /** Standard: danger und warning als role="alert", sonst role="status". */
  role?: "alert" | "status" | "none";
  className?: string;
}

const TONE: Record<AlertTone, { box: string; icon: ReactNode; prefix: string }> = {
  info: { box: "bg-info-surface text-info-text border-info-fill/30", icon: <IconInfo />, prefix: "Hinweis:" },
  success: { box: "bg-success-surface text-success-text border-success-fill/30", icon: <IconCheck />, prefix: "Erfolg:" },
  warning: { box: "bg-warning-surface text-warning-text border-warning-fill/30", icon: <IconWarning />, prefix: "Warnung:" },
  danger: { box: "bg-danger-surface text-danger-text border-danger-fill/30", icon: <IconWarning />, prefix: "Fehler:" }
};

export function Alert({ tone = "info", title, children, action, onDismiss, dismissLabel = "Ausblenden", role, className }: AlertProps) {
  const resolvedRole = role ?? (tone === "danger" || tone === "warning" ? "alert" : "status");
  const t = TONE[tone];
  return (
    <div role={resolvedRole === "none" ? undefined : resolvedRole} className={cx("flex gap-3 rounded-lg border p-4", t.box, className)}>
      <span className="mt-0.5 shrink-0" aria-hidden="true">{t.icon}</span>
      <div className="min-w-0 flex-1">
        <span className="sr-only">{t.prefix} </span>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cx("text-sm", title ? "mt-1" : undefined)}>{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label={dismissLabel} className="-m-2 flex h-touch w-touch shrink-0 items-center justify-center rounded-md hover:bg-surface/60 focus-visible:outline-2 focus-visible:outline-focus">
          <IconCross size={18} />
        </button>
      )}
    </div>
  );
}
