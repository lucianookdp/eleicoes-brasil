import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Sobre os dados' };

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'De onde vêm os dados',
    body: [
      'Todos os números vêm dos arquivos públicos de divulgação de resultados do Tribunal Superior Eleitoral (TSE), em resultados.tse.jus.br.',
      'Nosso sistema lê esses arquivos a cada poucos segundos, respeitando os limites de acesso definidos pelo TSE, e guarda cada mudança. O seu navegador consulta apenas os nossos servidores, nunca o TSE diretamente.',
    ],
  },
  {
    title: 'Este site não é oficial',
    body: [
      'O Eleições Brasil é um projeto independente. Não é um serviço da Justiça Eleitoral e não substitui o aplicativo Resultados nem o site do TSE, que são as fontes oficiais.',
      'Não publicamos opinião política, análise partidária, pesquisas nem previsões. Mostramos apenas os dados divulgados pelo TSE.',
    ],
  },
  {
    title: 'Como ler os horários',
    body: [
      'Todos os horários são de Brasília. “Divulgado às” é o horário da última atualização informada pelo TSE para aquele local. “Recebido aqui às” é quando o nosso sistema obteve esse dado.',
      'Se a coleta atrasar ou o TSE ficar fora do ar, mantemos os últimos dados recebidos e avisamos na tela, com o horário da última atualização.',
    ],
  },
  {
    title: 'Resultados parciais podem mudar',
    body: [
      'Durante a apuração, os percentuais consideram apenas as urnas já apuradas. Eles podem mudar bastante até o fim, porque cada região apura em um ritmo diferente.',
      'Situações como “Eleito” ou “2º turno” só aparecem quando o próprio TSE as informa.',
    ],
  },
  {
    title: 'Cálculos feitos por nós',
    body: [
      'A variação de cada candidato, em pontos percentuais (pp), é calculada por nós, comparando a atualização atual com a anterior do mesmo local. O ritmo da apuração e as atualizações recentes também são calculados a partir das mudanças que registramos.',
      'Quando um dado não existe na fonte, mostramos “—”, nunca zero.',
    ],
  },
  {
    title: 'Privacidade',
    body: [
      'Não usamos contas, cookies de rastreamento nem anúncios. Seus favoritos e a escolha de tema ficam apenas no seu navegador.',
    ],
  },
  {
    title: 'Créditos',
    body: [
      'Fotos dos candidatos: divulgadas pelo TSE junto com os resultados. Baixamos cada foto uma vez e a exibimos a partir dos nossos servidores.',
      'Desenho do mapa: “Map of Brazil”, de Victor Cazanave (svg-maps), licença CC BY 4.0. O código-fonte do site é aberto e está no GitHub.',
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-2xl pb-8 pt-3">
      <h1 className="text-[28px] font-semibold tracking-tight">Sobre os dados</h1>
      <p className="mt-2 text-ink-2">
        O que você vê aqui, de onde vem e como ler. Para um resumo visual, veja{' '}
        <Link href="/como-funciona" className="text-info underline underline-offset-2">
          como funciona
        </Link>
        .
      </p>
      <div className="mt-8 grid gap-8">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="text-[18px] font-semibold">{s.title}</h2>
            {s.body.map((p) => (
              <p key={p.slice(0, 24)} className="mt-2 leading-relaxed text-ink-2">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
