'use client';

import type { CityDetailDTO } from '@eleicoes/election-core';
import { useCity, useResult } from '@/lib/queries';
import { CountingHero } from './counting';
import { ResultPanel, useOfficeParam } from './results';
import { useRound } from './shell';
import { Breadcrumbs, ErrorNotice, FavoriteButton, SectionTitle, Skeleton } from './ui';

export function CityView({ uf, city, initial }: { uf: string; city: string; initial: CityDetailDTO | null }) {
  const { round, href } = useRound();
  const { data, error, refetch } = useCity(
    round.slug,
    uf.toLowerCase(),
    city,
    initial?.round.slug === round.slug ? initial : null,
  );
  const key = `${uf.toLowerCase()}-${city}`;
  const offices = data?.results.map((r) => r.office) ?? [];
  const [office] = useOfficeParam(offices);
  const current = useResult(round.slug, key, office?.slug);

  if (!data)
    return error ? <ErrorNotice error={error} retry={() => refetch()} /> : <Skeleton className="h-96" />;
  const initialResult = data.results.find((r) => r.office.slug === office?.slug) ?? null;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Brasil', href: href() },
          { label: data.stateName, href: href(`/states/${uf.toLowerCase()}`) },
          { label: data.city.name },
        ]}
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight sm:text-[32px]">{data.city.name}</h1>
          <p className="text-[13px] text-muted">
            {data.city.isCapital ? `Capital · ${data.stateName}` : data.stateName} · código TSE{' '}
            {data.city.code}
            {data.city.ibgeCode && ` · IBGE ${data.city.ibgeCode}`}
          </p>
        </div>
        <FavoriteButton
          favorite={{
            key,
            label: data.city.name,
            detail: uf,
            path: `/states/${uf.toLowerCase()}/cities/${city}`,
          }}
        />
      </div>
      <CountingHero
        progress={data.progress}
        votes={(current.data ?? initialResult)?.votes}
        votesFor={office?.name}
        title={`Totalização em ${data.city.name}`}
      />

      <section aria-labelledby="resultados" className="mt-8 max-w-3xl">
        <SectionTitle id="resultados" title="Resultados por cargo" />
        <ResultPanel roundSlug={round.slug} areaKey={key} offices={offices} initial={initialResult} />
      </section>

      {data.city.zones.length > 0 && (
        <section aria-labelledby="zonas" className="mt-12 max-w-3xl">
          <SectionTitle id="zonas" title="Zonas eleitorais">
            Zonas que atendem este município segundo o cadastro da Justiça Eleitoral.
          </SectionTitle>
          <ul className="flex flex-wrap gap-2">
            {data.city.zones.map((z) => (
              <li key={z} className="rounded-md border border-line px-2.5 py-1 font-mono text-[13px]">
                Zona {z}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13px] text-muted">
            Resultados por zona e a lista de seções serão exibidos quando essa coleta for ativada. Esta versão
            mostra apenas o que já é coletado.
          </p>
        </section>
      )}
    </>
  );
}
