import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../cx";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rect" | "circle";
  /** Bei variant text: Anzahl Zeilen, die letzte kürzer. */
  lines?: number;
  width?: number | string;
  height?: number | string;
}

/** Einzelner Platzhalter in Form des späteren Inhalts. Rein dekorativ (aria-hidden). */
export function Skeleton({ variant = "rect", lines = 1, width, height, className, style, ...rest }: SkeletonProps) {
  const base = "animate-pulse motion-reduce:animate-none bg-muted";
  if (variant === "text") {
    return (
      <div aria-hidden="true" className={cx("flex flex-col gap-2", className)} style={{ width, ...style }} {...rest}>
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className={cx(base, "h-4 rounded-sm")} style={{ width: i === lines - 1 && lines > 1 ? "70%" : "100%" }} />
        ))}
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      className={cx(base, variant === "circle" ? "rounded-full" : "rounded-md", className)}
      style={{ width: width ?? (variant === "circle" ? 40 : "100%"), height: height ?? (variant === "circle" ? 40 : 16), ...style }}
      {...rest}
    />
  );
}

export interface SkeletonGroupProps {
  /** Screenreader-Text, z. B. "Inhalt wird geladen". */
  label?: string;
  children: ReactNode;
  className?: string;
}

/** Fasst Skeletons zusammen und meldet den Ladezustand als status. */
export function SkeletonGroup({ label = "Inhalt wird geladen", children, className }: SkeletonGroupProps) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
