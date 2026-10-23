import { expect, type Page, test } from '@playwright/test';

/**
 * Election-night failure modes: the API unreachable, the connection dropping mid-count, and the
 * very first minutes of a count (zero votes). The site must say what is going on and never show
 * broken numbers or crash.
 */
const API = 'http://localhost:4000';

/** Text that only appears when a number or a field went wrong somewhere. */
async function expectNoBrokenText(page: Page) {
  const text = await page.locator('main').innerText();
  expect(text).not.toMatch(/\bNaN\b|\bundefined\b|\bInfinity\b|\[object Object\]/);
}

test('API unreachable from the start: a clear message, no crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route(`${API}/api/**`, (route) => route.abort('connectionrefused'));
  await page.goto('/eleicao/?e=demo&t=1');
  // React Query tries a few times first (about 7 s).
  await expect(page.getByRole('heading', { name: 'Não foi possível carregar a apuração' })).toBeVisible({
    timeout: 20_000,
  });
  expect(errors).toEqual([]);
});

test('connection drops mid-count: the numbers stay and the header says so', async ({ page, context }) => {
  await page.goto('/eleicao/?e=demo&t=1');
  const race = page.getByRole('heading', { name: 'Presidente' }).first();
  await expect(race).toBeVisible();
  const before = await page.locator('main').innerText();
  await context.setOffline(true);
  await expect(page.getByRole('status').filter({ hasText: 'Sem conexão' }).first()).toBeVisible();
  // Last numbers received stay on screen.
  await expect(race).toBeVisible();
  expect(await page.locator('main').innerText()).toContain(
    before.split('\n').find((l) => /%$/.test(l)) ?? '%',
  );
  await context.setOffline(false);
  await expect(page.getByRole('status').filter({ hasText: 'Sem conexão' })).toHaveCount(0, {
    timeout: 15_000,
  });
});

test('live stream refused once (API restarting): the page opens it again by itself', async ({ page }) => {
  // A browser's EventSource gives up for good after an error response (unlike a network error).
  let calls = 0;
  await page.route(`${API}/api/realtime/**`, (route) => {
    calls++;
    return calls === 1 ? route.fulfill({ status: 503, body: 'restarting' }) : route.continue();
  });
  await page.goto('/eleicao/?e=demo&t=1');
  await expect(page.getByRole('heading', { name: 'Presidente' }).first()).toBeVisible();
  await expect.poll(() => calls, { timeout: 15_000 }).toBeGreaterThanOrEqual(2);
  await expect(page.getByRole('status').filter({ hasText: 'Reconectando' })).toHaveCount(0, {
    timeout: 15_000,
  });
});

