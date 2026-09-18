import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cx } from "../cx";

export interface VisuallyHiddenProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /** Sichtbar, sobald das Element Fokus erhält (z. B. "Zum Inhalt springen"). */
  focusable?: boolean;
  children: ReactNode;
}

/** Nur für Screenreader sichtbarer Text. */
export function VisuallyHidden({ as: Tag = "span", focusable = false, className, children, ...rest }: VisuallyHiddenProps) {
  return (
    <Tag className={cx(focusable ? "sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-surface focus:p-3 focus:text-fg" : "sr-only", className)} {...rest}>
      {children}
    </Tag>
  );
}
