import type { NextConfig } from 'next';

/**
 * Exported as static files for GitHub Pages (a CDN, no server to scale on election night).
 * NEXT_PUBLIC_BASE_PATH is "/eleicoes-brasil" when served from lucianookdp.dev/eleicoes-brasil,
 * and empty on a dedicated domain (election.lucianookdp.dev).
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
