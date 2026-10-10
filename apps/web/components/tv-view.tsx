'use client';

import { type CandidateDTO, hasValidVotes } from '@eleicoes/election-core';
import { useEffect, useRef, useState } from 'react';
import { displayName, fmtInt, fmtPct } from '@/lib/format';
import { useMyCity } from '@/lib/my-city';
import { useCity, useOverview } from '@/lib/queries';
import { BrazilMap } from './brazil-map';
import { IconPin, Logo } from './icons';
import { decision } from './overview';
import { FacePhoto } from './results';
import { useRound } from './shell';
import { catalogFor, SCENE_SECONDS, TvScenes, useSceneChoice } from './tv-scenes';
import { EmptyState, ErrorNotice, Skeleton } from './ui';

const LYING_KEY = 'eleicoes:painel-deitado';
const CLOCK = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

/**
 * "Modo telão": the headline race in big type and the map, for a TV, a projector or a live stream.
 * Same live data as the rest of the site. "Tela cheia" hides everything else and keeps the screen
 * awake where the browser allows it.
 */
export function TvView() {
  const { round } = useRound();
  const { data, error, refetch } = useOverview(round.slug);
  const myCity = useMyCity();
  const choice = useSceneChoice(round.round);
  const box = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
  const [started, setStarted] = useState(false);
  // Phones: the panel covers the whole screen in one view, sized to fit with no scrolling (iPhones
  // have no full screen for pages, so it is the page itself that covers everything; elsewhere the
  // browser's bars go too). Computers: the browser's full screen. Either way the screen stays awake.
  const [panel, setPanel] = useState(false);
  // The panel laid out for a screen lying on its side (race beside the scenes), whichever way the
  // phone itself is held: with the rotation locked, it is the panel that turns.
  const [lying, setLying] = useState(false);
  useEffect(() => {
    try {
      setLying(localStorage.getItem(LYING_KEY) === '1');
    } catch {}
  }, []);
  const turn = () => {
    setLying((on) => {
      try {
        localStorage.setItem(LYING_KEY, on ? '0' : '1');
      } catch {}
      return !on;
    });
  };
  const start = () => {
    setStarted(true);
    const el = box.current;
    if (!el) return;
    // A phone held either way: narrow, or short when it lies on its side.
    const phone = window.innerWidth <= 767 || Math.min(window.innerWidth, window.innerHeight) <= 500;
    if (phone) setPanel(true);
    if (document.fullscreenEnabled && el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (!phone) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const exit = () => {
    setPanel(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };
  // Nothing behind the panel scrolls while it is open.
  useEffect(() => {
    if (!panel) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = before;
    };
  }, [panel]);
  const [now, setNow] = useState(() => new Date());
  const view = useViewport();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(t);
  }, []);

  // Keeps the screen on while in full screen (optional: some browsers refuse, that's fine).
  useEffect(() => {
    const onChange = () => {
      const on = document.fullscreenElement === box.current;
      setFull(on);
      // Left the browser's full screen (back gesture): the phone panel closes with it.
      if (!on) setPanel(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  useEffect(() => {
    if (!(full || started) || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock
      .request('screen')
      .then((l) => {
        lock = l;
      })
      .catch(() => {});
    return () => {
      lock?.release().catch(() => {});
    };
  }, [full, started]);

  if (!data)
    return error ? <ErrorNotice error={error} retry={() => refetch()} /> : <Skeleton className="h-[70vh]" />;

  const headline = data.headline;
  const shown = (headline?.candidates ?? []).filter(hasValidVotes).slice(0, 4);
  const pair = shown.length === 2 || (round.round === 2 && shown.length >= 2);
  const outcome = headline ? decision(headline) : null;
  const winner = outcome?.decided === 'elected' ? (outcome.elected ?? outcome.leaders[0]) : null;
  const counted = data.progress?.countedPct ?? null;
  // Full screen on a TV or computer: everything is laid out to fill the screen it actually has.
  //   three: wide screens (16:9 and wider): race | map of Brazil | scenes
  //   two:   other landscape screens (4:3 projectors, tablets): race | scenes, the map among them
  //   stack: upright screens: race on top, scenes (with the map) in the rest
  const screen = full && !panel;
  // Phone panel on its side: the phone itself turned, or the panel turned by hand ("Deitar").
  const upright = view.h >= view.w;
  const flat = panel && (lying || !upright);
  const rotated = panel && lying && upright;
  const layout = !screen
    ? 'page'
    : view.w >= 1280 && view.w / view.h >= 1.5
      ? 'three'
      : view.w > view.h
        ? 'two'
        : 'stack';
  const gap =
    shown.length >= 2 && (shown[0]!.votes ?? 0) > 0 ? (shown[0]!.votes ?? 0) - (shown[1]!.votes ?? 0) : null;
  const gapPp =
    shown.length >= 2 && shown[0]!.percent != null && shown[1]!.percent != null
      ? shown[0]!.percent - shown[1]!.percent
      : null;
  const live = data.round.status === 'live';
  const states = data.states.filter((s) => s.uf !== 'ZZ');
  // Races this round does not have (no senate race in a runoff, for example).
  const absent = new Set<string>();
  if (!data.round.offices.some((o) => o.slug === 'governador')) absent.add('governadores');
  if (!data.round.offices.some((o) => o.slug === 'senador')) absent.add('senadores');

  return (
    <div>
      <div className="mb-3">
        <h1 className="text-[22px] font-semibold tracking-tight">
          {/* A phone is no TV: same page, a name that fits it. */}
          <span className="sm:hidden">Painel ao vivo</span>
          <span className="hidden sm:inline">Modo telão</span>
        </h1>
        <p className="text-[13.5px] text-muted">
          <span className="sm:hidden">Deixe o celular parado e acompanhe sem tocar. Atualiza sozinho.</span>
          <span className="hidden sm:inline">Para TV, projetor ou transmissão. Atualiza sozinho.</span>
        </p>
      </div>

      {/* Set it up first, then start: the screen itself only shows the content. */}
      <section aria-labelledby="montar" className="mb-4 rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <h2 id="montar" className="text-[17px] font-semibold">
          <span className="sm:hidden">Monte seu painel</span>
          <span className="hidden sm:inline">Monte seu telão</span>
        </h2>
        <p className="mt-0.5 text-[13.5px] text-ink-2">
          Escolha o que passa ao lado do resultado para presidente, que fica sempre na tela. Cada item aparece
          por {SCENE_SECONDS} segundos, um depois do outro.
        </p>
        <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 min-[420px]:grid-cols-2 lg:grid-cols-4">
          {catalogFor(round.round).map((c) => (
            <li key={c.id}>
              <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-[14.5px]">
                <input
                  type="checkbox"
                  checked={choice.chosen.includes(c.id)}
                  onChange={() => choice.toggle(c.id)}
                  className="size-4 shrink-0 accent-[var(--live)]"
                />
                <span>
                  {c.title}
                  {absent.has(c.id) && (
                    <span className="ml-1 text-[12px] text-muted">(não há nesta etapa)</span>
                  )}
                  {'hint' in c && <span className="block text-[12px] leading-tight text-warn">{c.hint}</span>}
                </span>
              </label>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={start}
          className="mt-3 inline-flex h-11 items-center gap-2 rounded-full bg-live px-5 text-[15px] font-semibold text-ground hover:opacity-90"
        >
          <svg
            viewBox="0 0 24 24"
            width={17}
            height={17}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            aria-hidden
          >
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="sm:hidden">Iniciar</span>
          <span className="hidden sm:inline">Iniciar em tela cheia</span>
        </button>
      </section>

      <div
        ref={box}
        className={
          panel
            ? 'fixed inset-0 z-[60] h-[100dvh] overflow-hidden bg-ground'
            : 'flex flex-col gap-[clamp(16px,2.2vw,40px)] rounded-2xl border border-line bg-ground p-4 sm:p-6 [&:fullscreen]:h-screen [&:fullscreen]:overflow-auto [&:fullscreen]:rounded-none [&:fullscreen]:border-0 [&:fullscreen]:p-[3vw]'
        }
      >
        {/* The browser does not let the full-screen element itself be turned, so the layout (and
            the quarter turn, when the panel lies on its side on an upright phone) lives one level in. */}
        <div
          className={
            !panel
              ? 'contents'
              : rotated
                ? 'absolute left-[100dvw] top-0 flex h-[100dvw] w-[100dvh] origin-top-left rotate-90 flex-col gap-2 py-2 pl-[max(12px,env(safe-area-inset-top))] pr-[max(12px,env(safe-area-inset-bottom))]'
                : flat
                  ? 'flex h-full flex-col gap-2 py-2 pl-[max(12px,env(safe-area-inset-left))] pr-[max(12px,env(safe-area-inset-right))]'
                  : 'flex h-full flex-col gap-3 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-[max(10px,env(safe-area-inset-top))]'
          }
        >
          <header
            className={`flex shrink-0 items-center justify-between gap-3 ${panel ? 'flex-nowrap' : 'flex-wrap'}`}
          >
            <div className="flex items-center gap-3">
              <Logo size={panel ? 24 : 34} />
              <div className="leading-tight">
                <p className="text-[clamp(16px,1.6vmax,28px)] font-semibold">Eleições Brasil</p>
                <p className="text-[clamp(13px,1.1vmax,20px)] text-muted">
                  {headline ? `${headline.office.name} · ` : ''}
                  {round.round}º turno
                </p>
              </div>
            </div>
            <div
              className={`flex shrink-0 items-center ${panel ? 'gap-2.5 text-[13px]' : 'gap-4 text-[clamp(14px,1.3vmax,24px)]'}`}
            >
              {live ? (
                <span className="flex items-center gap-2 font-semibold text-bad">
                  <span className="pulse-dot inline-block size-[0.6em] rounded-full bg-current" aria-hidden />
                  Ao vivo
                </span>
              ) : (
                <span className="font-medium text-ink-2">
                  {data.round.status === 'final'
                    ? panel
                      ? 'Encerrada'
                      : 'Apuração encerrada'
                    : 'Aguardando'}
                </span>
              )}
              <time className="numeral text-muted">{CLOCK.format(now)}</time>
              {panel && upright && (
                <button
                  type="button"
                  onClick={turn}
                  aria-pressed={lying}
                  aria-label={lying ? 'Voltar a tela em pé' : 'Deitar a tela'}
                  className="flex size-9 items-center justify-center rounded-full border border-line text-ink-2 aria-pressed:border-live aria-pressed:text-live"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width={17}
                    height={17}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <rect x="3" y="10" width="13" height="8" rx="1.5" />
                    <path d="M12 3a7 7 0 0 1 7 7M19 10l-2.2-2M19 10l2.2-2" />
                  </svg>
                </button>
              )}
              {panel && (
                <button
                  type="button"
                  onClick={exit}
                  aria-label="Sair do painel"
                  className="-mr-1 flex size-9 items-center justify-center rounded-full border border-line text-ink-2"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width={16}
                    height={16}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                    aria-hidden
                  >
                    <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          </header>

          {!headline || shown.length === 0 ? (
            <EmptyState title="Ainda não há votos apurados." />
          ) : (
            <div
              className={
                flat
                  ? // On its side: the race at the left, the scenes at the right, both the full height.
                    'flex min-h-0 flex-1 flex-row items-stretch gap-3'
                  : panel
                    ? 'flex min-h-0 flex-1 flex-col gap-3'
                    : layout === 'three'
                      ? 'grid min-h-0 flex-1 grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] gap-[clamp(16px,2.5vw,48px)]'
                      : layout === 'two'
                        ? 'grid min-h-0 flex-1 grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-[clamp(16px,2.5vw,48px)]'
                        : layout === 'stack'
                          ? 'flex min-h-0 flex-1 flex-col gap-[clamp(16px,2.5vw,48px)]'
                          : // In the page, before starting: the race, the map of Brazil (fixed) and the
                            // scenes side by side; medium screens: race and map on top, the scenes under.
                            'grid items-center gap-[clamp(16px,2.5vw,48px)] lg:grid-cols-2 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)]'
              }
            >
              <section
                aria-label="Resultado"
                className={`@container min-w-0 shrink-0 ${layout === 'three' || layout === 'two' ? 'self-center' : ''} ${flat ? 'w-[42%] self-center' : ''}`}
              >
                {winner && (
                  // The winner, in words, once the TSE marks it: a TV across the room has no other cue.
                  <div role="status" className={panel ? 'mb-2' : 'mb-[clamp(14px,2vw,36px)]'}>
                    <p
                      className={`flex items-center gap-[0.5em] font-semibold uppercase tracking-wide text-live ${panel ? 'text-[11px]' : 'text-[clamp(11px,2.3cqi,20px)]'}`}
                    >
                      <span className="size-[0.5em] rounded-full bg-live" aria-hidden />
                      Resultado definido pelo TSE
                    </p>
                    <p
                      className={`text-balance font-semibold leading-tight tracking-tight ${panel ? 'text-[19px]' : 'mt-[0.15em] text-[clamp(20px,6.4cqi,56px)]'}`}
                    >
                      {displayName(winner.ballotName)} venceu{' '}
                      {round.round === 1 ? 'no 1º turno' : 'o 2º turno'}
                    </p>
                  </div>
                )}
                {pair ? (
                  <Pair a={shown[0]!} b={shown[1]!} fallbackRound={round.slug} compact={panel} />
                ) : (
                  <ul className={panel ? 'grid gap-2' : 'grid gap-[clamp(10px,1.4vw,24px)]'}>
                    {shown.map((c) => (
                      <Row key={c.key} c={c} fallbackRound={round.slug} compact={panel} />
                    ))}
                  </ul>
                )}
                {/* Phone panel: one line (label, number and bar side by side) to leave room for the scenes. */}
                <div className={panel ? 'mt-2 flex items-center gap-3' : 'mt-[clamp(16px,2.4vw,44px)]'}>
                  <p
                    className={`flex items-baseline justify-between text-ink-2 ${panel ? 'shrink-0 gap-2 text-[13px]' : 'text-[clamp(14px,1.3vmax,24px)]'}`}
                  >
                    <span>Urnas apuradas</span>
                    <span
                      className={`numeral font-semibold text-ink ${panel ? 'text-[16px]' : 'text-[clamp(18px,2vmax,36px)]'}`}
                    >
                      {fmtPct(counted, 2)}
                    </span>
                  </p>
                  <div
                    className={`h-[clamp(6px,0.6vw,12px)] overflow-hidden rounded-full bg-surface-2 ${panel ? 'flex-1' : 'mt-2'}`}
                  >
                    <div className="bar h-full rounded-full bg-live" style={{ width: `${counted ?? 0}%` }} />
                  </div>
                </div>
                {!panel && pair && gap != null && gap > 0 && (
                  <p className="mt-[clamp(10px,1.6vw,28px)] text-[clamp(14px,min(3.3cqi,3vh),28px)] text-ink-2">
                    Diferença de <span className="numeral font-semibold text-ink">{fmtInt(gap)}</span> votos
                    {gapPp != null && (
                      <span className="text-muted"> · {fmtPct(gapPp).replace('%', ' p.p.')}</span>
                    )}
                  </p>
                )}
                {myCity.city && !panel && <TvCity office={headline.office.slug} />}
              </section>
              {(layout === 'page' || layout === 'three') && !panel && (
                <section
                  aria-label="Mapa do Brasil: mais votado em cada estado"
                  className={`min-w-0 rounded-2xl border border-line bg-surface p-3 ${layout === 'three' ? 'min-h-0' : ''}`}
                >
                  <BrazilMap
                    key={round.slug}
                    states={states}
                    only="leader"
                    card={false}
                    fit={layout === 'three'}
                  />
                </section>
              )}
              <TvScenes
                data={data}
                states={states}
                chosen={choice.chosen}
                fill={panel || screen}
                compact={panel}
                withMap={panel || layout === 'two' || layout === 'stack'}
                grow={layout === 'stack' ? 2.2 : screen ? 1.6 : 1}
                className={layout === 'page' ? 'lg:col-span-2 xl:col-span-1' : ''}
              />
            </div>
          )}

          <footer
            className={`flex-wrap justify-between gap-2 text-[clamp(12px,1vmax,18px)] text-muted ${panel ? 'hidden' : 'flex'}`}
          >
            <span>Dados oficiais do TSE</span>
            <span className="font-medium text-ink-2">eleicoes.lucianookdp.dev</span>
          </footer>
        </div>
      </div>
    </div>
  );
}

/** Two finalists side by side, with one split bar. */
/** The window's size, for laying the full screen out by the shape of the screen. */
function useViewport() {
  const [view, setView] = useState({ w: 1920, h: 1080 });
  useEffect(() => {
    const read = () => setView({ w: window.innerWidth, h: window.innerHeight });
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, []);
  return view;
}

function Pair({
  a,
  b,
  fallbackRound,
  compact = false,
}: {
  a: CandidateDTO;
  b: CandidateDTO;
  fallbackRound: string;
  /** The phone's full-screen panel: smaller faces, so the scenes below get the room. */
  compact?: boolean;
}) {
  const total = (a.votes ?? 0) + (b.votes ?? 0);
  const left = total ? ((a.votes ?? 0) / total) * 100 : 50;
  return (
    <div>
      <div className="grid grid-cols-2 gap-[clamp(12px,2vw,40px)]">
        {[a, b].map((c, i) => (
          <div
            key={c.key}
            className={`flex min-w-0 flex-col ${compact ? 'gap-1' : 'gap-2'} ${i ? 'items-end text-right' : ''}`}
          >
            <FacePhoto
              c={c}
              fallbackRound={fallbackRound}
              sizeClass={
                compact
                  ? 'size-11 text-[14px]'
                  : 'size-[clamp(64px,min(16cqi,15vh),150px)] text-[clamp(18px,4cqi,40px)]'
              }
            />
            <p className="flex max-w-full items-center gap-2 text-[clamp(16px,min(4.2cqi,4vh),38px)] font-semibold">
              <span
                className="size-[0.45em] shrink-0 rounded-full"
                style={{ background: c.color }}
                aria-hidden
              />
              <span className="truncate">{displayName(c.ballotName)}</span>
            </p>
            <p className="numeral text-[clamp(34px,min(11cqi,11vh),136px)] font-bold leading-none tracking-tight">
              {fmtPct(c.percent)}
            </p>
            <p className="numeral text-[clamp(13px,2.6cqi,24px)] text-muted">{fmtInt(c.votes)} votos</p>
          </div>
        ))}
      </div>
      <div className="mt-[clamp(14px,2vw,36px)] flex h-[clamp(10px,1.1vw,22px)] overflow-hidden rounded-full">
        <div className="bar h-full" style={{ width: `${left}%`, background: a.color }} />
        <div className="h-full flex-1" style={{ background: b.color }} />
      </div>
    </div>
  );
}

/** One of several candidates (1st round): face, name, big %, a bar. */
function Row({
  c,
  fallbackRound,
  compact = false,
}: {
  c: CandidateDTO;
  fallbackRound: string;
  compact?: boolean;
}) {
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-[clamp(8px,2.5cqi,24px)]">
      <FacePhoto
        c={c}
        fallbackRound={fallbackRound}
        sizeClass={
          compact ? 'size-8 text-[11px]' : 'size-[clamp(36px,9cqi,84px)] text-[clamp(13px,2.4cqi,24px)]'
        }
      />
      <div className="min-w-0">
        <p className="truncate text-[clamp(14px,4cqi,32px)] font-semibold">{displayName(c.ballotName)}</p>
        <div className="mt-1.5 h-[clamp(6px,0.6vw,12px)] overflow-hidden rounded-full bg-surface-2">
          <div
            className="bar h-full rounded-full"
            style={{ width: `${Math.min(100, c.percent ?? 0)}%`, background: c.color }}
          />
        </div>
      </div>
      <div className="text-right">
        <p className="numeral text-[clamp(20px,7.5cqi,72px)] font-bold leading-none">{fmtPct(c.percent)}</p>
        <p className="numeral mt-1 text-[clamp(11px,2.3cqi,20px)] text-muted">{fmtInt(c.votes)} votos</p>
      </div>
    </li>
  );
}

/** "Minha cidade" on the big screen: the same race in the city the reader picked on the home page. */
function TvCity({ office }: { office: string }) {
  const { round } = useRound();
  const { city } = useMyCity();
  const { data } = useCity(round.slug, city!.uf, city!.code);
  const result = data?.results.find((r) => r.office.slug === office);
  const top = result?.candidates.filter(hasValidVotes).slice(0, 2) ?? [];
  if (!city) return null;
  return (
    <div className="mt-[clamp(14px,2vw,32px)] rounded-xl border border-line bg-surface px-[clamp(12px,1.4vw,24px)] py-[clamp(10px,1.1vw,20px)]">
      <p className="flex items-center gap-1.5 text-[clamp(12px,1vmax,18px)] text-muted">
        <IconPin width="1em" height="1em" className="text-live" /> Minha cidade
        {result && ` · ${fmtPct(result.progress.countedPct, 1)} das urnas`}
      </p>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="truncate text-[clamp(16px,1.6vw,30px)] font-semibold">
          {city.name} <span className="font-normal text-muted">({city.uf.toUpperCase()})</span>
        </p>
        {top.length > 0 ? (
          <p className="flex flex-wrap gap-x-5 text-[clamp(14px,1.4vw,26px)]">
            {top.map((c) => (
              <span key={c.key} className="flex items-center gap-1.5">
                <span className="size-[0.5em] rounded-full" style={{ background: c.color }} aria-hidden />
                {displayName(c.ballotName)}
                <span className="numeral font-semibold">{fmtPct(c.percent)}</span>
              </span>
            ))}
          </p>
        ) : (
          <p className="text-[clamp(13px,1.2vw,22px)] text-muted">
            {data ? 'Ainda sem votos apurados' : 'Carregando…'}
          </p>
        )}
      </div>
    </div>
  );
}
