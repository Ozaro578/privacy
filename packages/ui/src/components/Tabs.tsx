"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "../cx";

export interface TabItem {
  id: string;
  label: ReactNode;
  panel: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  /** Kontrollierter Modus. */
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** aria-label der Tab-Liste, z. B. "Reiter". */
  label: string;
  /** Tabs füllen die Breite gleichmäßig (mobil). */
  stretch?: boolean;
  className?: string;
}

/** Tabs mit Roving Tabindex: Pfeiltasten wechseln, Home/End springen, RTL wird berücksichtigt. */
export function Tabs({ items, value, defaultValue, onChange, label, stretch = false, className }: TabsProps) {
  const baseId = useId();
  const firstEnabled = items.find((item) => !item.disabled)?.id ?? items[0]?.id ?? "";
  const [internal, setInternal] = useState<string>(defaultValue ?? firstEnabled);
  const active = value ?? internal;
  const listRef = useRef<HTMLDivElement>(null);

  const select = (id: string) => {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const enabled = items.filter((item) => !item.disabled);
    const index = enabled.findIndex((item) => item.id === active);
    if (index === -1 || enabled.length === 0) return;
    const rtl = listRef.current ? getComputedStyle(listRef.current).direction === "rtl" : false;
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const backward = rtl ? "ArrowRight" : "ArrowLeft";
    let next: number | null = null;
    if (event.key === forward) next = (index + 1) % enabled.length;
    else if (event.key === backward) next = (index - 1 + enabled.length) % enabled.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = enabled.length - 1;
    if (next === null) return;
    event.preventDefault();
    const target = enabled[next];
    if (!target) return;
    select(target.id);
    listRef.current?.querySelector<HTMLButtonElement>(`[data-tab-id="${target.id}"]`)?.focus();
  };

  return (
    <div className={className}>
      <div ref={listRef} role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex gap-1 border-b border-line">
        {items.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              data-tab-id={item.id}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => select(item.id)}
              className={cx(
                "-mb-px min-h-touch px-4 text-sm font-medium transition-colors duration-200 motion-reduce:transition-none border-b-2",
                "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus",
                selected ? "border-primary text-primary" : "border-transparent text-fg-secondary hover:text-fg hover:border-line-strong",
                "disabled:text-on-disabled disabled:cursor-not-allowed",
                stretch && "flex-1"
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-tab-${item.id}`}
          hidden={item.id !== active}
          tabIndex={0}
          className="pt-4 focus-visible:outline-2 focus-visible:outline-focus"
        >
          {item.id === active && item.panel}
        </div>
      ))}
    </div>
  );
}
