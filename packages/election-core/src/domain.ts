import type { AreaRef } from './areas';
import type { StateCode } from './geo';

/**
 * Provider-independent election model. Nothing here knows about TSE field names.
 * Numbers that the source did not provide are `null`, never `0`.
 */

export type ElectionKind = 'general' | 'municipal';
export type OfficeKind = 'majoritarian' | 'proportional';
export type OfficeScope = 'country' | 'state' | 'city';

export interface Office {
  /** Provider office code, without padding ("1" = Presidente at the TSE). */
  code: string;
  slug: string;
  name: string;
  kind: OfficeKind;
  scope: OfficeScope;
  /**
   * The provider groups offices in separate "elections" (TSE: federal 6257, state 6259...).
   * Files for this office live under this code.
   */
  providerElectionCode: string;
  /** States where this office is disputed. `null` = every state (e.g. president). */
  states: StateCode[] | null;
}

export interface City {
  state: StateCode;
  /** Official TSE municipality code, 5 digits. Primary identifier. */
  code: string;
  ibgeCode: string | null;
  name: string;
  isCapital: boolean;
  zones: string[];
}

export interface ElectionConfig {
  providerRoundId: string;
  /** ISO date (YYYY-MM-DD) of election day. */
  date: string | null;
  round: 1 | 2;
  offices: Office[];
  cities: City[];
  /** The provider election whose progress files (EA14/EA15) drive polling. */
  progressElectionCode: string;
  /** All provider election codes that belong to this round. */
  providerElectionCodes: string[];
}

export type CountingStatus = 'not-started' | 'in-progress' | 'finished';

export interface CountingProgress {
  status: CountingStatus;
  sectionsTotal: number | null;
  sectionsCounted: number | null;
  /** Percent 0–100 of counted sections, as published by the provider when available. */
  sectionsCountedPct: number | null;
  sectionsInstalled: number | null;
  sectionsNotInstalled: number | null;
  electorateTotal: number | null;
  electorateCounted: number | null;
  turnout: number | null;
  turnoutPct: number | null;
  abstention: number | null;
  abstentionPct: number | null;
  /** When the provider last totalized this area (ISO, UTC). */
  totalizedAt: string | null;
}

export interface VoteTotals {
  total: number | null;
  valid: number | null;
  nominal: number | null;
  /** Party-list votes. Only proportional offices have them. */
  legend: number | null;
  blank: number | null;
  /** Null votes (nulos + nulos técnicos). */
  null: number | null;
  annulled: number | null;
  annulledSubJudice: number | null;
}

export interface PartyRef {
  number: string;
  abbreviation: string;
  name: string;
}

export interface RunningMate {
  role: 'vice' | 'first-alternate' | 'second-alternate';
  name: string;
  ballotName: string;
  party: string | null;
}

export interface CandidateResult {
  /** Provider-stable candidate identifier (TSE: sqcand). */
  key: string;
  number: string;
  name: string;
  ballotName: string;
  party: PartyRef;
  /** Coalition or federation composition, e.g. "PT/PCdoB/PV". */
  coalition: string | null;
  runningMates: RunningMate[];
  votes: number;
  /** Percent 0–100 of the votes counted so far. */
  percent: number | null;
  /** True when elected or advanced to the runoff. `null` until the provider says. */
  elected: boolean | null;
  /** Provider status after final totalization ("Eleito", "2º turno", "Suplente"...). */
  status: string | null;
  /** Vote destination ("Válido", "Anulado sub judice"...). */
  voteDestination: string | null;
}

export interface PartyResult extends PartyRef {
  nominalVotes: number | null;
  legendVotes: number | null;
  /** Seats won (proportional offices, only meaningful after final totalization). */
  seats: number | null;
  federation: string | null;
}

export interface AreaResult {
  officeCode: string;
  area: AreaRef;
  progress: CountingProgress;
  votes: VoteTotals;
  candidates: CandidateResult[];
  parties: PartyResult[];
  seats: number | null;
  /** Final totalization happened (judge closed the count). */
  final: boolean;
  /** Provider flagged the race as mathematically decided before 100%. */
  mathematicallyDecided: 'elected' | 'runoff' | null;
  /** The provider may withhold vote counts (TSE `dv = n`). */
  votesPublishable: boolean;
  noElectedReasons: string[];
}

export interface AreaProgressEntry {
  area: AreaRef;
  progress: CountingProgress;
}

export interface CountryProgress {
  progress: CountingProgress;
  states: AreaProgressEntry[];
}

export interface StateProgress {
  state: StateCode;
  progress: CountingProgress;
  cities: AreaProgressEntry[];
}

export interface SectionInfo {
  zone: string;
  number: string;
  /** For aggregated sections, the main section that absorbed its voters. */
  mainSection: string | null;
  aggregated: string[];
  /** When the auxiliary file (ballot box files received) was generated. */
  receivedAt: string | null;
}

export interface CitySections {
  cityCode: string;
  sections: SectionInfo[];
}

/** Where a piece of data came from. Stored with every snapshot. */
export interface Provenance {
  provider: string;
  adapter: string;
  sourceFile: string;
  /** Provider generation id (TSE: idg). */
  sourceId: string | null;
  retrievedAt: string;
  sourceGeneratedAt: string | null;
  etag: string | null;
  checksum: string;
}

export function emptyProgress(): CountingProgress {
  return {
    status: 'not-started',
    sectionsTotal: null,
    sectionsCounted: null,
    sectionsCountedPct: null,
    sectionsInstalled: null,
    sectionsNotInstalled: null,
    electorateTotal: null,
    electorateCounted: null,
    turnout: null,
    turnoutPct: null,
    abstention: null,
    abstentionPct: null,
    totalizedAt: null,
  };
}
