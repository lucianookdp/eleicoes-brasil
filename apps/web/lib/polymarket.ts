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
export const LIVE_MS = 15_000;

/** The same party colours as everywhere on the site (PL blue, PT red); neutral for anyone else. */
export function colorOf(name: string, i: number) {
  if (/bolsonaro/i.test(name)) return '#2F6BFF';
  if (/lula/i.test(name)) return '#E5383B';
  return ['#8a909a', '#f2b33d', '#2fbf71'][i % 3]!;
}

/** Short enough for a one-line summary: "Luiz Inácio Lula da Silva" is "Lula". */
export const shortName = (name: string) => (/\blula\b/i.test(name) ? 'Lula' : name);
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
  /** Polymarket's picture for this outcome (the candidate's photo), when it has one. */
  image: string | null;
}

interface GammaMarket {
  groupItemTitle?: string;
  question?: string;
  outcomePrices?: string;
  clobTokenIds?: string;
  volume?: number | string;
  closed?: boolean;
  icon?: string;
}
interface GammaEvent {
  slug: string;
  title: string;
  volume?: number | string;
  markets: GammaMarket[];
}

/** Polymarket sends some lists as JSON inside a string; a malformed one is just empty. */
function list(raw: string | undefined): string[] {
  try {
    const v = JSON.parse(raw ?? '[]');
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

/** A price between 0 and 1, or null: never NaN on screen. */
const price = (v: string | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : null;
};

const outcomes = (e: GammaEvent | undefined): Outcome[] =>
  (e?.markets ?? [])
    .filter((m) => !m.closed)
    .map((m) => {
      const [yes, no] = list(m.outcomePrices);
      const p = price(yes);
      return {
        name: m.groupItemTitle || m.question || '',
        price: p ?? 0,
        no: price(no) ?? (p == null ? 0 : 1 - p),
        token: list(m.clobTokenIds)[0] ?? '',
        volume: Number.isFinite(Number(m.volume)) ? Number(m.volume) : 0,
        image: m.icon?.startsWith('https://polymarket-upload.s3.us-east-2.amazonaws.com/') ? m.icon : null,
      };
    })
    .filter((o) => o.name && o.price > 0)
    .sort((a, b) => b.price - a.price);

/** GET with a time limit: a slow Polymarket must never leave the page waiting forever. */
/** Polymarket answered with an error (its HTTP status kept: 503 is maintenance). */
export class PolymarketError extends Error {
  constructor(readonly status: number) {
    super(`Polymarket respondeu ${status}`);
  }
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new PolymarketError(res.status);
  return (await res.json()) as T;
}

/**
 * Why Polymarket is not showing, in words for anyone: the reader offline, Polymarket under
 * maintenance (503), busy (429), or simply not answering (down, timeout, blocked).
 */
export function polymarketProblem(error: unknown): { title: string; text: string } {
  if (typeof navigator !== 'undefined' && !navigator.onLine)
    return { title: 'Sem internet', text: 'Sua conexão caiu. O Polymarket volta quando ela voltar.' };
  const status = error instanceof PolymarketError ? error.status : null;
  if (status === 503)
    return { title: 'Polymarket em manutenção', text: 'O site do Polymarket está em manutenção agora.' };
  if (status === 429)
    return {
      title: 'Polymarket sobrecarregado',
      text: 'O Polymarket está recusando consultas por excesso de acesso.',
    };
  return { title: 'Polymarket fora do ar', text: 'O site do Polymarket não está respondendo agora.' };
}

async function event(slug: string): Promise<GammaEvent | undefined> {
  const events = await getJson<GammaEvent[]>(`${GAMMA}/events?slug=${slug}`);
  return Array.isArray(events) ? events[0] : undefined;
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
    // Live, like the count: every 15 s while the page is open (paused in a background tab). It is
    // the reader's browser asking Polymarket, so none of it reaches our API, database or the TSE.
    staleTime: 10_000,
    refetchInterval: LIVE_MS,
    retry: 2,
    queryFn: async () => {
      const prefix = 'brazil-presidential-election-second-round-1st-place-';
      // The main market is required; the margin and the states are extras: if one of them fails,
      // the rest still shows (and `partial` says so).
      const [winnerRes, marginRes, searchRes] = await Promise.allSettled([
        event('brazil-presidential-election'),
        event(MARGIN_SLUG),
        getJson<{ events?: GammaEvent[] }>(
          `${GAMMA}/public-search?q=${encodeURIComponent('Brazil Presidential Election Second Round 1st Place')}&limit_per_type=50&events_status=active`,
        ),
      ]);
      if (winnerRes.status === 'rejected') throw winnerRes.reason;
      const winner = winnerRes.value;
      const margin = marginRes.status === 'fulfilled' ? marginRes.value : undefined;
      const search = searchRes.status === 'fulfilled' ? searchRes.value : { events: [] };
      const places = (search.events ?? []).filter(
        (e) => typeof e.slug === 'string' && e.slug.startsWith(prefix),
      );
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
        /** The main market exists but has no open outcome left (resolved after the election). */
        closed: !!winner && outcomes(winner).length === 0,
        volume: Number.isFinite(Number(winner?.volume)) ? Number(winner?.volume) : 0,
        margin: outcomes(margin),
        states,
        partial: marginRes.status === 'rejected' || searchRes.status === 'rejected',
        at: new Date().toISOString(),
      };
    },
  });
}

/** The same periods as Polymarket's own chart. */
export type Range = '1h' | '6h' | '1d' | '1w' | '1m' | 'max';
/** Minutes between points: fine for the short periods, daily for the whole history. */
const FIDELITY: Record<Range, number> = { '1h': 1, '6h': 5, '1d': 15, '1w': 60, '1m': 360, max: 1440 };

/** Price history of each "Yes" token (0–1 over time), for the chart. */
export function usePriceHistory(tokens: string[], range: Range) {
  return useQuery({
    queryKey: ['polymarket', 'history', tokens, range],
    enabled: tokens.length > 0,
    staleTime: 50_000,
    refetchInterval: 60_000,
    retry: 2,
    // One line failing does not hide the others; only when all fail is the chart unavailable.
    queryFn: async () => {
      const results = await Promise.allSettled(
        tokens.map(async (token) => {
          const { history } = await getJson<{ history?: { t: number; p: number }[] }>(
            `https://clob.polymarket.com/prices-history?market=${token}&interval=${range}&fidelity=${FIDELITY[range]}`,
          );
          const points = (Array.isArray(history) ? history : []).filter(
            (pt) => Number.isFinite(pt?.t) && Number.isFinite(pt?.p),
          );
          return { token, points };
        }),
      );
      const ok = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
      if (ok.length === 0 && results.length > 0) throw (results[0] as PromiseRejectedResult).reason;
      return ok;
    },
  });
}
