import type { StateDetailDTO } from '@eleicoes/election-core';
import { getState, isStateCode } from '@eleicoes/election-core';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StateView } from '@/components/state-view';
import { serverApi } from '@/lib/api';
import { resolveRoundSlug } from '@/lib/server-round';

type Props = {
  params: Promise<{ year: string; uf: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uf } = await params;
  return { title: getState(uf)?.name ?? uf.toUpperCase() };
}

export default async function StatePage({ params, searchParams }: Props) {
  const { year, uf } = await params;
  if (!isStateCode(uf)) notFound();
  const slug = await resolveRoundSlug(year, searchParams);
  const initial = slug
    ? await serverApi<StateDetailDTO>(`/api/elections/${slug}/states/${uf.toLowerCase()}`)
    : null;
  return <StateView uf={uf.toUpperCase()} initial={initial} />;
}
