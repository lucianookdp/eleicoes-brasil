'use client';

import { hasValidVotes, type OverviewDTO, type ResultDTO, type StateRowDTO } from '@eleicoes/election-core';
import { type ReactNode, useEffect, useState } from 'react';
import { displayName, fmtCompact, fmtPct } from '@/lib/format';
import { useEvents, useOfficeStates } from '@/lib/queries';
import { ActivityFeed } from './activity';
import { BrazilMap } from './brazil-map';
import { StatusPill } from './results';
import { useRound } from './shell';
import { StateFlag } from './ui';

/** Seconds each scene stays on screen. */
const SCENE_SECONDS = 12;

/** One page on screen. A long list (governors, senators) is split into pages that each fit,
 * shown one after another, so the panel never grows taller than the map. */
type Scene = { id: string; group: SceneId; title: string; page: number; pages: number; body: ReactNode };

/** States per page: governors in two columns, senators (two per state) a little fewer. */
const PER_PAGE = { 1: 14, 2: 10 } as const;
const pagesOf = <T,>(list: T[], size: number) =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, (i + 1) * size));

/** Every scene the reader can pick, in this order. */
const CATALOG = [
  { id: 'mapa', title: 'Mapa' },
  { id: 'placar', title: 'Estados' },
  { id: 'falta', title: 'Falta apurar' },
  { id: 'governadores', title: 'Governadores' },
  { id: 'senadores', title: 'Senadores' },
  { id: 'comparecimento', title: 'Comparecimento' },
  { id: 'atualizacoes', title: 'Últimas atualizações' },
] as const;
type SceneId = (typeof CATALOG)[number]['id'];
const ALL = CATALOG.map((c) => c.id) as SceneId[];
const PICK_KEY = 'eleicoes:telao-cenas';

