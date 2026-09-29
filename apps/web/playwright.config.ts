import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end flows against a running demo stack (see .github/workflows/ci.yml or
 * `pnpm dev:demo`). BASE_URL defaults to the local web server.
 */
export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: process.env.BASE_URL ?? 'http://localhost:3000', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
