import type { NextConfig } from 'next';

/**
 * Exported as static files for GitHub Pages (a CDN, no server to scale on election night).
 * Served at the root of eleicoes.lucianookdp.dev (GitHub Pages custom domain), so
 * NEXT_PUBLIC_BASE_PATH is empty; it was "/eleicoes-brasil" under lucianookdp.github.io.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  transpilePackages: ['@eleicoes/election-core'],
};

export default config;
