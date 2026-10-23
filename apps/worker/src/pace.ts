import { DEFAULT_TIMEZONE } from '@eleicoes/election-core';

const MINUTE = 60_000;

/** "2026-10-25": the calendar day in Brasília, where election days are counted. */
export function dayInBrasilia(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: DEFAULT_TIMEZONE }).format(now);
}

/**
 * How long the main loop waits before the next headline cycle. The configured interval (seconds)
 * is for a count in progress; outside it there is nothing to chase, and every request is one the
 * TSE answers for nothing:
 * - round not published yet: once a minute (repeated 404s can get an IP blocked)
 * - count closed for a while: every 5 minutes
 * - official round published days ahead, everything at zero: once a minute until the eve of its
 *   day. From midnight (Brasília) of the day before it is back to the configured interval, whatever
 *   the files say: a whole day to see the fast pace running before the first partial result.
 */
export function nextWait(o: {
  intervalMs: number;
  cycle: 'ok' | 'degraded' | 'failed' | 'waiting';
  settled: boolean;
  notStarted: boolean;
  /** A real election followed in production (never the demo or the TSE's simulations). */
  official: boolean;
  roundDate: string;
  today: string;
}): number {
  if (o.cycle === 'waiting') return MINUTE;
  if (o.settled) return Math.max(o.intervalMs, 5 * MINUTE);
  if (o.official && o.notStarted && o.today < dayBefore(o.roundDate)) return Math.max(o.intervalMs, MINUTE);
  return o.intervalMs;
}

/** "2026-10-25" → "2026-10-24". */
const dayBefore = (date: string) =>
  new Date(Date.parse(`${date}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
