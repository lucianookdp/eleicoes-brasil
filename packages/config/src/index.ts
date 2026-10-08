import { z } from 'zod';

/** Application version shown in the UI and in /api/health. Keep in sync with the root package.json. */
export const APP_VERSION = '2.2.0';
export const APP_NAME = 'Eleições Brasil';

export const RUN_MODES = ['PRODUCTION', 'SIMULATION', 'DEVELOPMENT', 'REPLAY'] as const;
export type RunMode = (typeof RUN_MODES)[number];

const bool = z.enum(['true', 'false', '1', '0']).transform((v) => v === 'true' || v === '1');

const featureFlags = {
  ENABLE_SECTIONS_VIEW: bool.default(false),
  ENABLE_REPLAY: bool.default(true),
  ENABLE_ADVANCED_OPERATIONS: bool.default(true),
  ENABLE_COMPARISON: bool.default(true),
};

const common = {
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().url(),
};

export const workerEnvSchema = z.object({
  ...common,
  APP_MODE: z.enum(RUN_MODES).default('DEVELOPMENT'),
  /** Which registered election round the collector follows, e.g. "2026-1". */
  ELECTION_ROUND: z.string().default('demo-1'),
  /** Overrides the base URL derived from APP_MODE (useful for proxies and the local demo server). */
  TSE_BASE_URL: z.string().url().optional(),
  TSE_REQUESTS_PER_SECOND: z.coerce.number().positive().max(80).default(20),
  TSE_CONCURRENCY: z.coerce.number().int().positive().max(32).default(8),
  /** Seconds between headline cycles (Brazil + states). Municipal files drain continuously. */
  TSE_POLL_INTERVAL: z.coerce.number().positive().default(5),
  TSE_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  TSE_MAX_RETRIES: z.coerce.number().int().min(0).max(8).default(3),
  /** Fetch per-municipality result files (EA20 "mu"). The largest share of requests. */
  COLLECT_CITY_RESULTS: bool.default(true),
  /** "all" or "majoritarian": proportional offices at city level are large files. */
  CITY_RESULT_OFFICES: z.enum(['all', 'majoritarian']).default('all'),
  /** Upper bound of Brazil/state result files per headline cycle. */
  MAX_RESULT_FETCHES_PER_CYCLE: z.coerce.number().int().positive().default(400),
  /** REPLAY mode: playback speed multiplier (10 = ten times faster than it happened). */
  REPLAY_SPEED: z.coerce.number().positive().default(10),
  /** DEVELOPMENT only: start the fictitious TSE server inside the collector process. */
  DEMO_EMBEDDED: bool.default(false),
  /** Port for the local fictitious TSE server used by `pnpm dev:demo`. */
  DEMO_TSE_PORT: z.coerce.number().int().default(4010),
  /** How long (minutes) the fictitious counting takes from 0% to 100%. */
  DEMO_DURATION_MINUTES: z.coerce.number().positive().default(30),
});
export type WorkerEnv = z.infer<typeof workerEnvSchema>;

export const apiEnvSchema = z.object({
  ...common,
  ...featureFlags,
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().default(4000),
  /** Comma-separated list of allowed browser origins. */
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  /**
   * Per IP. Generous on purpose: Brazilian mobile carriers put thousands of people behind one
   * IP (CGNAT). Abuse protection belongs mostly to the CDN in front of the API.
   */
  API_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(6000),
  /** Seconds the in-memory cache may serve current data without a NOTIFY. Safety net only. */
  CACHE_TTL_SECONDS: z.coerce.number().positive().default(10),
  /** Bearer token for the private visitor stats; without it the stats route does not exist. */
  STATS_TOKEN: z.string().min(16).optional(),
});
export type ApiEnv = z.infer<typeof apiEnvSchema>;

export type FeatureFlags = {
  sectionsView: boolean;
  replay: boolean;
  advancedOperations: boolean;
  comparison: boolean;
};

export function featureFlagsFrom(env: ApiEnv): FeatureFlags {
  return {
    sectionsView: env.ENABLE_SECTIONS_VIEW,
    replay: env.ENABLE_REPLAY,
    advancedOperations: env.ENABLE_ADVANCED_OPERATIONS,
    comparison: env.ENABLE_COMPARISON,
  };
}

/** Parses process.env and exits with a readable message instead of a stack trace. */
export function loadEnv<T extends z.ZodType>(schema: T, source: NodeJS.ProcessEnv = process.env): z.infer<T> {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`);
    console.error(`Invalid environment:\n${lines.join('\n')}`);
    process.exit(1);
  }
  return parsed.data;
}
