import {
  areaProgress,
  areaResults,
  candidates,
  cities,
  collectorCycles,
  type Database,
  EVENTS_CHANNEL,
  electionRounds,
  elections,
  ingestionEvents,
  offices,
  parties,
  progressSnapshots,
  resultSnapshots,
  type Sql,
} from '@eleicoes/database';
import {
  type AreaRef,
  type AreaResult,
  type CompactCandidate,
  type CountingProgress,
  compactCandidates,
  countedPct,
  type ElectionConfig,
  type Office,
  type Provenance,
  progressChanged,
  progressDelta,
  type RealtimeEvent,
  type RoundDefinition,
  searchKey,
} from '@eleicoes/election-core';
import { and, eq, sql } from 'drizzle-orm';

export interface StoredOffice extends Office {
  id: string;
}

export interface ProgressChange {
  area: AreaRef;
  sectionsAdded: number | null;
  votesAdded: number | null;
  countedPct: number | null;
  status: string;
}

export interface CycleStats {
  requests: number;
  ok: number;
  notModified: number;
  notFound: number;
  errors: number;
  latencies: number[];
}

const eventType = (a: AreaRef) =>
  a.type === 'country' ? 'country.updated' : a.type === 'state' ? 'state.updated' : 'city.updated';

/** Snapshot candidate history for every area except city-level proportional races (ADR 004). */
export const keepCandidateHistory = (office: Office, area: AreaRef) =>
  area.type === 'country' || area.type === 'state' || office.kind === 'majoritarian';

/**
 * All database writes of the collector. The worker is the single writer, so it keeps the
 * current progress in memory to decide what changed without reading it back every time.
 */
export class Store {
  private progress = new Map<string, CountingProgress>();
  private knownCandidates = new Set<string>();
  private knownParties = new Set<string>();

  constructor(
    readonly db: Database,
    private readonly sql: Sql,
    readonly roundId: string,
    readonly roundSlug: string,
  ) {}

  static async ensureRound(db: Database, def: RoundDefinition, mode: string, environment: string | null) {
    const [election] = await db
      .insert(elections)
      .values({
        slug: def.electionSlug,
        name: def.electionName,
        year: def.year,
        kind: def.kind,
        demo: def.demo,
      })
      .onConflictDoUpdate({ target: elections.slug, set: { name: def.electionName, demo: def.demo } })
      .returning({ id: elections.id });
    const [round] = await db
      .insert(electionRounds)
      .values({
        electionId: election!.id,
        slug: def.slug,
        round: def.round,
        date: def.date,
        adapter: def.adapter,
        environment,
        mode,
      })
      .onConflictDoUpdate({
        target: electionRounds.slug,
        set: { adapter: def.adapter, environment, mode, updatedAt: sql`now()` },
      })
      .returning({ id: electionRounds.id });
    return round!.id;
  }

  async load() {
    const rows = await this.db
      .select({ key: areaProgress.areaKey, progress: areaProgress.progress })
      .from(areaProgress)
      .where(eq(areaProgress.roundId, this.roundId));
    this.progress = new Map(rows.map((r) => [r.key, r.progress]));
  }

  lastProgress(areaKey: string) {
    return this.progress.get(areaKey);
  }

  // ------------------------------------------------------------------ configuration

  async syncConfig(
    config: ElectionConfig,
    adapter: { id: string; version: string },
  ): Promise<StoredOffice[]> {
    await this.db
      .update(electionRounds)
      .set({
        providerId: config.providerRoundId,
        adapter: adapter.id,
        adapterVersion: adapter.version,
        progressElectionCode: config.progressElectionCode,
        providerElectionCodes: config.providerElectionCodes,
        updatedAt: sql`now()`,
      })
      .where(eq(electionRounds.id, this.roundId));

    const stored: StoredOffice[] = [];
    for (const o of config.offices) {
      const [row] = await this.db
        .insert(offices)
        .values({
          roundId: this.roundId,
          providerId: o.code,
          providerElectionCode: o.providerElectionCode,
          slug: o.slug,
          name: o.name,
          kind: o.kind,
          scope: o.scope,
          states: o.states,
        })
        .onConflictDoUpdate({
          target: [offices.roundId, offices.slug],
          set: {
            name: o.name,
            providerId: o.code,
            providerElectionCode: o.providerElectionCode,
            states: o.states,
          },
        })
        .returning({ id: offices.id });
      stored.push({ ...o, id: row!.id });
    }

    for (let i = 0; i < config.cities.length; i += 500) {
      const batch = config.cities.slice(i, i + 500).map((c) => ({
        stateCode: c.state,
        providerId: c.code,
        ibgeCode: c.ibgeCode,
        name: c.name,
        searchName: searchKey(c.name),
        isCapital: c.isCapital,
        zones: c.zones,
      }));
      await this.db
        .insert(cities)
        .values(batch)
        .onConflictDoUpdate({
          target: [cities.provider, cities.stateCode, cities.providerId],
          set: {
            name: sql`excluded.name`,
            searchName: sql`excluded.search_name`,
            ibgeCode: sql`excluded.ibge_code`,
            isCapital: sql`excluded.is_capital`,
            zones: sql`excluded.zones`,
          },
        });
    }
    return stored;
  }

