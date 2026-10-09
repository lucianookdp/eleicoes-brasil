import { apiEnvSchema } from '@eleicoes/config';
import {
  areaProgress,
  areaResults,
  cities as citiesTable,
  createDatabase,
  electionRounds,
  elections,
  offices,
  runMigrations,
} from '@eleicoes/database';
import { type BenchesDTO, emptyProgress } from '@eleicoes/election-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';

/**
 * Integration tests against a real Postgres. Set TEST_DATABASE_URL to run them
 * (CI provides one; locally see docs/deployment.md). Skipped otherwise.
 */
const url = process.env.TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;
const TOKEN = 'test-stats-token-0123456789';

suite('API (integration)', () => {
  const { db, sql, close } = createDatabase(url ?? 'postgres://unused', { max: 2 });
  let built: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    await runMigrations(url!);
    await sql`truncate elections, cities, site_visits, live_clients cascade`;
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
    const env = apiEnvSchema.parse({ DATABASE_URL: url, STATS_TOKEN: TOKEN });
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
    // Live viewer counts are private (see /api/stats/visits).
    expect(res.json()).not.toHaveProperty('realtimeClients');
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

  it('runoff: lists only the cities whose most voted changed since the 1st round', async () => {
    const [e] = await sql<{ id: string }[]>`select id from elections where slug = 'test'`;
    const [r1] = await sql<{ id: string }[]>`select id from election_rounds where slug = 'test-1'`;
    const [r2] = await db
      .insert(electionRounds)
      .values({ electionId: e!.id, slug: 'test-2', round: 2, date: '2026-10-25', status: 'live' })
      .returning();
    const [p1] = await sql<{ id: string }[]>`select id from offices where round_id = ${r1!.id}`;
    const [p2] = await db
      .insert(offices)
      .values({
        roundId: r2!.id,
        providerId: '1',
        providerElectionCode: '1',
        slug: 'presidente',
        name: 'Presidente',
        kind: 'majoritarian',
        scope: 'country',
      })
      .returning();
    await db.insert(citiesTable).values([
      { stateCode: 'SP', providerId: '00001', name: 'VIROU', searchName: 'virou' },
      { stateCode: 'SP', providerId: '00002', name: 'IGUAL', searchName: 'igual' },
    ]);
    // Ballot numbers and votes, most voted first or not: the API orders them itself.
    const result = (votes: [string, string, number][]) => ({
      progress: emptyProgress(),
      votes: {
        total: 0,
        valid: 0,
        nominal: 0,
        legend: null,
        blank: 0,
        null: 0,
        annulled: 0,
        annulledSubJudice: 0,
      },
      candidates: votes.map(([number, ballotName, v]) => ({
        key: number,
        number,
        name: ballotName,
        ballotName,
        party: { number, abbreviation: 'P', name: 'P' },
        coalition: null,
        runningMates: [],
        votes: v,
        percent: null,
        elected: null,
        status: null,
        voteDestination: 'Válido',
      })),
      parties: [],
      seats: 1,
      final: false,
      mathematicallyDecided: null,
      votesPublishable: true,
      noElectedReasons: [],
    });
    const row = (roundId: string, officeId: string, city: string, votes: [string, string, number][]) => ({
      roundId,
      officeId,
      areaKey: `sp-${city}`,
      areaType: 'city' as const,
      countedPct: 100,
      result: result(votes),
      provenance: {
        provider: 'TSE',
        adapter: 'tse-2026@2026-v1',
        sourceFile: '/x.json',
        sourceId: '1',
        retrievedAt: new Date().toISOString(),
        sourceGeneratedAt: null,
        etag: null,
        checksum: 'x',
      },
      checksum: 'x',
      updatedAt: new Date().toISOString(),
    });
    await db.insert(areaResults).values([
      // 1st round: a third candidate led in VIROU; ANA led in IGUAL.
      row(r1!.id, p1!.id, '00001', [
        ['91', 'ANA EXEMPLO', 10],
        ['93', 'CARLA TESTE', 30],
      ]),
      row(r1!.id, p1!.id, '00002', [
        ['91', 'ANA EXEMPLO', 50],
        ['92', 'BRUNO MODELO', 20],
      ]),
      row(r2!.id, p2!.id, '00001', [
        ['91', 'ANA EXEMPLO', 60],
        ['92', 'BRUNO MODELO', 40],
      ]),
      row(r2!.id, p2!.id, '00002', [
        ['91', 'ANA EXEMPLO', 70],
        ['92', 'BRUNO MODELO', 30],
      ]),
    ]);
    const res = await built.app.inject('/api/elections/test-2/states/sp/cities?changed=1');
    expect(res.statusCode).toBe(200);
    expect(res.json().items).toMatchObject([
      { name: 'Virou', leader: { number: '91' }, before: { number: '93', ballotName: 'CARLA TESTE' } },
    ]);
    // Without the filter, both cities and no "before".
    const all = (await built.app.inject('/api/elections/test-2/states/sp/cities')).json();
    expect(all.items).toHaveLength(2);
    expect(all.items[0].before).toBeUndefined();
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

  it('counts each visitor once a day and shows the totals only with the token', async () => {
    const visit = (payload: string) =>
      built.app.inject({
        method: 'POST',
        url: '/api/visit',
        payload,
        headers: { 'content-type': 'text/plain' },
      });
    expect((await visit('visitor-aaaa-1111')).statusCode).toBe(204);
    expect((await visit('visitor-aaaa-1111')).statusCode).toBe(204);
    expect((await visit('visitor-bbbb-2222')).statusCode).toBe(204);
    expect((await visit('<script>')).statusCode).toBe(400);

    // Two instances' heartbeats, and an old one that no longer counts.
    await sql`insert into live_clients (instance, clients, updated_at) values
      ('a', 3, now()), ('b', 4, now()), ('gone', 50, now() - interval '10 minutes')`;
    expect((await built.app.inject({ url: '/api/stats/visits' })).statusCode).toBe(404);
    const wrong = await built.app.inject({
      url: '/api/stats/visits',
      headers: { authorization: 'Bearer nope' },
    });
    expect(wrong.statusCode).toBe(404);
    const res = await built.app.inject({
      url: '/api/stats/visits',
      headers: { authorization: `Bearer ${TOKEN}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      watchingNow: number;
      totalVisitors: number;
      days: { day: string; visitors: number }[];
    };
    expect(body.watchingNow).toBe(7);
    expect(body.totalVisitors).toBe(2);
    expect(body.days[0]?.visitors).toBe(2);
  });

  it('counts every elected deputy and senator per party, even far down the list', async () => {
    const [round] = await sql<{ id: string }[]>`select id from election_rounds where slug = 'test-1'`;
    const now = new Date().toISOString();
    const office = async (
      providerId: string,
      slug: string,
      name: string,
      kind: 'majoritarian' | 'proportional',
    ) =>
      (
        await db
          .insert(offices)
          .values({
            roundId: round!.id,
            providerId,
            providerElectionCode: '1',
            slug,
            name,
            kind,
            scope: 'state',
          })
          .returning()
      )[0]!;
    const deputies = await office('6', 'deputado-federal', 'Deputado Federal', 'proportional');
    const senators = await office('5', 'senador', 'Senador', 'majoritarian');
    const person = (key: string, party: string, elected: boolean, federation: string | null = null) => ({
      key,
      number: key,
      name: `CANDIDATO ${key}`,
      ballotName: `CANDIDATO ${key}`,
      party: { number: key.slice(0, 2), abbreviation: party, name: `PARTIDO ${party}` },
      coalition: federation,
      runningMates: [],
      votes: 1000 - Number(key.slice(2)),
      percent: 1,
      elected,
      status: elected ? 'Eleito por QP' : 'Suplente',
      voteDestination: 'Válido',
    });
    const insert = (officeId: string, uf: string, candidates: ReturnType<typeof person>[], final: boolean) =>
      db.insert(areaResults).values({
        roundId: round!.id,
        officeId,
        areaKey: uf,
        areaType: 'state',
        countedPct: 100,
        result: {
          progress: { ...emptyProgress(), status: 'finished' as const },
          votes: {
            total: 0,
            valid: 0,
            nominal: 0,
            legend: null,
            blank: 0,
            null: 0,
            annulled: 0,
            annulledSubJudice: 0,
          },
          candidates,
          parties: [],
          seats: 2,
          final,
          mathematicallyDecided: null,
          votesPublishable: true,
          noElectedReasons: [],
        },
        previousCandidates: [],
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
    // 70 candidates in SP: the last one is elected, past the 60 the result screens list by default.
    const sp = Array.from({ length: 70 }, (_, i) =>
      person(
        `11${String(i).padStart(3, '0')}`,
        i === 0 || i === 69 ? 'PAA' : 'PBB',
        i === 0 || i === 69,
        i === 0 || i === 69 ? 'PAA / PCC' : null,
      ),
    );
    await insert(deputies.id, 'sp', sp, true);
    await insert(deputies.id, 'rj', [person('22001', 'PBB', true), person('22002', 'PAA', false)], false);
    await insert(senators.id, 'sp', [person('33001', 'PAA', true, 'PAA / PBB')], true);

    // As the worker does after storing: announce the change.
    built.onEvent(JSON.stringify({ electionId: 'test-1', timestamp: new Date().toISOString() }));
    const res = await built.app.inject('/api/elections/test-1/benches');
    expect(res.statusCode).toBe(200);
    const { chambers } = res.json() as BenchesDTO;
    const camara = chambers.find((c) => c.office.slug === 'deputado-federal')!;
    expect(camara.seats).toBe(3);
    expect(camara.statesFinal).toBe(1);
    expect(camara.parties.map((p) => [p.abbreviation, p.seats, p.federation])).toEqual([
      ['PAA', 2, 'PAA / PCC'],
      ['PBB', 1, null],
    ]);
    // A senator's list is a coalition, not a federation.
    const senado = chambers.find((c) => c.office.slug === 'senador')!;
    expect(senado.parties).toEqual([
      expect.objectContaining({ abbreviation: 'PAA', seats: 1, federation: null }),
    ]);
  });

  it('with CORS_ORIGINS="*", every origin gets the same cacheable answer', async () => {
    const open = await buildApp({
      sql,
      env: apiEnvSchema.parse({ DATABASE_URL: url, CORS_ORIGINS: '*' }),
      logger: false,
    });
    for (const origin of ['https://eleicoes.lucianookdp.dev', 'https://lucianookdp.github.io']) {
      const res = await open.app.inject({ url: '/api/elections/test-1/overview', headers: { origin } });
      expect(res.headers['access-control-allow-origin']).toBe('*');
    }
    await open.app.close();
  });

  it('never lets a CDN keep the last good body long when the database fails', async () => {
    let down = false;
    const flaky = new Proxy(sql, {
      apply: (target, self, args) => {
        if (down) throw new Error('database down');
        return Reflect.apply(target, self, args);
      },
    });
    const app = await buildApp({
      sql: flaky,
      env: apiEnvSchema.parse({ DATABASE_URL: url, CACHE_TTL_SECONDS: '0.001' }),
      logger: false,
    });
    const good = await app.app.inject('/api/elections/test-1/overview');
    expect(good.statusCode).toBe(200);
    const version = Date.now() + 120_000;
    app.onEvent(
      JSON.stringify({
        type: 'country.updated',
        electionId: 'test-1',
        timestamp: new Date(version).toISOString(),
      }),
    );
    down = true;
    const stale = await app.app.inject(`/api/elections/test-1/overview?v=${version}`);
    down = false;
    expect(stale.statusCode).toBe(200);
    expect(stale.headers.etag).toBe(good.headers.etag);
    expect(stale.headers['x-data-stale']).toBe('1');
    expect(stale.headers['cache-control']).not.toContain('s-maxage=3600');
    // Once the database is back (and the short-lived stale entry has expired), the same URL is
    // fresh and safe to cache long again.
    await new Promise((r) => setTimeout(r, 20));
    const fresh = await app.app.inject(`/api/elections/test-1/overview?v=${version}`);
    expect(fresh.headers['x-data-stale']).toBeUndefined();
    expect(fresh.headers['cache-control']).toContain('s-maxage=3600');
    await app.app.close();
  });
});
