'use client';

import type { OverviewDTO } from '@eleicoes/election-core';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useFavorites } from '@/lib/favorites';
import { fmtPct } from '@/lib/format';
import { useEvents, useOverview, useSeries } from '@/lib/queries';
import { ActivityFeed } from './activity';
import { BrazilMap } from './brazil-map';
import { CountingHero } from './counting';
import { EvolutionChart } from './evolution-chart';
import { CandidateList, Provenance, RaceBar } from './results';
import { useRound } from './shell';
import { StatesTable } from './states-table';
import { EmptyState, ErrorNotice, FreshnessNotice, Panel, Skeleton, Tabs } from './ui';

const DATE = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function RoundTitle({ compact = false }: { compact?: boolean }) {
  const { round } = useRound();
  return (
    <div className={compact ? 'mb-4' : 'mb-5'}>
      <h1 className="text-[22px] font-semibold tracking-tight sm:text-[28px]">{round.electionName}</h1>
      <p className="text-[13.5px] text-muted">
        {round.round}º turno · {DATE.format(new Date(`${round.date}T12:00:00Z`))}
        {round.environment === 'simulado2026' && ' · simulação oficial do TSE'}
        {round.environment === 'replay' && ' · reprodução de uma apuração gravada'}
      </p>
    </div>
  );
}

type Tab = 'mapa' | 'estados' | 'evolucao' | 'atividade';
const TAB_KEY = 'eleicoes:overview-tab';

/**
 * Home, organised by priority:
 *   1. how much is counted (one number)
 *   2. who is ahead (the headline race)
 *   3. everything else behind tabs the reader chooses: map, states, evolution, activity.
 * On phones the blocks stack in that order; on desktop 1–2 sit left and the tabs right.
 */
export function OverviewView({ initial }: { initial: OverviewDTO | null }) {
  const { round, href } = useRound();
  const { data, error, refetch } = useOverview(
    round.slug,
    initial?.round.slug === round.slug ? initial : null,
  );
  const [tab, setTabState] = useState<Tab>('mapa');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TAB_KEY) as Tab | null;
      if (saved) setTabState(saved);
    } catch {}
  }, []);
  const setTab = (t: Tab) => {
    setTabState(t);
    try {
      localStorage.setItem(TAB_KEY, t);
    } catch {}
  };

  const headline = data?.headline ?? null;
  const headlineOffice = data?.round.offices.find((o) => o.scope === 'country');
  // A remembered tab that this election does not have falls back to the map.
  const activeTab: Tab = tab === 'evolucao' && !headlineOffice ? 'mapa' : tab;
  const series = useSeries(round.slug, tab === 'evolucao' ? headlineOffice?.slug : undefined, 'br');
  const events = useEvents(round.slug, 25);

  if (!data) {
    return (
      <>
        <RoundTitle />
        {error ? (
          <ErrorNotice error={error} retry={() => refetch()} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-12 [&>*]:min-w-0">
            <Skeleton className="h-56 lg:col-span-7" />
            <Skeleton className="h-96 lg:col-span-5" />
          </div>
        )}
      </>
    );
  }

  const states = data.states.filter((s) => s.uf !== 'ZZ');
  return (
    <>
      <RoundTitle />
      <FreshnessNotice ingestion={data.ingestion} progress={data.progress} roundStatus={data.round.status} />
      <Favorites data={data} />

      <div className="grid items-start gap-4 lg:grid-cols-12 [&>*]:min-w-0 lg:gap-6">
        <div className="grid gap-4 lg:col-span-7 lg:gap-6 [&>*]:min-w-0">
          <Panel className="p-4 sm:p-5">
            <CountingHero
              progress={data.progress}
              states={data.states}
              votes={headline?.votes}
              votesFor={headlineOffice?.name}
            />
          </Panel>

          <Panel className="p-4 sm:p-5">
            <section aria-labelledby="corrida">
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <h2 id="corrida" className="text-[17px] font-semibold tracking-tight">
                  {headlineOffice?.name ?? 'Resultados'}
                </h2>
                {headline && (
                  <span className="text-[12.5px] text-muted">
                    votos de {fmtPct(headline.progress.countedPct)} das urnas
                  </span>
                )}
              </div>
              {data.round.offices.length === 0 && (
                <EmptyState title="O TSE ainda não publicou os dados desta eleição.">
                  Cargos, candidatos e resultados aparecem aqui sozinhos assim que a divulgação oficial
                  começar.
                </EmptyState>
              )}
              {data.round.offices.length > 0 && !headlineOffice && (
                <EmptyState title="Nesta eleição os cargos são disputados por estado ou município.">
                  Escolha um estado no mapa ou na lista.
                </EmptyState>
              )}
              {headlineOffice && !headline && (
                <EmptyState title="Ainda não há votos apurados.">
                  Os resultados aparecem aqui assim que o TSE divulgar a primeira parcial.
                </EmptyState>
              )}
              {headline && (
                <>
                  <RaceBar result={headline} />
                  <CandidateList result={headline} collapsed={4} />
                  <Provenance result={headline} />
                </>
              )}
            </section>
          </Panel>
        </div>

        <Panel className="lg:sticky lg:top-20 lg:col-span-5">
          <Tabs
            label="Detalhes da apuração"
            value={activeTab}
            onChange={setTab}
            tabs={[
              { value: 'mapa', label: 'Mapa' },
              { value: 'estados', label: 'Estados' },
              ...(headlineOffice ? [{ value: 'evolucao' as const, label: 'Evolução' }] : []),
              { value: 'atividade', label: 'Atualizações' },
            ]}
          >
            {activeTab === 'mapa' && (
              <BrazilMap key={round.slug} states={states} allowLeader={!!headlineOffice} />
            )}
            {activeTab === 'estados' && (
              <div className="max-h-[70vh] overflow-y-auto pr-1 lg:max-h-[calc(100vh-14rem)]">
                <StatesTable
                  states={states}
                  leaderLabel={headlineOffice ? 'Mais votado' : undefined}
                  compact
                />
              </div>
            )}
            {activeTab === 'evolucao' &&
              (series.data ? (
                <EvolutionChart series={series.data} majority />
              ) : (
                <Skeleton className="h-72" />
              ))}
            {activeTab === 'atividade' && (
              <>
                <ActivityFeed events={events.data ?? []} max={18} dense />
                <Link
                  href={href('/operations')}
                  className="mt-3 inline-flex min-h-10 items-center text-[13.5px] text-info"
                >
                  Ver os bastidores da apuração
                </Link>
              </>
            )}
          </Tabs>
        </Panel>
      </div>
    </>
  );
}

function Favorites({ data }: { data: OverviewDTO }) {
  const { favorites } = useFavorites();
  const { href } = useRound();
  if (favorites.length === 0) return null;
  return (
    <section id="favoritos" aria-label="Favoritos" className="mb-4">
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {favorites.map((f) => {
          const state = data.states.find((s) => s.uf.toLowerCase() === f.key);
          const pct = state?.progress?.countedPct;
          return (
            <li key={f.key} className="shrink-0">
              <Link
                href={href(f.path)}
                className="flex min-h-9 items-center gap-2 rounded-full border border-line bg-surface px-3 text-[13px] hover:border-line-strong"
              >
                <span className="font-medium">{f.label}</span>
                <span className="text-muted">{pct != null ? fmtPct(pct, 1) : f.detail}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