  // ------------------------------------------------------------------ progress

  /** Persists only entries that changed; returns what changed for events. */
  async applyProgress(
    entries: { area: AreaRef; progress: CountingProgress }[],
    provenance: Provenance,
    now: string,
  ): Promise<ProgressChange[]> {
    // Last entry per area wins: a batch must not upsert the same row twice.
    const latest = [...new Map(entries.map((e) => [e.area.key, e])).values()];
    const changed = latest.filter((e) => progressChanged(this.progress.get(e.area.key), e.progress));
    if (changed.length === 0) return [];

    const changes: ProgressChange[] = changed.map((e) => {
      const d = progressDelta(this.progress.get(e.area.key), e.progress);
      return {
        area: e.area,
        sectionsAdded: d.sectionsAdded,
        votesAdded: d.turnoutAdded,
        countedPct: countedPct(e.progress),
        status: e.progress.status,
      };
    });

    await this.db.transaction(async (tx) => {
      const rows = changed.map((e) => ({
        roundId: this.roundId,
        areaKey: e.area.key,
        areaType: e.area.type,
        stateCode: e.area.state,
        status: e.progress.status,
        countedPct: countedPct(e.progress),
        turnout: e.progress.turnout,
        totalizedAt: e.progress.totalizedAt,
        progress: e.progress,
        updatedAt: now,
      }));
      await tx
        .insert(areaProgress)
        .values(rows)
        .onConflictDoUpdate({
          target: [areaProgress.roundId, areaProgress.areaKey],
          set: {
            status: sql`excluded.status`,
            countedPct: sql`excluded.counted_pct`,
            turnout: sql`excluded.turnout`,
            totalizedAt: sql`excluded.totalized_at`,
            progress: sql`excluded.progress`,
            updatedAt: sql`excluded.updated_at`,
          },
        });
      await tx.insert(progressSnapshots).values(
        changed.map((e) => ({
          roundId: this.roundId,
          areaKey: e.area.key,
          areaType: e.area.type,
          stateCode: e.area.state,
          capturedAt: now,
          totalizedAt: e.progress.totalizedAt,
          countedPct: countedPct(e.progress),
          sectionsCounted: e.progress.sectionsCounted,
          turnout: e.progress.turnout,
          progress: e.progress,
          sourceFile: provenance.sourceFile,
          sourceId: provenance.sourceId,
        })),
      );
      await tx.insert(ingestionEvents).values(
        changes.map((c) => ({
          roundId: this.roundId,
          occurredAt: now,
          type: eventType(c.area),
          areaKey: c.area.key,
          stateCode: c.area.state,
          sectionsAdded: c.sectionsAdded,
          votesAdded: c.votesAdded,
          countedPct: c.countedPct,
        })),
      );
    });

    for (const e of changed) this.progress.set(e.area.key, e.progress);
    return changes;
  }

  // ------------------------------------------------------------------ results

  /** Returns false when the file content is identical to what is stored (dedupe by checksum). */
  async applyResult(
    office: StoredOffice,
    result: AreaResult,
    provenance: Provenance,
    now: string,
  ): Promise<boolean> {
    const pk = and(
      eq(areaResults.roundId, this.roundId),
      eq(areaResults.officeId, office.id),
      eq(areaResults.areaKey, result.area.key),
    );
    const [prev] = await this.db
      .select({
        checksum: areaResults.checksum,
        candidates: sql<CompactCandidate[] | null>`(
        select jsonb_agg(jsonb_build_array(c->>'key', (c->>'votes')::bigint, (c->>'percent')::float8))
        from jsonb_array_elements(${areaResults.result}->'candidates') c)`,
      })
      .from(areaResults)
      .where(pk);
    if (prev?.checksum === provenance.checksum) return false;

    const { area, officeCode: _code, ...stored } = result;
    const compact = compactCandidates(result.candidates);
    const pct = countedPct(result.progress);

    await this.db.transaction(async (tx) => {
      await tx
        .insert(areaResults)
        .values({
          roundId: this.roundId,
          officeId: office.id,
          areaKey: area.key,
          areaType: area.type,
          stateCode: area.state,
          countedPct: pct,
          totalizedAt: result.progress.totalizedAt,
          result: stored,
          previousCandidates: prev?.candidates ?? null,
          provenance,
          checksum: provenance.checksum,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [areaResults.roundId, areaResults.officeId, areaResults.areaKey],
          set: {
            countedPct: pct,
            totalizedAt: result.progress.totalizedAt,
            result: stored,
            previousCandidates: prev?.candidates ?? null,
            provenance,
            checksum: provenance.checksum,
            updatedAt: now,
          },
        });
      await tx.insert(resultSnapshots).values({
        roundId: this.roundId,
        officeId: office.id,
        areaKey: area.key,
        areaType: area.type,
        stateCode: area.state,
        capturedAt: now,
        totalizedAt: result.progress.totalizedAt,
        countedPct: pct,
        votes: result.votes,
        candidates: keepCandidateHistory(office, area) ? compact : null,
        provenance,
      });
    });

    if (area.type !== 'city' && area.type !== 'zone') await this.upsertCandidates(office, result);
    return true;
  }

