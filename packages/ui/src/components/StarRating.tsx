"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { cx } from "../cx";
import { IconStar } from "./icons";

export interface StarRatingProps {
  /** 0 bedeutet keine Bewertung. */
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  /** Beschriftung der Gruppe, z. B. "Spurhalten bewerten". */
  label: string;
  /** Beschriftung eines Sterns, Standard "{n} von {max} Sternen". */
  getStarLabel?: (n: number, max: number) => string;
  readOnly?: boolean;
  disabled?: boolean;
  size?: "md" | "lg";
  className?: string;
}

/**
 * Sterne als Radiogruppe: Pfeiltasten wählen den nächsten oder vorherigen Stern, Home/End das
 * Minimum oder Maximum. Jeder Stern ist ein Touch-Ziel von mindestens 44 px.
 */
export function StarRating({ value, max = 5, onChange, label, getStarLabel = (n, m) => `${n} von ${m} Sternen`, readOnly = false, disabled = false, size = "md", className }: StarRatingProps) {
  const id = useId();
  const groupRef = useRef<HTMLDivElement>(null);
  const clamped = Math.max(0, Math.min(max, Math.round(value)));
  const iconSize = size === "lg" ? 32 : 24;

  if (readOnly) {
    return (
      <div role="img" aria-label={`${label}: ${getStarLabel(clamped, max)}`} className={cx("inline-flex gap-0.5 text-accent-strong", className)}>
        {Array.from({ length: max }, (_, i) => <IconStar key={i} size={iconSize} filled={i < clamped} className={i < clamped ? "" : "text-line-strong"} />)}
      </div>
    );
  }

  const set = (next: number) => {
    if (disabled) return;
    onChange?.(Math.max(0, Math.min(max, next)));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const rtl = groupRef.current ? getComputedStyle(groupRef.current).direction === "rtl" : false;
    const up = rtl ? ["ArrowLeft", "ArrowUp"] : ["ArrowRight", "ArrowUp"];
    const down = rtl ? ["ArrowRight", "ArrowDown"] : ["ArrowLeft", "ArrowDown"];
    let next: number | null = null;
    if (up.includes(event.key)) next = Math.min(max, clamped + 1);
    else if (down.includes(event.key)) next = Math.max(1, clamped - 1);
    else if (event.key === "Home") next = 1;
    else if (event.key === "End") next = max;
    if (next === null) return;
    event.preventDefault();
    set(next);
    groupRef.current?.querySelector<HTMLButtonElement>(`[data-star="${next}"]`)?.focus();
  };

  return (
    <div ref={groupRef} role="radiogroup" aria-label={label} aria-disabled={disabled || undefined} onKeyDown={onKeyDown} className={cx("inline-flex", className)}>
      {Array.from({ length: max }, (_, i) => {
        const n = i + 1;
        const checked = n === clamped;
        const filled = n <= clamped;
        const focusable = clamped === 0 ? n === 1 : checked;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            id={`${id}-${n}`}
            data-star={n}
            aria-checked={checked}
            aria-label={getStarLabel(n, max)}
            tabIndex={focusable ? 0 : -1}
            disabled={disabled}
            onClick={() => set(n)}
            className={cx(
              "flex h-touch w-touch items-center justify-center rounded-md transition-colors duration-120 motion-reduce:transition-none",
              "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus",
              filled ? "text-accent-strong" : "text-line-strong hover:text-accent-strong",
              disabled && "cursor-not-allowed opacity-60"
            )}
          >
            <IconStar size={iconSize} filled={filled} />
          </button>
        );
      })}
    </div>
  );
}
