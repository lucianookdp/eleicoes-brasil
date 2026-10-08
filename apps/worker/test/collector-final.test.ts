import { createDatabase, electionRounds, runMigrations } from '@eleicoes/database';
import { findRound } from '@eleicoes/election-core';
import { createProvider, TseHttpClient } from '@eleicoes/tse-client';
import { eq } from 'drizzle-orm';
import pino from 'pino';
import { beforeAll, describe, expect, it } from 'vitest';
import { Collector } from '../src/collector';
import { startDemoServer } from '../src/demo/server';
import { Store } from '../src/store';

/**
 * The end of a count, end to end (fictitious TSE → real adapter → collector → Postgres): the TSE
 * marks the winner ("Eleito") a few seconds after the last ballot box, without touching the
 * progress files. That mark must arrive within seconds, not at the next 5-minute reconciliation.
 * Needs TEST_DATABASE_URL (CI provides one).
 */
const base = process.env.TEST_DATABASE_URL;
// Its own database: other packages' tests run at the same time in CI and truncate the shared one.
const url = base?.replace(/\/([^/?]+)(\?|$)/, '/$1_worker$2');
const suite = url ? describe : describe.skip;
const PORT = 4912;

suite('collector at the end of the count', () => {
  beforeAll(async () => {
    const admin = createDatabase(base!, { max: 1 });
    try {
      await admin.sql.unsafe(`create database "${new URL(url!).pathname.slice(1)}"`);
    } catch (err) {
      if ((err as { code?: string }).code !== '42P04') throw err; // already exists
    } finally {
      await admin.close();
    }
  });

  it('stores the "Eleito" mark that arrives after 100%', () => runToTheEnd(0, PORT), 90_000);

  // Chaos: the TSE answers 30% of requests with an error. The count must still reach 100% and
  // the winner, with the circuit breaker and retries doing their job.
  it('gets there even when 30% of the TSE requests fail', () => runToTheEnd(0.3, PORT + 1), 90_000);

  // Between rounds the worker may restart days after a count closed: it must see that from the
  // TSE's own times and poll slowly, not re-check everything for 30 minutes.
  it('a count that closed an hour before the worker started is settled at once', async () => {
    const { collector, stop } = await setup(PORT + 2, { durationMinutes: 0.1, offsetMinutes: 60 });
    try {
      await collector.runCycle();
      expect(collector.settled()).toBe(true);
    } finally {
      await stop();
    }
  }, 60_000);
});

async function setup(
  port: number,
  demoOptions: { durationMinutes: number; offsetMinutes?: number; errorRate?: number },
) {
  process.env.DEMO_ROUND = '2';
  const demo = startDemoServer({ port, waitSeconds: 0, ...demoOptions });
  await runMigrations(url!);
  const { db, sql, close } = createDatabase(url!, { max: 4 });
  const round = findRound('demo-2')!;
  await db.delete(electionRounds).where(eq(electionRounds.slug, round.slug));
  const roundId = await Store.ensureRound(db, round, 'DEVELOPMENT', 'demo');
  const log = pino({ level: 'silent' });
  const store = new Store(db, sql, roundId, round.slug, 'DEMO', log);
  const http = new TseHttpClient({
    requestsPerSecond: 200,
    concurrency: 8,
    timeoutMs: 5000,
    maxRetries: 0,
  });
  const provider = createProvider(http, round, {
    ...round.sources.DEVELOPMENT!,
    baseUrl: `http://localhost:${port}`,
  });
  const collector = new Collector(provider, store, log, {
    mode: 'DEVELOPMENT',
    collectCityResults: false,
    cityResultOffices: 'majoritarian',
    maxResultFetchesPerCycle: 60,
    // Far away: only the end-of-count rule can bring the mark in time.
    reconcileEvery: 10_000,
    cityConcurrency: 4,
  });

  const stop = async () => {
    collector.stop();
    await demo.close();
    await close();
    delete process.env.DEMO_ROUND;
  };
  return { collector, sql, round, stop };
}

async function runToTheEnd(errorRate: number, port: number) {
  {
    // A 6-second runoff count; the demo marks the winner 10 seconds after it ends.
    const { collector, sql, round, stop } = await setup(port, { durationMinutes: 0.1, errorRate });
    const winner = async () => {
      const [row] = await sql<{ status: string | null }[]>`
        select c->>'status' as status from area_results r
          join election_rounds e on e.id = r.round_id and e.slug = ${round.slug}
          cross join jsonb_array_elements(r.result->'candidates') c
        where r.area_key = 'br' and c->>'status' ~* '^eleit' limit 1`;
      return row?.status ?? null;
    };
    try {
      const deadline = Date.now() + 60_000;
      let status: string | null = null;
      while (!status && Date.now() < deadline) {
        await collector.runCycle();
        status = await winner();
        if (!status) await new Promise((r) => setTimeout(r, 1000));
      }
      expect(status).toBe('Eleito');
      const [br] = await sql<{ pct: number }[]>`
        select p.counted_pct as pct from area_progress p
          join election_rounds e on e.id = p.round_id and e.slug = ${round.slug}
        where p.area_key = 'br'`;
      expect(br?.pct).toBe(100);
      // Just finished: the 30 minutes of every-cycle checks are still on.
      expect(collector.settled()).toBe(false);
    } finally {
      await stop();
    }
  }
}
