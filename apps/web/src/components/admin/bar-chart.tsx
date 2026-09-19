import type { SeriesPoint } from "@/lib/data/admin-analytics";

/**
 * Einfaches Balkendiagramm als Inline-SVG ohne Bibliothek: eine Reihe, eine Achse, dezente Hilfslinien,
 * Tooltip je Balken über <title>, größter Wert direkt beschriftet, Tabelle als Alternative.
 */
export function BarChart({ data, ariaLabel, format, tableCaption, unit }: { data: SeriesPoint[]; ariaLabel: string; format: (v: number) => string; tableCaption: string; unit: string }) {
  const width = 640, height = 220;
  const pad = { top: 22, right: 8, bottom: 28, left: 52 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(1, ...data.map((d) => Math.max(0, d.value)));
  const niceMax = niceCeil(max);
  const step = innerW / Math.max(1, data.length);
  const barW = Math.max(6, Math.min(36, step - 4));
  const y = (v: number) => pad.top + innerH - (Math.max(0, v) / niceMax) * innerH;
  const maxIdx = data.reduce((best, d, i) => (d.value > (data[best]?.value ?? -Infinity) ? i : best), 0);
  const labelEvery = data.length > 8 ? 2 : 1;
  const ticks = [0, 0.5, 1].map((f) => niceMax * f);
  return (
    <figure>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel} className="h-auto w-full">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="var(--color-ink-100)" strokeWidth={1} />
            <text x={pad.left - 6} y={y(t) + 4} textAnchor="end" fontSize={10} fill="var(--color-ink-500)">{format(t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.left + i * step + (step - barW) / 2;
          const top = y(d.value);
          const h = Math.max(0, pad.top + innerH - top);
          return (
            <g key={d.key}>
              <title>{`${d.label}: ${format(d.value)} ${unit}`}</title>
              <rect x={pad.left + i * step} y={pad.top} width={step} height={innerH} fill="transparent" />
              {h > 0 ? <path d={roundedTop(x, top, barW, h, 4)} fill="var(--color-brand-500)" /> : <rect x={x} y={pad.top + innerH - 1} width={barW} height={1} fill="var(--color-ink-300)" />}
              {i === maxIdx && d.value > 0 && <text x={x + barW / 2} y={top - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--color-ink-900)">{format(d.value)}</text>}
              {i % labelEvery === 0 && <text x={x + barW / 2} y={height - 10} textAnchor="middle" fontSize={10} fill="var(--color-ink-500)">{d.label}</text>}
            </g>
          );
        })}
        <line x1={pad.left} x2={width - pad.right} y1={pad.top + innerH} y2={pad.top + innerH} stroke="var(--color-ink-300)" strokeWidth={1} />
      </svg>
      <details className="mt-1 text-sm">
        <summary className="cursor-pointer text-ink-500">Als Tabelle anzeigen</summary>
        <table className="mt-2 w-full text-sm">
          <caption className="sr-only">{tableCaption}</caption>
          <thead className="text-left text-xs uppercase tracking-wide text-ink-500"><tr><th className="p-1">Zeitraum</th><th className="p-1 text-right">{unit}</th></tr></thead>
          <tbody className="divide-y divide-ink-100">{data.map((d) => <tr key={d.key}><td className="p-1">{d.label}</td><td className="p-1 text-right tabular-nums">{format(d.value)}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  );
}

/** Balken mit oben abgerundeten Ecken, Basislinie bleibt eckig. */
function roundedTop(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, h, w / 2);
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

/** Runde Obergrenze für die Achse (1, 2, 5 mal Zehnerpotenz). */
function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return m * pow;
}
