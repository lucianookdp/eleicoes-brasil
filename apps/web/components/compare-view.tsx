'use client';

import { DOMESTIC_STATES, percent } from '@eleicoes/election-core';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { displayName, fmtInt, fmtPct } from '@/lib/format';
import { useCompare, useOverview } from '@/lib/queries';
import { useRound } from './shell';
import { EmptyState, ErrorNotice, Panel, Skeleton } from './ui';

const MAX = 8;

/** Side-by-side states. Selection lives in the URL so a comparison can be shared. */
export function CompareView() {
  const { round } = useRound();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const selected = (params.get('estados') ?? 'SP,MG,RJ')
    .split(',')
    .filter((s) => DOMESTIC_STATES.some((d) => d.code === s))
    .slice(0, MAX);
  const overview = useOverview(round.slug);
  const offices = (overview.data?.round.offices ?? []).filter((o) => o.scope !== 'city');
  const office = params.get('cargo') ?? offices[0]?.slug;
  const { data, error, refetch, isFetching } = useCompare(round.slug, selected, office);

  const update = (next: { estados?: string[]; cargo?: string }) => {
    const sp = new URLSearchParams(params);
    if (next.estados) sp.set('estados', next.estados.join(','));
    if (next.cargo) sp.set('cargo', next.cargo);
    router.replace(`${pathname}?${sp}`, { scroll: false });
  };
  const toggle = (uf: string) =>
    update({
      estados: selected.includes(uf) ? selected.filter((s) => s !== uf) : [...selected, uf].slice(0, MAX),
    });

  return (
    <>
      <div className="mb-4">
        <h1 className="text-[24px] font-semibold tracking-tight sm:text-[28px]">Comparar estados</h1>
        <p className="text-[13.5px] text-muted">Escolha até {MAX} estados.</p>
      </div>
      <fieldset className="mb-4">
        <legend className="sr-only">Estados</legend>
        <div className="flex flex-wrap gap-1.5">
          {DOMESTIC_STATES.map((s) => {
            const on = selected.includes(s.code);
            return (
              <button
                key={s.code}
                type="button"
                aria-pressed={on}
                title={s.name}
                disabled={!on && selected.length >= MAX}
                onClick={() => toggle(s.code)}
                className="h-9 min-w-11 rounded-md border border-line px-2 font-mono text-[13px] text-muted hover:border-line-strong disabled:opacity-40 aria-pressed:border-live aria-pressed:bg-live-soft aria-pressed:text-ink"
              >
                {s.code}
              </button>
            );
          })}
        </div>
      </fieldset>
      {offices.length > 1 && (
        <label className="mb-5 flex items-center gap-2 text-[13px] text-muted">
          Cargo
          <select
            value={office}
            onChange={(e) => update({ cargo: e.target.value })}
            className="h-10 rounded-lg border border-line bg-surface px-2 text-[14px] text-ink"
          >
            {offices.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {selected.length === 0 && <EmptyState title="Selecione ao menos um estado." />}
      {error && <ErrorNotice error={error} retry={() => refetch()} />}
      {!data && !error && selected.length > 0 && <Skeleton className="h-80" />}
      {data && selected.length > 0 && (
        <ul className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${isFetching ? 'opacity-80' : ''}`}>
          {data.states.map((s) => {
            const p = s.progress;
            const v = s.votes;
            return (
              <li key={s.uf}>
                <Panel className="h-full p-4">
                  <p className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{s.name}</span>
                    <span className="font-mono text-[12px] text-muted">{s.uf}</span>
                  </p>
                  <p className="numeral mt-1 text-[28px] leading-none">
                    {p && p.status !== 'not-started' ? fmtPct(p.countedPct) : '—'}
                  </p>
                  <p className="text-[12.5px] text-muted">apurado</p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[13px]">
                    {[
                      ['Comparecimento', fmtPct(p?.turnoutPct, 1)],
                      ['Abstenção', fmtPct(p?.abstentionPct, 1)],
                      ['Válidos', fmtPct(percent(v?.valid, v?.total), 1)],
                      ['Brancos', fmtPct(percent(v?.blank, v?.total), 1)],
                      ['Nulos', fmtPct(percent(v?.null, v?.total), 1)],
                      ['Votos', fmtInt(v?.total)],
                    ].map(([k, val]) => (
                      <div key={k} className="contents">
                        <dt className="text-muted">{k}</dt>
                        <dd className="text-right">{val}</dd>
                      </div>
                    ))}
                  </dl>
                  {s.candidates.length > 0 && (
                    <ol className="mt-3 grid gap-2 border-t border-line pt-3">
                      {s.candidates.slice(0, 4).map((c) => (
                        <li key={c.key}>
                          <p className="flex justify-between gap-2 text-[13px]">
                            <span className="truncate">{displayName(c.name)}</span>
                            <span className="font-medium">{fmtPct(c.percent, 1)}</span>
                          </p>
                          <div className="mt-1 h-1.5 rounded-full bg-line">
                            <div
                              className="bar h-full rounded-full"
                              style={{ width: `${c.percent ?? 0}%`, background: c.color }}
                            />
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </Panel>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
