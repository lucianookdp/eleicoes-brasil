'use client';

import { isStateCode } from '@eleicoes/election-core';
import { useSearchParams } from 'next/navigation';
import { CityView } from '@/components/city-view';
import { EmptyState } from '@/components/ui';

export default function CityPage() {
  const params = useSearchParams();
  const uf = (params.get('uf') ?? '').toUpperCase();
  const city = params.get('c') ?? '';
  if (!isStateCode(uf) || !/^\d{5}$/.test(city)) return <EmptyState title="Município não encontrado." />;
  return <CityView key={`${uf}-${city}`} uf={uf} city={city} initial={null} />;
}
