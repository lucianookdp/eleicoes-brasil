import { APP_VERSION, loadEnv, workerEnvSchema } from '@eleicoes/config';
import { createDatabase, runMigrations } from '@eleicoes/database';
import { findRound } from '@eleicoes/election-core';
import { createProvider, TseHttpClient } from '@eleicoes/tse-client';
import { Collector } from './collector';
import { createLogger } from './logger';
import { runReplay } from './replay';
import { Store } from './store';

const env = loadEnv(workerEnvSchema);
const log = createLogger('collector', env.LOG_LEVEL);

await runMigrations(env.DATABASE_URL);

if (env.APP_MODE === 'REPLAY') {
  await runReplay({
    databaseUrl: env.DATABASE_URL,
    source: env.ELECTION_ROUND,
    speed: env.REPLAY_SPEED,
    log,
  });
  process.exit(0);
}

if (env.APP_MODE === 'DEVELOPMENT' && env.DEMO_EMBEDDED) {
  // One process for the whole demo (handy on a single hosted service).
  const { startDemoServer } = await import('./demo/server');
  startDemoServer({ port: env.DEMO_TSE_PORT, durationMinutes: env.DEMO_DURATION_MINUTES, waitSeconds: 60 });
  log.info({ port: env.DEMO_TSE_PORT }, 'embedded fictitious TSE server started');
}

const round = findRound(env.ELECTION_ROUND);
if (!round) {
  log.fatal(
    { round: env.ELECTION_ROUND },
    'unknown election round; see packages/election-core/src/registry.ts',
  );
  process.exit(1);
}
const registered = round.sources[env.APP_MODE];
if (!registered) {
  log.fatal({ round: round.slug, mode: env.APP_MODE }, 'this round has no source for the selected mode');
  process.exit(1);
}
const source = { ...registered, baseUrl: env.TSE_BASE_URL ?? registered.baseUrl };

const { db, sql, close } = createDatabase(env.DATABASE_URL, { max: 5 });
const roundId = await Store.ensureRound(db, round, env.APP_MODE, source.environment);
const store = new Store(db, sql, roundId, round.slug);

const http = new TseHttpClient({
  requestsPerSecond: env.TSE_REQUESTS_PER_SECOND,
  concurrency: env.TSE_CONCURRENCY,
  timeoutMs: env.TSE_TIMEOUT_MS,
  maxRetries: env.TSE_MAX_RETRIES,
  userAgent: `eleicoes-brasil/${APP_VERSION} (+https://github.com/lucianookdp/eleicoes-brasil)`,
});
const provider = createProvider(http, round, source);
const collector = new Collector(provider, store, log, {
  mode: env.APP_MODE,
  collectCityResults: env.COLLECT_CITY_RESULTS,
  cityResultOffices: env.CITY_RESULT_OFFICES,
  maxResultFetchesPerCycle: env.MAX_RESULT_FETCHES_PER_CYCLE,
  reconcileEvery: Math.max(1, Math.round(300 / env.TSE_POLL_INTERVAL)),
  cityConcurrency: env.TSE_CONCURRENCY,
});
http.onRequest(collector.onRequest);

log.info(
  {
    round: round.slug,
    mode: env.APP_MODE,
    base: source.baseUrl,
    adapter: `${provider.id}@${provider.version}`,
    rps: env.TSE_REQUESTS_PER_SECOND,
  },
  'collector starting',
);

let stopping = false;
const shutdown = async () => {
  stopping = true;
  collector.stop();
  log.info('shutting down');
  await close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Background work (EA15, state deputies, municipal files) drains continuously; headline cycles
// never overlap.
void collector.drainCities();
while (!stopping) {
  const started = Date.now();
  let wait = env.TSE_POLL_INTERVAL * 1000;
  try {
    // Source not published yet: check once a minute (repeated 404s can get an IP blocked).
    if ((await collector.runCycle()) === 'waiting') wait = 60_000;
  } catch (err) {
    // runCycle handles its own errors; this only catches database outages.
    log.error({ err }, 'cycle crashed; retrying after the poll interval');
    // Files fetched in the crashed cycle may not have been stored: download them again.
    provider.resetConditionalCache();
  }
  // Fixed rate: a cycle starts every TSE_POLL_INTERVAL seconds (or right away if the last one
  // took longer), so detection latency does not grow with cycle duration.
  await new Promise((r) => setTimeout(r, Math.max(250, wait - (Date.now() - started))));
}
