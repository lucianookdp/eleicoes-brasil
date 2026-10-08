'use client';

import { useState } from 'react';
import {
  byPresident,
  MINISTERS,
  type Minister,
  PHOTOS,
  photoSlug,
  retirementDate,
  STF_CHECKED_AT,
  STF_SOURCE,
  sinceYear,
  VACANCIES,
} from '@/lib/stf';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const checked = STF_CHECKED_AT.split('-').reverse().join('/');
const MONTH = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' });

/** What the court does, in plain words, each with its article of the Constitution. */
const POWERS = [
  {
    title: 'Guarda a Constituição',
    body: 'Decide se uma lei ou ato do governo está de acordo com a Constituição e pode anular o que não estiver.',
    source: 'CF, art. 102, I, a, e § 1º',
  },
  {
    title: 'Julga as mais altas autoridades',
    body: 'Nos crimes comuns, julga o Presidente e o Vice, deputados federais, senadores, os próprios ministros e o Procurador-Geral da República.',
    source: 'CF, art. 102, I, b',
  },
  {
    title: 'Dá a palavra final nos recursos',
    body: 'Julga recursos de todo o país quando a discussão envolve a Constituição (o “recurso extraordinário”).',
    source: 'CF, art. 102, III',
  },
  {
    title: 'Participa da Justiça Eleitoral',
    body: 'Três ministros do STF fazem parte do Tribunal Superior Eleitoral, e o presidente do TSE é sempre um deles.',
    source: 'CF, art. 119',
  },
  {
    title: 'Está na linha de sucessão da Presidência',
    body: 'Se faltarem o Presidente e o Vice, assumem, nesta ordem, os presidentes da Câmara, do Senado e do STF.',
    source: 'CF, art. 80',
  },
  {
    title: 'Como alguém vira ministro',
    body: 'O Presidente indica (brasileiro nato, de 35 a 70 anos), o Senado aprova por maioria absoluta (41 votos) e o ministro fica até se aposentar, no máximo aos 75 anos.',
    source: 'CF, arts. 101 e 40, § 1º, II',
  },
];

/**
 * The Supreme Court (STF), as a tab of the state-offices page: who sits there, who appointed them,
 * when each one must retire, the two panels, and what the court does. Not election data: kept by
 * hand in lib/stf.ts and dated.
 */
