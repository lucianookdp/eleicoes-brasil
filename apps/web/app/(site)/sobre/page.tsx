import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  IconChevron,
  IconData,
  IconHelp,
  IconHistory,
  IconInfo,
  IconOverview,
  IconPulse,
  IconStates,
} from '@/components/icons';

export const metadata: Metadata = { title: 'Sobre os dados' };

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

export default function AboutPage() {
  return (
    <div className="max-w-3xl pb-8 pt-3">
      <p className="text-[12.5px] font-medium uppercase tracking-wider text-live">Sobre os dados</p>
      <h1 className="mt-1 text-balance text-[28px] font-semibold leading-tight tracking-tight sm:text-[36px]">
        O que você vê aqui, de onde vem e como ler
      </h1>

      <div className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {SECTIONS.map((s) => (
          <section key={s.title} className="flex gap-3 p-4 sm:gap-4 sm:p-5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-2">
              {s.icon}
            </span>
            <div className="min-w-0">
              <h2 className="text-[16px] font-semibold leading-9">{s.title}</h2>
              {s.body.map((p) => (
                <p key={p.slice(0, 24)} className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Link
        href="/como-funciona"
        className="mt-6 flex items-center gap-3 rounded-xl border border-line bg-surface p-3 hover:border-line-strong hover:bg-surface-2 sm:max-w-sm"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line text-ink-2">
          <IconHelp />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">Como funciona</span>
          <span className="block text-[12.5px] leading-snug text-muted">
            O caminho de um voto, da urna até a sua tela
          </span>
        </span>
        <IconChevron width={16} height={16} className="shrink-0 text-muted" />
      </Link>
    </div>
  );
}
