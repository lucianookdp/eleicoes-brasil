import type { ElectionSummary } from '@eleicoes/election-core';
import { describe, expect, it } from 'vitest';
import { pickRound, todayInBrasilia } from '../lib/rounds';

const election = (r2: string, r1 = 'final') =>
  [
    {
      slug: '2026',
      rounds: [
        { slug: '2026-1', round: 1, date: '2026-10-04', status: r1 },
        { slug: '2026-2', round: 2, date: '2026-10-25', status: r2 },
      ],
    },
  ] as unknown as ElectionSummary[];

describe('pickRound (which round the site opens on)', () => {
  it('opens the runoff as soon as it is published, once the 1st round is over', () => {
    expect(pickRound(election('scheduled'), '2026', null, new Date('2026-10-10T20:00:00-03:00'))?.slug).toBe(
      '2026-2',
    );
  });
  it('stays on the 1st round while it is still being counted', () => {
    const counting = election('scheduled', 'live');
    expect(pickRound(counting, '2026', null, new Date('2026-10-04T22:00:00-03:00'))?.slug).toBe('2026-1');
    // No runoff published: the 1st round, over or not.
    const alone = [{ slug: '2026', rounds: [election('scheduled')[0]!.rounds[0]] }] as ElectionSummary[];
    expect(pickRound(alone, '2026', null, new Date('2026-10-10T20:00:00-03:00'))?.slug).toBe('2026-1');
  });
  it('opens the runoff from midnight in Brasília on its day, whatever the 1st round says', () => {
    const stuck = election('scheduled', 'live');
    expect(pickRound(stuck, '2026', null, new Date('2026-10-24T20:00:00-03:00'))?.slug).toBe('2026-1');
    expect(pickRound(stuck, '2026', null, new Date('2026-10-25T00:05:00-03:00'))?.slug).toBe('2026-2');
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
