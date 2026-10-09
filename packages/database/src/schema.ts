import type {
  AreaResult,
  CompactCandidate,
  CountingProgress,
  Provenance,
  RunningMate,
  VoteTotals,
} from '@eleicoes/election-core';
import { sql } from 'drizzle-orm';
import {
  bigint,
  bigserial,
  boolean,
  customType,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * One schema for every election. A new election is new rows, never new tables.
 * Current state lives in `area_progress` / `area_results` (one row per area); history lives in
 * `progress_snapshots` / `result_snapshots` (one row per change). See docs/architecture.md.
 */

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'string' });

export const elections = pgTable('elections', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  year: smallint('year').notNull(),
  kind: text('kind').$type<'general' | 'municipal'>().notNull(),
  demo: boolean('demo').notNull().default(false),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const electionRounds = pgTable('election_rounds', {
  id: uuid('id').primaryKey().defaultRandom(),
  electionId: uuid('election_id')
    .notNull()
    .references(() => elections.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull().unique(),
  round: smallint('round').notNull(),
  date: date('date', { mode: 'string' }).notNull(),
  status: text('status').$type<'scheduled' | 'live' | 'final'>().notNull().default('scheduled'),
  provider: text('provider').notNull().default('TSE'),
  /** Provider round id (TSE "pleito"). */
  providerId: text('provider_id'),
  adapter: text('adapter'),
  adapterVersion: text('adapter_version'),
  environment: text('environment'),
  mode: text('mode'),
  progressElectionCode: text('progress_election_code'),
  providerElectionCodes: text('provider_election_codes').array(),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const offices = pgTable(
  'offices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roundId: uuid('round_id')
      .notNull()
      .references(() => electionRounds.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull().default('TSE'),
    providerId: text('provider_id').notNull(),
    providerElectionCode: text('provider_election_code').notNull(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    kind: text('kind').$type<'majoritarian' | 'proportional'>().notNull(),
    scope: text('scope').$type<'country' | 'state' | 'city'>().notNull(),
    states: text('states').array(),
  },
  (t) => [uniqueIndex('offices_round_slug').on(t.roundId, t.slug)],
);

/** Municipalities are shared across elections: TSE codes are stable over time. */
export const cities = pgTable(
  'cities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: text('provider').notNull().default('TSE'),
    stateCode: text('state_code').notNull(),
    providerId: text('provider_id').notNull(),
    ibgeCode: text('ibge_code'),
    name: text('name').notNull(),
    searchName: text('search_name').notNull(),
    isCapital: boolean('is_capital').notNull().default(false),
    zones: text('zones').array().notNull().default(sql`'{}'`),
  },
  (t) => [
    uniqueIndex('cities_provider_code').on(t.provider, t.stateCode, t.providerId),
    index('cities_search').on(t.searchName),
  ],
);

export const parties = pgTable(
  'parties',
  {
    roundId: uuid('round_id')
      .notNull()
      .references(() => electionRounds.id, { onDelete: 'cascade' }),
    number: text('number').notNull(),
    abbreviation: text('abbreviation').notNull(),
    name: text('name').notNull(),
  },
  (t) => [primaryKey({ columns: [t.roundId, t.number] })],
);

export const candidates = pgTable(
  'candidates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roundId: uuid('round_id')
      .notNull()
      .references(() => electionRounds.id, { onDelete: 'cascade' }),
    officeId: uuid('office_id')
      .notNull()
      .references(() => offices.id, { onDelete: 'cascade' }),
    stateCode: text('state_code'),
    provider: text('provider').notNull().default('TSE'),
    providerId: text('provider_id').notNull(),
    number: text('number').notNull(),
    name: text('name').notNull(),
    ballotName: text('ballot_name').notNull(),
    searchName: text('search_name').notNull(),
    partyNumber: text('party_number').notNull(),
    partyAbbreviation: text('party_abbreviation').notNull(),
    coalition: text('coalition'),
    runningMates: jsonb('running_mates').$type<RunningMate[]>().notNull().default([]),
  },
  (t) => [
    uniqueIndex('candidates_provider').on(t.roundId, t.officeId, t.providerId),
    index('candidates_search').on(t.roundId, t.searchName),
  ],
);

/** Current counting progress per area (from EA14/EA15). */
export const areaProgress = pgTable(
  'area_progress',
  {
    roundId: uuid('round_id')
      .notNull()
      .references(() => electionRounds.id, { onDelete: 'cascade' }),
    areaKey: text('area_key').notNull(),
    areaType: text('area_type').notNull(),
    stateCode: text('state_code'),
    status: text('status').notNull(),
    countedPct: doublePrecision('counted_pct'),
    turnout: bigint('turnout', { mode: 'number' }),
    totalizedAt: ts('totalized_at'),
    progress: jsonb('progress').$type<CountingProgress>().notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.roundId, t.areaKey] }),
    index('area_progress_type').on(t.roundId, t.areaType, t.stateCode),
  ],
);

