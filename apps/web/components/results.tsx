'use client';

import type { CandidateDTO, OfficeInfo, ResultDTO } from '@eleicoes/election-core';
import { formatClock, hasValidVotes, percent } from '@eleicoes/election-core';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { ApiError } from '@/lib/api';
import { API_URL } from '@/lib/api';
import { displayName, fmtInt, fmtPct, fmtPp, fmtSigned, initials, shownTime } from '@/lib/format';
import { useResult } from '@/lib/queries';
import { ShareButton } from './share-button';
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

export function StatusPill({ c, result, rank }: { c: CandidateDTO; result: ResultDTO; rank: number }) {
  let text: string | null = c.status || null;
  if (!text && c.elected && (result.final || result.mathematicallyDecided)) {
    text = result.mathematicallyDecided === 'runoff' ? '2º turno' : 'Eleito';
  }
  // The TSE flags a race as mathematically decided (md) well before it marks the candidate
  // itself (that only comes with the final totalisation). Apply its decision to the leaders.
  if (!text && result.mathematicallyDecided && hasValidVotes(c)) {
    if (result.mathematicallyDecided === 'elected' && rank <= (result.seats ?? 1)) text = 'Eleito';
    if (result.mathematicallyDecided === 'runoff' && rank <= 2) text = '2º turno';
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
function Avatar({
  c,
  photo,
  large = false,
  small = false,
}: {
  c: CandidateDTO;
  photo: boolean;
  large?: boolean;
  small?: boolean;
}) {
  const { round } = useRound();
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ${large ? 'size-16 text-[18px]' : small ? 'size-9 text-[12px]' : 'size-12 text-[14px]'}`}
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
      {/* Every candidate's official photo; deputies' (long lists) are smaller. */}
      <Avatar c={c} photo small={!photo} />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-medium">
          <span className="sr-only">{rank}º. </span>
          <span className="min-w-0 truncate">{displayName(c.ballotName)}</span>
          <StatusPill c={c} result={result} rank={rank} />
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

/** Two finalists (a runoff): one card for both. Used only in round 2, never in the 1st round. */
export function isHeadToHead(result: ResultDTO, round: number) {
  return (
    round === 2 &&
    result.office.kind === 'majoritarian' &&
    result.candidates.filter(hasValidVotes).length === 2
  );
}

/**
 * Runoff card: both candidates side by side, one split bar with the 50% mark, and above all who is
 * ahead and by how many votes.
 */
export function HeadToHead({ result }: { result: ResultDTO }) {
  const { round } = useRound();
  const [x, y] = result.candidates.filter(hasValidVotes) as [CandidateDTO, CandidateDTO];
  // Same place and office in the 1st round, matched by ballot number (the candidacy is the same).
  const firstRound = `${round.electionSlug}-1`;
  const first = useResult(firstRound, result.areaKey, result.office.slug).data;
  const inFirst = (c: CandidateDTO) => first?.candidates.find((f) => f.number === c.number);
  const firstPct = (c: CandidateDTO) => inFirst(c)?.percent;
  // Fixed sides for the whole count: whoever came first in the 1st round on the left. The lead
  // can change during the count; the photos never swap places.
  const [a, b] = (inFirst(y)?.votes ?? -1) > (inFirst(x)?.votes ?? -1) ? [y, x] : [x, y];
  const diff = Math.abs((a.votes ?? 0) - (b.votes ?? 0));
  const pp = Math.abs((a.percent ?? 0) - (b.percent ?? 0));
  const counted = result.progress.countedPct ?? 0;
  const over = result.final || counted >= 100;
  const started = (a.votes ?? 0) + (b.votes ?? 0) > 0;
  const leader = (a.votes ?? 0) >= (b.votes ?? 0) ? a : b;
  const side = (c: CandidateDTO) => (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <FacePhoto c={c} fallbackRound={firstRound} />
      <p className="w-full truncate text-[16px] font-semibold">{displayName(c.ballotName)}</p>
      <p className="-mt-2 text-[12.5px] text-muted">
        {c.number} · {c.party.abbreviation}
      </p>
      <p className="numeral text-[30px] leading-none" style={{ color: c.color }}>
        {result.votesPublishable ? fmtPct(c.percent) : '—'}
      </p>
      <p className="text-[13px] text-ink-2">
        {result.votesPublishable ? `${fmtInt(c.votes)} votos` : 'não divulgado'}
      </p>
      {firstPct(c) != null && <p className="text-[12.5px] text-muted">1º turno: {fmtPct(firstPct(c))}</p>}
    </div>
  );
  return (
    <div className="pt-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 sm:gap-4">
        {side(a)}
        <span className="mt-10 text-[22px] font-light text-muted sm:mt-12" aria-hidden>
          ×
        </span>
        {side(b)}
      </div>
      <div className="relative mt-4 pt-5">
        <div
          className="pointer-events-none absolute inset-y-0 left-1/2 z-10 flex flex-col items-center"
          aria-hidden
        >
          <span className="-translate-y-0.5 whitespace-nowrap text-[11px] text-muted">50%</span>
          <span className="w-px flex-1 bg-ink/70" />
        </div>
        <div
          className="flex h-5 gap-[2px] overflow-hidden rounded-md bg-line"
          role="img"
          aria-label={`${displayName(a.ballotName)} ${fmtPct(a.percent)}, ${displayName(b.ballotName)} ${fmtPct(b.percent)}`}
        >
          <span className="bar h-full" style={{ width: `${a.percent ?? 0}%`, background: a.color }} />
          <span className="flex-1" />
          <span className="bar h-full" style={{ width: `${b.percent ?? 0}%`, background: b.color }} />
        </div>
      </div>
      <div className="mt-4 rounded-xl bg-surface-2 px-4 py-3 text-center" aria-live="polite">
        {!started || !result.votesPublishable ? (
          <p className="text-[15px] text-ink-2">Aguardando os primeiros votos.</p>
        ) : diff === 0 ? (
          <p className="text-[17px] font-semibold">Empate</p>
        ) : (
          <>
            <p className="text-[17px] font-semibold">
              <span style={{ color: leader.color }}>{displayName(leader.ballotName)}</span>{' '}
              {over ? 'venceu por' : 'está à frente por'} {fmtInt(diff)} votos
            </p>
            <p className="text-[13px] text-muted">
              {pp.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} pontos de diferença
              {!over && ` · faltam ${fmtPct(100 - counted, 1)} das urnas`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Large round photo for the head-to-head card. In a runoff the photo may still be on its way, so
 * it falls back to the same candidate's 1st-round photo, then to initials.
 */
function FacePhoto({ c, fallbackRound }: { c: CandidateDTO; fallbackRound: string }) {
  const { round } = useRound();
  const sources = [...new Set([round.slug, fallbackRound])].map(
    (slug) => `${API_URL}/api/elections/${slug}/photos/${c.key}`,
  );
  const [i, setI] = useState(0);
  return (
    <span
      className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full text-[26px] font-semibold sm:size-28"
      style={{
        background: `color-mix(in srgb, ${c.color} 18%, transparent)`,
        color: c.color,
        boxShadow: `inset 0 0 0 3px ${c.color}`,
      }}
      aria-hidden
    >
      {initials(c.ballotName)}
      {i < sources.length && (
        // biome-ignore lint/performance/noImgElement: static export, no image optimisation server
        <img
          key={sources[i]}
          src={sources[i]}
          alt=""
          decoding="async"
          onError={() => setI((n) => n + 1)}
          className="absolute inset-[3px] size-[calc(100%-6px)] rounded-full object-cover object-[center_22%]"
        />
      )}
    </span>
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
        <p className="mt-2 text-[12.5px] text-muted">As vagas só são definidas no fim da apuração.</p>
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
  areaPct,
}: {
  roundSlug: string;
  areaKey: string;
  offices: OfficeInfo[];
  initial?: ResultDTO | null;
  /** Share of this area's polling stations the TSE has already counted (counting file). */
  areaPct?: number | null;
}) {
  const { round } = useRound();
  const [office, setOffice] = useOfficeParam(offices);
  const [view, setView] = useState<'candidates' | 'parties'>('candidates');
  const [limit, setLimit] = useState<number | undefined>(undefined);
  const query = useResult(roundSlug, areaKey, office?.slug, limit);
  const result = query.data ?? (initial && initial.office.slug === office?.slug ? initial : undefined);

  if (!office) return <EmptyState title="Nenhum cargo em disputa aqui." />;

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
        <EmptyState title="Ainda não há resultados para este cargo.">
          Os números aparecem assim que o TSE divulgar a primeira parcial deste local.
        </EmptyState>
      )}
      {!result && query.error && (query.error as ApiError).status !== 404 && (
        <ErrorNotice error={query.error} retry={() => query.refetch()} />
      )}
      {result && (
        <div>
          {/* Only city vote files can wait in our queue; Brazil and states are polled every few
              seconds, and a TSE pause there is announced once, at the top of the page. */}
          {areaKey.includes('-') && <BehindNotice result={result} areaPct={areaPct} />}
          {!result.votesPublishable && (
            <p className="mb-3 rounded-lg bg-surface-2 px-3 py-2 text-[13px] text-ink-2">
              O TSE ainda não liberou os votos deste cargo. Os números aparecem assim que a divulgação for
              autorizada.
            </p>
          )}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted">
            <span>
              Votos de {fmtPct(result.progress.countedPct)} das urnas · {fmtInt(result.votes.valid)} votos
              válidos
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
              {isHeadToHead(result, round.round) ? (
                <HeadToHead result={result} />
              ) : (
                <>
                  {result.office.kind === 'majoritarian' && <RaceBar result={result} />}
                  <CandidateList result={result} />
                </>
              )}
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
          <ShareButton result={result} />
          <Provenance result={result} />
        </div>
      )}
    </div>
  );
}

/**
 * The counting file (how many stations are in) arrives in seconds; per-city vote files wait in
 * the collector's queue. When the votes shown are behind what the TSE already counted here, say
 * so plainly instead of letting "100%" sit above older numbers.
 */
function BehindNotice({ result, areaPct }: { result: ResultDTO; areaPct?: number | null }) {
  const shown = result.progress.countedPct;
  if (areaPct == null || shown == null || shown >= 100 || areaPct - shown < 2 || !result.provenance)
    return null;
  return (
    <p className="mb-3 rounded-lg border border-warn/40 bg-warn-soft px-3 py-2 text-[13.5px] text-ink-2">
      <span className="font-medium text-warn">Atualizando:</span> votos das{' '}
      {formatClock(result.provenance.retrievedAt).slice(0, 5)}. Os números mais recentes aparecem em alguns
      minutos.
    </p>
  );
}

export function Provenance({ result }: { result: ResultDTO }) {
  if (!result.provenance) return null;
  const p = result.provenance;
  return (
    <p className="mt-4 text-[12px] text-muted" title={`Arquivo de origem: ${p.sourceFile.split('/').at(-1)}`}>
      Fonte: {p.provider === 'TSE' ? 'TSE' : p.provider}
      {result.progress.totalizedAt && (
        <> · divulgado às {formatClock(shownTime(result.progress.totalizedAt, p.retrievedAt))}</>
      )}{' '}
      · recebido aqui às {formatClock(p.retrievedAt)}
    </p>
  );
}
