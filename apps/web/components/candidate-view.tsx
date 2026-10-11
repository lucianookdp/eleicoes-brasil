'use client';

import type { CandidateAreasDTO } from '@eleicoes/election-core';
import { hasValidVotes } from '@eleicoes/election-core';
import Link from 'next/link';
import { useState } from 'react';
import { displayName, fmtInt, fmtPct } from '@/lib/format';
import { useCandidate, useCandidateAreas } from '@/lib/queries';
import { candidatePath } from '@/lib/rounds';
import { FacePhoto, Provenance, StatusPill } from './results';
import { useRound } from './shell';
import { Breadcrumbs, EmptyState, ErrorNotice, Panel, Skeleton, StateFlag } from './ui';

const MATE: Record<string, string> = {
  vice: 'Vice',
  'first-alternate': '1º suplente',
  'second-alternate': '2º suplente',
};

/**
 * One candidate's own page: who they are, how they did in their race and where the votes came
 * from. The person is the ballot number in that office and state, never the name.
 */
export function CandidateView({ office, number, uf }: { office: string; number: string; uf: string | null }) {
  const { round, elections, href } = useRound();
  const { data, error, refetch } = useCandidate(round.slug, office, number, uf);
  // Deputies: the list by city reads every city's full result (in a big state, seconds of the
  // database for one page), so it is fetched when the reader asks for it, not by every visit or
  // crawler. Governors, senators and the president are light: shown at once.
  const [asked, setAsked] = useState(false);
  const light = data ? data.office.kind === 'majoritarian' : false;
  const areas = useCandidateAreas(round.slug, office, number, uf, !!data && (light || asked));

  if (!data) {
    if ((error as { status?: number } | null)?.status === 404) {
      return (
        <EmptyState title="Candidato não encontrado neste turno.">
          <Link href={href()} className="text-info underline">
            Ir para a apuração
          </Link>
        </EmptyState>
      );
    }
    return error ? <ErrorNotice error={error} retry={() => refetch()} /> : <Skeleton className="h-72" />;
  }

  const c = data.candidate;
  const name = displayName(c.ballotName);
  const full = displayName(c.name);
  const state = data.uf?.toLowerCase() ?? null;
  // The whole race, where this candidate is one line among the others.
  const race = state ? href(`/states/${state}`, { cargo: data.office.slug }) : href();
  const mates = c.runningMates.filter((m) => m.ballotName || m.name);
  const proportional = data.office.kind === 'proportional';
  const other = data.otherRound;
  const otherRound = other
    ? elections.find((e) => e.slug === round.electionSlug)?.rounds.find((r) => r.round === other.round)
    : undefined;
  // What StatusPill needs to read the TSE's own word for this candidate.
  const result = {
    final: data.final,
    mathematicallyDecided: data.mathematicallyDecided,
    seats: data.seats,
  } as Parameters<typeof StatusPill>[0]['result'];

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Brasil', href: href() },
          ...(state ? [{ label: data.areaName, href: href(`/states/${state}`) }] : []),
          { label: data.office.name, href: race },
          { label: name },
        ]}
      />
      <section
        aria-label="Candidato"
        className="relative mb-4 overflow-hidden rounded-xl border border-line bg-surface lg:mb-6"
      >
        <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: c.color }} />
        <div className="p-4 pt-5 sm:p-6 sm:pt-7">
          <div className="lg:flex lg:items-center lg:gap-8">
            <div className="flex min-w-0 items-center gap-4 sm:gap-5 lg:flex-1">
              <span
                className="shrink-0 rounded-full p-[3px]"
                style={{ boxShadow: `inset 0 0 0 2px ${c.color}` }}
              >
                <FacePhoto
                  c={c}
                  fallbackRound={`${round.electionSlug}-1`}
                  sizeClass="size-[76px] text-[24px] sm:size-28 sm:text-[32px]"
                />
              </span>
              <div className="min-w-0">
                <h1 className="text-balance text-[24px] font-semibold leading-tight tracking-tight sm:text-[32px]">
                  {name}
                </h1>
                {full !== name && <p className="text-[13.5px] text-muted">{full}</p>}
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14.5px] text-ink-2">
                  <StatusPill c={c} result={result} rank={data.rank} />
                  {!hasValidVotes(c) && (
                    <span
                      className="rounded bg-warn-soft px-1.5 py-0.5 text-[11.5px] font-medium text-warn"
                      title="Destinação dos votos informada pelo TSE"
                    >
                      {c.voteDestination}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    {state && <StateFlag uf={state} size={16} />}
                    {data.office.name}
                    {state ? ` · ${data.areaName}` : ''}
                  </span>
                </p>
                <p className="mt-0.5 text-[13.5px] text-muted">
                  Número {c.number} · {c.party.abbreviation}
                  {c.coalition && c.coalition !== c.party.abbreviation && <> · {c.coalition}</>}
                </p>
                {mates.map((m) => (
                  <p key={`${m.role}-${m.name}`} className="text-[13.5px] text-muted">
                    {MATE[m.role] ?? 'Vice'}: {displayName(m.ballotName || m.name)}
                    {m.party ? ` (${m.party})` : ''}
                  </p>
                ))}
              </div>
            </div>
            {data.votesPublishable ? (
              <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-line sm:mt-5 sm:grid-cols-3 lg:mt-0 lg:w-[54%] lg:shrink-0">
                <Fact value={fmtInt(c.votes)} label="votos" />
                <Fact value={fmtPct(c.percent)} label="dos votos válidos" />
                <Fact
                  wide
                  value={`${fmtInt(data.rank)}º`}
                  label={`mais votado entre ${fmtInt(data.candidatesTotal)} ${data.candidatesTotal === 1 ? 'candidato' : 'candidatos'}${proportional && data.seats ? ` · ${fmtInt(data.seats)} vagas` : ''}`}
                />
              </dl>
            ) : (
              <p className="mt-4 text-[14px] text-ink-2 lg:mt-0">
                O TSE ainda não divulgou os votos desta disputa.
              </p>
            )}
          </div>
          {other && (
            <p className="mt-3 text-[14px] text-ink-2">
              No {other.round}º turno:{' '}
              <span className="numeral font-semibold text-ink">{fmtPct(other.percent)}</span> (
              {fmtInt(other.votes)} votos){other.status ? ` · ${other.status}` : ''}
              {otherRound && (
                <>
                  {' · '}
                  <Link
                    href={`${candidatePath(otherRound, { office: data.office.slug, number: c.number, uf: data.uf })}`}
                    className="text-info hover:underline"
                  >
                    ver
                  </Link>
                </>
              )}
            </p>
          )}
          <p className="mt-3 text-[13px] text-muted">
            Votos de {fmtPct(data.progress.countedPct)} das urnas
            {state ? ` de ${data.areaName}` : ''}.{' '}
            <Link href={race} className="text-info hover:underline">
              Ver a disputa completa
            </Link>
          </p>
        </div>
      </section>

      <Panel className="p-4 sm:p-5">
        <section aria-labelledby="origem">
          <h2 id="origem" className="text-[17px] font-semibold tracking-tight">
            De onde vieram os votos
          </h2>
          {areas.data ? (
            <Areas areas={areas.data} total={c.votes} color={c.color} />
          ) : !light && !asked ? (
            <div className="mt-2">
              <p className="text-[14px] text-ink-2">
                Veja em quais municípios {state ? `de ${data.areaName} ` : ''}o candidato teve mais votos.
              </p>
              <button
                type="button"
                onClick={() => setAsked(true)}
                className="mt-3 inline-flex h-11 items-center rounded-full bg-ink px-5 text-[14.5px] font-semibold text-ground hover:opacity-90"
              >
                Ver os municípios com mais votos
              </button>
            </div>
          ) : areas.error ? (
            <ErrorNotice error={areas.error} retry={() => areas.refetch()} />
          ) : (
            <>
              {!light && <p className="mt-2 text-[13px] text-muted">Somando os votos de cada município…</p>}
              <Skeleton className="mt-3 h-64" />
            </>
          )}
        </section>
      </Panel>
      {data.provenance && (
        <div className="mt-3">
          <Provenance
            result={
              { provenance: data.provenance, progress: data.progress } as Parameters<
                typeof Provenance
              >[0]['result']
            }
          />
        </div>
      )}
    </>
  );
}

