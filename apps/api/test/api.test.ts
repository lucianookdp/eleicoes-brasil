import { apiEnvSchema } from '@eleicoes/config';
import {
  areaProgress,
  areaResults,
  cities as citiesTable,
  createDatabase,
  electionRounds,
  elections,
  offices,
  progressSnapshots,
  resultSnapshots,
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

  it('rebuilds the count as it was at a past moment, cached as immutable', async () => {
    const [round] = await sql<{ id: string }[]>`select id from election_rounds where slug = 'test-1'`;
    const [office] = await sql<{ id: string }[]>`
      select id from offices where round_id = ${round!.id} and slug = 'presidente'`;
    const snap = (areaKey: string, at: string, pct: number, candidates: [string, number, number][]) => ({
      progress: {
        roundId: round!.id,
        areaKey,
        areaType: areaKey === 'br' ? 'country' : 'state',
        stateCode: areaKey === 'br' ? null : areaKey.toUpperCase(),
        capturedAt: at,
        countedPct: pct,
        progress: { ...emptyProgress(), status: 'in-progress' as const, sectionsCountedPct: pct },
      },
      result: {
        roundId: round!.id,
        officeId: office!.id,
        areaKey,
        areaType: areaKey === 'br' ? 'country' : 'state',
        stateCode: areaKey === 'br' ? null : areaKey.toUpperCase(),
        capturedAt: at,
        countedPct: pct,
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
        provenance: {
          provider: 'TSE',
          adapter: 'tse-2026@2026-v1',
          sourceFile: '/x.json',
          sourceId: '1',
          retrievedAt: at,
          sourceGeneratedAt: null,
          etag: null,
          checksum: at,
        },
      },
    });
    const rows = [
      snap('br', '2026-10-04T21:00:00Z', 10, [
        ['91', 100, 60],
        ['92', 66, 40],
      ]),
      snap('sp', '2026-10-04T21:00:00Z', 12, [
        ['91', 50, 70],
        ['92', 20, 30],
      ]),
      snap('br', '2026-10-04T22:00:00Z', 30, [
        ['91', 200, 40],
        ['92', 300, 60],
      ]),
      snap('sp', '2026-10-04T22:00:00Z', 35, [
        ['91', 60, 40],
        ['92', 90, 60],
      ]),
    ];
    await db.insert(progressSnapshots).values(rows.map((r) => r.progress));
    await db.insert(resultSnapshots).values(rows.map((r) => r.result));

    const at = async (iso: string) => {
      const res = await built.app.inject(`/api/elections/test-1/timeline?at=${iso}`);
      expect(res.statusCode).toBe(200);
      return { body: res.json(), cache: res.headers['cache-control'] };
    };
    const early = await at('2026-10-04T21:30:00Z');
    expect(early.cache).toContain('s-maxage=3600');
    expect(early.body.progress.countedPct).toBe(10);
    expect(early.body.headline.candidates.map((c: { votes: number }) => c.votes)).toEqual([100, 66]);
    expect(early.body.states.find((s: { uf: string }) => s.uf === 'SP')).toMatchObject({
      countedPct: 12,
      leader: { number: '91' },
    });
    const late = await at('2026-10-04T22:30:00Z');
    expect(late.body.progress.countedPct).toBe(30);
    expect(late.body.states.find((s: { uf: string }) => s.uf === 'SP')).toMatchObject({
      countedPct: 35,
      leader: { number: '92' },
    });
    const before = await at('2026-10-04T20:00:00Z');
    expect(before.body.progress).toBeNull();
    expect(before.body.headline).toBeNull();
    expect(before.body.states.every((s: { leader: unknown }) => s.leader === null)).toBe(true);
    // A moment that is still "now" keeps the short cache: snapshots may still arrive for it.
    const recent = await built.app.inject(`/api/elections/test-1/timeline?at=${new Date().toISOString()}`);
    expect(recent.headers['cache-control']).not.toContain('s-maxage=3600');
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
    // Nothing to fall back to: the error itself must not be cacheable either.
    down = true;
    const failed = await app.app.inject(`/api/elections/test-1/states?v=${version}`);
    down = false;
    expect(failed.statusCode).toBe(500);
    expect(failed.headers['cache-control']).toBe('no-store');
    // The live stream still opens: an EventSource never retries after an error response.
    await app.app.listen({ host: '127.0.0.1', port: 0 });
    const { port } = app.app.server.address() as { port: number };
    const stream = async (round: string) => {
      const ctl = new AbortController();
      const res = await fetch(`http://127.0.0.1:${port}/api/realtime/elections/${round}`, {
        signal: ctl.signal,
      });
      const first = res.ok ? new TextDecoder().decode((await res.body!.getReader().read()).value) : '';
      ctl.abort();
      return { status: res.status, type: res.headers.get('content-type'), first };
    };
    down = true;
    const live = await stream('test-1');
    down = false;
    expect(live.status).toBe(200);
    expect(live.type).toContain('text/event-stream');
    expect(live.first).toContain('event: ready');
    expect((await stream('no-such-round')).status).toBe(404);
    // Once the database is back (and the short-lived stale entry has expired), the same URL is
    // fresh and safe to cache long again.
    await new Promise((r) => setTimeout(r, 20));
    const fresh = await app.app.inject(`/api/elections/test-1/overview?v=${version}`);
    expect(fresh.headers['x-data-stale']).toBeUndefined();
    expect(fresh.headers['cache-control']).toContain('s-maxage=3600');
    await app.app.close();
  });

  it('lists every occurrence of the round: grouped, with outages merged and our errors without details', async () => {
    const [round] = await sql<{ id: string }[]>`select id from election_rounds where slug = 'test-1'`;
    const id = round!.id;
    const [office] = await sql<
      { id: string }[]
    >`select id from offices where round_id = ${id} and slug = 'presidente'`;
    // The count ran from 20:30 to 23:00.
    await sql`insert into progress_snapshots (round_id, area_key, area_type, captured_at, counted_pct, progress)
      values (${id}, 'br', 'country', '2026-10-04T20:30:00Z', 5, '{}'),
             (${id}, 'br', 'country', '2026-10-04T23:00:00Z', 100, '{}')`;
    // A Brazil file generated at 21:40:00 and stored at 21:42:30: 150 s. One generated before the count
    // began (read when it started) is no delay and stays out.
    await sql`insert into result_snapshots (round_id, office_id, area_key, area_type, captured_at, votes, provenance)
      values (${id}, ${office!.id}, 'br', 'country', '2026-10-04T21:42:30Z', '{}',
        ${JSON.stringify({ retrievedAt: '2026-10-04T21:42:30Z', sourceGeneratedAt: '2026-10-04T21:40:00Z' })}::jsonb)`;
    await sql`insert into result_snapshots (round_id, office_id, area_key, area_type, captured_at, votes, provenance)
      values (${id}, ${office!.id}, 'sp', 'state', '2026-10-04T20:31:00Z', '{}',
        ${JSON.stringify({ retrievedAt: '2026-10-04T20:31:00Z', sourceGeneratedAt: '2026-10-02T20:00:00Z' })}::jsonb)`;
    const issue = {
      office: 'presidente',
      issues: [
        { code: 'counted-exceeds-total', severity: 'error', message: 'sections counted (12) > total (10)' },
      ],
    };
    await sql`insert into ingestion_events (round_id, occurred_at, type, area_key, state_code, message, context) values
      (${id}, '2026-10-04T21:00:00Z', 'quality.issue', 'sp', 'SP', 'x', ${JSON.stringify(issue)}::jsonb),
      (${id}, '2026-10-04T21:05:00Z', 'quality.issue', 'sp', 'SP', 'x', ${JSON.stringify(issue)}::jsonb),
      (${id}, '2026-10-04T21:10:00Z', 'quality.regression', 'rj', 'RJ', 'counted went back from 40% to 30%',
        ${JSON.stringify({ office: 'presidente', from: 40, to: 30 })}::jsonb),
      (${id}, '2026-10-04T21:20:00Z', 'collector.error', null, null,
        'Error: Failed query: select "checksum" from area_results', ${JSON.stringify({ what: 'cycle' })}::jsonb)`;
    // Two unstable cycles 5 s apart are one period; one failed an hour later is another.
    await sql`insert into collector_cycles (id, round_id, mode, started_at, finished_at, status, error) values
      (gen_random_uuid(), ${id}, 'PRODUCTION', '2026-10-04T21:30:00Z', '2026-10-04T21:30:02Z', 'degraded', null),
      (gen_random_uuid(), ${id}, 'PRODUCTION', '2026-10-04T21:30:07Z', '2026-10-04T21:30:09Z', 'degraded', 'blocked by source (HTTP 403)'),
      (gen_random_uuid(), ${id}, 'PRODUCTION', '2026-10-04T22:30:00Z', '2026-10-04T22:30:01Z', 'failed', 'Error: Failed query: insert into x')`;

    const res = await built.app.inject('/api/elections/test-1/occurrences');
    expect(res.statusCode).toBe(200);
    const o = res.json();
    expect(o.counting).toEqual({ start: '2026-10-04T20:30:00.000Z', end: '2026-10-04T23:00:00.000Z' });
    expect(o.outages).toEqual([
      expect.objectContaining({ status: 'degraded', cycles: 2, reason: 'blocked by source (HTTP 403)' }),
      expect.objectContaining({
        status: 'failed',
        cycles: 1,
        reason: 'Falha interna da coleta; nova tentativa automática.',
      }),
    ]);
    const counted = o.issues.find((i: { code: string }) => i.code === 'counted-exceeds-total');
    expect(counted).toMatchObject({
      severity: 'error',
      count: 2,
      areaName: 'São Paulo',
      office: 'Presidente',
    });
    expect(o.issues.find((i: { code: string }) => i.code === 'regression')).toMatchObject({
      severity: 'error',
      areaName: 'Rio de Janeiro',
    });
    const internal = o.issues.find((i: { type: string }) => i.type === 'collector.error');
    expect(internal).toMatchObject({
      severity: 'warning',
      detail: 'Falha interna da coleta; nova tentativa automática.',
    });
    expect(o).not.toHaveProperty('delay');
    expect(res.body).not.toContain('Failed query');
  });
});
