'use client';

import { formatClock } from '@eleicoes/election-core';
import { useEffect, useRef, useState } from 'react';
import { ErrorNotice, Segmented, Skeleton, StateFlag } from '@/components/ui';
import { fmtCompact } from '@/lib/format';
import {
  eventUrl,
  MARGIN_SLUG,
  type Outcome,
  POLYMARKET_URL,
  type Range,
  usePolymarket,
  usePriceHistory,
} from '@/lib/polymarket';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const pct = (p: number) => `${Math.round(p * 100)}%`;
const cents = (p: number) => `${(p * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}¢`;
const STATE_NAMES: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
  ZZ: 'Exterior',
};

/** The same party colours as everywhere on the site (PL blue, PT red); neutral for anyone else. */
function colorOf(name: string, i: number) {
  if (/bolsonaro/i.test(name)) return '#2F6BFF';
  if (/lula/i.test(name)) return '#E5383B';
  return ['#8a909a', '#f2b33d', '#2fbf71'][i % 3]!;
}

/**
 * Polymarket on the 2nd round, laid out like Polymarket's own event page (chart, % chance, Yes/No
 * prices, volume), on its own clearly labelled page away from the official count. Read live from
 * Polymarket in the reader's browser. Prices are shown, never offered: there is nothing to click.
 */
export default function PolymarketPage() {
  const { data, error, refetch } = usePolymarket();
  return (
    <div className="max-w-4xl pb-8 pt-3">
      {/* Polymarket's own mark and links: the data is theirs, the page points readers to them. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* biome-ignore lint/performance/noImgElement: static export, small brand icon */}
          <img
            src={`${base}/brands/pm-icon.png`}
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-xl"
          />
          <div>
            <h1 className="text-[24px] font-semibold leading-tight tracking-tight">Polymarket</h1>
            <p className="text-[14px] text-ink-2">Eleição presidencial do Brasil 2026 · 2º turno</p>
            {data && (
              <p className="mt-1 flex items-center gap-1.5 text-[12.5px]" role="status">
                <span className="flex items-center gap-1.5 font-medium text-bad">
                  <span className="pulse-dot inline-block size-2 rounded-full bg-current" aria-hidden />
                  Ao vivo
                </span>
                <span className="text-muted">· atualizado às {formatClock(data.at)}</span>
              </p>
            )}
          </div>
        </div>
        <a
          href={POLYMARKET_URL}
          target="_blank"
          rel="noopener nofollow"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1652f0] px-4 text-[14px] font-semibold text-white hover:bg-[#1243c9]"
        >
          Ver no Polymarket
          <svg
            viewBox="0 0 24 24"
            width={15}
            height={15}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            aria-hidden
          >
            <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      {error && (
        <div className="mt-6">
          <ErrorNotice error={error} retry={() => refetch()} />
        </div>
      )}
      {!data && !error && <Skeleton className="mt-6 h-96" />}
      {data && (
        <>
          <Market
            kicker="Eleição presidencial do Brasil"
            title="Quem vence a eleição presidencial?"
            volume={data.volume}
            outcomes={data.winner.slice(0, 4)}
            href={POLYMARKET_URL}
            chart
            photos
          />
          {data.margin.length > 0 && (
            <Market
              kicker="2º turno"
              title="Por quantos pontos o vencedor ganha?"
              volume={data.margin.reduce((a, o) => a + o.volume, 0)}
              outcomes={data.margin.filter((o) => !/^other$/i.test(o.name)).slice(0, 6)}
              href={eventUrl(MARGIN_SLUG)}
            />
          )}
          {data.states.length > 0 && (
            <section
              aria-labelledby="estados"
              className="mt-6 rounded-2xl border border-line bg-surface p-4 sm:p-5"
            >
              <p className="text-[12.5px] text-muted">2º turno · por estado</p>
              <h2 id="estados" className="mt-0.5 text-[19px] font-semibold">
                Quem fica em 1º em cada estado?
              </h2>
              <ul className="mt-3 grid gap-x-6 sm:grid-cols-2">
                {[...data.states]
                  .sort((a, b) =>
                    (STATE_NAMES[a.uf] ?? a.uf).localeCompare(STATE_NAMES[b.uf] ?? b.uf, 'pt-BR'),
                  )
                  .map((s) => {
                    const top = s.outcomes[0]!;
                    return (
                      <li key={s.uf} className="border-b border-line">
                        <a
                          href={eventUrl(s.slug)}
                          target="_blank"
                          rel="noopener nofollow"
                          className="grid min-h-11 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5 py-1.5 text-[14.5px] hover:bg-surface-2/60"
                        >
                          <StateFlag uf={s.uf} size={20} />
                          <span className="flex min-w-0 items-center gap-1.5 truncate">
                            <span className="text-muted">{STATE_NAMES[s.uf] ?? s.uf} ·</span>
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={{ background: colorOf(top.name, 0) }}
                              aria-hidden
                            />
                            <span className="truncate">{top.name}</span>
                          </span>
                          <span className="numeral font-semibold">{pct(top.price)}</span>
                        </a>
                      </li>
                    );
                  })}
              </ul>
            </section>
          )}

          <p className="mt-8 text-[12.5px] text-muted">
            Dados do{' '}
            <a
              href={POLYMARKET_URL}
              target="_blank"
              rel="noopener nofollow"
              className="underline underline-offset-2"
            >
              Polymarket
            </a>
            , atualizados a cada 30 segundos. “Sim” e “Não” são os preços, em centavos de dólar, de uma aposta
            que paga US$ 1 se acontecer.
          </p>
        </>
      )}
    </div>
  );
}

