'use client';

import type { CandidateDTO, OfficeInfo, ResultDTO } from '@eleicoes/election-core';
import { formatClock, hasValidVotes, percent } from '@eleicoes/election-core';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { ApiError } from '@/lib/api';
import { API_URL } from '@/lib/api';
import { displayName, fmtInt, fmtPct, fmtPp, fmtSigned, initials } from '@/lib/format';
import { useResult } from '@/lib/queries';
import { useRound } from './shell';
import { EmptyState, ErrorNotice, Segmented, Skeleton } from './ui';

/** Single-seat majoritarian races have an absolute-majority threshold worth drawing. */
const hasMajorityLine = (r: ResultDTO) => r.office.kind === 'majoritarian' && r.seats === 1;

/** Shares of the valid vote as one stacked bar, with the 50% threshold marked. */
export function RaceBar({ result, top = 6 }: { result: ResultDTO; top?: number }) {
  // Only valid votes compete: annulled candidates stay in the list, flagged, but not in the bar.
  const shown = result.candidates
    .filter(hasValidVotes)
    .slice(0, top)
    .filter((c) => (c.percent ?? 0) > 0);
  const rest = 100 - shown.reduce((s, c) => s + (c.percent ?? 0), 0);
  if (shown.length === 0) return null;
  return (
    <div className="relative pt-5">
      {hasMajorityLine(result) && (
        <div
          className="pointer-events-none absolute inset-y-0 left-1/2 z-10 flex flex-col items-center"
          aria-hidden
        >
          <span className="-translate-y-0.5 whitespace-nowrap text-[11px] text-muted">50% dos válidos</span>
          <span className="w-px flex-1 bg-ink/70" />
        </div>
      )}
      <div
        className="flex h-4 gap-[2px] overflow-hidden rounded-[4px]"
        role="img"
        aria-label={shown.map((c) => `${displayName(c.ballotName)} ${fmtPct(c.percent)}`).join(', ')}
      >
        {shown.map((c) => (
          <span
            key={c.key}
            className="bar h-full first:rounded-l-[4px]"
            style={{ width: `${c.percent}%`, background: c.color }}
          />
        ))}
        {rest > 0.05 && <span className="bar h-full flex-1 rounded-r-[4px] bg-line" />}
      </div>
    </div>
  );
}

function StatusPill({ c, result }: { c: CandidateDTO; result: ResultDTO }) {
  let text: string | null = c.status || null;
  if (!text && c.elected && (result.final || result.mathematicallyDecided)) {
    text = result.mathematicallyDecided === 'runoff' ? '2º turno' : 'Eleito';
  }
  if (!text) return null;
  const tone =
    /eleit/i.test(text) && !/não/i.test(text)
      ? 'bg-live-soft text-live'
      : /2º|segundo/i.test(text)
        ? 'bg-surface-2 text-info'
        : 'bg-surface-2 text-muted';
  return <span className={`rounded px-1.5 py-0.5 text-[11.5px] font-medium ${tone}`}>{text}</span>;
}

/** Official photo when the TSE publishes one (served by our API), initials otherwise. */
function Avatar({ c, photo }: { c: CandidateDTO; photo: boolean }) {
  const { round } = useRound();
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={`relative flex items-center justify-center overflow-hidden rounded-full font-semibold ${photo ? 'size-12 text-[14px]' : 'size-9 text-[12px]'}`}
      style={{
        background: `color-mix(in srgb, ${c.color} 18%, transparent)`,
        color: c.color,
        boxShadow: `inset 0 0 0 1.5px ${c.color}`,
      }}
      aria-hidden
    >
      {initials(c.ballotName)}
      {photo && !failed && (
        // biome-ignore lint/performance/noImgElement: static export, no image optimisation server
        <img
          src={`${API_URL}/api/elections/${round.slug}/photos/${c.key}`}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover object-[center_22%]"
        />
      )}
      {/* Party-colour ring drawn over the photo (an inset shadow on the img itself is hidden). */}
      <span className="absolute inset-0 rounded-full" style={{ boxShadow: `inset 0 0 0 2px ${c.color}` }} />
    </span>
  );
}

