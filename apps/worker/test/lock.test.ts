import postgres from 'postgres';
import { describe, expect, it } from 'vitest';
import { holdCollectorLock } from '../src/lock';

/** Needs a real Postgres: set TEST_DATABASE_URL (CI provides one). Skipped otherwise. */
const url = process.env.TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;

const until = async (check: () => boolean, ms = 5000) => {
  const end = Date.now() + ms;
  while (!check()) {
    if (Date.now() > end) throw new Error('timed out');
    await new Promise((r) => setTimeout(r, 20));
  }
};

suite('collector lock (integration)', () => {
  it('lets a second collector of the same round start only after the first one stops', async () => {
    const lost: string[] = [];
    const first = await holdCollectorLock(url!, 'lock-test', { onLost: () => lost.push('first') });
    expect(first.held).toBe(true);

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
    expect(held.held).toBe(true);
    await held.release();
    // Releasing on purpose is not "losing" the lock.
    expect(lost).toEqual([]);
  });

  it('does not block collectors of other rounds', async () => {
    const a = await holdCollectorLock(url!, 'lock-test-a', {});
    const b = await holdCollectorLock(url!, 'lock-test-b', {});
    expect(a.held && b.held).toBe(true);
    await a.release();
    await b.release();
  });

  it('pauses when its connection drops, and takes the lock again by itself', async () => {
    const events: string[] = [];
    const lock = await holdCollectorLock(url!, 'lock-test-drop', {
      retryMs: 50,
      onLost: () => events.push('lost'),
      onRegained: () => events.push('regained'),
    });
    // What a database restart does to the connection.
    const admin = postgres(url!, { max: 1, onnotice: () => {} });
    await admin`select pg_terminate_backend(pid) from pg_stat_activity
      where application_name = 'eleicoes-collector-lock' and datname = current_database()`;
    await admin.end();
    await until(() => events.includes('lost'));
    await until(() => lock.held);
    expect(events).toEqual(['lost', 'regained']);
    await lock.release();
    expect(lock.held).toBe(false);
  });
});
