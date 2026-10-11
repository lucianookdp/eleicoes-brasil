import { describe, expect, it } from 'vitest';
import { dayInBrasilia, nextWait } from '../src/pace';

const base = {
  intervalMs: 5000,
  cycle: 'ok' as const,
  settled: false,
  notStarted: false,
  official: true,
  roundDate: '2026-10-25',
  today: '2026-10-25',
};

describe('nextWait (how often the collector asks the TSE)', () => {
  it('a count in progress keeps the configured interval', () => {
    expect(nextWait(base)).toBe(5000);
    expect(nextWait({ ...base, cycle: 'degraded' })).toBe(5000);
    expect(nextWait({ ...base, cycle: 'failed' })).toBe(5000);
  });
  it('a round published days ahead, with nothing counted, is checked once a minute', () => {
    expect(nextWait({ ...base, notStarted: true, today: '2026-10-10' })).toBe(60_000);
    expect(nextWait({ ...base, notStarted: true, today: '2026-10-24' })).toBe(60_000);
  });
  it('from midnight of election day it is the configured interval, before the first vote', () => {
    expect(nextWait({ ...base, notStarted: true, today: '2026-10-25' })).toBe(5000);
    expect(nextWait({ ...base, notStarted: true, today: '2026-10-26' })).toBe(5000);
  });
  it('a count that started early is followed at once, whatever the date', () => {
    expect(nextWait({ ...base, notStarted: false, today: '2026-10-10' })).toBe(5000);
  });
  it('the demo and the simulations are never slowed down', () => {
    expect(nextWait({ ...base, official: false, notStarted: true, today: '2026-10-10' })).toBe(5000);
  });
  it('round not published: once a minute; count closed: every 5 minutes', () => {
    expect(nextWait({ ...base, cycle: 'waiting' })).toBe(60_000);
    expect(nextWait({ ...base, settled: true })).toBe(300_000);
  });
  it('never faster than the configured interval', () => {
    expect(nextWait({ ...base, intervalMs: 120_000, notStarted: true, today: '2026-10-10' })).toBe(120_000);
  });
});

describe('dayInBrasilia', () => {
  it('is the day in Brasília, not in UTC', () => {
    expect(dayInBrasilia(new Date('2026-10-25T01:00:00Z'))).toBe('2026-10-24');
    expect(dayInBrasilia(new Date('2026-10-25T03:00:00Z'))).toBe('2026-10-25');
  });
});