/** The reader's pick, kept in this browser only (a TV set up once stays as it was). */
function useSceneChoice() {
  const [chosen, setChosen] = useState<SceneId[]>(ALL);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PICK_KEY) ?? 'null') as string[] | null;
      const valid = saved?.filter((id): id is SceneId => (ALL as string[]).includes(id));
      if (valid && valid.length > 0) setChosen(valid);
    } catch {}
  }, []);
  const toggle = (id: SceneId) =>
    setChosen((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : ALL.filter((x) => x === id || prev.includes(x));
      // Never none: the last one stays.
      if (next.length === 0) return prev;
      try {
        localStorage.setItem(PICK_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  return { chosen, toggle };
}

/**
 * The right half of the big screen goes through the scenes the reader picked, by itself, for a TV
 * nobody touches (the headline race on the left never moves). Scenes without data right now are
 * skipped. A click on a title jumps to it; the button pauses; "Escolher" picks the scenes.
 */
export function TvScenes({ data, states }: { data: OverviewDTO; states: StateRowDTO[] }) {
  const { round } = useRound();
  const governor = data.round.offices.find((o) => o.slug === 'governador');
  const senator = data.round.offices.find((o) => o.slug === 'senador');
  const governors = useOfficeStates(round.slug, governor?.slug).data;
  const senators = useOfficeStates(round.slug, senator?.slug).data;
  const events = useEvents(round.slug, 12).data;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [picking, setPicking] = useState(false);
  const { chosen, toggle } = useSceneChoice();

  const left = states
    .filter((s) => s.progress && s.progress.status !== 'not-started' && (s.progress.countedPct ?? 0) < 100)
    .map((s) => ({
      s,
      voters: (s.progress?.electorateTotal ?? 0) * (1 - (s.progress?.countedPct ?? 0) / 100),
    }))
    .sort((a, b) => b.voters - a.voters)
    .slice(0, 6);
  const office = (title: string, results: ResultDTO[] | undefined) => {
    if (!results || results.length === 0) return [];
    const seats = Math.max(...results.map((r) => r.seats ?? 1)) > 1 ? 2 : 1;
    return pagesOf(results, PER_PAGE[seats]).map((page) => (
      <OfficeScene key={page[0]!.areaKey} title={title} results={page} />
    ));
  };
  // The pages of each scene; none: nothing to show right now (no one left to count, no senate race).
  const bodies: Record<SceneId, ReactNode[]> = {
    mapa: [<BrazilMap key={round.slug} states={states} />],
    placar: states.some((s) => s.leader) ? [<Scoreboard key="placar" states={states} />] : [],
    falta: left.length > 0 ? [<Remaining key="falta" rows={left} />] : [],
    governadores: office(round.round === 2 ? 'Governadores no 2º turno' : 'Governadores', governors?.results),
    senadores: office('Senadores', senators?.results),
    comparecimento:
      data.progress?.turnoutPct != null && data.headline ? [<Turnout key="comp" data={data} />] : [],
    atualizacoes:
      events && events.length > 0
        ? [
            <div key="atualizacoes">
              <p className={kicker}>Últimas atualizações</p>
              <ActivityFeed events={events} max={10} />
            </div>,
          ]
        : [],
  };
  const picked = CATALOG.filter((c) => chosen.includes(c.id) && bodies[c.id].length > 0);
  // Whatever was picked, the map is always there to fall back on.
  const scenes: Scene[] = (picked.length > 0 ? picked : [CATALOG[0]]).flatMap((c) =>
    bodies[c.id].map((body, page) => ({
      id: `${c.id}-${page}`,
      group: c.id,
      title: c.title,
      page,
      pages: bodies[c.id].length,
      body,
    })),
  );
  const groups = [...new Set(scenes.map((s) => s.group))];

  const current = index % scenes.length;
  const now = scenes[current]!;
  // biome-ignore lint/correctness/useExhaustiveDependencies: a click on a title restarts the countdown too
  useEffect(() => {
    if (paused || scenes.length < 2) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % scenes.length), SCENE_SECONDS * 1000);
    return () => clearTimeout(t);
  }, [paused, scenes.length, current]);

  return (
    <section
      aria-label="Painel que muda sozinho"
      className="@container min-w-0 rounded-2xl border border-line bg-surface p-3"
    >
      <div className="flex items-center gap-2">
        <div className="scroll-x flex flex-1 gap-1" role="group" aria-label="Cenas">
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
        <button
          type="button"
          aria-expanded={picking}
          onClick={() => setPicking((p) => !p)}
          className="h-8 shrink-0 rounded-full border border-line px-3 text-[13px] text-ink-2 hover:border-line-strong aria-expanded:border-live aria-expanded:text-ink"
        >
          Escolher
        </button>
      </div>
      {picking && (
        <fieldset className="mt-3 rounded-xl border border-line bg-surface-2/40 p-3">
          <legend className="px-1 text-[13px] text-ink-2">
            O que passa no telão (o presidente fica sempre)
          </legend>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 @md:grid-cols-3">
            {CATALOG.map((c) => (
              <li key={c.id}>
                <label className="flex min-h-9 cursor-pointer items-center gap-2 text-[14px]">
                  <input
                    type="checkbox"
                    checked={chosen.includes(c.id)}
                    onChange={() => toggle(c.id)}
                    className="size-4 accent-[var(--live)]"
                  />
                  <span>
                    {c.title}
                    {bodies[c.id].length === 0 && (
                      <span className="ml-1 text-[12px] text-muted">(sem dados agora)</span>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      )}
      {/* Every scene in the same cell: the panel keeps the height of the tallest one, so the race
          beside it never jumps when the scene changes. Only the current one is visible. */}
      <div className="mt-3 grid">
        {scenes.map((s, i) => (
          <div
            key={s.id}
            aria-hidden={i !== current}
            inert={i !== current}
            className={`[grid-area:1/1] transition-opacity duration-500 ${i === current ? 'opacity-100' : 'invisible opacity-0'}`}
          >
            {s.body}
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
        className={`mt-2 grid gap-x-4 ${seats > 1 ? '@md:grid-cols-2' : results.length > 6 ? 'grid-cols-2' : ''}`}
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
