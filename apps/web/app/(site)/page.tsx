'use client';

import type { ElectionSummary } from '@eleicoes/election-core';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { defaultElection, electionHref } from '@/lib/rounds';

/** Opens the election that matters now: live, else the latest with data, else the demo. */
export default function Home() {
  const router = useRouter();
  const { data, error } = useQuery({
    queryKey: ['elections'],
    queryFn: () => api<ElectionSummary[]>('/api/elections'),
  });
  const election = data && defaultElection(data);
  useEffect(() => {
    if (!election) return;
    const round = election.rounds.filter((r) => r.status !== 'scheduled').at(-1) ?? election.rounds[0]!;
    router.replace(electionHref(round));
  }, [election, router]);
  return (
    <div className="max-w-xl py-16">
      <p className="text-ink-2">
        {error
          ? 'Não foi possível falar com a API agora. Tente novamente em alguns instantes.'
          : data && !election
            ? 'Nenhuma eleição foi carregada ainda.'
            : 'Carregando a apuração…'}
      </p>
    </div>
  );
}
