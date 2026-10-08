'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * Polymarket (a prediction market) on Brazil's 2026 presidential election. Read straight from its
 * public API in the reader's browser (it allows any origin), so our servers carry none of it and it
 * can never slow the official count down. Not TSE data and not a forecast of this site.
 */
const GAMMA = 'https://gamma-api.polymarket.com';
export const POLYMARKET_URL = 'https://polymarket.com/event/brazil-presidential-election';
export const eventUrl = (slug: string) => `https://polymarket.com/event/${slug}`;
export const LIVE_MS = 30_000;
export const MARGIN_SLUG = 'brazil-presidential-election-second-round-margin-of-victory';

export interface Outcome {
  name: string;
  /** Last price of "Yes", 0–1: what traders pay for a share that pays 1 if it happens. */
  price: number;
  /** Price of "No". */
  no: number;
  /** Polymarket's id of the "Yes" token (for the price history). */
  token: string;
  volume: number;
}

interface GammaMarket {
  groupItemTitle?: string;
  question?: string;
  outcomePrices?: string;
  clobTokenIds?: string;
  volume?: number | string;
  closed?: boolean;
}
interface GammaEvent {
  slug: string;
  title: string;
  volume?: number | string;
  markets: GammaMarket[];
}

const outcomes = (e: GammaEvent | undefined): Outcome[] =>
  (e?.markets ?? [])
    .filter((m) => !m.closed)
    .map((m) => {
      const prices = JSON.parse(m.outcomePrices ?? '[]') as string[];
      return {
        name: m.groupItemTitle || m.question || '',
        price: Number(prices[0] ?? 0),
        no: Number(prices[1] ?? 0),
        token: (JSON.parse(m.clobTokenIds ?? '[]') as string[])[0] ?? '',
        volume: Number(m.volume ?? 0),
      };
    })
    .filter((o) => o.name && o.price > 0)
    .sort((a, b) => b.price - a.price);

async function event(slug: string): Promise<GammaEvent | undefined> {
  const res = await fetch(`${GAMMA}/events?slug=${slug}`);
  if (!res.ok) throw new Error(`Polymarket ${res.status}`);
  return ((await res.json()) as GammaEvent[])[0];
}

/** Polymarket's state names (slug suffix) → UF. */
const STATE_SLUGS: Record<string, string> = {
  acre: 'AC',
  alagoas: 'AL',
  amapa: 'AP',
  amazonas: 'AM',
  bahia: 'BA',
  ceara: 'CE',
  'federal-district': 'DF',
  'espirito-santo': 'ES',
  goias: 'GO',
  maranhao: 'MA',
  'mato-grosso': 'MT',
  'mato-grosso-do-sul': 'MS',
  'minas-gerais': 'MG',
  para: 'PA',
  paraiba: 'PB',
  parana: 'PR',
  pernambuco: 'PE',
  piaui: 'PI',
  'rio-de-janeiro': 'RJ',
  'rio-grande-do-norte': 'RN',
  'rio-grande-do-sul': 'RS',
  rondonia: 'RO',
  roraima: 'RR',
  'santa-catarina': 'SC',
  'sao-paulo': 'SP',
  sergipe: 'SE',
  tocantins: 'TO',
};

export function usePolymarket() {
  return useQuery({
    queryKey: ['polymarket', 'brazil-2026'],
    // Live, like the count: every 30 s while the page is open (paused in a background tab). It is
    // the reader's browser asking Polymarket, so none of it reaches our API, database or the TSE.
    staleTime: 20_000,
    refetchInterval: LIVE_MS,
    retry: 1,
    queryFn: async () => {
      const prefix = 'brazil-presidential-election-second-round-1st-place-';
      const [winner, margin, search] = await Promise.all([
        event('brazil-presidential-election'),
        event('brazil-presidential-election-second-round-margin-of-victory'),
        fetch(
          `${GAMMA}/public-search?q=${encodeURIComponent('Brazil Presidential Election Second Round 1st Place')}&limit_per_type=50&events_status=active`,
        ).then((r) => (r.ok ? (r.json() as Promise<{ events?: GammaEvent[] }>) : { events: [] })),
      ]);
      const places = (search.events ?? []).filter((e) => e.slug.startsWith(prefix));
      const states = places
        .map((e) => {
          const key = e.slug.slice(prefix.length).replace(/^in-/, '');
          return { uf: key === 'abroad' ? 'ZZ' : STATE_SLUGS[key], slug: e.slug, outcomes: outcomes(e) };
        })
        .filter(
          (s): s is { uf: string; slug: string; outcomes: Outcome[] } => !!s.uf && s.outcomes.length > 0,
        );
      return {
        winner: outcomes(winner),
        volume: Number(winner?.volume ?? 0),
        margin: outcomes(margin),
        states,
        at: new Date().toISOString(),
      };
    },
  });
}

export type Range = '1w' | '1m' | 'max';
const FIDELITY: Record<Range, number> = { '1w': 60, '1m': 360, max: 1440 };

/** Price history of each "Yes" token (0–1 over time), for the chart. */
export function usePriceHistory(tokens: string[], range: Range) {
  return useQuery({
    queryKey: ['polymarket', 'history', tokens, range],
    enabled: tokens.length > 0,
    staleTime: 50_000,
    refetchInterval: 60_000,
    queryFn: () =>
      Promise.all(
        tokens.map(async (token) => {
          const res = await fetch(
            `https://clob.polymarket.com/prices-history?market=${token}&interval=${range}&fidelity=${FIDELITY[range]}`,
          );
          if (!res.ok) throw new Error(`Polymarket ${res.status}`);
          const { history } = (await res.json()) as { history: { t: number; p: number }[] };
          return { token, points: history };
        }),
      ),
  });
}
