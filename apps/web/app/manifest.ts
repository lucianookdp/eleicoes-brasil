import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Eleições Brasil',
    short_name: 'Eleições',
    description: 'Apuração das eleições brasileiras em tempo real, com dados oficiais do TSE.',
    lang: 'pt-BR',
    start_url: `${base}/`,
    scope: `${base}/`,
    display: 'standalone',
    background_color: '#0f1519',
    theme_color: '#0f1519',
    icons: [
      { src: `${base}/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${base}/icon-512.png`, sizes: '512x512', type: 'image/png' },
      { src: `${base}/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
