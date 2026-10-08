import { DOMESTIC_STATES } from '@eleicoes/election-core';
import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const SITE = 'https://eleicoes.lucianookdp.dev';

/** What search engines should know about: the sections, and each state's page. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    ['/', 1],
    ['/eleicao/', 1],
    ['/eleicao/estados/', 0.9],
    ['/eleicao/cargos/', 0.8],
    ['/eleicao/bancadas/', 0.7],
    ['/eleicao/cargos/?cargo=stf', 0.6],
    ['/polymarket/', 0.6],
    ['/eleicao/historico/', 0.5],
    ['/eleicao/comparar/', 0.5],
    ['/eleicao/bastidores/', 0.3],
    ['/como-funciona/', 0.3],
    ['/sobre/', 0.3],
  ] as const;
  const now = new Date();
  return [
    ...pages.map(([path, priority]) => ({ url: `${SITE}${path}`, lastModified: now, priority })),
    ...DOMESTIC_STATES.map((s) => ({
      url: `${SITE}/eleicao/estado/?uf=${s.code.toLowerCase()}`,
      lastModified: now,
      priority: 0.6,
    })),
  ];
}
