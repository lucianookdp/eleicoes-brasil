'use client';

import type { ApiMeta, ElectionSummary, RoundSummary } from '@eleicoes/election-core';
import { formatClock } from '@eleicoes/election-core';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { countVisit } from '@/lib/api';
import { useOverview } from '@/lib/queries';
import { RealtimeProvider, useRealtime } from '@/lib/realtime';
import { electionHref, pickRound, SECTION_ROUTES } from '@/lib/rounds';
import {
  IconChevron,
  IconClose,
  IconCompare,
  IconData,
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
  IconSeats,
  IconStar,
  IconStates,
  IconSun,
  IconTv,
  Logo,
} from './icons';
import { SearchPalette } from './search';
import { shareSite } from './share-button';

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
        <main id="conteudo" className="mx-auto w-full max-w-[1320px] px-4 pb-28 pt-5 sm:px-6 xl:pb-12">
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
  return (path: string) => SECTION_ROUTES[path]?.replace(/\/$/, '') === pathname;
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
};

/** What "Mais" holds, by importance: the most used as big tiles, then a list. */
function useMoreItems() {
  const { href, meta, round } = useRound();
  // The order the author chose: the big tiles first, then the list.
  const tiles: MoreItem[] = [
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
      to: href('/benches'),
      path: '/benches',
      label: 'Bancadas',
      hint: 'Cadeiras de cada partido no Congresso',
      icon: IconSeats,
    },
    {
      to: href('/historico'),
      path: '/historico',
      label: 'Linha do tempo',
      hint: 'A apuração passo a passo',
      icon: IconHistory,
    },
    {
      to: href('/favorites'),
      path: '/favorites',
      label: 'Favoritos',
      hint: 'Seus estados e cidades, ao vivo',
      icon: IconStar,
    },
  ];
  // Runoff night: the seats in Congress are a 1st-round result, so they go last (and the bar's
  // room goes to what changes tonight).
  if (round.round === 2) {
    const i = tiles.findIndex((t) => t.path === '/benches');
    if (i >= 0) tiles.push(...tiles.splice(i, 1));
  }
  // Sharing the site comes last, after these (see MoreContent).
  const links: MoreItem[] = [
    { to: href('/tv'), path: '/tv', label: 'Modo telão', phoneLabel: 'Painel ao vivo', icon: IconTv },
    {
      to: href('/operations'),
      path: '/operations',
      label: 'Transparência da apuração',
      short: 'Transparência',
      icon: IconPulse,
    },
    { to: '/como-funciona', label: 'Como funciona', icon: IconHelp },
    { to: '/sobre', label: 'Sobre os dados', icon: IconData },
  ];
  return { tiles, links };
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
  const { tiles, links } = useMoreItems();
  const items = [...tiles, ...links];
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
  /** The phone's sheet: some items have a phone name. */
  phone?: boolean;
}) {
  const active = useActive();
  const all = useMoreItems();
  const tiles = all.tiles.filter((t) => !skip?.has(t.label));
  const links = all.links.filter((l) => !skip?.has(l.label));
  const current = (i: MoreItem) => (i.path && active(i.path) ? 'page' : undefined);
  return (
    <div className="grid gap-3">
      <ul className={`grid grid-cols-2 gap-2 ${tiles.length === 0 ? 'hidden' : ''}`}>
        {tiles.map((t) => (
          <li key={t.label} className="odd:last:col-span-2">
            <Link
              href={t.to}
              onClick={onPick}
              aria-current={current(t)}
              className="flex h-full flex-col gap-2.5 rounded-xl border border-line bg-surface-2/50 p-3 transition-colors hover:border-line-strong hover:bg-surface-2 aria-[current=page]:border-live/60"
            >
              <span className="flex size-8 items-center justify-center rounded-lg border border-line bg-surface text-ink-2">
                <t.icon />
              </span>
              <span>
                <span className="block text-[14.5px] font-medium leading-tight text-ink">{t.label}</span>
                <span className="mt-0.5 block text-[12px] leading-snug text-muted">{t.hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.to}
              onClick={onPick}
              aria-current={current(l)}
              className="flex min-h-11 items-center gap-3 px-3 text-[14.5px] text-ink-2 hover:bg-surface-2 hover:text-ink aria-[current=page]:font-medium aria-[current=page]:text-ink"
            >
              <l.icon className="shrink-0 text-muted" />
              <span className="flex-1">{(phone && l.phoneLabel) || l.label}</span>
              <IconChevron width={15} height={15} className="text-muted" />
            </Link>
          </li>
        ))}
        <li>
          <ShareSiteItem />
        </li>
      </ul>
    </div>
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
          href="https://lucianookdp.dev"
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
            className="h-9 cursor-pointer appearance-none rounded-full border border-line bg-surface py-0 pl-3 pr-7 text-[13px] font-medium"
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
        className={`flex rounded-full border border-line bg-surface p-0.5 ${wide ? 'flex-1' : ''}`}
      >
        {rounds.map((r) => (
          <button
            key={r.slug}
            type="button"
            role="radio"
            aria-checked={r.slug === round.slug}
            onClick={() => r.slug !== round.slug && go(r.electionSlug, r.round)}
            className={`h-9 whitespace-nowrap rounded-full px-3.5 text-[14px] text-ink-2 aria-checked:bg-surface-2 aria-checked:font-semibold aria-checked:text-ink ${wide ? 'flex-1' : ''}`}
          >
            {r.round}º turno
            {/* Phones and tablets only: on computers the bar's room goes to the sections. */}
            {wide && <span className="ml-1.5 text-[12.5px] font-normal text-muted">{date(r.date)}</span>}
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
  const all = useMoreItems();
  const tiles = all.tiles.filter((t) => !skip.has(t.label));
  const links = all.links.filter((l) => !skip.has(l.label));
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
  const current = [...tiles, ...links].some((i) => i.path && active(i.path));
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
  const pathname = usePathname();
  const active = useActive();
  const [more, setMore] = useState(false);
  // Search and Mais have short names: their slots give a little room to the others.
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
        <button type="button" onClick={onSearch} className={`${item} flex-[0.8]`}>
          <span className="flex size-8 items-center justify-center rounded-full bg-live text-ground">
            <IconSearch />
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
        {/* Polymarket last but one: it is not the count; "Mais" closes the bar. */}
        <Link
          href="/polymarket"
          aria-current={pathname.startsWith('/polymarket') ? 'page' : undefined}
          className={`${item} flex-1`}
        >
          <span className="flex size-8 items-center justify-center">
            <IconPolymarket />
          </span>
          Polymarket
        </Link>
        <button
          type="button"
          onClick={() => setMore(true)}
          className={`${item} flex-[0.8]`}
          aria-expanded={more}
        >
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
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-line-strong bg-surface px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2 shadow-2xl">
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
      className="flex min-h-11 w-full items-center gap-3 px-3 text-left text-[14.5px] text-ink-2 hover:bg-surface-2 hover:text-ink"
    >
      <svg
        className="shrink-0 text-muted"
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
      {label}
    </button>
  );
}

function Footer() {
  const { meta } = useRound();
  return <SiteFooter version={meta?.app.version} />;
}

/** Quiet footer: the source and the two help pages; the author's credit as one small line. */
function SiteFooter({ version }: { version?: string }) {
  return (
    <footer className="mt-6 border-t border-line pb-24 xl:pb-0">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl text-[13px] text-muted">
          <p className="flex items-center gap-2 font-medium text-ink-2">
            <Logo size={18} /> Eleições Brasil
            <span className="font-mono text-[11.5px] font-normal text-muted">
              {version ? `v${version}` : ''}
            </span>
          </p>
          <p className="mt-1.5 leading-relaxed">
            Dados oficiais do Tribunal Superior Eleitoral (TSE). Site independente, sem vínculo com a Justiça
            Eleitoral. Horários de Brasília.{' '}
            <Link href="/como-funciona" className="text-ink-2 underline underline-offset-2 hover:text-ink">
              Como funciona
            </Link>
            {' · '}
            <Link href="/sobre" className="text-ink-2 underline underline-offset-2 hover:text-ink">
              Sobre os dados
            </Link>
          </p>
        </div>
        {/* The author's credit. Phones: one quiet line. Bigger screens: a button that says what it
            opens (the author's other projects). */}
        <a
          href="https://lucianookdp.dev"
          target="_blank"
          rel="noopener"
          className="group flex shrink-0 items-center gap-1 text-[12px] text-muted hover:text-ink md:gap-2.5 md:rounded-full md:border md:border-line md:bg-surface md:py-1.5 md:pl-4 md:pr-1.5 md:text-[13px] md:transition-colors md:hover:border-line-strong"
        >
          <span className="md:hidden">by</span>
          <span className="hidden md:inline">Desenvolvido por</span>
          <AuthorLogo className="font-medium text-ink-2 md:text-[14.5px] md:text-ink" />
          <span className="hidden items-center gap-1 rounded-full bg-surface-2 px-3 py-1 text-[12.5px] font-medium text-ink-2 transition-colors group-hover:bg-ink group-hover:text-ground md:inline-flex">
            Ver projetos <span aria-hidden>↗</span>
          </span>
        </a>
      </div>
    </footer>
  );
}

/**
 * The author's wordmark, as on lucianookdp.dev: "lucian", an infinity sign for "oo", "kdp". Toned
 * down here: the text takes the surrounding grey and the infinity a softened site green.
 */
function AuthorLogo({ className }: { className: string }) {
  return (
    <span
      className={`inline-flex items-center tracking-tight ${className}`}
      role="img"
      aria-label="lucianookdp"
    >
      <span aria-hidden>lucian</span>
      <svg aria-hidden viewBox="4 4 92 42" className="mx-[-0.015em] h-[0.62em] w-auto translate-y-[0.02em]">
        <path
          d="M 25 10 C 10 10 10 40 25 40 C 35 40 40 30 50 25 C 60 20 65 10 75 10 C 90 10 90 40 75 40 C 65 40 60 30 50 25 C 40 20 35 10 25 10 Z"
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
      <main id="conteudo" className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-5 sm:px-6">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
