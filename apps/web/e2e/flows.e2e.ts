import { expect, type Page, test } from '@playwright/test';

/** Main reading path of the product, on the fictitious demo election. */

async function openDemo(page: Page) {
  await page.goto('/elections/demo?turno=1');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('demonstrativa');
}

test('opens Brazil with counting progress and the headline race', async ({ page }) => {
  await openDemo(page);
  await expect(page.getByText('Eleição demonstrativa com candidatos e partidos fictícios')).toBeVisible();
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

  await page.getByPlaceholder('Buscar município…').fill('campinas');
  await page.getByRole('link', { name: /Campinas/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Campinas' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Você está em' })).toContainText('São Paulo');
});

test('opens the historical timeline', async ({ page }) => {
  await page.goto('/elections/demo/historico?turno=1');
  await expect(page.getByRole('heading', { name: 'Histórico da apuração' })).toBeVisible();
  const slider = page.getByRole('slider', { name: 'Momento da apuração' });
  await expect(slider).toBeVisible();
  await slider.focus();
  await page.keyboard.press('Home');
  await expect(page.getByText('Como estava às')).toBeVisible();
});

test('opens live operations', async ({ page }) => {
  await page.goto('/elections/demo/operations?turno=1');
  await expect(page.getByRole('heading', { name: 'Ao vivo' })).toBeVisible();
  await expect(page.getByText(/Coletor:/)).toBeVisible();
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
  await page.getByPlaceholder('Estado, município, candidato, partido ou cargo').fill('recife');
  await page.getByRole('option', { name: /Recife/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Recife' })).toBeVisible();
});
