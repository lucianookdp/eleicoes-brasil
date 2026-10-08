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
  IconClose,
  IconCompare,
  IconHistory,
  IconInfo,
  IconMoon,
  IconMore,
  IconOverview,
  IconPerson,
  IconPulse,
  IconSearch,
  IconSeats,
  IconStar,
  IconStates,
  IconSun,
  IconTrend,
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
  const pathname = usePathname();

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
        {round.demo && pathname.startsWith('/eleicao') && (
          <div
            className="border-b border-warn/30 bg-warn-soft px-4 py-1.5 text-center text-[13px] text-warn"
            role="note"
          >
            Eleição de demonstração, com candidatos e partidos fictícios. Estes números não são resultados
            reais.
          </div>
        )}
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
 * The main sections: in the computer's bar and (the first three, with `short` labels) in the phone's
 * bottom bar. Everything else lives under "Mais" (`useMoreGroups`).
 */
const NAV = [
  { path: '', label: 'Resultados', short: 'Resultados', icon: IconOverview },
  { path: '/states', label: 'Estados e cidades', short: 'Estados', icon: IconStates },
  { path: '/offices', label: 'Governadores e senadores', short: 'Governadores', icon: IconPerson },
  { path: '/benches', label: 'Bancadas', short: 'Bancadas', icon: IconSeats },
];

/** The state-offices section says what is actually disputed: in a runoff, only governors. */
function navText(n: (typeof NAV)[number], round: number) {
  if (n.path !== '/offices') return n;
  return round === 2
    ? { label: 'Governadores', short: 'Governadores' }
    : { label: 'Governadores e senadores', short: 'Gov./Senado' };
}

function useActive() {
  const pathname = usePathname().replace(/\/$/, '');
  return (path: string) => SECTION_ROUTES[path]?.replace(/\/$/, '') === pathname;
}

/**
 * Everything beyond the main sections, in three labelled groups. The same list feeds the
 * computer's "Mais" dropdown and the phone's "Mais" sheet, so both menus read alike.
 */
