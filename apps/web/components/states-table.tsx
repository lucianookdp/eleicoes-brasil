'use client';

import type { StateRowDTO } from '@eleicoes/election-core';
import { formatClock } from '@eleicoes/election-core';
import Link from 'next/link';
import { useState } from 'react';
import { displayName, fmtCompact, fmtInt, fmtPct } from '@/lib/format';
import { useRound } from './shell';
import { ProgressBar, StateFlag } from './ui';

const SORTS = {
  name: { label: 'Nome', fn: (a: StateRowDTO, b: StateRowDTO) => a.name.localeCompare(b.name, 'pt-BR') },
  'counted-desc': {
    label: 'Mais apurados',
    fn: (a: StateRowDTO, b: StateRowDTO) => (b.progress?.countedPct ?? -1) - (a.progress?.countedPct ?? -1),
  },
  'counted-asc': {
    label: 'Menos apurados',
    fn: (a: StateRowDTO, b: StateRowDTO) => (a.progress?.countedPct ?? 101) - (b.progress?.countedPct ?? 101),
  },
  votes: {
    label: 'Votos apurados',
    fn: (a: StateRowDTO, b: StateRowDTO) => (b.progress?.turnout ?? -1) - (a.progress?.turnout ?? -1),
  },
  voters: {
    label: 'Mais eleitores',
    fn: (a: StateRowDTO, b: StateRowDTO) =>
      (b.progress?.electorateTotal ?? -1) - (a.progress?.electorateTotal ?? -1),
  },
  'lead-desc': {
    label: 'Maior % do mais votado',
    fn: (a: StateRowDTO, b: StateRowDTO) => (b.leader?.percent ?? -1) - (a.leader?.percent ?? -1),
  },
  'lead-asc': {
    label: 'Disputa mais apertada',
    fn: (a: StateRowDTO, b: StateRowDTO) => (a.leader?.percent ?? 101) - (b.leader?.percent ?? 101),
  },
  updated: {
    label: 'Atualizados agora',
    fn: (a: StateRowDTO, b: StateRowDTO) =>
      Date.parse(b.progress?.totalizedAt ?? '0') - Date.parse(a.progress?.totalizedAt ?? '0'),
  },
} as const;
type SortKey = keyof typeof SORTS;
/** Sorts that only make sense when there is a most voted to show. */
const LEAD_SORTS: SortKey[] = ['lead-desc', 'lead-asc'];

const REGIONS = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
const STAGES = {
  all: 'Todos',
  counting: 'Em apuração',
  done: 'Concluída',
  waiting: 'Não começou',
} as const;
type Stage = keyof typeof STAGES;
const stageOf = (s: StateRowDTO): Stage =>
  !s.progress || s.progress.status === 'not-started'
    ? 'waiting'
    : s.progress.status === 'finished' || (s.progress.countedPct ?? 0) >= 100
      ? 'done'
      : 'counting';

const control = 'h-9 max-w-full rounded-md border border-line bg-surface px-2 text-[13px] text-ink';

