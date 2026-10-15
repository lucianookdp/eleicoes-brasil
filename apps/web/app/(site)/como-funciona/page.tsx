import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  IconChevron,
  IconData,
  IconHistory,
  IconInfo,
  IconOverview,
  IconPulse,
  IconStates,
} from '@/components/icons';

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

const IconLock = () => (
  <svg
    viewBox="0 0 24 24"
    width={18}
    height={18}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

const SECTIONS: { title: string; icon: ReactNode; body: string[] }[] = [
  {
    title: 'De onde vêm os dados',
    icon: <IconData />,
    body: [
      'Todos os números vêm dos arquivos públicos de divulgação de resultados do Tribunal Superior Eleitoral (TSE), em resultados.tse.jus.br.',
      'Nosso sistema lê esses arquivos a cada poucos segundos, respeitando os limites de acesso definidos pelo TSE, e guarda cada mudança. O seu navegador consulta apenas os nossos servidores, nunca o TSE diretamente.',
    ],
  },
  {
    title: 'Este site não é oficial',
    icon: <IconInfo />,
    body: [
      'O Eleições Brasil é um projeto independente. Não é um serviço da Justiça Eleitoral e não substitui o aplicativo Resultados nem o site do TSE, que são as fontes oficiais.',
      'Não publicamos opinião política, análise partidária, pesquisas nem previsões na apuração. Mostramos apenas os dados divulgados pelo TSE.',
    ],
  },
  {
    title: 'Como ler os horários',
    icon: <IconHistory />,
    body: [
      'Todos os horários são de Brasília. O horário ao lado de “TSE” é o da última atualização informada pelo tribunal para aquele local; passe o dedo ou o mouse sobre ele para ver também quando o nosso sistema recebeu o dado.',
      'Se a coleta atrasar ou o TSE ficar fora do ar, mantemos os últimos dados recebidos e avisamos na tela, com o horário da última atualização.',
    ],
  },
  {
    title: 'Resultados parciais podem mudar',
    icon: <IconOverview />,
    body: [
      'Durante a apuração, os percentuais consideram apenas as urnas já apuradas. Eles podem mudar bastante até o fim, porque cada região apura em um ritmo diferente.',
      'Situações como “Eleito” ou “2º turno” só aparecem quando o próprio TSE as informa.',
    ],
  },
  {
    title: 'Cálculos feitos por nós',
    icon: <IconPulse />,
    body: [
      'A variação de cada candidato, em pontos percentuais (pp), é calculada por nós, comparando a atualização atual com a anterior do mesmo local. O ritmo da apuração e as atualizações recentes também são calculados a partir das mudanças que registramos.',
      'Quando um dado não existe na fonte, mostramos “—”, nunca zero.',
    ],
  },
  {
    title: 'Privacidade',
    icon: <IconLock />,
    body: [
      'Não usamos contas, cookies de rastreamento nem anúncios. Seus favoritos e a escolha de tema ficam apenas no seu navegador.',
    ],
  },
  {
    title: 'Créditos',
    icon: <IconStates />,
    body: [
      'Fotos dos candidatos: divulgadas pelo TSE junto com os resultados. Baixamos cada foto uma vez e a exibimos a partir dos nossos servidores.',
      'Desenho do mapa: “Map of Brazil”, de Victor Cazanave (svg-maps), licença CC BY 4.0. O código-fonte está no GitHub apenas para consulta, com todos os direitos reservados.',
    ],
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

      {/* What used to be "Sobre os dados": where the numbers come from and how to read them. One
          column on phones; two columns of cards on computers. /sobre/ lands here (#dados). */}
      <section id="dados" aria-labelledby="dados-titulo" className="mt-12 scroll-mt-24">
        <h2 id="dados-titulo" className="text-[20px] font-semibold">
          Sobre os dados
        </h2>
        <p className="mt-1 text-[14.5px] text-ink-2">De onde vêm, como ler e o que calculamos.</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {SECTIONS.map((sec) => (
            <section
              key={sec.title}
              className="flex gap-3 rounded-2xl border border-line bg-surface p-4 sm:gap-4 sm:p-5 lg:odd:last:col-span-2"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-2">
                {sec.icon}
              </span>
              <div className="min-w-0">
                <h3 className="text-[16px] font-semibold leading-9">{sec.title}</h3>
                {sec.body.map((para) => (
                  <p key={para.slice(0, 24)} className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">
                    {para}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      {/* Computers: the questions and the link side by side, as wide as the diagram above. */}
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
          <MoreLink href="/eleicao/bastidores/" icon={<IconPulse />} title="Transparência da apuração">
            Se os números estão chegando e tudo o que registramos de anormal
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
