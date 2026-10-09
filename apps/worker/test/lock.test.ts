import { describe, expect, it } from 'vitest';
import { holdCollectorLock } from '../src/lock';

/** Needs a real Postgres: set TEST_DATABASE_URL (CI provides one). Skipped otherwise. */
const url = process.env.TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;

suite('collector lock (integration)', () => {
  it('lets a second collector of the same round start only after the first one stops', async () => {
    const lost: string[] = [];
    const first = await holdCollectorLock(url!, 'lock-test', { onLost: () => lost.push('first') });

    let waits = 0;
    let secondStarted = false;
    const second = holdCollectorLock(url!, 'lock-test', {
      retryMs: 50,
      onWaiting: () => waits++,
      onLost: () => lost.push('second'),
    }).then((l) => {
      secondStarted = true;
      return l;
    });
    await new Promise((r) => setTimeout(r, 300));
    expect(secondStarted).toBe(false);
    expect(waits).toBeGreaterThan(0);

    await first.release();
    const held = await second;
    expect(secondStarted).toBe(true);
    await held.release();
    // Releasing on purpose is not "losing" the lock.
    expect(lost).toEqual([]);
  });

  it('does not block collectors of other rounds', async () => {
    const a = await holdCollectorLock(url!, 'lock-test-a', { onLost: () => {} });
    const b = await holdCollectorLock(url!, 'lock-test-b', { onLost: () => {} });
    await a.release();
    await b.release();
  });
});
