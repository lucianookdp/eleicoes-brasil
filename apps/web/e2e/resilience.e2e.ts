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
