import { expect, type Page, test } from '@playwright/test';

/** Main reading path of the product, on the fictitious demo election. */

async function openDemo(page: Page) {
  await page.goto('/eleicao/?e=demo&t=1');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('demonstrativa');
}

test('opens Brazil with counting progress and the headline race', async ({ page }) => {
  await openDemo(page);
  await expect(page.getByText('Eleição de demonstração, com candidatos e partidos fictícios')).toBeVisible();
  await expect(page.locator('#apuracao')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Presidente' })).toBeVisible();
  // Never a horizontal scroll on the page, on any viewport.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('selects a state, changes office and opens a city', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('tab', { name: 'Estados' }).click();
  await page
    .getByRole('link', { name: /São Paulo/ })
    .first()
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'São Paulo' })).toBeVisible();

  await page.getByRole('tab', { name: 'Governador' }).click();
  await expect(page).toHaveURL(/cargo=governador/);
  await expect(page.getByRole('tab', { name: 'Governador' })).toHaveAttribute('aria-selected', 'true');

  await page.getByPlaceholder('Buscar município').fill('campinas');
  await page.getByRole('link', { name: /Campinas/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Campinas' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Você está em' })).toContainText('São Paulo');
});

test('opens the historical timeline', async ({ page }) => {
  await page.goto('/eleicao/historico/?e=demo&t=1');
  await expect(page.getByRole('heading', { name: 'Linha do tempo' })).toBeVisible();
  const slider = page.getByRole('slider', { name: 'Momento da apuração' });
  await expect(slider).toBeVisible();
  await slider.focus();
  await page.keyboard.press('Home');
  await expect(page.getByText('Como estava às')).toBeVisible();
});

test('opens behind the scenes', async ({ page }) => {
  await page.goto('/eleicao/bastidores/?e=demo&t=1');
  await expect(page.getByRole('heading', { name: 'Bastidores' })).toBeVisible();
  await expect(page.getByText(/^Coleta /)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ritmo da apuração' })).toBeVisible();
});

test('global search finds a city', async ({ page, isMobile }) => {
  await openDemo(page);
  if (isMobile)
    await page
      .getByRole('navigation', { name: 'Navegação principal' })
      .getByRole('button', { name: 'Buscar' })
      .click();
  else await page.keyboard.press('Control+k');
  await page.getByPlaceholder('Cidade, estado ou candidato').fill('recife');
  await page.getByRole('option', { name: /Recife/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Recife' })).toBeVisible();
});

test('old-style links still work', async ({ page }) => {
  await page.goto('/elections/demo/states/sp?turno=1');
  await expect(page).toHaveURL(/\/eleicao\/estado\/\?e=demo&t=1&uf=sp/);
  await expect(page.getByRole('heading', { level: 1, name: 'São Paulo' })).toBeVisible();
});

test('votes abroad: listed after the states and searchable', async ({ page, isMobile }) => {
  await page.goto('/eleicao/estados/?e=demo&t=1');
  const names = page.getByRole('link', { name: /Exterior/ });
  await expect(names.first()).toBeVisible();
  if (isMobile)
    await page
      .getByRole('navigation', { name: 'Navegação principal' })
      .getByRole('button', { name: 'Buscar' })
      .click();
  else await page.keyboard.press('Control+k');
  await page.getByPlaceholder('Cidade, estado ou candidato').fill('vancouver');
  await page.getByRole('option', { name: /Vancouver/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Vancouver' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Você está em' })).toContainText('Exterior');
});

test('runoff: head-to-head card with the vote difference', async ({ page, request }) => {
  // Needs the demo running in runoff mode (DEMO_ROUND=2, ELECTION_ROUND=demo-2).
  const elections = await (await request.get('http://localhost:4000/api/elections')).json();
  const hasRunoff = elections.some((e: { rounds: { slug: string }[] }) =>
    e.rounds.some((r) => r.slug === 'demo-2'),
  );
  test.skip(!hasRunoff, 'demo runoff not running');
  await page.goto('/eleicao/?e=demo&t=2');
  await expect(page.getByText(/está à frente por [\d.]+ votos|Aguardando os primeiros votos/)).toBeVisible();
  await expect(page.getByText(/faltam .* das urnas|venceu por/)).toBeVisible();
  // A runoff never shows the 1st-round list of candidates.
  await expect(page.getByRole('button', { name: /Ver todos os/ })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Evolução' }).click();
  await expect(page.getByText('Diferença de votos')).toBeVisible();
  await expect(page.getByText(/Maior vantagem: [\d.]+ votos/)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
