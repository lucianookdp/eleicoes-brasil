'use client';

import type { ProgressDTO, StateRowDTO, VoteTotals } from '@eleicoes/election-core';
import { formatClock, percent } from '@eleicoes/election-core';
import Link from 'next/link';
import { useState } from 'react';
import { fmtCompact, fmtInt, fmtPct } from '@/lib/format';
import { useRound } from './shell';
import { Stat } from './ui';

const REGION_ORDER = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul', 'Exterior'];

/**
 * "How much is counted": one big figure, one line of context, the state ribbon, and the
 * turnout details (folded on phones so the first screen stays calm).
 */
export function CountingHero({
  progress,
  states,
  votes,
  votesFor,
  title = 'Apuração',
}: {
  progress: ProgressDTO | null;
  states?: StateRowDTO[];
  votes?: VoteTotals | null;
  /** Office whose votes the valid/blank/null figures describe. */
  votesFor?: string;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const started = progress && progress.status !== 'not-started';
  const pending =
    progress?.sectionsTotal != null && progress.sectionsCounted != null
      ? progress.sectionsTotal - progress.sectionsCounted
      : null;

  return (
    <section aria-labelledby="apuracao">
      <h2 id="apuracao" className="text-[13px] font-medium text-muted">
        {title}
      </h2>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <p className="numeral text-[clamp(48px,14vw,84px)] leading-[0.95]" aria-live="polite">
          {started ? fmtPct(progress.countedPct) : '—'}
        </p>
        {started && progress.totalizedAt && (
          <p className="pb-1.5 text-right text-[13px] text-ink-2">
            atualizado às <span className="font-medium text-ink">{formatClock(progress.totalizedAt)}</span>{' '}
            BRT
          </p>
        )}
      </div>
      <p className="mt-1 text-[14px] text-ink-2">
        {!progress
          ? 'Aguardando os primeiros dados do TSE.'
          : !started
            ? 'A apuração ainda não começou. Os números aparecem aqui assim que o TSE publicar a primeira parcial.'
            : progress.status === 'finished'
              ? `Todas as ${fmtInt(progress.sectionsTotal)} seções totalizadas.`
              : `das seções totalizadas · ${fmtInt(progress.sectionsCounted)} de ${fmtInt(progress.sectionsTotal)} (faltam ${fmtInt(pending)})`}
      </p>

      {states && states.length > 0 && started && <StateRibbon states={states} />}

      {started && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="mt-3 flex min-h-10 items-center gap-1 text-[13px] text-info sm:hidden"
        >
          {open ? 'Ocultar comparecimento e votos' : 'Ver comparecimento e votos'}
        </button>
      )}
      <dl
        className={`${open ? 'grid' : 'hidden'} mt-3 grid-cols-3 gap-x-4 gap-y-3 border-t border-line pt-3 sm:mt-4 sm:grid sm:grid-cols-3 lg:grid-cols-6`}
      >
        <Stat label="Eleitorado" value={fmtCompact(progress?.electorateTotal)} />
        <Stat
          label="Comparecimento"
          value={started ? fmtPct(progress?.turnoutPct, 1) : '—'}
          detail={started ? fmtCompact(progress?.turnout) : undefined}
        />
        <Stat
          label="Abstenção"
          value={started ? fmtPct(progress?.abstentionPct, 1) : '—'}
          detail={started ? fmtCompact(progress?.abstention) : undefined}
        />
        <Stat
          label={votesFor ? `Válidos (${votesFor})` : 'Válidos'}
          value={started && votes ? fmtPct(percent(votes.valid, votes.total), 1) : '—'}
          detail={votes ? fmtCompact(votes.valid) : undefined}
        />
        <Stat
          label="Brancos"
          value={started && votes ? fmtPct(percent(votes.blank, votes.total), 1) : '—'}
          detail={votes ? fmtCompact(votes.blank) : undefined}
        />
        <Stat
          label="Nulos"
          value={started && votes ? fmtPct(percent(votes.null, votes.total), 1) : '—'}
          detail={votes ? fmtCompact(votes.null) : undefined}
        />
      </dl>
    </section>
  );
}

/** The national total split into states (width = sections, fill = counted), ordered by region. */
function StateRibbon({ states }: { states: StateRowDTO[] }) {
  const { href } = useRound();
  const withData = states.filter((s) => s.progress?.sectionsTotal);
  const total = withData.reduce((sum, s) => sum + (s.progress?.sectionsTotal ?? 0), 0);
  if (total === 0) return null;
  const ordered = [...withData].sort(
    (a, b) =>
      REGION_ORDER.indexOf(a.region) - REGION_ORDER.indexOf(b.region) ||
      a.name.localeCompare(b.name, 'pt-BR'),
  );
  return (
    <div className="mt-4">
      <div
        className="flex h-7 gap-[2px] sm:h-8"
        role="list"
        aria-label="Apuração por estado, agrupada por região"
      >
        {ordered.map((s) => {
          const share = (s.progress!.sectionsTotal! / total) * 100;
          const pct = s.progress!.countedPct ?? 0;
          return (
            <Link
              key={s.uf}
              role="listitem"
              href={href(`/states/${s.uf.toLowerCase()}`)}
              title={`${s.name}: ${fmtPct(pct)} apurado`}
              aria-label={`${s.name}: ${fmtPct(pct)} apurado`}
              className="group relative flex min-w-[3px] overflow-hidden rounded-[3px] bg-line"
              style={{ flexBasis: `${share}%`, flexGrow: 0, flexShrink: 1 }}
            >
              <span
                className="bar absolute inset-y-0 left-0 bg-live/80 group-hover:bg-live"
                style={{ width: `${pct}%` }}
              />
              {share > 4 && (
                <span className="relative z-10 m-auto hidden text-[10.5px] font-semibold text-ink sm:inline">
                  {s.uf}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      <div className="mt-1 flex gap-[2px] text-[11.5px] text-muted" aria-hidden>
        {REGION_ORDER.map((region) => {
          const share =
            ordered
              .filter((s) => s.region === region)
              .reduce((sum, s) => sum + s.progress!.sectionsTotal!, 0) / total;
          if (share === 0) return null;
          return (
            <span
              key={region}
              className="truncate border-l border-line-strong pl-1"
              style={{ flexBasis: `${share * 100}%` }}
            >
              {share > 0.1 ? region : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
}
