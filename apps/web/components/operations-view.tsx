'use client';

import type { CycleDTO, IngestionStatus, OperationsDTO } from '@eleicoes/election-core';
import { formatClock } from '@eleicoes/election-core';
import { useEffect, useState } from 'react';
import { ago, fmtCompact, fmtInt } from '@/lib/format';
import { useOperations, useOverview } from '@/lib/queries';
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

const STATE_LABEL: Record<IngestionStatus['state'], { label: string; cls: string; hint: string }> = {
  healthy: {
    label: 'funcionando',
    cls: 'text-live bg-live-soft',
    hint: 'Conferimos o TSE a cada poucos segundos.',
  },
  degraded: {
    label: 'instável',
    cls: 'text-warn bg-warn-soft',
    hint: 'A última tentativa teve falhas. Os dados podem atrasar um pouco.',
  },
  offline: {
    label: 'parada',
    cls: 'text-bad bg-bad-soft',
    hint: 'A coleta não responde há mais de 2 minutos.',
  },
  idle: {
    label: 'pausada',
    cls: 'text-muted bg-surface-2',
    hint: 'Nenhuma coleta em andamento para esta eleição.',
  },
  waiting: {
    label: 'aguardando o TSE',
    cls: 'text-info bg-surface-2',
    hint: 'O TSE ainda não publicou os dados desta eleição. Conferimos a cada minuto.',
  },
};

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
  const s = STATE_LABEL[data.ingestion.state];

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
      <Panel className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-[14px]">
        <span className={`inline-flex items-center gap-2 rounded-md px-2.5 py-1 font-medium ${s.cls}`}>
          <span
            className={`size-2 rounded-full bg-current ${data.ingestion.state === 'healthy' ? 'pulse-dot' : ''}`}
            aria-hidden
          />
          Coleta {s.label}
        </span>
        <span className="text-ink-2">{s.hint}</span>
        <span className="text-muted">Última verificação {sinceText(data.ingestion.lastCycleAt, now)}</span>
        {data.ingestion.lastError && (
          <span className="w-full truncate font-mono text-[12px] text-warn">{data.ingestion.lastError}</span>
        )}
      </Panel>

      <section aria-labelledby="ritmo" className="mb-8">
        <SectionTitle id="ritmo" title="Ritmo da apuração">
          Média dos últimos 5 minutos.
        </SectionTitle>
        <div className="mb-3 rounded-xl border border-line bg-surface px-4 py-3">
          <p className="text-[13px] text-muted">
            Tempo entre o TSE divulgar um número e ele aparecer aqui (Brasil e estados, últimos 15 min)
          </p>
          <p className="numeral text-[28px] leading-tight">
            {data.delay.avgSeconds != null
              ? `${data.delay.avgSeconds.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s`
              : '—'}
            <span className="ml-3 text-[14px] font-normal text-muted">
              {data.delay.p95Seconds != null
                ? `95% em até ${data.delay.p95Seconds.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s · ${data.delay.samples} atualizações`
                : 'sem atualizações recentes'}
            </span>
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tile label="Urnas por minuto" value={fmtInt(Math.round(data.processing.sectionsPerMinute))} />
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
      </section>

      <div className="mb-8 grid items-start gap-6 lg:grid-cols-12 [&>*]:min-w-0">
        <section aria-labelledby="calor" className="lg:col-span-5">
          <SectionTitle id="calor" title="Onde a apuração avançou">
            Urnas apuradas por estado nos últimos 5 minutos.
          </SectionTitle>
          <Panel className="p-3 sm:p-4">
            <Heatmap heat={data.heat} />
          </Panel>
        </section>
        <section aria-labelledby="log" className="lg:col-span-7">
          <SectionTitle id="log" title="Atualizações recentes" />
          <Panel className="max-h-[420px] overflow-y-auto px-3 py-1 sm:px-4">
            <ActivityFeed events={data.events} max={60} />
          </Panel>
        </section>
      </div>

      {meta?.features.advancedOperations !== false && (
        <section aria-labelledby="coleta" className="mb-8">
          <SectionTitle id="coleta" title="Nossa coleta">
            Consultas do nosso sistema aos arquivos públicos do TSE nos últimos {data.requests.windowMinutes}{' '}
            minutos.
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
          <Panel className="p-3 sm:p-4">
            <Cycles cycles={data.cycles} />
          </Panel>
        </section>
      )}

      <section aria-labelledby="frescor">
        <SectionTitle id="frescor" title="Última atualização por local">
          Há quanto tempo cada lugar recebeu dados novos.
        </SectionTitle>
        <Freshness items={data.freshness} now={now} />
      </section>
    </>
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
            <p className={`font-mono text-[14px] ${tone}`}>
              {f.updatedAt ? `${ago(f.updatedAt, now)}` : 'sem dados'}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
