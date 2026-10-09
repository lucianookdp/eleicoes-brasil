'use client';

import type { OccurrencesDTO } from '@eleicoes/election-core';
import { fmtInt } from '@/lib/format';
import { useOccurrences } from '@/lib/queries';
import { useRound } from './shell';
import { ErrorNotice, SectionTitle, Skeleton } from './ui';

/** What each recorded problem means, in words for anyone. */
const LABEL: Record<string, string> = {
  'not-finite': 'Número inválido no arquivo',
  negative: 'Número negativo no arquivo',
  'percent-range': 'Percentual fora de 0 a 100%',
  'counted-exceeds-total': 'Mais urnas apuradas do que o total de urnas',
  'turnout-exceeds-electorate': 'Comparecimento maior que o eleitorado',
  'missing-timestamp': 'Arquivo sem o horário da totalização',
  'candidate-without-id': 'Candidato sem identificação no arquivo',
  'duplicate-candidate': 'Candidato repetido no arquivo',
  'candidate-sum-exceeds-total': 'Votos dos candidatos somam mais que o total',
  regression: 'Arquivo com menos urnas apuradas que o anterior (voltou no tempo)',
  'source.schema': 'Arquivo fora do formato esperado',
  'source.unavailable': 'TSE indisponível ou recusou a consulta',
  'collector.error': 'Falha na nossa coleta',
};

const WHEN = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});
const when = (iso: string) => WHEN.format(new Date(iso)).replace(',', ' às');

