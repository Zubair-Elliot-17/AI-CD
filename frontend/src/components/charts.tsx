// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { pct } from "../lib/format";

/** Width of an element, so charts render at real pixel size and text never scales down. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

interface Tip {
  x: number;
  y: number;
  title: string;
  rows: { color: string; label: string; value: string }[];
}

function Tooltip({ tip, width }: { tip: Tip | null; width: number }) {
  if (!tip) return null;
  const left = Math.min(Math.max(tip.x + 12, 0), Math.max(width - 190, 0));
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 w-[180px] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-white/10 dark:bg-zinc-900"
      style={{ left, top: Math.max(tip.y - 12, 0) }}
    >
      <p className="mb-1 text-zinc-500 dark:text-zinc-400">{tip.title}</p>
      {tip.rows.map((r) => (
        <p key={r.label} className="flex items-center gap-2">
          <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: r.color }} />
          <span className="font-semibold tabular-nums">{r.value}</span>
          <span className="truncate text-zinc-500 dark:text-zinc-400">{r.label}</span>
        </p>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string; line?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span
            className={i.line ? "h-0.5 w-4 rounded-full" : "size-2.5 rounded-sm"}
            style={{ background: i.color }}
          />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

export function TableView({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="focus-ring w-fit cursor-pointer rounded text-xs font-medium text-zinc-500 hover:text-ink dark:text-zinc-400 dark:hover:text-white">
        Show as table
      </summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left tabular-nums">
          <thead className="text-xs text-zinc-500 dark:text-zinc-400">
            <tr>
              {head.map((h) => (
                <th key={h} className="py-1 pr-4 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-zinc-100 dark:border-white/5">
                {r.map((c, j) => (
                  <td key={j} className="py-1 pr-4">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

const AXIS = "fill-zinc-500 text-[11px] dark:fill-zinc-400";
const GRID = "stroke-zinc-200 dark:stroke-white/10";

export interface LineSeries {
  key: string;
  label: string;
  color: string;
  points: [number, number][];
}

/** ROC curves on a shared 0-1 grid, with a crosshair that reads every curve at once. */
export function RocChart({ series }: { series: LineSeries[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const m = { top: 12, right: 12, bottom: 36, left: 40 };
  const size = Math.min(width, 440);
  const w = size - m.left - m.right;
  const h = w;
  const sx = (v: number) => m.left + v * w;
  const sy = (v: number) => m.top + (1 - v) * h;
  const grid = series[0]?.points.map((p) => p[0]) ?? [];
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width;
    let best = 0;
    grid.forEach((g, i) => {
      if (Math.abs(g - x) < Math.abs(grid[best] - x)) best = i;
    });
    setHover(best);
  };

  const tip: Tip | null =
    hover === null
      ? null
      : {
          x: sx(grid[hover]),
          y: m.top,
          title: `At ${pct(grid[hover])} false positives`,
          rows: series.map((s) => ({ color: s.color, label: s.label, value: pct(s.points[hover][1]) })),
        };

  return (
    <div ref={ref} className="relative">
      {w > 0 && (
        <svg width={size} height={h + m.top + m.bottom} role="img" aria-label="ROC curves">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={sx(0)} x2={sx(1)} y1={sy(t)} y2={sy(t)} className={GRID} />
              <line x1={sx(t)} x2={sx(t)} y1={sy(0)} y2={sy(1)} className={GRID} />
              <text x={m.left - 8} y={sy(t)} dy="0.32em" textAnchor="end" className={AXIS}>
                {pct(t)}
              </text>
              <text x={sx(t)} y={sy(0) + 16} textAnchor="middle" className={AXIS}>
                {pct(t)}
              </text>
            </g>
          ))}
          <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} className="stroke-zinc-300 dark:stroke-white/20" />
          <text x={sx(0.62)} y={sy(0.55)} className={AXIS} transform={`rotate(-45 ${sx(0.62)} ${sy(0.55)})`}>
            chance
          </text>
          <text x={sx(0.5)} y={h + m.top + 32} textAnchor="middle" className={AXIS}>
            Human texts wrongly flagged
          </text>
          {series.map((s) => (
            <polyline
              key={s.key}
              points={s.points.map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ")}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {hover !== null && (
            <g>
              <line x1={sx(grid[hover])} x2={sx(grid[hover])} y1={sy(0)} y2={sy(1)} className="stroke-zinc-400 dark:stroke-zinc-500" />
              {series.map((s) => (
                <circle
                  key={s.key}
                  cx={sx(s.points[hover][0])}
                  cy={sy(s.points[hover][1])}
                  r={4}
                  fill={s.color}
                  className="stroke-white dark:stroke-night"
                  strokeWidth={2}
                />
              ))}
            </g>
          )}
          <rect
            x={sx(0)}
            y={sy(1)}
            width={w}
            height={h}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
      )}
      <Tooltip tip={tip} width={width} />
    </div>
  );
}

export interface BarRow {
  label: string;
  values: { key: string; label: string; color: string; value: number }[];
}

