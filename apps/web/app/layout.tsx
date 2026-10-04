import type { Metadata, Viewport } from 'next';
import { Archivo, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from './providers';

const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' });
const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['400', '500'],
});

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const metadata: Metadata = {
  title: { default: 'Eleições Brasil', template: '%s · Eleições Brasil' },
  description:
    'Apuração das eleições 2026 em tempo real, com os dados oficiais do Tribunal Superior Eleitoral (TSE).',
  applicationName: 'Eleições Brasil',
  // Link previews (WhatsApp, X, Telegram) need absolute URLs.
  metadataBase: new URL('https://lucianookdp.github.io'),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Eleições Brasil',
    title: 'Eleições 2026 · Apuração em tempo real',
    description: 'Dados oficiais do TSE, atualizados a cada parcial.',
    url: `${base}/`,
    images: [
      { url: `${base}/og.png`, width: 1200, height: 630, alt: 'Eleições 2026 · Apuração em tempo real' },
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
    { media: '(prefers-color-scheme: dark)', color: '#0f1519' },
    { media: '(prefers-color-scheme: light)', color: '#f2f5f4' },
  ],
};

const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
// Static hosting cannot send headers, so the policy travels as a meta tag. Read-only app:
// scripts and styles from our origin, data only from our API.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${api}`,
  "font-src 'self'",
  `connect-src 'self' ${api}`,
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
