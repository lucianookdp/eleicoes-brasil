'use client';

import { useState } from 'react';
import { displayName } from '@/lib/format';
import { useOverview } from '@/lib/queries';
import { BrazilMap } from './brazil-map';
import { useRound } from './shell';
import { StatesTable } from './states-table';
import { ErrorNotice, Panel, Segmented, Skeleton } from './ui';

/** Filter value for "most voted changed since the 1st round" (the others are ballot numbers). */
const CHANGED = 'changed';

export function StatesView() {
  const { round, elections } = useRound();
  const { data, error, refetch } = useOverview(round.slug);
  // In a runoff, the 1st round's leaders too (one cached request; the same one when there is none).
  const first =
    round.round === 2
      ? elections.find((e) => e.slug === round.electionSlug)?.rounds.find((r) => r.round === 1)
      : undefined;
  const before = useOverview(first?.slug ?? round.slug).data;
  const [view, setView] = useState<'list' | 'map'>('list');
  const [leader, setLeader] = useState<string | null>(null);
  if (!data)
    return error ? <ErrorNotice error={error} retry={() => refetch()} /> : <Skeleton className="h-96" />;
  const states = data.states.filter((s) => s.uf !== 'ZZ');
  const hasHeadline = data.round.offices.some((o) => o.scope === 'country');
  // Who won where: the two candidates (by ballot number) that lead the most states.
  const wins = new Map<string, { number: string; name: string; color: string; n: number }>();
  for (const s of data.states) {
    if (!s.leader) continue;
    const w = wins.get(s.leader.number) ?? { ...s.leader, n: 0 };
    w.n++;
    wins.set(s.leader.number, w);
  }
  const top = [...wins.values()].sort((a, b) => b.n - a.n).slice(0, 2);
  // Runoff: states whose most voted is someone else than in the 1st round.
  const firstLeader = new Map(
    first && before ? before.states.map((s) => [s.uf, s.leader?.number ?? null] as const) : [],
  );
  const changed = first
    ? data.states.filter(
        (s) => s.leader && firstLeader.get(s.uf) && firstLeader.get(s.uf) !== s.leader.number,
      )
    : [];
  const listed =
    leader === CHANGED
      ? changed
      : leader
        ? data.states.filter((s) => s.leader?.number === leader)
        : data.states;
  const highlight = leader ? new Set(listed.map((s) => s.uf.toLowerCase())) : undefined;
  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight sm:text-[28px]">Estados</h1>
          <p className="text-[13.5px] text-muted">
            Apuração por estado. Toque em um estado para ver cargos e municípios.
          </p>
        </div>
        <div className="lg:hidden">
          <Segmented
            label="Visualização"
            value={view}
            onChange={setView}
            options={[
              { value: 'list', label: 'Lista' },
              { value: 'map', label: 'Mapa' },
            ]}
          />
        </div>
      </div>
      {hasHeadline && top.length > 0 && (
        <fieldset className="mb-4">
          <legend className="mb-1.5 text-[13px] text-muted">
            {/* While counting, "most votes so far": who leads can still change. */}
            Mais votado {round.status === 'final' ? '' : 'até agora '}em cada estado
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {[
              { value: null, label: 'Todos', color: null, n: data.states.length },
              ...top.map((t) => ({ value: t.number, label: displayName(t.name), color: t.color, n: t.n })),
              ...(first && before
                ? [{ value: CHANGED, label: 'Mudou desde o 1º turno', color: null, n: changed.length }]
                : []),
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                aria-pressed={leader === o.value}
                onClick={() => setLeader(o.value)}
                className="flex h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-[14px] text-ink-2 hover:border-line-strong aria-pressed:border-live aria-pressed:bg-live-soft aria-pressed:font-medium aria-pressed:text-ink"
              >
                {o.color && (
                  <span className="size-2.5 rounded-full" style={{ background: o.color }} aria-hidden />
                )}
                {o.label} <span className="numeral text-muted">{o.n}</span>
              </button>
            ))}
          </div>
          {leader === CHANGED && (
            <p className="mt-2 text-[13px] text-muted">
              {changed.length === 0
                ? 'Em todos os estados, o mais votado é o mesmo do 1º turno.'
                : `Estados onde o mais votado ${round.status === 'final' ? 'foi' : 'está sendo'} outro candidato, diferente do 1º turno.`}
            </p>
          )}
        </fieldset>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-12 [&>*]:min-w-0">
        <Panel
          className={`p-3 sm:p-4 lg:sticky lg:top-20 lg:col-span-5 lg:block ${view === 'map' ? '' : 'hidden'}`}
        >
          <BrazilMap key={round.slug} states={states} allowLeader={hasHeadline} highlight={highlight} />
        </Panel>
        <div className={`lg:col-span-7 lg:block ${view === 'list' ? '' : 'hidden'}`}>
          <StatesTable states={listed} leaderLabel={hasHeadline ? 'Mais votado' : undefined} />
        </div>
      </div>
    </>
  );
}
