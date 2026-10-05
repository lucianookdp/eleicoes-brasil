'use client';

import { formatClock, hasValidVotes } from '@eleicoes/election-core';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { displayName, fmtInt, fmtPct } from '@/lib/format';
import { useOverview, useSeries, useTimeline, useTimelineAt } from '@/lib/queries';
import { TILES } from '@/lib/tiles';
import { EvolutionChart } from './evolution-chart';
import { LeadChart } from './lead-chart';
import { CandidateList, RaceBar } from './results';
import { useRound } from './shell';
import { EmptyState, ErrorNotice, Panel, SectionTitle, Skeleton } from './ui';

/** "Como estava a eleição às 19:32?" — pick a moment and see the count as it was. */
export function HistoryView() {
  const { round, href } = useRound();
  const timeline = useTimeline(round.slug);
  const overview = useOverview(round.slug);
  const office = overview.data?.round.offices.find((o) => o.scope === 'country');
  const series = useSeries(round.slug, office?.slug, 'br');
  // Snapshots taken before the first partial (days earlier, all at 0%) would squash the night.
  const all = timeline.data?.points ?? [];
  const started = all.filter((p) => (p.countedPct ?? 0) > 0);
  const points = started.length >= 2 ? started : all;
  const [index, setIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const i = index ?? points.length - 1;
  const at = points[i]?.at ?? null;
  const snapshot = useTimelineAt(round.slug, at);
  const [first, second] = snapshot.data?.headline?.candidates.filter(hasValidVotes) ?? [];
  const lead = first && second ? (first.votes ?? 0) - (second.votes ?? 0) : 0;

  // The whole night in about 30 seconds: ~60 frames, half a second each.
  useEffect(() => {
    if (!playing) return;
    const step = Math.max(1, Math.ceil(points.length / 60));
    const t = setInterval(() => {
      setIndex((prev) => {
        const next = (prev ?? 0) + step;
        if (next >= points.length - 1) setPlaying(false);
        return Math.min(next, points.length - 1);
      });
    }, 500);
    return () => clearInterval(t);
  }, [playing, points.length]);

  return (
    <>
      <div className="mb-5">
        <h1 className="text-[24px] font-semibold tracking-tight sm:text-[28px]">Linha do tempo</h1>
        <p className="text-[13.5px] text-muted">
          Volte a qualquer momento da apuração ou toque em Reproduzir para ver a noite inteira em 30 segundos.
        </p>
      </div>

      {timeline.error && <ErrorNotice error={timeline.error} retry={() => timeline.refetch()} />}
      {timeline.data && points.length < 2 && (
        <EmptyState title="A linha do tempo ainda está vazia.">
          Ela começa a ser gravada com as primeiras parciais da apuração.
        </EmptyState>
      )}
      {!timeline.data && !timeline.error && <Skeleton className="h-40" />}

      {points.length >= 2 && (
        <>
          <Panel className="mb-6 p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[13px] text-muted">Como estava às</p>
                <p className="numeral text-[34px] leading-none">{at ? formatClock(at) : '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-[13px] text-muted">Urnas apuradas</p>
                <p className="numeral text-[34px] leading-none">{fmtPct(points[i]?.countedPct)}</p>
              </div>
            </div>
            {first && lead > 0 && (
              <p className="mb-2 flex items-center gap-2 text-[14px] text-ink-2" data-testid="replay-lead">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: first.color }}
                  aria-hidden
                />
                <span>
                  {displayName(first.ballotName)} à frente por{' '}
                  <span className="numeral font-semibold text-ink">{fmtInt(lead)}</span> votos
                </span>
              </p>
            )}
            <Pace points={points} index={i} />
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (i >= points.length - 1) setIndex(0);
                  setPlaying((p) => !p);
                }}
                className="h-10 shrink-0 rounded-lg border border-line-strong px-4 text-[14px] font-medium hover:bg-surface-2"
              >
                {playing ? 'Pausar' : 'Reproduzir'}
              </button>
              <label className="flex-1">
                <span className="sr-only">Momento da apuração</span>
                <input
                  type="range"
                  min={0}
                  max={points.length - 1}
                  value={i}
                  onChange={(e) => {
                    setPlaying(false);
                    setIndex(Number(e.target.value));
                  }}
                  aria-valuetext={
                    at ? `${formatClock(at)}, ${fmtPct(points[i]?.countedPct)} apurado` : undefined
                  }
                  className="h-10 w-full accent-[var(--live)]"
                />
              </label>
            </div>
            <div className="flex justify-between font-mono text-[12px] text-muted">
              <span>{formatClock(points[0]!.at)}</span>
              <span>{formatClock(points.at(-1)!.at)}</span>
            </div>
          </Panel>

          <div className="mb-8 grid items-start gap-6 lg:grid-cols-12 [&>*]:min-w-0">
            <Panel className="p-4 sm:p-5 lg:col-span-7">
              <h2 className="mb-1 text-[17px] font-semibold">
                {office?.name ?? 'Resultado'} naquele momento
              </h2>
              {snapshot.data?.headline ? (
                <>
                  <RaceBar result={snapshot.data.headline} />
                  <CandidateList result={snapshot.data.headline} collapsed={4} />
                </>
              ) : (
                <p className="py-6 text-[14px] text-muted">Ainda não havia votos apurados nesse momento.</p>
              )}
            </Panel>
            <Panel className="p-4 sm:p-5 lg:col-span-5">
              <h2 className="mb-3 text-[17px] font-semibold">Estados naquele momento</h2>
              <div className="mx-auto grid max-w-[340px] grid-cols-7 gap-1">
                {(snapshot.data?.states ?? []).map((s) => {
                  const pos = TILES[s.uf];
                  if (!pos) return null;
                  const p = s.countedPct ?? 0;
                  return (
                    <Link
                      key={s.uf}
                      href={href(`/states/${s.uf.toLowerCase()}`)}
                      title={`${s.uf}: ${fmtPct(s.countedPct)}${s.leader ? ` · ${displayName(s.leader.name)}` : ''}`}
                      className="relative flex aspect-square flex-col items-center justify-center rounded-md text-[11px] font-semibold"
                      style={{
                        gridColumn: pos[0] + 1,
                        gridRow: pos[1] + 1,
                        background: s.countedPct
                          ? `color-mix(in oklab, var(--seq-high) ${p}%, var(--seq-low))`
                          : 'var(--surface-2)',
                        color: p > 55 ? 'var(--ground)' : 'var(--ink-2)',
                      }}
                    >
                      {s.uf}
                      {s.leader && (
                        <span
                          className="absolute bottom-1 size-1.5 rounded-full"
                          style={{ background: s.leader.color }}
                          aria-hidden
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
              <p className="mt-3 text-center text-[12px] text-muted">
                Cor: urnas apuradas. Ponto: mais votado para {office?.name?.toLowerCase() ?? 'o cargo'}.
              </p>
            </Panel>
          </div>

          {office && (
            <section aria-labelledby="evolucao-completa" className="mb-8">
              <SectionTitle id="evolucao-completa" title="Evolução completa" />
              <Panel className="p-3 sm:p-4">
                {series.data ? (
                  <div className="grid gap-6">
                    <LeadChart series={series.data} />
                    <EvolutionChart series={series.data} majority />
                  </div>
                ) : (
                  <Skeleton className="h-72" />
                )}
              </Panel>
            </section>
          )}
        </>
      )}
    </>
  );
}

/** Counted % over time as a small area, with the selected moment marked. */
function Pace({ points, index }: { points: { at: string; countedPct: number | null }[]; index: number }) {
  const w = 1000;
  const h = 64;
  const t0 = Date.parse(points[0]!.at);
  const t1 = Date.parse(points.at(-1)!.at);
  const x = (at: string) => ((Date.parse(at) - t0) / Math.max(1, t1 - t0)) * w;
  const y = (v: number | null) => h - ((v ?? 0) / 100) * h;
  const line = points
    .map((p, i) => `${i ? 'L' : 'M'}${x(p.at).toFixed(1)},${y(p.countedPct).toFixed(1)}`)
    .join('');
  const sel = points[index]!;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-16 w-full"
      role="img"
      aria-label="Percentual apurado ao longo do tempo"
    >
      <path d={`${line}L${w},${h}L0,${h}Z`} fill="var(--live-soft)" />
      <path d={line} fill="none" stroke="var(--live)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      <line
        x1={x(sel.at)}
        x2={x(sel.at)}
        y1={0}
        y2={h}
        stroke="var(--ink)"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
