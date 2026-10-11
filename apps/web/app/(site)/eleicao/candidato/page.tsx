'use client';

import { isStateCode } from '@eleicoes/election-core';
import { useSearchParams } from 'next/navigation';
import { CandidateView } from '@/components/candidate-view';
import { EmptyState } from '@/components/ui';

export default function CandidatePage() {
  const params = useSearchParams();
  const office = params.get('cargo') ?? '';
  const number = params.get('n') ?? '';
  const uf = (params.get('uf') ?? '').toUpperCase();
  if (!/^[a-z0-9-]{1,40}$/.test(office) || !/^\d{1,5}$/.test(number) || (uf !== '' && !isStateCode(uf))) {
    return <EmptyState title="Candidato não encontrado." />;
  }
  return <CandidateView key={`${office}-${uf}-${number}`} office={office} number={number} uf={uf || null} />;
}