function Fact({ value, label, wide = false }: { value: string; label: string; wide?: boolean }) {
  return (
    <div
      className={`flex flex-col-reverse justify-end bg-surface-2 px-3 py-3 min-[360px]:px-3.5 ${wide ? 'col-span-2 sm:col-span-1' : ''}`}
    >
      <dt className="mt-0.5 text-[12.5px] leading-snug text-muted">{label}</dt>
      <dd className="numeral text-[18px] leading-tight min-[360px]:text-[22px] sm:text-[26px]">{value}</dd>
    </div>
  );
}

/** Every state (national race) or the cities with most votes: votes, share there, and a bar. */
function Areas({ areas, total, color }: { areas: CandidateAreasDTO; total: number; color: string }) {
  const { href } = useRound();
  const byState = areas.kind === 'state';
  if (areas.rows.length === 0) {
    return (
      <p className="mt-2 text-[14px] text-ink-2">
        {byState ? 'Ainda não há votos por estado.' : 'Ainda não há votos por município para este candidato.'}
      </p>
    );
  }
  const max = Math.max(...areas.rows.map((r) => r.votes));
  return (
    <>
      <p className="mt-0.5 text-[13.5px] text-muted">
        {byState
          ? 'Votos em cada estado e no exterior, do maior para o menor.'
          : areas.total > areas.rows.length
            ? `Os ${areas.rows.length} municípios onde teve mais votos, de ${fmtInt(areas.total)} com votos.`
            : 'Os municípios onde teve votos, do maior para o menor.'}
      </p>
      <ol className="mt-3 grid gap-x-8 lg:grid-cols-2">
        {areas.rows.map((r) => {
          const place = r.cityCode
            ? href(`/states/${r.uf.toLowerCase()}/cities/${r.cityCode}`)
            : r.uf === 'ZZ'
              ? null
              : href(`/states/${r.uf.toLowerCase()}`);
          const label = (
            <span className="flex min-w-0 items-center gap-2">
              {byState && r.uf !== 'ZZ' && <StateFlag uf={r.uf.toLowerCase()} size={18} />}
              <span className="truncate">{r.name}</span>
              {r.isCapital && <span className="shrink-0 text-[11.5px] text-muted">capital</span>}
            </span>
          );
          return (
            <li key={`${r.uf}-${r.cityCode ?? ''}`} className="border-b border-line py-2.5 last:border-0">
              <div className="flex items-baseline justify-between gap-3">
                {place ? (
                  <Link href={place} className="min-w-0 font-medium hover:underline">
                    {label}
                  </Link>
                ) : (
                  <span className="min-w-0 font-medium">{label}</span>
                )}
                <span className="shrink-0 text-right">
                  <span className="numeral text-[15.5px]">{fmtInt(r.votes)}</span>
                  <span className="ml-2 text-[12.5px] text-muted">
                    {fmtPct(r.percent, 1)}
                    {r.rank ? ` · ${r.rank}º` : ''}
                  </span>
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(100 * r.votes) / max}%`, background: color }}
                />
              </div>
              {total > 0 && (
                <p className="mt-1 text-[11.5px] text-muted">
                  {fmtPct((100 * r.votes) / total, 1)} dos votos do candidato
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-[12.5px] text-muted">
        {byState
          ? 'A porcentagem ao lado é a parte dos votos válidos do estado, com a posição do candidato ali.'
          : 'A porcentagem ao lado é a parte dos votos válidos do município.'}
      </p>
    </>
  );
}
