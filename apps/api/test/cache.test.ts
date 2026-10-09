import { describe, expect, it } from 'vitest';
import { ResponseCache } from '../src/cache';

describe('ResponseCache', () => {
  it('keeps serving the last good body when the database fails', async () => {
    const cache = new ResponseCache(0); // every read is a miss
    const first = await cache.get('r', 'k', async () => ({ n: 1 }));
    const second = await cache.get('r', 'k', async () => {
      throw new Error('database down');
    });
    expect(second.body.etag).toBe(first.body.etag);
    expect(first.stale).toBe(false);
    expect(second.stale).toBe(true);
  });

  it('still fails when there is nothing to fall back to', async () => {
    const cache = new ResponseCache(0);
    await expect(
      cache.get('r', 'k', async () => {
        throw new Error('database down');
      }),
    ).rejects.toThrow('database down');
  });
});

describe('ResponseCache after an update', () => {
  it('falls back to the invalidated body if the database then fails', async () => {
    const cache = new ResponseCache(60_000);
    const first = await cache.get('r', 'k', async () => ({ n: 1 }));
    cache.invalidate('r');
    const second = await cache.get('r', 'k', async () => {
      throw new Error('database down');
    });
    expect(second.body.etag).toBe(first.body.etag);
    expect(second.stale).toBe(true);
    cache.invalidate('r'); // the next update once the database is back
    const third = await cache.get('r', 'k', async () => ({ n: 2 }));
    expect(third.body.etag).not.toBe(first.body.etag);
    expect(third.stale).toBe(false);
  });
});