export function StfView() {
  const [by, setBy] = useState<string | null>(null);
  const presidents = byPresident();
  const shown = by ? MINISTERS.filter((m) => m.appointedBy === by) : MINISTERS;
  const next = [...MINISTERS].sort((a, b) => +retirementDate(a) - +retirementDate(b))[0]!;

  return (
    <div>
      <p className="text-[13px] text-muted">
        Não faz parte da apuração. Conferido em {checked} no{' '}
        <a
          href={STF_SOURCE}
          target="_blank"
          rel="noopener"
          className="text-info underline underline-offset-2"
        >
          site oficial do STF
        </a>
        .
      </p>

      {/* Same summary line as the governors' tab. */}
      <p className="mb-3 mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] text-ink-2">
        <span>
          <span className="numeral font-semibold text-ink">{MINISTERS.length}</span> ministros
        </span>
        {VACANCIES.length > 0 && (
          <span>
            <span className="numeral font-semibold text-ink">{VACANCIES.length}</span> vaga aberta
          </span>
        )}
        <span>
          Próxima aposentadoria: <span className="font-medium text-ink">{next.name}</span>,{' '}
          {MONTH.format(retirementDate(next))}
        </span>
      </p>

      {/* One row that scrolls sideways on a phone, so it never pushes the list down. */}
      {/* min-w-0: a fieldset otherwise grows to fit its widest row instead of scrolling it. */}
      <fieldset className="mb-2 min-w-0">
        <legend className="sr-only">Indicados por</legend>
        <div className="scroll-x -mx-4 flex items-center gap-1.5 px-4 sm:mx-0 sm:px-0">
          <span className="shrink-0 pr-1 text-[12.5px] text-muted" aria-hidden>
            Indicados por
          </span>
          {[
            { name: null, label: 'Todos', count: MINISTERS.length },
            ...presidents.map((p) => ({ ...p, label: p.name })),
          ].map((p) => (
            <button
              key={p.label}
              type="button"
              aria-pressed={by === p.name}
              onClick={() => setBy(p.name)}
              className="h-8 shrink-0 whitespace-nowrap rounded-full border border-line px-3 text-[13px] text-ink-2 hover:border-line-strong aria-pressed:border-live aria-pressed:bg-live-soft aria-pressed:font-medium aria-pressed:text-ink"
            >
              {p.label} <span className="numeral text-muted">{p.count}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
        {shown.map((m) => (
          <li key={m.name} className="border-b border-line">
            <MinisterRow m={m} />
          </li>
        ))}
        {!by &&
          VACANCIES.map((v) => (
            <li key={v.reason} className="flex items-center gap-3 border-b border-line py-2.5 text-ink-2">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-dashed border-line-strong text-muted"
                aria-hidden
              >
                ?
              </span>
              <span className="min-w-0">
                <span className="block text-[14.5px] font-medium text-ink">Vaga aberta</span>
                <span className="block text-[12.5px] text-muted">
                  Com a {v.reason}. Indicação do Presidente, aprovação do Senado.
                </span>
              </span>
            </li>
          ))}
      </ul>

      <Timeline highlight={by} />
      <Panels />

      <section aria-labelledby="o-que-faz" className="mt-7">
        <h2 id="o-que-faz" className="text-[17px] font-semibold">
          O que o STF faz
        </h2>
        <ul className="mt-2 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {POWERS.map((p) => (
            <li key={p.title} className="text-[13.5px] leading-snug text-ink-2">
              <span className="block text-[14.5px] font-medium text-ink">{p.title}</span>
              {p.body} <span className="whitespace-nowrap text-[12px] text-muted">({p.source})</span>
            </li>
          ))}
        </ul>
      </section>

      <details className="mt-6 max-w-3xl text-[12.5px] text-muted">
        <summary className="cursor-pointer text-[13.5px] text-ink-2">Créditos das fotos</summary>
        <p className="mt-1 leading-relaxed">
          Fotos públicas do Wikimedia Commons:{' '}
          {MINISTERS.map((m, i) => {
            const p = PHOTOS[photoSlug(m.name)];
            if (!p) return null;
            return (
              <span key={m.name}>
                {i > 0 && '; '}
                <a href={p.page} target="_blank" rel="noopener" className="underline underline-offset-2">
                  {m.name}
                </a>{' '}
                ({p.author}, {p.license})
              </span>
            );
          })}
          .
        </p>
      </details>
    </div>
  );
}

function Photo({ m, size }: { m: Minister; size: number }) {
  return (
    // biome-ignore lint/performance/noImgElement: static export, small local thumbnail
    <img
      src={`${base}/stf/${photoSlug(m.name)}.jpg`}
      alt={`Foto de ${m.name}`}
      width={size}
      height={size}
      loading="lazy"
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full bg-surface-2 object-cover object-top"
    />
  );
}

/** One line per minister: photo, name and role; who appointed them and since when; when they leave. */
function MinisterRow({ m }: { m: Minister }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Photo m={m} size={40} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2">
          <span className="truncate text-[14.5px] font-medium">{m.name}</span>
          {m.role && (
            <span className="shrink-0 rounded bg-live-soft px-1.5 py-px text-[11.5px] font-medium text-live">
              {m.role}
            </span>
          )}
        </p>
        <p className="text-[12.5px] leading-snug text-muted">
          Indicação de <span className="text-ink-2">{m.appointedBy}</span> · desde {sinceYear(m)}
        </p>
      </div>
      <p className="shrink-0 text-right text-[11.5px] leading-tight text-muted">
        sai em
        <span className="numeral block text-[12.5px] text-ink-2">{MONTH.format(retirementDate(m))}</span>
      </p>
    </div>
  );
}

/**
 * Each minister's time at the court, from taking office to the compulsory retirement at 75, on one
 * scale from 2000 to 2050, with today marked. Readers who filter by President see their picks.
 */
