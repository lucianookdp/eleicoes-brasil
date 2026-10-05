import { apiEnvSchema } from '@eleicoes/config';
import {
  areaProgress,
  areaResults,
  createDatabase,
  electionRounds,
  elections,
  offices,
  runMigrations,
} from '@eleicoes/database';
import { emptyProgress } from '@eleicoes/election-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';

/**
 * Integration tests against a real Postgres. Set TEST_DATABASE_URL to run them
 * (CI provides one; locally see docs/deployment.md). Skipped otherwise.
 */
const url = process.env.TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;

suite('API (integration)', () => {
  const { db, sql, close } = createDatabase(url ?? 'postgres://unused', { max: 2 });
  let built: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    await runMigrations(url!);
    await sql`truncate elections, cities cascade`;
    const [e] = await db
      .insert(elections)
      .values({ slug: 'test', name: 'Eleição de teste', year: 2026, kind: 'general', demo: true })
      .returning();
    const [r] = await db
      .insert(electionRounds)
      .values({
        electionId: e!.id,
        slug: 'test-1',
        round: 1,
        date: '2026-10-04',
        status: 'live',
        adapter: 'tse-2026',
        adapterVersion: '2026-v1',
      })
      .returning();
    const [president] = await db
      .insert(offices)
      .values({
        roundId: r!.id,
        providerId: '1',
        providerElectionCode: '1',
        slug: 'presidente',
        name: 'Presidente',
        kind: 'majoritarian',
        scope: 'country',
      })
      .returning();
    const now = new Date().toISOString();
    const progress = {
      ...emptyProgress(),
      status: 'in-progress' as const,
      sectionsTotal: 100,
      sectionsCounted: 40,
      sectionsCountedPct: 40,
    };
    await db.insert(areaProgress).values({
      roundId: r!.id,
      areaKey: 'br',
      areaType: 'country',
      status: 'in-progress',
      countedPct: 40,
      progress,
      updatedAt: now,
    });
    const candidate = (key: string, name: string, party: string, votes: number, percent: number) => ({
      key,
      number: key,
      name,
      ballotName: name,
      party: { number: key, abbreviation: party, name: party },
      coalition: null,
      runningMates: [],
      votes,
      percent,
      elected: null,
      status: null,
      voteDestination: 'Válido',
    });
    await db.insert(areaResults).values({
      roundId: r!.id,
      officeId: president!.id,
      areaKey: 'br',
      areaType: 'country',
      countedPct: 40,
      result: {
        progress,
        votes: {
          total: 1000,
          valid: 900,
          nominal: 900,
          legend: null,
          blank: 50,
          null: 50,
          annulled: 0,
          annulledSubJudice: 0,
        },
        candidates: [
          candidate('91', 'ANA EXEMPLO', 'PEX', 400, 44.4),
          candidate('92', 'BRUNO MODELO', 'PMD', 500, 55.6),
        ],
        parties: [],
        seats: 1,
        final: false,
        mathematicallyDecided: null,
        votesPublishable: true,
        noElectedReasons: [],
      },
      previousCandidates: [
        ['91', 300, 50],
        ['92', 300, 50],
      ],
      provenance: {
        provider: 'TSE',
        adapter: 'tse-2026@2026-v1',
        sourceFile: '/x.json',
        sourceId: '1',
        retrievedAt: now,
        sourceGeneratedAt: null,
        etag: null,
        checksum: 'abc',
      },
      checksum: 'abc',
      updatedAt: now,
    });
    const env = apiEnvSchema.parse({ DATABASE_URL: url });
    built = await buildApp({ sql, env, logger: false });
  });

  afterAll(async () => {
    await built?.app.close();
    await close();
  });

  it('GET /api/health', async () => {
    const res = await built.app.inject('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok' });
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('overview ranks candidates and computes changes since the previous snapshot', async () => {
    const res = await built.app.inject('/api/elections/test-1/overview');
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.progress.countedPct).toBe(40);
    expect(body.headline.candidates.map((c: { name: string }) => c.name)).toEqual([
      'BRUNO MODELO',
      'ANA EXEMPLO',
    ]);
    expect(body.headline.candidates[0]).toMatchObject({ deltaVotes: 200, color: '#2F6BFF' });
    expect(body.headline.candidates[0].deltaPp).toBeCloseTo(5.6);
    expect(body.states).toHaveLength(27);
    // No progress row for a state: null, never zeros.
    expect(body.states[0].progress).toBeNull();
    expect(body.ingestion.state).toBe('idle');
  });

  it('validates parameters (400) and unknown rounds (404)', async () => {
    expect((await built.app.inject('/api/elections/test-1/states/xx')).statusCode).toBe(400);
    expect((await built.app.inject('/api/elections/test-1/states/sp/cities/123')).statusCode).toBe(400);
    expect((await built.app.inject('/api/elections/test-1/search?q=%27;drop')).statusCode).toBe(200);
    expect((await built.app.inject('/api/elections/missing/overview')).statusCode).toBe(404);
    // Office across states: only state-level majoritarian offices (governor, senator).
    expect((await built.app.inject('/api/elections/test-1/offices/presidente/states')).statusCode).toBe(404);
    expect((await built.app.inject('/api/nothing')).statusCode).toBe(404);
  });

  it('invalidates the cache when the worker announces a change', async () => {
    const first = (await built.app.inject('/api/elections/test-1/overview')).json();
    await sql`update area_progress set counted_pct = 55 where area_key = 'br'`;
    const cached = (await built.app.inject('/api/elections/test-1/overview')).json();
    expect(cached.progress.countedPct).toBe(first.progress.countedPct);
    built.onEvent(
      JSON.stringify({ type: 'country.updated', electionId: 'test-1', timestamp: new Date().toISOString() }),
    );
    const fresh = (await built.app.inject('/api/elections/test-1/overview')).json();
    expect(fresh.progress.countedPct).toBe(55);
  });

  it('serves pre-compressed bodies with an ETag and answers 304 to revalidation', async () => {
    const first = await built.app.inject({
      url: '/api/elections/test-1/overview',
      headers: { 'accept-encoding': 'br' },
    });
    expect(first.headers['content-encoding']).toBe('br');
    const etag = first.headers.etag as string;
    expect(etag).toBeTruthy();
    const again = await built.app.inject({
      url: '/api/elections/test-1/overview',
      headers: { 'if-none-match': etag },
    });
    expect(again.statusCode).toBe(304);
  });

  it('caches versioned URLs long only once the instance has that version', async () => {
    const future = Date.now() + 60_000;
    const early = await built.app.inject(`/api/elections/test-1/overview?v=${future}`);
    expect(early.headers['cache-control']).toContain('max-age=3');
    built.onEvent(
      JSON.stringify({
        type: 'country.updated',
        electionId: 'test-1',
        timestamp: new Date(future).toISOString(),
      }),
    );
    const late = await built.app.inject(`/api/elections/test-1/overview?v=${future}`);
    expect(late.headers['cache-control']).toContain('s-maxage=3600');
  });
});
