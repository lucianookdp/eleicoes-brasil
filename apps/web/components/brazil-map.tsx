'use client';

import type { StateRowDTO } from '@eleicoes/election-core';
import { formatClock } from '@eleicoes/election-core';
import brazil from '@svg-maps/brazil';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { displayName, fmtCompact, fmtPct } from '@/lib/format';
import { useRound } from './shell';
import { Segmented, StateFlag } from './ui';

// Geometry: "Map of Brazil" by Victor Cazanave (svg-maps), CC BY 4.0.
const MAP = brazil as unknown as { viewBox: string; locations: { id: string; name: string; path: string }[] };

type Mode = 'progress' | 'leader';

/**
 * Counted share in clear steps, not a smooth gradient: late in the night most states sit between
 * 80% and 100%, and a gradient makes them look the same. The steps are finer at the top.
 */
const STEPS = [
  { below: 50, label: 'até 50%', mix: 18 },
  { below: 80, label: '50–80%', mix: 42 },
  { below: 95, label: '80–95%', mix: 64 },
  { below: 100, label: '95–99%', mix: 82 },
  { below: Number.POSITIVE_INFINITY, label: '100%', mix: 100 },
];
const stepColor = (mix: number) => `color-mix(in oklab, var(--seq-high) ${mix}%, var(--seq-low))`;

function fill(s: StateRowDTO | undefined, mode: Mode): string {
  if (!s?.progress || s.progress.status === 'not-started') return 'var(--surface-2)';
  // The leader's own colour, solid: who leads, nothing more.
  if (mode === 'leader') return s.leader ? s.leader.color : 'var(--surface-2)';
  const p = s.progress.countedPct ?? 0;
  return stepColor(STEPS.find((step) => p < step.below)!.mix);
}

/**
 * Choropleth of the 26 states + DF. Mouse: hover shows details, click opens the state.
 * Touch/pen: first tap selects and shows details with a link (no hover dependency).
 * Keyboard: each state is focusable; Enter opens it.
 */
/**
 * Where each state's abbreviation goes (map units): the roomiest point inside it, found once with
 * the browser's isPointInFill. States too small to hold one get it in the ocean (or beside them)
 * with a thin line, the way printed maps do.
 */
const LABELS: Record<
  string,
  { at: [number, number]; from?: [number, number]; to?: [number, number]; sea?: boolean }
> = {
  ac: { at: [70, 235] },
  ap: { at: [346, 64] },
  am: { at: [135, 146] },
  ba: { at: [507, 272] },
  ce: { at: [540, 160] },
  go: { at: [373, 345] },
  ma: { at: [448, 161] },
  mt: { at: [292, 294] },
  ms: { at: [298, 401] },
  mg: { at: [465, 373] },
  pa: { at: [322, 168] },
  pi: { at: [485, 208] },
  pr: { at: [342, 475] },
  rs: { at: [319, 561] },
  ro: { at: [166, 247] },
  rr: { at: [202, 58] },
  sc: { at: [376, 522] },
  sp: { at: [395, 430] },
  to: { at: [398, 250] },
  rn: { sea: true, at: [634, 168], from: [598, 168] },
  pb: { sea: true, at: [634, 190], from: [600, 192] },
  pe: { sea: true, at: [634, 212], from: [604, 212] },
  al: { sea: true, at: [634, 234], from: [590, 234] },
  se: { sea: true, at: [634, 256], from: [574, 246] },
  es: { sea: true, at: [558, 400], from: [530, 392] },
  rj: { sea: true, at: [516, 472], from: [494, 446] },
  df: { at: [409, 310], from: [409, 327], to: [409, 317] },
};