export function CandidateRow({ c, result, rank }: { c: CandidateDTO; result: ResultDTO; rank: number }) {
  const pp = fmtPp(c.deltaPp);
  const delta = fmtSigned(c.deltaVotes);
  const mates = c.runningMates.filter((m) => m.name);
  const photo = result.office.kind === 'majoritarian';
  return (
    <li
      className={`grid items-center gap-x-3 gap-y-1.5 py-3 ${photo ? 'grid-cols-[48px_minmax(0,1fr)_auto]' : 'grid-cols-[36px_minmax(0,1fr)_auto]'}`}
    >
      <Avatar c={c} photo={photo} />
      <div className="min-w-0">
        <p className="flex items-center gap-2 truncate font-medium">
          <span className="sr-only">{rank}º. </span>
          <span className="truncate">{displayName(c.ballotName)}</span>
          <StatusPill c={c} result={result} />
          {!hasValidVotes(c) && (
            <span
              className="rounded bg-warn-soft px-1.5 py-0.5 text-[11.5px] font-medium text-warn"
              title="Destinação dos votos informada pelo TSE"
            >
              {c.voteDestination}
            </span>
          )}
        </p>
        <p className="truncate text-[12.5px] text-muted">
          {c.number} · {c.party.abbreviation}
          {c.coalition && c.coalition !== c.party.abbreviation && <> · {c.coalition}</>}
          {mates.length > 0 && (
            <span className="hidden sm:inline">
              {' '}
              · {mates[0]!.role === 'vice' ? 'Vice' : 'Suplente'}: {displayName(mates[0]!.ballotName)}
            </span>
          )}
        </p>
      </div>
      <div className="text-right">
        <p className="numeral text-[20px] leading-none">
          {result.votesPublishable ? fmtPct(c.percent) : '—'}
        </p>
        <p className="mt-1 text-[12px] text-muted">
          {result.votesPublishable ? `${fmtInt(c.votes)} votos` : 'não divulgado'}
        </p>
      </div>
      <div className="col-start-2 h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className="bar h-full rounded-full"
          style={{ width: `${c.percent ?? 0}%`, background: c.color }}
        />
      </div>
      <p
        className="col-start-3 whitespace-nowrap text-right text-[11.5px] leading-none text-muted"
        title="Variação desde a atualização anterior"
      >
        {pp ?? delta ?? ' '}
        {pp && delta && <span className="sr-only"> ({delta} votos)</span>}
      </p>
    </li>
  );
}

/** `collapsed` shows only the leaders until the reader asks for the rest. */
export function CandidateList({ result, collapsed }: { result: ResultDTO; collapsed?: number }) {
  const [all, setAll] = useState(false);
  const list = collapsed && !all ? result.candidates.slice(0, collapsed) : result.candidates;
  return (
    <>
      <ol className="divide-y divide-line">
        {list.map((c, i) => (
          <CandidateRow key={c.key} c={c} result={result} rank={i + 1} />
        ))}
      </ol>
      {collapsed && result.candidates.length > collapsed && (
        <button
          type="button"
          onClick={() => setAll((a) => !a)}
          aria-expanded={all}
          className="mt-1 min-h-10 w-full rounded-lg text-[13.5px] text-info hover:bg-surface-2"
        >
          {all ? 'Mostrar menos' : `Ver todos os ${result.candidates.length} candidatos`}
        </button>
      )}
    </>
  );
}

export function PartyTable({ result }: { result: ResultDTO }) {
  const valid = result.votes.valid;
  const rows = [...result.parties]
    .map((p) => ({ ...p, total: (p.nominalVotes ?? 0) + (p.legendVotes ?? 0) }))
    .sort((a, b) => b.total - a.total);
  return (
    <div className="scroll-x">
      <table className="w-full min-w-[520px] text-[14px]">
        <caption className="sr-only">Votação por partido</caption>
        <thead className="text-left text-[12.5px] text-muted">
          <tr className="border-b border-line">
            <th className="py-2 font-normal">Partido</th>
            <th className="py-2 text-right font-normal">Nominais</th>
            <th className="py-2 text-right font-normal">Legenda</th>
            <th className="py-2 text-right font-normal">Total</th>
            <th className="py-2 text-right font-normal">% válidos</th>
            <th className="py-2 text-right font-normal">Vagas</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.number} className="border-b border-line/70">
              <td className="py-2">
                <span className="font-medium">{p.abbreviation}</span>{' '}
                <span className="text-muted">{p.number}</span>
                {p.federation && <span className="ml-1 text-[12px] text-muted">({p.federation})</span>}
              </td>
              <td className="py-2 text-right">{fmtInt(p.nominalVotes)}</td>
              <td className="py-2 text-right">{fmtInt(p.legendVotes)}</td>
              <td className="py-2 text-right">{fmtInt(p.total)}</td>
              <td className="py-2 text-right">{fmtPct(percent(p.total, valid))}</td>
              <td className="py-2 text-right">{result.final ? fmtInt(p.seats) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!result.final && (
        <p className="mt-2 text-[12.5px] text-muted">As vagas só são definidas após a totalização final.</p>
      )}
    </div>
  );
}

/** Office tabs synced with `?cargo=` so a view can be shared by URL. */
export function useOfficeParam(offices: OfficeInfo[]) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const wanted = params.get('cargo');
  const office = offices.find((o) => o.slug === wanted) ?? offices[0];
  const set = (slug: string) => {
    const next = new URLSearchParams(params);
    next.set('cargo', slug);
    router.replace(`${pathname}?${next}`, { scroll: false });
  };
  return [office, set] as const;
}