export function StatesTable({
  states,
  leaderLabel,
  compact = false,
  leaderFilter = false,
}: {
  states: StateRowDTO[];
  leaderLabel?: string;
  compact?: boolean;
  /**
   * Offer "most voted: <candidate>" among the filters. Off where the page around the table already
   * has that choice (the states page, where it also lights up the map).
   */
  leaderFilter?: boolean;
}) {
  const { href } = useRound();
  const [sort, setSort] = useState<SortKey>('name');
  const [region, setRegion] = useState('');
  const [stage, setStage] = useState<Stage>('all');
  const [leader, setLeader] = useState('');
  // Who is the most voted somewhere, by ballot number, with in how many states.
  const leaders = new Map<string, { name: string; n: number }>();
  for (const st of states) {
    if (!st.leader) continue;
    const l = leaders.get(st.leader.number) ?? { name: st.leader.name, n: 0 };
    l.n++;
    leaders.set(st.leader.number, l);
  }
  const byLeader = leaderFilter && leaderLabel && leaders.size > 0;
  const filtered = states.filter(
    (st) =>
      (!region || st.region === region) &&
      (stage === 'all' || stageOf(st) === stage) &&
      (!byLeader || !leader || st.leader?.number === leader),
  );
  // Votes abroad ("Exterior") always close the list, whatever the sort.
  const rows = [...filtered]
    .sort(SORTS[sort].fn)
    .sort((a, b) => Number(a.uf === 'ZZ') - Number(b.uf === 'ZZ'));
  const narrowed = filtered.length !== states.length;
  const clear = () => {
    setRegion('');
    setStage('all');
    setLeader('');
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end gap-x-3 gap-y-2 text-[12.5px] text-muted">
        {byLeader && (
          <label className="flex min-w-0 flex-col gap-1">
            {leaderLabel}
            <select value={leader} onChange={(e) => setLeader(e.target.value)} className={control}>
              <option value="">Todos os candidatos</option>
              {[...leaders]
                .sort((a, b) => b[1].n - a[1].n)
                .map(([number, l]) => (
                  <option key={number} value={number}>
                    {displayName(l.name)} ({l.n})
                  </option>
                ))}
            </select>
          </label>
        )}
        <label className="flex min-w-0 flex-col gap-1">
          Região
          <select value={region} onChange={(e) => setRegion(e.target.value)} className={control}>
            <option value="">Todas</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1">
          Apuração
          <select value={stage} onChange={(e) => setStage(e.target.value as Stage)} className={control}>
            {Object.entries(STAGES).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1">
          Ordenar por
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={control}>
            {Object.entries(SORTS)
              .filter(([k]) => leaderLabel || !LEAD_SORTS.includes(k as SortKey))
              .map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
          </select>
        </label>
        {narrowed && (
          <p className="flex h-9 items-center gap-2 text-[13px]" role="status">
            {filtered.length} de {states.length}
            <button type="button" onClick={clear} className="text-info hover:underline">
              Limpar filtros
            </button>
          </p>
        )}
      </div>
      {rows.length === 0 && (
        <p className="rounded-lg bg-surface-2 px-3 py-4 text-center text-[14px] text-ink-2">
          Nenhum estado com esses filtros.
        </p>
      )}

      {/* The states themselves (a table on computers, a list on phones), apart from the filters. */}
      <div role="group" aria-label="Lista de estados">
        {/* Desktop: dense table */}
        <div className={`scroll-x hidden ${compact || rows.length === 0 ? '' : 'md:block'}`}>
          <table className="w-full text-[14px]">
            <caption className="sr-only">Apuração por estado</caption>
            <thead className="text-left text-[12.5px] text-muted">
              <tr className="border-b border-line">
                <th className="py-2 pr-2 font-normal">UF</th>
                <th className="py-2 pr-4 font-normal">Estado</th>
                <th className="w-[22%] py-2 pr-4 font-normal">Apurado</th>
                <th className="py-2 pr-4 text-right font-normal">Urnas</th>
                <th className="py-2 pr-4 text-right font-normal">Votos</th>
                {leaderLabel && <th className="py-2 pr-4 font-normal">{leaderLabel}</th>}
                <th className="py-2 text-right font-normal">Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const p = s.progress;
                return (
                  <tr key={s.uf} className="border-b border-line/70 hover:bg-surface-2">
                    <td className="py-2 pr-2 font-mono text-[13px] text-muted">
                      <span className="flex items-center gap-2">
                        <StateFlag uf={s.uf} />
                        {s.uf}
                      </span>
                    </td>
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
                          label={`${s.name}: urnas apuradas`}
                          className="flex-1"
                        />
                        <span className="w-16 text-right">
                          {p && p.status !== 'not-started' ? fmtPct(p.countedPct) : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-2 pr-4 text-right text-ink-2">
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
                    <td className="py-2 text-right font-mono text-[13px] text-ink-2">
                      {p?.totalizedAt ? formatClock(p.totalizedAt) : '—'}
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
              <li key={s.uf}>
                <Link
                  href={href(`/states/${s.uf.toLowerCase()}`)}
                  className="grid min-h-14 grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-3 py-2.5"
                >
                  <span className="flex flex-col items-center gap-1 font-mono text-[12px] text-muted">
                    <StateFlag uf={s.uf} size={26} />
                    {s.uf}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{s.name}</span>
                    <ProgressBar
                      value={p?.countedPct ?? null}
                      label={`${s.name}: urnas apuradas`}
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
                      {s.sectionsLast5m > 0 ? `+${fmtInt(s.sectionsLast5m)} urnas` : fmtCompact(p?.turnout)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
