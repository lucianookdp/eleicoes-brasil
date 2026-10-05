'use client';

import type { IngestionStatus, ProgressDTO } from '@eleicoes/election-core';
import { formatClock } from '@eleicoes/election-core';
import Link from 'next/link';
import { type ReactNode, useEffect, useId, useState } from 'react';
import { type Favorite, useFavorites } from '@/lib/favorites';
import { useRealtime } from '@/lib/realtime';
import { IconChevron, IconStar } from './icons';

export function SectionTitle({
  id,
  title,
  aside,
  children,
}: {
  id?: string;
  title: string;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div>
        <h2 id={id} className="text-[17px] font-semibold tracking-tight">
          {title}
        </h2>
        {children && <p className="text-[13px] text-muted">{children}</p>}
      </div>
      {aside}
    </div>
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-surface ${className}`}>{children}</div>;
}

/** A label/value pair. `value` null renders an em dash: unknown is never shown as zero. */
export function Stat({
  label,
  value,
  detail,
  emphasis,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[12.5px] text-muted">{label}</dt>
      <dd className={`${emphasis ? 'text-[22px]' : 'text-[17px]'} numeral truncate leading-tight`}>
        {value ?? '—'}
      </dd>
      {detail && <dd className="text-[12.5px] text-ink-2">{detail}</dd>}
    </div>
  );
}

export function ProgressBar({
  value,
  label,
  className = '',
  tone = 'live',
}: {
  value: number | null;
  label: string;
  className?: string;
  tone?: 'live' | 'ink';
}) {
  const v = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div
      className={`h-1.5 overflow-hidden rounded-full bg-line ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value == null ? undefined : Math.round(v * 100) / 100}
    >
      <div
        className={`bar h-full rounded-full ${tone === 'live' ? 'bg-live' : 'bg-ink-2'}`}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong px-5 py-10 text-center">
      <p className="font-medium">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-md text-[14px] text-muted">{children}</p>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-surface-2 ${className}`} aria-hidden />;
}

export function ErrorNotice({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-bad/40 bg-bad-soft px-4 py-3 text-[14px]">
      <p className="font-medium text-bad" title={error instanceof Error ? error.message : undefined}>
        Não foi possível carregar estes dados.
      </p>
      <p className="text-ink-2">Verifique sua conexão ou tente de novo em alguns instantes.</p>
      {retry && (
        <button type="button" onClick={retry} className="mt-2 text-info underline underline-offset-2">
          Tentar de novo
        </button>
      )}
    </div>
  );
}

/**
 * Tells the reader when what they see is not fresh: the collector is failing, the browser is
 * offline, or counting has not started. Never hides the last good data.
 */
export function FreshnessNotice({
  ingestion,
  progress,
  roundStatus,
  votesAt,
}: {
  ingestion: IngestionStatus;
  progress: ProgressDTO | null;
  roundStatus: string;
  /** TSE time of the headline vote file: its votes can stall while the counting file moves on. */
  votesAt?: string | null;
}) {
  const { connection } = useRealtime();
  const last = ingestion.lastSuccessAt ?? progress?.updatedAt ?? null;
  // Re-check every 30 s: when the TSE stops publishing nothing else re-renders this.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  if (connection === 'offline') {
    return (
      <Notice tone="muted" title="Você está sem conexão">
        Mostrando os últimos dados recebidos{last && <> às {formatClock(last)}</>}. Eles voltam a se atualizar
        quando a conexão voltar.
      </Notice>
    );
  }
  if (roundStatus === 'live' && (ingestion.state === 'offline' || ingestion.state === 'degraded')) {
    return (
      <Notice tone="warn" title={ingestion.state === 'offline' ? 'Dados atrasados' : 'Fonte do TSE instável'}>
        Mostrando os últimos dados recebidos{last && <> às {formatClock(last)}</>}. Continuamos tentando
        buscar dados novos.
      </Notice>
    );
  }
  // Our collection is healthy but the TSE has published nothing new for a while: say so, so the
  // pause is not mistaken for a problem with this site.
  const stale = (at: string | null | undefined) => !!at && now - Date.parse(at) > 5 * 60_000;
  // At 100% there is nothing left to wait for, even before the TSE marks the count final.
  const done = progress?.status === 'finished' || (progress?.countedPct ?? 0) >= 100;
  if (roundStatus === 'live' && ingestion.state === 'healthy' && !done) {
    const what = stale(progress?.updatedAt)
      ? `não divulga números novos desde as ${formatClock(progress!.updatedAt).slice(0, 5)}`
      : stale(votesAt)
        ? `não atualiza os votos desde as ${formatClock(votesAt).slice(0, 5)}`
        : null;
    if (what)
      return (
        <Notice tone="warn" title="Aguardando o TSE">
          O TSE {what}. O atraso é do TSE: assim que ele enviar novas informações, o site atualiza sozinho.
        </Notice>
      );
  }
  return null;
}

