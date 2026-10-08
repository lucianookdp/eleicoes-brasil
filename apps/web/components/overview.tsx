'use client';

import type { OverviewDTO, ResultDTO } from '@eleicoes/election-core';
import { hasValidVotes } from '@eleicoes/election-core';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useFavorites } from '@/lib/favorites';
import { displayName, fmtInt, fmtPct } from '@/lib/format';
import { useEvents, useOfficeStates, useOverview, useSeries } from '@/lib/queries';
import { ActivityFeed } from './activity';
import { BrazilMap } from './brazil-map';
import { CountingHero } from './counting';
import { EvolutionChart } from './evolution-chart';
import { LeadChart } from './lead-chart';
import { MyCityCard } from './my-city';
import { CandidateList, FacePhoto, HeadToHead, isHeadToHead, Provenance, RaceBar } from './results';
import { ShareButton } from './share-button';
import { useRound } from './shell';
import { StatesTable } from './states-table';
import { EmptyState, ErrorNotice, FreshnessNotice, Panel, Skeleton, StateFlag, Tabs } from './ui';

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
 *   1. the race itself (in a runoff, the two finalists face to face), with turnout, blank and
 *      null votes right under it once the count ends
 *   2. how much is counted (one number)
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
  const faceOff = !!headline && isHeadToHead(headline, round.round);
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
      <div className="grid items-start gap-4 lg:grid-cols-12 [&>*]:min-w-0 lg:gap-6">
        <div className="grid gap-4 lg:col-span-7 lg:gap-6 [&>*]:min-w-0">
          {/* 1st round over: the summary (finalists' photos when there is a runoff) leads. */}
          {headline && !faceOff && <EndSummary data={data} />}
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
                  {faceOff ? (
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
          {/* Runoff: the face-off above already names both; here only turnout, blank and null. */}
          {headline && faceOff && <EndSummary data={data} statsOnly />}
          <MyCityCard headlineOffice={headlineOffice?.slug} />
          <Favorites data={data} />
          <Panel className="p-4 sm:p-5">
            <CountingHero
              progress={data.progress}
              states={data.states}
              votes={headline?.votes}
              votesFor={headlineOffice?.name}
            />
          </Panel>
          <GovernorRunoffs data={data} />
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
/** The race's outcome as the TSE states it. */
function decision(result: ResultDTO) {
  const leaders = result.candidates.filter(hasValidVotes);
  // During the count the TSE flags the race (md); once final it marks the candidates instead.
  const inRunoff = leaders.filter((c) => /2º turno/i.test(c.status ?? ''));
  const elected = leaders.find((c) => /^eleit/i.test(c.status ?? ''));
  const decided =
    result.mathematicallyDecided ?? (inRunoff.length > 0 ? 'runoff' : elected ? 'elected' : null);
  return { leaders, inRunoff, elected, decided };
}

function DecidedBanner({ result }: { result: ResultDTO }) {
  const { round } = useRound();
  const { leaders, inRunoff, elected, decided } = decision(result);
  // 1st round: runoff or outright win. 2nd round: only the win, once the TSE marks it.
  if (!decided || leaders.length < 2 || (round.round !== 1 && decided !== 'elected')) return null;
  const pair = inRunoff.length >= 2 ? inRunoff : leaders;
  const a = displayName((decided === 'elected' ? (elected ?? leaders[0]) : pair[0])!.ballotName);
  const b = displayName(pair[1]!.ballotName);
  return (
    // A headline, part of the page (like a news site's lead), not a notification-style box.
    <div role="status" className="mb-5 border-b border-line pb-4">
      <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-live">
        <span className="size-1.5 rounded-full bg-live" aria-hidden />
        Resultado definido pelo TSE
      </p>
      <p className="mt-1 text-balance text-[22px] font-semibold leading-tight tracking-tight sm:text-[26px]">
        {decided === 'runoff'
          ? 'Vai ter 2º turno'
          : `${a} venceu ${round.round === 1 ? 'no 1º turno' : 'o 2º turno'}`}
      </p>
      <p className="mt-1 text-[15px] text-ink-2">
        {decided === 'runoff'
          ? `${a} e ${b} disputam a ${result.office.name === 'Presidente' ? 'Presidência' : `vaga de ${result.office.name}`} no dia ${runoffDate(round.year)}.`
          : `Eleição para ${result.office.name}.`}
      </p>
    </div>
  );
}

/** Once 100% is counted: the night in one card (lead, turnout, blank and null votes). */
function EndSummary({ data, statsOnly = false }: { data: OverviewDTO; statsOnly?: boolean }) {
  const { round } = useRound();
  const p = data.progress;
  const h = data.headline;
  if (!p || !h || (p.countedPct ?? 0) < 100) return null;
  const outcome = decision(h);
  // The two finalists when the TSE has set a runoff; otherwise the top two.
  const [a, b] = outcome.inRunoff.length >= 2 ? outcome.inRunoff : outcome.leaders;
  const gap = a && b ? (a.votes ?? 0) - (b.votes ?? 0) : null;
  const total = h.votes.total || null;
  // Share and the number behind it (people / votes), so "2%" is never left without its size.
  const stats = [
    { label: 'Comparecimento', value: fmtPct(p.turnoutPct, 1), count: p.turnout, unit: 'eleitores' },
    { label: 'Abstenção', value: fmtPct(p.abstentionPct, 1), count: p.abstention, unit: 'eleitores' },
    {
      label: 'Brancos',
      value: total && h.votes.blank != null ? fmtPct((100 * h.votes.blank) / total, 1) : '—',
      count: h.votes.blank,
      unit: 'votos',
    },
    {
      label: 'Nulos',
      value: total && h.votes.null != null ? fmtPct((100 * h.votes.null) / total, 1) : '—',
      count: h.votes.null,
      unit: 'votos',
    },
  ];
  // Photos only once the runoff is certain (the TSE marks it), never as a default.
  const runoff = round.round === 1 && outcome.decided === 'runoff' && a && b;
  return (
    <section aria-label="Resumo da apuração" className="rounded-xl border border-line bg-surface p-4">
      <p className="text-[13px] font-medium text-muted">
        {statsOnly ? 'Comparecimento e votos' : `Apuração concluída · ${h.office.name}`}
      </p>
      {statsOnly ? null : runoff && gap != null ? (
        <div className="mt-3">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
            {[a, b].map((c, i) => (
              <div
                key={c.key}
                className={`flex min-w-0 flex-col items-center gap-1 text-center ${i ? 'col-start-3' : ''}`}
              >
                <FacePhoto c={c} fallbackRound={round.slug} small />
                <p className="flex w-full items-center justify-center gap-1.5 text-[15px] font-semibold">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: c.color }}
                    aria-hidden
                  />
                  <span className="truncate">{displayName(c.ballotName)}</span>
                </p>
                <p className="numeral text-[20px] leading-none">{fmtPct(c.percent)}</p>
                <p className="text-[12.5px] text-muted">{fmtInt(c.votes)} votos</p>
              </div>
            ))}
            <span className="col-start-2 row-start-1 mt-4 text-[18px] text-muted" aria-hidden>
              ×
            </span>
          </div>
          <p className="mt-2 text-center text-[13.5px] text-ink-2">
            Vão para o 2º turno · diferença de {fmtInt(gap)} votos
          </p>
        </div>
      ) : (
        a &&
        b &&
        gap != null && (
          <p className="mt-1 text-[16px] font-semibold">
            {/* Each name stays with its percentage; on a narrow phone the line breaks at the "×". */}
            <span className="whitespace-nowrap">
              {displayName(a.ballotName)} {fmtPct(a.percent)}
            </span>{' '}
            ×{' '}
            <span className="whitespace-nowrap">
              {displayName(b.ballotName)} {fmtPct(b.percent)}
            </span>
            <span className="block text-[13.5px] font-normal text-ink-2">
              Diferença de {fmtInt(gap)} votos
            </span>
          </p>
        )
      )}
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-[12px] text-muted">{s.label}</dt>
            <dd className="numeral text-[17px]">{s.value}</dd>
            {s.count != null && (
              <dd className="text-[12.5px] text-muted">
                {fmtInt(s.count)} {s.unit}
              </dd>
            )}
          </div>
        ))}
      </dl>
    </section>
  );
}