function duration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`;
}

/**
 * "Ocorrências": everything abnormal recorded for the round, for readers who want to check, during
 * or after the count. Says plainly what it covers (the publication and our collection) and what it
 * does not (the voting machines or the vote).
 */
export function Occurrences() {
  const { round } = useRound();
  const { data, error, refetch } = useOccurrences(round.slug);
  return (
    <section aria-labelledby="ocorrencias" className="mb-8">
      <SectionTitle id="ocorrencias" title="Ocorrências da apuração">
        Registradas automaticamente, na hora em que aconteceram, e guardadas depois do fim.
      </SectionTitle>
      <div className="mb-4 rounded-xl border border-line bg-surface-2/40 px-4 py-3 text-[13.5px] leading-relaxed text-ink-2">
        <p>
          <strong className="font-semibold text-ink">O que esta lista mostra:</strong> problemas na divulgação
          dos resultados pelo TSE (arquivos com números incoerentes, fora do formato ou que voltaram no tempo,
          e o TSE fora do ar) e na nossa coleta.
        </p>
        <p className="mt-1">
          <strong className="font-semibold text-ink">O que ela não mostra:</strong> não avalia as urnas nem a
          votação. Uma ocorrência aqui é um problema na publicação ou na coleta dos dados; a fonte oficial é
          sempre o TSE.
        </p>
      </div>
      {error && <ErrorNotice error={error} retry={() => refetch()} />}
      {!data && !error && <Skeleton className="h-64" />}
      {data && <OccurrencesBody data={data} />}
    </section>
  );
}

function OccurrencesBody({ data }: { data: OccurrencesDTO }) {
  const errors = data.issues.filter((i) => i.severity === 'error');
  const warnings = data.issues.filter((i) => i.severity === 'warning');
  const sum = (list: typeof data.issues, pred: (i: (typeof data.issues)[number]) => boolean) =>
    list.filter(pred).reduce((n, i) => n + i.count, 0);
  const incoherent = sum(errors, (i) => i.type === 'quality.issue');
  const regressions = sum(data.issues, (i) => i.code === 'regression');
  const malformed = sum(data.issues, (i) => i.type === 'source.schema');
  const unavailable =
    data.outages.length + data.gaps.length + sum(data.issues, (i) => i.type === 'source.unavailable');

  return (
    <>
      <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Count label="Números incoerentes nos arquivos" value={incoherent} />
        <Count label="Arquivos que voltaram no tempo" value={regressions} />
        <Count label="Arquivos fora do formato" value={malformed} />
        <Count label="Quedas, instabilidade ou pausas" value={unavailable} />
      </dl>

      {/* No "delays" here yet: the time the TSE writes in a file does not always change when it
          updates it (the "Eleito" marks come later under the same time), so it would show updates
          as delays. It comes back with a measure that holds. */}
      <div className="grid items-start gap-6 [&>*]:min-w-0">
        <section aria-labelledby="quedas">
          <h3 id="quedas" className="text-[15px] font-semibold">
            Quedas e pausas
          </h3>
          <p className="mb-2 text-[13px] text-muted">
            Quando o TSE não respondeu ou ficou instável, e quando a nossa coleta ficou sem conferir o TSE.
          </p>
          {data.outages.length === 0 && data.gaps.length === 0 ? (
            <Empty>Nenhuma queda ou pausa registrada.</Empty>
          ) : (
            <ul className="divide-y divide-line rounded-xl border border-line bg-surface px-4 text-[13.5px]">
              {data.outages.map((o) => (
                <li key={`o-${o.from}`} className="py-2">
                  <p className="flex justify-between gap-3">
                    <span
                      className={o.status === 'failed' ? 'font-medium text-bad' : 'font-medium text-warn'}
                    >
                      {o.status === 'failed' ? 'Coleta falhou' : 'Coleta instável'}
                    </span>
                    <span className="numeral shrink-0 text-muted">
                      {duration((Date.parse(o.to) - Date.parse(o.from)) / 1000 || 5)}
                    </span>
                  </p>
                  <p className="text-muted">
                    {when(o.from)}
                    {o.reason ? ` · ${o.reason}` : ''}
                  </p>
                </li>
              ))}
              {data.gaps.map((g) => (
                <li key={`g-${g.from}`} className="py-2">
                  <p className="flex justify-between gap-3">
                    <span className="font-medium text-warn">Coleta sem conferir o TSE</span>
                    <span className="numeral shrink-0 text-muted">{duration(g.seconds)}</span>
                  </p>
                  <p className="text-muted">a partir de {when(g.from)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="arquivos" className="mt-6">
        <h3 id="arquivos" className="text-[15px] font-semibold">
          Problemas nos arquivos publicados
        </h3>
        <p className="mb-2 text-[13px] text-muted">
          Números impossíveis, arquivos fora do formato ou que voltaram no tempo. Os dados com problema nunca
          apagam o que já estava certo; repetições do mesmo problema no mesmo lugar aparecem juntas.
        </p>
        {errors.length === 0 ? (
          <Empty>Nenhum problema registrado nos arquivos.</Empty>
        ) : (
          <IssueList items={errors} />
        )}
      </section>

      {warnings.length > 0 && (
        <details className="group mt-6 rounded-xl border border-line bg-surface px-4 py-3">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between font-medium">
            Avisos menores ({fmtInt(sum(warnings, () => true))})
            <span aria-hidden className="text-muted transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mb-2 text-[13px] text-muted">
            Detalhes que não mudam os números, como um arquivo sem o horário de totalização ou uma consulta
            que o TSE recusou e foi repetida.
          </p>
          <IssueList items={warnings} />
        </details>
      )}
    </>
  );
}

function IssueList({ items }: { items: OccurrencesDTO['issues'] }) {
  return (
    <ul className="divide-y divide-line rounded-xl border border-line bg-surface px-4 text-[13.5px]">
      {items.map((i) => (
        <li key={`${i.type}-${i.code}-${i.areaKey}-${i.office}-${i.first}`} className="py-2.5">
          <p className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="font-medium">{LABEL[i.code] ?? LABEL[i.type] ?? i.code}</span>
            <span className="numeral text-muted">{i.count > 1 ? `${fmtInt(i.count)} vezes` : '1 vez'}</span>
          </p>
          <p className="text-ink-2">
            {[i.areaName, i.office].filter(Boolean).join(' · ') || 'Geral'}
            <span className="text-muted">
              {' · '}
              {i.count > 1 && i.first !== i.last ? `de ${when(i.first)} a ${when(i.last)}` : when(i.last)}
            </span>
          </p>
          {i.detail && <p className="mt-0.5 break-words font-mono text-[11.5px] text-muted">{i.detail}</p>}
        </li>
      ))}
    </ul>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <dt className="text-[12.5px] text-muted">{label}</dt>
      <dd className={`numeral text-[26px] font-semibold leading-tight ${value > 0 ? '' : 'text-live'}`}>
        {fmtInt(value)}
      </dd>
    </div>
  );
}

function Empty({ children }: { children: string }) {
  return (
    <p className="rounded-xl border border-line bg-surface px-4 py-3 text-[13.5px] text-muted">
      <span aria-hidden className="mr-1.5 text-live">
        ✓
      </span>
      {children}
    </p>
  );
}
