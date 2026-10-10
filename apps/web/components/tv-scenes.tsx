'use client';

import { hasValidVotes, type OverviewDTO, type ResultDTO, type StateRowDTO } from '@eleicoes/election-core';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { displayName, fmtCompact, fmtPct } from '@/lib/format';
import { usePolymarket } from '@/lib/polymarket';
import { useEvents, useOfficeStates, useOverview } from '@/lib/queries';
import { ActivityFeed } from './activity';
import { BrazilMap } from './brazil-map';
import { StatusPill } from './results';
import { useRound } from './shell';
import { StateFlag } from './ui';

/** Seconds each scene stays on screen. */
export const SCENE_SECONDS = 12;

/** One page on screen. A long list (governors, senators) is split into pages that each fit,
 * shown one after another, so the panel never grows taller than the map. */
type Scene = {
  id: string;
  group: SceneId | 'mapa';
  title: string;
  page: number;
  pages: number;
  body: ReactNode;
};

/** States per page: governors in two columns, senators (two per state) a little fewer. */
const PER_PAGE = { 1: 14, 2: 10 } as const;
/** The same on a phone's full-screen panel, where the scenes get half the height. */
const PER_PAGE_COMPACT = { 1: 7, 2: 4 } as const;
const pagesOf = <T,>(list: T[], size: number) =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, (i + 1) * size));

/**
 * Every scene the reader can pick, in this order, and the rounds it belongs to: the 1st round has
 * senators; the runoff shows where the most voted changed since the 1st round. Polymarket is not
 * the count: off unless picked.
 */
export const CATALOG = [
  { id: 'placar', title: 'Estados', rounds: [1, 2] },
  { id: 'virada', title: 'Mudou desde o 1º turno', rounds: [2] },
  { id: 'apuracao', title: 'Apuração por estado', rounds: [1, 2] },
  { id: 'falta', title: 'Falta apurar', rounds: [1, 2] },
  { id: 'governadores', title: 'Governadores', rounds: [1, 2] },
  { id: 'senadores', title: 'Senadores', rounds: [1] },
  { id: 'comparecimento', title: 'Comparecimento', rounds: [1, 2] },
  { id: 'atualizacoes', title: 'Últimas atualizações', rounds: [1, 2] },
  { id: 'polymarket', title: 'Polymarket', rounds: [1, 2], hint: 'apostas, não é resultado oficial' },
] as const;
export type SceneId = (typeof CATALOG)[number]['id'];
const PICK_KEY = 'eleicoes:telao-cenas';

/** The scenes of this round. */
export const catalogFor = (round: number) =>
  CATALOG.filter((c) => (c.rounds as readonly number[]).includes(round));

/** The reader's pick for each round, kept in this browser only (a TV set up once stays as it was). */
export function useSceneChoice(round: number) {
  const all = catalogFor(round).map((c) => c.id as SceneId);
  const defaults = all.filter((id) => id !== 'polymarket');
  const key = `${PICK_KEY}:${round}`;
  const [chosen, setChosen] = useState<SceneId[]>(defaults);
  // biome-ignore lint/correctness/useExhaustiveDependencies: read once per round
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? 'null') as string[] | null;
      const valid = saved?.filter((id): id is SceneId => (all as string[]).includes(id));
      setChosen(valid && valid.length > 0 ? valid : defaults);
    } catch {}
  }, [key]);
  const toggle = (id: SceneId) =>
    setChosen((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : all.filter((x) => x === id || prev.includes(x));
      // Never none: the last one stays.
      if (next.length === 0) return prev;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
      return next;
    });
  return { chosen, toggle };
}

/**
 * The right half of the big screen goes through the scenes the reader picked, by itself, for a TV
 * nobody touches (the headline race on the left never moves). Scenes without data right now are
 * skipped. A click on a title jumps to it; the button pauses. The scenes are picked before
 * starting, above the screen (TvSetup).
 */
