import { createHash } from 'node:crypto';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

/**
 * A response ready to send: serialised once, compressed at most once per encoding, with an
 * ETag. Thousands of readers asking for the same data after an update cost one database query,
 * one JSON.stringify and one compression, not one per reader.
 */
export class CachedBody {
  readonly body: Buffer;
  readonly etag: string;
  private br?: Buffer;
  private gzip?: Buffer;

  constructor(value: unknown) {
    this.body = Buffer.from(JSON.stringify(value));
    this.etag = `"${createHash('sha1').update(this.body).digest('base64url')}"`;
  }

  /** Picks the best encoding the client accepts. Small bodies are not worth compressing. */
  encoded(acceptEncoding: string | undefined): { data: Buffer; encoding: 'br' | 'gzip' | null } {
    if (this.body.length < 1024 || !acceptEncoding) return { data: this.body, encoding: null };
    if (/\bbr\b/.test(acceptEncoding)) {
      this.br ??= brotliCompressSync(this.body, { params: { [constants.BROTLI_PARAM_QUALITY]: 5 } });
      return { data: this.br, encoding: 'br' };
    }
    if (/\bgzip\b/.test(acceptEncoding)) {
      this.gzip ??= gzipSync(this.body, { level: 6 });
      return { data: this.gzip, encoding: 'gzip' };
    }
    return { data: this.body, encoding: null };
  }
}

/**
 * Per-process response cache. Entries are keyed by round, so a NOTIFY from the worker drops
 * exactly the rounds that changed. The TTL is only a safety net for missed notifications.
 */
export class ResponseCache {
  private entries = new Map<string, { expires: number; value: Promise<CachedBody> }>();

  constructor(private readonly ttlMs: number) {}

  get(round: string, key: string, load: () => Promise<unknown>): Promise<CachedBody> {
    const k = `${round}\u0000${key}`;
    const hit = this.entries.get(k);
    if (hit && hit.expires > Date.now()) return hit.value;
    // Store the promise so concurrent requests share one database round-trip.
    const value = load().then((v) => new CachedBody(v));
    this.entries.set(k, { expires: Date.now() + this.ttlMs, value });
    value.catch(() => this.entries.delete(k));
    if (this.entries.size > 5000) this.prune();
    return value;
  }

  invalidate(round?: string) {
    if (!round) {
      this.entries.clear();
      return;
    }
    const prefix = `${round}\u0000`;
    for (const k of this.entries.keys()) if (k.startsWith(prefix)) this.entries.delete(k);
  }

  private prune() {
    const now = Date.now();
    for (const [k, v] of this.entries) if (v.expires <= now) this.entries.delete(k);
  }
}
