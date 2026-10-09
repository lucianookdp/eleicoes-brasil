import { areaProgress, createDatabase, ingestionEvents, runMigrations } from '@eleicoes/database';
import { area, emptyProgress, findRound } from '@eleicoes/election-core';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Store } from '../src/store';

/**
 * A published file with fewer ballot boxes counted than the one before ("going back in time") is
 * ignored, so the screen never steps back, and recorded for the occurrences page.
 * Needs TEST_DATABASE_URL (CI provides one).
 */
const base = process.env.TEST_DATABASE_URL;
// Its own database: other tests run at the same time and reset the shared ones.
const url = base?.replace(/\/([^/?]+)(\?|$)/, '/$1_regression$2');
const suite = url ? describe : describe.skip;

suite('files going back in time', () => {
  const quiet = { warn: () => {} };
  let database: ReturnType<typeof createDatabase>;

  beforeAll(async () => {
    const admin = createDatabase(base!, { max: 1 });
    try {
      await admin.sql.unsafe(`create database "${new URL(url!).pathname.slice(1)}"`);
    } catch (err) {
      if ((err as { code?: string }).code !== '42P04') throw err; // already exists
    } finally {
      await admin.close();
    }
    await runMigrations(url!);
    database = createDatabase(url!, { max: 2 });
  });
  afterAll(() => database?.close());

  it('ignores the older file and records it as an occurrence', async () => {
    const { db, sql } = database;
    const roundId = await Store.ensureRound(db, findRound('demo-1')!, 'DEVELOPMENT', 'demo');
    await db.delete(areaProgress).where(eq(areaProgress.roundId, roundId));
    await db.delete(ingestionEvents).where(eq(ingestionEvents.roundId, roundId));
    const store = new Store(db, sql, roundId, 'demo-1', 'DEMO', quiet);
    const provenance = {
      provider: 'DEMO',
      adapter: 'tse-2026@test',
      sourceFile: '/br-e000001-ab.json',
      sourceId: '1',
      retrievedAt: new Date().toISOString(),
      sourceGeneratedAt: null,
      etag: null,
      checksum: 'x',
    };
    const at = (pct: number) => ({
      area: area.country(),
      progress: {
        ...emptyProgress(),
        status: 'in-progress' as const,
        sectionsTotal: 100,
        sectionsCounted: pct,
        sectionsCountedPct: pct,
        totalizedAt: new Date().toISOString(),
      },
    });

    await store.applyProgress([at(50)], provenance, new Date().toISOString());
    const changes = await store.applyProgress([at(30)], provenance, new Date().toISOString());

    expect(changes).toEqual([]);
    const [stored] = await db
      .select({ pct: areaProgress.countedPct })
      .from(areaProgress)
      .where(and(eq(areaProgress.roundId, roundId), eq(areaProgress.areaKey, 'br')));
    expect(stored?.pct).toBe(50);
    const events = await db
      .select({
        type: ingestionEvents.type,
        pct: ingestionEvents.countedPct,
        areaKey: ingestionEvents.areaKey,
      })
      .from(ingestionEvents)
      .where(and(eq(ingestionEvents.roundId, roundId), eq(ingestionEvents.type, 'quality.regression')));
    expect(events).toEqual([{ type: 'quality.regression', pct: 30, areaKey: 'br' }]);
  });
});
