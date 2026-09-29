import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Eleições Brasil',
    short_name: 'Eleições',
    description: 'Apuração das eleições brasileiras em tempo real, com dados oficiais do TSE.',
    lang: 'pt-BR',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f1519',
    theme_color: '#0f1519',
    icons: [
      { src: '/icon/192', sizes: '192x192', type: 'image/png' },
      { src: '/icon/512', sizes: '512x512', type: 'image/png' },
      { src: '/icon/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
