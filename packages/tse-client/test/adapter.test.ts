import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { area, ProviderNotFoundError, ProviderPayloadError } from '@eleicoes/election-core';
import { describe, expect, it } from 'vitest';
import { TSEAdapter2026, tseTime } from '../src/adapter-2026';
import { TseHttpClient } from '../src/http';
import { toDec, toInt } from '../src/schemas';

const BASE = 'https://resultados-sim.tse.jus.br/simulado';
const fixture = (name: string) => readFileSync(join(import.meta.dirname, 'fixtures', name), 'utf8');

/** Routes URL suffixes to fixture bodies; everything else is a 404. */
function fakeTse(routes: Record<string, string | (() => Response)>) {
  const calls: string[] = [];
  const fetchImpl = (async (input: string | URL) => {
    const url = String(input);
    calls.push(url);
    for (const [suffix, body] of Object.entries(routes)) {
      if (url.endsWith(suffix)) {
        return typeof body === 'function'
          ? body()
          : new Response(body, { status: 200, headers: { etag: `"${suffix}"` } });
      }
    }
    return new Response('not found', { status: 404 });
  }) as typeof fetch;
  return { fetchImpl, calls };
}

function makeAdapter(routes: Record<string, string | (() => Response)>) {
  const tse = fakeTse({
    '/simulado2026/comum/config/ele-c.json': fixture('ele-c.json'),
    '/simulado2026/ele2026/21270/config/mun-e021270-cm.json': fixture('mun-cm.json'),
    ...routes,
  });
  const http = new TseHttpClient({
    requestsPerSecond: 1000,
    concurrency: 4,
    timeoutMs: 1000,
    maxRetries: 0,
    fetchImpl: tse.fetchImpl,
  });
  const adapter = new TSEAdapter2026(
    http,
    { baseUrl: BASE, environment: 'simulado2026', providerRoundId: '17801' },
    { round: 1, date: '2026-10-04' },
  );
  return { adapter, calls: tse.calls };
}

describe('number parsing', () => {
  it('accepts text integers, comma and dot decimals, and rejects garbage', () => {
    expect(toInt('391842')).toBe(391842);
    expect(toInt(12)).toBe(12);
    expect(toInt('')).toBeNull();
    expect(toInt('12a')).toBeNull();
    expect(toDec('48,32')).toBe(48.32);
    expect(toDec('48.321234567')).toBe(48.321234567);
    expect(toDec('1.234,5')).toBe(1234.5);
    expect(toDec('100')).toBe(100);
    expect(toDec('NaN')).toBeNull();
  });
});

describe('TSEAdapter2026.getElectionConfig', () => {
  it('maps offices, scopes and cities from EA11/EA12', async () => {
    const { adapter } = makeAdapter({});
    const config = await adapter.getElectionConfig();
    expect(config.providerRoundId).toBe('17801');
    expect(config.date).toBe('2026-10-04');
    expect(config.progressElectionCode).toBe('21270');
    expect(config.providerElectionCodes).toEqual(['21270', '21272', '21274']);

    const bySlug = Object.fromEntries(config.offices.map((o) => [o.slug, o]));
    expect(bySlug.presidente).toMatchObject({
      code: '1',
      scope: 'country',
      kind: 'majoritarian',
      providerElectionCode: '21270',
      states: null,
    });
    expect(bySlug['deputado-federal']).toMatchObject({
      kind: 'proportional',
      scope: 'state',
      providerElectionCode: '21272',
    });
    expect(bySlug['deputado-distrital']?.states).toEqual(['DF']);
    expect(bySlug['deputado-estadual']?.states).not.toContain('DF');
    // Unknown office code: mapped generically from the file.
    expect(bySlug['conselheiro-distrital']).toMatchObject({
      code: '15',
      kind: 'proportional',
      states: ['PE'],
    });

    // Abroad ("zz") localities are kept: presidential votes cast abroad belong to them.
    expect(config.cities).toHaveLength(4);
    expect(config.cities.find((c) => c.state === 'ZZ')?.name).toBe('LISBOA');
    const sp = config.cities.find((c) => c.code === '71072');
    expect(sp).toMatchObject({
      state: 'SP',
      name: 'SÃO PAULO',
      isCapital: true,
      ibgeCode: '3550308',
      zones: ['0001', '0002'],
    });
    expect(config.cities.find((c) => c.state === 'AC')?.code).toBe('01120'); // padded to 5 digits
  });
});

describe('TSEAdapter2026 progress', () => {
  it('reads EA14 into country + state progress with UTC timestamps', async () => {
    const { adapter } = makeAdapter({ '/dados/br/br-e021270-ab.json': fixture('br-ab.json') });
    const res = await adapter.getCountryProgress('21270');
    expect(res.changed).toBe(true);
    if (!res.changed) return;
    expect(res.data.progress).toMatchObject({
      status: 'in-progress',
      sectionsTotal: 475921,
      sectionsCounted: 391842,
      sectionsCountedPct: 82.33345,
      turnout: 103000000,
      totalizedAt: '2026-10-04T23:43:10.000Z',
    });
    expect(res.data.states.map((s) => s.area.key)).toEqual(['sp', 'rr']);
    expect(res.data.states[1]!.progress).toMatchObject({ status: 'not-started', totalizedAt: null });
    expect(res.provenance).toMatchObject({ provider: 'TSE', adapter: 'tse-2026@2026-v1', sourceId: '5001' });
    expect(res.provenance.sourceFile).toBe('/simulado2026/ele2026/21270/dados/br/br-e021270-ab.json');
  });

  it('reads EA15 accepting both "mu" and "mun" municipality entries', async () => {
    const { adapter } = makeAdapter({ '/dados/sp/sp-e021270-ab.json': fixture('sp-ab.json') });
    const res = await adapter.getStateProgress('21270', 'SP');
    if (!res.changed) throw new Error('expected data');
    expect(res.data.cities.map((c) => c.area.key)).toEqual(['sp-71072', 'sp-62910']);
    expect(res.data.cities[1]!.progress.status).toBe('finished');
  });
});

