import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from './providers';

// Fonts ship with the site (Fontsource packages of the same Google fonts): builds and first paint
// never depend on fonts.googleapis.com.
const archivo = localFont({
  src: '../node_modules/@fontsource-variable/archivo/files/archivo-latin-standard-normal.woff2',
  variable: '--font-archivo',
  display: 'swap',
  weight: '100 900',
  declarations: [{ prop: 'font-stretch', value: '62% 125%' }],
});
const mono = localFont({
  src: [
    {
      path: '../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2',
      weight: '400',
    },
    {
      path: '../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2',
      weight: '500',
    },
  ],
  variable: '--font-jetbrains',
  display: 'swap',
});

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const metadata: Metadata = {
  title: { default: 'Eleições Brasil', template: '%s · Eleições Brasil' },
  description:
    'Apuração das eleições 2026 em tempo real, com os dados oficiais do Tribunal Superior Eleitoral (TSE).',
  applicationName: 'Eleições Brasil',
  // Link previews (WhatsApp, X, Telegram) need absolute URLs.
  metadataBase: new URL('https://eleicoes.lucianookdp.dev'),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Eleições Brasil',
    title: 'Eleições 2026 · Apuração em tempo real',
    description: 'Dados oficiais do TSE, atualizados a cada parcial. 2º turno em 25 de outubro.',
    url: `${base}/`,
    images: [
      { url: `${base}/og.png?v=4`, width: 1200, height: 630, alt: 'Eleições 2026 · Apuração em tempo real' },
    ],
  },
  twitter: { card: 'summary_large_image' },
  icons: {
    icon: `${base}/icon-32.png`,
    apple: `${base}/apple-touch-icon.png`,
  },
  manifest: `${base}/manifest.webmanifest`,
  appleWebApp: { capable: true, title: 'Eleições', statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0e1013' },
    { media: '(prefers-color-scheme: light)', color: '#f4f5f7' },
  ],
};

const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
// Static hosting cannot send headers, so the policy travels as a meta tag. Read-only app:
// scripts and styles from our origin, data only from our API.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  // Candidate photos on the Polymarket page come from Polymarket's own image host.
  `img-src 'self' data: blob: ${api} https://polymarket-upload.s3.us-east-2.amazonaws.com`,
  "font-src 'self'",
  // Our API, plus Polymarket's public API for the separate "Mercado de apostas" page only.
  `connect-src 'self' ${api} https://gamma-api.polymarket.com https://clob.polymarket.com`,
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

// Applies the saved or system theme before first paint (no flash).
const themeScript = `try{var t=localStorage.getItem('eleicoes:theme');if(!t)t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <meta httpEquiv="Content-Security-Policy" content={csp} />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static theme bootstrap, no user input */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
