'use client';

import type { ApiMeta, ElectionSummary, RoundSummary } from '@eleicoes/election-core';
import { formatClock } from '@eleicoes/election-core';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { countVisit } from '@/lib/api';
import { colorOf, shortName, usePolymarket } from '@/lib/polymarket';
import { useOverview } from '@/lib/queries';
import { RealtimeProvider, useRealtime } from '@/lib/realtime';
import { electionHref, pickRound, SECTION_ROUTES } from '@/lib/rounds';
import {
  IconChevron,
  IconClose,
  IconCompare,
  IconGlobe,
  IconHelp,
  IconHistory,
  type IconInfo,
  IconMoon,
  IconMore,
  IconOverview,
  IconPerson,
  IconPolymarket,
  IconPulse,
  IconSearch,
  IconStar,
  IconStates,
  IconSun,
  IconTv,
  Logo,
} from './icons';
import { SearchPalette } from './search';
import { shareSite } from './share-button';
import { FreshnessNotice, useTseStall } from './ui';

interface RoundContextValue {
  round: RoundSummary;
  elections: ElectionSummary[];
  meta: ApiMeta | null;
  href: (path?: string, extra?: Record<string, string>) => string;
}

const RoundCtx = createContext<RoundContextValue | null>(null);

export function useRound() {
  const v = useContext(RoundCtx);
  if (!v) throw new Error('useRound outside ElectionShell');
  return v;
}

export function ElectionShell({
  electionSlug,
  elections,
  meta,
  children,
}: {
  electionSlug: string;
  elections: ElectionSummary[];
  meta: ApiMeta | null;
  children: ReactNode;
}) {
  const params = useSearchParams();
  const round = pickRound(elections, electionSlug, params.get('t'));
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(countVisit, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!round) {
    return (
      <BasicShell>
        <h1 className="text-2xl font-semibold">Eleição não encontrada</h1>
        <p className="mt-2 text-ink-2">Não há dados para “{electionSlug}” neste servidor.</p>
        <Link href="/" className="mt-6 inline-block text-info underline">
          Voltar ao início
        </Link>
      </BasicShell>
    );
  }

  const href = (path = '', extra?: Record<string, string>) => electionHref(round, path, extra);
  return (
    <RoundCtx.Provider value={{ round, elections, meta, href }}>
      <RealtimeProvider roundSlug={round.slug}>
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:bg-surface focus:p-2"
        >
          Pular para o conteúdo
        </a>
        <Header onSearch={() => setSearchOpen(true)} />
        {/* At least one screen tall: while the data loads the page is a short skeleton, and a footer
            in view would jump away when the content arrives (the biggest layout shift there was). */}
        <main id="conteudo" className="mx-auto min-h-dvh w-full max-w-[1320px] px-4 pb-6 pt-5 sm:px-6">
          <GlobalFreshness />
          {children}
        </main>
        <Footer />
        <BottomNav onSearch={() => setSearchOpen(true)} />
        {searchOpen && <SearchPalette onClose={() => setSearchOpen(false)} />}
      </RealtimeProvider>
    </RoundCtx.Provider>
  );
}

/**
 * The main sections, in the computer's bar and the phone's bottom bar (with Polymarket next to
 * them). Everything else lives under "Mais" (`MoreContent`), the same on both.
 */
const NAV = [
  { path: '', label: 'Resultados', short: 'Resultados', icon: IconOverview },
  { path: '/states', label: 'Estados e cidades', short: 'Estados', icon: IconStates },
  // Governors, senators and the STF: the three powers, one short general name.
  { path: '/offices', label: 'Poderes', short: 'Poderes', icon: IconPerson },
];

function useActive() {
  const pathname = usePathname().replace(/\/$/, '');
  // The site's own address ("/") is the results page of the election that matters now.
  return (path: string) =>
    SECTION_ROUTES[path]?.replace(/\/$/, '') === pathname || (path === '' && pathname === '');
}

type MoreItem = {
  to: string;
  label: string;
  icon: typeof IconInfo;
  path?: string;
  hint?: string;
  /** Name on phones, when the computer's one does not fit a phone ("Modo telão"). */
  phoneLabel?: string;
  /** Name in the computer's bar, when shorter than the one in "Mais". */
  short?: string;
  /** Description on phones, when it differs ("Painel ao vivo" is not for a TV). */
  phoneHint?: string;
};

