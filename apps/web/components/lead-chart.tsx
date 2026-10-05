'use client';

import type { SeriesDTO } from '@eleicoes/election-core';
import { formatClock } from '@eleicoes/election-core';
import { useEffect, useId, useRef, useState } from 'react';
import { displayName, fmtInt } from '@/lib/format';

const H = 200;
const PAD = { top: 14, right: 14, bottom: 26, left: 52 };
const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

/** Round tick step (1, 2 or 5 × 10ⁿ) giving about three intervals. */
function niceStep(range: number) {
  const raw = Math.max(1, range) / 3;
  const p = 10 ** Math.floor(Math.log10(raw));
  const n = raw / p;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p;
}

/**
 * Lead of the current 1st place over the 2nd, in votes, across the count: "is the gap closing?".
 * Above the zero line the area takes the leader's colour; below it (the other one ahead), the
 * runner-up's.
 */
export function LeadChart({ series }: { series: SeriesDTO }) {
  const box = useRef<HTMLDivElement>(null);
  const clip = useId();
  const [w, setW] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [a, b] = series.candidates;
  const points =
    a && b
      ? series.points
          // From the first partial on: snapshots taken before the count (all zero) are skipped.
          .filter((p) => (p.votes?.[a.key] ?? 0) + (p.votes?.[b.key] ?? 0) > 0)
          .map((p) => ({ at: Date.parse(p.at), lead: p.votes[a.key]! - p.votes[b.key]! }))
      : [];
  const ready = points.length >= 2 && points.some((p) => p.lead !== 0);

  useEffect(() => {
    if (!ready || !box.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.floor(e!.contentRect.width))));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, [ready]);

  if (!ready || !a || !b) return null;

  const t0 = points[0]!.at;
  const t1 = points.at(-1)!.at;
  const leads = points.map((p) => p.lead);
  const lo = Math.min(0, ...leads);
  const hi = Math.max(0, ...leads) || 1;
  const width = w ?? 0;
  const iw = width - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const x = (t: number) => PAD.left + ((t - t0) / Math.max(1, t1 - t0)) * iw;
  const y = (v: number) => PAD.top + (1 - (v - lo) / Math.max(1, hi - lo)) * ih;
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.at).toFixed(1)},${y(p.lead).toFixed(1)}`).join('');
  const area = `${line}L${x(t1).toFixed(1)},${y(0).toFixed(1)}L${x(t0).toFixed(1)},${y(0).toFixed(1)}Z`;
  const peak = points.reduce((m, p) => (Math.abs(p.lead) > Math.abs(m.lead) ? p : m));
  const now = points.at(-1)!;
  const shown = hover != null ? points[hover]! : now;
  const who = (lead: number) => (lead >= 0 ? a : b);
  const step = niceStep(hi - lo);
  const yTicks: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) yTicks.push(v);

  return (
    <div>
      <p className="mb-1 text-[14px] font-medium">Diferença de votos</p>
      <p className="text-[13.5px] text-ink-2" aria-live="polite">
        {hover != null ? `Às ${formatClock(new Date(shown.at).toISOString()).slice(0, 5)}: ` : 'Agora: '}
        <span className="font-semibold" style={{ color: who(shown.lead).color }}>
          {displayName(who(shown.lead).name)}
        </span>{' '}
        à frente por <span className="numeral font-semibold">{fmtInt(Math.abs(shown.lead))}</span> votos
      </p>
      <p className="text-[12.5px] text-muted">
        Maior vantagem: {fmtInt(Math.abs(peak.lead))} votos às{' '}
        {formatClock(new Date(peak.at).toISOString()).slice(0, 5)}
      </p>
      <div ref={box} className="mt-2 w-full">
        {w != null && (
          <svg
            width={width}
            height={H}
            role="img"
            aria-label={`Diferença de votos entre ${displayName(a.name)} e ${displayName(b.name)} ao longo da apuração`}
            onPointerMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const t = t0 + ((e.clientX - r.left - PAD.left) / Math.max(1, iw)) * (t1 - t0);
              let best = 0;
              for (let i = 1; i < points.length; i++)
                if (Math.abs(points[i]!.at - t) < Math.abs(points[best]!.at - t)) best = i;
              setHover(best);
            }}
            onPointerLeave={() => setHover(null)}
          >
            <defs>
              <clipPath id={`${clip}-up`}>
                <rect x={0} y={0} width={width} height={y(0)} />
              </clipPath>
              <clipPath id={`${clip}-down`}>
                <rect x={0} y={y(0)} width={width} height={H} />
              </clipPath>
            </defs>
            {yTicks.map((v) => (
              <g key={v}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--line)" />
                <text x={PAD.left - 6} y={y(v) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">
                  {v === 0 ? '0' : compact.format(Math.abs(v))}
                </text>
              </g>
            ))}
            <line x1={PAD.left} x2={width - PAD.right} y1={y(0)} y2={y(0)} stroke="var(--ink-2)" />
            <path d={area} fill={a.color} fillOpacity={0.18} clipPath={`url(#${clip}-up)`} />
            <path d={area} fill={b.color} fillOpacity={0.18} clipPath={`url(#${clip}-down)`} />
            <path d={line} fill="none" stroke="var(--ink)" strokeWidth={2} />
            <circle cx={x(peak.at)} cy={y(peak.lead)} r={4} fill={who(peak.lead).color} />
            <circle cx={x(shown.at)} cy={y(shown.lead)} r={4.5} fill="var(--ink)" />
            {[t0, t1].map((t, i) => (
              <text
                key={t}
                x={x(t)}
                y={H - 8}
                textAnchor={i === 0 ? 'start' : 'end'}
                fontSize={11}
                fill="var(--muted)"
              >
                {formatClock(new Date(t).toISOString()).slice(0, 5)}
              </text>
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}