export type StoredResult = Omit<AreaResult, 'area' | 'officeCode'>;

/** Current result per (office, area) (from EA20). */
export const areaResults = pgTable(
  'area_results',
  {
    roundId: uuid('round_id')
      .notNull()
      .references(() => electionRounds.id, { onDelete: 'cascade' }),
    officeId: uuid('office_id')
      .notNull()
      .references(() => offices.id, { onDelete: 'cascade' }),
    areaKey: text('area_key').notNull(),
    areaType: text('area_type').notNull(),
    stateCode: text('state_code'),
    countedPct: doublePrecision('counted_pct'),
    totalizedAt: ts('totalized_at'),
    result: jsonb('result').$type<StoredResult>().notNull(),
    /** Candidates of the previous version, to compute changes without reading history. */
    previousCandidates: jsonb('previous_candidates').$type<CompactCandidate[]>(),
    provenance: jsonb('provenance').$type<Provenance>().notNull(),
    checksum: text('checksum').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.roundId, t.officeId, t.areaKey] }),
    index('area_results_type').on(t.roundId, t.officeId, t.areaType, t.stateCode),
  ],
);

export const progressSnapshots = pgTable(
  'progress_snapshots',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    roundId: uuid('round_id')
      .notNull()
      .references(() => electionRounds.id, { onDelete: 'cascade' }),
    areaKey: text('area_key').notNull(),
    areaType: text('area_type').notNull(),
    stateCode: text('state_code'),
    capturedAt: ts('captured_at').notNull(),
    totalizedAt: ts('totalized_at'),
    countedPct: doublePrecision('counted_pct'),
    sectionsCounted: integer('sections_counted'),
    turnout: bigint('turnout', { mode: 'number' }),
    progress: jsonb('progress').$type<CountingProgress>().notNull(),
    sourceFile: text('source_file'),
    sourceId: text('source_id'),
  },
  (t) => [
    index('progress_snapshots_area_time').on(t.roundId, t.areaKey, t.capturedAt),
    index('progress_snapshots_type_time').on(t.roundId, t.areaType, t.capturedAt),
  ],
);

export const resultSnapshots = pgTable(
  'result_snapshots',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    roundId: uuid('round_id')
      .notNull()
      .references(() => electionRounds.id, { onDelete: 'cascade' }),
    officeId: uuid('office_id')
      .notNull()
      .references(() => offices.id, { onDelete: 'cascade' }),
    areaKey: text('area_key').notNull(),
    areaType: text('area_type').notNull(),
    stateCode: text('state_code'),
    capturedAt: ts('captured_at').notNull(),
    totalizedAt: ts('totalized_at'),
    countedPct: doublePrecision('counted_pct'),
    votes: jsonb('votes').$type<VoteTotals>().notNull(),
    /** Compact [key, votes, percent][]; null for city-level proportional offices. */
    candidates: jsonb('candidates').$type<CompactCandidate[]>(),
    provenance: jsonb('provenance').$type<Provenance>().notNull(),
  },
  (t) => [
    index('result_snapshots_area_time').on(t.roundId, t.officeId, t.areaKey, t.capturedAt),
    // Recent Brazil/state files (collection delay on /operations), without reading the city rows.
    index('result_snapshots_headline_time')
      .on(t.roundId, t.capturedAt)
      .where(sql`${t.areaType} in ('country', 'state')`),
  ],
);

