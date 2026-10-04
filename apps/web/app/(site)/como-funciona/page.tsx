import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Como funciona',
  description: 'O caminho dos votos, da urna até a sua tela, explicado sem termos técnicos.',
};

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const STEPS: { title: string; text: string; icon: ReactNode; ours: boolean }[] = [
  {
    title: 'Urnas',
    text: 'Às 17h, quando a votação termina, cada urna imprime o boletim com os seus votos, e o resultado é transmitido para a Justiça Eleitoral.',
    ours: false,
    icon: (
      <svg viewBox="0 0 32 32" width={30} height={30} aria-hidden {...stroke}>
        <rect x="5" y="13" width="22" height="14" rx="2" />
        <path d="M11 13V7h10v6M13 10h6M9 20h14" />
      </svg>
    ),
  },
  {
    title: 'TSE',
    text: 'O Tribunal Superior Eleitoral soma os votos e divulga os resultados, atualizados ao longo da noite.',
    ours: false,
    icon: (
      <svg viewBox="0 0 32 32" width={30} height={30} aria-hidden {...stroke}>
        <path d="M4 12 16 5l12 7M6 12v12M12 12v12M20 12v12M26 12v12M3 27h26" />
      </svg>
    ),
  },
  {
    title: 'Nossa coleta',
    text: 'A cada poucos segundos, nosso sistema confere se há algo novo no TSE e baixa só o que mudou, sem sobrecarregar o tribunal.',
    ours: true,
    icon: (
      <svg viewBox="0 0 32 32" width={30} height={30} aria-hidden {...stroke}>
        <circle cx="16" cy="16" r="10" />
        <path d="M16 10v6l4 3M16 3v2M16 27v2M3 16h2M27 16h2" />
      </svg>
    ),
  },
  {
    title: 'Conferência',
    text: 'Cada arquivo é conferido. Números impossíveis ou fora do padrão são sinalizados e nunca apagam o que já estava certo.',
    ours: true,
    icon: (
      <svg viewBox="0 0 32 32" width={30} height={30} aria-hidden {...stroke}>
        <path d="M16 4 6 8v7c0 6.5 4.3 11 10 13 5.7-2 10-6.5 10-13V8L16 4Z" />
        <path d="m11.5 16 3 3 6-6" />
      </svg>
    ),
  },
  {
    title: 'Linha do tempo',
    text: 'Guardamos cada atualização com o horário. Assim dá para ver como estava a apuração às 19h32, por exemplo.',
    ours: true,
    icon: (
      <svg viewBox="0 0 32 32" width={30} height={30} aria-hidden {...stroke}>
        <ellipse cx="16" cy="8" rx="10" ry="3.5" />
        <path d="M6 8v16c0 1.9 4.5 3.5 10 3.5s10-1.6 10-3.5V8M6 16c0 1.9 4.5 3.5 10 3.5s10-1.6 10-3.5" />
      </svg>
    ),
  },
  {
    title: 'Sua tela',
    text: 'Quando chega um dado novo, sua tela se atualiza sozinha, no celular ou no computador.',
    ours: true,
    icon: (
      <svg viewBox="0 0 32 32" width={30} height={30} aria-hidden {...stroke}>
        <rect x="9" y="3" width="14" height="26" rx="3" />
        <path d="M14 25h4" />
      </svg>
    ),
  },
];

const QUESTIONS = [
  {
    q: 'Por que não mostrar direto do site do TSE?',
    a: 'Se cada pessoa consultasse o TSE diretamente, milhões de acessos chegariam lá ao mesmo tempo. Aqui, só o nosso sistema consulta o TSE, e todo mundo lê a nossa cópia, atualizada em segundos.',
  },
  {
    q: 'E se o TSE ficar fora do ar?',
    a: 'Nada é apagado. Continuamos mostrando os últimos números recebidos, com um aviso de “dados atrasados” e o horário da última atualização, e seguimos tentando até o TSE voltar.',
  },
  {
    q: 'Os números podem ser diferentes dos do TSE?',
    a: 'Não. Os números são exatamente os que o TSE divulga; pode haver só alguns segundos de diferença até eles chegarem aqui. Em caso de dúvida, a fonte oficial é sempre o TSE.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="max-w-5xl pb-8 pt-3">
      <h1 className="text-[28px] font-semibold tracking-tight sm:text-[34px]">Como funciona</h1>
      <p className="mt-2 max-w-2xl text-[16px] text-ink-2">
        O caminho de um voto, da urna até a sua tela. Todos os dados vêm do Tribunal Superior Eleitoral. Nós
        só buscamos, conferimos, guardamos e mostramos.
      </p>

      <figure className="mt-10">
        <ol className="grid gap-3 md:grid-cols-6 md:gap-2">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative flex gap-4 md:flex-col md:gap-3">
              <div className="flex flex-col items-center md:flex-row">
                <span
                  className={`flex size-14 shrink-0 items-center justify-center rounded-2xl border ${
                    s.ours
                      ? 'border-live/40 bg-live-soft text-live'
                      : 'border-line-strong bg-surface-2 text-ink-2'
                  }`}
                >
                  {s.icon}
                </span>
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="my-1 w-px flex-1 bg-line-strong md:mx-1 md:my-0 md:h-px md:w-auto"
                  />
                )}
              </div>
              <div className="pb-4 md:pb-0 md:pr-2">
                <p className="text-[12px] text-muted">Etapa {i + 1}</p>
                <h2 className="font-semibold">{s.title}</h2>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <figcaption className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted">
          <span className="flex items-center gap-2">
            <span className="size-3 rounded border border-line-strong bg-surface-2" aria-hidden /> Justiça
            Eleitoral
          </span>
          <span className="flex items-center gap-2">
            <span className="size-3 rounded border border-live/40 bg-live-soft" aria-hidden /> Eleições Brasil
          </span>
        </figcaption>
      </figure>

      <section className="mt-14 max-w-2xl">
        <h2 className="text-[20px] font-semibold">Perguntas comuns</h2>
        <div className="mt-4 divide-y divide-line border-y border-line">
          {QUESTIONS.map((item) => (
            <details key={item.q} className="group py-3">
              <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {item.q}
                <span aria-hidden className="text-muted transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 leading-relaxed text-ink-2">{item.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-[14px] text-ink-2">
          Quer ver isso acontecendo? A página <strong>Bastidores</strong> mostra, em tempo real, o ritmo da
          apuração e o funcionamento da nossa coleta. Mais detalhes em{' '}
          <Link href="/sobre" className="text-info underline underline-offset-2">
            Sobre os dados
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