/**
 * What "Mais" holds, in two groups of same-size rows (the author's order inside each): what to
 * follow tonight, then the pages about the site. Polymarket has its own card on top (MoreContent).
 */
function useMoreItems() {
  const { href, meta, round } = useRound();
  const groups: { title: string; items: MoreItem[] }[] = [
    {
      title: 'Acompanhe',
      items: [
        ...(meta?.features.comparison === false
          ? []
          : [
              {
                to: href('/compare'),
                path: '/compare',
                label: 'Comparar',
                hint: 'Estados lado a lado',
                icon: IconCompare,
              },
            ]),
        {
          to: href('/historico'),
          path: '/historico',
          label: 'Linha do tempo',
          hint: 'A apuração hora a hora',
          icon: IconHistory,
        },
        {
          to: href('/favorites'),
          path: '/favorites',
          label: 'Favoritos',
          hint: 'Seus estados e cidades',
          icon: IconStar,
        },
        {
          to: href('/tv'),
          path: '/tv',
          label: 'Modo telão',
          phoneLabel: 'Painel ao vivo',
          hint: 'Para TV e transmissão',
          phoneHint: 'Tela cheia, sem distrações',
          icon: IconTv,
        },
        // Brazilians abroad vote for president only: a general election has that page.
        ...(round.kind === 'general'
          ? [
              {
                to: href('/states/zz'),
                path: '/states/zz',
                label: 'Exterior',
                hint: 'Votos de quem mora fora',
                icon: IconGlobe,
              },
            ]
          : []),
      ],
    },
    {
      title: 'Sobre o site',
      items: [
        {
          to: href('/operations'),
          path: '/operations',
          label: 'Transparência da apuração',
          short: 'Transparência',
          hint: 'Se os dados estão chegando',
          icon: IconPulse,
        },
        { to: '/como-funciona', label: 'Como funciona', hint: 'De onde vêm os números', icon: IconHelp },
      ],
    },
  ];
  return { groups, items: groups.flatMap((g) => g.items) };
}

/** Room always left free between the bar and search/status, so a longer status ("Dados atrasados")
 * never makes it overflow. */
const BAR_MARGIN = 48;
/** Last count, kept across remounts so a page change does not make the links pop in again. */
let lastShown = 0;

/**
 * Computers: as many items of "Mais" as fit in the bar by themselves, in the author's order, with
 * a margin; the rest stay in "Mais". Measured, not guessed per breakpoint: the room depends on the
 * page (the round buttons), the status text and the fonts. The arithmetic does not depend on how
 * many are shown (adding one moves "Mais" by exactly its width), so it cannot flicker.
 */
