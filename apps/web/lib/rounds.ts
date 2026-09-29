import type { ElectionSummary, RoundSummary } from '@eleicoes/election-core';

/** URL "/elections/2026?turno=2" ↔ API round "2026-2". */
export const roundSlug = (electionSlug: string, turno: number) => `${electionSlug}-${turno}`;

export function pickRound(
  elections: ElectionSummary[],
  electionSlug: string,
  turno?: string | null,
): RoundSummary | null {
  const election = elections.find((e) => e.slug === electionSlug);
  if (!election) return null;
  if (turno) return election.rounds.find((r) => String(r.round) === turno) ?? null;
  // Latest round that already started; otherwise the first one.
  const started = election.rounds.filter((r) => r.status !== 'scheduled');
  return started.at(-1) ?? election.rounds[0] ?? null;
}

/** Election opened at "/": a live round, else the newest real election with data, else the demo. */
export function defaultElection(elections: ElectionSummary[]): ElectionSummary | null {
  const real = elections.filter((e) => !e.demo && !e.slug.startsWith('replay-'));
  return (
    real.find((e) => e.rounds.some((r) => r.status === 'live')) ??
    real.find((e) => e.rounds.some((r) => r.status !== 'scheduled')) ??
    elections.find((e) => e.demo && e.rounds.some((r) => r.status !== 'scheduled')) ??
    real[0] ??
    elections[0] ??
    null
  );
}

export function electionHref(round: Pick<RoundSummary, 'electionSlug' | 'round'>, path = '') {
  return `/elections/${round.electionSlug}${path}?turno=${round.round}`;
}
