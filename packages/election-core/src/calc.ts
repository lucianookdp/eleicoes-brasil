import type { CandidateResult, CountingProgress } from './domain';

/** part / whole × 100, or `null` when it cannot be computed honestly. */
export function percent(part: number | null | undefined, whole: number | null | undefined): number | null {
  if (part == null || whole == null || !Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) {
    return null;
  }
  return (part / whole) * 100;
}

/** Counted sections %, preferring the provider's own figure. */
export function countedPct(
  p: Pick<CountingProgress, 'sectionsCountedPct' | 'sectionsCounted' | 'sectionsTotal'>,
) {
  return p.sectionsCountedPct ?? percent(p.sectionsCounted, p.sectionsTotal);
}

/** Candidate row stored in snapshots: [candidateKey, votes, percent]. Compact on purpose. */
export type CompactCandidate = [key: string, votes: number, percent: number | null];

export function compactCandidates(candidates: CandidateResult[]): CompactCandidate[] {
  return candidates.map((c) => [c.key, c.votes, c.percent]);
}

export interface CandidateDelta {
  votes: number | null;
  /** Percentage-point change. */
  pp: number | null;
}

/** Change per candidate between two snapshots. Missing previous value → `null`, not 0. */
export function candidateDeltas(
  previous: CompactCandidate[] | null | undefined,
  current: CompactCandidate[],
): Map<string, CandidateDelta> {
  const prev = new Map((previous ?? []).map((c) => [c[0], c]));
  const out = new Map<string, CandidateDelta>();
  for (const [key, votes, pct] of current) {
    const p = prev.get(key);
    out.set(key, {
      votes: p ? votes - p[1] : null,
      pp: p && pct != null && p[2] != null ? pct - p[2] : null,
    });
  }
  return out;
}

export interface ProgressDelta {
  sectionsAdded: number | null;
  turnoutAdded: number | null;
  countedPctChange: number | null;
}

export function progressDelta(
  previous: CountingProgress | null | undefined,
  current: CountingProgress,
): ProgressDelta {
  const diff = (a: number | null | undefined, b: number | null | undefined) =>
    a == null || b == null ? null : b - a;
  const pc = countedPct(current);
  const pp = previous ? countedPct(previous) : null;
  return {
    sectionsAdded: diff(previous?.sectionsCounted, current.sectionsCounted),
    turnoutAdded: diff(previous?.turnout, current.turnout),
    countedPctChange: pc != null && pp != null ? pc - pp : null,
  };
}

/** True when a progress update carries new information worth a snapshot. */
export function progressChanged(
  previous: CountingProgress | null | undefined,
  current: CountingProgress,
): boolean {
  if (!previous) return true;
  return (
    previous.status !== current.status ||
    previous.sectionsCounted !== current.sectionsCounted ||
    previous.turnout !== current.turnout ||
    previous.electorateCounted !== current.electorateCounted ||
    previous.totalizedAt !== current.totalizedAt
  );
}

/** Votes desc, then ballot number asc: deterministic ordering for display. */
export function rankCandidates<T extends { votes: number; number: string }>(list: T[]): T[] {
  return [...list].sort(
    (a, b) => b.votes - a.votes || a.number.localeCompare(b.number, 'pt-BR', { numeric: true }),
  );
}
