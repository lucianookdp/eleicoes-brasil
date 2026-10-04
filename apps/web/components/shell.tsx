'use client';

import type { ApiMeta, ElectionSummary, RoundSummary } from '@eleicoes/election-core';
import { formatClock } from '@eleicoes/election-core';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
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
  IconPulse,
  IconSearch,
  IconStar,
  IconStates,
  IconSun,
  Logo,
} from './icons';
import { SearchPalette } from './search';

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
        <main id="conteudo" className="mx-auto w-full max-w-[1320px] px-4 pb-28 pt-5 sm:px-6 lg:pb-12">
          {children}
        </main>
        <Footer />
        <BottomNav onSearch={() => setSearchOpen(true)} />
        {searchOpen && <SearchPalette onClose={() => setSearchOpen(false)} />}
      </RealtimeProvider>
    </RoundCtx.Provider>
  );
}

const NAV = [
  { path: '', label: 'Resultados', icon: IconOverview },
  { path: '/states', label: 'Estados', icon: IconStates },
  { path: '/operations', label: 'Bastidores', icon: IconPulse },
  { path: '/historico', label: 'Linha do tempo', icon: IconHistory },
  { path: '/compare', label: 'Comparar', icon: IconCompare, flag: 'comparison' as const },
];

/** Hides sections switched off by feature flags (ENABLE_* on the API). */
function useNav() {
  const { meta } = useRound();
  return NAV.filter((n) => {
    const flag = 'flag' in n ? n.flag : undefined;
    return !flag || meta?.features[flag] !== false;
  });
}

function useActive() {
  const pathname = usePathname().replace(/\/$/, '');
  return (path: string) => SECTION_ROUTES[path]?.replace(/\/$/, '') === pathname;
}

function Header({ onSearch }: { onSearch: () => void }) {
  const { round, href } = useRound();
  const nav = useNav();
  const active = useActive();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ground/90 backdrop-blur supports-[backdrop-filter]:bg-ground/75">
      <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-3 px-4 sm:px-6">
        <Link
          href={href()}
          className="flex items-center gap-2 font-semibold tracking-tight"
          aria-label="Eleições Brasil — resultados"
        >
          <Logo />
          <span className="hidden sm:inline">Eleições Brasil</span>
        </Link>
        <ElectionSwitcher />
        <nav aria-label="Seções" className="ml-2 hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.path}
              href={href(n.path)}
              aria-current={active(n.path) ? 'page' : undefined}
              className="whitespace-nowrap rounded-md px-2.5 py-1.5 text-[14px] text-ink-2 hover:bg-surface-2 hover:text-ink aria-[current=page]:bg-surface-2 aria-[current=page]:text-ink"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LiveStatus key={round.slug} />
          <button
            type="button"
            onClick={onSearch}
            className="hidden h-9 items-center gap-2 rounded-md border border-line px-2.5 text-[13px] text-muted hover:border-line-strong hover:text-ink sm:flex"
          >
            <IconSearch />
            <span className="lg:hidden xl:inline">Buscar</span>
            <kbd className="rounded border border-line px-1 font-mono text-[11px] lg:hidden xl:inline">
              ⌘K
            </kbd>
          </button>
          <ThemeToggle className="hidden sm:flex" />
        </div>
      </div>
    </header>
  );
}

function ElectionSwitcher() {
  const { round, elections } = useRound();
  const router = useRouter();
  return (
    <label className="relative">
      <span className="sr-only">Eleição e turno</span>
      <select
        value={round.slug}
        onChange={(e) => {
          const r = elections.flatMap((x) => x.rounds).find((x) => x.slug === e.target.value);
          if (r) router.push(electionHref(r));
        }}
        className="h-9 max-w-[46vw] cursor-pointer appearance-none truncate rounded-md border border-line bg-surface py-0 pl-2.5 pr-7 text-[13px] font-medium hover:border-line-strong"
      >
        {elections.map((e) => (
          <optgroup key={e.slug} label={e.name}>
            {e.rounds.map((r) => (
              <option key={r.slug} value={r.slug}>
                {e.demo ? 'Demonstração' : e.slug.startsWith('replay-') ? 'Reprodução' : e.year} · {r.round}º
                turno
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted"
      >
        ▾
      </span>
    </label>
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
    label = isReplay ? 'Reprodução encerrada' : 'Apuração encerrada';
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
  const color = { live: 'text-live', warn: 'text-warn', muted: 'text-muted', ink: 'text-ink-2' }[tone];
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
        <span className="hidden whitespace-nowrap text-muted md:inline lg:hidden xl:inline">
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
  const { href, meta } = useRound();
  const active = useActive();
  const [more, setMore] = useState(false);
  const item =
    'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] text-muted aria-[current=page]:text-ink';
  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-ground/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {NAV.slice(0, 3).map((n) => (
          <Link
            key={n.path}
            href={href(n.path)}
            aria-current={active(n.path) ? 'page' : undefined}
            className={item}
          >
            <n.icon />
            {n.label}
          </Link>
        ))}
        <button type="button" onClick={onSearch} className={item}>
          <IconSearch />
          Buscar
        </button>
        <button type="button" onClick={() => setMore(true)} className={item} aria-expanded={more}>
          <IconMore />
          Mais
        </button>
      </nav>
      {more && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
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
            <ul className="grid gap-1">
              {[
                { to: href('/historico'), label: 'Linha do tempo', icon: IconHistory },
                ...(meta?.features.comparison === false
                  ? []
                  : [{ to: href('/compare'), label: 'Comparar estados', icon: IconCompare }]),
                { to: `${href()}#favoritos`, label: 'Favoritos', icon: IconStar },
                { to: '/como-funciona', label: 'Como funciona', icon: IconPulse },
                { to: '/sobre', label: 'Sobre os dados', icon: IconInfo },
              ].map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.to}
                    onClick={() => setMore(false)}
                    className="flex min-h-12 items-center gap-3 rounded-lg px-3 hover:bg-surface-2"
                  >
                    <l.icon />
                    {l.label}
                  </Link>
                </li>
              ))}
              <li className="flex min-h-12 items-center justify-between rounded-lg px-3">
                <span>Tema</span>
                <ThemeToggle className="flex" />
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

function Footer() {
  const { meta } = useRound();
  return <SiteFooter version={meta?.app.version} />;
}

function SiteFooter({ version }: { version?: string }) {
  return (
    <footer className="border-t border-line pb-24 lg:pb-0">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-2 px-4 py-6 text-[13px] text-muted sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <p>
            Fonte: Tribunal Superior Eleitoral (TSE). Este site não é um serviço oficial da Justiça Eleitoral.
            Resultados parciais consideram apenas as urnas já apuradas e podem mudar até o fim da apuração.
            Horários de Brasília.{' '}
            <Link href="/como-funciona" className="text-ink-2 underline underline-offset-2">
              Como funciona
            </Link>
            {' · '}
            <Link href="/sobre" className="text-ink-2 underline underline-offset-2">
              Sobre os dados
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-1 md:items-end">
          <a
            href="https://lucianookdp.dev"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink"
          >
            Desenvolvido por <AuthorLogo />
          </a>
          <p className="font-mono text-[12px]">Eleições Brasil{version ? ` v${version}` : ''}</p>
        </div>
      </div>
    </footer>
  );
}

/** The author's wordmark, as on lucianookdp.dev: "lucian", an infinity sign for "oo", "kdp". */
function AuthorLogo() {
  return (
    <span
      className="inline-flex items-center text-[15px] font-semibold tracking-tight text-ink"
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
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Logo />
            <span>Eleições Brasil</span>
          </Link>
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