/** Activity feed + ingestion log (what changed, what failed). Also the source of SSE events. */
export const ingestionEvents = pgTable(
  'ingestion_events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    roundId: uuid('round_id')
      .notNull()
      .references(() => electionRounds.id, { onDelete: 'cascade' }),
    occurredAt: ts('occurred_at').notNull(),
    type: text('type').notNull(),
    areaKey: text('area_key'),
    stateCode: text('state_code'),
    sectionsAdded: integer('sections_added'),
    votesAdded: bigint('votes_added', { mode: 'number' }),
    countedPct: doublePrecision('counted_pct'),
    message: text('message'),
    context: jsonb('context'),
  },
  (t) => [
    index('ingestion_events_time').on(t.roundId, t.occurredAt),
    index('ingestion_events_type_time').on(t.roundId, t.type, t.occurredAt),
    // The latest source/collector problem, read by every overview: thousands of city events per
    // minute on election night would otherwise be scanned to find none.
    index('ingestion_events_issues_time')
      .on(t.roundId, t.occurredAt)
      .where(sql`${t.type} like 'source.%' or ${t.type} = 'collector.error'`),
  ],
);

/** One row per collector cycle: request counts and latency, used by /operations. */
export const collectorCycles = pgTable(
  'collector_cycles',
  {
    id: uuid('id').primaryKey(),
    roundId: uuid('round_id')
      .notNull()
      .references(() => electionRounds.id, { onDelete: 'cascade' }),
    mode: text('mode').notNull(),
    startedAt: ts('started_at').notNull(),
    finishedAt: ts('finished_at'),
    requests: integer('requests').notNull().default(0),
    ok: integer('ok').notNull().default(0),
    notModified: integer('not_modified').notNull().default(0),
    notFound: integer('not_found').notNull().default(0),
    errors: integer('errors').notNull().default(0),
    avgLatencyMs: doublePrecision('avg_latency_ms'),
    p95LatencyMs: doublePrecision('p95_latency_ms'),
    status: text('status').$type<'running' | 'ok' | 'degraded' | 'failed' | 'waiting'>().notNull(),
    error: text('error'),
  },
  (t) => [index('collector_cycles_time').on(t.roundId, t.startedAt)],
);

const bytea = customType<{ data: Uint8Array; driverData: Uint8Array }>({ dataType: () => 'bytea' });

/**
 * Candidate photos published by the provider, downloaded once by the collector and served by our
 * API (the browser never talks to the TSE). A row with null data means "provider has no photo".
 */
export const candidatePhotos = pgTable(
  'candidate_photos',
  {
    roundId: uuid('round_id')
      .notNull()
      .references(() => electionRounds.id, { onDelete: 'cascade' }),
    candidateKey: text('candidate_key').notNull(),
    contentType: text('content_type'),
    data: bytea('data'),
    fetchedAt: ts('fetched_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.roundId, t.candidateKey] })],
);

/**
 * Unique visitors per day (Brasília date), for the site owner only. The visitor is a random id the
 * browser keeps; no IP or other personal data is stored.
 */
export const siteVisits = pgTable(
  'site_visits',
  {
    day: date('day', { mode: 'string' }).notNull(),
    visitor: text('visitor').notNull(),
  },
  (t) => [primaryKey({ columns: [t.day, t.visitor] })],
);

/** People watching live right now: each API instance writes its open realtime connections here
 * every 30 s; only the owner's stats endpoint reads the sum (never shown on the site). */
export const liveClients = pgTable('live_clients', {
  instance: text('instance').primaryKey(),
  clients: integer('clients').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