describe('TSEAdapter2026.getResult', () => {
  it('flattens coalitions/parties/candidates from EA20', async () => {
    const { adapter } = makeAdapter({ '/dados/br/br-c0001-e021270-u.json': fixture('br-c0001-u.json') });
    const config = await adapter.getElectionConfig();
    const office = config.offices.find((o) => o.slug === 'presidente')!;
    const res = await adapter.getResult({ office, area: area.country() });
    if (!res.changed) throw new Error('expected data');
    const r = res.data;
    expect(r.candidates).toHaveLength(2);
    expect(r.candidates[0]).toMatchObject({
      key: '280001',
      number: '91',
      ballotName: 'ANA EXEMPLO',
      party: { abbreviation: 'PEX' },
      coalition: 'PEX/PMD',
      votes: 52381292,
      percent: 48.321234567,
      elected: null,
      runningMates: [{ role: 'vice', ballotName: 'VICE', party: 'PMD' }],
    });
    // "PMD**" (party flagged inapto) is cleaned; isolated party has no coalition.
    expect(r.candidates[1]).toMatchObject({
      party: { abbreviation: 'PMD' },
      coalition: null,
      percent: 45.84,
    });
    expect(r.votes).toMatchObject({ total: 103000000, valid: 102081292, blank: 400000, null: 518708 });
    expect(r.parties.find((p) => p.abbreviation === 'PEX')?.federation).toBe('FEX');
    expect(r.final).toBe(false);
    expect(r.votesPublishable).toBe(true);
  });

  it('builds municipal and zone file names with padded codes', async () => {
    const { adapter, calls } = makeAdapter({});
    const config = await adapter.getElectionConfig();
    const office = config.offices.find((o) => o.slug === 'senador')!;
    await expect(adapter.getResult({ office, area: area.city('AC', '1120') })).rejects.toThrow('Not found');
    await expect(adapter.getResult({ office, area: area.zone('SP', '71072', '1') })).rejects.toThrow(
      'Not found',
    );
    expect(calls.slice(-2)).toEqual([
      `${BASE}/simulado2026/ele2026/21272/dados/ac/ac01120-c0005-e021272-u.json`,
      `${BASE}/simulado2026/ele2026/21272/dados/sp/sp71072-z0001-c0005-e021272-u.json`,
    ]);
  });

  it('rejects payloads that do not match the schema, with context', async () => {
    const { adapter } = makeAdapter({ '/dados/br/br-c0001-e021270-u.json': '{"ele": 1, "abr": "nope"}' });
    const config = await adapter.getElectionConfig();
    const office = config.offices.find((o) => o.slug === 'presidente')!;
    const err = await adapter.getResult({ office, area: area.country() }).catch((e) => e);
    expect(err).toBeInstanceOf(ProviderPayloadError);
    expect(err.sourceFile).toContain('br-c0001-e021270-u.json');
  });

  it('returns { changed: false } on HTTP 304', async () => {
    let n = 0;
    const { adapter } = makeAdapter({
      '/dados/br/br-e021270-ab.json': () =>
        n++ === 0
          ? new Response(fixture('br-ab.json'), { headers: { etag: '"v1"' } })
          : new Response(null, { status: 304 }),
    });
    expect((await adapter.getCountryProgress('21270')).changed).toBe(true);
    expect((await adapter.getCountryProgress('21270')).changed).toBe(false);
  });
});

describe('picking the runoff in the official configuration', () => {
  const official = (round: 1 | 2, date: string) => {
    const tse = fakeTse({
      '/oficial/comum/config/ele-c.json': fixture('ele-c-oficial-2026.json'),
      '/oficial/ele2026/6257/config/mun-e006257-cm.json': fixture('mun-cm.json'),
    });
    const http = new TseHttpClient({
      requestsPerSecond: 1000,
      concurrency: 4,
      timeoutMs: 1000,
      maxRetries: 0,
      fetchImpl: tse.fetchImpl,
    });
    return new TSEAdapter2026(
      http,
      { baseUrl: 'https://resultados.tse.jus.br', environment: 'oficial' },
      { round, date },
    );
  };

  it('finds the 1st round by its date', async () => {
    const config = await official(1, '2026-10-04').getElectionConfig();
    expect(config.providerRoundId).toBe('3220');
  });

  it('waits for the 2026 runoff instead of picking the 2024 municipal one', async () => {
    // The official file of 4 Oct 2026 lists the 2024 municipal runoff but not the 2026 one yet.
    const attempt = official(2, '2026-10-25').getElectionConfig();
    await expect(attempt).rejects.toBeInstanceOf(ProviderNotFoundError);
    await expect(attempt).rejects.toThrow('no pleito for round 2 of 2026');
  });
});

describe('tseTime', () => {
  it('converts Brasília time to UTC', () => {
    expect(tseTime('04/10/2026', '20:05:00')).toBe('2026-10-04T23:05:00.000Z');
  });

  it('never returns a time in the future', () => {
    const before = Date.now();
    const at = tseTime('31/12/2099', '23:59:59');
    expect(at).not.toBeNull();
    expect(Date.parse(at!)).toBeGreaterThanOrEqual(before);
    expect(Date.parse(at!)).toBeLessThanOrEqual(Date.now());
  });

  it('keeps missing or malformed stamps as null', () => {
    expect(tseTime(null, '10:00:00')).toBeNull();
    expect(tseTime('2026-10-04', '10:00:00')).toBeNull();
  });
});
