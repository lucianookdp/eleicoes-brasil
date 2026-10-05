'use client';

import { hasValidVotes } from '@eleicoes/election-core';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { displayName, fmtInt, fmtPct } from '@/lib/format';
import { useMyCity } from '@/lib/my-city';
import { useCity, useSearch } from '@/lib/queries';
import { IconPin } from './icons';
import { useRound } from './shell';

/**
 * "Minha cidade" at the top of the home page: on a first visit a small prompt to pick it (or
 * dismiss); afterwards that city's headline race at a glance, with a link to its page.
 */
export function MyCityCard({ headlineOffice }: { headlineOffice?: string }) {
  const { city, dismissed, choose, clear, dismiss } = useMyCity();
  const [picking, setPicking] = useState(false);
  if (city && !picking)
    return <Chosen headlineOffice={headlineOffice} onChange={() => setPicking(true)} clear={clear} />;
  // After "Agora não": a single quiet line, so the city can still be picked later.
  if (dismissed && !picking)
    return (
      <button
        type="button"
        onClick={() => setPicking(true)}
        className="mb-4 flex min-h-11 items-center gap-2 text-[14px] text-ink-2 hover:text-ink"
      >
        <IconPin className="text-live" /> Escolher minha cidade
      </button>
    );
  return (
    <Picker
      onPick={(c) => {
        choose(c);
        setPicking(false);
      }}
      onDismiss={() => {
        setPicking(false);
        if (!city) dismiss();
      }}
    />
  );
}

function Picker({
  onPick,
  onDismiss,
}: {
  onPick: (c: { uf: string; code: string; name: string; state: string }) => void;
  onDismiss: () => void;
}) {
  const { round } = useRound();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 150);
    return () => clearTimeout(t);
  }, [q]);
  const { data } = useSearch(round.slug, debounced);
  const cities =
    debounced.trim().length >= 2 ? (data ?? []).filter((h) => h.kind === 'city').slice(0, 6) : [];

  return (
    <section aria-label="Minha cidade" className="mb-4 rounded-xl border border-line bg-surface p-3 sm:p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[14px] font-medium">
          <IconPin className="text-live" /> Qual é a sua cidade?
        </p>
        <button type="button" onClick={onDismiss} className="px-1 text-[13px] text-muted hover:text-ink">
          Agora não
        </button>
      </div>
      <label className="flex h-11 items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 focus-within:border-live">
        <span className="sr-only">Buscar sua cidade</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Digite o nome da cidade"
          autoComplete="off"
          enterKeyHint="search"
          className="h-full min-w-0 flex-1 bg-transparent text-[14px] placeholder:text-muted"
          style={{ outline: 'none' }}
        />
      </label>
      {cities.length > 0 && (
        <ul className="mt-2 grid gap-1">
          {cities.map((h) => {
            const m = /^\/states\/([a-z]{2})\/cities\/(\d{5})$/.exec(h.path);
            if (!m) return null;
            return (
              <li key={h.path}>
                <button
                  type="button"
                  onClick={() => onPick({ uf: m[1]!, code: m[2]!, name: h.label, state: h.detail })}
                  className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 text-left hover:bg-surface-2"
                >
                  <span className="truncate font-medium">{h.label}</span>
                  <span className="shrink-0 text-[13px] text-muted">{h.detail}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Chosen({
  headlineOffice,
  onChange,
  clear,
}: {
  headlineOffice?: string;
  onChange: () => void;
  clear: () => void;
}) {
  const { round, href } = useRound();
  const { city } = useMyCity();
  const { data, error } = useCity(round.slug, city!.uf, city!.code);
  // A city from another election's map (or a code that no longer exists): forget it.
  useEffect(() => {
    if (error && (error as { status?: number }).status === 404) clear();
  }, [error, clear]);
  if (!city) return null;
  const result = data?.results.find((r) => r.office.slug === headlineOffice) ?? data?.results[0];
  const top = result?.candidates.filter(hasValidVotes).slice(0, 2) ?? [];
  const gap = top.length === 2 ? (top[0]!.votes ?? 0) - (top[1]!.votes ?? 0) : 0;
  const path = `/states/${city.uf}/cities/${city.code}`;

  return (
    <section aria-label="Minha cidade" className="mb-4 rounded-xl border border-line bg-surface p-3 sm:p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[12px] text-muted">
            <IconPin width={14} height={14} className="text-live" /> Minha cidade
          </p>
          <Link href={href(path)} className="block truncate text-[17px] font-semibold hover:underline">
            {city.name}
          </Link>
          <p className="text-[12.5px] text-muted">
            {city.state}
            {result && ` · ${result.office.name} · ${fmtPct(result.progress.countedPct, 1)} das urnas`}
          </p>
        </div>
        <button type="button" onClick={onChange} className="shrink-0 px-1 text-[13px] text-info">
          Trocar
        </button>
      </div>
      {top.length > 0 ? (
        <ul className="grid gap-1.5">
          {top.map((c) => (
            <li key={c.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: c.color }}
                  aria-hidden
                />
                <span className="truncate">{displayName(c.ballotName)}</span>
              </span>
              <span className="numeral text-[15px]">
                {fmtPct(c.percent)} <span className="text-[12.5px] text-muted">{fmtInt(c.votes)}</span>
              </span>
            </li>
          ))}
          {gap > 0 && (
            <li className="text-[13px] text-ink-2">
              {displayName(top[0]!.ballotName)} à frente por {fmtInt(gap)} votos
            </li>
          )}
        </ul>
      ) : (
        <p className="text-[13.5px] text-muted">{data ? 'Ainda sem votos apurados aqui.' : 'Carregando…'}</p>
      )}
    </section>
  );
}