function Notice({ tone, title, children }: { tone: 'warn' | 'muted'; title: string; children: ReactNode }) {
  const cls = tone === 'warn' ? 'border-warn/40 bg-warn-soft' : 'border-line-strong bg-surface-2';
  return (
    <div role="status" className={`mb-4 rounded-xl border px-4 py-2.5 text-[14px] ${cls}`}>
      <span className={`font-medium ${tone === 'warn' ? 'text-warn' : ''}`}>{title}.</span>{' '}
      <span className="text-ink-2">{children}</span>
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Você está em" className="mb-2 text-[13px] text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => (
          // Index key: a city can share its state's name (São Paulo › São Paulo).
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <IconChevron width={12} height={12} />}
            {it.href ? (
              <Link href={it.href} className="hover:text-ink">
                {it.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink-2">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function FavoriteButton({ favorite }: { favorite: Favorite }) {
  const { has, toggle } = useFavorites();
  const on = has(favorite.key);
  return (
    <button
      type="button"
      onClick={() => toggle(favorite)}
      aria-pressed={on}
      className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-[13px] ${on ? 'border-warn/50 text-warn' : 'border-line text-muted hover:text-ink'}`}
    >
      <IconStar filled={on} width={16} height={16} />
      {on ? 'Favorito' : 'Favoritar'}
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex rounded-lg border border-line bg-surface p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className="min-h-8 rounded-md px-3 text-[13px] text-muted aria-checked:bg-surface-2 aria-checked:text-ink aria-checked:shadow-[inset_0_0_0_1px_var(--line-strong)]"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Accessible tabs (arrow keys move between tabs). Only the active panel is rendered. */
export function Tabs<T extends string>({
  label,
  tabs,
  value,
  onChange,
  children,
}: {
  label: string;
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  children: ReactNode;
}) {
  const id = useId();
  const move = (dir: number) => {
    const i = tabs.findIndex((t) => t.value === value);
    const next = tabs[(i + dir + tabs.length) % tabs.length]!;
    onChange(next.value);
    document.getElementById(`${id}-${next.value}`)?.focus();
  };
  return (
    <div>
      <div role="tablist" aria-label={label} className="flex gap-1 border-b border-line px-2 sm:px-3">
        {tabs.map((t) => (
          <button
            key={t.value}
            id={`${id}-${t.value}`}
            type="button"
            role="tab"
            aria-selected={t.value === value}
            aria-controls={`${id}-panel`}
            tabIndex={t.value === value ? 0 : -1}
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') move(1);
              if (e.key === 'ArrowLeft') move(-1);
            }}
            className="-mb-px min-h-11 flex-1 whitespace-nowrap border-b-2 border-transparent px-1 text-[13.5px] text-muted hover:text-ink aria-selected:border-live aria-selected:font-medium aria-selected:text-ink sm:flex-none sm:px-3"
          >
            {t.label}
          </button>
        ))}
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${value}`} className="p-3 sm:p-4">
        {children}
      </div>
    </div>
  );
}
