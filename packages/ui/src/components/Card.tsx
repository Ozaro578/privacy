import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cx } from "../cx";

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  as?: ElementType;
  title?: ReactNode;
  /** Element rechts neben dem Titel (Badge, Aktion). */
  action?: ReactNode;
  footer?: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  /** Erhöhte Karte mit Schatten, sonst nur Rahmen. */
  raised?: boolean;
  /** Ganze Karte als Klickfläche (Rahmen reagiert auf Hover/Fokus innerhalb). */
  interactive?: boolean;
  children: ReactNode;
}

const PADDING = { none: "", sm: "p-3", md: "p-4 sm:p-5", lg: "p-6" } as const;

export function Card({ as: Tag = "section", title, action, footer, padding = "md", raised = false, interactive = false, className, children, ...rest }: CardProps) {
  return (
    <Tag
      className={cx(
        "rounded-lg bg-surface text-fg border border-line",
        raised && "shadow-md",
        interactive && "transition-colors duration-200 hover:border-line-strong focus-within:border-focus",
        className
      )}
      {...rest}
    >
      {(title || action) && (
        <header className={cx("flex items-start justify-between gap-3", PADDING[padding], padding !== "none" && "pb-0")}>
          {title && <h2 className="text-lg font-semibold leading-snug">{title}</h2>}
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={PADDING[padding]}>{children}</div>
      {footer && <footer className={cx("border-t border-line-subtle", PADDING[padding], padding !== "none" && "pt-3")}>{footer}</footer>}
    </Tag>
  );
}
