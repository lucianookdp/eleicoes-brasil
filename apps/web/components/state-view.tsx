'use client';

import type { ResultDTO, StateDetailDTO } from '@eleicoes/election-core';
import { formatClock, hasValidVotes } from '@eleicoes/election-core';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { sameName, votingSchedule } from '@/lib/abroad';
import { displayName, fmtCompact, fmtInt, fmtPct, fmtPp } from '@/lib/format';
import { useAbroadCities, useCities, useOverview, useResult, useSeries, useStateDetail } from '@/lib/queries';
import { candidatePath } from '@/lib/rounds';
import { CountingHero } from './counting';
import { EvolutionChart } from './evolution-chart';
import { IconSearch } from './icons';
import { ResultPanel, useOfficeParam } from './results';
import { useRound } from './shell';
import {
  Breadcrumbs,
  EmptyState,
  ErrorNotice,
  FavoriteButton,
  FreshnessNotice,
  Panel,
  ProgressBar,
  SectionTitle,
  Skeleton,
  StateFlag,
} from './ui';

export function StateView({ uf, initial }: { uf: string; initial: StateDetailDTO | null }) {
  const { round, href } = useRound();
  const { data, error, refetch } = useStateDetail(
    round.slug,
    uf,
    initial?.round.slug === round.slug ? initial : null,
  );
  const offices = data?.offices ?? [];
  const [office] = useOfficeParam(offices);
  const key = uf.toLowerCase();
  const abroad = uf.toUpperCase() === 'ZZ';
  const result = useResult(round.slug, key, office?.slug);
  const series = useSeries(round.slug, office?.kind === 'majoritarian' ? office.slug : undefined, key);

  if (!data) {
    return error ? <ErrorNotice error={error} retry={() => refetch()} /> : <Skeleton className="h-96" />;
  }
  return (
    <>
      <Breadcrumbs items={[{ label: 'Brasil', href: href() }, { label: data.name }]} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-3 text-[28px] font-semibold tracking-tight sm:text-[32px]">
          <StateFlag uf={uf} size={40} />
          {data.name}
        </h1>
        <FavoriteButton favorite={{ key, label: data.name, detail: uf, path: `/states/${key}` }} />
      </div>
      <FreshnessNotice ingestion={data.ingestion} progress={data.progress} roundStatus={data.round.status} />
      {abroad && (
        <p className="mt-3 text-[13.5px] text-muted">
          No exterior só se vota para presidente, das 8h às 17h no horário local de cada país. Por isso os
          resultados de cada cidade chegam em horários diferentes.
        </p>
      )}

      <section aria-labelledby="cargos" className="mt-4">
        <SectionTitle id="cargos" title="Resultados por cargo" />
        {offices.length === 0 ? (
          <EmptyState title="Nenhum cargo em disputa neste estado." />
        ) : (
          <div className="grid gap-8 lg:grid-cols-12 [&>*]:min-w-0">
            <div className="lg:col-span-7">
              <ResultPanel
                roundSlug={round.slug}
                areaKey={key}
                offices={offices}
                areaPct={data.progress?.countedPct}
              />
            </div>
            <div className="lg:col-span-5">
              {office?.kind === 'majoritarian' && (
                <Panel className="p-3 sm:p-4">
                  <h3 className="mb-2 text-[14px] font-medium text-ink-2">Evolução · {office.name}</h3>
                  {series.data ? (
                    <EvolutionChart series={series.data} majority={office.slug !== 'senador'} />
                  ) : (
                    <Skeleton className="h-72" />
                  )}
                </Panel>
              )}
            </div>
          </div>
        )}
      </section>

      {abroad && <AbroadHours />}
      {abroad && result.data && <AbroadVsBrazil abroad={result.data} cities={data.cityCount} />}

      {/* Results first (what readers came for); the counting details follow. */}
      <section className="mt-10">
        <CountingHero
          progress={data.progress}
          votes={result.data?.votes}
          votesFor={office?.name}
          title={abroad ? 'Apuração no exterior' : `Apuração em ${data.name}`}
        />
      </section>

      <Cities uf={uf} total={data.cityCount} abroad={abroad} />
    </>
  );
}