function useMoreGroups() {
  const { href, meta } = useRound();
  type Item = { to: string; label: string; icon: typeof IconInfo; path?: string };
  const groups: { title: string; items: Item[] }[] = [
    {
      title: 'Apuração',
      items: [
        { to: href('/benches'), path: '/benches', label: 'Bancadas eleitas', icon: IconSeats },
        ...(meta?.features.comparison === false
          ? []
          : [{ to: href('/compare'), path: '/compare', label: 'Comparar estados', icon: IconCompare }]),
        { to: `${href()}#favoritos`, label: 'Favoritos', icon: IconStar },
      ],
    },
    {
      title: 'Acompanhe',
      items: [
        { to: href('/historico'), path: '/historico', label: 'Linha do tempo', icon: IconHistory },
        { to: '/polymarket', label: 'Mercado de apostas', icon: IconTrend },
      ],
    },
    {
      title: 'Sobre o site',
      items: [
        { to: '/como-funciona', label: 'Como funciona', icon: IconInfo },
        { to: '/sobre', label: 'Sobre os dados', icon: IconInfo },
        { to: href('/operations'), path: '/operations', label: 'Bastidores da coleta', icon: IconPulse },
      ],
    },
  ];
  return groups;
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
          className="mt-[3px] flex items-center gap-1 whitespace-nowrap text-[11px] text-muted hover:text-ink"
        >
          by <AuthorLogo className="text-[11.5px] font-medium text-ink-2" />
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
  const { round, href, elections } = useRound();
  const active = useActive();
  // Only worth a control when there is a choice to make (two rounds, or another election).
  const choice =
    elections.length > 1 || (elections.find((e) => e.slug === round.electionSlug)?.rounds.length ?? 0) > 1;
  const link = (n: (typeof NAV)[number]) => (
    <Link
      key={n.path}
      href={href(n.path)}
      aria-current={active(n.path) ? 'page' : undefined}
      className="flex h-16 items-center whitespace-nowrap border-b-2 border-transparent px-2.5 text-[15px] text-ink-2 hover:text-ink aria-[current=page]:border-live aria-[current=page]:font-medium aria-[current=page]:text-ink"
    >
      {/* Short names until there is room for the full ones. */}
      <span className="2xl:hidden">{navText(n, round.round).short}</span>
      <span className="hidden 2xl:inline">{navText(n, round.round).label}</span>
    </Link>
  );
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ground/90 backdrop-blur supports-[backdrop-filter]:bg-ground/75">
      <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-3 px-4 sm:px-6 xl:h-16">
        <Brand to={href()} />
        {choice && (
          <div className="hidden xl:block">
            <RoundSwitch />
          </div>
        )}
        <nav aria-label="Seções" className="ml-1 hidden shrink-0 items-center xl:flex">
          {NAV.map(link)}
          <MoreMenu />
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2">
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
            <span
              className={`ml-1.5 text-[12.5px] font-normal text-muted ${wide ? '' : 'hidden 2xl:inline'}`}
            >
              {date(r.date)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

const SHORT_DATE = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** "Mais ▾": the sections people use less, grouped, without a second row. */
function MoreMenu() {
  const active = useActive();
  const groups = useMoreGroups().map((g) => ({
    ...g,
    items: g.items.filter((i) => i.path !== '/benches'),
  }));
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
  const current = groups.some((g) => g.items.some((i) => i.path && active(i.path)));
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-16 items-center gap-1 whitespace-nowrap border-b-2 px-2.5 text-[15px] hover:text-ink ${current ? 'border-live font-medium text-ink' : 'border-transparent text-ink-2'}`}
      >
        Mais{' '}
        <span aria-hidden className={`text-[11px] transition-transform ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-1 w-64 rounded-xl border border-line-strong bg-surface p-1.5 shadow-xl">
          {groups.map((g, i) => (
            <div key={g.title} className={i ? 'mt-1 border-t border-line pt-1' : ''}>
              <p className="px-3 pb-0.5 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted">
                {g.title}
              </p>
              <ul>
                {g.items.map((n) => (
                  <li key={n.label}>
                    <Link
                      href={n.to}
                      onClick={() => setOpen(false)}
                      aria-current={n.path && active(n.path) ? 'page' : undefined}
                      className="flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-[14.5px] text-ink-2 hover:bg-surface-2 hover:text-ink aria-[current=page]:font-medium aria-[current=page]:text-ink"
                    >
                      <n.icon width={17} height={17} />
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
  const { round, href } = useRound();
  const active = useActive();
  const groups = useMoreGroups();
  const [more, setMore] = useState(false);
  const moreLink = (l: { to: string; label: string; icon: typeof IconInfo }) => (
    <li key={l.label}>
      <Link
        href={l.to}
        onClick={() => setMore(false)}
        className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-[16px] hover:bg-surface-2"
      >
        <l.icon />
        {l.label}
      </Link>
    </li>
  );
  const item =
    'flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 text-[12px] text-muted aria-[current=page]:font-medium aria-[current=page]:text-ink';
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
            className={item}
          >
            <span className="flex size-8 items-center justify-center">
              <n.icon />
            </span>
            {navText(n, round.round).short}
          </Link>
        ))}
        <button type="button" onClick={onSearch} className={item}>
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
            className={item}
          >
            <span className="flex size-8 items-center justify-center">
              <n.icon />
            </span>
            {navText(n, round.round).short}
          </Link>
        ))}
        <button type="button" onClick={() => setMore(true)} className={item} aria-expanded={more}>
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
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-line bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold">Mais</span>
              <button
                type="button"
                onClick={() => setMore(false)}
                className="p-2 text-muted"
                aria-label="Fechar"
              >
                <IconClose />
              </button>
            </div>
            {/* Same groups as the computer's "Mais"; sharing and the author come last. */}
            <ul className="grid gap-1">
              {groups.map((g, i) => (
                <li key={g.title} className={i ? 'mt-1 border-t border-line pt-1' : ''}>
                  <p className="px-3 pb-0.5 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted">
                    {g.title}
                  </p>
                  <ul>{g.items.map(moreLink)}</ul>
                </li>
              ))}
              <li className="mt-1 border-t border-line pt-1">
                <ShareSiteItem />
              </li>
              <li className="mt-2 border-t border-line pt-3">
                <a
                  href="https://lucianookdp.dev"
                  target="_blank"
                  rel="noopener"
                  className="flex min-h-10 items-center gap-1.5 px-3 text-[13.5px] text-muted hover:text-ink"
                >
                  Feito por <AuthorLogo /> <span aria-hidden>→</span>
                </a>
              </li>
            </ul>
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
      className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left hover:bg-surface-2"
    >
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
        <a
          href="https://lucianookdp.dev"
          target="_blank"
          rel="noopener"
          className="flex shrink-0 items-center gap-1 text-[12px] text-muted hover:text-ink"
        >
          Feito por <AuthorLogo className="text-[12.5px] font-medium text-ink-2" />
        </a>
      </div>
    </footer>
  );
}

/** The author's wordmark, as on lucianookdp.dev: "lucian", an infinity sign for "oo", "kdp". */
function AuthorLogo({ className = 'text-[15px] font-semibold text-ink' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center tracking-tight ${className}`}
      role="img"
      aria-label="lucianookdp"
    >
      <span aria-hidden>lucian</span>
      <svg aria-hidden viewBox="4 4 92 42" className="mx-[-0.015em] h-[0.62em] w-auto translate-y-[0.02em]">
        <defs>
          <linearGradient id="author-infinity" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5fe3a1" />
            <stop offset="100%" stopColor="#22b573" />
          </linearGradient>
        </defs>
        <path
          d="M 25 10 C 10 10 10 40 25 40 C 35 40 40 30 50 25 C 60 20 65 10 75 10 C 90 10 90 40 75 40 C 65 40 60 30 50 25 C 40 20 35 10 25 10 Z"
          fill="none"
          stroke="url(#author-infinity)"
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
