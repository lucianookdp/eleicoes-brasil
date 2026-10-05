'use client';

import { useState } from 'react';
import { useOverview } from '@/lib/queries';
import { BrazilMap } from './brazil-map';
import { useRound } from './shell';
import { StatesTable } from './states-table';
import { ErrorNotice, Panel, Segmented, Skeleton } from './ui';

export function StatesView() {
  const { round } = useRound();
  const { data, error, refetch } = useOverview(round.slug);
  const [view, setView] = useState<'list' | 'map'>('list');
  if (!data)
    return error ? <ErrorNotice error={error} retry={() => refetch()} /> : <Skeleton className="h-96" />;
  const states = data.states.filter((s) => s.uf !== 'ZZ');
  const hasHeadline = data.round.offices.some((o) => o.scope === 'country');
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
      <div className="grid items-start gap-6 lg:grid-cols-12 [&>*]:min-w-0">
        <Panel
          className={`p-3 sm:p-4 lg:sticky lg:top-20 lg:col-span-5 lg:block ${view === 'map' ? '' : 'hidden'}`}
        >
          <BrazilMap key={round.slug} states={states} allowLeader={hasHeadline} />
        </Panel>
        <div className={`lg:col-span-7 lg:block ${view === 'list' ? '' : 'hidden'}`}>
          <StatesTable states={data.states} leaderLabel={hasHeadline ? 'Mais votado' : undefined} />
        </div>
      </div>
    </>
  );
}
