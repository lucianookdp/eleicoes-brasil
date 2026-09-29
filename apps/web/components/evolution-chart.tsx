'use client';

import type { SeriesDTO } from '@eleicoes/election-core';
import { formatClock } from '@eleicoes/election-core';
import { useEffect, useRef, useState } from 'react';
import { displayName, fmtPct } from '@/lib/format';

const H = 280;
const PAD = { top: 16, right: 16, bottom: 28, left: 40 };

function niceStep(range: number) {
  return range > 40 ? 10 : range > 16 ? 5 : range > 6 ? 2 : 1;
}

/**
 * Percentage of each candidate over time. One y-axis (percent). Totalization progress lives in
 * the tooltip, not on a second axis. Partial percentages only reflect votes counted so far.
 */
export function EvolutionChart({ series, majority }: { series: SeriesDTO; majority?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  // Measured before drawing: a fixed initial width would force the page wider on phones.
  const [w, setW] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const points = series.points.filter((p) => Object.values(p.values).some((v) => v != null && v > 0));
  const ready = points.length >= 2;

  useEffect(() => {
    if (!ready || !box.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.floor(e!.contentRect.width))));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, [ready]);

  if (!ready) {
    return (
      <p className="py-10 text-center text-[14px] text-muted">
        A evolução aparece depois de duas ou mais atualizações.
      </p>
    );
  }

  const t0 = Date.parse(points[0]!.at);
  const t1 = Date.parse(points.at(-1)!.at);
  const values = points.flatMap((p) => Object.values(p.values).filter((v): v is number => v != null));
  let lo = Math.max(0, Math.floor(Math.min(...values) - 2));
  let hi = Math.min(100, Math.ceil(Math.max(...values) + 2));
  if (majority && lo < 50 && hi > 42) hi = Math.max(hi, 52);
  const step = niceStep(hi - lo);
  lo = Math.floor(lo / step) * step;
  hi = Math.ceil(hi / step) * step;

  const width = w ?? 0;
  const iw = width - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const x = (t: number) => PAD.left + ((t - t0) / Math.max(1, t1 - t0)) * iw;
  const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo)) * ih;
  const yTicks = Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => lo + i * step);
  const xTicks = Array.from(
    { length: width < 480 ? 3 : 5 },
    (_, i) => t0 + ((t1 - t0) * i) / (width < 480 ? 2 : 4),
  );

  const onMove = (clientX: number) => {
    const rect = box.current!.getBoundingClientRect();
    const t = t0 + ((clientX - rect.left - PAD.left) / iw) * (t1 - t0);
    let best = 0;
    for (let i = 1; i < points.length; i++)
      if (Math.abs(Date.parse(points[i]!.at) - t) < Math.abs(Date.parse(points[best]!.at) - t)) best = i;
    setHover(best);
  };
  const hp = hover != null ? points[hover] : null;
  const last = points.at(-1)!;

  return (
    <div>
      <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px]" aria-label="Legenda">
        {series.candidates.map((c) => (
          <li key={c.key} className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded" style={{ background: c.color }} aria-hidden />
            <span className="text-ink-2">{displayName(c.name)}</span>
          </li>
        ))}
      </ul>
      <div
        ref={box}
        className="relative w-full min-w-0 touch-pan-y select-none overflow-hidden"
        onPointerMove={(e) => onMove(e.clientX)}
        onPointerDown={(e) => onMove(e.clientX)}
        onPointerLeave={() => setHover(null)}
      >
        {w != null && (
          <svg
            width={width}
            height={H}
            role="img"
            aria-label={`Evolução do percentual de votos: ${series.candidates.map((c) => `${displayName(c.name)} ${fmtPct(last.values[c.key])}`).join(', ')}`}
          >
            {yTicks.map((v) => (
              <g key={v}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(v)}
                  y2={y(v)}
                  stroke="var(--line)"
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 8}
                  y={y(v)}
                  dy="0.32em"
                  textAnchor="end"
                  fontSize={11}
                  fill="var(--muted)"
                >
                  {v}%
                </text>
              </g>
            ))}
            {majority && lo < 50 && hi > 50 && (
              <g>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(50)}
                  y2={y(50)}
                  stroke="var(--ink-2)"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <text x={width - PAD.right} y={y(50) - 5} textAnchor="end" fontSize={11} fill="var(--ink-2)">
                  50%
                </text>
              </g>
            )}
            {xTicks.map((t, i) => (
              <text
                key={t}
                x={x(t)}
                y={H - 8}
                textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'}
                fontSize={11}
                fill="var(--muted)"
              >
                {formatClock(new Date(t).toISOString()).slice(0, 5)}
              </text>
            ))}
            {series.candidates.map((c) => {
              const d = points
                .map((p) => ({ t: Date.parse(p.at), v: p.values[c.key] }))
                .filter((p): p is { t: number; v: number } => p.v != null)
                .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`)
                .join('');
              return (
                <path
                  key={c.key}
                  d={d}
                  fill="none"
                  stroke={c.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              );
            })}
            {series.candidates.map((c) => {
              const v = last.values[c.key];
              return v == null ? null : (
                <circle
                  key={c.key}
                  cx={x(t1)}
                  cy={y(v)}
                  r={3.5}
                  fill={c.color}
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              );
            })}
            {hp && (
              <g>
                <line
                  x1={x(Date.parse(hp.at))}
                  x2={x(Date.parse(hp.at))}
                  y1={PAD.top}
                  y2={H - PAD.bottom}
                  stroke="var(--line-strong)"
                />
                {series.candidates.map((c) => {
                  const v = hp.values[c.key];
                  return v == null ? null : (
                    <circle
                      key={c.key}
                      cx={x(Date.parse(hp.at))}
                      cy={y(v)}
                      r={4}
                      fill={c.color}
                      stroke="var(--surface)"
                      strokeWidth={2}
                    />
                  );
                })}
              </g>
            )}
          </svg>
        )}
        {hp && w != null && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-44 rounded-lg border border-line-strong bg-surface px-3 py-2 text-[12.5px] shadow-lg"
            style={{ left: Math.min(Math.max(8, x(Date.parse(hp.at)) + 12), width - 190) }}
          >
            <p className="font-mono text-muted">{formatClock(hp.at)} BRT</p>
            {[...series.candidates]
              .sort((a, b) => (hp.values[b.key] ?? 0) - (hp.values[a.key] ?? 0))
              .map((c) => (
                <p key={c.key} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-ink-2">
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ background: c.color }}
                      aria-hidden
                    />
                    {displayName(c.name)}
                  </span>
                  <span className="font-medium">{fmtPct(hp.values[c.key], 3)}</span>
                </p>
              ))}
            <p className="mt-1 border-t border-line pt-1 text-muted">Totalização {fmtPct(hp.countedPct)}</p>
          </div>
        )}
      </div>
      <p className="mt-2 text-[12.5px] text-muted">
        Percentuais parciais refletem apenas os votos totalizados até cada momento e podem mudar até o fim da
        apuração.
      </p>
    </div>
  );
}
