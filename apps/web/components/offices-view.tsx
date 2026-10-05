'use client';

import type { ResultDTO } from '@eleicoes/election-core';
import { hasValidVotes } from '@eleicoes/election-core';
import Link from 'next/link';
import { displayName, fmtPct } from '@/lib/format';
import { useOfficeStates, useOverview } from '@/lib/queries';
import { StatusPill, useOfficeParam } from './results';
import { useRound } from './shell';
import { EmptyState, ErrorNotice, Segmented, Skeleton, StateFlag } from './ui';

/** Governor or senator in every state on one screen: who leads, who is elected, who goes to a runoff. */
export function OfficesView() {
  const { round } = useRound();
  const overview = useOverview(round.slug);
  const offices = (overview.data?.round.offices ?? []).filter(
    (o) => o.scope === 'state' && o.kind === 'majoritarian',
  );
  const [office, setOffice] = useOfficeParam(offices);
  const { data, error, refetch, isFetching } = useOfficeStates(round.slug, office?.slug);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight sm:text-[28px]">
            {round.round === 2 ? 'Governadores no 2º turno' : 'Governadores e senadores'}
          </h1>
          <p className="text-[13.5px] text-muted">
            {round.round === 2
              ? 'Os estados onde a disputa para governador foi ao 2º turno. Toque em um estado para ver tudo.'
              : 'Quem lidera em cada estado. Toque em um estado para ver tudo.'}
          </p>
        </div>
        {offices.length > 1 && office && (
          <Segmented
            label="Cargo"
            value={office.slug}
            onChange={setOffice}
            options={offices.map((o) => ({ value: o.slug, label: o.name }))}
          />
        )}
      </div>
      {overview.data && offices.length === 0 && (
        <EmptyState title="Nesta etapa não há disputa para governador ou senador." />
      )}
      {error && <ErrorNotice error={error} retry={() => refetch()} />}
      {!data && !error && offices.length > 0 && <Skeleton className="h-96" />}
      {data && (
        <>
          <Summary results={data.results} />
          <ul className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-3 ${isFetching ? 'opacity-80' : ''}`}>
            {data.results.map((r) => (
              <li key={r.areaKey}>
                <StateCard result={r} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

/** Counts by the TSE's own status: elected in the 1st round, going to a runoff, still counting. */
function Summary({ results }: { results: ResultDTO[] }) {
  const leaders = (r: ResultDTO) => r.candidates.filter(hasValidVotes);
  const elected = results.filter(
    (r) => r.mathematicallyDecided === 'elected' || leaders(r).some((c) => /^eleit/i.test(c.status ?? '')),
  ).length;
  const runoff = results.filter(
    (r) => r.mathematicallyDecided === 'runoff' || leaders(r).some((c) => /2º turno/i.test(c.status ?? '')),
  ).length;
  const open = results.length - elected - runoff;
  const items = [
    { n: elected, label: elected === 1 ? 'definido' : 'definidos' },
    { n: runoff, label: 'vão ao 2º turno' },
    { n: open, label: 'em apuração' },
  ].filter((i) => i.n > 0);
  if (items.length === 0) return null;
  return (
    <p className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] text-ink-2">
      {items.map((i) => (
        <span key={i.label}>
          <span className="numeral font-semibold text-ink">{i.n}</span> {i.label}
        </span>
      ))}
    </p>
  );
}

export function StateCard({ result }: { result: ResultDTO }) {
  const { href } = useRound();
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
