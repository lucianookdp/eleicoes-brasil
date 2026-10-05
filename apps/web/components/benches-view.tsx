'use client';

import type { BenchDTO } from '@eleicoes/election-core';
import { useState } from 'react';
import { SENATORS, seatPositions, thresholds } from '@/lib/benches';
import { displayName, fmtInt, fmtPct } from '@/lib/format';
import { useBenches } from '@/lib/queries';
import { useRound } from './shell';
import { EmptyState, ErrorNotice, Panel, Segmented, Skeleton } from './ui';

type Group = { key: string; label: string; detail: string; color: string; seats: number };
type Mode = 'party' | 'federation';

/**
 * Seats won per party in the Câmara and in the Senado, from the TSE's "eleito" marks. Shown only
 * once every state is final: a partial count would be a projection, and the site never shows one.
 * Parties are ordered by size; no left/right grouping, since there is no official classification.
 */
export function BenchesView() {
  const { round } = useRound();
  // Deputies and senators are elected in the 1st round; the runoff has none.
  const { data, error, refetch } = useBenches(`${round.electionSlug}-1`);
  const [chamber, setChamber] = useState('deputado-federal');
  const [mode, setMode] = useState<Mode | null>(null);
  const bench = data?.chambers.find((c) => c.office.slug === chamber) ?? data?.chambers[0];
  const ready = data?.chambers.length && data.chambers.every((c) => c.statesFinal === c.statesTotal);
  const hasFederations = bench?.parties.some((p) => p.federation) ?? false;
  const options = [
    { value: 'party' as const, label: 'Partidos' },
    ...(hasFederations ? [{ value: 'federation' as const, label: 'Federações' }] : []),
  ];
  const shown: Mode = options.find((o) => o.value === mode)?.value ?? options[0]!.value;

  return (
    <>
      <div className="mb-4">
        <h1 className="text-[24px] font-semibold tracking-tight sm:text-[28px]">Bancadas eleitas</h1>
        <p className="text-[13.5px] text-muted">
          Quantos deputados federais e senadores cada partido elegeu. Dados oficiais do TSE.
        </p>
      </div>

      {error && <ErrorNotice error={error} retry={() => refetch()} />}
      {!data && !error && <Skeleton className="h-80" />}
      {data && !ready && (
        <EmptyState title="As bancadas aparecem quando o TSE terminar a totalização em todos os estados.">
          {data.chambers.map((c) => (
            <span key={c.office.slug} className="block">
              {c.office.name}: {c.statesFinal} de {c.statesTotal} estados concluídos.
            </span>
          ))}
        </EmptyState>
      )}

      {ready && bench && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Segmented
              label="Casa"
              value={bench.office.slug}
              onChange={(v) => {
                setChamber(v);
              }}
              options={data.chambers.map((c) => ({
                value: c.office.slug,
                label: c.office.slug === 'senador' ? 'Senado' : 'Câmara',
              }))}
            />
            {options.length > 1 && (
              <Segmented label="Ver por" value={shown} onChange={setMode} options={options} />
            )}
          </div>
          <Bench bench={bench} groups={shown === 'federation' ? federations(bench) : parties(bench)} />
        </>
      )}

      <Thresholds deputies={data?.chambers.find((c) => c.office.slug === 'deputado-federal')?.seats} />
    </>
  );
}

function parties(bench: BenchDTO): Group[] {
  return bench.parties.map((p) => ({
    key: p.abbreviation,
    label: p.abbreviation,
    detail: displayName(p.name),
    color: p.color,
    seats: p.seats,
  }));
}

/** Parties in an official federation count as one bench (the federation acts as one party). */
function federations(bench: BenchDTO): Group[] {
  const groups = new Map<string, Group>();
  for (const p of bench.parties) {
    const key = p.federation ?? p.abbreviation;
    const g = groups.get(key);
    if (g) g.seats += p.seats;
    else
      groups.set(key, {
        key,
        label: p.federation ? `Federação ${p.federation}` : p.abbreviation,
        detail: p.federation ? '' : displayName(p.name),
        // Parties come largest first, so the federation takes its largest member's colour.
        color: p.color,
        seats: p.seats,
      });
  }
  for (const g of groups.values())
    if (!g.detail)
      g.detail = bench.parties
        .filter((p) => p.federation === g.key)
        .map((p) => `${p.abbreviation} ${p.seats}`)
        .join(' · ');
  return [...groups.values()].sort((a, b) => b.seats - a.seats || a.label.localeCompare(b.label));
}

const TOP = 8;

