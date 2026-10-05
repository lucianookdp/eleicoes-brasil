import { expect, test } from '@playwright/test';

/**
 * Phones first: every screen at small, common and large phone widths must fit without sideways
 * scrolling, in both rounds (the runoff shows other cards) and both themes.
 */
const PAGES = [
  '/eleicao/',
  '/eleicao/estados/',
  '/eleicao/estado/?uf=sp',
  '/eleicao/estado/?uf=zz',
  '/eleicao/municipio/?uf=sp&c=34020',
  '/eleicao/cargos/',
  '/eleicao/bancadas/',
  '/eleicao/historico/',
  '/eleicao/bastidores/',
  '/eleicao/comparar/',
  '/stf/',
];
const WIDTHS = [320, 375, 430, 768, 1024, 1280, 1440];

test.describe('fits every screen width', () => {
  test.skip(({ isMobile }) => isMobile, 'widths are set by hand; once is enough');

  for (const round of ['1', '2'])
    for (const width of WIDTHS)
      test(`round ${round} at ${width}px`, async ({ page }) => {
        test.setTimeout(120_000);
        await page.setViewportSize({ width, height: 800 });
        for (const theme of ['dark', 'light']) {
          await page.addInitScript((t) => localStorage.setItem('eleicoes:theme', t), theme);
          for (const path of PAGES) {
            const sep = path.includes('?') ? '&' : '?';
            await page.goto(`${path}${sep}e=demo&t=${round}`);
            await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
            // The realtime stream stays open, so "network idle" never comes: give the data a moment.
            await page.waitForTimeout(700);
            const overflow = await page.evaluate(
              () => document.documentElement.scrollWidth - window.innerWidth,
            );
            expect(overflow, `${path} (${theme}) overflows by ${overflow}px`).toBeLessThanOrEqual(0);
          }
        }
      });
});
