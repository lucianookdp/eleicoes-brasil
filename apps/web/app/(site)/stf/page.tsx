import type { Metadata } from 'next';
import { byPresident, MINISTERS, PHOTOS, photoSlug, STF_CHECKED_AT, STF_SOURCE, VACANCIES } from '@/lib/stf';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const metadata: Metadata = {
  title: 'STF: quem são os ministros',
  description: 'Os ministros do Supremo Tribunal Federal, quem indicou cada um e o que o STF faz.',
};

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
];

const HOW = [
  'São 11 ministros, brasileiros natos, com mais de 35 e menos de 70 anos, de notável saber jurídico e reputação ilibada (CF, art. 101).',
  'O Presidente da República indica, o Senado sabatina e precisa aprovar por maioria absoluta (41 dos 81 senadores). Só então o ministro é nomeado (CF, art. 101, parágrafo único).',
  'Não há mandato fixo: o ministro fica até se aposentar, no máximo aos 75 anos (CF, art. 40, § 1º, II).',
];

export default function StfPage() {
  const presidents = byPresident();
  return (
    <div className="pb-8 pt-3">
      <div className="max-w-2xl">
        <h1 className="text-[28px] font-semibold tracking-tight">Supremo Tribunal Federal</h1>
        <p className="mt-2 text-[16px] leading-relaxed text-ink-2">
          Quem são os ministros do STF hoje, quem indicou cada um e o que o tribunal faz.
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
          . Esta página não faz parte da apuração.
        </p>
      </div>

      <section aria-labelledby="indicados" className="mt-6 rounded-xl border border-line bg-surface p-4">
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

      <section aria-labelledby="ministros" className="mt-8">
        <h2 id="ministros" className="text-[20px] font-semibold">
          Os ministros
        </h2>
        <p className="mt-1 text-[14px] text-muted">Do mais antigo no tribunal para o mais recente.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {MINISTERS.map((m) => (
            <li key={m.name} className="flex gap-3 rounded-xl border border-line bg-surface p-4">
              {/* biome-ignore lint/performance/noImgElement: static export, small local thumbnail */}
              <img
                src={`${base}/stf/${photoSlug(m.name)}.jpg`}
                alt={`Foto de ${m.name}`}
                width={72}
                height={72}
                loading="lazy"
                className="size-[72px] shrink-0 rounded-full bg-surface-2 object-cover object-top"
              />
              <div className="min-w-0">
                <p className="text-[17px] font-semibold leading-tight">{m.name}</p>
                {m.role && (
                  <p className="mt-1 inline-block rounded-md bg-live-soft px-2 py-0.5 text-[12.5px] font-medium text-live">
                    {m.role} do STF
                  </p>
                )}
                <dl className="mt-2 grid gap-0.5 text-[14.5px]">
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
              className="flex gap-3 rounded-xl border border-dashed border-line-strong p-4 text-ink-2"
            >
              <span
                className="flex size-12 shrink-0 items-center justify-center rounded-full border border-dashed border-line-strong text-[20px] text-muted"
                aria-hidden
              >
                ?
              </span>
              <div className="min-w-0">
                <p className="text-[17px] font-semibold leading-tight">Vaga aberta</p>
                <p className="mt-2 text-[14.5px]">
                  Aberta com a {v.reason}. A indicação é do Presidente da República, com aprovação do Senado.
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="o-que-faz" className="mt-10 max-w-3xl">
        <h2 id="o-que-faz" className="text-[20px] font-semibold">
          O que o STF faz
        </h2>
        <ul className="mt-3 grid gap-3">
          {POWERS.map((p) => (
            <li key={p.title} className="rounded-xl border border-line bg-surface p-4">
              <p className="text-[16px] font-semibold">{p.title}</p>
              <p className="mt-1 leading-relaxed text-ink-2">{p.body}</p>
              <p className="mt-1 text-[12.5px] text-muted">{p.source}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="como-entra" className="mt-10 max-w-3xl">
        <h2 id="como-entra" className="text-[20px] font-semibold">
          Como alguém vira ministro
        </h2>
        <ul className="mt-3 grid list-disc gap-2 pl-5 leading-relaxed text-ink-2">
          {HOW.map((h) => (
            <li key={h.slice(0, 24)}>{h}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="creditos" className="mt-10 max-w-3xl">
        <h2 id="creditos" className="text-[15px] font-semibold text-ink-2">
          Créditos das fotos
        </h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
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
      </section>
    </div>
  );
}
