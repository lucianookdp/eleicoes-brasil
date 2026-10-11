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
 * - official round published days ahead, everything at zero: once a minute until its day. From
 *   midnight (Brasília) of election day it is back to the configured interval, whatever the files
 *   say, so the first partial result is never a minute late.
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
  if (o.official && o.notStarted && o.today < o.roundDate) return Math.max(o.intervalMs, MINUTE);
  return o.intervalMs;
}