function Favorites({ data }: { data: OverviewDTO }) {
  const { favorites } = useFavorites();
  const { href } = useRound();
  if (favorites.length === 0) return null;
  return (
    <section id="favoritos" aria-label="Favoritos">
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

/**
 * Runoff: the governor races, kept low on the page and short (the presidency is the focus): one
 * line per state with who leads, and a link to the full page.
 */
function GovernorRunoffs({ data }: { data: OverviewDTO }) {
  const { round, href } = useRound();
  const office = data.round.offices.find((o) => o.slug === 'governador');
  const { data: states } = useOfficeStates(round.slug, round.round === 2 ? office?.slug : undefined);
  if (round.round !== 2 || !office || !states?.results.length) return null;
  return (
    <section aria-labelledby="governadores-2t" className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 id="governadores-2t" className="text-[15px] font-semibold">
          Governadores no 2º turno
        </h2>
        <Link href={href('/offices')} className="shrink-0 text-[13.5px] text-info">
          Ver todos
        </Link>
      </div>
      <ul className="divide-y divide-line">
        {states.results.map((r) => {
          const [lead] = r.candidates.filter(hasValidVotes);
          const won = lead && /^eleit/i.test(lead.status ?? '');
          return (
            <li key={r.areaKey}>
              <Link
                href={href(`/states/${r.areaKey}`, { cargo: office.slug })}
                className="grid min-h-11 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 py-1.5 text-[14px]"
              >
                <StateFlag uf={r.areaKey} size={18} />
                <span className="min-w-0 truncate">
                  <span className="text-muted">{r.areaKey.toUpperCase()} · </span>
                  {lead && r.votesPublishable ? displayName(lead.ballotName) : 'Aguardando votos'}
                  {won && <span className="ml-1.5 text-[12px] font-medium text-live">{lead.status}</span>}
                </span>
                <span className="numeral text-muted">
                  {lead && r.votesPublishable ? fmtPct(lead.percent, 1) : ''}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
