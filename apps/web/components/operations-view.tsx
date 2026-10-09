'use client';

import type { CycleDTO, IngestionStatus, OperationsDTO } from '@eleicoes/election-core';
import { formatClock } from '@eleicoes/election-core';
import { useEffect, useState } from 'react';
import { ago, fmtCompact, fmtInt } from '@/lib/format';
import { useOperations, useOverview } from '@/lib/queries';
import { useRealtime } from '@/lib/realtime';
import { TILES } from '@/lib/tiles';
import { ActivityFeed } from './activity';
import { useRound } from './shell';
import { ErrorNotice, FreshnessNotice, Panel, SectionTitle, Skeleton } from './ui';

function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

/**
 * Behind the scenes ("Bastidores"): our infrastructure, not the TSE's. How fast data is
 * arriving, how the collector is talking to the source, and how fresh each area is.
 */
export function OperationsView() {
  const { round, meta } = useRound();
  const { data, error, refetch } = useOperations(round.slug);
  const overview = useOverview(round.slug).data;
  const now = useNow();
  if (!data)
    return error ? <ErrorNotice error={error} retry={() => refetch()} /> : <Skeleton className="h-96" />;

  return (
    <>
      <div className="mb-5">
        <h1 className="text-[24px] font-semibold tracking-tight sm:text-[28px]">Bastidores</h1>
        <p className="text-[13.5px] text-muted">
          O ritmo da apuração e o funcionamento da nossa coleta de dados. Este painel mostra o nosso sistema,
          não os sistemas do TSE.
        </p>
      </div>

      {overview && (
        <FreshnessNotice
          ingestion={overview.ingestion}
          progress={overview.progress}
          roundStatus={overview.round.status}
          votesAt={overview.headline?.provenance?.retrievedAt ?? null}
        />
      )}
      <StatusHero data={data} roundFinal={overview?.round.status === 'final'} now={now} />

      <SectionTitle id="ritmo" title="Ritmo da apuração">
        O que mudou nos últimos 5 minutos.
      </SectionTitle>
      <div className="mb-8 grid items-start gap-6 lg:grid-cols-12 [&>*]:min-w-0">
        <section aria-labelledby="calor" className="lg:col-span-5">
          <h3 id="calor" className="mb-2 text-[15px] font-semibold">
            Onde a apuração avançou
          </h3>
          <p className="-mt-1 mb-2 text-[13px] text-muted">
            Quanto mais escuro, mais urnas apuradas no estado.
          </p>
          <Panel className="p-3 sm:p-4">
            <Heatmap heat={data.heat} />
          </Panel>
        </section>
        <section aria-labelledby="log" className="lg:col-span-7">
          <h3 id="log" className="mb-2 text-[15px] font-semibold">
            Atualizações recentes
          </h3>
          <p className="-mt-1 mb-2 text-[13px] text-muted">Cada novo lote de urnas apuradas, na hora.</p>
          <Panel className="max-h-[420px] overflow-y-auto px-3 py-1 sm:px-4">
            <ActivityFeed events={data.events} max={60} />
          </Panel>
        </section>
      </div>

      <section aria-labelledby="frescor" className="mb-8">
        <SectionTitle id="frescor" title="Quando cada lugar foi atualizado">
          Há quanto tempo o Brasil e cada estado receberam números novos.
        </SectionTitle>
        <Freshness items={data.freshness} now={now} />
      </section>

      {meta?.features.advancedOperations !== false && (
        <details className="group mb-8 rounded-xl border border-line bg-surface px-4 py-3">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between font-medium">
            Detalhes técnicos da coleta
            <span aria-hidden className="text-muted transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <section aria-labelledby="coleta" className="mt-3">
            <SectionTitle id="coleta" title="Nossa coleta">
              Consultas do nosso sistema aos arquivos públicos do TSE nos últimos{' '}
              {data.requests.windowMinutes} minutos.
            </SectionTitle>
            <dl className="mb-4 grid grid-cols-3 gap-3 lg:grid-cols-6">
              <Tile label="Consultas" value={fmtInt(data.requests.total)} />
              <Tile label="Com dados novos" value={fmtInt(data.requests.ok)} />
              <Tile label="Sem mudança" value={fmtInt(data.requests.notModified)} />
              <Tile
                label="Erros"
                value={fmtInt(data.requests.errors)}
                tone={data.requests.errors > 0 ? 'bad' : undefined}
              />
              <Tile
                label="Resposta média"
                value={
                  data.requests.avgLatencyMs != null ? `${Math.round(data.requests.avgLatencyMs)} ms` : '—'
                }
              />
              <Tile
                label="95% em até"
                value={
                  data.requests.p95LatencyMs != null ? `${Math.round(data.requests.p95LatencyMs)} ms` : '—'
                }
              />
            </dl>
            <dl className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Tile
                label="Atraso: 95% em até"
                value={
                  data.delay.p95Seconds != null
                    ? `${data.delay.p95Seconds.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s`
                    : '—'
                }
                detail={`${fmtInt(data.delay.samples)} atualizações em 15 min`}
              />
              <Tile label="Votos por minuto" value={fmtCompact(data.processing.votesPerMinute)} />
              <Tile
                label="Atualizações de estados por minuto"
                value={data.processing.statesPerMinute.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
              />
              <Tile
                label="Atualizações de municípios por minuto"
                value={data.processing.citiesPerMinute.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
              />
            </dl>
            <Panel className="p-3 sm:p-4">
              <Cycles cycles={data.cycles} />
            </Panel>
            {data.ingestion.lastError && (
              <p className="mt-3 text-[12.5px] text-muted">
                Último problema registrado:{' '}
                <span className="font-mono text-[12px] text-warn">{data.ingestion.lastError}</span>
              </p>
            )}
          </section>
        </details>
      )}
    </>
  );
}

type Tone = 'good' | 'warn' | 'bad' | 'muted' | 'info';
const TONE: Record<Tone, string> = {
  good: 'text-live bg-live-soft',
  warn: 'text-warn bg-warn-soft',
  bad: 'text-bad bg-bad-soft',
  muted: 'text-muted bg-surface-2',
  info: 'text-info bg-surface-2',
};

/** The collection's state for anyone: what it means for the numbers on screen, not how it works. */
const HERO: Record<IngestionStatus['state'], { title: string; text: string; tone: Tone }> = {
  healthy: {
    title: 'Tudo funcionando',
    text: 'Conferimos o TSE a cada poucos segundos, e os números novos aparecem aqui sozinhos.',
    tone: 'good',
  },
  degraded: {
    title: 'Um pouco instável',
    text: 'Algumas consultas ao TSE falharam. Os números podem demorar um pouco mais para chegar.',
    tone: 'warn',
  },
  offline: {
    title: 'Coleta parada',
    text: 'Não falamos com o TSE há mais de 2 minutos. Os números na tela são os últimos que chegaram.',
    tone: 'bad',
  },
  idle: { title: 'Coleta em pausa', text: 'Não há apuração em andamento agora.', tone: 'muted' },
  waiting: {
    title: 'Aguardando o TSE',
    text: 'O TSE ainda não publicou os números desta eleição. Conferimos a cada minuto.',
    tone: 'info',
  },
};

/**
 * Top of the page: whether the numbers are arriving, in plain words, the path they take (TSE → our
 * collection → the reader's screen) and three facts anyone understands. The jargon lives in
 * "Detalhes técnicos".
 */
function StatusHero({ data, roundFinal, now }: { data: OperationsDTO; roundFinal: boolean; now: number }) {
  const { connection } = useRealtime();
  const state = data.ingestion.state;
  const hero =
    roundFinal && (state === 'idle' || state === 'healthy')
      ? {
          title: 'Apuração encerrada',
          text: 'Todos os números já chegaram. Seguimos conferindo o TSE de tempos em tempos.',
          tone: 'good' as Tone,
        }
      : HERO[state];
  const steps: { name: string; text: string; tone: Tone }[] = [
    {
      name: 'TSE',
      text: state === 'waiting' ? 'ainda não publicou' : 'publica os números',
      tone: state === 'waiting' ? 'info' : 'good',
    },
    {
      name: 'Nossa coleta',
      text:
        state === 'offline'
          ? 'parada'
          : state === 'degraded'
            ? 'instável'
            : state === 'idle'
              ? 'em pausa'
              : 'confere a cada poucos segundos',
      tone: state === 'offline' ? 'bad' : state === 'degraded' ? 'warn' : state === 'idle' ? 'muted' : 'good',
    },
    {
      name: 'Sua tela',
      text:
        connection === 'offline'
          ? 'sem internet'
          : connection === 'reconnecting'
            ? 'reconectando'
            : 'atualiza sozinha',
      tone: connection === 'offline' ? 'bad' : connection === 'reconnecting' ? 'warn' : 'good',
    },
  ];
  const delay = data.delay.avgSeconds;
  return (
    <section aria-labelledby="situacao" className="mb-8 rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-start gap-3">
        <span
          className={`mt-1 flex size-3 shrink-0 rounded-full bg-current ${TONE[hero.tone].split(' ')[0]}`}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h2 id="situacao" className="text-[22px] font-semibold leading-tight tracking-tight sm:text-[26px]">
            {hero.title}
          </h2>
          <p className="mt-1 max-w-2xl text-[14.5px] text-ink-2">{hero.text}</p>
        </div>
      </div>

      {/* The path of a number, from the TSE to this screen. */}
      <ol className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
        {steps.map((step, i) => (
          <li key={step.name} className="contents">
            {i > 0 && (
              <span aria-hidden className="hidden text-center text-[18px] text-muted sm:block">
                →
              </span>
            )}
            <span className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/40 px-3 py-2.5">
              <span
                className={`flex size-2.5 shrink-0 rounded-full bg-current ${TONE[step.tone].split(' ')[0]}`}
              />
              <span className="min-w-0">
                <span className="block text-[14.5px] font-semibold">{step.name}</span>
                <span className="block truncate text-[13px] text-muted">{step.text}</span>
              </span>
            </span>
          </li>
        ))}
      </ol>

      <dl className="mt-5 grid grid-cols-1 gap-3 border-t border-line pt-5 sm:grid-cols-3">
        <Fact
          label="Do TSE até aqui"
          value={delay != null ? `${delay.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s` : '—'}
          detail={
            delay != null ? 'em média, nos últimos 15 minutos' : 'nenhum número novo nos últimos 15 minutos'
          }
        />
        <Fact
          label="Última conferência no TSE"
          value={sinceText(data.ingestion.lastCycleAt, now)}
          detail={data.ingestion.lastCycleAt ? `às ${formatClock(data.ingestion.lastCycleAt)}` : undefined}
        />
        <Fact
          label="Urnas apuradas por minuto"
          value={fmtInt(Math.round(data.processing.sectionsPerMinute))}
          detail="média dos últimos 5 minutos"
        />
      </dl>
    </section>
  );
}

function Fact({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div>
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="numeral text-[30px] font-semibold leading-tight">{value}</dd>
      {detail && <dd className="text-[12.5px] text-muted">{detail}</dd>}
    </div>
  );
}

/** "há 12 s", or "agora" (never "há agora"). */
function sinceText(iso: string | null | undefined, now: number) {
  if (!iso) return '—';
  const a = ago(iso, now);
  return a === 'agora' ? a : `há ${a}`;
}

function Tile({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: 'bad';
}) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <dt className="text-[12px] text-muted">{label}</dt>
      <dd className={`numeral text-[22px] leading-tight ${tone === 'bad' ? 'text-bad' : ''}`}>{value}</dd>
      {detail && <dd className="text-[11.5px] text-muted">{detail}</dd>}
    </div>
  );
}