function Timeline({ highlight }: { highlight: string | null }) {
  const from = 2000;
  const to = 2050;
  const x = (year: number) => `${((year - from) / (to - from)) * 100}%`;
  const now = new Date();
  const today = now.getUTCFullYear() + now.getUTCMonth() / 12;
  return (
    <section aria-labelledby="linha-do-tempo-stf" className="mt-7">
      <h2 id="linha-do-tempo-stf" className="text-[17px] font-semibold">
        Linha do tempo
      </h2>
      <p className="mt-0.5 text-[13.5px] text-muted">
        Da posse até a aposentadoria obrigatória, aos 75 anos.
      </p>
      <div className="mt-3 rounded-xl border border-line bg-surface p-3 sm:p-4">
        <div className="relative ml-[6.75rem] sm:ml-[9.75rem]">
          <div className="flex justify-between text-[11.5px] text-muted" aria-hidden>
            {[2000, 2010, 2020, 2030, 2040, 2050].map((y) => (
              <span key={y}>{y}</span>
            ))}
          </div>
        </div>
        <ul className="mt-1 grid gap-1.5">
          {MINISTERS.map((m) => {
            const start = sinceYear(m);
            const end = retirementDate(m).getUTCFullYear() + retirementDate(m).getUTCMonth() / 12;
            const dim = highlight && m.appointedBy !== highlight;
            return (
              <li
                key={m.name}
                className={`grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[9rem_minmax(0,1fr)] ${dim ? 'opacity-35' : ''}`}
              >
                <span className="truncate text-[12.5px] sm:text-[13.5px]">{m.name}</span>
                <span
                  className="relative block h-2.5 rounded-full bg-surface-2"
                  role="img"
                  aria-label={`${m.name}: no STF desde ${start}, aposentadoria obrigatória em ${retirementDate(m).getUTCFullYear()}`}
                >
                  <span
                    className="absolute inset-y-0 rounded-full bg-live/25"
                    style={{ left: x(start), width: `calc(${x(end)} - ${x(start)})` }}
                  />
                  <span
                    className="absolute inset-y-0 rounded-l-full bg-live"
                    style={{ left: x(start), width: `calc(${x(today)} - ${x(start)})` }}
                  />
                </span>
              </li>
            );
          })}
        </ul>
        <div className="relative ml-[6.75rem] mt-2 sm:ml-[9.75rem]" aria-hidden>
          <span
            className="absolute -top-1 text-[11.5px] text-ink-2"
            style={{ left: `calc(${x(today)} - 1rem)` }}
          >
            hoje
          </span>
        </div>
        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-4 rounded-full bg-live" aria-hidden /> tempo já cumprido
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-4 rounded-full bg-live/25" aria-hidden /> até os 75 anos
          </span>
        </p>
      </div>
    </section>
  );
}

/** The two panels side by side; the court's President sits on neither. */
function Panels() {
  const president = MINISTERS.find((m) => m.role === 'Presidente');
  return (
    <section aria-labelledby="turmas" className="mt-7">
      <h2 id="turmas" className="text-[17px] font-semibold">
        Turmas
      </h2>
      <p className="mt-0.5 text-[13.5px] text-muted">
        A maioria dos processos é julgada em uma das duas turmas.
        {president && ` O presidente do STF, ${president.name}, não integra nenhuma.`}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {(['1ª Turma', '2ª Turma'] as const).map((panel) => {
          const members = MINISTERS.filter((m) => m.panel === panel).sort(
            (a, b) => Number(!!b.panelChair) - Number(!!a.panelChair),
          );
          return (
            <div key={panel} className="rounded-xl border border-line bg-surface p-3">
              <p className="mb-2 font-semibold">{panel}</p>
              <ul className="grid gap-1.5">
                {members.map((m) => (
                  <li key={m.name} className="flex items-center gap-2.5 text-[14px]">
                    <Photo m={m} size={28} />
                    <span className="min-w-0 truncate">{m.name}</span>
                    {m.panelChair && (
                      <span className="ml-auto shrink-0 rounded-md bg-live-soft px-1.5 py-0.5 text-[12px] font-medium text-live">
                        preside
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
