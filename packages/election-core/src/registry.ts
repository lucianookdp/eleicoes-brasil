import type { ElectionKind } from './domain';

/**
 * Election rounds this installation knows about. Adding an election = adding an entry here
 * (plus, if the provider changed its file format, a new adapter). No code elsewhere changes.
 * See docs/adding-new-election.md.
 */
export interface ProviderSource {
  /** Host + path prefix, without the environment segment. */
  baseUrl: string;
  /** TSE "ambiente" path segment: "oficial", "simulado2026", ... */
  environment: string;
  /** TSE "pleito" code. Optional: when absent the adapter picks the pleito by round and date. */
  providerRoundId?: string;
}

export interface RoundDefinition {
  /** Round id used in URLs and the API: "<election>-<round>". */
  slug: string;
  electionSlug: string;
  electionName: string;
  year: number;
  kind: ElectionKind;
  round: 1 | 2;
  /** ISO date of election day. */
  date: string;
  /** Adapter id registered in @eleicoes/tse-client. */
  adapter: string;
  /** Demo rounds use fictitious data and are always labelled as such in the UI. */
  demo: boolean;
  sources: Partial<Record<'PRODUCTION' | 'SIMULATION' | 'DEVELOPMENT', ProviderSource>>;
}

export const ELECTION_REGISTRY: RoundDefinition[] = [
  {
    slug: 'demo-1',
    electionSlug: 'demo',
    electionName: 'Eleição demonstrativa (dados fictícios)',
    year: 2026,
    kind: 'general',
    round: 1,
    date: '2026-10-04',
    adapter: 'tse-2026',
    demo: true,
    sources: {
      DEVELOPMENT: { baseUrl: 'http://localhost:4010', environment: 'demo', providerRoundId: '900001' },
    },
  },
  {
    // Same fictitious server started with DEMO_ROUND=2: a runoff, for testing round-2 screens.
    slug: 'demo-2',
    electionSlug: 'demo',
    electionName: 'Eleição demonstrativa (dados fictícios)',
    year: 2026,
    kind: 'general',
    round: 2,
    date: '2026-10-25',
    adapter: 'tse-2026',
    demo: true,
    sources: {
      DEVELOPMENT: { baseUrl: 'http://localhost:4010', environment: 'demo', providerRoundId: '900001' },
    },
  },
  {
    slug: '2026-1',
    electionSlug: '2026',
    electionName: 'Eleições Gerais 2026',
    year: 2026,
    kind: 'general',
    round: 1,
    date: '2026-10-04',
    adapter: 'tse-2026',
    demo: false,
    sources: {
      PRODUCTION: {
        baseUrl: 'https://resultados.tse.jus.br',
        environment: 'oficial',
        providerRoundId: '3220',
      },
      SIMULATION: {
        baseUrl: 'https://resultados-sim.tse.jus.br/simulado',
        environment: 'simulado2026',
        providerRoundId: '17801',
      },
    },
  },
  {
    slug: '2026-2',
    electionSlug: '2026',
    electionName: 'Eleições Gerais 2026',
    year: 2026,
    kind: 'general',
    round: 2,
    date: '2026-10-25',
    adapter: 'tse-2026',
    demo: false,
    sources: {
      // Pleito code for the runoff is published in ele-c.json closer to the date.
      PRODUCTION: { baseUrl: 'https://resultados.tse.jus.br', environment: 'oficial' },
    },
  },
];

export function findRound(slug: string): RoundDefinition | undefined {
  return ELECTION_REGISTRY.find((r) => r.slug === slug);
}