function useBarItems() {
  const { items } = useMoreItems();
  const pathname = usePathname();
  const [shown, setShown] = useState(lastShown);
  const row = useRef<HTMLDivElement>(null);
  const extra = useRef<HTMLDivElement>(null);
  const more = useRef<HTMLDivElement>(null);
  const right = useRef<HTMLDivElement>(null);
  const ruler = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the page (the active, bolder link) or the list changes
  useEffect(() => {
    const measure = () => {
      const [m, e, r, w] = [more.current, extra.current, right.current, ruler.current];
      // The bar is hidden on phones and tablets.
      if (!m || !e || !r || !w || m.offsetParent === null) return;
      const room =
        r.getBoundingClientRect().left -
        m.getBoundingClientRect().right +
        e.getBoundingClientRect().width -
        BAR_MARGIN;
      let n = 0;
      let used = 0;
      for (const child of w.children) {
        const width = child.getBoundingClientRect().width;
        if (used + width > room) break;
        used += width;
        n++;
      }
      lastShown = n;
      setShown(n);
    };
    measure();
    const observer = new ResizeObserver(measure);
    for (const el of [row.current, right.current, ruler.current]) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [pathname, items.length]);

  const skip = new Set(items.slice(0, shown).map((i) => i.label));
  return { items, shown, skip, row, extra, more, right, ruler };
}

/**
 * The "Mais" panel, shared by the computer's dropdown and the phone's sheet. `skip`: items the
 * computer's bar already shows by themselves (see `useBarItems`), not repeated here.
 */
function MoreContent({
  onPick,
  skip,
  phone = false,
}: {
  onPick: () => void;
  skip?: ReadonlySet<string>;
  /** The phone's sheet: some items have a phone name, and Polymarket (not in its bar) leads. */
  phone?: boolean;
}) {
  const active = useActive();
  const groups = useMoreItems()
    .groups.map((g) => ({ ...g, items: g.items.filter((i) => !skip?.has(i.label)) }))
    .filter((g) => g.items.length > 0);
  const current = (i: MoreItem) => (i.path && active(i.path) ? 'page' : undefined);
  const row =
    'flex min-h-14 items-center gap-3 px-3 py-2 hover:bg-surface-2 aria-[current=page]:bg-surface-2/60';
  return (
    <div className="grid gap-4 [&>*]:min-w-0">
      {phone && <PolymarketCard onPick={onPick} />}
      {groups.map((g, gi) => (
        <section key={g.title} aria-label={g.title}>
          <p className="mb-1.5 px-1 text-[11.5px] font-medium uppercase tracking-wider text-muted">
            {g.title}
          </p>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {g.items.map((item) => (
              <li key={item.label}>
                <Link href={item.to} onClick={onPick} aria-current={current(item)} className={row}>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-2">
                    <item.icon />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium leading-tight">
                      {(phone && item.phoneLabel) || item.label}
                    </span>
                    {item.hint && (
                      <span className="block truncate text-[12.5px] text-muted">
                        {(phone && item.phoneHint) || item.hint}
                      </span>
                    )}
                  </span>
                  <IconChevron width={15} height={15} className="shrink-0 text-muted" />
                </Link>
              </li>
            ))}
            {/* Sharing the site closes the last group. */}
            {gi === groups.length - 1 && (
              <>
                <li>
                  <ShareSiteItem />
                </li>
                <li>
                  <a href={AUTHOR} target="_blank" rel="noopener" className={row}>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2">
                      <AuthorMark />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium leading-tight">
                        Desenvolvido por <AuthorLogo className="text-[15px] font-semibold" />
                      </span>
                      <span className="block truncate text-[12.5px] text-muted">
                        Veja mais sobre o meu trabalho
                      </span>
                    </span>
                    <span aria-hidden className="shrink-0 text-[15px] text-muted">
                      ↗
                    </span>
                  </a>
                </li>
              </>
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}

/**
 * Polymarket's own card at the top of the phone's "Mais", in its blue, with the two chances live
 * (read from Polymarket in the reader's browser; without them, the card is still there).
 */
function PolymarketCard({ onPick }: { onPick: () => void }) {
  const { data } = usePolymarket();
  const [a, b] = data?.winner ?? [];
  return (
    <Link
      href="/polymarket"
      onClick={onPick}
      className="flex items-center gap-3 rounded-xl border border-[#1652f0]/40 bg-[#1652f0]/10 p-3 hover:bg-[#1652f0]/15"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1652f0] text-white">
        <IconPolymarket width={22} height={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[15.5px] font-semibold leading-tight">
          Polymarket
          <span className="rounded bg-bad/15 px-1.5 py-px text-[10.5px] font-semibold uppercase tracking-wide text-bad">
            ao vivo
          </span>
        </span>
        {a && b ? (
          <span className="mt-0.5 flex min-w-0 items-center gap-2 text-[13px] text-ink-2">
            {[a, b].map((o, i) => (
              // The shorter name never gives way first ("Lula" stays whole on a small phone).
              <span
                key={o.name}
                className={`flex items-center gap-1 ${shortName(o.name).length > shortName((i ? a : b).name).length ? 'min-w-0' : 'shrink-0'}`}
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: colorOf(o.name, i) }}
                  aria-hidden
                />
                <span className="truncate">{shortName(o.name)}</span>
                <span className="numeral font-semibold text-ink">{Math.round(o.price * 100)}%</span>
              </span>
            ))}
          </span>
        ) : (
          <span className="block text-[12.5px] text-muted">As apostas da eleição</span>
        )}
      </span>
      <IconChevron width={15} height={15} className="shrink-0 text-muted" />
    </Link>
  );
}

/**
 * Logo and name, with the author's credit ("by lucianookdp") as a small second line under the name: seen on every
 * page, but taking no room of its own (the header is the same height with or without it).
 */
function Brand({ to }: { to: string }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <Link href={to} tabIndex={-1} aria-hidden>
        <Logo size={24} />
      </Link>
      <div className="flex flex-col leading-none">
        <Link
          href={to}
          aria-label="Eleições Brasil — resultados"
          className="whitespace-nowrap text-[16px] font-semibold tracking-tight"
        >
          Eleições Brasil
        </Link>
        <a
          href={AUTHOR}
          target="_blank"
          rel="noopener"
          className="mt-[3px] flex items-center gap-[3px] whitespace-nowrap text-[9.5px] text-muted hover:text-ink"
        >
          by <AuthorLogo className="text-[10px] font-medium text-ink-2" />
        </a>
      </div>
    </div>
  );
}

/**
 * One clear bar, like the big news sites' election pages. Computers: brand, the 1st/2nd round as
 * two buttons, the main sections, "Mais" for the rest, search, status, theme. Phones: brand and
 * status on top, the round buttons right under it (sections live in the bottom bar).
 */
function Header({ onSearch }: { onSearch: () => void }) {
  const pathname = usePathname();
  const { round, href, elections } = useRound();
  const active = useActive();
  // Only worth a control when there is a choice to make (two rounds, or another election).
  const choice =
    elections.length > 1 || (elections.find((e) => e.slug === round.electionSlug)?.rounds.length ?? 0) > 1;
  const barLink =
    'flex h-16 items-center whitespace-nowrap border-b-2 border-transparent px-2.5 text-[15px] text-ink-2 hover:text-ink aria-[current=page]:border-live aria-[current=page]:font-medium aria-[current=page]:text-ink';
  const link = (n: (typeof NAV)[number]) => (
    <Link
      key={n.path}
      href={href(n.path)}
      aria-current={active(n.path) ? 'page' : undefined}
      className={barLink}
    >
      {n.short}
    </Link>
  );
  const bar = useBarItems();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ground/90 backdrop-blur supports-[backdrop-filter]:bg-ground/75">
      <div ref={bar.row} className="mx-auto flex h-14 max-w-[1320px] items-center gap-3 px-4 sm:px-6 xl:h-16">
        <Brand to={href()} />
        {choice && (
          <div className="hidden xl:block">
            <RoundSwitch />
          </div>
        )}
        <nav aria-label="Seções" className="ml-1 hidden shrink-0 items-center xl:flex">
          {NAV.map(link)}
          {/* Items of "Mais" that fit in the bar, in the author's order (see useBarItems). */}
          <div ref={bar.extra} className="flex items-center">
            {bar.items.slice(0, bar.shown).map((i) => (
              <Link
                key={i.label}
                href={i.to}
                aria-current={i.path && active(i.path) ? 'page' : undefined}
                className={barLink}
              >
                {i.short ?? i.label}
              </Link>
            ))}
          </div>
          {/* Polymarket last but one, then "Mais" at the very end. Measured together (useBarItems). */}
          <div ref={bar.more} className="flex items-center">
            <Link
              href="/polymarket"
              aria-current={pathname.startsWith('/polymarket') ? 'page' : undefined}
              className={barLink}
            >
              Polymarket
            </Link>
            <MoreMenu skip={bar.skip} />
          </div>
        </nav>
        {/* Invisible copies of those items, only to know how wide each one is. */}
        {/* In a box of no size (hidden, it would still widen the page on phones). */}
        <div
          aria-hidden
          className="pointer-events-none invisible absolute left-0 top-0 hidden size-0 overflow-hidden xl:block"
        >
          <div ref={bar.ruler} className="flex w-max">
            {bar.items.map((i) => (
              <span key={i.label} className={barLink}>
                {i.short ?? i.label}
              </span>
            ))}
          </div>
        </div>
        <div ref={bar.right} className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onSearch}
            aria-label="Buscar"
            className="hidden h-10 items-center gap-2 rounded-full border border-line px-3.5 text-[14px] text-muted hover:border-line-strong hover:text-ink md:flex"
          >
            <IconSearch />
            <span className="hidden 2xl:inline">Buscar</span>
          </button>
          <LiveStatus key={round.slug} />
          <ThemeToggle className="flex" />
        </div>
      </div>
      {/* Phones and tablets: the round buttons get their own full-width row. */}
      {choice && (
        <div className="border-t border-line/60 px-4 py-2 sm:px-6 xl:hidden">
          <RoundSwitch wide />
        </div>
      )}
    </header>
  );
}

/**
 * 1st round / 2nd round as two buttons (keeps the current section). With a single round so far, a
 * plain label. The demo (local only) adds a small election picker.
 */
function RoundSwitch({ wide = false }: { wide?: boolean }) {
  const { round, elections } = useRound();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const election = elections.find((e) => e.slug === round.electionSlug);
  const rounds = election?.rounds ?? [round];
  const go = (electionSlug: string, turno: number) => {
    const next = new URLSearchParams(params.toString());
    next.set('e', electionSlug);
    next.set('t', String(turno));
    router.push(`${pathname}?${next.toString()}`);
  };
  const date = (d: string) => SHORT_DATE.format(new Date(`${d}T12:00:00Z`));
  const others = elections.filter((e) => e.slug !== round.electionSlug);
  return (
    <div className={`flex items-center gap-2 ${wide ? 'w-full' : ''}`}>
      {others.length > 0 && (
        <label className="relative shrink-0">
          <span className="sr-only">Eleição</span>
          <select
            value={round.electionSlug}
            onChange={(e) => go(e.target.value, 1)}
            className="h-9 max-w-[7.5rem] cursor-pointer appearance-none text-ellipsis rounded-full border border-line bg-surface py-0 pl-3 pr-7 text-[13px] font-medium sm:max-w-none"
          >
            {elections.map((e) => (
              <option key={e.slug} value={e.slug}>
                {e.demo ? 'Demonstração' : e.year}
              </option>
            ))}
          </select>
          <span
            aria-hidden
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted"
          >
            ▾
          </span>
        </label>
      )}
      <div
        role="radiogroup"
        aria-label="Turno"
        className={`flex min-w-0 rounded-full border border-line bg-surface p-0.5 ${wide ? 'flex-1' : ''}`}
      >
        {rounds.map((r) => (
          <button
            key={r.slug}
            type="button"
            role="radio"
            aria-checked={r.slug === round.slug}
            onClick={() => r.slug !== round.slug && go(r.electionSlug, r.round)}
            className={`h-9 whitespace-nowrap rounded-full text-[14px] text-ink-2 aria-checked:bg-surface-2 aria-checked:font-semibold aria-checked:text-ink ${wide ? 'flex-1' : ''} ${wide && others.length > 0 ? 'px-2' : 'px-3.5'}`}
          >
            {r.round}º turno
            {/* Phones and tablets only (on computers the bar's room goes to the sections), and only
                when the election picker is not beside it: together they do not fit a phone. */}
            {wide && others.length === 0 && (
              <span className="ml-1.5 text-[12.5px] font-normal text-muted">{date(r.date)}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

const SHORT_DATE = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** "Mais ▾" on computers: the same panel as the phone's sheet, as a dropdown. */
function MoreMenu({ skip }: { skip: ReadonlySet<string> }) {
  const active = useActive();
  const items = useMoreItems().items.filter((i) => !skip.has(i.label));
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  // Closes on any tap or click outside, and on Esc.
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  const current = items.some((i) => i.path && active(i.path));
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-16 items-center gap-1 whitespace-nowrap border-b-2 px-2.5 text-[15px] hover:text-ink ${current ? 'border-live font-medium text-ink' : 'border-transparent text-ink-2'}`}
      >
        Mais
        <IconChevron
          width={14}
          height={14}
          className={`transition-transform ${open ? '-rotate-90' : 'rotate-90'}`}
        />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-1 w-[340px] rounded-2xl border border-line-strong bg-surface p-3 shadow-2xl">
          <MoreContent onPick={() => setOpen(false)} skip={skip} />
        </div>
      )}
    </div>
  );
}

/** Pages that show their own, more specific notice (their state's numbers, the headline votes). */
const OWN_NOTICE = ['/eleicao', '/eleicao/estado', '/eleicao/bastidores', '/eleicao/telao'];

/**
 * Every other election page (cities, states list, Poderes, Comparar…) gets the country-wide notice
 * too: "Aguardando o TSE", "Dados atrasados" or "sem conexão" must never depend on the page.
 */
function GlobalFreshness() {
  const { round } = useRound();
  const { data } = useOverview(round.slug);
  const pathname = usePathname().replace(/\/$/, '');
  if (!data || !pathname.startsWith('/eleicao') || OWN_NOTICE.includes(pathname)) return null;
  return (
    <FreshnessNotice ingestion={data.ingestion} progress={data.progress} roundStatus={data.round.status} />
  );
}

/** The header status: what the data is doing right now, in words and colour. */
function LiveStatus() {
  const { round } = useRound();
  const { connection } = useRealtime();
  const { data } = useOverview(round.slug);
  const updated = data?.progress?.updatedAt ?? null;
  const ingestion = data?.ingestion.state;
  const isReplay = round.environment === 'replay';
  // The overview follows the live stream; the election list only refreshes every minute.
  const status = data?.round.status ?? round.status;
  const stall = useTseStall({
    ingestion: data?.ingestion,
    progress: data?.progress,
    roundStatus: status,
    votesAt: data?.headline?.provenance?.retrievedAt ?? null,
  });

  let tone: 'live' | 'warn' | 'muted' | 'ink' = 'muted';
  let label = 'Aguardando';
  if (connection === 'offline') {
    tone = 'muted';
    label = 'Sem conexão';
  } else if (status === 'final') {
    tone = 'ink';
    label = isReplay ? 'Reprodução encerrada' : 'Encerrada';
  } else if (status === 'live') {
    if (connection === 'reconnecting') {
      tone = 'warn';
      label = 'Reconectando';
    } else if (ingestion === 'degraded' || ingestion === 'offline') {
      tone = 'warn';
      label = 'Dados atrasados';
    } else if (stall) {
      // The TSE has gone quiet: not "Ao vivo" in red while nothing arrives (see useTseStall).
      tone = 'warn';
      label = 'Aguardando o TSE';
    } else {
      tone = 'live';
      label = isReplay ? 'Reprodução' : 'Ao vivo';
    }
  }
  // "Ao vivo" in red, like TV and news sites; the site's green stays for highlights.
  const color = { live: 'text-bad', warn: 'text-warn', muted: 'text-muted', ink: 'text-ink-2' }[tone];
  return (
    <div className="flex items-center gap-2 text-[13px]" role="status" aria-live="polite">
      <span className={`flex items-center gap-1.5 whitespace-nowrap font-medium ${color}`}>
        <span
          className={`inline-block size-2 rounded-full bg-current ${tone === 'live' ? 'pulse-dot' : ''}`}
          aria-hidden
        />
        {label}
      </span>
      {updated && status !== 'scheduled' && (
        <span className="hidden whitespace-nowrap text-muted md:inline">
          <span className="sr-only">Última atualização às </span>
          <time dateTime={updated}>{formatClock(updated)}</time>
        </span>
      )}
    </div>
  );
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<string | null>(null);
  useEffect(() => setTheme(document.documentElement.dataset.theme ?? 'dark'), []);
  const next = theme === 'light' ? 'dark' : 'light';
  return (
    <button
      type="button"
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem('eleicoes:theme', next);
        } catch {}
        setTheme(next);
      }}
      className={`size-9 items-center justify-center rounded-md border border-line text-muted hover:border-line-strong hover:text-ink ${className}`}
      aria-label={theme === 'light' ? 'Usar tema escuro' : 'Usar tema claro'}
    >
      {theme === 'light' ? <IconMoon /> : <IconSun />}
    </button>
  );
}

function BottomNav({ onSearch }: { onSearch: () => void }) {
  const { href } = useRound();
  const active = useActive();
  const [more, setMore] = useState(false);
  // Five equal slots with search in the middle: two sections on each side.
  const item =
    'group flex min-h-16 min-w-0 flex-col items-center justify-center gap-0.5 truncate text-[10.5px] text-muted min-[360px]:text-[11.5px] aria-[current=page]:font-medium aria-[current=page]:text-ink';
  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-ground/95 pb-[env(safe-area-inset-bottom)] backdrop-blur xl:hidden"
      >
        {NAV.slice(0, 2).map((n) => (
          <Link
            key={n.path}
            href={href(n.path)}
            aria-current={active(n.path) ? 'page' : undefined}
            className={`${item} flex-1`}
          >
            <span className="flex size-8 items-center justify-center">
              <n.icon />
            </span>
            {n.short}
          </Link>
        ))}
        {/* The one action everybody looks for: centred, bigger and raised above the bar. */}
        <button
          type="button"
          onClick={onSearch}
          className={`${item} flex-1 overflow-visible font-medium text-ink`}
        >
          <span className="-mt-4 flex size-12 items-center justify-center rounded-full bg-live text-ground shadow-md shadow-black/25 ring-[3px] ring-ground">
            <IconSearch width={21} height={21} strokeWidth={2.1} />
          </span>
          Buscar
        </button>
        {NAV.slice(2, 3).map((n) => (
          <Link
            key={n.path}
            href={href(n.path)}
            aria-current={active(n.path) ? 'page' : undefined}
            className={`${item} flex-1`}
          >
            <span className="flex size-8 items-center justify-center">
              <n.icon />
            </span>
            {n.short}
          </Link>
        ))}
        <button type="button" onClick={() => setMore(true)} className={`${item} flex-1`} aria-expanded={more}>
          <span className="flex size-8 items-center justify-center">
            <IconMore />
          </span>
          Mais
        </button>
      </nav>
      {more && (
        <div
          className="fixed inset-0 z-40 xl:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mais opções"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Fechar"
            onClick={() => setMore(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto overscroll-contain rounded-t-3xl border-t border-line-strong bg-surface px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2 shadow-2xl">
            <div aria-hidden className="mx-auto mb-1 h-1 w-10 rounded-full bg-line-strong" />
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[17px] font-semibold">Mais</span>
              <button
                type="button"
                onClick={() => setMore(false)}
                className="p-2 text-muted"
                aria-label="Fechar"
              >
                <IconClose />
              </button>
            </div>
            <MoreContent onPick={() => setMore(false)} phone />
          </div>
        </div>
      )}
    </>
  );
}

function ShareSiteItem() {
  const [label, setLabel] = useState('Compartilhar o site');
  return (
    <button
      type="button"
      onClick={async () => {
        const r = await shareSite();
        if (r === 'copied') setLabel('Link copiado');
        if (r === 'failed') setLabel('Não foi possível compartilhar');
      }}
      className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface-2"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-2">
        <svg
          viewBox="0 0 24 24"
          width={18}
          height={18}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden
        >
          <path
            d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium leading-tight">{label}</span>
        <span className="block truncate text-[12.5px] text-muted">Mande o link para alguém</span>
      </span>
    </button>
  );
}

function Footer() {
  const { meta } = useRound();
  return <SiteFooter version={meta?.app.version} />;
}

const AUTHOR = 'https://lucianookdp.dev';

/**
 * The studio credit, as agencies sign the sites they make: "Desenvolvido por" and the author's
 * wordmark, the whole card one link to his site. At the very end of every page (the page is at
 * least a screen tall), apart from the data, so it never gets in the way of the results.
 */
function AuthorCard() {
  return (
    <a
      href={AUTHOR}
      target="_blank"
      rel="noopener"
      aria-label="Desenvolvido por lucianookdp, Luciano K. Dal Pai: veja mais sobre o meu trabalho (abre lucianookdp.dev)"
      className="group flex items-center gap-4 rounded-2xl border border-line bg-surface px-5 py-4 transition-colors hover:border-line-strong sm:px-6 sm:py-5"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          Desenvolvido por
        </span>
        <AuthorLogo className="mt-1.5 text-[28px] font-semibold text-ink sm:text-[32px]" />
        <span className="mt-0.5 block text-[11.5px] text-muted">Luciano K. Dal Pai</span>
        <span className="mt-2 block text-[13.5px] font-medium text-ink-2 transition-colors group-hover:text-ink">
          Veja mais sobre o meu trabalho
        </span>
      </span>
      <span className="hidden text-[14px] font-medium text-ink-2 transition-colors group-hover:text-ink md:inline">
        lucianookdp.dev
      </span>
      <span
        aria-hidden
        className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-ink-2 transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-ground"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          width={18}
          height={18}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        >
          <path d="M7 17 17 7M8 7h9v9" />
        </svg>
      </span>
    </a>
  );
}

/** Quiet footer: who made the site (AuthorCard), then the source and the help page. */
function SiteFooter({ version }: { version?: string }) {
  const links = (
    <>
      <Link href="/como-funciona" className="text-ink-2 underline underline-offset-2 hover:text-ink">
        Como funciona
      </Link>
    </>
  );
  return (
    <footer className="mt-6 pb-24 xl:pb-0">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
        <AuthorCard />
      </div>
      <div className="mx-auto mt-6 flex max-w-[1320px] flex-col gap-3 border-t border-line px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-4 md:py-6">
        <div className="max-w-2xl text-[13px] text-muted">
          {/* Phones: the name at the left, the version at the right, on one line. */}
          <p className="flex items-center justify-between gap-2 font-medium text-ink-2 md:justify-start">
            <span className="flex items-center gap-2">
              <Logo size={18} /> Eleições Brasil
            </span>
            <span className="font-mono text-[11.5px] font-normal text-muted">
              {version ? `v${version}` : ''}
            </span>
          </p>
          {/* Phones: the essential in two short lines; computers have room for the whole sentence. */}
          <p className="mt-1 text-[12.5px] leading-snug md:hidden">
            Dados oficiais do TSE. Site independente, sem vínculo com a Justiça Eleitoral.
          </p>
          <p className="mt-1.5 text-[12.5px] md:hidden">{links}</p>
          <p className="mt-1.5 hidden leading-relaxed md:block">
            Dados oficiais do Tribunal Superior Eleitoral (TSE). Site independente, sem vínculo com a Justiça
            Eleitoral. Horários de Brasília. {links}
          </p>
        </div>
      </div>
    </footer>
  );
}

/**
 * The author's wordmark, as on lucianookdp.dev: "lucian", an infinity sign for "oo", "kdp". Toned
 * down here: the text takes the surrounding grey and the infinity a softened site green.
 */
/** The infinity of the author's wordmark, alone (an icon). */
function AuthorMark() {
  return (
    <svg aria-hidden viewBox="4 4 92 42" width={20} height={10}>
      <path d={INFINITY} fill="none" stroke="var(--live)" strokeWidth={11} strokeLinecap="round" />
    </svg>
  );
}

const INFINITY =
  'M 25 10 C 10 10 10 40 25 40 C 35 40 40 30 50 25 C 60 20 65 10 75 10 C 90 10 90 40 75 40 C 65 40 60 30 50 25 C 40 20 35 10 25 10 Z';

export function AuthorLogo({ className }: { className: string }) {
  return (
    <span
      className={`inline-flex items-center tracking-tight ${className}`}
      role="img"
      aria-label="lucianookdp"
    >
      <span aria-hidden>lucian</span>
      <svg aria-hidden viewBox="4 4 92 42" className="mx-[-0.015em] h-[0.62em] w-auto translate-y-[0.02em]">
        <path
          d={INFINITY}
          fill="none"
          stroke="var(--live)"
          strokeOpacity={0.7}
          strokeWidth={11}
          strokeLinecap="round"
        />
      </svg>
      <span aria-hidden>kdp</span>
    </span>
  );
}

/**
 * Header and footer without an election: used while the election list loads, when the API is
 * unreachable, and for pages that must render even then (about, how it works).
 */
export function BasicShell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-ground/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-3 px-4 sm:px-6">
          <Brand to="/" />
          <nav aria-label="Seções" className="ml-auto flex items-center gap-1 text-[14px]">
            <Link href="/" className="rounded-md px-2.5 py-1.5 text-ink-2 hover:bg-surface-2 hover:text-ink">
              Apuração
            </Link>
            <ThemeToggle className="flex" />
          </nav>
        </div>
      </header>
      <main id="conteudo" className="mx-auto min-h-dvh w-full max-w-[1320px] px-4 pb-16 pt-5 sm:px-6">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
