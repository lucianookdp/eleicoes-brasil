import { ProviderNotFoundError, ProviderUnavailableError } from '@eleicoes/election-core';
import { describe, expect, it } from 'vitest';
import { TseHttpClient } from '../src/http';

function client(
  handler: (headers: Headers) => Response,
  opts: Partial<ConstructorParameters<typeof TseHttpClient>[0]> = {},
) {
  const seen: Headers[] = [];
  const fetchImpl = (async (_url: string, init?: RequestInit) => {
    const h = new Headers(init?.headers);
    seen.push(h);
    return handler(h);
  }) as typeof fetch;
  const http = new TseHttpClient({
    requestsPerSecond: 1000,
    concurrency: 2,
    timeoutMs: 1000,
    maxRetries: 2,
    fetchImpl,
    sleep: async () => {},
    ...opts,
  });
  return { http, seen };
}

describe('TseHttpClient', () => {
  it('sends If-None-Match after the first response and understands 304', async () => {
    const { http, seen } = client((h) =>
      h.get('if-none-match') === '"abc"'
        ? new Response(null, { status: 304 })
        : new Response('{}', { headers: { etag: '"abc"' } }),
    );
    expect((await http.get('https://x/a.json')).notModified).toBe(false);
    expect((await http.get('https://x/a.json')).notModified).toBe(true);
    expect(seen[1]!.get('if-none-match')).toBe('"abc"');
  });

  it('retries 5xx with backoff and then gives up with ProviderUnavailableError', async () => {
    const { http, seen } = client(() => new Response('boom', { status: 503 }));
    await expect(http.get('https://x/a.json')).rejects.toBeInstanceOf(ProviderUnavailableError);
    expect(seen).toHaveLength(3); // 1 + 2 retries
  });

  it('never retries a 404', async () => {
    const { http, seen } = client(() => new Response('', { status: 404 }));
    await expect(http.get('https://x/a.json')).rejects.toBeInstanceOf(ProviderNotFoundError);
    expect(seen).toHaveLength(1);
  });

  it('opens the circuit on 429 and stops calling the source', async () => {
    const { http, seen } = client(() => new Response('', { status: 429 }));
    await expect(http.get('https://x/a.json')).rejects.toBeInstanceOf(ProviderUnavailableError);
    await expect(http.get('https://x/b.json')).rejects.toThrow(/circuit open/);
    expect(seen).toHaveLength(1);
    expect(http.circuitState).toBe('open');
  });

  it('spaces requests according to the rate limit', async () => {
    let clock = 0;
    const waits: number[] = [];
    const { http } = client(() => new Response('{}'), {
      requestsPerSecond: 10,
      now: () => clock,
      sleep: async (ms) => {
        waits.push(ms);
        clock += ms;
      },
    });
    await Promise.all([http.get('https://x/1'), http.get('https://x/2'), http.get('https://x/3')]);
    expect(waits.filter((w) => w > 0)).toEqual([100, 100]);
  });
});
