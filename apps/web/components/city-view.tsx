'use client';

import type { CityDetailDTO } from '@eleicoes/election-core';
import { useCity, useResult } from '@/lib/queries';
import { CountingHero } from './counting';
import { ResultPanel, useOfficeParam } from './results';
import { useRound } from './shell';
import { Breadcrumbs, ErrorNotice, FavoriteButton, SectionTitle, Skeleton, StateFlag } from './ui';

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
          <p className="flex items-center gap-1.5 text-[13px] text-muted">
            <StateFlag uf={uf} size={18} />
            {data.city.isCapital ? `Capital de ${data.stateName}` : data.stateName}
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
        title={`Apuração em ${data.city.name}`}
      />

      <section aria-labelledby="resultados" className="mt-8 max-w-3xl">
        <SectionTitle id="resultados" title="Resultados por cargo">
          Site em fase de testes: os resultados por município podem chegar alguns minutos depois do TSE.
        </SectionTitle>
        <ResultPanel
          roundSlug={round.slug}
          areaKey={key}
          offices={offices}
          initial={initialResult}
          areaPct={data.progress?.countedPct}
        />
      </section>
    </>
  );
}
