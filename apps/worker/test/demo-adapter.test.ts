import { area, checkResult, countedPct } from '@eleicoes/election-core';
import { TSEAdapter2026, TseHttpClient } from '@eleicoes/tse-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startDemoServer } from '../src/demo/server';

/**
 * The demo server must speak the official TSE format well enough for the real adapter:
 * this guards both the generator and the adapter against drifting apart.
 */
const PORT = 4911;
let demo: ReturnType<typeof startDemoServer>;
let adapter: TSEAdapter2026;

beforeAll(() => {
  // 30-minute count, started 12 minutes ago: mid-count, some cities done, some untouched.
  demo = startDemoServer({ port: PORT, durationMinutes: 30, waitSeconds: 0, offsetMinutes: 12 });
  const http = new TseHttpClient({ requestsPerSecond: 500, concurrency: 8, timeoutMs: 5000, maxRetries: 0 });
  adapter = new TSEAdapter2026(
    http,
    { baseUrl: `http://localhost:${PORT}`, environment: 'demo', providerRoundId: '900001' },
    { round: 1, date: '2026-10-04' },
  );
});
afterAll(() => demo.close());

describe('demo TSE server + TSEAdapter2026', () => {
  it('serves a configuration with all general-election offices and cities', async () => {
    const config = await adapter.getElectionConfig();
    expect(config.offices.map((o) => o.slug)).toEqual([
      'presidente',
      'governador',
      'senador',
      'deputado-federal',
      'deputado-estadual',
      'deputado-distrital',
    ]);
    expect(config.cities.length).toBeGreaterThan(200);
    expect(config.progressElectionCode).toBe('900010');
  });

  it('progress is consistent between Brazil, states and cities', async () => {
    const br = await adapter.getCountryProgress('900010');
    if (!br.changed) throw new Error('expected data');
    const { progress, states } = br.data;
    expect(progress.status).toBe('in-progress');
    expect(countedPct(progress)).toBeGreaterThan(0);
    expect(countedPct(progress)).toBeLessThan(100);
    expect(states).toHaveLength(28); // 26 states + DF + abroad (ZZ), as in the TSE files;
    const sum = states.reduce((s, x) => s + (x.progress.sectionsCounted ?? 0), 0);
    expect(sum).toBe(progress.sectionsCounted);

    const sp = await adapter.getStateProgress('900010', 'SP');
    if (!sp.changed) throw new Error('expected data');
    expect(sp.data.cities.reduce((s, x) => s + (x.progress.sectionsCounted ?? 0), 0)).toBe(
      sp.data.progress.sectionsCounted,
    );
  });

  it('results parse and pass the data-quality checks at every level', async () => {
    const config = await adapter.getElectionConfig();
    const president = config.offices.find((o) => o.slug === 'presidente')!;
    const federal = config.offices.find((o) => o.slug === 'deputado-federal')!;
    const saoPaulo = config.cities.find((c) => c.state === 'SP' && c.isCapital)!;

    for (const [office, target] of [
      [president, area.country()],
      [president, area.state('BA')],
      [federal, area.state('SP')],
      [federal, area.city('SP', saoPaulo.code)],
    ] as const) {
      const res = await adapter.getResult({ office, area: target });
      if (!res.changed) throw new Error('expected data');
      expect(checkResult(res.data)).toEqual([]);
      expect(res.data.candidates.length).toBeGreaterThan(1);
    }
  });

  it('answers 304 for unchanged files within the same tick', async () => {
    await adapter.getCountryProgress('900010');
    const again = await adapter.getCountryProgress('900010');
    expect(again.changed).toBe(false);
  });

  it('never serves results for offices outside their states (DF has no deputado estadual)', async () => {
    const config = await adapter.getElectionConfig();
    const estadual = config.offices.find((o) => o.slug === 'deputado-estadual')!;
    await expect(adapter.getResult({ office: estadual, area: area.state('DF') })).rejects.toThrow(
      'Not found',
    );
  });
});
