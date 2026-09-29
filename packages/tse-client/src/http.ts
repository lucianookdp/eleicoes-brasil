import { createHash } from 'node:crypto';
import { ProviderNotFoundError, ProviderUnavailableError } from '@eleicoes/election-core';

export interface HttpClientOptions {
  requestsPerSecond: number;
  concurrency: number;
  timeoutMs: number;
  maxRetries: number;
  userAgent?: string;
  /** Injected for tests. */
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

export interface RequestRecord {
  url: string;
  status: number | null;
  durationMs: number;
  outcome: 'ok' | 'not-modified' | 'not-found' | 'error';
}

export type HttpResult =
  | { notModified: true }
  | { notModified: false; body: string; etag: string | null; checksum: string };

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Minimal counting semaphore. */
class Semaphore {
  private waiting: (() => void)[] = [];
  constructor(private available: number) {}
  async acquire() {
    if (this.available > 0) {
      this.available--;
      return;
    }
    await new Promise<void>((r) => this.waiting.push(r));
  }
  release() {
    const next = this.waiting.shift();
    if (next) next();
    else this.available++;
  }
}

/** Spaces requests at least 1/rps apart, globally. */
class RateLimiter {
  private nextSlot = 0;
  constructor(
    private readonly intervalMs: number,
    private readonly now: () => number,
    private readonly sleep: (ms: number) => Promise<void>,
  ) {}
  async take() {
    const t = this.now();
    const slot = Math.max(t, this.nextSlot);
    this.nextSlot = slot + this.intervalMs;
    if (slot > t) await this.sleep(slot - t);
  }
}

/**
 * Stops all traffic after repeated failures. The TSE blocks an IP for 10 minutes when it
 * exceeds the rate limit, and restarts the block on every new attempt, so a 403/429 opens the
 * circuit for the full block period instead of retrying.
 */
class CircuitBreaker {
  private failures = 0;
  private openUntil = 0;
  private cooldownMs = 15_000;
  private recent404: number[] = [];
  constructor(private readonly now: () => number) {}

  check(url: string) {
    if (this.now() < this.openUntil) {
      throw new ProviderUnavailableError(`circuit open until ${new Date(this.openUntil).toISOString()}`, url);
    }
  }
  success() {
    this.failures = 0;
    this.cooldownMs = 15_000;
  }
  failure() {
    this.failures++;
    if (this.failures >= 5) this.trip(this.cooldownMs, true);
  }
  blocked() {
    this.trip(11 * 60_000, false);
  }
  notFound() {
    const t = this.now();
    this.recent404 = this.recent404.filter((x) => t - x < 60_000);
    this.recent404.push(t);
    // Many 404s in a row can get the IP blocked; stop and let a human look.
    if (this.recent404.length > 30) {
      this.recent404 = [];
      this.trip(5 * 60_000, false);
    }
  }
  get state(): 'closed' | 'open' {
    return this.now() < this.openUntil ? 'open' : 'closed';
  }
  private trip(ms: number, escalate: boolean) {
    this.openUntil = this.now() + ms;
    this.failures = 0;
    if (escalate) this.cooldownMs = Math.min(this.cooldownMs * 2, 5 * 60_000);
  }
}

class HttpStatusError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`);
  }
}

/**
 * The only component that performs requests to the TSE. Enforces a global request rate,
 * a concurrency cap, timeouts, retries with exponential backoff + full jitter, conditional
 * requests (ETag / Last-Modified → 304) and a circuit breaker.
 */
export class TseHttpClient {
  private readonly validators = new Map<string, { etag: string | null; lastModified: string | null }>();
  private readonly semaphore: Semaphore;
  private readonly limiter: RateLimiter;
  private readonly breaker: CircuitBreaker;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly now: () => number;
  private listeners: ((r: RequestRecord) => void)[] = [];

  constructor(private readonly options: HttpClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.sleep = options.sleep ?? defaultSleep;
    this.now = options.now ?? Date.now;
    this.semaphore = new Semaphore(options.concurrency);
    this.limiter = new RateLimiter(1000 / options.requestsPerSecond, this.now, this.sleep);
    this.breaker = new CircuitBreaker(this.now);
  }

  get circuitState() {
    return this.breaker.state;
  }

  onRequest(listener: (r: RequestRecord) => void) {
    this.listeners.push(listener);
  }

  /** Forget conditional-request validators so the next poll downloads everything again. */
  resetValidators() {
    this.validators.clear();
  }

  async get(url: string, { conditional = true } = {}): Promise<HttpResult> {
    let attempt = 0;
    for (;;) {
      this.breaker.check(url);
      try {
        return await this.once(url, conditional);
      } catch (err) {
        if (err instanceof ProviderNotFoundError) throw err;
        const status = err instanceof HttpStatusError ? err.status : null;
        if (status === 403 || status === 429) {
          this.breaker.blocked();
          throw new ProviderUnavailableError(`blocked by source (HTTP ${status})`, url, status);
        }
        this.breaker.failure();
        if (attempt >= this.options.maxRetries || (status != null && status < 500 && status !== 408)) {
          throw new ProviderUnavailableError(err instanceof Error ? err.message : String(err), url, status);
        }
        const backoff = Math.min(30_000, 500 * 2 ** attempt);
        await this.sleep(Math.random() * backoff);
        attempt++;
      }
    }
  }

  private async once(url: string, conditional: boolean): Promise<HttpResult> {
    await this.semaphore.acquire();
    const started = this.now();
    let status: number | null = null;
    try {
      await this.limiter.take();
      const headers: Record<string, string> = {
        'user-agent': this.options.userAgent ?? 'eleicoes-brasil-collector/1.0',
        'accept-encoding': 'gzip, br',
      };
      const v = conditional ? this.validators.get(url) : undefined;
      if (v?.etag) headers['if-none-match'] = v.etag;
      if (v?.lastModified) headers['if-modified-since'] = v.lastModified;

      const res = await this.fetchImpl(url, { headers, signal: AbortSignal.timeout(this.options.timeoutMs) });
      status = res.status;
      if (res.status === 304) {
        this.breaker.success();
        this.emit(url, status, started, 'not-modified');
        return { notModified: true };
      }
      if (res.status === 404) {
        this.breaker.notFound();
        this.emit(url, status, started, 'not-found');
        throw new ProviderNotFoundError(url);
      }
      if (!res.ok) throw new HttpStatusError(res.status);
      const body = await res.text();
      const etag = res.headers.get('etag');
      this.validators.set(url, { etag, lastModified: res.headers.get('last-modified') });
      this.breaker.success();
      this.emit(url, status, started, 'ok');
      return { notModified: false, body, etag, checksum: createHash('sha256').update(body).digest('hex') };
    } catch (err) {
      if (!(err instanceof ProviderNotFoundError)) this.emit(url, status, started, 'error');
      throw err;
    } finally {
      this.semaphore.release();
    }
  }

  private emit(url: string, status: number | null, started: number, outcome: RequestRecord['outcome']) {
    const record = { url, status, durationMs: this.now() - started, outcome };
    for (const l of this.listeners) l(record);
  }
}
