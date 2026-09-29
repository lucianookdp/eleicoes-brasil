/**
 * Per-process response cache. Entries are keyed by round, so a NOTIFY from the worker drops
 * exactly the rounds that changed. The TTL is only a safety net for missed notifications.
 */
export class ResponseCache {
  private entries = new Map<string, { expires: number; value: Promise<unknown> }>();

  constructor(private readonly ttlMs: number) {}

  async get<T>(round: string, key: string, load: () => Promise<T>): Promise<T> {
    const k = `${round}\u0000${key}`;
    const hit = this.entries.get(k);
    if (hit && hit.expires > Date.now()) return hit.value as Promise<T>;
    // Store the promise so concurrent requests share one database round-trip.
    const value = load();
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