const CITY_SORTS = [
  { value: 'default', label: 'Maiores primeiro' },
  { value: 'name', label: 'Nome' },
  { value: 'counted-desc', label: 'Mais apurados' },
  { value: 'counted-asc', label: 'Menos apurados' },
  { value: 'turnout', label: 'Mais votos' },
  { value: 'updated', label: 'Atualizados agora' },
];

function Cities({ uf, total, abroad }: { uf: string; total: number; abroad: boolean }) {
  const { round, href } = useRound();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [sort, setSort] = useState('default');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 200);
    return () => clearTimeout(t);
  }, [q]);
  // The headline race's candidates (president), with their colours: "Mais votos de …" options.
  const headline = useOverview(round.slug).data?.headline;
  const candidates = (headline?.candidates ?? []).filter(hasValidVotes).slice(0, 6);
  const colorOf = (number: string) => candidates.find((c) => c.number === number)?.color ?? 'var(--muted)';
  const picked = sort.startsWith('candidate:') ? sort.slice('candidate:'.length) : undefined;
  // "Only where X won": the two leading candidates nationally (in a runoff, the two finalists).
  const [leader, setLeader] = useState<string | null>(null);
  const leaderName = candidates.find((c) => c.number === leader)?.ballotName;
  const pickedName = candidates.find((c) => c.number === picked)?.ballotName;
  const { data, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } = useCities(
    round.slug,
    uf.toLowerCase(),
    {
      q: debounced,
      sort: picked ? 'candidate' : sort,
      candidate: picked,
      leader: leader ?? undefined,
    },
  );
  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const found = data?.pages[0]?.total ?? 0;

  return (
    <section aria-labelledby="municipios" className="mt-12">
      <SectionTitle id="municipios" title={abroad ? 'Cidades no exterior' : 'Municípios'}>
        {fmtInt(total)} {abroad ? 'cidades' : 'municípios'}
      </SectionTitle>
      {candidates.length >= 2 && (
        <fieldset className="mb-3">
          <legend className="mb-1.5 text-[13px] text-muted">
            Mais votado {round.status === 'final' ? '' : 'até agora '}em cada{' '}
            {abroad ? 'cidade' : 'município'}
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {[
              { number: null, label: 'Todos', color: null },
              ...candidates
                .slice(0, 2)
                .map((c) => ({ number: c.number, label: displayName(c.ballotName), color: c.color })),
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                aria-pressed={leader === o.number}
                onClick={() => setLeader(o.number)}
                className="flex h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-[14px] text-ink-2 hover:border-line-strong aria-pressed:border-live aria-pressed:bg-live-soft aria-pressed:font-medium aria-pressed:text-ink"
              >
                {o.color && (
                  <span className="size-2.5 rounded-full" style={{ background: o.color }} aria-hidden />
                )}
                {o.label}
              </button>
            ))}
          </div>
          {leader && data && (
            <p className="mt-1.5 text-[13px] text-ink-2">
              {fmtInt(found)}{' '}
              {abroad ? (found === 1 ? 'cidade' : 'cidades') : found === 1 ? 'município' : 'municípios'} onde{' '}
              {displayName(leaderName ?? '')} teve mais votos
            </p>
          )}
        </fieldset>
      )}
      <div className="mb-3 flex flex-wrap gap-2">
        <label className="flex h-11 min-w-0 flex-1 basis-60 items-center gap-2 rounded-xl border border-line bg-surface px-3 focus-within:border-live">
          <IconSearch className="shrink-0 text-muted" />
          <span className="sr-only">Buscar município</span>
          <input
            type="search"
            enterKeyHint="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={abroad ? 'Buscar cidade' : 'Buscar município'}
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent text-[14px] placeholder:text-muted"
            style={{ outline: 'none' }}
          />
        </label>
        <label className="flex min-w-0 max-w-full items-center gap-2 text-[13px] text-muted">
          Ordenar
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-11 min-w-0 max-w-full truncate rounded-xl border border-line bg-surface px-2 text-[14px] text-ink"
          >
            {CITY_SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
            {candidates.length > 0 && (
              <optgroup label={`Por candidato (${headline?.office.name.toLowerCase()})`}>
                {candidates.map((c) => (
                  <option key={c.number} value={`candidate:${c.number}`}>
                    Mais votos de {displayName(c.ballotName)}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
      </div>
      {data && items.length === 0 && (
        <EmptyState title={`Nenhum município encontrado para “${debounced}”.`} />
      )}
      <ul
        className={`grid gap-x-6 sm:grid-cols-2 xl:grid-cols-3 ${isFetching && !isFetchingNextPage ? 'opacity-70' : ''}`}
      >
        {items.map((c) => {
          const p = c.progress;
          return (
            <li key={c.code} className="border-b border-line">
              <Link
                href={href(`/states/${uf.toLowerCase()}/cities/${c.code}`)}
                className="block py-3 hover:bg-surface-2/60"
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-medium">
                    {c.name}
                    {c.isCapital && (
                      <span className="ml-1.5 text-[12px] font-normal text-muted">capital</span>
                    )}
                  </span>
                  <span className="numeral text-[15px]">
                    {p && p.status !== 'not-started' ? fmtPct(p.countedPct) : '—'}
                  </span>
                </span>
                <ProgressBar
                  value={p?.countedPct ?? null}
                  label={`${c.name}: urnas apuradas`}
                  className="mt-1.5"
                />
                <span className="mt-1 flex justify-between text-[12.5px] text-muted">
                  <span>
                    {fmtInt(p?.sectionsCounted)} de {fmtInt(p?.sectionsTotal)} urnas
                  </span>
                  <span>{p?.turnout != null ? `${fmtInt(p.turnout)} votos` : ''}</span>
                </span>
                {picked && pickedName ? (
                  <span className="mt-1.5 flex items-center gap-1.5 text-[13.5px]">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: colorOf(picked) }}
                      aria-hidden
                    />
                    <span className="min-w-0 truncate text-ink-2">{displayName(pickedName)}:</span>
                    <span className="numeral shrink-0 font-medium">
                      {c.pick ? fmtInt(c.pick.votes) : '—'}
                    </span>
                    <span className="shrink-0 text-muted">
                      {c.pick ? `votos · ${fmtPct(c.pick.percent)}` : 'sem votos apurados'}
                    </span>
                  </span>
                ) : (
                  c.leader && (
                    <span className="mt-1.5 flex items-center gap-1.5 text-[13.5px]">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: colorOf(c.leader.number) }}
                        aria-hidden
                      />
                      <span className="shrink-0 text-muted">Mais votado:</span>
                      <span className="min-w-0 truncate font-medium">{displayName(c.leader.ballotName)}</span>
                      <span className="shrink-0 text-muted">{fmtPct(c.leader.percent)}</span>
                    </span>
                  )
                )}
                {c.before && (
                  <span className="mt-0.5 block truncate text-[12.5px] text-muted">
                    No 1º turno: {displayName(c.before.ballotName)}
                  </span>
                )}
                {p?.totalizedAt && (
                  <span className="sr-only">Atualizado às {formatClock(p.totalizedAt)}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      {hasNextPage && (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mt-4 h-11 w-full rounded-xl border border-line text-[14px] font-medium text-ink-2 hover:border-line-strong hover:text-ink disabled:opacity-60"
        >
          {isFetchingNextPage ? 'Carregando…' : `Mostrar mais (${fmtInt(items.length)} de ${fmtInt(found)})`}
        </button>
      )}
    </section>
  );
}

/**
 * Votes abroad next to the country's: how many voters that is, and each candidate's share there
 * and in Brazil as a whole. Only the TSE's own numbers, side by side.
 */
function AbroadVsBrazil({ abroad, cities }: { abroad: ResultDTO; cities: number }) {
  const { round } = useRound();
  const country = useOverview(round.slug).data;
  const national = country?.headline;
  if (!country || !national || !abroad.votesPublishable) return null;
  const rows = abroad.candidates.filter(hasValidVotes).slice(0, 6);
  if (rows.length === 0) return null;
  const here = abroad.progress.electorateTotal;
  const all = country.progress?.electorateTotal;
  const facts = [
    {
      label: 'Eleitores no exterior',
      value: fmtInt(here),
      detail: here && all ? `${fmtPct((100 * here) / all, 2)} do eleitorado do país` : null,
    },
    { label: 'Cidades com votação', value: fmtInt(cities), detail: 'em outros países' },
    { label: 'Urnas', value: fmtInt(abroad.progress.sectionsTotal), detail: null },
  ];
  return (
    <section aria-labelledby="exterior-brasil" className="mt-10">
      <SectionTitle id="exterior-brasil" title="O voto no exterior e no Brasil" />
      <Panel className="p-4 sm:p-5">
        <dl className="grid gap-px overflow-hidden rounded-lg bg-line sm:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label} className="bg-surface-2 px-3.5 py-3">
              <dt className="text-[12.5px] text-muted">{f.label}</dt>
              <dd className="numeral text-[22px] leading-tight">{f.value}</dd>
              {f.detail && <dd className="text-[12.5px] text-muted">{f.detail}</dd>}
            </div>
          ))}
        </dl>
        <div className="scroll-x mt-4">
          <table className="w-full text-[14.5px]">
            <caption className="sr-only">
              Porcentagem dos votos válidos de cada candidato no exterior e no Brasil inteiro
            </caption>
            <thead className="text-left text-[12.5px] text-muted">
              <tr className="border-b border-line">
                <th className="py-2 pr-3 font-normal">Candidato</th>
                <th className="py-2 pr-3 text-right font-normal">Exterior</th>
                <th className="py-2 pr-3 text-right font-normal">Brasil</th>
                <th className="py-2 text-right font-normal">Diferença</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const home = national.candidates.find((n) => n.number === c.number);
                const diff = c.percent != null && home?.percent != null ? c.percent - home.percent : null;
                return (
                  <tr key={c.key} className="border-b border-line/70 last:border-0">
                    <td className="py-2.5 pr-3">
                      <Link
                        href={candidatePath(round, {
                          office: abroad.office.slug,
                          number: c.number,
                          uf: null,
                        })}
                        className="flex items-center gap-2 font-medium hover:underline"
                      >
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ background: c.color }}
                          aria-hidden
                        />
                        <span className="truncate">{displayName(c.ballotName)}</span>
                      </Link>
                    </td>
                    <td className="numeral py-2.5 pr-3 text-right">{fmtPct(c.percent)}</td>
                    <td className="numeral py-2.5 pr-3 text-right text-ink-2">{fmtPct(home?.percent)}</td>
                    <td className="numeral py-2.5 text-right text-ink-2">{fmtPp(diff) ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[12.5px] text-muted">
          Porcentagens dos votos válidos. “Diferença” é quanto o candidato teve a mais ou a menos no exterior
          do que no país inteiro, em pontos percentuais.
        </p>
      </Panel>
    </section>
  );
}

const BRASILIA_DAY = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'America/Sao_Paulo' });
const BRASILIA_TIME = new Intl.DateTimeFormat('pt-BR', {
  hour: 'numeric',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'America/Sao_Paulo',
});
/** "sáb. 16h", "dom. 3h30": the weekday matters, the first polls open on the eve in Brasília. */
function brasilia(at: Date) {
  const [h, m] = BRASILIA_TIME.format(at).split(':');
  return `${BRASILIA_DAY.format(at).replace('.', '')}. ${Number(h)}h${m === '00' ? '' : m}`;
}

/**
 * When Brazilians abroad vote: 8h to 17h in each place's own time, shown here in Brasília time and
 * in the order the polls open round the world (New Zealand first, the west coast of North America
 * last). The time zones are ours (lib/abroad.ts); the cities, electorates and polling stations are
 * the electoral courts' (TSE and TRE-DF).
 */
function AbroadHours() {
  const { round } = useRound();
  const cities = useAbroadCities(round.slug, true).data;
  // Which places are voting right now: re-read every minute, on election day it changes.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  if (!cities || cities.length === 0) return null;
  const { slots, unknown, noPolls, elsewhere, away } = votingSchedule(
    cities.map((c) => ({ name: c.name, voters: c.progress?.electorateTotal })),
    round.date,
  );
  if (slots.length === 0) return null;
  const first = slots[0]!;
  const last = slots.at(-1)!;
  return (
    <section aria-labelledby="horarios-exterior" className="mt-10">
      <SectionTitle id="horarios-exterior" title="Quando cada lugar vota" />
      <Panel className="p-4 sm:p-5">
        <p className="max-w-3xl text-[14px] leading-relaxed text-ink-2">
          No exterior a votação vai das 8h às 17h no horário de cada lugar. Abaixo, os horários de Brasília,
          na ordem em que as urnas abrem: as primeiras urnas abrem{' '}
          <strong className="font-semibold text-ink">{brasilia(first.opens)}</strong> e as últimas fecham{' '}
          <strong className="font-semibold text-ink">{brasilia(last.closes)}</strong>. O TSE só começa a
          divulgar os resultados às 17h de Brasília, quando termina a votação no Brasil.
        </p>
        <ol className="mt-4 divide-y divide-line border-t border-line">
          {slots.map((slot) => {
            const voting = now >= slot.opens.getTime() && now < slot.closes.getTime();
            const over = now >= slot.closes.getTime();
            return (
              <li
                key={slot.opens.getTime()}
                className="grid gap-x-4 gap-y-1 py-3 sm:grid-cols-[11.5rem_minmax(0,1fr)]"
              >
                <p className="text-[14.5px]">
                  <span className="numeral font-semibold">
                    {brasilia(slot.opens)} – {brasilia(slot.closes)}
                  </span>
                  <span className="block text-[12.5px] text-muted">
                    {voting && <span className="font-medium text-live">Votando agora · </span>}
                    {over && 'Encerrada · '}
                    {slot.voters > 0 &&
                      `${fmtCompact(slot.voters)} ${slot.voters === 1 ? 'eleitor' : 'eleitores'}`}
                  </span>
                </p>
                <p className="text-[14px] leading-relaxed text-ink-2">
                  {slot.places.map((place, i) => (
                    <span key={place.country}>
                      {i > 0 && ' · '}
                      <span className="font-medium text-ink">{place.country}</span>
                      {/* A country with a single place of the same name needs no list. */}
                      {!(place.cities.length === 1 && sameName(place.cities[0]!, place.country)) &&
                        ` (${place.cities.join(', ')})`}
                    </span>
                  ))}
                </p>
              </li>
            );
          })}
        </ol>
        {unknown.length > 0 && (
          <p className="mt-3 text-[12.5px] text-muted">Sem horário nesta lista: {unknown.join(', ')}.</p>
        )}
        {(elsewhere.length > 0 || away.length > 0) && (
          <p className="mt-3 text-[12.5px] text-muted">
            {elsewhere.length > 0 &&
              `Ficam em outro fuso, mas o TSE divulga os votos junto com os da cidade entre parênteses: ${elsewhere
                .map((far) => `${far.place} (${far.city})`)
                .join(', ')}. `}
            {away.length > 0 &&
              `Votam em outra cidade: ${away.map((a) => `${a.city} (em ${a.votesIn})`).join(', ')}.`}
          </p>
        )}
        {noPolls.length > 0 && (
          <p className="mt-3 text-[12.5px] text-muted">
            Sem votação nesta eleição, por terem menos de 30 eleitores: {noPolls.join(', ')}.
          </p>
        )}
        <p className="mt-3 text-[12.5px] text-muted">
          Cidades, eleitores e locais de votação: TSE e TRE-DF. Os horários são calculados pelo site a partir
          do fuso de cada local.
        </p>
      </Panel>
    </section>
  );
}
