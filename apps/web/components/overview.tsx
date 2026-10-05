'use client';

import type { OverviewDTO, ResultDTO } from '@eleicoes/election-core';
import { hasValidVotes } from '@eleicoes/election-core';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useFavorites } from '@/lib/favorites';
import { displayName, fmtPct } from '@/lib/format';
import { useEvents, useOverview, useSeries } from '@/lib/queries';
import { ActivityFeed } from './activity';
import { BrazilMap } from './brazil-map';
import { CountingHero } from './counting';
import { EvolutionChart } from './evolution-chart';
import { LeadChart } from './lead-chart';
import { MyCityCard } from './my-city';
import { CandidateList, HeadToHead, isHeadToHead, Provenance, RaceBar } from './results';
import { ShareButton } from './share-button';
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

  // The map has no shape for votes abroad; the states list shows them as "Exterior".
  const states = data.states.filter((s) => s.uf !== 'ZZ');
  return (
    <>
      <RoundTitle />
      {headline && <DecidedBanner result={headline} />}
      <FreshnessNotice
        ingestion={data.ingestion}
        progress={data.progress}
        roundStatus={data.round.status}
        // When the new votes reached us: the TSE's own stamp on the file can be 20 minutes older.
        votesAt={headline?.provenance?.retrievedAt ?? null}
      />
      <MyCityCard headlineOffice={headlineOffice?.slug} />
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
                  {isHeadToHead(headline, round.round) ? (
                    <HeadToHead result={headline} />
                  ) : (
                    <>
                      <RaceBar result={headline} />
                      <CandidateList result={headline} collapsed={4} />
                    </>
                  )}
                  <ShareButton result={headline} />
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
                  states={data.states}
                  leaderLabel={headlineOffice ? 'Mais votado' : undefined}
                  compact
                />
              </div>
            )}
            {activeTab === 'evolucao' &&
              (series.data ? (
                <div className="grid gap-6">
                  <LeadChart series={series.data} />
                  <EvolutionChart series={series.data} majority />
                </div>
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

/** Last Sunday of October: the constitutional date of the 2nd round. */
function runoffDate(year: number) {
  const d = new Date(Date.UTC(year, 9, 31));
  d.setUTCDate(31 - d.getUTCDay());
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(d);
}

/** Shown only once the TSE itself marks the headline race as decided (runoff or elected). */
function DecidedBanner({ result }: { result: ResultDTO }) {
  const { round } = useRound();
  const leaders = result.candidates.filter(hasValidVotes);
  // During the count the TSE flags the race (md); once final it marks the candidates instead.
  const inRunoff = leaders.filter((c) => /2º turno/i.test(c.status ?? ''));
  const elected = leaders.find((c) => /^eleit/i.test(c.status ?? ''));
  const decided =
    result.mathematicallyDecided ?? (inRunoff.length > 0 ? 'runoff' : elected ? 'elected' : null);
  if (!decided || round.round !== 1 || leaders.length < 2) return null;
  const pair = inRunoff.length >= 2 ? inRunoff : leaders;
  const a = displayName((decided === 'elected' ? (elected ?? leaders[0]) : pair[0])!.ballotName);
  const b = displayName(pair[1]!.ballotName);
  return (
    <div role="status" className="mb-4 rounded-xl border border-live/40 bg-live-soft px-4 py-3">
      <p className="text-[17px] font-semibold text-live">
        {decided === 'runoff' ? 'Vai ter 2º turno' : `${a} venceu no 1º turno`}
      </p>
      <p className="text-[14px] text-ink-2">
        {decided === 'runoff'
          ? `${a} e ${b} disputam a ${result.office.name === 'Presidente' ? 'Presidência' : `vaga de ${result.office.name}`} no dia ${runoffDate(round.year)}.`
          : `Resultado definido pelo TSE para ${result.office.name}.`}
      </p>
    </div>
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
