'use client';

import type { ResultDTO } from '@eleicoes/election-core';
import { hasValidVotes } from '@eleicoes/election-core';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { displayName, fmtPct } from '@/lib/format';
import { useOfficeStates, useOverview } from '@/lib/queries';
import { IconCourt, IconFlag, IconSeats } from './icons';
import { FacePhoto, StatusPill, useOfficeParam } from './results';
import { useRound } from './shell';
import { StfView } from './stf-view';
import { EmptyState, ErrorNotice, Segmented, Skeleton, StateFlag } from './ui';

/** Governor or senator in every state on one screen: who leads, who is elected, who goes to a runoff. */
export function OfficesView() {
  const { round } = useRound();
  const overview = useOverview(round.slug);
  const offices = (overview.data?.round.offices ?? []).filter(
    (o) => o.scope === 'state' && o.kind === 'majoritarian',
  );
  const [office, setOffice] = useOfficeParam(offices);
  // The Supreme Court lives here too, as the last tab (?cargo=stf).
  const stf = useSearchParams().get('cargo') === 'stf';
  const { data, error, refetch, isFetching } = useOfficeStates(round.slug, stf ? undefined : office?.slug);
  // Filter by the TSE's status of each race (elected, runoff, counting); reset with the office.
  const [status, setStatus] = useState<Status | null>(null);
  const [statusFor, setStatusFor] = useState(office?.slug);
  if (statusFor !== office?.slug) {
    setStatusFor(office?.slug);
    setStatus(null);
  }
  const shown = data?.results.filter((r) => !status || statusOf(r) === status) ?? [];
  const officeTitle = office?.name === 'Senador' ? 'Senadores' : 'Governadores';
  const current = stf ? 'stf' : (office?.slug ?? 'stf');
  const choices: PowerChoice[] = [
    ...offices.map((o) =>
      o.name === 'Senador'
        ? { value: o.slug, label: 'Senadores', hint: 'Vagas no Senado em cada estado', icon: IconSeats }
        : o.name === 'Governador'
          ? { value: o.slug, label: 'Governadores', hint: 'Quem governa cada estado', icon: IconFlag }
          : { value: o.slug, label: o.name, hint: 'Em cada estado', icon: IconFlag },
    ),
    { value: 'stf', label: 'STF', hint: 'Os ministros do Supremo', icon: IconCourt },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight sm:text-[28px]">
            {stf
              ? 'Supremo Tribunal Federal'
              : round.round === 2
                ? `${officeTitle} no 2º turno`
                : officeTitle}
          </h1>
          <p className="text-[13.5px] text-muted">
            {stf
              ? 'Quem são os ministros, quem indicou cada um e até quando ficam no tribunal.'
              : round.round === 2
                ? 'Os estados onde a disputa para governador foi ao 2º turno. Toque em um estado para ver tudo.'
                : 'Quem lidera em cada estado. Toque em um estado para ver tudo.'}
          </p>
        </div>
        {/* Phones: the compact switch; computers get the big one below. */}
        <div className="sm:hidden">
          <Segmented label="Cargo" value={current} onChange={setOffice} options={choices} />
        </div>
      </div>
      <PowersSwitch value={current} onChange={setOffice} options={choices} />
      {stf ? (
        <StfView />
      ) : (
        <>
          {overview.data && offices.length === 0 && (
            <EmptyState title="Nesta etapa não há disputa para governador ou senador." />
          )}
          {error && <ErrorNotice error={error} retry={() => refetch()} />}
          {!data && !error && offices.length > 0 && <Skeleton className="h-96" />}
          {data && (
            <>
              <StatusFilter results={data.results} value={status} onChange={setStatus} />
              <ul className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-3 ${isFetching ? 'opacity-80' : ''}`}>
                {shown.map((r) => (
                  <li key={r.areaKey}>
                    <StateCard result={r} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </>
  );
}

type PowerChoice = { value: string; label: string; hint: string; icon: typeof IconCourt };

/** Computers and tablets: the three powers as big buttons across the page, easy to see and switch. */
function PowersSwitch({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: PowerChoice[];
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Cargo"
      className="mb-5 hidden gap-3 sm:grid"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className="group flex min-h-16 items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:border-line-strong aria-checked:border-live aria-checked:bg-live-soft"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-2 group-aria-checked:border-live/50 group-aria-checked:text-live">
            <o.icon />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[16px] font-semibold text-ink-2 group-aria-checked:text-ink">
              {o.label}
            </span>
            <span className="block truncate text-[12.5px] text-muted">{o.hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

type Status = 'elected' | 'runoff' | 'open';

/** Each race by the TSE's own status: decided, going to a runoff, or still counting. */
function statusOf(r: ResultDTO): Status {
  const leaders = r.candidates.filter(hasValidVotes);
  if (r.mathematicallyDecided === 'elected' || leaders.some((c) => /^eleit/i.test(c.status ?? '')))
    return 'elected';
  if (r.mathematicallyDecided === 'runoff' || leaders.some((c) => /2º turno/i.test(c.status ?? '')))
    return 'runoff';
  return 'open';
}

/** The counts by status, as chips that filter the states below ("vão ao 2º turno"…). */
function StatusFilter({
  results,
  value,
  onChange,
}: {
  results: ResultDTO[];
  value: Status | null;
  onChange: (s: Status | null) => void;
}) {
  const count = (s: Status) => results.filter((r) => statusOf(r) === s).length;
  const options = [
    { value: null, label: 'Todos', n: results.length },
    {
      value: 'elected' as const,
      label: count('elected') === 1 ? 'Definido' : 'Definidos',
      n: count('elected'),
    },
    { value: 'runoff' as const, label: 'Vão ao 2º turno', n: count('runoff') },
    { value: 'open' as const, label: 'Em apuração', n: count('open') },
  ].filter((o) => o.value === null || o.n > 0);
  // Only worth chips when there is more than one kind of state.
  if (options.length <= 2) return null;
  return (
    <fieldset className="mb-3 min-w-0">
      <legend className="sr-only">Filtrar estados</legend>
      <div className="scroll-x -mx-4 flex gap-1.5 px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {options.map((o) => (
          <button
            key={o.label}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className="h-9 shrink-0 whitespace-nowrap rounded-full border border-line px-3.5 text-[14px] text-ink-2 hover:border-line-strong aria-pressed:border-live aria-pressed:bg-live-soft aria-pressed:font-medium aria-pressed:text-ink"
          >
            {o.label} <span className="numeral text-muted">{o.n}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function StateCard({ result }: { result: ResultDTO }) {
  const { href, round } = useRound();
  // In a runoff a new photo may still be on its way: the 1st round's one stands in.
  const firstRound = `${round.electionSlug}-1`;
  const top = result.candidates.filter(hasValidVotes).slice(0, (result.seats ?? 1) + 1);
  return (
    <Link
      href={href(`/states/${result.areaKey}`, { cargo: result.office.slug })}
      className="block h-full rounded-xl border border-line bg-surface p-3 hover:border-line-strong"
    >
      <span className="mb-2 flex items-baseline justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <StateFlag uf={result.areaKey} />
          <span className="truncate font-semibold">{result.areaName}</span>
        </span>
        <span className="shrink-0 text-[12px] text-muted">
          {fmtPct(result.progress.countedPct, 1)} das urnas
        </span>
      </span>
      <span className="grid gap-1.5">
        {top.map((c, i) => (
          <span key={c.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2">
            <span className="flex min-w-0 items-center gap-2">
              <FacePhoto c={c} fallbackRound={firstRound} sizeClass="size-8 text-[11px]" />
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: c.color }} aria-hidden />
              <span className="truncate text-[14px]">{displayName(c.ballotName)}</span>
              <span className="shrink-0 text-[12px] text-muted">{c.party.abbreviation}</span>
              {/* "Não eleito" next to every runner-up is noise in a card this small. */}
              {!/^n[aã]o eleit/i.test(c.status ?? '') && <StatusPill c={c} result={result} rank={i + 1} />}
            </span>
            <span className="numeral text-[14px]">{result.votesPublishable ? fmtPct(c.percent) : '—'}</span>
          </span>
        ))}
        {top.length === 0 && <span className="text-[13px] text-muted">Ainda sem votos apurados.</span>}
      </span>
    </Link>
  );
}
