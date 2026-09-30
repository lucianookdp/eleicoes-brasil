import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import {
  areaResults,
  createDatabase,
  electionRounds,
  elections,
  offices,
  progressSnapshots,
  resultSnapshots,
  type StoredResult,
} from '@eleicoes/database';
import {
  type AreaResult,
  type CompactCandidate,
  parseAreaKey,
  type RealtimeEvent,
} from '@eleicoes/election-core';
import { asc, eq } from 'drizzle-orm';
import type { Logger } from 'pino';
import { createLogger } from './logger';
import { Store, type StoredOffice } from './store';

export interface ReplayOptions {
  databaseUrl: string;
  /** Source round slug ("2026-1") or year ("2026" → "2026-1"). */
  source: string;
  speed: number;
  log: Logger;
  /** Longest real wait between two ticks, so quiet hours do not stall a demo. */
  maxGapMs?: number;
}

/**
 * Re-emits a recorded election into a separate round ("replay-<source>") as if it were live:
 * same tables, same events, same SSE. The UI needs no special replay code.
 * Snapshots are applied in capture order with the original gaps divided by `speed`.
 */
export async function runReplay({ databaseUrl, source, speed, log, maxGapMs = 10_000 }: ReplayOptions) {
  const sourceSlug = /^\d{4}$/.test(source) ? `${source}-1` : source;
  const { db, sql: pg, close } = createDatabase(databaseUrl, { max: 4 });
  try {
    const [src] = await db
      .select({ round: electionRounds, election: elections })
      .from(electionRounds)
      .innerJoin(elections, eq(elections.id, electionRounds.electionId))
      .where(eq(electionRounds.slug, sourceSlug));
    if (!src) throw new Error(`round "${sourceSlug}" not found in the database`);

    const targetSlug = `replay-${sourceSlug}`;
    await db.delete(electionRounds).where(eq(electionRounds.slug, targetSlug));
    const targetId = await Store.ensureRound(
      db,
      {
        slug: targetSlug,
        electionSlug: `replay-${src.election.slug}`,
        electionName: `Replay — ${src.election.name}`,
        year: src.election.year,
        kind: src.election.kind,
        round: src.round.round as 1 | 2,
        date: src.round.date,
        adapter: src.round.adapter ?? 'unknown',
        demo: src.election.demo,
        sources: {},
      },
      'REPLAY',
      'replay',
    );
    await db
      .update(electionRounds)
      .set({
        adapterVersion: src.round.adapterVersion,
        providerId: src.round.providerId,
        progressElectionCode: src.round.progressElectionCode,
        providerElectionCodes: src.round.providerElectionCodes,
      })
      .where(eq(electionRounds.id, targetId));
    const store = new Store(db, pg, targetId, targetSlug, src.election.demo ? 'DEMO' : 'TSE');

    // Copy reference data (offices, parties, candidates) with the new round id.
    const officeMap = new Map<string, StoredOffice>();
    for (const o of await db.select().from(offices).where(eq(offices.roundId, src.round.id))) {
      const [row] = await db
        .insert(offices)
        .values({ ...o, id: undefined, roundId: targetId })
        .returning({ id: offices.id });
      officeMap.set(o.id, {
        id: row!.id,
        code: o.providerId,
        slug: o.slug,
        name: o.name,
        kind: o.kind,
        scope: o.scope,
        providerElectionCode: o.providerElectionCode,
        states: o.states as StoredOffice['states'],
      });
    }
    await pg`insert into parties (round_id, number, abbreviation, name)
      select ${targetId}, number, abbreviation, name from parties where round_id = ${src.round.id}`;
    for (const [oldId, office] of officeMap) {
      await pg`insert into candidates (round_id, office_id, state_code, provider, provider_id, number, name, ballot_name,
          search_name, party_number, party_abbreviation, coalition, running_mates)
        select ${targetId}, ${office.id}, state_code, provider, provider_id, number, name, ballot_name, search_name,
          party_number, party_abbreviation, coalition, running_mates
        from candidates where round_id = ${src.round.id} and office_id = ${oldId}`;
    }

    // Final results give names/parties; snapshots give the numbers at each moment.
    const finals = new Map<string, StoredResult>();
    for (const r of await db
      .select({ officeId: areaResults.officeId, areaKey: areaResults.areaKey, result: areaResults.result })
      .from(areaResults)
      .where(eq(areaResults.roundId, src.round.id))) {
      finals.set(`${r.officeId}|${r.areaKey}`, r.result);
    }

    const progressRows = await db
      .select()
      .from(progressSnapshots)
      .where(eq(progressSnapshots.roundId, src.round.id))
      .orderBy(asc(progressSnapshots.capturedAt), asc(progressSnapshots.id));
    const resultRows = await db
      .select()
      .from(resultSnapshots)
      .where(eq(resultSnapshots.roundId, src.round.id))
      .orderBy(asc(resultSnapshots.capturedAt), asc(resultSnapshots.id));
    const lastResultId = new Map<string, number>();
    for (const r of resultRows) lastResultId.set(`${r.officeId}|${r.areaKey}`, r.id);

    const ticks = new Map<string, { progress: typeof progressRows; results: typeof resultRows }>();
    const tick = (t: string) => {
      const existing = ticks.get(t);
      if (existing) return existing;
      const created = { progress: [] as typeof progressRows, results: [] as typeof resultRows };
      ticks.set(t, created);
      return created;
    };
    // One replay step per 5 s of recorded time: close to a real collector cycle.
    const bucket = (at: string) => new Date(Math.floor(Date.parse(at) / 5000) * 5000).toISOString();
    for (const p of progressRows) tick(bucket(p.capturedAt)).progress.push(p);
    for (const r of resultRows) tick(bucket(r.capturedAt)).results.push(r);
    const timeline = [...ticks.entries()].sort(([a], [b]) => a.localeCompare(b));

    log.info({ source: sourceSlug, target: targetSlug, ticks: timeline.length, speed }, 'replay starting');
    await store.setRoundStatus('live');

    let previous: number | null = null;
    for (const [at, batch] of timeline) {
      const t = Date.parse(at);
      if (previous != null) await sleep(Math.min(maxGapMs, (t - previous) / speed));
      previous = t;
      const now = new Date().toISOString();
      const cycleId = randomUUID();
      await store.startCycle(cycleId, 'REPLAY', now);
      const events: Omit<RealtimeEvent, 'electionId' | 'timestamp'>[] = [];

      const entries = batch.progress.flatMap((p) => {
        const a = parseAreaKey(p.areaKey);
        return a ? [{ area: a, progress: p.progress }] : [];
      });
      if (entries.length > 0) {
        const changes = await store.applyProgress(
          entries,
          provenanceFor(batch.progress[0]!.sourceFile, `replay-p-${batch.progress[0]!.id}`),
          now,
        );
        for (const c of changes) {
          if (c.area.type === 'city') continue;
          events.push({
            type: c.area.type === 'country' ? 'country.updated' : 'state.updated',
            areaKey: c.area.key,
            state: c.area.state ?? undefined,
            changes: { sectionsAdded: c.sectionsAdded, votesAdded: c.votesAdded, countedPct: c.countedPct },
          });
        }
      }

      for (const r of batch.results) {
        const key = `${r.officeId}|${r.areaKey}`;
        const office = officeMap.get(r.officeId);
        const a = parseAreaKey(r.areaKey);
        const final = finals.get(key);
        if (!office || !a || !final) continue;
        const isLast = lastResultId.get(key) === r.id;
        if (!r.candidates && !isLast) continue; // city-level proportional: only the final state exists
        const result: AreaResult = isLast
          ? { ...final, officeCode: office.code, area: a }
          : {
              ...final,
              officeCode: office.code,
              area: a,
              progress: store.lastProgress(a.key) ?? final.progress,
              votes: r.votes,
              candidates: withNumbers(final.candidates, r.candidates!),
              final: false,
              mathematicallyDecided: null,
            };
        const stored = await store.applyResult(
          office,
          result,
          { ...r.provenance, checksum: `replay-${r.id}` },
          now,
        );
        if (stored && a.type !== 'city')
          events.push({
            type: 'result.updated',
            areaKey: a.key,
            state: a.state ?? undefined,
            officeCode: office.code,
          });
      }

      await store.finishCycle(
        cycleId,
        { requests: 0, ok: 0, notModified: 0, notFound: 0, errors: 0, latencies: [] },
        'ok',
        null,
      );
      events.push({ type: 'ingestion.status', changes: { status: 'ok' } });
      await store.notify(events, now);
    }

    await store.setRoundStatus('final');
    log.info({ target: targetSlug }, 'replay finished');
  } finally {
    await close();
  }
}

function withNumbers(finalCandidates: AreaResult['candidates'], compact: CompactCandidate[]) {
  const byKey = new Map(compact.map((c) => [c[0], c]));
  return finalCandidates.map((c) => {
    const at = byKey.get(c.key);
    return { ...c, votes: at?.[1] ?? 0, percent: at?.[2] ?? null, elected: null, status: null };
  });
}

function provenanceFor(sourceFile: string | null, checksum: string) {
  return {
    provider: 'TSE',
    adapter: 'replay',
    sourceFile: sourceFile ?? 'replay',
    sourceId: null,
    retrievedAt: new Date().toISOString(),
    sourceGeneratedAt: null,
    etag: null,
    checksum,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

// CLI: pnpm replay --election 2026 --speed 10
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const { values } = parseArgs({
    options: { election: { type: 'string', default: 'demo-1' }, speed: { type: 'string', default: '10' } },
  });
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }
  const log = createLogger('replay', process.env.LOG_LEVEL ?? 'info');
  await runReplay({ databaseUrl: url, source: values.election!, speed: Number(values.speed), log });
}
