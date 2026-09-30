import type { AreaRef } from './areas';
import type {
  AreaResult,
  CitySections,
  CountryProgress,
  ElectionConfig,
  Office,
  Provenance,
  StateProgress,
} from './domain';
import type { StateCode } from './geo';

/** Result of a conditional fetch: either new data or "unchanged since last time" (HTTP 304). */
export type Fetched<T> = { changed: true; data: T; provenance: Provenance } | { changed: false };

export interface ResultQuery {
  office: Office;
  area: AreaRef;
  /** Background work (municipal files) yields to headline requests (Brazil, states). */
  background?: boolean;
}

/**
 * The only contract the collector depends on. One implementation per provider data format
 * (TSEAdapter2026, later TSEAdapter2030). Implementations must:
 * - validate every external payload at runtime and throw `ProviderPayloadError` on mismatch;
 * - never leak raw field names into the returned objects;
 * - use conditional requests so unchanged resources return `{ changed: false }`.
 */
export interface ElectionProvider {
  /** e.g. "tse-2026" */
  readonly id: string;
  /** Adapter version, e.g. "2026-v1". Recorded in every snapshot. */
  readonly version: string;
  getElectionConfig(): Promise<ElectionConfig>;
  getCountryProgress(electionCode: string): Promise<Fetched<CountryProgress>>;
  getStateProgress(
    electionCode: string,
    state: StateCode,
    options?: { background?: boolean },
  ): Promise<Fetched<StateProgress>>;
  getResult(query: ResultQuery): Promise<Fetched<AreaResult>>;
  getSections(state: StateCode): Promise<Fetched<CitySections[]>>;
  /** Forget conditional-request state so the next calls download everything again. */
  resetConditionalCache(): void;
  /** Candidate photo published by the provider, if any. Fetched by the collector only, once. */
  getCandidatePhoto?(
    office: Office,
    state: StateCode | null,
    candidateKey: string,
  ): Promise<CandidatePhoto | null>;
}

export interface CandidatePhoto {
  data: Uint8Array;
  contentType: string;
}

/** An external payload did not match the expected schema. Carries context for the ingestion log. */
export class ProviderPayloadError extends Error {
  constructor(
    message: string,
    readonly sourceFile: string,
    readonly issues: unknown,
  ) {
    super(message);
    this.name = 'ProviderPayloadError';
  }
}

/** The source is temporarily unavailable (network, 5xx, circuit open). Safe to retry later. */
export class ProviderUnavailableError extends Error {
  constructor(
    message: string,
    readonly sourceFile: string,
    readonly status: number | null = null,
  ) {
    super(message);
    this.name = 'ProviderUnavailableError';
  }
}

/** The resource does not exist (yet). The TSE returns 404 for files not generated yet. */
export class ProviderNotFoundError extends Error {
  constructor(readonly sourceFile: string) {
    super(`Not found: ${sourceFile}`);
    this.name = 'ProviderNotFoundError';
  }
}
