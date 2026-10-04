'use client';

import type { ProgressDTO, StateRowDTO, VoteTotals } from '@eleicoes/election-core';
import { formatClock, percent } from '@eleicoes/election-core';
import { useState } from 'react';
import { fmtCompact, fmtInt, fmtPct, shownTime } from '@/lib/format';
import { useRound } from './shell';
import { Stat } from './ui';

const DAY = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone: 'UTC' });

const REGION_ORDER = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul', 'Exterior'];

/**
 * "How much is counted": one big figure, one bar, the five regions, and the
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
  const { round } = useRound();
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
          {started ? fmtPct(progress.countedPct) : progress ? fmtPct(0) : '—'}
        </p>
        {started && progress.totalizedAt && (
          <p className="hidden pb-1.5 text-right text-[13px] text-ink-2 sm:block">
            atualizado às{' '}
            <span className="font-medium text-ink">
              {formatClock(shownTime(progress.totalizedAt, progress.updatedAt))}
            </span>
          </p>
        )}
      </div>
      <p className="mt-1 text-[14px] text-ink-2">
        {!progress
          ? 'Aguardando os primeiros dados do TSE.'
          : !started
            ? // General elections: polls close at 17h Brasília nationwide and results start right after.
              `A apuração começa em ${DAY.format(new Date(`${round.date}T12:00:00Z`))}, às 17h, quando as urnas fecham. Os números aparecem aqui assim que o TSE divulgar a primeira parcial.`
            : progress.status === 'finished'
              ? `Todas as ${fmtInt(progress.sectionsTotal)} urnas foram apuradas.`
              : `das urnas apuradas · ${fmtInt(progress.sectionsCounted)} de ${fmtInt(progress.sectionsTotal)} (faltam ${fmtInt(pending)})`}
        {started && progress.totalizedAt && (
          <span className="block text-[13px] text-muted sm:hidden">
            atualizado às {formatClock(shownTime(progress.totalizedAt, progress.updatedAt))}
          </span>
        )}
      </p>

      {started && (
        <div
          className="mt-3 h-2.5 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-label="Urnas apuradas"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round((progress.countedPct ?? 0) * 100) / 100}
        >
          <div
            className="bar h-full rounded-full bg-live"
            style={{ width: `${progress.countedPct ?? 0}%` }}
          />
        </div>
      )}

      {states && states.length > 0 && started && <RegionBreakdown states={states} />}

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

/** Counted share per region: five labelled bars, readable at a glance on a phone. */
function RegionBreakdown({ states }: { states: StateRowDTO[] }) {
  const regions = REGION_ORDER.filter((r) => r !== 'Exterior')
    .map((region) => {
      const list = states.filter((s) => s.region === region && s.progress?.sectionsTotal);
      const total = list.reduce((sum, s) => sum + (s.progress!.sectionsTotal ?? 0), 0);
      const counted = list.reduce((sum, s) => sum + (s.progress!.sectionsCounted ?? 0), 0);
      return { region, pct: percent(counted, total) };
    })
    .filter((r) => r.pct != null);
  if (regions.length === 0) return null;
  return (
    <ul
      className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-5"
      aria-label="Apuração por região"
    >
      {regions.map((r) => (
        <li
          key={r.region}
          className="grid grid-cols-[6.5rem_minmax(0,1fr)_3.5rem] items-center gap-2 text-[13px] lg:grid-cols-1 lg:gap-1"
        >
          <span className="text-ink-2">{r.region}</span>
          <span className="h-1.5 overflow-hidden rounded-full bg-line lg:order-3" aria-hidden>
            <span className="bar block h-full rounded-full bg-live/80" style={{ width: `${r.pct}%` }} />
          </span>
          <span className="text-right font-medium lg:order-2 lg:text-left">{fmtPct(r.pct, 1)}</span>
        </li>
      ))}
    </ul>
  );
}