/** Horizontal bars, one group per row, values 0-1 labelled at the tip. */
export function BarChart({ rows, valueLabel = pct }: { rows: BarRow[]; valueLabel?: (v: number) => string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [tip, setTip] = useState<Tip | null>(null);
  const per = rows[0]?.values.length ?? 1;
  const bar = per === 1 ? 18 : 12;
  const gap = 2;
  // Narrow screens put each row's label above its bars so long labels never clip.
  const stacked = width < 480;
  const top = stacked ? 18 : 0;
  const m = { left: stacked ? 0 : 132, right: 44 };
  const groupH = top + per * bar + (per - 1) * gap + 16;
  const w = width - m.left - m.right;
  const sx = (v: number) => m.left + v * w;

  return (
    <div ref={ref} className="relative">
      {w > 0 && (
        <svg width={width} height={rows.length * groupH + 18} role="img" aria-label="Bar chart">
          {[0, 0.5, 1].map((t) => (
            <g key={t}>
              <line x1={sx(t)} x2={sx(t)} y1={0} y2={rows.length * groupH} className={GRID} />
              <text x={sx(t)} y={rows.length * groupH + 14} textAnchor={stacked && t === 0 ? "start" : "middle"} className={AXIS}>
                {pct(t)}
              </text>
            </g>
          ))}
          {rows.map((row, ri) => {
            const y0 = ri * groupH + 8 + top;
            return (
              <g key={row.label}>
                <text
                  x={stacked ? 0 : m.left - 10}
                  y={stacked ? y0 - 9 : y0 + (groupH - 16) / 2}
                  dy="0.32em"
                  textAnchor={stacked ? "start" : "end"}
                  className="fill-zinc-700 text-xs dark:fill-zinc-300"
                >
                  {row.label}
                </text>
                {row.values.map((v, vi) => {
                  const y = y0 + vi * (bar + gap);
                  const len = Math.max(v.value * w, 1);
                  const r = Math.min(4, len / 2, bar / 2);
                  const show = () =>
                    setTip({
                      x: sx(v.value),
                      y: y - 8,
                      title: row.label,
                      rows: [{ color: v.color, label: v.label, value: valueLabel(v.value) }],
                    });
                  return (
                    <g key={v.key} tabIndex={0} onPointerEnter={show} onFocus={show} onPointerLeave={() => setTip(null)} onBlur={() => setTip(null)} className="outline-none [&:hover>path]:opacity-80 [&:focus-visible>path]:opacity-80">
                      <path
                        d={`M${sx(0)},${y} h${len - r} a${r},${r} 0 0 1 ${r},${r} v${bar - 2 * r} a${r},${r} 0 0 1 -${r},${r} h-${len - r} z`}
                        fill={v.color}
                      />
                      <rect x={sx(0)} y={y - gap} width={w} height={bar + 2 * gap} fill="transparent" />
                      <text x={sx(v.value) + 6} y={y + bar / 2} dy="0.32em" className="fill-zinc-700 text-[11px] font-medium tabular-nums dark:fill-zinc-300">
                        {valueLabel(v.value)}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      )}
      <Tooltip tip={tip} width={width} />
    </div>
  );
}

/** Score distribution for one class: columns over 0-100% AI score. */
export function Histogram({ counts, edges, color, label, max }: { counts: number[]; edges: number[]; color: string; label: string; max: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [tip, setTip] = useState<Tip | null>(null);
  const m = { top: 8, bottom: 20, left: 4, right: 4 };
  const h = 96;
  const w = width - m.left - m.right;
  const colW = w / counts.length;
  const total = counts.reduce((a, b) => a + b, 0);

  return (
    <div ref={ref} className="relative">
      {w > 0 && (
        <svg width={width} height={h + m.top + m.bottom} role="img" aria-label={`${label} score distribution`}>
          <line x1={m.left} x2={m.left + w} y1={m.top + h} y2={m.top + h} className={GRID} />
          {[0, 0.5, 1].map((t) => (
            <text key={t} x={m.left + t * w} y={m.top + h + 15} textAnchor={t === 0 ? "start" : t === 1 ? "end" : "middle"} className={AXIS}>
              {pct(t)} AI
            </text>
          ))}
          {counts.map((c, i) => {
            const ch = (c / max) * h;
            const x = m.left + i * colW + 1;
            const cw = colW - 2;
            const r = Math.min(4, cw / 2, ch);
            const y = m.top + h - ch;
            const show = () =>
              setTip({
                x,
                y: y - 40,
                title: `${pct(edges[i])}–${pct(edges[i + 1])} AI score`,
                rows: [{ color, label, value: `${c} (${pct(c / total)})` }],
              });
            return (
              <g key={i} onPointerEnter={show} onPointerLeave={() => setTip(null)} className="[&:hover>path]:opacity-80">
                {c > 0 && (
                  <path d={`M${x},${m.top + h} v-${ch - r} a${r},${r} 0 0 1 ${r},-${r} h${cw - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${ch - r} z`} fill={color} />
                )}
                <rect x={x - 1} y={m.top} width={colW} height={h} fill="transparent" />
              </g>
            );
          })}
        </svg>
      )}
      <Tooltip tip={tip} width={width} />
    </div>
  );
}