export function BrazilMap({
  states,
  allowLeader = true,
  highlight,
  only,
  fit = false,
  card = true,
}: {
  states: StateRowDTO[];
  allowLeader?: boolean;
  /** Fill the parent's height (the full-screen panel), without the hover card. */
  fit?: boolean;
  /** The details card under the map (and its "toque ou passe o mouse" hint): not on a TV. */
  card?: boolean;
  /** One way of colouring only, without the switch (the TV mode shows the most voted). */
  only?: Mode;
  /** When a list filter is on: only these states (lowercase UF) keep full colour. */
  highlight?: Set<string>;
}) {
  const { href } = useRound();
  const router = useRouter();
  // Who leads each state is what readers look for first; counting progress is one tap away.
  const [mode, setMode] = useState<Mode>(only ?? (allowLeader ? 'leader' : 'progress'));
  const [active, setActive] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const byUf = new Map(states.map((s) => [s.uf.toLowerCase(), s]));
  const shown = byUf.get(active ?? pinned ?? '');
  const leaders = [
    ...new Map(states.filter((s) => s.leader).map((s) => [s.leader!.name, s.leader!])).values(),
  ];

  return (
    <div className={fit ? 'flex h-full min-h-0 flex-col' : undefined}>
      <div className="mb-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        {allowLeader && !only ? (
          <Segmented
            label="Colorir mapa por"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'leader', label: 'Mais votado' },
              { value: 'progress', label: 'Apuração' },
            ]}
          />
        ) : (
          <span />
        )}
        <Legend mode={mode} leaders={leaders} />
      </div>
      <div className={fit ? 'relative min-h-0 flex-1' : 'relative'}>
        <svg
          // A bit wider than the map itself, for the labels in the ocean.
          viewBox="0 0 652 639"
          // Not taller than the screen has room for: on the home page the reader's city sits under it.
          className={
            fit
              ? 'mx-auto block h-full w-full'
              : 'mx-auto block h-auto w-full max-w-[600px] lg:max-h-[max(280px,calc(100dvh-26rem))]'
          }
          role="group"
          aria-label="Mapa do Brasil por estado"
        >
          {MAP.locations.map((loc) => {
            const s = byUf.get(loc.id);
            const pct = s?.progress?.countedPct;
            return (
              <path
                key={loc.id}
                d={loc.path}
                role="link"
                tabIndex={0}
                aria-label={`${loc.name}: ${pct == null ? 'sem dados' : `${fmtPct(pct)} apurado`}${s?.leader && mode === 'leader' ? `, mais votado ${displayName(s.leader.name)}` : ''}`}
                fill={fill(s, mode)}
                fillOpacity={highlight && !highlight.has(loc.id) ? 0.22 : 1}
                stroke={active === loc.id || pinned === loc.id ? 'var(--ink)' : 'var(--ground)'}
                strokeWidth={active === loc.id || pinned === loc.id ? 1.6 : 0.8}
                className="cursor-pointer outline-none transition-[fill] duration-700 focus-visible:stroke-[var(--info)] focus-visible:[stroke-width:2.5]"
                onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(loc.id)}
                onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}
                onFocus={() => setActive(loc.id)}
                onBlur={() => setActive(null)}
                onPointerUp={(e) => {
                  if (e.pointerType === 'mouse') router.push(href(`/states/${loc.id}`));
                  else if (pinned === loc.id) router.push(href(`/states/${loc.id}`));
                  else setPinned(loc.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(href(`/states/${loc.id}`));
                  }
                }}
              />
            );
          })}
          <g aria-hidden className="pointer-events-none select-none" fontSize={12} fontWeight={600}>
            {Object.entries(LABELS).map(([id, { at, from, to, sea }]) => {
              // White on a candidate's colour or the darker half of the progress scale (both
              // themes); the theme's text colour on the light, barely-counted end.
              const s = byUf.get(id);
              const onColour = mode === 'leader' ? !!s?.leader : (s?.progress?.countedPct ?? 0) >= 50;
              return (
                <g key={id}>
                  {from && (
                    <line
                      x1={from[0]}
                      y1={from[1]}
                      x2={to?.[0] ?? at[0] - 11}
                      y2={to?.[1] ?? at[1]}
                      stroke="var(--muted)"
                      strokeWidth={0.7}
                    />
                  )}
                  <text
                    x={at[0]}
                    y={at[1]}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={sea ? 'var(--muted)' : onColour ? '#fff' : 'var(--ink)'}
                    stroke={sea ? 'none' : onColour ? 'rgb(0 0 0 / .3)' : 'var(--ground)'}
                    strokeWidth={2.5}
                    strokeOpacity={0.55}
                    paintOrder="stroke"
                    opacity={0.85}
                    letterSpacing="0.03em"
                  >
                    {id.toUpperCase()}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
        {/* A tap both pins a state and focuses it (focus sets `active`): the card is still the
            pinned one, so it keeps its link. Only hovering another state shows a card without it. */}
        {!fit && card && (
          <StateCard state={shown} pinned={!!pinned && (active === null || active === pinned)} />
        )}
      </div>
    </div>
  );
}

function StateCard({ state, pinned }: { state: StateRowDTO | undefined; pinned: boolean }) {
  const { href } = useRound();
  if (!state) {
    return (
      <p className="mt-2 text-center text-[12.5px] text-muted">
        Toque ou passe o mouse sobre um estado para ver os detalhes.
      </p>
    );
  }
  const p = state.progress;
  return (
    <div
      // A hover card sits over the map on larger screens: it must not take the pointer, or the
      // state under it loses hover, the card hides, the state gets hover again… (flicker).
      className={`mt-2 rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-[13.5px] sm:absolute sm:bottom-0 sm:left-0 sm:mt-0 sm:w-56 ${pinned ? '' : 'pointer-events-none'}`}
      aria-live="polite"
    >
      <p className="flex items-center gap-2 font-semibold">
        <StateFlag uf={state.uf} size={20} />
        {state.name}
      </p>
      <p className="numeral text-[20px] leading-tight">
        {p && p.status !== 'not-started' ? `${fmtPct(p.countedPct)}` : '—'}
      </p>
      <p className="text-muted">das urnas apuradas</p>
      <p className="mt-1 text-ink-2">{fmtCompact(p?.turnout)} votos</p>
      {state.leader && (
        <p className="mt-1 flex items-center gap-1.5 text-ink-2">
          <span
            className="inline-block size-2.5 rounded-full"
            style={{ background: state.leader.color }}
            aria-hidden
          />
          {displayName(state.leader.name)} {fmtPct(state.leader.percent)}
        </p>
      )}
      <p className="mt-1 text-[12px] text-muted">
        {p?.totalizedAt ? `Atualizado às ${formatClock(p.totalizedAt)}` : 'Sem atualização ainda'}
      </p>
      {pinned && (
        <Link
          href={href(`/states/${state.uf.toLowerCase()}`)}
          className="mt-2 inline-flex min-h-9 items-center font-medium text-info underline underline-offset-2"
        >
          Abrir {state.name}
        </Link>
      )}
    </div>
  );
}

function Legend({ mode, leaders }: { mode: Mode; leaders: { name: string; color: string }[] }) {
  if (mode === 'leader') {
    return (
      <ul
        className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-ink-2 sm:justify-end"
        aria-label="Legenda"
      >
        {leaders.map((l) => (
          <li key={l.name} className="flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ background: l.color }}
              aria-hidden
            />
            {displayName(l.name)}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul
      className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-ink-2 sm:justify-end"
      aria-label="Legenda: urnas apuradas"
    >
      {STEPS.map((step) => (
        <li key={step.label} className="flex items-center gap-1.5">
          <span
            className="inline-block size-2.5 rounded-sm"
            style={{ background: stepColor(step.mix) }}
            aria-hidden
          />
          {step.label}
        </li>
      ))}
    </ul>
  );
}
