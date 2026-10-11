'use client';

import { useState } from 'react';
import { displayName } from '@/lib/format';
import { useOverview } from '@/lib/queries';
import { BrazilMap } from './brazil-map';
import { useRound } from './shell';
import { StatesTable } from './states-table';
import { ErrorNotice, Panel, Segmented, Skeleton } from './ui';

/** Filter value for "this state has a governor runoff" (the others are ballot numbers). */
const GOVERNOR = 'governor';

export function StatesView() {
  const { round } = useRound();
  const { data, error, refetch } = useOverview(round.slug);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [leader, setLeader] = useState<string | null>(null);
  if (!data)
    return error ? <ErrorNotice error={error} retry={() => refetch()} /> : <Skeleton className="h-96" />;
  const states = data.states.filter((s) => s.uf !== 'ZZ');
  const hasHeadline = data.round.offices.some((o) => o.scope === 'country');
  // Who won where: every candidate (by ballot number) that leads some state, most states first.
  const wins = new Map<string, { number: string; name: string; color: string; n: number }>();
  for (const s of data.states) {
    if (!s.leader) continue;
    const w = wins.get(s.leader.number) ?? { ...s.leader, n: 0 };
    w.n++;
    wins.set(s.leader.number, w);
  }
  const top = [...wins.values()].sort((a, b) => b.n - a.n);
  // Runoff: the states that also choose their governor on this day (the TSE lists them).
  const governorIn =
    round.round === 2 ? (data.round.offices.find((o) => o.slug === 'governador')?.states ?? []) : [];
  const governor = data.states.filter((s) => governorIn.includes(s.uf));
  const listed =
    leader === GOVERNOR
      ? governor
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
            Filtrar pelo mais votado {round.status === 'final' ? '' : 'até agora '}em cada estado
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {[
              { value: null, label: 'Todos', color: null, n: data.states.length },
              ...top.map((t) => ({ value: t.number, label: displayName(t.name), color: t.color, n: t.n })),
              ...(governor.length > 0
                ? [{ value: GOVERNOR, label: 'Governador no 2º turno', color: null, n: governor.length }]
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
          {leader === GOVERNOR && (
            <p className="mt-2 text-[13px] text-muted">
              Estados que, além do presidente, escolhem o governador neste 2º turno. Toque em um deles para
              ver a disputa.
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
