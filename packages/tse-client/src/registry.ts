import type { ElectionProvider, ProviderSource, RoundDefinition } from '@eleicoes/election-core';
import { TSEAdapter2026 } from './adapter-2026';
import type { TseHttpClient } from './http';

type AdapterFactory = (
  http: TseHttpClient,
  source: ProviderSource,
  round: RoundDefinition,
) => ElectionProvider;

/**
 * Adapter id (as referenced by ELECTION_REGISTRY) → implementation.
 * 2030: add `'tse-2030': (h, s, r) => new TSEAdapter2030(h, s, r)`.
 */
export const ADAPTERS: Record<string, AdapterFactory> = {
  'tse-2026': (http, source, round) => new TSEAdapter2026(http, source, round),
};

export const ADAPTER_VERSIONS = [{ id: 'tse-2026', version: '2026-v1' }];

export function createProvider(
  http: TseHttpClient,
  round: RoundDefinition,
  source: ProviderSource,
): ElectionProvider {
  const factory = ADAPTERS[round.adapter];
  if (!factory) throw new Error(`No adapter registered for "${round.adapter}"`);
  return factory(http, source, round);
}