  /** Keeps the searchable candidate and party lists in sync with country/state files. */
  private async upsertCandidates(office: StoredOffice, result: AreaResult) {
    // Sorted and filtered: parallel result writes touch the same parties and candidates, and
    // rows locked in a consistent order cannot deadlock each other.
    const fresh = result.candidates
      .filter((c) => !this.knownCandidates.has(`${office.id}:${c.key}`))
      .sort((a, b) => a.key.localeCompare(b.key));
    if (fresh.length === 0) return;
    const partyRows = [...new Map(result.parties.map((p) => [p.number, p])).values()]
      .filter((p) => !this.knownParties.has(p.number))
      .sort((a, b) => a.number.localeCompare(b.number));
    if (partyRows.length > 0) {
      await this.db
        .insert(parties)
        .values(
          partyRows.map((p) => ({
            roundId: this.roundId,
            number: p.number,
            abbreviation: p.abbreviation,
            name: p.name,
          })),
        )
        .onConflictDoUpdate({
          target: [parties.roundId, parties.number],
          set: { abbreviation: sql`excluded.abbreviation`, name: sql`excluded.name` },
        });
      for (const p of partyRows) this.knownParties.add(p.number);
    }
    for (let i = 0; i < fresh.length; i += 500) {
      await this.db
        .insert(candidates)
        .values(
          fresh.slice(i, i + 500).map((c) => ({
            roundId: this.roundId,
            officeId: office.id,
            stateCode: office.scope === 'country' ? null : result.area.state,
            providerId: c.key,
            number: c.number,
            name: c.name,
            ballotName: c.ballotName,
            searchName: searchKey(`${c.ballotName} ${c.name}`),
            partyNumber: c.party.number,
            partyAbbreviation: c.party.abbreviation,
            coalition: c.coalition,
            runningMates: c.runningMates,
          })),
        )
        .onConflictDoUpdate({
          target: [candidates.roundId, candidates.officeId, candidates.providerId],
          set: {
            name: sql`excluded.name`,
            ballotName: sql`excluded.ballot_name`,
            searchName: sql`excluded.search_name`,
            partyNumber: sql`excluded.party_number`,
            partyAbbreviation: sql`excluded.party_abbreviation`,
            coalition: sql`excluded.coalition`,
            runningMates: sql`excluded.running_mates`,
          },
        });
    }
    for (const c of fresh) this.knownCandidates.add(`${office.id}:${c.key}`);
  }

  // ------------------------------------------------------------------ events, cycles, status

  async recordIssue(type: string, message: string, context: unknown, now: string, area?: AreaRef) {
    await this.db.insert(ingestionEvents).values({
      roundId: this.roundId,
      occurredAt: now,
      type,
      areaKey: area?.key ?? null,
      stateCode: area?.state ?? null,
      message: message.slice(0, 500),
      context: context as object,
    });
  }

  async notify(events: Omit<RealtimeEvent, 'electionId' | 'timestamp'>[], now: string) {
    for (const e of events) {
      const payload = JSON.stringify({ ...e, electionId: this.roundSlug, timestamp: now });
      await this.sql.notify(EVENTS_CHANNEL, payload);
    }
  }

  async startCycle(id: string, mode: string, now: string) {
    await this.db
      .insert(collectorCycles)
      .values({ id, roundId: this.roundId, mode, startedAt: now, status: 'running' });
  }

  async finishCycle(
    id: string,
    stats: CycleStats,
    status: 'ok' | 'degraded' | 'failed' | 'waiting',
    error: string | null,
  ) {
    const sorted = [...stats.latencies].sort((a, b) => a - b);
    const avg = sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : null;
    const p95 = sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]! : null;
    await this.db
      .update(collectorCycles)
      .set({
        finishedAt: new Date().toISOString(),
        requests: stats.requests,
        ok: stats.ok,
        notModified: stats.notModified,
        notFound: stats.notFound,
        errors: stats.errors,
        avgLatencyMs: avg,
        p95LatencyMs: p95,
        status,
        error: error?.slice(0, 500) ?? null,
      })
      .where(eq(collectorCycles.id, id));
  }

  async setRoundStatus(status: 'scheduled' | 'live' | 'final') {
    await this.db
      .update(electionRounds)
      .set({ status, updatedAt: sql`now()` })
      .where(and(eq(electionRounds.id, this.roundId), sql`${electionRounds.status} <> ${status}`));
  }
}