test('runoff in its first minutes (0 votes): no broken numbers', async ({ page, request }) => {
  const elections = await (await request.get(`${API}/api/elections`)).json();
  test.skip(
    !elections.some((e: { rounds: { slug: string }[] }) => e.rounds.some((r) => r.slug === 'demo-2')),
    'needs the demo runoff',
  );
  // The real overview, turned into "polls just closed": live, nothing counted, zero votes.
  await page.route(`${API}/api/elections/demo-2/overview*`, async (route) => {
    const res = await route.fetch();
    const d = await res.json();
    d.round.status = 'live';
    if (d.progress)
      Object.assign(d.progress, { countedPct: 0, sectionsCounted: 0, sectionsCountedPct: 0, turnout: 0 });
    if (d.headline) {
      d.headline.final = false;
      d.headline.mathematicallyDecided = null;
      d.headline.progress = { ...d.headline.progress, countedPct: 0, sectionsCounted: 0 };
      for (const c of d.headline.candidates)
        Object.assign(c, {
          votes: 0,
          percent: null,
          status: null,
          elected: null,
          deltaVotes: null,
          deltaPp: null,
        });
    }
    for (const s of d.states) {
      s.leader = null;
      if (s.progress) Object.assign(s.progress, { countedPct: 0, sectionsCounted: 0 });
    }
    await route.fulfill({ response: res, json: d });
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const path of ['/eleicao/', '/eleicao/estados/', '/eleicao/telao/']) {
    await page.goto(`${path}?e=demo&t=2`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForTimeout(800);
    await expectNoBrokenText(page);
  }
  expect(errors).toEqual([]);
});

test.describe('Polymarket failures never break its page', () => {
  test('Polymarket down: a clear message, that the count is not affected, and a link to it', async ({
    page,
  }) => {
    await page.route('https://gamma-api.polymarket.com/**', (r) => r.abort('connectionrefused'));
    await page.goto('/polymarket/');
    await expect(page.getByText('Polymarket fora do ar', { exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/não afeta a apuração/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tentar agora' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Abrir o site do Polymarket' })).toBeVisible();
  });

  test('Polymarket under maintenance (503): says so', async ({ page }) => {
    await page.route('https://gamma-api.polymarket.com/**', (r) => r.fulfill({ status: 503, body: 'x' }));
    await page.goto('/polymarket/');
    await expect(page.getByText('Polymarket em manutenção', { exact: true })).toBeVisible({
      timeout: 30_000,
    });
  });

  test('Polymarket stops answering after loading: the last numbers stay, with their time', async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto('/polymarket/');
    await expect(page.getByRole('heading', { name: 'Quem vence a eleição presidencial?' })).toBeVisible({
      timeout: 30_000,
    });
    await page.route('https://gamma-api.polymarket.com/**', (r) => r.abort('connectionrefused'));
    // The next refreshes (every 15 s) and their retries fail.
    await page.clock.runFor(120_000);
    await expect(page.getByText(/Mostrando os números das \d\d:\d\d/)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Quem vence a eleição presidencial?' })).toBeVisible();
  });

  test('Polymarket down: the card in "Mais" says it instead of "ao vivo"', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'the card is in the phone sheet');
    await page.route('https://gamma-api.polymarket.com/**', (r) => r.abort('connectionrefused'));
    await page.goto('/eleicao/?e=demo&t=1');
    await page
      .getByRole('navigation', { name: 'Navegação principal' })
      .getByRole('button', { name: 'Mais' })
      .click();
    await expect(page.getByText('fora do ar', { exact: true })).toBeVisible({ timeout: 30_000 });
  });

  test('one market down: the rest shows, with a note', async ({ page }) => {
    await page.route('https://gamma-api.polymarket.com/public-search**', (r) =>
      r.fulfill({ status: 500, body: 'x' }),
    );
    await page.goto('/polymarket/');
    await expect(page.getByRole('heading', { name: 'Quem vence a eleição presidencial?' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText('Parte dos mercados do Polymarket não respondeu agora')).toBeVisible();
    await expectNoBrokenText(page);
  });

  test('price history down: the chart says so instead of loading forever', async ({ page }) => {
    await page.route('https://clob.polymarket.com/**', (r) => r.fulfill({ status: 503, body: 'x' }));
    await page.goto('/polymarket/');
    await expect(
      page.getByText('O gráfico do Polymarket não respondeu agora. Tentando de novo.'),
    ).toBeVisible({
      timeout: 30_000,
    });
  });
});

test('live count: the numbers update on their own, without reloading', async ({ page, request }) => {
  const overview = await (await request.get(`${API}/api/elections/demo-2/overview`)).json();
  test.skip(overview.progress?.status !== 'in-progress', 'demo runoff count not in progress');
  test.setTimeout(90_000);
  await page.goto('/eleicao/?e=demo&t=2');
  await expect(page.getByRole('status').filter({ hasText: 'Ao vivo' }).first()).toBeVisible();
  // "votos de 12,34% das urnas" above the race: it must move as the TSE (demo) publishes.
  const counted = page.getByText(/^votos de [\d,]+% das urnas$/).first();
  await expect(counted).toBeVisible();
  const first = await counted.innerText();
  await expect.poll(() => counted.innerText(), { timeout: 60_000, intervals: [2_000] }).not.toBe(first);
  await expectNoBrokenText(page);
});

test('the TSE goes quiet mid-count: header, notices and TV mode all say so', async ({ page, request }) => {
  const elections = await (await request.get(`${API}/api/elections`)).json();
  test.skip(
    !elections.some((e: { rounds: { slug: string }[] }) => e.rounds.some((r) => r.slug === 'demo-2')),
    'needs the demo runoff',
  );
  // The overview of a live count whose last TSE numbers are 12 minutes old (our collection healthy).
  const old = new Date(Date.now() - 12 * 60_000).toISOString();
  await page.route(`${API}/api/elections/demo-2/overview*`, async (route) => {
    const res = await route.fetch();
    const d = await res.json();
    d.round.status = 'live';
    d.ingestion.state = 'healthy';
    d.progress = { ...d.progress, status: 'in-progress', countedPct: 42, updatedAt: old };
    if (d.headline?.provenance) d.headline.provenance.retrievedAt = old;
    await route.fulfill({ response: res, json: d });
  });
  await page.goto('/eleicao/?e=demo&t=2');
  // Header (every page): no red "Ao vivo" while nothing arrives.
  await expect(page.getByRole('status').filter({ hasText: 'Aguardando o TSE' }).first()).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: /^Ao vivo/ })).toHaveCount(0);
  // The notice: how long, since when, and whose delay it is.
  await expect(page.getByText(/Aguardando o TSE · há 1[12] min/)).toBeVisible();
  await expect(page.getByText(/O atraso é do TSE/)).toBeVisible();
  // A page without its own notice gets the country-wide one.
  await page.goto('/eleicao/estados/?e=demo&t=2');
  await expect(page.getByText(/Aguardando o TSE · há 1[12] min/)).toBeVisible();
  // The TV mode says it too.
  await page.goto('/eleicao/telao/?e=demo&t=2');
  await expect(page.getByText(/Aguardando o TSE( desde)?/).first()).toBeVisible();
});
