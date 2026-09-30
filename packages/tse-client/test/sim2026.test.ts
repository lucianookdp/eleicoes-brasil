import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { area, checkResult, rankForDisplay } from '@eleicoes/election-core';
import { describe, expect, it } from 'vitest';
import { TSEAdapter2026 } from '../src/adapter-2026';
import { TseHttpClient } from '../src/http';

/**
 * Real files captured from the official TSE simulation environment (29/09/2026).
 * They pin the details the specification left open: comma decimals in "…n" fields,
 * EA14 listing states before Brazil, and the "Conselheiro Distrital" office (code 25).
 */
const BASE = 'https://resultados-sim.tse.jus.br/simulado';
const file = (name: string) => readFileSync(join(import.meta.dirname, 'fixtures', 'sim2026', name), 'utf8');
const routes: Record<string, string> = {
  '/comum/config/ele-c.json': file('ele-c.json'),
  '/dados/br/br-e021270-ab.json': file('br-e021270-ab.json'),
  '/dados/br/br-c0001-e021270-u.json': file('br-c0001-e021270-u.json'),
  '/dados/ac/ac-c0003-e021272-u.json': file('ac-c0003-e021272-u.json'),
  // Municipal configuration is large; an empty list is enough for these tests.
  '/config/mun-e021270-cm.json': '{"dg":"","hg":"","abr":[]}',
};

function adapter() {
  const fetchImpl = (async (url: string) => {
    const hit = Object.entries(routes).find(([suffix]) => String(url).endsWith(suffix));
    return hit ? new Response(hit[1]) : new Response('', { status: 404 });
  }) as typeof fetch;
  const http = new TseHttpClient({
    requestsPerSecond: 1000,
    concurrency: 4,
    timeoutMs: 1000,
    maxRetries: 0,
    fetchImpl,
  });
  return new TSEAdapter2026(
    http,
    { baseUrl: BASE, environment: 'simulado2026', providerRoundId: '17801' },
    { round: 1, date: '2026-10-04' },
  );
}

describe('TSEAdapter2026 against real simulation files', () => {
  it('reads the configuration, including Conselheiro Distrital', async () => {
    const config = await adapter().getElectionConfig();
    expect(config.providerElectionCodes).toEqual(['21274', '21270', '21272']);
    expect(config.progressElectionCode).toBe('21270');
    expect(config.offices.find((o) => o.code === '25')).toMatchObject({
      slug: 'conselheiro-distrital',
      scope: 'city',
    });
  });

  it('reads Brazil progress with states listed before Brazil', async () => {
    const res = await adapter().getCountryProgress('21270');
    if (!res.changed) throw new Error('expected data');
    expect(res.data.progress.sectionsTotal).toBeGreaterThan(400_000);
    expect(res.data.states.length).toBe(28); // 26 states + DF + abroad
  });

  it('parses comma decimals and vote destinations in real results', async () => {
    const a = adapter();
    const config = await a.getElectionConfig();
    const president = config.offices.find((o) => o.slug === 'presidente')!;
    const res = await a.getResult({ office: president, area: area.country() });
    if (!res.changed) throw new Error('expected data');
    expect(checkResult(res.data)).toEqual([]);
    expect(res.data.candidates.every((c) => c.percent != null && c.percent > 0 && c.percent < 100)).toBe(
      true,
    );
    const destinations = new Set(res.data.candidates.map((c) => c.voteDestination));
    expect(destinations.has('Anulado sub judice')).toBe(true);
    // The first candidate shown must have valid votes.
    expect(rankForDisplay(res.data.candidates)[0]!.voteDestination).toBe('Válido');

    const governor = config.offices.find((o) => o.slug === 'governador')!;
    const ac = await a.getResult({ office: governor, area: area.state('AC') });
    expect(ac.changed && ac.data.candidates.length).toBeGreaterThan(1);
  });
});

describe('candidate photos', () => {
  it('downloads from the "ft" directory and returns null on 404 without tripping the breaker', async () => {
    const seen: string[] = [];
    const fetchImpl = (async (url: string) => {
      seen.push(String(url));
      if (String(url).endsWith('ele-c.json')) return new Response(file('ele-c.json'));
      if (String(url).endsWith('mun-e021270-cm.json')) return new Response('{"abr":[]}');
      if (String(url).endsWith('/fotos/br/111.jpeg'))
        return new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/jpeg' } });
      return new Response('', { status: 404 });
    }) as typeof fetch;
    const http = new TseHttpClient({
      requestsPerSecond: 1000,
      concurrency: 4,
      timeoutMs: 1000,
      maxRetries: 0,
      fetchImpl,
    });
    const a = new TSEAdapter2026(
      http,
      { baseUrl: BASE, environment: 'simulado2026', providerRoundId: '17801' },
      { round: 1, date: '2026-10-04' },
    );
    const config = await a.getElectionConfig();
    const president = config.offices.find((o) => o.slug === 'presidente')!;
    const photo = await a.getCandidatePhoto(president, null, '111');
    expect(photo?.contentType).toBe('image/jpeg');
    expect(seen.at(-1)).toBe(`${BASE}/simulado2026/ele2026/21270/fotos/br/111.jpeg`);
    for (let i = 0; i < 40; i++)
      expect(await a.getCandidatePhoto(president, null, String(1000 + i))).toBeNull();
    expect(http.circuitState).toBe('closed');
  });
});
