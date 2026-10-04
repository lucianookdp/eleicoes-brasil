'use client';

import type { StateDetailDTO } from '@eleicoes/election-core';
import { formatClock } from '@eleicoes/election-core';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fmtInt, fmtPct } from '@/lib/format';
import { useCities, useResult, useSeries, useStateDetail } from '@/lib/queries';
import { CountingHero } from './counting';
import { EvolutionChart } from './evolution-chart';
import { ResultPanel, useOfficeParam } from './results';
import { useRound } from './shell';
import {
  Breadcrumbs,
  EmptyState,
  ErrorNotice,
  FavoriteButton,
  FreshnessNotice,
  Panel,
  ProgressBar,
  SectionTitle,
  Skeleton,
} from './ui';

export function StateView({ uf, initial }: { uf: string; initial: StateDetailDTO | null }) {
  const { round, href } = useRound();
  const { data, error, refetch } = useStateDetail(
    round.slug,
    uf,
    initial?.round.slug === round.slug ? initial : null,
  );
  const offices = data?.offices ?? [];
  const [office] = useOfficeParam(offices);
  const key = uf.toLowerCase();
  const result = useResult(round.slug, key, office?.slug);
  const series = useSeries(round.slug, office?.kind === 'majoritarian' ? office.slug : undefined, key);

  if (!data) {
    return error ? <ErrorNotice error={error} retry={() => refetch()} /> : <Skeleton className="h-96" />;
  }
  return (
    <>
      <Breadcrumbs items={[{ label: 'Brasil', href: href() }, { label: data.name }]} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px] font-semibold tracking-tight sm:text-[32px]">{data.name}</h1>
        <FavoriteButton favorite={{ key, label: data.name, detail: uf, path: `/states/${key}` }} />
      </div>
      <FreshnessNotice ingestion={data.ingestion} progress={data.progress} roundStatus={data.round.status} />
      <CountingHero
        progress={data.progress}
        votes={result.data?.votes}
        votesFor={office?.name}
        title={`Apuração em ${data.name}`}
      />

      <section aria-labelledby="cargos" className="mt-8">
        <SectionTitle id="cargos" title="Resultados por cargo" />
        {offices.length === 0 ? (
          <EmptyState title="Nenhum cargo em disputa neste estado." />
        ) : (
          <div className="grid gap-8 lg:grid-cols-12 [&>*]:min-w-0">
            <div className="lg:col-span-7">
              <ResultPanel roundSlug={round.slug} areaKey={key} offices={offices} />
            </div>
            <div className="lg:col-span-5">
              {office?.kind === 'majoritarian' && (
                <Panel className="p-3 sm:p-4">
                  <h3 className="mb-2 text-[14px] font-medium text-ink-2">Evolução · {office.name}</h3>
                  {series.data ? (
                    <EvolutionChart series={series.data} majority={office.slug !== 'senador'} />
                  ) : (
                    <Skeleton className="h-72" />
                  )}
                </Panel>
              )}
            </div>
          </div>
        )}
      </section>

      <Cities uf={uf} total={data.cityCount} />
    </>
  );
}

const CITY_SORTS = [
  { value: 'default', label: 'Capital primeiro' },
  { value: 'name', label: 'Nome' },
  { value: 'counted-desc', label: 'Mais apurados' },
  { value: 'counted-asc', label: 'Menos apurados' },
  { value: 'turnout', label: 'Mais votos' },
  { value: 'updated', label: 'Atualizados agora' },
];

function Cities({ uf, total }: { uf: string; total: number }) {
  const { round, href } = useRound();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [sort, setSort] = useState('default');
  const [page, setPage] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(q);
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  const { data, isFetching } = useCities(round.slug, uf.toLowerCase(), { q: debounced, sort, page });
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <section aria-labelledby="municipios" className="mt-12">
      <SectionTitle id="municipios" title="Municípios">
        {fmtInt(total)} municípios
      </SectionTitle>
      <div className="mb-3 flex flex-wrap gap-2">
        <label className="min-w-0 flex-1 basis-60">
          <span className="sr-only">Buscar município</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar município…"
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-[14px] placeholder:text-muted focus:border-line-strong"
          />
        </label>
        <label className="flex items-center gap-2 text-[13px] text-muted">
          Ordenar
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-line bg-surface px-2 text-[14px] text-ink"
          >
            {CITY_SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {data && data.items.length === 0 && (
        <EmptyState title={`Nenhum município encontrado para “${debounced}”.`} />
      )}
      <ul className={`grid gap-x-6 sm:grid-cols-2 xl:grid-cols-3 ${isFetching ? 'opacity-70' : ''}`}>
        {(data?.items ?? []).map((c) => {
          const p = c.progress;
          return (
            <li key={c.code} className="border-b border-line">
              <Link
                href={href(`/states/${uf.toLowerCase()}/cities/${c.code}`)}
                className="block py-3 hover:bg-surface-2/60"
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-medium">
                    {c.name}
                    {c.isCapital && (
                      <span className="ml-1.5 text-[12px] font-normal text-muted">capital</span>
                    )}
                  </span>
                  <span className="numeral text-[15px]">
                    {p && p.status !== 'not-started' ? fmtPct(p.countedPct) : '—'}
                  </span>
                </span>
                <ProgressBar
                  value={p?.countedPct ?? null}
                  label={`${c.name}: urnas apuradas`}
                  className="mt-1.5"
                />
                <span className="mt-1 flex justify-between text-[12.5px] text-muted">
                  <span>
                    {fmtInt(p?.sectionsCounted)} de {fmtInt(p?.sectionsTotal)} urnas
                  </span>
                  <span>{p?.turnout != null ? `${fmtInt(p.turnout)} votos` : ''}</span>
                </span>
                {p?.totalizedAt && (
                  <span className="sr-only">Atualizado às {formatClock(p.totalizedAt)}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      {pages > 1 && (
        <nav
          aria-label="Páginas de municípios"
          className="mt-4 flex items-center justify-between text-[14px]"
        >
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="h-10 rounded-lg border border-line px-4 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-muted">
            Página {page} de {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="h-10 rounded-lg border border-line px-4 disabled:opacity-40"
          >
            Próxima
          </button>
        </nav>
      )}
    </section>
  );
}
