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

  // Replay: the button toggles and the moment moves forward on its own.
  await slider.focus();
  await page.keyboard.press('Home');
  const start = await slider.inputValue();
  await page.getByRole('button', { name: 'Reproduzir' }).click();
  await expect(page.getByRole('button', { name: 'Pausar' })).toBeVisible();
  await expect.poll(() => slider.inputValue(), { timeout: 5000 }).not.toBe(start);
  await page.getByRole('button', { name: 'Pausar' }).click();
  await expect(page.getByRole('button', { name: 'Reproduzir' })).toBeVisible();
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
  await expect(
    page.getByText(/(está à frente|venceu) por [\d.]+ votos|Aguardando os primeiros votos/),
  ).toBeVisible();
  await expect(page.getByText(/faltam .* das urnas|venceu por/)).toBeVisible();
  // Each finalist's share in the 1st round, same place.
  await expect(page.getByText(/^1º turno: [\d,]+%$/).first()).toBeVisible();
  // Fixed sides: whoever came first in the 1st round is on the left, whatever the current lead.
  const firsts = await page.getByText(/^1º turno: [\d,]+%$/).allTextContents();
  const pct = (t: string) => Number(t.replace(/[^\d,]/g, '').replace(',', '.'));
  expect(firsts).toHaveLength(2);
  expect(pct(firsts[0]!)).toBeGreaterThanOrEqual(pct(firsts[1]!));
  // A runoff never shows the 1st-round list of candidates.
  await expect(page.getByRole('button', { name: /Ver todos os/ })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Evolução' }).click();
  await expect(page.getByText('Diferença de votos')).toBeVisible();
  await expect(page.getByText(/Maior vantagem: [\d.]+ votos/)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('share: result image and WhatsApp text with the site link', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Compartilhar' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Compartilhar resultado' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('img', { name: 'Imagem do resultado' })).toBeVisible();
  const text = await dialog.locator('pre').innerText();
  expect(text).toContain('Presidente · Brasil');
  expect(text).toContain('Acompanhe ao vivo: http');
  // A 1st-round leader is "à frente", never "venceu", unless the TSE marks them elected.
  expect(text).not.toContain('venceu');
  await expect(dialog.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', /wa\.me/);
});

test('minha cidade: pick once, see it at the top of the home page', async ({ page }) => {
  await openDemo(page);
  const card = page.getByRole('region', { name: 'Minha cidade' });
  await card.getByPlaceholder('Digite o nome da cidade').fill('campinas');
  await card.getByRole('button', { name: /Campinas/ }).click();
  await expect(card.getByRole('link', { name: 'Campinas' })).toBeVisible();
  await expect(card.getByText(/à frente por [\d.]+ votos/)).toBeVisible();
  // Remembered on this device.
  await page.reload();
  await expect(
    page.getByRole('region', { name: 'Minha cidade' }).getByRole('link', { name: 'Campinas' }),
  ).toBeVisible();
});

test('minha cidade: "Agora não" keeps a way back to pick it later', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('region', { name: 'Minha cidade' }).getByRole('button', { name: 'Agora não' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Escolher minha cidade' }).click();
  const card = page.getByRole('region', { name: 'Minha cidade' });
  await card.getByPlaceholder('Digite o nome da cidade').fill('campinas');
  await card.getByRole('button', { name: /Campinas/ }).click();
  await expect(card.getByRole('link', { name: 'Campinas' })).toBeVisible();
});

test('during the count: where the most votes are still to be counted', async ({ page, request }) => {
  const overview = await (await request.get('http://localhost:4000/api/elections/demo-1/overview')).json();
  test.skip(overview.progress?.status !== 'in-progress', 'demo count not in progress');
  await openDemo(page);
  const list = page.getByRole('list', { name: 'Estados com mais eleitores em urnas ainda não apuradas' });
  await expect(list).toBeVisible();
  await expect(list.getByRole('listitem')).toHaveCount(5);
  await expect(list.getByText(/eleitores · [\d.]+ urnas/).first()).toBeVisible();
});

test('governors and senators of every state on one screen', async ({ page }) => {
  await page.goto('/eleicao/cargos/?e=demo&t=1');
  await expect(page.getByRole('heading', { level: 1, name: 'Governadores e senadores' })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Acre/ })).toBeVisible();
  await page.getByRole('radio', { name: 'Senador' }).click();
  await expect(page).toHaveURL(/cargo=senador/);
  await page.getByRole('link', { name: /^São Paulo/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'São Paulo' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Senador' })).toHaveAttribute('aria-selected', 'true');
});

test('after the count: summary card with turnout and the lead', async ({ page, request }) => {
  const overview = await (await request.get('http://localhost:4000/api/elections/demo-1/overview')).json();
  test.skip((overview.progress?.countedPct ?? 0) < 100, 'demo count not finished');
  await openDemo(page);
  const summary = page.getByRole('region', { name: 'Resumo da apuração' });
  await expect(summary).toBeVisible();
  await expect(summary.getByText(/[Dd]iferença de [\d.]+ votos/)).toBeVisible();
  await expect(summary.getByText('Comparecimento')).toBeVisible();
  // Every share comes with its number: voters for turnout and abstention, votes for blank and null.
  await expect(summary.getByText(/^[\d.]+ eleitores$/)).toHaveCount(2);
  await expect(summary.getByText(/^[\d.]+ votos$/).last()).toBeVisible();
});

test('counts the visit privately (random id, no cookie)', async ({ page, context }) => {
  const beacon = page.waitForRequest((r) => r.url().endsWith('/api/visit') && r.method() === 'POST');
  await page.goto('/?e=demo&t=1');
  const req = await beacon;
  expect(req.postData()).toMatch(/^[0-9a-f-]{36}$/);
  expect(await context.cookies()).toHaveLength(0);
});

test('bancadas: seats per party, one dot per seat, and the votes each decision needs', async ({
  page,
  request,
}) => {
  await page.goto('/eleicao/bancadas/?e=demo&t=1');
  await expect(page.getByRole('heading', { level: 1, name: 'Bancadas eleitas' })).toBeVisible();
  // The Constitution's numbers are always there; the seats only once every state is final.
  await expect(page.getByRole('rowheader', { name: /Mudar a Constituição/ })).toBeVisible();
  const { chambers } = await (await request.get('http://localhost:4000/api/elections/demo-1/benches')).json();
  if (chambers.some((c: { statesFinal: number; statesTotal: number }) => c.statesFinal < c.statesTotal)) {
    await expect(page.getByText(/aparecem quando o TSE terminar/)).toBeVisible();
    return;
  }
  const chart = page.getByRole('img', { name: /cadeiras:/ });
  await expect(chart).toBeVisible();
  const label = (await chart.getAttribute('aria-label')) ?? '';
  const total = Number(/^(\d+) cadeiras/.exec(label)?.[1]);
  expect(await chart.locator('circle').count()).toBe(total);
  await page.getByRole('radio', { name: 'Senado' }).click();
  await expect(page.getByText(/senadores eleitos em 2026/)).toBeVisible();
});

test('state flags next to state names', async ({ page }) => {
  await page.goto('/eleicao/estado/?e=demo&t=1&uf=sp');
  const flag = page.getByRole('heading', { level: 1 }).locator('img');
  await expect(flag).toHaveAttribute('src', /\/flags\/sp\.png$/);
  await expect.poll(() => flag.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
});

test("cities: who won each city, and a candidate's votes city by city", async ({ page }) => {
  await page.goto('/eleicao/estado/?e=demo&t=1&uf=sp');
  await expect(page.getByRole('combobox', { name: 'Ordenar' })).toBeVisible();
  await page.waitForTimeout(700);
  test.skip((await page.getByText(/^Mais votado:$/).count()) === 0, 'no city votes counted yet');
  const select = page.getByRole('combobox', { name: 'Ordenar' });
  const option = select.locator('option[value^="candidate:"]').first();
  const label = (await option.textContent())!.replace('Mais votos de ', '');
  await select.selectOption((await option.getAttribute('value'))!);
  const rows = page.getByText(new RegExp(`^${label}:$`));
  await expect(rows.first()).toBeVisible();
  // Sorted by that candidate's votes, largest first.
  const votes = await page.locator('li .numeral.font-medium').allTextContents();
  const n = votes.slice(0, 5).map((v) => Number(v.replace(/\D/g, '')));
  expect(n).toEqual([...n].sort((a, b) => b - a));
});

test('STF: every minister with photo, who appointed them, and the open seat', async ({ page }) => {
  // A tab of the governors and senators page (old Bancadas links with ?casa=stf land here too).
  await page.goto('/eleicao/bancadas/?e=demo&t=1&casa=stf');
  await expect(page).toHaveURL(/cargos\/.*cargo=stf/);
  await expect(page.getByRole('heading', { level: 1, name: 'Supremo Tribunal Federal' })).toBeVisible();
  const photos = page.getByRole('img', { name: /^Foto de / });
  // Ten ministers, each with a photo (the panels section shows some of them again).
  await expect
    .poll(async () => new Set(await photos.evaluateAll((els) => els.map((e) => e.getAttribute('alt')))).size)
    .toBe(10);
  for (const img of await photos.all())
    await expect
      .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth))
      .toBeGreaterThan(0);
  await expect(page.getByText('Vaga aberta', { exact: true })).toBeVisible();
  await expect(page.getByText('Lula', { exact: true }).first()).toBeVisible();
});

test('runoff over: the winner banner, only once the TSE marks "Eleito"', async ({ page, request }) => {
  const overview = await (await request.get('http://localhost:4000/api/elections/demo-2/overview')).json();
  const elected = overview.headline?.candidates.find((c: { status: string | null }) =>
    /^eleit/i.test(c.status ?? ''),
  );
  await page.goto('/eleicao/?e=demo&t=2');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const banner = page.getByText(/venceu o 2º turno$/);
  if (!elected) {
    await expect(banner).toHaveCount(0);
    return;
  }
  await expect(banner).toContainText(new RegExp(elected.ballotName, 'i'));
  await expect(page.getByText(/Aguardando o TSE/)).toHaveCount(0);
});

test('governors: named for what is disputed, and listed low on the runoff home page', async ({
  page,
  isMobile,
  request,
}) => {
  await page.goto('/eleicao/?e=demo&t=1');
  const nav = isMobile
    ? page.getByRole('navigation', { name: 'Navegação principal' })
    : page.getByRole('navigation', { name: 'Seções' });
  await expect(nav.getByRole('link', { name: 'Gov./Senado' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Governadores no 2º turno' })).toHaveCount(0);

  // The runoff part needs the demo runoff (DEMO_ROUND=2, ELECTION_ROUND=demo-2); CI runs round 1 only.
  const elections = await (await request.get('http://localhost:4000/api/elections')).json();
  if (!elections.some((e: { rounds: { slug: string }[] }) => e.rounds.some((r) => r.slug === 'demo-2')))
    return;
  await page.goto('/eleicao/?e=demo&t=2');
  await expect(nav.getByRole('link', { name: 'Governadores', exact: true })).toBeVisible();
  const section = page.getByRole('region', { name: 'Governadores no 2º turno' });
  await expect(section).toBeVisible();
  await expect(section.getByRole('link').first()).toBeVisible();
});

test('STF: filter by who appointed, timeline and panels', async ({ page }) => {
  await page.goto('/eleicao/cargos/?e=demo&t=1&cargo=stf');
  await page.getByRole('button', { name: /^Lula \d/ }).click();
  await expect(page.getByRole('img', { name: /^Foto de / }).first()).toBeVisible();
  const cards = page.getByText(/^Indicação de:/);
  const lula = await page.getByRole('button', { name: /^Lula \d/ }).textContent();
  await expect(cards).toHaveCount(Number(lula?.replace(/\D/g, '')));
  await expect(page.getByRole('heading', { name: 'Linha do tempo' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Turmas' })).toBeVisible();
  await expect(page.getByText(/Próxima aposentadoria:/)).toBeVisible();
});

test('states: only those where a candidate had the most votes', async ({ page }) => {
  await page.goto('/eleicao/estados/?e=demo&t=1');
  const chips = page.getByRole('group', { name: 'Mais votado em cada estado' }).getByRole('button');
  test.skip((await chips.count()) < 2, 'no votes counted yet');
  const second = chips.nth(1);
  const n = Number((await second.textContent())?.replace(/\D/g, '').slice(-2));
  await second.click();
  await expect(page.locator('table tbody tr, ul.divide-y > li').first()).toBeVisible();
  expect(n).toBeGreaterThan(0);
});

test('polymarket: its own page, with Polymarket named and linked', async ({ page }) => {
  await page.goto('/polymarket/');
  await expect(page.getByRole('heading', { level: 1, name: 'Polymarket' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Ver no Polymarket/ })).toHaveAttribute(
    'href',
    /polymarket\.com\/event\//,
  );
});
