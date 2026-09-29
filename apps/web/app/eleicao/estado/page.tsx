'use client';

import { isStateCode } from '@eleicoes/election-core';
import { useSearchParams } from 'next/navigation';
import { StateView } from '@/components/state-view';
import { EmptyState } from '@/components/ui';

export default function StatePage() {
  const uf = (useSearchParams().get('uf') ?? '').toUpperCase();
  if (!isStateCode(uf)) return <EmptyState title="Estado não encontrado." />;
  return <StateView key={uf} uf={uf} initial={null} />;
}