function Heatmap({ heat }: { heat: OperationsDTO['heat'] }) {
  const max = Math.max(1, ...heat.map((h) => h.sections));
  return (
    <div>
      <div
        className="mx-auto grid max-w-[360px] grid-cols-7 gap-1"
        role="list"
        aria-label="Urnas apuradas nos últimos 5 minutos, por estado"
      >
        {heat.map((h) => {
          const pos = TILES[h.uf];
          if (!pos) return null;
          const k = h.sections / max;
          return (
            <div
              key={h.uf}
              role="listitem"
              aria-label={`${h.uf}: ${fmtInt(h.sections)} urnas`}
              title={`${h.uf}: ${fmtInt(h.sections)} urnas, ${fmtInt(h.updates)} atualizações`}
              className="flex aspect-square flex-col items-center justify-center rounded-md text-[11px] font-semibold"
              style={{
                gridColumn: pos[0] + 1,
                gridRow: pos[1] + 1,
                background:
                  h.sections > 0
                    ? `color-mix(in oklab, var(--seq-high) ${Math.round(18 + k * 82)}%, var(--seq-low))`
                    : 'var(--surface-2)',
                color: k > 0.55 ? 'var(--ground)' : 'var(--ink-2)',
              }}
            >
              {h.uf}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 text-[12px] text-muted">
        <span>menos</span>
        <span
          className="h-2 w-24 rounded-full"
          style={{ background: 'linear-gradient(90deg, var(--seq-low), var(--seq-high))' }}
          aria-hidden
        />
        <span>mais urnas</span>
      </div>
    </div>
  );
}

function Cycles({ cycles }: { cycles: CycleDTO[] }) {
  const list = [...cycles].reverse();
  const max = Math.max(1, ...list.map((c) => c.requests));
  if (list.length === 0)
    return (
      <p className="py-6 text-center text-[14px] text-muted">Nenhuma rodada de coleta registrada ainda.</p>
    );
  const last = list.at(-1)!;
  return (
    <div>
      <p className="mb-2 text-[13px] text-muted">
        Consultas por rodada (a mais recente à direita). Última rodada às {formatClock(last.startedAt)}:{' '}
        {fmtInt(last.requests)} consultas em{' '}
        {last.durationMs != null
          ? `${(last.durationMs / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s`
          : '—'}
        .
      </p>
      <div
        className="flex h-24 items-end gap-[2px]"
        role="img"
        aria-label={`${list.length} rodadas de coleta`}
      >
        {list.map((c) => (
          <div
            key={c.id}
            title={`${formatClock(c.startedAt)} · ${c.requests} consultas · ${c.ok} com dados novos · ${c.notModified} sem mudança · ${c.errors} erros`}
            className="flex min-w-[3px] flex-1 flex-col-reverse overflow-hidden rounded-t-[3px]"
            style={{ height: `${Math.max(4, (c.requests / max) * 100)}%` }}
          >
            <span className="bg-live" style={{ flexGrow: c.ok || 0 }} />
            <span className="bg-line-strong" style={{ flexGrow: c.notModified || 0 }} />
            <span className="bg-bad" style={{ flexGrow: c.errors || 0 }} />
            {c.requests === 0 && <span className="flex-1 bg-line" />}
          </div>
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 text-[12px] text-muted">
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-live" aria-hidden /> dados novos
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-line-strong" aria-hidden /> sem mudança
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-bad" aria-hidden /> erros
        </li>
      </ul>
    </div>
  );
}

function Freshness({ items, now }: { items: OperationsDTO['freshness']; now: number }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {items.map((f) => {
        const age = f.updatedAt ? (now - Date.parse(f.updatedAt)) / 1000 : null;
        const tone =
          age == null ? 'text-muted' : age < 60 ? 'text-live' : age < 300 ? 'text-warn' : 'text-muted';
        return (
          <li key={f.areaKey} className="rounded-lg border border-line bg-surface px-2.5 py-2">
            <p className="truncate text-[12.5px] text-ink-2">{f.name}</p>
            <p className={`numeral text-[15px] font-medium ${tone}`}>
              {f.updatedAt ? `${ago(f.updatedAt, now)}` : 'sem dados'}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
