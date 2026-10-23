'use client';

import { useEffect, useRef, useState } from 'react';
import {
  colorOf,
  LIVE_MS,
  type Outcome,
  POLYMARKET_URL,
  polymarketProblem,
  type Range,
  shortName,
  usePriceHistory,
} from '@/lib/polymarket';
import { Segmented, Skeleton } from './ui';

/**
 * Polymarket's two pieces shared by its page and the TV mode: the favourites at a glance (two
 * chances and one split bar) and each outcome's chance over time, like the chart on Polymarket.
 */

const pct = (p: number) => `${Math.round(p * 100)}%`;

/** The two favourites at a glance, before the chart: names, chances and one split bar. */
/**
 * Polymarket is down (no numbers at all): what happened, that the count is not affected, and that
 * the page tries again by itself. The TV version has no buttons (nobody touches a TV).
 */
export function PolymarketDown({
  error,
  retry,
  tv = false,
}: {
  error: unknown;
  retry?: () => void;
  tv?: boolean;
}) {
  const p = polymarketProblem(error);
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border border-warn/50 bg-warn-soft ${tv ? 'mt-3 p-[clamp(12px,3cqi,24px)]' : 'p-4'}`}
    >
      <span
        aria-hidden
        className={`flex shrink-0 items-center justify-center rounded-full bg-warn/20 font-bold text-warn ${tv ? 'size-[clamp(28px,6cqi,44px)] text-[clamp(16px,3.4cqi,24px)]' : 'size-8 text-[16px]'}`}
      >
        !
      </span>
      <div className="min-w-0">
        <p className={`font-semibold ${tv ? 'text-[clamp(16px,3.8cqi,28px)]' : 'text-[16px]'}`}>{p.title}</p>
        <p className={`mt-0.5 text-ink-2 ${tv ? 'text-[clamp(13px,2.8cqi,20px)]' : 'text-[14px]'}`}>
          {p.text} Isso não afeta a apuração: os resultados do TSE seguem normais. Tentamos de novo sozinhos a
          cada {LIVE_MS / 1000} segundos.
        </p>
        {!tv && (
          <p className="mt-2.5 flex flex-wrap gap-2">
            {retry && (
              <button
                type="button"
                onClick={retry}
                className="h-9 rounded-full border border-line-strong bg-surface px-3.5 text-[13.5px] font-medium hover:border-ink"
              >
                Tentar agora
              </button>
            )}
            <a
              href={POLYMARKET_URL}
              target="_blank"
              rel="noopener nofollow"
              className="flex h-9 items-center rounded-full px-3 text-[13.5px] text-info underline underline-offset-2"
            >
              Abrir o site do Polymarket
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

export function OddsSplit({ a, b, tv = false }: { a: Outcome; b: Outcome; tv?: boolean }) {
  const ca = colorOf(a.name, 0);
  const cb = colorOf(b.name, 1);
  const left = (a.price / Math.max(0.0001, a.price + b.price)) * 100;
  const big = tv ? 'text-[clamp(26px,8cqi,64px)]' : 'text-[24px]';
  const name = tv ? 'text-[clamp(14px,3.4cqi,26px)]' : 'text-[13.5px]';
  return (
    <div className="mt-3">
      {/* The number on top, the name under it: a long name never pushes a percentage off a phone. */}
      <div className="grid grid-cols-2 gap-4">
        <p className="min-w-0">
          <span className={`numeral block font-semibold leading-none ${big}`} style={{ color: ca }}>
            {pct(a.price)}
          </span>
          <span className={`mt-1 block truncate text-ink-2 ${name}`}>{shortName(a.name)}</span>
        </p>
        <p className="min-w-0 text-right">
          <span className={`numeral block font-semibold leading-none ${big}`} style={{ color: cb }}>
            {pct(b.price)}
          </span>
          <span className={`mt-1 block truncate text-ink-2 ${name}`}>{shortName(b.name)}</span>
        </p>
      </div>
      <div
        className={`mt-2 flex overflow-hidden rounded-full ${tv ? 'h-[clamp(8px,1.6cqi,14px)]' : 'h-2.5'}`}
        aria-hidden
      >
        <div className="bar h-full" style={{ width: `${left}%`, background: ca }} />
        <div className="h-full flex-1" style={{ background: cb }} />
      </div>
    </div>
  );
}

/** Each outcome's chance over time, one line each, like the chart on Polymarket's page. */
export function PriceChart({
  outcomes,
  tv = false,
}: {
  outcomes: Outcome[];
  /** The TV mode: one fixed period (a week, nobody to tap), bigger text and lines, sized to its box. */
  tv?: boolean;
}) {
  const [range, setRange] = useState<Range>(tv ? '1w' : '1m');
  const shown = outcomes.slice(0, 3).filter((o) => o.token);
  const { data, isError, isPending } = usePriceHistory(
    shown.map((o) => o.token),
    range,
  );
  // Drawn at the real width, so labels stay 11px on a phone and on a wide screen alike.
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e!.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // On a TV the text grows with the box, so it reads from the sofa.
  const font = tv ? Math.max(12, Math.round(w / 45)) : 11;
  const h = tv ? Math.round(Math.min(380, Math.max(170, w * 0.42))) : w < 500 ? 180 : 220;
  const pad = { l: 8, r: font * 4, t: 10, b: font * 2 };
  // Each line ends at the latest price, so the chart moves with every refresh.
  const now = Math.floor(Date.now() / 1000);
  const series = (data ?? [])
    .map((s) => {
      const o = shown.find((x) => x.token === s.token);
      return o ? { ...s, points: [...s.points, { t: now, p: o.price }] } : s;
    })
    .filter((s) => s.points.length > 1);
  const ts = series.flatMap((s) => s.points.map((p) => p.t));
  const t0 = Math.min(...ts);
  const t1 = Math.max(...ts);
  const x = (t: number) => pad.l + ((t - t0) / Math.max(1, t1 - t0)) * (w - pad.l - pad.r);
  const y = (p: number) => pad.t + (1 - p) * (h - pad.t - pad.b);
  // The axis says hours for the short periods, the date for the long ones (and the year past a few months).
  const span = t1 - t0;
  const day = (t: number) =>
    span < 2 * 86_400
      ? new Date(t * 1000).toLocaleString('pt-BR', {
          // A day crosses midnight: with the date, "16:45 → 16:32" reads the right way round.
          ...(span > 12 * 3600 ? { day: '2-digit', month: '2-digit' } : {}),
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo',
        })
      : new Date(t * 1000).toLocaleDateString('pt-BR', {
          day: 'numeric',
          month: 'short',
          ...(span > 150 * 86_400 ? { year: 'numeric' } : {}),
          timeZone: 'America/Sao_Paulo',
        });
  return (
    <div className="mt-3" ref={box}>
      <div className={`mb-2 justify-end ${tv ? 'hidden' : 'flex'}`}>
        <Segmented
          label="Período"
          value={range}
          onChange={setRange}
          options={[
            { value: '1h', label: '1H' },
            { value: '6h', label: '6H' },
            { value: '1d', label: '1D' },
            { value: '1w', label: '1S' },
            { value: '1m', label: '1M' },
            { value: 'max', label: 'Tudo' },
          ]}
        />
      </div>
      {series.length === 0 ? (
        isPending ? (
          <Skeleton className="h-[220px]" />
        ) : (
          <p className="flex h-[180px] items-center justify-center rounded-xl bg-surface-2/50 px-4 text-center text-[13.5px] text-muted">
            {isError
              ? 'O gráfico do Polymarket não respondeu agora. Tentando de novo.'
              : 'Sem negociações neste período.'}
          </p>
        )
      ) : (
        <svg
          viewBox={`0 0 ${w} ${h}`}
          width={w}
          height={h}
          className="block max-w-full"
          role="img"
          aria-label="Chance de cada candidato ao longo do tempo, segundo os preços do Polymarket"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((g) => (
            <g key={g}>
              <line
                x1={pad.l}
                x2={w - pad.r}
                y1={y(g)}
                y2={y(g)}
                stroke="var(--line)"
                strokeDasharray={g === 0.5 ? '0' : '3 4'}
              />
              <text x={w - pad.r + 6} y={y(g) + font / 3} fontSize={font} fill="var(--muted)">
                {Math.round(g * 100)}%
              </text>
            </g>
          ))}
          {series.map((s) => {
            const o = shown.find((x) => x.token === s.token)!;
            const color = colorOf(o.name, shown.indexOf(o));
            const d = s.points
              .map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.p).toFixed(1)}`)
              .join('');
            const last = s.points.at(-1)!;
            return (
              <g key={s.token}>
                <path d={d} fill="none" stroke={color} strokeWidth={tv ? 3.2 : 2.2} strokeLinejoin="round" />
                <circle cx={x(last.t)} cy={y(last.p)} r={tv ? 5 : 3.5} fill={color} />
              </g>
            );
          })}
          <text x={pad.l} y={h - 4} fontSize={font} fill="var(--muted)">
            {day(t0)}
          </text>
          <text x={w - pad.r} y={h - 4} fontSize={font} fill="var(--muted)" textAnchor="end">
            {day(t1)}
          </text>
        </svg>
      )}
    </div>
  );
}