function Market({
  kicker,
  title,
  volume,
  outcomes,
  href,
  chart = false,
  photos = false,
}: {
  kicker: string;
  title: string;
  volume: number;
  outcomes: Outcome[];
  href: string;
  chart?: boolean;
  /** Candidate photos next to the names (the winner market; the margin one has none). */
  photos?: boolean;
}) {
  return (
    <section className="mt-6 rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <p className="text-[12.5px] text-muted">{kicker}</p>
      <h2 className="mt-0.5 text-[19px] font-semibold">{title}</h2>
      <p className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted">
        <span>US$ {fmtCompact(volume)} apostados</span>
        <a
          href={href}
          target="_blank"
          rel="noopener nofollow"
          className="font-medium text-info hover:underline"
        >
          Abrir este mercado no Polymarket ↗
        </a>
      </p>
      {chart && <Chart outcomes={outcomes} />}
      <ul className="mt-3 divide-y divide-line border-t border-line">
        {outcomes.map((o, i) => (
          <li
            key={o.name}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 py-3 sm:grid-cols-[minmax(0,1fr)_5rem_auto]"
          >
            <span className="flex min-w-0 items-center gap-2">
              {photos && o.image ? (
                // biome-ignore lint/performance/noImgElement: Polymarket's own small thumbnail
                <img
                  src={o.image}
                  alt=""
                  width={32}
                  height={32}
                  loading="lazy"
                  className="size-8 shrink-0 rounded-full bg-surface-2 object-cover"
                  style={{ boxShadow: `0 0 0 2px var(--surface), 0 0 0 3.5px ${colorOf(o.name, i)}` }}
                />
              ) : (
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: colorOf(o.name, i) }}
                  aria-hidden
                />
              )}
              <span className="truncate font-medium">{o.name}</span>
            </span>
            <LivePct value={o.price} />
            {/* Prices as Polymarket shows them; display only, no betting here. */}
            <span className="col-span-2 flex gap-1.5 sm:col-span-1">
              <span className="rounded-md bg-live-soft px-2.5 py-1 text-[13px] font-medium text-live">
                Sim {cents(o.price)}
              </span>
              <span className="rounded-md bg-bad-soft px-2.5 py-1 text-[13px] font-medium text-bad">
                Não {cents(o.no)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The % chance, with a short highlight when a refresh moves it. */
function LivePct({ value }: { value: number }) {
  const prev = useRef(value);
  const moved = prev.current !== value;
  useEffect(() => {
    prev.current = value;
  }, [value]);
  return (
    <span
      key={value}
      className={`numeral -mx-1 rounded px-1 text-right text-[20px] font-semibold ${moved ? 'flash' : ''}`}
    >
      {pct(value)}
    </span>
  );
}

/** Each outcome's chance over time, one line each, like the chart on Polymarket's page. */
function Chart({ outcomes }: { outcomes: Outcome[] }) {
  const [range, setRange] = useState<Range>('1m');
  const shown = outcomes.slice(0, 3).filter((o) => o.token);
  const { data } = usePriceHistory(
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
  const h = w < 500 ? 180 : 220;
  const pad = { l: 8, r: 44, t: 10, b: 22 };
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
  const day = (t: number) =>
    new Date(t * 1000).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      timeZone: 'America/Sao_Paulo',
    });
  return (
    <div className="mt-3" ref={box}>
      <div className="mb-2 flex justify-end">
        <Segmented
          label="Período"
          value={range}
          onChange={setRange}
          options={[
            { value: '1w', label: '1 semana' },
            { value: '1m', label: '1 mês' },
            { value: 'max', label: 'Tudo' },
          ]}
        />
      </div>
      {series.length === 0 ? (
        <Skeleton className="h-[220px]" />
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
              <text x={w - pad.r + 6} y={y(g) + 4} fontSize="11" fill="var(--muted)">
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
                <path d={d} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" />
                <circle cx={x(last.t)} cy={y(last.p)} r="3.5" fill={color} />
              </g>
            );
          })}
          <text x={pad.l} y={h - 4} fontSize="11" fill="var(--muted)">
            {day(t0)}
          </text>
          <text x={w - pad.r} y={h - 4} fontSize="11" fill="var(--muted)" textAnchor="end">
            {day(t1)}
          </text>
        </svg>
      )}
    </div>
  );
}
