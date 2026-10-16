'use client';

import { formatClock } from '@eleicoes/election-core';
import { useEffect, useRef, useState } from 'react';
import { OddsSplit, PriceChart } from '@/components/polymarket-chart';
import { ErrorNotice, Skeleton } from '@/components/ui';
import { fmtCompact } from '@/lib/format';
import {
  colorOf,
  eventUrl,
  MARGIN_SLUG,
  type Outcome,
  POLYMARKET_URL,
  usePolymarket,
} from '@/lib/polymarket';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const pct = (p: number) => `${Math.round(p * 100)}%`;
const cents = (p: number) => `${(p * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}¢`;
const STATE_NAMES: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
  ZZ: 'Exterior',
};

/**
 * Polymarket on the 2nd round, laid out like Polymarket's own event page (chart, % chance, Yes/No
 * prices, volume), on its own clearly labelled page away from the official count. Read live from
 * Polymarket in the reader's browser. Prices are shown, never offered: there is nothing to click.
 */
export default function PolymarketPage() {
  const { data, error, refetch, isRefetchError } = usePolymarket();
  return (
    <div className="max-w-4xl pb-8 pt-3 lg:max-w-none">
      {/* Polymarket's own mark and links: the data is theirs, the page points readers to them. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* biome-ignore lint/performance/noImgElement: static export, small brand icon */}
          <img
            src={`${base}/brands/pm-icon.png`}
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-xl"
          />
          <div>
            <h1 className="text-[24px] font-semibold leading-tight tracking-tight">Polymarket</h1>
            <p className="text-[14px] text-ink-2">
              Mercado de apostas · Eleição presidencial do Brasil 2026 · 2º turno
            </p>
            {data && (
              <p className="mt-1 flex items-center gap-1.5 text-[12.5px]" role="status">
                {isRefetchError ? (
                  // Polymarket stopped answering after the page loaded: the last numbers stay, said plainly.
                  <span className="flex items-center gap-1.5 font-medium text-warn">
                    <span className="inline-block size-2 rounded-full bg-current" aria-hidden />
                    Sem atualização desde {formatClock(data.at).slice(0, 5)} · tentando de novo
                  </span>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5 font-medium text-bad">
                      <span className="pulse-dot inline-block size-2 rounded-full bg-current" aria-hidden />
                      Ao vivo
                    </span>
                    <span className="text-muted">· atualizado às {formatClock(data.at)}</span>
                  </>
                )}
              </p>
            )}
          </div>
        </div>
        <a
          href={POLYMARKET_URL}
          target="_blank"
          rel="noopener nofollow"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-[13.5px] text-ink-2 hover:border-line-strong hover:text-ink"
        >
          Ver no Polymarket
          <svg
            viewBox="0 0 24 24"
            width={15}
            height={15}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            aria-hidden
          >
            <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      {error && !data && (
        <div className="mt-6 grid gap-2">
          <ErrorNotice error={error} retry={() => refetch()} />
          <p className="text-[13px] text-muted">
            O Polymarket não respondeu agora; a página tenta de novo sozinha. Enquanto isso, veja direto{' '}
            <a href={POLYMARKET_URL} target="_blank" rel="noopener nofollow" className="text-info underline">
              no site do Polymarket
            </a>
            .
          </p>
        </div>
      )}
      {!data && !error && <Skeleton className="mt-6 h-96" />}
      {data?.closed && (
        <p className="mt-6 rounded-xl border border-line bg-surface p-4 text-[14px] text-ink-2">
          Este mercado foi encerrado no Polymarket.{' '}
          <a href={POLYMARKET_URL} target="_blank" rel="noopener nofollow" className="text-info underline">
            Ver o resultado das apostas lá
          </a>
          . O resultado oficial da eleição é o do TSE.
        </p>
      )}
      {data && !data.closed && (
        <>
          {data.partial && (
            <p className="mt-4 text-[13px] text-warn">
              Parte dos mercados do Polymarket não respondeu agora; tentando de novo.
            </p>
          )}
          {/* Computers: the two markets side by side, using the width; phones: one under the other. */}
          <div
            className={`lg:grid lg:items-stretch lg:gap-6 ${data.margin.length > 0 ? 'lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]' : ''}`}
          >
            <Market
              kicker="Eleição presidencial do Brasil"
              title="Quem vence a eleição presidencial?"
              volume={data.volume}
              outcomes={data.winner.slice(0, 4)}
              href={POLYMARKET_URL}
              chart
              photos
            />
            {data.margin.length > 0 && (
              <Market
                kicker="2º turno"
                title="Por quantos pontos o vencedor ganha?"
                volume={data.margin.reduce((a, o) => a + o.volume, 0)}
                outcomes={data.margin.filter((o) => !/^other$/i.test(o.name)).slice(0, 6)}
                href={eventUrl(MARGIN_SLUG)}
              />
            )}
          </div>
          {data.states.length > 0 && (
            <section
              aria-labelledby="estados"
              className="mt-6 rounded-2xl border border-line bg-surface p-4 sm:p-5"
            >
              <p className="text-[12.5px] text-muted">2º turno · por estado</p>
              <h2 id="estados" className="mt-0.5 text-[19px] font-semibold">
                Quem fica em 1º em cada estado?
              </h2>
              <StatesGrid states={data.states} />
            </section>
          )}

          {/* What it is, said plainly: a betting market, not a poll and not the result. At the end,
              the markets come first; the page's subtitle already says "mercado de apostas". */}
          <section
            aria-labelledby="o-que-e"
            className="mt-6 rounded-2xl border border-line bg-surface p-4 sm:p-5"
          >
            <h2 id="o-que-e" className="text-[19px] font-semibold">
              O que é o Polymarket
            </h2>
            <p className="mt-1 max-w-3xl text-[15.5px] leading-relaxed text-ink-2">
              É um <strong className="font-semibold text-ink">site de apostas</strong>. Pessoas do mundo todo
              apostam dinheiro de verdade em quem elas acham que vai vencer a eleição.
            </p>
            <ul className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                {
                  title: 'Não é resultado nem pesquisa',
                  text: 'Os números desta página não vêm do TSE nem de institutos de pesquisa. Mostram só para onde está indo o dinheiro dos apostadores.',
                },
                {
                  title: 'Como ler a porcentagem',
                  text: '88% quer dizer que os apostadores acham aquele resultado muito provável hoje. Na prática: uma aposta “Sim” a 88 centavos de dólar paga US$ 1 se ele acontecer.',
                },
                {
                  title: 'Muda o tempo todo',
                  text: 'O preço sobe e desce na hora, a cada notícia, debate ou pesquisa. E os apostadores também erram.',
                },
              ].map((item, i) => (
                <li key={item.title} className="rounded-xl bg-surface-2 p-3.5">
                  <p className="flex items-center gap-2 text-[14.5px] font-semibold">
                    <span className="numeral flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-[12.5px] text-ink-2">
                      {i + 1}
                    </span>
                    {item.title}
                  </p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{item.text}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13px] text-muted">
              O Eleições Brasil só mostra esses números: não recebe apostas e não tem vínculo com o
              Polymarket. O resultado oficial da eleição é o do TSE, na página de resultados.
            </p>
          </section>
          <p className="mt-4 text-[12.5px] text-muted">
            Dados do{' '}
            <a
              href={POLYMARKET_URL}
              target="_blank"
              rel="noopener nofollow"
              className="underline underline-offset-2"
            >
              Polymarket
            </a>
            , atualizados a cada 30 segundos. “Sim” e “Não” são os preços, em centavos de dólar, de uma aposta
            que paga US$ 1 se acontecer.
          </p>
        </>
      )}
    </div>
  );
}