export function OfficeTabs({
  offices,
  value,
  onChange,
}: {
  offices: OfficeInfo[];
  value: string | undefined;
  onChange: (slug: string) => void;
}) {
  if (offices.length <= 1) return null;
  return (
    <div className="scroll-x -mx-1 mb-3">
      <div role="tablist" aria-label="Cargo" className="flex w-max gap-1 px-1">
        {offices.map((o) => (
          <button
            key={o.slug}
            type="button"
            role="tab"
            aria-selected={o.slug === value}
            onClick={() => onChange(o.slug)}
            className="min-h-9 whitespace-nowrap rounded-md border border-transparent px-3 text-[14px] text-muted hover:text-ink aria-selected:border-line-strong aria-selected:bg-surface-2 aria-selected:text-ink"
          >
            {o.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Complete result view for one area: office tabs, race bar, candidates or parties. */
export function ResultPanel({
  roundSlug,
  areaKey,
  offices,
  initial,
}: {
  roundSlug: string;
  areaKey: string;
  offices: OfficeInfo[];
  initial?: ResultDTO | null;
}) {
  const [office, setOffice] = useOfficeParam(offices);
  const [view, setView] = useState<'candidates' | 'parties'>('candidates');
  const [limit, setLimit] = useState<number | undefined>(undefined);
  const query = useResult(roundSlug, areaKey, office?.slug, limit);
  const result = query.data ?? (initial && initial.office.slug === office?.slug ? initial : undefined);

  if (!office) return <EmptyState title="Nenhum cargo disponível para esta área." />;

  return (
    <div>
      <OfficeTabs
        offices={offices}
        value={office.slug}
        onChange={(s) => {
          setLimit(undefined);
          setView('candidates');
          setOffice(s);
        }}
      />
      {!result && query.isLoading && (
        <div className="grid gap-3">
          <Skeleton className="h-4" />
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      )}
      {!result && query.error && (query.error as ApiError).status === 404 && (
        <EmptyState title="Ainda não há resultados deste cargo aqui.">
          Os números aparecem assim que o TSE publicar a totalização desta área.
        </EmptyState>
      )}
      {!result && query.error && (query.error as ApiError).status !== 404 && (
        <ErrorNotice error={query.error} retry={() => query.refetch()} />
      )}
      {result && (
        <div>
          {!result.votesPublishable && (
            <p className="mb-3 rounded-lg bg-surface-2 px-3 py-2 text-[13px] text-ink-2">
              O TSE ainda não liberou a divulgação dos votos deste cargo. Os números aparecem quando a
              divulgação for autorizada.
            </p>
          )}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted">
            <span>
              {fmtPct(result.progress.countedPct)} das seções · {fmtInt(result.votes.valid)} votos válidos
              {result.seats && result.seats > 1 ? ` · ${result.seats} vagas` : ''}
            </span>
            {result.office.kind === 'proportional' && (
              <Segmented
                label="Visualização"
                value={view}
                onChange={setView}
                options={[
                  { value: 'candidates', label: 'Candidatos' },
                  { value: 'parties', label: 'Partidos' },
                ]}
              />
            )}
          </div>
          {view === 'candidates' || result.office.kind !== 'proportional' ? (
            <>
              {result.office.kind === 'majoritarian' && <RaceBar result={result} />}
              <CandidateList result={result} />
              {result.candidatesTotal > result.candidates.length && (
                <button
                  type="button"
                  onClick={() => setLimit(result.candidatesTotal)}
                  className="mt-3 h-10 w-full rounded-lg border border-line text-[14px] text-ink-2 hover:border-line-strong hover:text-ink"
                >
                  Mostrar todos os {fmtInt(result.candidatesTotal)} candidatos
                </button>
              )}
            </>
          ) : (
            <PartyTable result={result} />
          )}
          <Provenance result={result} />
        </div>
      )}
    </div>
  );
}

export function Provenance({ result }: { result: ResultDTO }) {
  if (!result.provenance) return null;
  const p = result.provenance;
  return (
    <p className="mt-4 text-[12px] text-muted">
      Fonte: {p.provider === 'TSE' ? 'Tribunal Superior Eleitoral — TSE' : p.provider}
      {result.progress.totalizedAt && <> · totalizado às {formatClock(result.progress.totalizedAt)} BRT</>} ·
      recebido às {formatClock(p.retrievedAt)} BRT ·{' '}
      <span className="break-all font-mono text-[11px]" title="Arquivo de origem">
        {p.sourceFile.split('/').at(-1)}
      </span>
    </p>
  );
}
