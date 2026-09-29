import type { ServerResponse } from 'node:http';
import type { RealtimeEvent } from '@eleicoes/election-core';

/**
 * Fan-out of worker events to Server-Sent Events clients, grouped by election round.
 * Events are batched per round (at most one frame every `batchMs`) and de-duplicated by
 * type + area, so one collector cycle becomes one small frame per client, not dozens.
 */
export class RealtimeHub {
  private clients = new Map<string, Set<ServerResponse>>();
  private pending = new Map<
    string,
    { version: number; events: Map<string, RealtimeEvent>; timer: NodeJS.Timeout }
  >();
  private heartbeat: NodeJS.Timeout;

  constructor(
    private readonly maxClients = 10_000,
    private readonly batchMs = 500,
  ) {
    // Comments keep proxies from closing idle connections.
    this.heartbeat = setInterval(() => this.writeAll(': ping\n\n'), 25_000);
    this.heartbeat.unref();
  }

  get size() {
    let n = 0;
    for (const set of this.clients.values()) n += set.size;
    return n;
  }

  add(round: string, res: ServerResponse): boolean {
    if (this.size >= this.maxClients) return false;
    let set = this.clients.get(round);
    if (!set) {
      set = new Set();
      this.clients.set(round, set);
    }
    set.add(res);
    res.on('close', () => set.delete(res));
    return true;
  }

  broadcast(event: RealtimeEvent, version: number) {
    const round = event.electionId;
    if (!this.clients.get(round)?.size) return;
    let batch = this.pending.get(round);
    if (!batch) {
      batch = { version, events: new Map(), timer: setTimeout(() => this.flush(round), this.batchMs) };
      this.pending.set(round, batch);
    }
    batch.version = Math.max(batch.version, version);
    batch.events.set(`${event.type}|${event.areaKey ?? event.state ?? ''}|${event.officeCode ?? ''}`, event);
  }

  private flush(round: string) {
    const batch = this.pending.get(round);
    this.pending.delete(round);
    const set = this.clients.get(round);
    if (!batch || !set) return;
    const frame = `event: batch\ndata: ${JSON.stringify({ version: batch.version, events: [...batch.events.values()] })}\n\n`;
    for (const res of set) res.write(frame);
  }

  close() {
    clearInterval(this.heartbeat);
    for (const b of this.pending.values()) clearTimeout(b.timer);
    for (const set of this.clients.values()) for (const res of set) res.end();
    this.clients.clear();
  }

  private writeAll(frame: string) {
    for (const set of this.clients.values()) for (const res of set) res.write(frame);
  }
}
