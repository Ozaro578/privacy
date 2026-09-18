"use client";

import { useEffect, useId, useRef, type KeyboardEvent, type MouseEvent, type ReactNode, type SyntheticEvent } from "react";
import { cx } from "../cx";
import { IconCross } from "./icons";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Aktionen, meist Buttons; rechtsbündig (logisch: end). */
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Klick auf den Hintergrund schließt (Standard: ja). Für bestätigungspflichtige Dialoge abschalten. */
  dismissOnBackdrop?: boolean;
  closeLabel?: string;
  /** Element, das beim Öffnen Fokus erhält; sonst das erste fokussierbare Element. */
  initialFocusRef?: { current: HTMLElement | null };
  className?: string;
}

const SIZE = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" } as const;

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.hasAttribute("aria-hidden") && el.getClientRects !== undefined);
}

/**
 * Modaler Dialog auf Basis des nativen dialog-Elements: Escape schließt (über cancel),
 * Fokus bleibt im Dialog (nativ und zusätzlich per Tab-Handling), Fokus kehrt beim Schließen zurück.
 */
export function Dialog({ open, onClose, title, description, children, footer, size = "md", dismissOnBackdrop = true, closeLabel = "Dialog schließen", initialFocusRef, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const id = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      if (el.open) return;
      restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (typeof el.showModal === "function") el.showModal();
      else el.setAttribute("open", "");
      const target = initialFocusRef?.current ?? getFocusable(el).find((node) => !node.hasAttribute("data-dialog-close")) ?? el;
      target.focus();
    } else if (el.open) {
      if (typeof el.close === "function") el.close();
      else el.removeAttribute("open");
      restoreRef.current?.focus();
    }
  }, [open, initialFocusRef]);

  const onCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onClose();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    const el = ref.current;
    if (!el) return;
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = getFocusable(el);
    if (focusable.length === 0) {
      event.preventDefault();
      el.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    const current = document.activeElement;
    if (event.shiftKey && (current === first || current === el)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const onBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (dismissOnBackdrop && event.target === ref.current) onClose();
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      onCancel={onCancel}
      onKeyDown={onKeyDown}
      onClick={onBackdropClick}
      tabIndex={-1}
      className={cx(
        "m-auto w-[calc(100%-2rem)] rounded-xl border border-line bg-surface p-0 text-fg shadow-lg backdrop:bg-overlay",
        "open:animate-[dialog-in_var(--klar-duration-base)_var(--klar-ease-enter)] motion-reduce:animate-none",
        SIZE[size],
        className
      )}
    >
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 id={`${id}-title`} className="text-xl font-semibold leading-snug">{title}</h2>
            {description && <p id={`${id}-description`} className="mt-1 text-sm text-fg-secondary">{description}</p>}
          </div>
          <button type="button" data-dialog-close onClick={onClose} aria-label={closeLabel} className="-me-2 -mt-2 flex h-touch w-touch shrink-0 items-center justify-center rounded-md text-fg-secondary hover:bg-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-focus">
            <IconCross />
          </button>
        </header>
        {children && <div className="text-base">{children}</div>}
        {footer && <footer className="flex flex-wrap justify-end gap-2 pt-2">{footer}</footer>}
      </div>
    </dialog>
  );
}
