import type { ElectionSummary, RoundSummary } from '@eleicoes/election-core';

/**
 * The site is exported as static files (GitHub Pages), so every page is a fixed route and the
 * election, state and city travel as query parameters:
 *   /eleicao/?e=2026&t=1                       overview
 *   /eleicao/estado/?e=2026&t=1&uf=sp          state
 *   /eleicao/municipio/?e=2026&t=1&uf=sp&c=71072
 * Components describe places with election-relative paths ("/states/sp") and `electionHref`
 * turns them into URLs, so the mapping lives only here.
 */
export const roundSlug = (electionSlug: string, turno: number) => `${electionSlug}-${turno}`;

export function pickRound(
  elections: ElectionSummary[],
  electionSlug: string,
  turno?: string | null,
  now = new Date(),
): RoundSummary | null {
  const election = elections.find((e) => e.slug === electionSlug);
  if (!election) return null;
  if (turno) return election.rounds.find((r) => String(r.round) === turno) ?? null;
  // Latest round that already started or whose day has come (on runoff day the site opens on the
  // runoff from midnight, not only once the count starts); otherwise the first one.
  const today = todayInBrasilia(now);
  const started = election.rounds.filter((r) => r.status !== 'scheduled' || r.date <= today);
  return started.at(-1) ?? election.rounds[0] ?? null;
}

/** "2026-10-25": the calendar day in Brasília, where election days are counted. */
export function todayInBrasilia(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(now);
}

/** Election opened at "/": a live round, else the newest real election with data, else the demo. */
export function defaultElection(elections: ElectionSummary[]): ElectionSummary | null {
  const real = elections.filter((e) => !e.demo && !e.slug.startsWith('replay-'));
  return (
    real.find((e) => e.rounds.some((r) => r.status === 'live')) ??
    real.find((e) => e.rounds.some((r) => r.status !== 'scheduled')) ??
    elections.find((e) => e.demo && e.rounds.some((r) => r.status !== 'scheduled')) ??
    real[0] ??
    elections[0] ??
    null
  );
}

const SECTIONS: Record<string, string> = {
  '': '/eleicao/',
  '/states': '/eleicao/estados/',
  '/operations': '/eleicao/bastidores/',
  '/historico': '/eleicao/historico/',
  '/compare': '/eleicao/comparar/',
  '/offices': '/eleicao/cargos/',
  '/benches': '/eleicao/bancadas/',
  '/tv': '/eleicao/telao/',
  '/favorites': '/eleicao/favoritos/',
};

/** "/states/sp/cities/71072" (+ round) → "/eleicao/municipio/?e=2026&t=1&uf=sp&c=71072". */
export function electionHref(
  round: Pick<RoundSummary, 'electionSlug' | 'round'>,
  path = '',
  extra?: Record<string, string>,
) {
  const params = new URLSearchParams({ e: round.electionSlug, t: String(round.round) });
  let route = SECTIONS[path];
  if (!route) {
    const m = /^\/states\/([a-z]{2})(?:\/cities\/(\d{5}))?$/.exec(path);
    if (m) {
      params.set('uf', m[1]!);
      if (m[2]) params.set('c', m[2]);
      route = m[2] ? '/eleicao/municipio/' : '/eleicao/estado/';
    } else route = '/eleicao/';
  }
  for (const [k, v] of Object.entries(extra ?? {})) params.set(k, v);
  return `${route}?${params}`;
}

/** Section routes, for highlighting the current tab. */
export const SECTION_ROUTES = SECTIONS;
