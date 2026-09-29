import type { OverviewDTO } from '@eleicoes/election-core';
import type { Metadata } from 'next';
import { OverviewView } from '@/components/overview';
import { serverApi } from '@/lib/api';
import { resolveRoundSlug } from '@/lib/server-round';

type Props = {
  params: Promise<{ year: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year } = await params;
  return { title: year === 'demo' ? 'Demonstração' : `Eleições ${year}` };
}

export default async function ElectionPage({ params, searchParams }: Props) {
  const { year } = await params;
  const slug = await resolveRoundSlug(year, searchParams);
  const initial = slug ? await serverApi<OverviewDTO>(`/api/elections/${slug}/overview`) : null;
  return <OverviewView initial={initial} />;
}
