import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { IconChevron, IconData, IconPulse } from '@/components/icons';

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

type Step = { title: string; text: string; icon: ReactNode };

/** What the Electoral Justice does, then what this site does with it. */
const THEIRS: Step[] = [
  {
    title: 'Urnas',
    text: 'Às 17h, quando a votação termina, cada urna imprime o boletim com os seus votos e o resultado é transmitido para a Justiça Eleitoral.',
    icon: (
      <svg viewBox="0 0 32 32" width={24} height={24} aria-hidden {...stroke}>
        <rect x="5" y="13" width="22" height="14" rx="2" />
        <path d="M11 13V7h10v6M13 10h6M9 20h14" />
      </svg>
    ),
  },
  {
    title: 'TSE',
    text: 'O Tribunal Superior Eleitoral soma os votos e divulga os resultados, atualizados ao longo da noite.',
    icon: (
      <svg viewBox="0 0 32 32" width={24} height={24} aria-hidden {...stroke}>
        <path d="M4 12 16 5l12 7M6 12v12M12 12v12M20 12v12M26 12v12M3 27h26" />
      </svg>
    ),
  },
];

const OURS: Step[] = [
  {
    title: 'Coleta',
    text: 'A cada poucos segundos, conferimos se há algo novo no TSE e baixamos só o que mudou, sem sobrecarregar o tribunal.',
    icon: (
      <svg viewBox="0 0 32 32" width={24} height={24} aria-hidden {...stroke}>
        <circle cx="16" cy="16" r="10" />
        <path d="M16 10v6l4 3M16 3v2M16 27v2M3 16h2M27 16h2" />
      </svg>
    ),
  },
  {
    title: 'Conferência',
    text: 'Cada arquivo é conferido. Números impossíveis são sinalizados e nunca apagam o que já estava certo.',
    icon: (
      <svg viewBox="0 0 32 32" width={24} height={24} aria-hidden {...stroke}>
        <path d="M16 4 6 8v7c0 6.5 4.3 11 10 13 5.7-2 10-6.5 10-13V8L16 4Z" />
        <path d="m11.5 16 3 3 6-6" />
      </svg>
    ),
  },
  {
    title: 'Histórico',
    text: 'Guardamos cada atualização com o horário: dá para ver como estava a apuração às 19h32, por exemplo.',
    icon: (
      <svg viewBox="0 0 32 32" width={24} height={24} aria-hidden {...stroke}>
        <ellipse cx="16" cy="8" rx="10" ry="3.5" />
        <path d="M6 8v16c0 1.9 4.5 3.5 10 3.5s10-1.6 10-3.5V8M6 16c0 1.9 4.5 3.5 10 3.5s10-1.6 10-3.5" />
      </svg>
    ),
  },
  {
    title: 'Sua tela',
    text: 'Quando chega um dado novo, sua tela se atualiza sozinha, no celular ou no computador.',
    icon: (
      <svg viewBox="0 0 32 32" width={24} height={24} aria-hidden {...stroke}>
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
  const step = (s: Step, ours: boolean, n: number) => {
    return (
      <li key={s.title} className="flex gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl border ${
            ours ? 'border-live/40 bg-live-soft text-live' : 'border-line-strong bg-surface-2 text-ink-2'
          }`}
        >
          {s.icon}
        </span>
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold">
            <span className="numeral mr-1.5 text-muted">{n}</span>
            {s.title}
          </h3>
          <p className="mt-0.5 text-[13.5px] leading-snug text-ink-2">{s.text}</p>
        </div>
      </li>
    );
  };
  return (
    <div className="max-w-5xl pb-8 pt-3 lg:max-w-none">
      <p className="text-[12.5px] font-medium uppercase tracking-wider text-live">Como funciona</p>
      <h1 className="mt-1 text-balance text-[28px] font-semibold leading-tight tracking-tight sm:text-[36px]">
        Da urna à sua tela, em segundos
      </h1>
      <p className="mt-2 max-w-2xl text-[16px] text-ink-2">
        Todos os dados vêm do Tribunal Superior Eleitoral. Nós só buscamos, conferimos, guardamos e mostramos.
      </p>

      {/* Two stages: the Electoral Justice's part, then ours, in the site's green. */}
      <div className="mt-10 grid items-stretch gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,2fr)]">
        <section aria-labelledby="justica" className="rounded-2xl border border-line bg-surface p-4">
          <h2 id="justica" className="text-[12.5px] font-medium uppercase tracking-wider text-muted">
            Justiça Eleitoral
          </h2>
          <ol className="mt-3 grid gap-4">{THEIRS.map((s, i) => step(s, false, i + 1))}</ol>
        </section>
        <span aria-hidden className="flex items-center justify-center text-muted">
          <IconChevron width={20} height={20} className="rotate-90 lg:rotate-0" />
        </span>
        <section aria-labelledby="nos" className="rounded-2xl border border-live/30 bg-surface p-4">
          <h2 id="nos" className="text-[12.5px] font-medium uppercase tracking-wider text-live">
            Eleições Brasil
          </h2>
          <ol className="mt-3 grid gap-4 sm:grid-cols-2">
            {OURS.map((s, i) => step(s, true, THEIRS.length + i + 1))}
          </ol>
        </section>
      </div>

      {/* Computers: the questions and the links side by side, as wide as the diagram above. */}
      <div className="mt-12 grid items-start gap-x-6 gap-y-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section>
          <h2 className="text-[20px] font-semibold">Perguntas comuns</h2>
          <div className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {QUESTIONS.map((item) => (
              <details key={item.q} className="group px-4 py-1">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {item.q}
                  <IconChevron
                    width={16}
                    height={16}
                    className="shrink-0 rotate-90 text-muted transition-transform group-open:-rotate-90"
                  />
                </summary>
                <p className="pb-3 leading-relaxed text-ink-2">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="grid gap-2 sm:grid-cols-2 lg:mt-[44px] lg:grid-cols-1">
          <MoreLink href="/eleicao/bastidores/" icon={<IconPulse />} title="Bastidores">
            O ritmo da apuração e da nossa coleta, ao vivo
          </MoreLink>
          <MoreLink href="/sobre" icon={<IconData />} title="Sobre os dados">
            De onde vêm, como ler os horários e o que calculamos
          </MoreLink>
        </div>
      </div>
    </div>
  );
}

function MoreLink({
  href,
  icon,
  title,
  children,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 hover:border-line-strong hover:bg-surface-2"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line text-ink-2">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        <span className="block text-[12.5px] leading-snug text-muted">{children}</span>
      </span>
      <IconChevron width={16} height={16} className="shrink-0 text-muted" />
    </Link>
  );
}