function Bench({ bench, groups }: { bench: BenchDTO; groups: Group[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  // The largest benches first; the rest one tap away (the chart always shows every seat).
  const shown = all || groups.length <= TOP + 1 ? groups : groups.slice(0, TOP);
  const senate = bench.office.slug === 'senador';
  const majority = Math.floor(bench.seats / 2) + 1;
  return (
    <div className="grid items-start gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      <Panel className="p-4 sm:p-5 lg:col-span-7">
        <Hemicycle groups={groups} total={bench.seats} active={active} />
        <p className="mt-3 text-center text-[13.5px] text-ink-2">
          {senate ? (
            <>
              {bench.seats} senadores eleitos em 2026, 2 por estado. As outras 27 cadeiras são dos senadores
              eleitos em 2022, com mandato até 2031.
            </>
          ) : (
            <>
              {fmtInt(bench.seats)} deputados federais. Maioria absoluta: {fmtInt(majority)} cadeiras.
            </>
          )}
        </p>
      </Panel>
      <Panel className="p-2 sm:p-3 lg:col-span-5">
        <p className="px-2 pb-1 pt-1 text-[13px] text-muted">
          Toque em um partido para ver as cadeiras dele no gráfico.
        </p>
        <ul aria-label="Cadeiras por partido">
          {shown.map((g) => (
            <li key={g.key}>
              <button
                type="button"
                aria-pressed={active === g.key}
                onClick={() => setActive((a) => (a === g.key ? null : g.key))}
                className={`grid min-h-11 w-full grid-cols-[0.75rem_minmax(0,1fr)_auto_3.5rem] items-center gap-x-3 rounded-lg px-2 py-1 text-left hover:bg-surface-2 aria-pressed:bg-surface-2 ${active && active !== g.key ? 'opacity-45' : ''}`}
              >
                <span className="size-3 rounded-full" style={{ background: g.color }} aria-hidden />
                <span className="min-w-0 truncate">
                  <span className="font-semibold">{g.label}</span>
                  {g.detail && <span className="text-[13px] text-muted"> · {g.detail}</span>}
                </span>
                <span className="numeral text-right text-[17px]">{g.seats}</span>
                <span className="text-right text-[13px] text-muted">
                  {fmtPct((100 * g.seats) / bench.seats, 1)}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {groups.length > TOP + 1 && (
          <button
            type="button"
            onClick={() => setAll((v) => !v)}
            aria-expanded={all}
            className="mt-1 h-11 w-full rounded-lg border border-line text-[15px] font-medium text-ink-2 hover:border-line-strong hover:text-ink"
          >
            {all ? 'Mostrar só os maiores' : `Ver todos os ${groups.length}`}
          </button>
        )}
      </Panel>
    </div>
  );
}

/**
 * Parliament chart: one dot per seat on concentric arcs, rows sized by their length, filled left to
 * right in list order (largest bench first).
 */
function Hemicycle({ groups, total, active }: { groups: Group[]; total: number; active: string | null }) {
  const seats = seatPositions(total);
  const colors: { key: string; color: string }[] = groups.flatMap((g) =>
    Array.from({ length: g.seats }, () => ({ key: g.key, color: g.color })),
  );
  const label = `${total} cadeiras: ${groups.map((g) => `${g.label} ${g.seats}`).join(', ')}`;
  return (
    <svg
      // Room for the outermost dots on every side.
      viewBox={`${-1 - seats.r * 1.2} ${-1 - seats.r * 1.2} ${2 + seats.r * 2.4} ${1 + seats.r * 2.4}`}
      className="mx-auto w-full max-w-[560px]"
      role="img"
      aria-label={label}
    >
      {seats.points.map((p, i) => {
        const seat = colors[i];
        return (
          <circle
            // biome-ignore lint/suspicious/noArrayIndexKey: seats are positions, stable for a given total
            key={i}
            cx={p.x}
            cy={p.y}
            r={seats.r}
            fill={seat?.color ?? 'var(--surface-2)'}
            opacity={active && seat?.key !== active ? 0.18 : 1}
          />
        );
      })}
      <text x={0} y={-0.08} textAnchor="middle" className="numeral" fontSize={0.2} fill="var(--ink)">
        {total}
      </text>
      <text x={0} y={0.02} textAnchor="middle" fontSize={0.075} fill="var(--muted)">
        cadeiras
      </text>
    </svg>
  );
}

function Thresholds({ deputies = 513 }: { deputies?: number }) {
  return (
    <section aria-labelledby="votos-necessarios" className="mt-8">
      <h2 id="votos-necessarios" className="text-[17px] font-semibold">
        Quantos votos cada decisão precisa
      </h2>
      <p className="mb-3 text-[13.5px] text-muted">
        Regras da Constituição Federal, contadas sobre o total de cada Casa: {fmtInt(deputies)} deputados e{' '}
        {SENATORS} senadores.
      </p>
      <Panel className="overflow-x-auto p-0">
        <table className="w-full text-left text-[14px]">
          <thead className="text-[12px] text-muted">
            <tr className="border-b border-line">
              <th scope="col" className="px-3 py-2 font-medium sm:px-4">
                Decisão
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                Deputados
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium sm:px-4">
                Senadores
              </th>
            </tr>
          </thead>
          <tbody>
            {thresholds(deputies).map((t) => (
              <tr key={t.what} className="border-b border-line/70 last:border-0">
                <th scope="row" className="px-3 py-2.5 font-normal sm:px-4">
                  <span className="block">{t.what}</span>
                  {'note' in t && <span className="block text-[12.5px] text-ink-2">{t.note}</span>}
                  <span className="block text-[12px] text-muted">{t.source}</span>
                </th>
                {[t.camara, t.senado].map((v, i) => (
                  <td
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed two columns
                    key={i}
                    className={`px-2 py-2.5 text-right align-top ${i ? 'pr-3 sm:pr-4' : ''} ${typeof v === 'number' ? 'numeral text-[17px]' : 'text-[12.5px] text-ink-2'}`}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </section>
  );
}
