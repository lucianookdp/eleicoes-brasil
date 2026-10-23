'use client';

import type { CycleDTO, IngestionStatus, OperationsDTO } from '@eleicoes/election-core';
import { formatClock } from '@eleicoes/election-core';
import { useEffect, useState } from 'react';
import { ago, fmtCompact, fmtInt } from '@/lib/format';
import { useOperations, useOverview } from '@/lib/queries';
import { useRealtime } from '@/lib/realtime';
import { Occurrences } from './occurrences';
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
 * "Transparência da apuração" (the page that was "Bastidores", same address): whether the numbers
 * are arriving now, everything abnormal recorded for the round, and the technical details folded.
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
        <h1 className="text-[24px] font-semibold tracking-tight sm:text-[28px]">Transparência da apuração</h1>
        <p className="max-w-2xl text-[14px] text-ink-2">
          Aqui você confere se os resultados estão chegando do TSE ao site sem atraso e se houve algum
          problema na divulgação.
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
      <StatusHero
        data={data}
        roundFinal={overview?.round.status === 'final'}
        notStarted={overview?.progress?.status === 'not-started'}
        live={overview?.round.status === 'live'}
        now={now}
      />

      <Occurrences />

      {meta?.features.advancedOperations !== false && (
        <details className="group mb-8 rounded-xl border border-line bg-surface px-4 py-3">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between font-medium">
            Detalhes técnicos da coleta
            <span aria-hidden className="text-muted transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <section aria-labelledby="frescor" className="mt-3">
            <SectionTitle id="frescor" title="Quando cada lugar foi atualizado">
              Há quanto tempo o Brasil e cada estado receberam números novos.
            </SectionTitle>
            <Freshness items={data.freshness} now={now} />
          </section>
          <section aria-labelledby="coleta" className="mt-6">
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
function StatusHero({
  data,
  roundFinal,
  notStarted,
  live,
  now,
}: {
  data: OperationsDTO;
  roundFinal: boolean;
  /** Published by the TSE but nothing counted yet (the days and hours before the vote). */
  notStarted: boolean;
  /** Count in progress: only then does "urnas por minuto" say something. */
  live: boolean;
  now: number;
}) {
  const { connection } = useRealtime();
  const state = data.ingestion.state;
  const ready = notStarted && (state === 'healthy' || state === 'idle');
  const hero =
    roundFinal && (state === 'idle' || state === 'healthy')
      ? {
          title: 'Apuração encerrada',
          text: 'Todos os números já chegaram. Seguimos conferindo o TSE de tempos em tempos.',
          tone: 'good' as Tone,
        }
      : ready
        ? {
            title: 'Pronto para a apuração',
            text: 'O TSE ainda não começou a divulgar. Já estamos conferindo, e os números aparecem aqui sozinhos quando saírem.',
            tone: 'good' as Tone,
          }
        : HERO[state];
  const steps: { name: string; text: string; tone: Tone }[] = [
    {
      name: 'TSE',
      text: state === 'waiting' ? 'ainda não publicou' : ready ? 'ainda sem números' : 'publica os números',
      tone: state === 'waiting' || ready ? 'info' : 'good',
    },
    {
      name: 'Coleta',
      text:
        state === 'offline'
          ? 'parada'
          : state === 'degraded'
            ? 'instável'
            : state === 'idle'
              ? 'em pausa'
              : 'conferindo',
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
  // The TSE's own time for its latest totalization of Brazil: official, unlike a "delay" worked out
  // from the time written in each file (which does not change when the TSE updates a file).
  const tse = data.freshness.find((f) => f.areaKey === 'br')?.totalizedAt ?? null;
  return (
    <section aria-labelledby="situacao" className="mb-6 rounded-2xl border border-line bg-surface p-4 sm:p-6">
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
      <ol className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
        {steps.map((step, i) => (
          <li key={step.name} className="contents">
            {i > 0 && (
              <span aria-hidden className="hidden text-center text-[18px] text-muted sm:block">
                →
              </span>
            )}
            <span className="flex min-w-0 flex-col gap-1 rounded-xl border border-line bg-surface-2/40 px-2.5 py-2 sm:flex-row sm:items-center sm:gap-3 sm:px-3 sm:py-2.5">
              <span className="flex items-center gap-1.5 text-[13.5px] font-semibold sm:text-[14.5px]">
                <span
                  className={`flex size-2.5 shrink-0 rounded-full bg-current ${TONE[step.tone].split(' ')[0]}`}
                />
                {step.name}
              </span>
              <span className="text-[12px] leading-tight text-muted sm:text-[13px]">{step.text}</span>
            </span>
          </li>
        ))}
      </ol>

      {/* Outside the count, "urnas por minuto" is a zero that only raises questions. */}
      <dl className={`mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 ${live ? 'sm:grid-cols-3' : ''}`}>
        <Fact
          label="Última conferência no TSE"
          value={sinceText(data.ingestion.lastCycleAt, now)}
          detail={data.ingestion.lastCycleAt ? `às ${formatClock(data.ingestion.lastCycleAt)}` : undefined}
        />
        <Fact
          label="Último resultado do TSE"
          value={tse ? formatClock(tse) : '—'}
          detail={tse ? `Brasil, ${sinceText(tse, now)}` : 'ainda não saiu'}
        />
        {live && (
          <Fact
            label="Urnas apuradas por minuto"
            value={fmtInt(Math.round(data.processing.sectionsPerMinute))}
            detail="média dos últimos 5 minutos"
          />
        )}
      </dl>
    </section>
  );
}

function Fact({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div>
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="numeral text-[24px] font-semibold leading-tight sm:text-[28px]">{value}</dd>
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
