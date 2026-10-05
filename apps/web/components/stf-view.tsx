'use client';

import { byPresident, MINISTERS, PHOTOS, photoSlug, STF_CHECKED_AT, STF_SOURCE, VACANCIES } from '@/lib/stf';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const checked = STF_CHECKED_AT.split('-').reverse().join('/');

/** What the court does, in plain words, each with its article of the Constitution. */
const POWERS = [
  {
    title: 'Guarda a Constituição',
    body: 'Decide se uma lei ou ato do governo está de acordo com a Constituição e pode anular o que não estiver.',
    source: 'CF, art. 102, I, a, e § 1º',
  },
  {
    title: 'Julga as mais altas autoridades',
    body: 'Nos crimes comuns, julga o Presidente e o Vice-presidente da República, deputados federais, senadores, os próprios ministros do STF e o Procurador-Geral da República.',
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
 * The Supreme Court (STF): who sits there, who appointed each one and what the court does. Lives
 * in the Bancadas page (Câmara, Senado, STF); not election data, kept by hand in lib/stf.ts.
 */
export function StfView() {
  const presidents = byPresident();
  return (
    <div>
      <div className="max-w-2xl">
        <p className="text-[15px] leading-relaxed text-ink-2">
          Quem são os ministros do Supremo Tribunal Federal hoje, quem indicou cada um e o que o tribunal faz.
        </p>
        <p className="mt-1 text-[13px] text-muted">
          Conferido em {checked} no{' '}
          <a
            href={STF_SOURCE}
            target="_blank"
            rel="noopener"
            className="text-info underline underline-offset-2"
          >
            site oficial do STF
          </a>
          . Não faz parte da apuração.
        </p>
      </div>

      <section aria-labelledby="indicados" className="mt-4 rounded-xl border border-line bg-surface p-4">
        <h2 id="indicados" className="text-[17px] font-semibold">
          {MINISTERS.length} ministros em exercício
          {VACANCIES.length > 0 && ` · ${VACANCIES.length} vaga aberta`}
        </h2>
        <p className="mt-1 text-[14px] text-muted">
          Quantos dos ministros atuais cada Presidente da República indicou:
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {presidents.map((p) => (
            <li key={p.name} className="rounded-full bg-surface-2 px-3 py-1.5 text-[14.5px]">
              {p.name} <span className="numeral font-semibold">{p.count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ministros" className="mt-6">
        <h2 id="ministros" className="text-[18px] font-semibold">
          Os ministros
        </h2>
        <p className="mt-1 text-[14px] text-muted">Do mais antigo no tribunal para o mais recente.</p>
        <ul className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {MINISTERS.map((m) => (
            <li key={m.name} className="flex gap-3 rounded-xl border border-line bg-surface p-3">
              {/* biome-ignore lint/performance/noImgElement: static export, small local thumbnail */}
              <img
                src={`${base}/stf/${photoSlug(m.name)}.jpg`}
                alt={`Foto de ${m.name}`}
                width={60}
                height={60}
                loading="lazy"
                className="size-[60px] shrink-0 rounded-full bg-surface-2 object-cover object-top"
              />
              <div className="min-w-0">
                <p className="text-[16px] font-semibold leading-tight">{m.name}</p>
                {m.role && (
                  <p className="mt-1 inline-block rounded-md bg-live-soft px-2 py-0.5 text-[12.5px] font-medium text-live">
                    {m.role} do STF
                  </p>
                )}
                <dl className="mt-1.5 grid gap-0.5 text-[14px]">
                  <div>
                    <dt className="inline text-muted">Indicação de: </dt>
                    <dd className="inline font-medium">{m.appointedBy}</dd>
                  </div>
                  <div>
                    <dt className="inline text-muted">No STF desde: </dt>
                    <dd className="inline">{m.since}</dd>
                  </div>
                  <div>
                    <dt className="inline text-muted">{m.panel ? 'Turma: ' : 'No plenário: '}</dt>
                    <dd className="inline">
                      {m.panel ?? 'preside o tribunal (não integra turma)'}
                      {m.panelChair && ' (presidente da turma)'}
                    </dd>
                  </div>
                </dl>
              </div>
            </li>
          ))}
          {VACANCIES.map((v) => (
            <li
              key={v.reason}
              className="flex gap-3 rounded-xl border border-dashed border-line-strong p-3 text-ink-2"
            >
              <span
                className="flex size-[60px] shrink-0 items-center justify-center rounded-full border border-dashed border-line-strong text-[20px] text-muted"
                aria-hidden
              >
                ?
              </span>
              <div className="min-w-0">
                <p className="text-[16px] font-semibold leading-tight">Vaga aberta</p>
                <p className="mt-1.5 text-[14px]">
                  Aberta com a {v.reason}. A indicação é do Presidente da República, com aprovação do Senado.
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="o-que-faz" className="mt-6">
        <h2 id="o-que-faz" className="text-[18px] font-semibold">
          O que o STF faz
        </h2>
        <ul className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {POWERS.map((p) => (
            <li key={p.title} className="rounded-xl border border-line bg-surface p-3">
              <p className="text-[15px] font-semibold">{p.title}</p>
              <p className="mt-0.5 text-[14px] leading-snug text-ink-2">{p.body}</p>
              <p className="mt-1 text-[12px] text-muted">{p.source}</p>
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
