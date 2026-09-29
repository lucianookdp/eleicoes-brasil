import type { CityDetailDTO } from '@eleicoes/election-core';
import { isStateCode } from '@eleicoes/election-core';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CityView } from '@/components/city-view';
import { serverApi } from '@/lib/api';
import { resolveRoundSlug } from '@/lib/server-round';

type Props = {
  params: Promise<{ year: string; uf: string; city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { year, uf, city } = await params;
  const slug = await resolveRoundSlug(year, searchParams);
  const data = slug
    ? await serverApi<CityDetailDTO>(`/api/elections/${slug}/states/${uf.toLowerCase()}/cities/${city}`)
    : null;
  return { title: data ? `${data.city.name} (${uf.toUpperCase()})` : 'Município' };
}

export default async function CityPage({ params, searchParams }: Props) {
  const { year, uf, city } = await params;
  if (!isStateCode(uf) || !/^\d{5}$/.test(city)) notFound();
  const slug = await resolveRoundSlug(year, searchParams);
  const initial = slug
    ? await serverApi<CityDetailDTO>(`/api/elections/${slug}/states/${uf.toLowerCase()}/cities/${city}`)
    : null;
  return <CityView uf={uf.toUpperCase()} city={city} initial={initial} />;
}
