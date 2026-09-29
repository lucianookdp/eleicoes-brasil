import type {
  CandidateResult,
  CountingProgress,
  ElectionKind,
  OfficeKind,
  OfficeScope,
  PartyResult,
  VoteTotals,
} from './domain';

/**
 * Shapes returned by the HTTP API and consumed by the web app. Every list endpoint is
 * paginated or bounded; nothing here ships full history to the browser.
 */

export interface ApiError {
  error: { code: string; message: string };
}

export interface ApiMeta {
  app: { name: string; version: string };
  adapters: { id: string; version: string }[];
  features: { sectionsView: boolean; replay: boolean; advancedOperations: boolean; comparison: boolean };
  timezone: string;
  source: string;
}

export type RoundStatus = 'scheduled' | 'live' | 'final';

export interface RoundSummary {
  slug: string;
  electionSlug: string;
  electionName: string;
  year: number;
  kind: ElectionKind;
  round: number;
  date: string;
  status: RoundStatus;
  environment: string | null;
  demo: boolean;
  adapter: string | null;
}

export interface ElectionSummary {
  slug: string;
  name: string;
  year: number;
  kind: ElectionKind;
  demo: boolean;
  rounds: RoundSummary[];
}

export interface OfficeInfo {
  code: string;
  slug: string;
  name: string;
  kind: OfficeKind;
  scope: OfficeScope;
  states: string[] | null;
}

export interface RoundDetail extends RoundSummary {
  offices: OfficeInfo[];
}

export type IngestionState = 'healthy' | 'degraded' | 'offline' | 'idle';

export interface IngestionStatus {
  state: IngestionState;
  mode: string | null;
  lastCycleAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
}

export interface ProgressDTO extends CountingProgress {
  areaKey: string;
  countedPct: number | null;
  /** When our collector recorded this state (ISO). */
  updatedAt: string;
}

export interface CandidateDTO extends CandidateResult {
  color: string;
  /** Change since the previous snapshot of the same area and office. */
  deltaVotes: number | null;
  deltaPp: number | null;
}

export interface ProvenanceDTO {
  provider: string;
  adapter: string;
  sourceFile: string;
  retrievedAt: string;
  sourceGeneratedAt: string | null;
}

export interface ResultDTO {
  office: OfficeInfo;
  areaKey: string;
  areaName: string;
  progress: ProgressDTO;
  votes: VoteTotals;
  candidates: CandidateDTO[];
  parties: PartyResult[];
  seats: number | null;
  final: boolean;
  mathematicallyDecided: 'elected' | 'runoff' | null;
  votesPublishable: boolean;
  updatedAt: string;
  provenance: ProvenanceDTO | null;
}

export interface LeaderDTO {
  name: string;
  party: string;
  color: string;
  percent: number | null;
}

export interface StateRowDTO {
  uf: string;
  name: string;
  region: string;
  progress: ProgressDTO | null;
  /** Sections counted in the last 5 minutes (from activity events). */
  sectionsLast5m: number;
  updatesLast5m: number;
  /** Leader of the headline office in this state, when the state has results. */
  leader: LeaderDTO | null;
}

export interface OverviewDTO {
  round: RoundDetail;
  progress: ProgressDTO | null;
  ingestion: IngestionStatus;
  headline: ResultDTO | null;
  states: StateRowDTO[];
}

export interface StateDetailDTO {
  round: RoundDetail;
  uf: string;
  name: string;
  progress: ProgressDTO | null;
  offices: OfficeInfo[];
  ingestion: IngestionStatus;
  cityCount: number;
}

export interface CityRowDTO {
  code: string;
  name: string;
  isCapital: boolean;
  progress: ProgressDTO | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CityDetailDTO {
  round: RoundDetail;
  uf: string;
  stateName: string;
  city: { code: string; name: string; isCapital: boolean; ibgeCode: string | null; zones: string[] };
  progress: ProgressDTO | null;
  results: ResultDTO[];
}

export interface ActivityEventDTO {
  id: string;
  type: string;
  occurredAt: string;
  areaKey: string | null;
  areaName: string | null;
  state: string | null;
  sectionsAdded: number | null;
  votesAdded: number | null;
  countedPct: number | null;
  message: string | null;
}

export interface CycleDTO {
  id: string;
  startedAt: string;
  durationMs: number | null;
  requests: number;
  ok: number;
  notModified: number;
  errors: number;
  p95LatencyMs: number | null;
  status: string;
}

export interface OperationsDTO {
  ingestion: IngestionStatus;
  processing: {
    sectionsPerMinute: number;
    votesPerMinute: number;
    statesPerMinute: number;
    citiesPerMinute: number;
  };
  requests: {
    windowMinutes: number;
    total: number;
    ok: number;
    notModified: number;
    errors: number;
    avgLatencyMs: number | null;
    p95LatencyMs: number | null;
  };
  freshness: { areaKey: string; name: string; updatedAt: string | null; totalizedAt: string | null }[];
  heat: { uf: string; sections: number; votes: number; updates: number }[];
  cycles: CycleDTO[];
  events: ActivityEventDTO[];
}

export interface TimelineDTO {
  start: string | null;
  end: string | null;
  /** Country progress over time, one point per snapshot (bounded). */
  points: { at: string; countedPct: number | null }[];
}

export interface TimelineAtDTO {
  at: string;
  progress: ProgressDTO | null;
  headline: ResultDTO | null;
  states: { uf: string; countedPct: number | null; leader: LeaderDTO | null }[];
}

export interface SeriesDTO {
  office: OfficeInfo;
  areaKey: string;
  candidates: { key: string; name: string; party: string; color: string }[];
  points: { at: string; countedPct: number | null; values: Record<string, number | null> }[];
}

export interface SearchHitDTO {
  kind: 'state' | 'city' | 'candidate' | 'party' | 'office';
  label: string;
  detail: string;
  href: string;
}

export interface CompareDTO {
  office: OfficeInfo | null;
  states: {
    uf: string;
    name: string;
    progress: ProgressDTO | null;
    votes: VoteTotals | null;
    candidates: { key: string; name: string; color: string; percent: number | null }[];
  }[];
}

export const REALTIME_EVENT_TYPES = [
  'country.updated',
  'state.updated',
  'city.updated',
  'result.updated',
  'counting.updated',
  'ingestion.status',
] as const;
export type RealtimeEventType = (typeof REALTIME_EVENT_TYPES)[number];

/** Payload pushed through Postgres NOTIFY and then SSE. Must stay small (< 8 KB). */
export interface RealtimeEvent {
  type: RealtimeEventType;
  timestamp: string;
  electionId: string;
  state?: string;
  areaKey?: string;
  officeCode?: string;
  changes?: {
    sectionsAdded?: number | null;
    votesAdded?: number | null;
    countedPct?: number | null;
    status?: string;
  };
}
