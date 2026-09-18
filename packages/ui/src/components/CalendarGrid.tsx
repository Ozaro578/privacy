import type { CSSProperties, ReactNode } from "react";
import { cx } from "../cx";

export type CalendarView = "day" | "week" | "month";

/* ---------------------------------------------------------------------------------------- */
/* Datumshelfer (lokale Zeit; die App übergibt Daten bereits in Europe/Berlin)                */
/* ---------------------------------------------------------------------------------------- */

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Montag als Wochenbeginn (weekStartsOn = 1), sonntag = 0. */
export function startOfWeek(date: Date, weekStartsOn = 1): Date {
  const day = startOfDay(date);
  const diff = (day.getDay() - weekStartsOn + 7) % 7;
  return addDays(day, -diff);
}

export function getWeekDays(date: Date, weekStartsOn = 1): Date[] {
  const start = startOfWeek(date, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Volle Wochen eines Monats (immer 6 Zeilen à 7 Tage, damit das Raster nicht springt). */
export function getMonthGridDays(year: number, monthIndex: number, weekStartsOn = 1): Date[] {
  const first = new Date(year, monthIndex, 1);
  const start = startOfWeek(first, weekStartsOn);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** Wandelt eine Uhrzeit in einen Versatz (px) innerhalb eines Zeitrasters um. */
export function timeToOffset(date: Date, startHour: number, hourHeight: number): number {
  const minutes = date.getHours() * 60 + date.getMinutes() - startHour * 60;
  return (minutes / 60) * hourHeight;
}

/* ---------------------------------------------------------------------------------------- */
/* Monatsraster                                                                             */
/* ---------------------------------------------------------------------------------------- */

export interface CalendarDayInfo {
  date: Date;
  isToday: boolean;
  isOutsideMonth: boolean;
  isSelected: boolean;
}

export interface CalendarMonthGridProps {
  year: number;
  /** 0 = Januar. */
  month: number;
  today?: Date;
  selected?: Date;
  weekStartsOn?: 0 | 1;
  /** Wochentag-Kopf, 7 Einträge in Rasterreihenfolge. */
  weekdayLabels: string[];
  label: string;
  renderDay: (info: CalendarDayInfo) => ReactNode;
  className?: string;
}

export function CalendarMonthGrid({ year, month, today = new Date(), selected, weekStartsOn = 1, weekdayLabels, label, renderDay, className }: CalendarMonthGridProps) {
  const days = getMonthGridDays(year, month, weekStartsOn);
  return (
    <div role="grid" aria-label={label} className={cx("grid grid-cols-7 overflow-hidden rounded-lg border border-line bg-surface", className)}>
      <div role="row" className="contents">
        {weekdayLabels.map((weekday, i) => (
          <div key={i} role="columnheader" className="border-b border-line bg-muted px-2 py-2 text-center text-xs font-medium uppercase tracking-wide text-fg-secondary">
            {weekday}
          </div>
        ))}
      </div>
      {Array.from({ length: 6 }, (_, row) => (
        <div key={row} role="row" className="contents">
          {days.slice(row * 7, row * 7 + 7).map((date) => {
            const info: CalendarDayInfo = { date, isToday: isSameDay(date, today), isOutsideMonth: date.getMonth() !== month, isSelected: selected ? isSameDay(date, selected) : false };
            return (
              <div
                key={date.toISOString()}
                role="gridcell"
                aria-selected={info.isSelected || undefined}
                aria-current={info.isToday ? "date" : undefined}
                className={cx("min-h-touch border-b border-e border-line-subtle p-1 text-sm", info.isOutsideMonth && "bg-canvas text-fg-muted", info.isToday && "bg-accent-surface")}
              >
                {renderDay(info)}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------------------- */
/* Tages- und Wochenraster                                                                  */
/* ---------------------------------------------------------------------------------------- */

export interface CalendarEventLayout {
  /** Inline-Style für absolute Positionierung innerhalb der Spalte. */
  style: CSSProperties;
}

export interface CalendarTimeGridProps {
  /** Ein Tag (Tagesansicht) oder sieben Tage (Wochenansicht). */
  days: Date[];
  startHour?: number;
  endHour?: number;
  /** Höhe einer Stunde in px. */
  hourHeight?: number;
  today?: Date;
  label: string;
  renderColumnHeader: (date: Date) => ReactNode;
  formatHour?: (hour: number) => string;
  /** Inhalt einer Tagesspalte; layout() liefert die Position für ein Ereignis. */
  renderColumn: (date: Date, layout: (start: Date, end: Date) => CalendarEventLayout) => ReactNode;
  className?: string;
}

export function CalendarTimeGrid({ days, startHour = 6, endHour = 22, hourHeight = 56, today = new Date(), label, renderColumnHeader, formatHour = (h) => `${String(h).padStart(2, "0")}:00`, renderColumn, className }: CalendarTimeGridProps) {
  const hours = Array.from({ length: Math.max(0, endHour - startHour) }, (_, i) => startHour + i);
  const totalHeight = hours.length * hourHeight;
  const layout = (start: Date, end: Date): CalendarEventLayout => {
    const top = Math.max(0, timeToOffset(start, startHour, hourHeight));
    const bottom = Math.min(totalHeight, timeToOffset(end, startHour, hourHeight));
    return { style: { position: "absolute", insetInlineStart: 2, insetInlineEnd: 2, top, height: Math.max(hourHeight / 4, bottom - top) } };
  };
  return (
    <div role="grid" aria-label={label} className={cx("overflow-auto rounded-lg border border-line bg-surface", className)}>
      <div className="grid min-w-full" style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }}>
        <div role="row" className="contents">
          <div role="columnheader" className="sticky top-0 z-10 border-b border-line bg-muted" aria-label="Uhrzeit" />
          {days.map((date) => (
            <div key={date.toISOString()} role="columnheader" aria-current={isSameDay(date, today) ? "date" : undefined} className={cx("sticky top-0 z-10 border-b border-s border-line bg-muted px-2 py-2 text-center text-sm font-medium", isSameDay(date, today) && "text-primary")}>
              {renderColumnHeader(date)}
            </div>
          ))}
        </div>
        <div role="row" className="contents">
          <div role="rowheader" className="relative" style={{ height: totalHeight }}>
            {hours.map((hour, i) => (
              <div key={hour} className="absolute inset-x-0 pe-2 text-end text-xs text-fg-muted" style={{ top: i * hourHeight - 7 }}>
                {formatHour(hour)}
              </div>
            ))}
          </div>
          {days.map((date) => (
            <div key={date.toISOString()} role="gridcell" className="relative border-s border-line-subtle" style={{ height: totalHeight }}>
              {hours.map((hour, i) => <div key={hour} aria-hidden="true" className="absolute inset-x-0 border-t border-line-subtle" style={{ top: i * hourHeight }} />)}
              {renderColumn(date, layout)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------------------- */
/* Gemeinsame Hülle mit Ansichtswechsel                                                     */
/* ---------------------------------------------------------------------------------------- */

export interface CalendarGridProps {
  view: CalendarView;
  /** Bezugsdatum: Tag, eine Woche um dieses Datum oder der Monat dieses Datums. */
  date: Date;
  label: string;
  weekStartsOn?: 0 | 1;
  month?: Omit<CalendarMonthGridProps, "year" | "month" | "label" | "weekStartsOn" | "className">;
  time?: Omit<CalendarTimeGridProps, "days" | "label" | "className">;
  className?: string;
}

/** Wählt je nach Ansicht Monatsraster (month) oder Zeitraster (day, week). */
export function CalendarGrid({ view, date, label, weekStartsOn = 1, month, time, className }: CalendarGridProps) {
  if (view === "month") {
    if (!month) throw new Error("CalendarGrid: month-Konfiguration fehlt für view=month");
    return <CalendarMonthGrid year={date.getFullYear()} month={date.getMonth()} weekStartsOn={weekStartsOn} label={label} {...(className !== undefined && { className })} {...month} />;
  }
  if (!time) throw new Error("CalendarGrid: time-Konfiguration fehlt für view=day oder view=week");
  const days = view === "day" ? [startOfDay(date)] : getWeekDays(date, weekStartsOn);
  return <CalendarTimeGrid days={days} label={label} {...(className !== undefined && { className })} {...time} />;
}
