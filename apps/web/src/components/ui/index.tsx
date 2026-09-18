import Link from "next/link";
import type { ReactNode } from "react";

export function Card({ children, className = "", title, action }: { children: ReactNode; className?: string; title?: string; action?: ReactNode }) {
  return (
    <section className={`rounded-card bg-white p-5 shadow-card ${className}`}>
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-semibold text-ink-900">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function ProgressBar({ value, label, tone = "brand" }: { value: number; label?: string; tone?: "brand" | "success" | "warn" | "danger" | "band" }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const color = tone === "band" ? bandColor(v) : { brand: "bg-brand-500", success: "bg-success-500", warn: "bg-warn-500", danger: "bg-danger-500" }[tone];
  return (
    <div>
      {label && <div className="mb-1 flex justify-between text-sm"><span className="text-ink-700">{label}</span><span className="font-semibold tabular-nums">{v} %</span></div>}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-100" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? "Fortschritt"}>
        <div className={`h-full rounded-full ${color} transition-[width] duration-500`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export function bandColor(score: number): string {
  if (score < 40) return "bg-band-red";
  if (score < 70) return "bg-band-orange";
  if (score < 85) return "bg-band-yellowgreen";
  return "bg-band-green";
}

export function bandLabel(score: number): string {
  if (score < 40) return "Noch nicht prüfungsbereit";
  if (score < 70) return "Auf gutem Weg";
  if (score < 85) return "Fast bereit";
  return "Sehr gute Vorbereitung";
}

export function ReadinessGauge({ score, size = 148 }: { score: number | null; size?: number }) {
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const v = score ?? 0;
  const stroke = score === null ? "#d6d3d1" : v < 40 ? "#c1121f" : v < 70 ? "#e8850c" : v < 85 ? "#8bb821" : "#1f9d55";
  return (
    <div className="flex flex-col items-center" role="img" aria-label={score === null ? "Prüfungsreife noch nicht berechnet" : `Prüfungsreife ${v} Prozent, ${bandLabel(v)}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f5f5f4" strokeWidth={12} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={stroke} strokeWidth={12} strokeLinecap="round" strokeDasharray={`${(c * v) / 100} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-ink-900" style={{ fontSize: size / 4.2, fontWeight: 700 }}>{score === null ? "–".replace("–", "?") : `${v}`}</text>
        {score !== null && <text x="50%" y="66%" textAnchor="middle" className="fill-ink-500" style={{ fontSize: size / 11 }}>%</text>}
      </svg>
      <p className="mt-1 text-sm font-medium" style={{ color: stroke }}>{score === null ? "Noch keine Daten" : bandLabel(v)}</p>
    </div>
  );
}

export function StatTile({ label, value, hint, href }: { label: string; value: ReactNode; hint?: string; href?: string }) {
  const inner = (
    <div className="rounded-card bg-white p-4 shadow-card">
      <p className="text-xs uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-sm text-ink-700">{hint}</p>}
    </div>
  );
  return href ? <Link href={href} className="block hover:-translate-y-px">{inner}</Link> : inner;
}

export function Alert({ tone = "info", title, children }: { tone?: "info" | "success" | "warning" | "error"; title?: string; children: ReactNode }) {
  const cls = { info: "border-brand-200 bg-brand-50 text-brand-900", success: "border-success-500/30 bg-success-100 text-ink-900", warning: "border-warn-500/40 bg-warn-100 text-ink-900", error: "border-danger-500/40 bg-danger-100 text-ink-900" }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl border p-4 text-sm ${cls}`}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? "mt-1" : ""}>{children}</div>
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-ink-300 p-8 text-center">
      <p className="font-medium">{title}</p>
      {text && <p className="mt-1 text-sm text-ink-700">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "brand" | "success" | "warn" | "danger" }) {
  const cls = { neutral: "bg-ink-100 text-ink-700", brand: "bg-brand-100 text-brand-700", success: "bg-success-100 text-success-500", warn: "bg-warn-100 text-warn-500", danger: "bg-danger-100 text-danger-500" }[tone];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{children}</span>;
}

export const btn = {
  primary: "inline-flex min-h-11 items-center justify-center rounded-full bg-brand-500 px-5 font-medium text-white hover:bg-brand-600 active:scale-[0.98] disabled:opacity-50",
  secondary: "inline-flex min-h-11 items-center justify-center rounded-full border border-ink-300 bg-white px-5 font-medium text-ink-900 hover:border-brand-500 active:scale-[0.98] disabled:opacity-50",
  ghost: "inline-flex min-h-11 items-center justify-center rounded-full px-4 font-medium text-brand-700 hover:bg-brand-50 active:scale-[0.98] disabled:opacity-50",
  danger: "inline-flex min-h-11 items-center justify-center rounded-full bg-danger-500 px-5 font-medium text-white hover:opacity-90 active:scale-[0.98] disabled:opacity-50",
};

export const fmt = {
  date: (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString("de-DE", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", year: "numeric" }) : ""),
  time: (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleTimeString("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" }) : ""),
  weekday: (iso: string) => new Date(iso).toLocaleDateString("de-DE", { timeZone: "Europe/Berlin", weekday: "long" }),
  eur: (cents: number) => (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" }),
};

/** tstzrange-Text "[2026-09-14 10:00:00+00,2026-09-14 10:45:00+00)" in Start/Ende zerlegen. */
export function parseRange(range: string): { start: string; end: string } {
  const m = range.match(/^[\[(]"?([^,"]+)"?,"?([^)\]"]+)"?[\])]$/);
  return { start: m?.[1] ?? range, end: m?.[2] ?? range };
}
