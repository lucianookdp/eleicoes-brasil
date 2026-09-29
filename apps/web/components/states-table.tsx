'use client';

import type { StateRowDTO } from '@eleicoes/election-core';
import { formatClock } from '@eleicoes/election-core';
import Link from 'next/link';
import { useState } from 'react';
import { displayName, fmtCompact, fmtInt, fmtPct } from '@/lib/format';
import { useRealtime } from '@/lib/realtime';
import { useRound } from './shell';
import { ProgressBar } from './ui';

const SORTS = {
  name: { label: 'Nome', fn: (a: StateRowDTO, b: StateRowDTO) => a.name.localeCompare(b.name, 'pt-BR') },
  'counted-desc': {
    label: 'Maior totalização',
    fn: (a: StateRowDTO, b: StateRowDTO) => (b.progress?.countedPct ?? -1) - (a.progress?.countedPct ?? -1),
  },
  'counted-asc': {
    label: 'Menor totalização',
    fn: (a: StateRowDTO, b: StateRowDTO) => (a.progress?.countedPct ?? 101) - (b.progress?.countedPct ?? 101),
  },
  votes: {
    label: 'Votos apurados',
    fn: (a: StateRowDTO, b: StateRowDTO) => (b.progress?.turnout ?? -1) - (a.progress?.turnout ?? -1),
  },
  updated: {
    label: 'Atualização recente',
    fn: (a: StateRowDTO, b: StateRowDTO) =>
      Date.parse(b.progress?.totalizedAt ?? '0') - Date.parse(a.progress?.totalizedAt ?? '0'),
  },
  activity: {
    label: 'Atividade em 5 min',
    fn: (a: StateRowDTO, b: StateRowDTO) =>
      b.sectionsLast5m - a.sectionsLast5m || b.updatesLast5m - a.updatesLast5m,
  },
} as const;
type SortKey = keyof typeof SORTS;

export function StatesTable({
  states,
  leaderLabel,
  compact = false,
}: {
  states: StateRowDTO[];
  leaderLabel?: string;
  compact?: boolean;
}) {
  const { href } = useRound();
  const { recent } = useRealtime();
  const [sort, setSort] = useState<SortKey>('name');
  const rows = [...states].sort(SORTS[sort].fn);
  const flash = (uf: string) => (recent.get(uf.toLowerCase()) ?? 0) > Date.now() - 3000;

  return (
    <div>
      <label className="mb-3 flex items-center gap-2 text-[13px] text-muted">
        Ordenar por
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-9 rounded-md border border-line bg-surface px-2 text-[13px] text-ink"
        >
          {Object.entries(SORTS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </label>

      {/* Desktop: dense table */}
      <div className={`scroll-x hidden ${compact ? '' : 'md:block'}`}>
        <table className="w-full text-[14px]">
          <caption className="sr-only">Totalização por estado</caption>
          <thead className="text-left text-[12.5px] text-muted">
            <tr className="border-b border-line">
              <th className="py-2 pr-2 font-normal">UF</th>
              <th className="py-2 pr-4 font-normal">Estado</th>
              <th className="w-[22%] py-2 pr-4 font-normal">Totalizado</th>
              <th className="py-2 pr-4 text-right font-normal">Seções</th>
              <th className="py-2 pr-4 text-right font-normal">Votos</th>
              {leaderLabel && <th className="py-2 pr-4 font-normal">{leaderLabel}</th>}
              <th className="py-2 pr-4 text-right font-normal">Atualizado</th>
              <th className="py-2 text-right font-normal">Últimos 5 min</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const p = s.progress;
              return (
                <tr
                  key={`${s.uf}-${flash(s.uf) ? 'f' : ''}`}
                  className={`border-b border-line/70 hover:bg-surface-2 ${flash(s.uf) ? 'flash' : ''}`}
                >
                  <td className="py-2 pr-2 font-mono text-[13px] text-muted">{s.uf}</td>
                  <td className="py-2 pr-4">
                    <Link
                      href={href(`/states/${s.uf.toLowerCase()}`)}
                      className="font-medium hover:underline"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <ProgressBar
                        value={p?.countedPct ?? null}
                        label={`${s.name} totalizado`}
                        className="flex-1"
                      />
                      <span className="w-16 text-right">
                        {p && p.status !== 'not-started' ? fmtPct(p.countedPct) : '—'}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-right text-ink-2">
                    {fmtInt(p?.sectionsCounted)}
                    <span className="text-muted"> / {fmtInt(p?.sectionsTotal)}</span>
                  </td>
                  <td className="py-2 pr-4 text-right">{fmtCompact(p?.turnout)}</td>
                  {leaderLabel && (
                    <td className="py-2 pr-4">
                      {s.leader ? (
                        <span className="flex items-center gap-1.5">
                          <span
                            className="inline-block size-2.5 shrink-0 rounded-full"
                            style={{ background: s.leader.color }}
                            aria-hidden
                          />
                          <span className="truncate">{displayName(s.leader.name)}</span>
                          <span className="text-muted">{fmtPct(s.leader.percent, 1)}</span>
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  )}
                  <td className="py-2 pr-4 text-right font-mono text-[13px] text-ink-2">
                    {p?.totalizedAt ? formatClock(p.totalizedAt) : '—'}
                  </td>
                  <td className="py-2 text-right text-[13px]">
                    {s.sectionsLast5m > 0 ? (
                      <span className="text-live">+{fmtInt(s.sectionsLast5m)} seções</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: one line per state */}
      <ul className={`divide-y divide-line ${compact ? '' : 'md:hidden'}`}>
        {rows.map((s) => {
          const p = s.progress;
          return (
            <li key={s.uf} className={flash(s.uf) ? 'flash' : ''}>
              <Link
                href={href(`/states/${s.uf.toLowerCase()}`)}
                className="grid min-h-14 grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-3 py-2.5"
              >
                <span className="font-mono text-[13px] text-muted">{s.uf}</span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{s.name}</span>
                  <ProgressBar
                    value={p?.countedPct ?? null}
                    label={`${s.name} totalizado`}
                    className="mt-1.5"
                  />
                  {s.leader && (
                    <span className="mt-1 flex items-center gap-1.5 text-[12.5px] text-ink-2">
                      <span
                        className="inline-block size-2 rounded-full"
                        style={{ background: s.leader.color }}
                        aria-hidden
                      />
                      <span className="truncate">{displayName(s.leader.name)}</span>{' '}
                      {fmtPct(s.leader.percent, 1)}
                    </span>
                  )}
                </span>
                <span className="text-right">
                  <span className="numeral block text-[16px]">
                    {p && p.status !== 'not-started' ? fmtPct(p.countedPct, 1) : '—'}
                  </span>
                  <span className="block text-[12px] text-muted">
                    {s.sectionsLast5m > 0 ? `+${fmtInt(s.sectionsLast5m)} seções` : fmtCompact(p?.turnout)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
