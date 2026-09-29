import type { ElectionSummary } from '@eleicoes/election-core';
import { serverApi } from './api';
import { pickRound } from './rounds';

/** Resolves "/elections/2026?turno=1" to the API round slug on the server. */
export async function resolveRoundSlug(
  year: string,
  searchParams: Promise<Record<string, string | string[] | undefined>>,
) {
  const sp = await searchParams;
  const turno = typeof sp.turno === 'string' ? sp.turno : null;
  const elections = await serverApi<ElectionSummary[]>('/api/elections', 15);
  return elections ? (pickRound(elections, year, turno)?.slug ?? null) : null;
}