export function TvScenes({
  data,
  states,
  chosen,
  fill = false,
  compact = false,
  withMap = false,
  grow = 1,
  className = '',
}: {
  data: OverviewDTO;
  states: StateRowDTO[];
  chosen: SceneId[];
  /** Full screen (TV or phone panel): the scenes take exactly the height left, with no scrolling. */
  fill?: boolean;
  /** The phone's panel: long lists come in smaller pages. */
  compact?: boolean;
  /** No room for the map of Brazil beside the race: it becomes the first scene. */
  withMap?: boolean;
  /** How far a scene may be enlarged to use the height of a big screen (1: never). */
  grow?: number;
  className?: string;
}) {
  const { round } = useRound();
  const governor = data.round.offices.find((o) => o.slug === 'governador');
  const senator = data.round.offices.find((o) => o.slug === 'senador');
  const governors = useOfficeStates(round.slug, governor?.slug).data;
  const senators = useOfficeStates(round.slug, senator?.slug).data;
  const events = useEvents(round.slug, 12).data;
  // Runoff: the 1st round's most voted in each state, to show where it changed.
  // (In the 1st round this is the same query as the page's own: nothing more is asked.)
  const first = useOverview(round.round === 2 ? `${round.electionSlug}-1` : round.slug).data;
  const firstStates = first?.states;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const left = states
    .filter((s) => s.progress && s.progress.status !== 'not-started' && (s.progress.countedPct ?? 0) < 100)
    .map((s) => ({
      s,
      voters: (s.progress?.electorateTotal ?? 0) * (1 - (s.progress?.countedPct ?? 0) / 100),
    }))
    .sort((a, b) => b.voters - a.voters)
    .slice(0, compact ? 5 : 6);
  const office = (title: string, results: ResultDTO[] | undefined) => {
    if (!results || results.length === 0) return [];
    const seats = Math.max(...results.map((r) => r.seats ?? 1)) > 1 ? 2 : 1;
    return pagesOf(results, (compact ? PER_PAGE_COMPACT : PER_PAGE)[seats]).map((page) => (
      <OfficeScene key={page[0]!.areaKey} title={title} results={page} />
    ));
  };
  // The pages of each scene; none: nothing to show right now (no one left to count, no senate race).
  const bodies: Record<SceneId, ReactNode[]> = {
    // The most voted only: how far the count went in each state has its own scene.
    apuracao: states.some((s) => s.progress) ? [<CountByState key="apuracao" states={states} />] : [],
    virada:
      round.round === 2 && states.some((s) => s.leader) && firstStates
        ? [<Changed key="virada" states={states} before={firstStates} />]
        : [],
    placar: states.some((s) => s.leader) ? [<Scoreboard key="placar" states={states} />] : [],
    falta: left.length > 0 ? [<Remaining key="falta" rows={left} />] : [],
    governadores: office(round.round === 2 ? 'Governadores no 2º turno' : 'Governadores', governors?.results),
    senadores: office('Senadores', senators?.results),
    comparecimento:
      data.progress?.turnoutPct != null && data.headline ? [<Turnout key="comp" data={data} />] : [],
    polymarket: [],
    atualizacoes:
      events && events.length > 0
        ? [
            <div key="atualizacoes">
              <p className={kicker}>Últimas atualizações</p>
              <ActivityFeed events={events} max={compact ? 6 : 10} />
            </div>,
          ]
        : [],
  };
  // Only asked from Polymarket when picked (it is the reader's browser that asks, never our API).
  bodies.polymarket = chosen.includes('polymarket') ? [<PolymarketScene key="polymarket" />] : [];
  const picked = catalogFor(round.round).filter((c) => chosen.includes(c.id) && bodies[c.id].length > 0);
  // The map of Brazil sits fixed beside the race on wide screens (TvView); where there is no room
  // for it there (phones, narrower or upright screens), it is the first scene.
  const map: Scene = {
    id: 'mapa-0',
    group: 'mapa',
    title: 'Mapa',
    page: 0,
    pages: 1,
    body: <BrazilMap key={round.slug} states={states} only="leader" fit />,
  };
  // Whatever was picked, the map is always there to fall back on.
  const picks: Scene[] = picked.flatMap((c) =>
    bodies[c.id].map((body, page) => ({
      id: `${c.id}-${page}`,
      group: c.id,
      title: c.title,
      page,
      pages: bodies[c.id].length,
      body,
    })),
  );
  // With nothing to show among the picks (none with data yet), the first scene that has some.
  const fallback = catalogFor(round.round).find((c) => bodies[c.id].length > 0);
  const listed =
    picks.length > 0 || !fallback
      ? picks
      : [
          {
            id: `${fallback.id}-0`,
            group: fallback.id,
            title: fallback.title,
            page: 0,
            pages: 1,
            body: bodies[fallback.id][0],
          },
        ];
  const scenes: Scene[] = withMap ? [map, ...listed] : listed;
  const groups = [...new Set(scenes.map((s) => s.group))];

  const current = scenes.length > 0 ? index % scenes.length : 0;
  const now = scenes[current];
  // biome-ignore lint/correctness/useExhaustiveDependencies: a click on a title restarts the countdown too
  useEffect(() => {
    if (paused || scenes.length < 2) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % scenes.length), SCENE_SECONDS * 1000);
    return () => clearTimeout(t);
  }, [paused, scenes.length, current]);

  // Nothing to show yet (no pick has data): the race beside it carries the screen.
  if (!now) return null;

  return (
    <section
      aria-label="Painel que muda sozinho"
      className={`@container min-w-0 rounded-2xl border border-line bg-surface p-3 ${fill ? 'flex min-h-0 flex-1 flex-col' : ''} ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="scroll-x flex min-w-0 flex-1 gap-1" role="group" aria-label="Cenas">
          {groups.map((g) => {
            const s = scenes.find((x) => x.group === g)!;
            const on = now.group === g;
            return (
              <button
                key={g}
                type="button"
                aria-pressed={on}
                onClick={() => setIndex(scenes.findIndex((x) => x.group === g))}
                className="relative shrink-0 overflow-hidden rounded-full border border-line px-3 py-1 text-[clamp(12px,2.6cqi,18px)] text-muted aria-pressed:border-line-strong aria-pressed:text-ink"
              >
                {s.title}
                {on && now.pages > 1 && (
                  <span className="numeral ml-1 text-muted">
                    {now.page + 1}/{now.pages}
                  </span>
                )}
                {on && scenes.length > 1 && (
                  // How long until the next scene: restarts with each scene, stops with the pause.
                  <span
                    key={`${now.id}-${index}`}
                    aria-hidden
                    className="absolute bottom-0 left-0 h-[2px] bg-live"
                    style={{
                      animation: `tv-progress ${SCENE_SECONDS}s linear forwards`,
                      animationPlayState: paused ? 'paused' : 'running',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
        {scenes.length > 1 && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Continuar a troca automática' : 'Pausar a troca automática'}
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line text-ink-2 hover:border-line-strong"
          >
            <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" aria-hidden>
              {paused ? <path d="M8 5v14l11-7z" /> : <path d="M7 5h4v14H7zM13 5h4v14h-4z" />}
            </svg>
          </button>
        )}
      </div>
      {/* Every scene in the same cell: the panel keeps the height of the tallest one, so the race
          beside it never jumps when the scene changes. Only the current one is visible. */}
      <div className={fill ? 'relative mt-2 min-h-0 flex-1' : 'mt-3 grid grid-cols-1'}>
        {scenes.map((s, i) => (
          <div
            key={s.id}
            aria-hidden={i !== current}
            inert={i !== current}
            className={`${fill ? 'absolute inset-0 overflow-hidden' : '[grid-area:1/1]'} transition-opacity duration-500 ${i === current ? 'opacity-100' : 'invisible opacity-0'}`}
          >
            {/* The map scales itself; anything else is shrunk to fit a short screen, or enlarged to
                use a tall one. */}
            {fill && s.group !== 'mapa' ? <Fit grow={grow}>{s.body}</Fit> : s.body}
          </div>
        ))}
      </div>
    </section>
  );
}

const kicker = 'text-[clamp(12px,2.6cqi,18px)] text-muted';

/** How many states each candidate leads, and every state in its leader's colour. */
function Scoreboard({ states }: { states: StateRowDTO[] }) {
  const tally = new Map<string, { name: string; color: string; count: number }>();
  for (const s of states) {
    if (!s.leader) continue;
    const t = tally.get(s.leader.number) ?? { name: s.leader.name, color: s.leader.color, count: 0 };
    t.count++;
    tally.set(s.leader.number, t);
  }
  const ranked = [...tally.values()].sort((a, b) => b.count - a.count);
  return (
    <div>
      <p className={kicker}>Mais votado em cada estado</p>
      <ul className="mt-2 grid gap-2">
        {ranked.map((t) => (
          <li key={t.name} className="flex items-baseline justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-[clamp(15px,4cqi,28px)] font-semibold">
              <span
                className="size-[0.55em] shrink-0 rounded-full"
                style={{ background: t.color }}
                aria-hidden
              />
              <span className="truncate">{displayName(t.name)}</span>
            </span>
            <span className="numeral shrink-0 text-[clamp(18px,5.5cqi,40px)] font-bold">
              {t.count}{' '}
              <span className="text-[0.5em] font-medium text-muted">
                {t.count === 1 ? 'estado' : 'estados'}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <ul className="mt-3 grid grid-cols-6 gap-1.5 @md:grid-cols-9">
        {states.map((s) => (
          <li
            key={s.uf}
            className={`rounded-md px-1 py-1 text-center ${s.leader ? 'text-white' : 'text-muted'}`}
            style={{ background: s.leader?.color ?? 'var(--surface-2)' }}
          >
            <span className="block text-[clamp(11px,2.4cqi,17px)] font-semibold">{s.uf}</span>
            <span className="numeral block text-[clamp(9px,1.9cqi,13px)] opacity-90">
              {s.leader ? fmtPct(s.leader.percent, 0) : '—'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The states with the most voters still to be counted: where the result can still move. */
function Remaining({ rows }: { rows: { s: StateRowDTO; voters: number }[] }) {
  return (
    <div>
      <p className={kicker}>Onde mais falta apurar</p>
      <ul className="mt-2 divide-y divide-line">
        {rows.map(({ s, voters }) => (
          <li
            key={s.uf}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-[clamp(6px,1.4cqi,12px)]"
          >
            <StateFlag uf={s.uf} size={24} />
            <span className="min-w-0">
              <span className="block truncate text-[clamp(14px,3.6cqi,24px)] font-semibold">{s.name}</span>
              <span className="block text-[clamp(11px,2.4cqi,16px)] text-muted">
                ~{fmtCompact(voters)} eleitores nas urnas que faltam
              </span>
            </span>
            <span className="numeral text-right text-[clamp(16px,4.6cqi,32px)] font-bold">
              {fmtPct(s.progress?.countedPct, 1)}
              <span className="block text-[0.45em] font-medium text-muted">apurado</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * A state office in every state: who leads (or won). Senate seats can be two per state (2026),
 * so each state shows as many leaders as it has seats.
 */
function OfficeScene({ title, results }: { title: string; results: ResultDTO[] }) {
  const seats = Math.max(...results.map((r) => r.seats ?? 1));
  return (
    <div>
      <p className={kicker}>{title}</p>
      <ul
        className={`mt-2 grid grid-cols-1 gap-x-4 ${seats > 1 ? '@md:grid-cols-2' : results.length > 6 ? '@md:grid-cols-2' : ''}`}
      >
        {results.map((r) => {
          const top = r.candidates.filter(hasValidVotes).slice(0, r.seats ?? 1);
          return (
            <li
              key={r.areaKey}
              className="flex items-center gap-2 border-b border-line/70 py-[clamp(4px,1cqi,9px)]"
            >
              <span className="w-[2.2em] shrink-0 text-[clamp(11px,2.4cqi,16px)] font-semibold text-muted">
                {r.areaKey.toUpperCase()}
              </span>
              {top.length > 0 ? (
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  {top.map((c, i) => (
                    <span key={c.key} className="flex min-w-0 items-center gap-2">
                      <span
                        className="size-[0.6em] shrink-0 rounded-full"
                        style={{ background: c.color }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate text-[clamp(12px,2.8cqi,20px)]">
                        {displayName(c.ballotName)}
                      </span>
                      {/* The site's own reading of the TSE status ("Eleito", "2º turno"). */}
                      <span className="shrink-0">
                        <StatusPill c={c} result={r} rank={i + 1} />
                      </span>
                      <span className="numeral shrink-0 text-[clamp(12px,2.8cqi,20px)] font-semibold">
                        {fmtPct(c.percent, 1)}
                      </span>
                    </span>
                  ))}
                </span>
              ) : (
                <span className="text-[clamp(12px,2.6cqi,18px)] text-muted">sem votos ainda</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Who voted and how: turnout, abstention, blank and null votes, in big numbers. */
function Turnout({ data }: { data: OverviewDTO }) {
  const p = data.progress;
  const v = data.headline?.votes;
  if (!p || !v) return null;
  const share = (n: number | null) => (n != null && v.total ? (n / v.total) * 100 : null);
  const items = [
    { label: 'Comparecimento', value: p.turnoutPct, sub: `${fmtCompact(p.turnout)} eleitores` },
    { label: 'Abstenção', value: p.abstentionPct, sub: `${fmtCompact(p.abstention)} eleitores` },
    { label: 'Brancos', value: share(v.blank), sub: `${fmtCompact(v.blank)} votos` },
    { label: 'Nulos', value: share(v.null), sub: `${fmtCompact(v.null)} votos` },
  ];
  return (
    <div>
      <p className={kicker}>Comparecimento e votos</p>
      <ul className="mt-2 grid grid-cols-2 gap-3">
        {items.map((i) => (
          <li
            key={i.label}
            className="rounded-xl border border-line bg-surface-2/40 p-[clamp(10px,2.4cqi,20px)]"
          >
            <span className="block text-[clamp(12px,2.6cqi,18px)] text-ink-2">{i.label}</span>
            <span className="numeral block text-[clamp(24px,8cqi,60px)] font-bold leading-tight">
              {fmtPct(i.value, 1)}
            </span>
            <span className="numeral block text-[clamp(11px,2.4cqi,16px)] text-muted">{i.sub}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Polymarket's winner market, read live from Polymarket by the reader's browser. Clearly labelled:
 * a betting market, not the count. Shown only when the reader picked it.
 */
function PolymarketScene() {
  const { data, error } = usePolymarket();
  const top = data?.winner.slice(0, 4) ?? [];
  return (
    <div>
      <p className="text-[clamp(12px,2.6cqi,18px)] font-medium text-warn">
        Polymarket · apostas, não é resultado oficial
      </p>
      <p className="mt-0.5 text-[clamp(15px,3.6cqi,24px)] font-semibold">
        Quem vence a eleição presidencial?
      </p>
      {error && <p className="mt-3 text-[14px] text-muted">Polymarket indisponível agora.</p>}
      {!data && !error && <p className="mt-3 text-[14px] text-muted">Carregando…</p>}
      <ul className="mt-3 grid gap-[clamp(8px,1.6cqi,14px)]">
        {top.map((o) => (
          <li key={o.name} className="flex items-center gap-3">
            {o.image ? (
              // biome-ignore lint/performance/noImgElement: Polymarket's own small thumbnail
              <img
                src={o.image}
                alt=""
                width={40}
                height={40}
                className="size-[clamp(32px,7cqi,52px)] shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="size-[clamp(32px,7cqi,52px)] shrink-0 rounded-full bg-surface-2" aria-hidden />
            )}
            <span className="min-w-0 flex-1 truncate text-[clamp(14px,3.6cqi,26px)] font-semibold">
              {o.name}
            </span>
            <span className="numeral text-[clamp(18px,5.5cqi,40px)] font-bold">
              {Math.round(o.price * 100)}%
            </span>
          </li>
        ))}
      </ul>
      {data && (
        <p className="mt-3 text-[clamp(11px,2.2cqi,15px)] text-muted">
          Chance dada pelos apostadores · US$ {fmtCompact(data.volume)} apostados · polymarket.com
        </p>
      )}
    </div>
  );
}

/** How far the count went in each state: every state, its share of ballot boxes counted. */
function CountByState({ states }: { states: StateRowDTO[] }) {
  return (
    <div>
      <p className={kicker}>Apuração por estado · urnas apuradas</p>
      <ul className="mt-2 grid grid-cols-3 gap-x-3 gap-y-[clamp(4px,1cqi,8px)] @md:grid-cols-4">
        {states.map((s) => {
          const pct = s.progress?.countedPct ?? null;
          return (
            <li key={s.uf} className="min-w-0">
              <span className="flex items-baseline justify-between gap-1">
                <span className="text-[clamp(11px,2.4cqi,16px)] font-semibold text-ink-2">{s.uf}</span>
                <span className="numeral text-[clamp(11px,2.4cqi,16px)] font-semibold">{fmtPct(pct, 0)}</span>
              </span>
              <span className="mt-0.5 block h-[clamp(4px,0.8cqi,7px)] overflow-hidden rounded-full bg-surface-2">
                <span className="bar block h-full rounded-full bg-live" style={{ width: `${pct ?? 0}%` }} />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Runoff: the states where the most voted is not the 1st round's one. Matched by ballot number,
 * never by name.
 */
function Changed({ states, before }: { states: StateRowDTO[]; before: StateRowDTO[] }) {
  const was = new Map(before.map((s) => [s.uf, s.leader]));
  const changed = states.filter((s) => {
    const b = was.get(s.uf);
    return s.leader && b && s.leader.number !== b.number;
  });
  return (
    <div>
      <p className={kicker}>Mudou desde o 1º turno · mais votado em cada estado</p>
      {changed.length === 0 ? (
        <p className="mt-3 text-[clamp(14px,3.4cqi,22px)]">
          Até agora, o mais votado em cada estado é o mesmo do 1º turno.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {changed.map((s) => {
            const b = was.get(s.uf)!;
            return (
              <li
                key={s.uf}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 py-[clamp(5px,1.2cqi,10px)]"
              >
                <StateFlag uf={s.uf} size={24} />
                <span className="min-w-0">
                  <span className="block truncate text-[clamp(13px,3.2cqi,22px)] font-semibold">
                    {s.name}
                  </span>
                  <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-[clamp(11px,2.5cqi,17px)] text-ink-2">
                    <span className="size-[0.6em] rounded-full" style={{ background: b.color }} aria-hidden />
                    <span className="truncate">{displayName(b.name)}</span>
                    <span aria-hidden className="text-muted">
                      →
                    </span>
                    <span
                      className="size-[0.6em] rounded-full"
                      style={{ background: s.leader!.color }}
                      aria-hidden
                    />
                    <span className="truncate font-medium text-ink">{displayName(s.leader!.name)}</span>
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * Full screen: shows its content whole in the height it was given. Taller content (a short phone)
 * is scaled down proportionally, never cut and never below half size; shorter content is enlarged
 * up to `grow` to use a big screen. Enlarging narrows the room the content has to lay itself out,
 * which may make it taller: every size that turned out too big lowers the ceiling, so it settles.
 */
function Fit({ children, grow = 1 }: { children: ReactNode; grow?: number }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);
  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    let seen = { room: 0, width: 0, ceiling: grow };
    const measure = () => {
      // The natural (unscaled) height at the current scale's width.
      const need = i.scrollHeight;
      const room = o.clientHeight;
      const width = o.clientWidth;
      if (!need || !room) return;
      // Another screen size: what was learnt about the ceiling no longer holds.
      if (room !== seen.room || width !== seen.width) seen = { room, width, ceiling: grow };
      setK((prev) => {
        const fits = room / need;
        if (fits < prev && prev > 1) seen.ceiling = Math.max(1, Math.min(seen.ceiling, prev - 0.03));
        const next = Math.max(0.5, Math.min(seen.ceiling, fits));
        return Math.abs(next - prev) < 0.01 ? prev : next;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(o);
    observer.observe(i);
    return () => observer.disconnect();
  }, [grow]);
  // A big screen (grow): the scene sits in the middle of its room, not stuck to the top of it.
  const centre = grow > 1;
  return (
    <div ref={outer} className={`h-full overflow-hidden ${centre ? 'flex flex-col justify-center' : ''}`}>
      <div
        ref={inner}
        className={centre ? 'shrink-0' : undefined}
        style={
          k !== 1
            ? {
                transform: `scale(${k})`,
                transformOrigin: centre ? 'left center' : 'top left',
                width: `${100 / k}%`,
              }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}
