import { APP_NAME, APP_VERSION, type ApiEnv, featureFlagsFrom } from '@eleicoes/config';
import type { Sql } from '@eleicoes/database';
import { type ApiMeta, DEFAULT_TIMEZONE, isStateCode } from '@eleicoes/election-core';
import { ADAPTER_VERSIONS } from '@eleicoes/tse-client';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyReply, type FastifyServerOptions } from 'fastify';
import { ZodError, z } from 'zod';
import { ResponseCache } from './cache';
import { NotFoundError, Queries } from './queries';
import { RealtimeHub } from './realtime';

export interface AppDeps {
  sql: Sql;
  env: ApiEnv;
  logger?: FastifyServerOptions['logger'];
}

const slug = z.string().regex(/^[a-z0-9-]{1,40}$/);
const uf = z
  .string()
  .transform((s) => s.toUpperCase())
  .refine(isStateCode, 'unknown state');
const cityCode = z.string().regex(/^\d{5}$/);

const roundParams = z.object({ id: slug });
const stateParams = roundParams.extend({ uf });
const cityParams = stateParams.extend({ city: cityCode });
const limitQuery = z.coerce.number().int().min(1).max(3000).optional();

export async function buildApp({ sql, env, logger = true }: AppDeps) {
  const app = Fastify({
    logger,
    trustProxy: true,
    // Our ids are short; anything long is not a legitimate request.
    routerOptions: { maxParamLength: 60 },
    bodyLimit: 1024,
  });
  const queries = new Queries(sql);
  const cache = new ResponseCache(env.CACHE_TTL_SECONDS * 1000);
  const hub = new RealtimeHub();

  await app.register(helmet, {
    // JSON API: nothing to render, nothing to load.
    contentSecurityPolicy: {
      useDefaults: false,
      directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });
  await app.register(cors, {
    origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
    methods: ['GET', 'HEAD', 'OPTIONS'],
  });
  await app.register(rateLimit, {
    max: env.API_RATE_LIMIT_PER_MINUTE,
    timeWindow: '1 minute',
    allowList: (req) => req.url === '/api/health',
  });

  app.setErrorHandler(async (err, req, reply) => {
    if (err instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: 'invalid_request',
          message: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        },
      });
    }
    if (err instanceof NotFoundError)
      return reply.status(404).send({ error: { code: 'not_found', message: err.message } });
    const status = (err as { statusCode?: number }).statusCode;
    if (status && status < 500)
      return reply.status(status).send({ error: { code: 'request_error', message: (err as Error).message } });
    req.log.error({ err }, 'unhandled error');
    return reply.status(500).send({ error: { code: 'internal', message: 'Internal error' } });
  });
  app.setNotFoundHandler(async (_req, reply) =>
    reply.status(404).send({ error: { code: 'not_found', message: 'Route not found' } }),
  );

  const live = (reply: FastifyReply) =>
    reply.header('cache-control', 'public, max-age=5, stale-while-revalidate=30');
  const cached = <T>(round: string, key: string, load: () => Promise<T>) => cache.get(round, key, load);

  app.get('/api/health', async () => {
    await sql`select 1`;
    return { status: 'ok', version: APP_VERSION, adapters: ADAPTER_VERSIONS, realtimeClients: hub.size };
  });

  app.get('/api/meta', async (_req, reply) => {
    reply.header('cache-control', 'public, max-age=300');
    const meta: ApiMeta = {
      app: { name: APP_NAME, version: APP_VERSION },
      adapters: ADAPTER_VERSIONS,
      features: featureFlagsFrom(env),
      timezone: DEFAULT_TIMEZONE,
      source: 'Tribunal Superior Eleitoral — TSE',
    };
    return meta;
  });

  app.get('/api/elections', async (_req, reply) => {
    reply.header('cache-control', 'public, max-age=15');
    return cached('*', 'elections', () => queries.listElections());
  });

  app.get('/api/elections/:id', async (req, reply) => {
    const { id } = roundParams.parse(req.params);
    live(reply);
    return cached(id, 'round', async () => {
      const { id: _internal, offices, ...round } = await queries.round(id);
      return { ...round, offices: offices.map(({ id: _o, ...o }) => o) };
    });
  });

  app.get('/api/elections/:id/overview', async (req, reply) => {
    const { id } = roundParams.parse(req.params);
    live(reply);
    return cached(id, 'overview', () => queries.overview(id));
  });

  app.get('/api/elections/:id/results', async (req, reply) => {
    const { id } = roundParams.parse(req.params);
    const q = z
      .object({
        office: slug.optional(),
        area: z
          .string()
          .regex(/^[a-z0-9-]{2,20}$/)
          .default('br'),
        limit: limitQuery,
      })
      .parse(req.query);
    live(reply);
    const result = await cached(id, `results:${q.office}:${q.area}:${q.limit}`, () =>
      queries.result(id, q.office, q.area, q.limit ?? null),
    );
    if (!result) throw new NotFoundError('no results yet for this office and area');
    return result;
  });

  app.get('/api/elections/:id/states', async (req, reply) => {
    const { id } = roundParams.parse(req.params);
    live(reply);
    return cached(id, 'states', () => queries.states(id));
  });

  app.get('/api/elections/:id/states/:uf', async (req, reply) => {
    const p = stateParams.parse(req.params);
    live(reply);
    return cached(p.id, `state:${p.uf}`, () => queries.state(p.id, p.uf));
  });

  app.get('/api/elections/:id/states/:uf/results', async (req, reply) => {
    const p = stateParams.parse(req.params);
    const q = z.object({ office: slug.optional(), limit: limitQuery }).parse(req.query);
    live(reply);
    const result = await cached(p.id, `results:${q.office}:${p.uf}:${q.limit}`, () =>
      queries.result(p.id, q.office, p.uf.toLowerCase(), q.limit ?? null),
    );
    if (!result) throw new NotFoundError('no results yet for this office and state');
    return result;
  });

  app.get('/api/elections/:id/states/:uf/cities', async (req, reply) => {
    const p = stateParams.parse(req.params);
    const q = z
      .object({
        q: z.string().trim().max(60).optional(),
        sort: z
          .enum(['default', 'name', 'counted-desc', 'counted-asc', 'turnout', 'updated'])
          .default('default'),
        page: z.coerce.number().int().min(1).max(10_000).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(30),
      })
      .parse(req.query);
    live(reply);
    return cached(p.id, `cities:${p.uf}:${JSON.stringify(q)}`, () => queries.cities(p.id, p.uf, q));
  });

  app.get('/api/elections/:id/states/:uf/cities/:city', async (req, reply) => {
    const p = cityParams.parse(req.params);
    live(reply);
    return cached(p.id, `city:${p.uf}:${p.city}`, () => queries.city(p.id, p.uf, p.city));
  });

  app.get('/api/elections/:id/timeline', async (req, reply) => {
    const { id } = roundParams.parse(req.params);
    const q = z.object({ at: z.iso.datetime({ offset: true }).optional() }).parse(req.query);
    live(reply);
    if (q.at) {
      const at = new Date(q.at).toISOString();
      return cached(id, `timeline-at:${at}`, () => queries.timelineAt(id, at));
    }
    return cached(id, 'timeline', () => queries.timeline(id));
  });

  app.get('/api/elections/:id/series', async (req, reply) => {
    const { id } = roundParams.parse(req.params);
    const q = z
      .object({
        office: slug,
        area: z
          .string()
          .regex(/^[a-z0-9-]{2,20}$/)
          .default('br'),
      })
      .parse(req.query);
    live(reply);
    return cached(id, `series:${q.office}:${q.area}`, () => queries.series(id, q.office, q.area));
  });

  app.get('/api/elections/:id/operations', async (req, reply) => {
    const { id } = roundParams.parse(req.params);
    reply.header('cache-control', 'no-cache');
    return cached(id, 'operations', () => queries.operations(id));
  });

  app.get('/api/elections/:id/events', async (req, reply) => {
    const { id } = roundParams.parse(req.params);
    const q = z
      .object({
        limit: z.coerce.number().int().min(1).max(200).default(50),
        before: z.coerce.number().int().positive().optional(),
      })
      .parse(req.query);
    reply.header('cache-control', 'no-cache');
    return cached(id, `events:${q.limit}:${q.before}`, () => queries.events(id, q.limit, q.before));
  });

  app.get('/api/elections/:id/search', async (req, reply) => {
    const { id } = roundParams.parse(req.params);
    const q = z.object({ q: z.string().trim().min(1).max(60) }).parse(req.query);
    reply.header('cache-control', 'public, max-age=30');
    return cached(id, `search:${q.q.toLowerCase()}`, () => queries.search(id, q.q));
  });

  app.get('/api/elections/:id/compare', async (req, reply) => {
    const { id } = roundParams.parse(req.params);
    const q = z
      .object({
        states: z
          .string()
          .transform((s) => [...new Set(s.split(',').map((x) => x.trim().toUpperCase()))])
          .pipe(z.array(z.string().refine(isStateCode, 'unknown state')).min(1).max(8)),
        office: slug.optional(),
      })
      .parse(req.query);
    live(reply);
    return cached(id, `compare:${q.states.join(',')}:${q.office}`, () =>
      queries.compare(id, q.states, q.office),
    );
  });

  // Server-Sent Events. One long-lived response per browser tab.
  app.get('/api/realtime/elections/:id', async (req, reply) => {
    const { id } = roundParams.parse(req.params);
    await queries.round(id);
    const res = reply.raw;
    reply.hijack();
    res.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
      'access-control-allow-origin': (reply.getHeader('access-control-allow-origin') as string) ?? '',
    });
    if (!hub.add(id, res)) {
      res.end('retry: 30000\n\n');
      return;
    }
    res.write(`retry: 5000\nevent: ready\ndata: {"electionId":"${id}"}\n\n`);
  });

  /** Called for each NOTIFY from the worker. */
  const onEvent = (payload: string) => {
    try {
      const event = JSON.parse(payload);
      if (typeof event?.electionId !== 'string') return;
      cache.invalidate(event.electionId);
      cache.invalidate('*');
      hub.broadcast(event);
    } catch (err) {
      app.log.warn({ err }, 'ignoring malformed event');
    }
  };

  app.addHook('onClose', async () => hub.close());
  return { app, onEvent, hub };
}