function Market({
  kicker,
  title,
  volume,
  outcomes,
  href,
  chart = false,
  photos = false,
}: {
  kicker: string;
  title: string;
  volume: number;
  outcomes: Outcome[];
  href: string;
  chart?: boolean;
  /** Candidate photos next to the names (the winner market; the margin one has none). */
  photos?: boolean;
}) {
  return (
    <section className="mt-6 flex flex-col rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <p className="text-[12.5px] text-muted">{kicker}</p>
      <h2 className="mt-0.5 text-[19px] font-semibold">{title}</h2>
      <p className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted">
        <span>US$ {fmtCompact(volume)} apostados</span>
        <a
          href={href}
          target="_blank"
          rel="noopener nofollow"
          className="font-medium text-info hover:underline"
        >
          Abrir este mercado no Polymarket ↗
        </a>
      </p>
      {chart && outcomes.length >= 2 && <OddsSplit a={outcomes[0]!} b={outcomes[1]!} />}
      {chart && <PriceChart outcomes={outcomes} />}
      {/* Beside a taller card, the rows share the height left: no empty band under the list. */}
      <ul className="mt-3 flex flex-1 flex-col divide-y divide-line border-t border-line">
        {outcomes.map((o, i) => (
          <li
            key={o.name}
            className="grid flex-1 grid-cols-[minmax(0,1fr)_auto] content-center items-center gap-x-3 gap-y-1.5 py-3 sm:grid-cols-[minmax(0,1fr)_5rem_auto]"
          >
            <span className="flex min-w-0 items-center gap-2">
              {photos && o.image ? (
                <Photo src={o.image} color={colorOf(o.name, i)} />
              ) : (
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: colorOf(o.name, i) }}
                  aria-hidden
                />
              )}
              <span className="truncate font-medium">{o.name}</span>
            </span>
            <LivePct value={o.price} />
            {/* Prices as Polymarket shows them; display only, no betting here. */}
            <span className="col-span-2 flex gap-1.5 sm:col-span-1">
              <span className="rounded-md bg-live-soft px-2.5 py-1 text-[13px] font-medium text-live">
                Sim {cents(o.price)}
              </span>
              <span className="rounded-md bg-bad-soft px-2.5 py-1 text-[13px] font-medium text-bad">
                Não {cents(o.no)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The % chance, with a short highlight when a refresh moves it. */
function LivePct({ value }: { value: number }) {
  const prev = useRef(value);
  const moved = prev.current !== value;
  useEffect(() => {
    prev.current = value;
  }, [value]);
  return (
    <span
      key={value}
      className={`numeral -mx-1 rounded px-1 text-right text-[20px] font-semibold ${moved ? 'flash' : ''}`}
    >
      {pct(value)}
    </span>
  );
}

/**
 * Who leads each state's market, as one tile per state (UF and %), tinted with that candidate's
 * colour: 28 states in a few rows on a phone instead of a long list. Each tile opens its market.
 */
function StatesGrid({ states }: { states: { uf: string; slug: string; outcomes: Outcome[] }[] }) {
  const sorted = [...states].sort((a, b) =>
    (STATE_NAMES[a.uf] ?? a.uf).localeCompare(STATE_NAMES[b.uf] ?? b.uf, 'pt-BR'),
  );
  const leads = new Map<string, { color: string; n: number }>();
  for (const s of sorted) {
    const top = s.outcomes[0]!;
    const l = leads.get(top.name) ?? { color: colorOf(top.name, 0), n: 0 };
    l.n++;
    leads.set(top.name, l);
  }
  return (
    <>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-2">
        {[...leads.entries()]
          .sort((a, b) => b[1].n - a[1].n)
          .map(([name, l]) => (
            <span key={name} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: l.color }} aria-hidden />
              {name} <span className="numeral text-muted">{l.n}</span>
            </span>
          ))}
      </p>
      <ul className="mt-3 grid grid-cols-4 gap-1.5 min-[400px]:grid-cols-5 sm:grid-cols-7 lg:grid-cols-10">
        {sorted.map((s) => {
          const top = s.outcomes[0]!;
          const color = colorOf(top.name, 0);
          return (
            <li key={s.uf}>
              <a
                href={eventUrl(s.slug)}
                target="_blank"
                rel="noopener nofollow"
                title={`${STATE_NAMES[s.uf] ?? s.uf}: ${top.name} ${pct(top.price)}`}
                aria-label={`${STATE_NAMES[s.uf] ?? s.uf}: ${top.name}, ${pct(top.price)}`}
                className="flex h-12 flex-col items-center justify-center rounded-lg border text-center leading-tight hover:brightness-110"
                style={{
                  background: `color-mix(in oklab, ${color} 22%, var(--surface))`,
                  borderColor: `color-mix(in oklab, ${color} 45%, var(--surface))`,
                }}
              >
                <span className="text-[13px] font-semibold">{s.uf === 'ZZ' ? 'Ext.' : s.uf}</span>
                <span className="numeral text-[11.5px] text-ink-2">{pct(top.price)}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** Polymarket's photo of the candidate; if it does not load, the colour dot instead. */
function Photo({ src, color }: { src: string; color: string }) {
  const [broken, setBroken] = useState(false);
  if (broken)
    return <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden />;
  return (
    // biome-ignore lint/performance/noImgElement: Polymarket's own small thumbnail
    <img
      src={src}
      alt=""
      width={32}
      height={32}
      loading="lazy"
      onError={() => setBroken(true)}
      className="size-8 shrink-0 rounded-full bg-surface-2 object-cover"
      style={{ boxShadow: `0 0 0 2px var(--surface), 0 0 0 3.5px ${color}` }}
    />
  );
}
