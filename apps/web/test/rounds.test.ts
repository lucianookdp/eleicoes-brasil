import type { ElectionSummary } from '@eleicoes/election-core';
import { describe, expect, it } from 'vitest';
import { pickRound, todayInBrasilia } from '../lib/rounds';

const election = (r2: string) =>
  [
    {
      slug: '2026',
      rounds: [
        { slug: '2026-1', round: 1, date: '2026-10-04', status: 'final' },
        { slug: '2026-2', round: 2, date: '2026-10-25', status: r2 },
      ],
    },
  ] as unknown as ElectionSummary[];

describe('pickRound (which round the site opens on)', () => {
  it('stays on the 1st round until runoff day', () => {
    expect(pickRound(election('scheduled'), '2026', null, new Date('2026-10-24T20:00:00-03:00'))?.slug).toBe(
      '2026-1',
    );
  });
  it('opens the runoff from midnight in Brasília, before the count starts', () => {
    expect(pickRound(election('scheduled'), '2026', null, new Date('2026-10-25T00:05:00-03:00'))?.slug).toBe(
      '2026-2',
    );
    // Still the 24th in Brasília even when it is already the 25th in UTC.
    expect(todayInBrasilia(new Date('2026-10-25T01:00:00Z'))).toBe('2026-10-24');
  });
  it('opens the runoff once it is live, whatever the date', () => {
    expect(pickRound(election('live'), '2026', null, new Date('2026-10-20T12:00:00-03:00'))?.slug).toBe(
      '2026-2',
    );
  });
  it('an explicit ?t= always wins', () => {
    expect(pickRound(election('live'), '2026', '1')?.slug).toBe('2026-1');
  });
});
