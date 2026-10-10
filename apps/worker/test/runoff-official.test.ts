import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { createDatabase, electionRounds, runMigrations } from '@eleicoes/database';
import { findRound } from '@eleicoes/election-core';
import { createProvider, TseHttpClient } from '@eleicoes/tse-client';
import { eq } from 'drizzle-orm';
import pino from 'pino';
import { beforeAll, describe, expect, it } from 'vitest';
import { Collector } from '../src/collector';
import { Store } from '../src/store';

/**
 * The 2026 runoff as the TSE published it on 10 Oct 2026, fifteen days before the vote: the pleito
 * also lists supplementary mayoral elections and consultations, and the progress files of most
 * states do not exist yet (HTTP 404). The collector must follow the runoff alone and must not ask
 * again and again for what is missing: more than 30 answers 404 in a minute open the circuit and
 * stop the whole collection for 5 minutes. Needs TEST_DATABASE_URL (CI provides one).
 */
const base = process.env.TEST_DATABASE_URL;
const url = base?.replace(/\/([^/?]+)(\?|$)/, '/$1_runoff$2');
const suite = url ? describe : describe.skip;
const PORT = 4921;

const fixtures = join(import.meta.dirname, '../../../packages/tse-client/test/fixtures');
const official = (name: string) => readFileSync(join(fixtures, 'oficial-2026-2', name), 'utf8');

/** States whose progress file (EA15) the TSE had not generated yet on 10 Oct 2026. */
const NOT_GENERATED = ['ma', 'pi', 'rj', 'rr', 'rs', 'se', 'to'];

/** The TSE of 10 Oct 2026: real files where saved, the same shape for the other states, else 404. */
function tseFile(path: string): string | null {
  if (path === '/oficial/comum/config/ele-c.json') return official('ele-c.json');
  if (path === '/oficial/ele2026/6258/config/mun-e006258-cm.json')
    return readFileSync(join(fixtures, 'mun-cm.json'), 'utf8');
  const [election, , uf, name] = path.replace('/oficial/ele2026/', '').split('/');
  if (!election || !uf || !name || !['6258', '6260'].includes(election)) return null;
  if (name === `br-e00${election}-ab.json`) return official(name);
  if (name === `${uf}-e00${election}-ab.json`) {
    if (NOT_GENERATED.includes(uf)) return null;
    return JSON.stringify({ ele: election, abr: [{ tpabr: 'uf', cdabr: uf, and: 'n' }] });
  }
  // Results: the president everywhere, the governor in the five states with a runoff.
  const governor = ['am', 'rn', 'df', 'es', 'ac'].includes(uf) && name === `${uf}-c0003-e006260-u.json`;
  if (name === `${uf}-c0001-e006258-u.json` || governor) {
    const real = JSON.parse(official(governor ? 'am-c0003-e006260-u.json' : 'br-c0001-e006258-u.json'));
    return JSON.stringify({ ...real, tpabr: uf === 'br' ? 'br' : 'uf', cdabr: uf });
  }
  return null;
}

suite('the runoff as the TSE published it before the vote', () => {
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

  it('follows the runoff alone and does not insist on files not generated yet', async () => {
    const requests = new Map<string, number>();
    const missing = new Map<string, number>();
    const tse = createServer((req, res) => {
      const path = req.url ?? '';
      requests.set(path, (requests.get(path) ?? 0) + 1);
      const body = tseFile(path);
      // Photos apart: this fake TSE has none, and each one is tried only once anyway.
      if (!body && !path.includes('/fotos/')) missing.set(path, (missing.get(path) ?? 0) + 1);
      res.writeHead(body ? 200 : 404, { 'content-type': 'application/json' });
      res.end(body ?? '{"Code":"NoSuchKey"}');
    });
    await new Promise<void>((resolve) => tse.listen(PORT, resolve));

    await runMigrations(url!);
    const { db, sql, close } = createDatabase(url!, { max: 4 });
    const round = findRound('2026-2')!;
    await db.delete(electionRounds).where(eq(electionRounds.slug, round.slug));
    const roundId = await Store.ensureRound(db, round, 'PRODUCTION', 'oficial');
    const log = pino({ level: 'silent' });
    const store = new Store(db, sql, roundId, round.slug, 'PRODUCTION', log);
    const http = new TseHttpClient({
      requestsPerSecond: 500,
      concurrency: 8,
      timeoutMs: 5000,
      maxRetries: 0,
    });
    const provider = createProvider(http, round, {
      ...round.sources.PRODUCTION!,
      baseUrl: `http://localhost:${PORT}`,
    });
    const collector = new Collector(provider, store, log, {
      mode: 'PRODUCTION',
      collectCityResults: true,
      cityResultOffices: 'all',
      maxResultFetchesPerCycle: 400,
      reconcileEvery: 60,
      cityConcurrency: 8,
    });

    try {
      const drain = collector.drainCities();
      const statuses: string[] = [];
      // Three cycles with the background queue running in between, as in production.
      for (let i = 0; i < 3; i++) {
        statuses.push(await collector.runCycle());
        await new Promise((r) => setTimeout(r, 700));
      }
      collector.stop();
      await drain;

      expect(statuses).toEqual(['ok', 'ok', 'ok']);
      expect(http.circuitState).toBe('closed');

      const offices = await sql<{ slug: string; states: string[] | null }[]>`
        select o.slug, o.states from offices o where o.round_id = ${roundId} order by o.slug`;
      expect(offices.map((o) => o.slug)).toEqual(['governador', 'presidente']);
      expect(offices[0]!.states).toEqual(['AM', 'RN', 'DF', 'ES', 'AC']);

      // Nothing of the supplementary elections or the consultations was asked for.
      const others = [...requests.keys()].filter((p) => /\/(6282|6283|6284|6287|6288|6289|6293)\//.test(p));
      expect(others).toEqual([]);
      // A file not generated yet is asked for once, not in a loop.
      expect([...missing.keys()].sort()).toEqual(
        NOT_GENERATED.map((uf) => `/oficial/ele2026/6258/dados/${uf}/${uf}-e006258-ab.json`),
      );
      expect(Math.max(...missing.values())).toBe(1);

      // What exists was stored: the country at 0%, the two runoff candidates with zero votes.
      const [br] = await sql<{ status: string; candidates: number }[]>`
        select p.status, jsonb_array_length(r.result->'candidates') as candidates
          from area_progress p join area_results r on r.round_id = p.round_id and r.area_key = p.area_key
         where p.round_id = ${roundId} and p.area_key = 'br'`;
      expect(br).toEqual({ status: 'not-started', candidates: 2 });
      // And none of it was recorded as a problem of the source.
      const [issues] = await sql<{ n: number }[]>`
        select count(*)::int as n from ingestion_events where round_id = ${roundId} and type like 'source.%'`;
      expect(issues!.n).toBe(0);
    } finally {
      collector.stop();
      await close();
      await new Promise((resolve) => tse.close(resolve));
    }
  }, 60_000);
});
