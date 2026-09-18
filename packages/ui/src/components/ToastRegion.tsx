import type { ReactNode } from "react";
import { cx } from "../cx";
import { IconCheck, IconCross, IconInfo, IconWarning } from "./icons";

export type ToastTone = "info" | "success" | "warning" | "danger";

export interface Toast {
  id: string;
  tone?: ToastTone;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export interface ToastRegionProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
  /** aria-label der Region, z. B. "Benachrichtigungen". */
  label: string;
  dismissLabel?: string;
  /** Position auf großen Bildschirmen; mobil immer unten mittig über der Tab-Leiste. */
  placement?: "bottom" | "top";
  className?: string;
}

const TONE: Record<ToastTone, { border: string; icon: ReactNode; iconClass: string }> = {
  info: { border: "border-s-info-fill", icon: <IconInfo />, iconClass: "text-info-text" },
  success: { border: "border-s-success-fill", icon: <IconCheck />, iconClass: "text-success-text" },
  warning: { border: "border-s-warning-fill", icon: <IconWarning />, iconClass: "text-warning-text" },
  danger: { border: "border-s-danger-fill", icon: <IconWarning />, iconClass: "text-danger-text" }
};

/**
 * Live-Region für kurze Rückmeldungen. Die Region bleibt dauerhaft im DOM (auch leer), damit
 * Screenreader neue Einträge zuverlässig ansagen. Ton danger und warning werden assertiv gemeldet.
 */
export function ToastRegion({ toasts, onDismiss, label, dismissLabel = "Ausblenden", placement = "bottom", className }: ToastRegionProps) {
  return (
    <div
      role="region"
      aria-label={label}
      aria-live="polite"
      aria-relevant="additions text"
      className={cx("pointer-events-none fixed inset-x-4 z-(--klar-z-toast) flex flex-col gap-2 sm:inset-x-auto sm:end-4 sm:w-96", placement === "bottom" ? "bottom-20 sm:bottom-4" : "top-4", className)}
    >
      {toasts.map((toast) => {
        const tone = toast.tone ?? "info";
        const t = TONE[tone];
        return (
          <div
            key={toast.id}
            role={tone === "danger" || tone === "warning" ? "alert" : "status"}
            className={cx("pointer-events-auto flex gap-3 rounded-lg border border-line border-s-4 bg-raised p-4 text-fg shadow-lg", t.border)}
          >
            <span className={cx("mt-0.5 shrink-0", t.iconClass)} aria-hidden="true">{t.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{toast.title}</p>
              {toast.description && <p className="mt-0.5 text-sm text-fg-secondary">{toast.description}</p>}
              {toast.action && <div className="mt-2">{toast.action}</div>}
            </div>
            <button type="button" onClick={() => onDismiss(toast.id)} aria-label={dismissLabel} className="-m-2 flex h-touch w-touch shrink-0 items-center justify-center rounded-md text-fg-secondary hover:bg-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-focus">
              <IconCross size={18} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
