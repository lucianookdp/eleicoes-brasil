import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { type Clock, DemoFiles } from './files';
import { DemoModel } from './model';

/**
 * Local stand-in for resultados.tse.jus.br serving a FICTITIOUS election in the official file
 * format, so the real collector and adapter run end to end without the TSE. Counting starts
 * `waitSeconds` after boot and reaches 100% after `durationMinutes`. Files change every
 * `tickSeconds` and support ETag / If-None-Match → 304 like the TSE CDN.
 */
export interface DemoServerOptions {
  port: number;
  durationMinutes: number;
  waitSeconds?: number;
  tickSeconds?: number;
  /** Probability of answering 503, to exercise retries and the "degraded" state. */
  errorRate?: number;
  /** Start as if counting began this many minutes ago (useful for screenshots and tests). */
  offsetMinutes?: number;
}

const ENV = 'demo';

export function startDemoServer(options: DemoServerOptions) {
  const model = new DemoModel();
  const { pleito } = model.fixture;
  const tickMs = (options.tickSeconds ?? 10) * 1000;
  const durationMs = options.durationMinutes * 60_000;
  const start = Date.now() + (options.waitSeconds ?? 20) * 1000 - (options.offsetMinutes ?? 0) * 60_000;

  const clock = (): Clock => {
    const elapsed = Date.now() - start;
    const tick = Math.max(0, Math.floor(elapsed / tickMs));
    const f = elapsed < 0 ? 0 : Math.min(1, (tick * tickMs) / durationMs);
    return {
      f,
      now: elapsed < 0 ? Date.now() : start + tick * tickMs,
      start,
      durationMs,
      tick: elapsed < 0 ? -1 : tick,
    };
  };
  const files = new DemoFiles(model, clock);

  let cacheTick = Number.NaN;
  const cache = new Map<string, string | null>();

  const route = (path: string): unknown | null => {
    if (path === `/${ENV}/comum/config/ele-c.json`) return files.electionConfig();
    if (/^\/demo\/ele2026\/\d+\/config\/mun-e\d{6}-cm\.json$/.test(path)) return files.cityConfig();
    const dir = /^\/demo\/ele2026\/(\d+)\/dados\/([a-z]{2})\/(.+)$/.exec(path);
    if (!dir) return null;
    const [, ele, dirUf, file] = dir as unknown as [string, string, string, string];
    const ab = /^([a-z]{2})-e(\d{6})-ab\.json$/.exec(file);
    if (ab) {
      if (Number(ab[2]) !== Number(ele) || ab[1] !== dirUf) return null;
      return ab[1] === 'br' ? files.countryProgress(ele) : files.stateProgress(ele, ab[1]!);
    }
    const u = /^([a-z]{2})(\d{5})?-c(\d{4})-e(\d{6})-u\.json$/.exec(file);
    if (u) {
      if (Number(u[4]) !== Number(ele) || u[1] !== dirUf) return null;
      return files.result(ele, u[3]!, { uf: u[1] === 'br' ? null : u[1]!, city: u[2] ?? null });
    }
    return null;
  };

  const server = createServer((req, res) => {
    const path = (req.url ?? '/').split('?')[0]!;
    if (options.errorRate && Math.random() < options.errorRate) {
      res.writeHead(503).end('temporarily unavailable');
      return;
    }
    const c = clock();
    if (c.tick !== cacheTick) {
      cache.clear();
      cacheTick = c.tick;
    }
    const isConfig = path.includes('/config/');
    const etag = isConfig ? `"cfg-${pleito}"` : `"t${c.tick}"`;
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, { etag }).end();
      return;
    }
    let body = cache.get(path);
    if (body === undefined) {
      const data = route(path);
      body = data == null ? null : JSON.stringify(data);
      cache.set(path, body);
    }
    // A little latency so the operations dashboard has something to show.
    const delay = 15 + Math.random() * 60;
    setTimeout(() => {
      if (body == null) res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
      else
        res
          .writeHead(200, {
            'content-type': 'application/json; charset=utf-8',
            etag,
            'cache-control': 'no-cache',
          })
          .end(body);
    }, delay);
  });
  server.listen(options.port);
  return { server, model, clock, close: () => new Promise<void>((r) => server.close(() => r())) };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const port = Number(process.env.DEMO_TSE_PORT ?? 4010);
  const durationMinutes = Number(process.env.DEMO_DURATION_MINUTES ?? 30);
  startDemoServer({
    port,
    durationMinutes,
    waitSeconds: Number(process.env.DEMO_WAIT_SECONDS ?? 20),
    offsetMinutes: Number(process.env.DEMO_OFFSET_MINUTES ?? 0),
    errorRate: Number(process.env.DEMO_ERROR_RATE ?? 0),
  });
  console.log(
    `Demo TSE server (fictitious data) on http://localhost:${port}/${ENV} — full count in ${durationMinutes} min`,
  );
}
