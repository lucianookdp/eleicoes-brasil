import type { ElectionSummary } from '@eleicoes/election-core';
import { redirect } from 'next/navigation';
import { serverApi } from '@/lib/api';
import { defaultElection, electionHref } from '@/lib/rounds';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const elections = await serverApi<ElectionSummary[]>('/api/elections', 15);
  const election = elections && defaultElection(elections);
  if (election) {
    const round = election.rounds.filter((r) => r.status !== 'scheduled').at(-1) ?? election.rounds[0]!;
    redirect(electionHref(round));
  }
  return (
    <main className="mx-auto max-w-xl px-4 py-24">
      <h1 className="text-2xl font-semibold">Eleições Brasil</h1>
      <p className="mt-3 text-ink-2">
        {elections
          ? 'Nenhuma eleição foi carregada ainda. Inicie o coletor para registrar a primeira.'
          : 'Não foi possível falar com a API agora. Tente novamente em alguns instantes.'}
      </p>
    </main>
  );
}
